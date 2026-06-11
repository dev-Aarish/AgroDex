import express from "express";
import axios from "axios";
import QRCode from "qrcode";
import { submitBatchData, fetchHCSMessage } from "../hcs.js";
import { createBatchNFT, fetchNFTMetadata } from "../hts.js";
import { analyzeBatch } from "../ai.js";
import { insertBatch, insertToken, upsertVerification, getVerification, getToken } from "../db.js";
import { env } from "../utils/config.js";
import { requireAuth } from "../middleware/auth.js";
import { analyzeImage, summarizeProvenance, dashboardInsight, healthCheck as geminiHealthCheck } from "../ai/gemini.js";
import { supabase } from "../db.js";
import { strictLimiter } from "../middleware/rateLimiter.js";
import { validateRegisterBatch, validateTokenizeBatch, validateVerifyBatch } from "../middleware/validators.js";

const router = express.Router();

router.get("/dashboard-stats", requireAuth, async (_req, res) => {
  try {
    const [batchCountResult, tokenCountResult, verificationCountResult, aiVerifiedCountResult, approvedLotsResult, flaggedLotsResult] = await Promise.all([
      supabase.from("batches").select("*", { head: true, count: "exact" }),
      supabase.from("tokens").select("*", { head: true, count: "exact" }),
      supabase.from("verifications").select("*", { head: true, count: "exact" }),
      supabase.from("verifications").select("*", { head: true, count: "exact" }).not("trace->ai", "is", null).gte("trace->ai->>trustScore", "80"),
      supabase.from("verifications").select("token_id, serial_number, trace, created_at").not("trace->ai", "is", null).gte("trace->ai->>trustScore", "80").order("created_at", { ascending: false }).limit(5),
      supabase.from("verifications").select("token_id, serial_number, trace, created_at").not("trace->ai", "is", null).lt("trace->ai->>trustScore", "80").order("created_at", { ascending: false }).limit(5),
    ]);
    const results = [batchCountResult, tokenCountResult, verificationCountResult, aiVerifiedCountResult, approvedLotsResult, flaggedLotsResult];
    for (const result of results) {
      if (result.error) throw result.error;
    }
    const totalBatches = batchCountResult.count || 0;
    const totalNfts = tokenCountResult.count || 0;
    const totalVerifications = verificationCountResult.count || 0;
    const aiVerified = aiVerifiedCountResult.count || 0;
    const approvedLots = (approvedLotsResult.data || []).map((item) => {
      const ai = item.trace?.ai || {};
      return { token_id: item.token_id, serial_number: item.serial_number, score: Number(ai.trustScore ?? 0), trustExplanation: ai.trustExplanation || null, verified_at: item.created_at };
    });
    const flaggedLots = (flaggedLotsResult.data || []).map((item) => {
      const ai = item.trace?.ai || {};
      return { token_id: item.token_id, serial_number: item.serial_number, score: Number(ai.trustScore ?? 0), rationale: ai.trustExplanation || "Manual review recommended", verified_at: item.created_at };
    });
    const statsForAI = {
      totalBatches, totalNfts, totalVerifications, aiVerified,
      approvedLots: approvedLots.map(({ token_id, serial_number, score }) => ({ token_id, serial_number, score })),
      flaggedLots: flaggedLots.map(({ token_id, serial_number, score }) => ({ token_id, serial_number, score })),
      flaggedRatio: totalVerifications > 0 ? Number((flaggedLots.length / totalVerifications).toFixed(2)) : 0,
      generatedAt: new Date().toISOString(),
    };
    const insight = await dashboardInsight(statsForAI);
    res.json({
      ok: true,
      generatedAt: statsForAI.generatedAt,
      kpis: { totalBatches, totalNfts, totalVerifications, aiVerified },
      audit: { approvedLots, flaggedLots },
      aiInsight: { insight_en: insight.insight_en, insight_fr: insight.insight_fr, ms: insight.ms, error: insight.error || null },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch dashboard statistics", details: error.message });
  }
});

router.get("/dashboard-health", requireAuth, async (_req, res) => {
  const supabaseStatus = { ok: false, ms: 0 };
  const hederaStatus = { ok: false, ms: 0 };
  const geminiStatus = { ok: false, ms: 0 };
  const supabaseStart = Date.now();
  try {
    const { error } = await supabase.from("batches").select("id", { head: true, count: "exact" });
    supabaseStatus.ms = Date.now() - supabaseStart;
    if (error) throw error;
    supabaseStatus.ok = true;
  } catch (error) {
    supabaseStatus.ms = Date.now() - supabaseStart;
    supabaseStatus.error = error.message || "Supabase unreachable";
  }
  const hederaStart = Date.now();
  try {
    await axios.get(`${env.MIRROR_NODE_URL}/api/v1/topics/${env.HEDERA_TOPIC_ID}`, { timeout: 5000 });
    hederaStatus.ok = true;
    hederaStatus.ms = Date.now() - hederaStart;
  } catch (error) {
    hederaStatus.ms = Date.now() - hederaStart;
    hederaStatus.error = error.response?.data?.message || error.message || "Mirror node unreachable";
  }
  try {
    const geminiResult = await geminiHealthCheck();
    geminiStatus.ok = geminiResult.ok;
    geminiStatus.ms = geminiResult.ms;
    if (geminiResult.model) geminiStatus.model = geminiResult.model;
    if (!geminiResult.ok && geminiResult.error) geminiStatus.error = geminiResult.error;
  } catch (error) {
    geminiStatus.error = error.message || "Gemini health check failed";
  }
  const status = { supabase: supabaseStatus, hedera: hederaStatus, gemini: geminiStatus };
  const ok = Object.values(status).every((service) => service.ok);
  res.status(ok ? 200 : 503).json({ ok, status, timestamp: new Date().toISOString() });
});

router.post("/register-batch", requireAuth, strictLimiter, validateRegisterBatch, async (req, res) => {
  try {
    const { batchName, location, photoUrl } = req.body;
    if (!batchName || !location || !photoUrl) {
      return res.status(400).json({ error: "Missing required fields: batchName, location, photoUrl" });
    }
    let aiAnalysis = null;
    try {
      const geminiResult = await analyzeImage(photoUrl);
      if (!geminiResult.error) {
        aiAnalysis = { caption: geminiResult.caption, anomalies: geminiResult.anomalies, confidence: geminiResult.confidence, tags: geminiResult.tags, generatedAt: new Date().toISOString(), ms: geminiResult.ms };
      }
    } catch (error) {
      console.warn("AI analysis failed, continuing without it:", error.message);
    }
    const hcsResult = await submitBatchData({ batchName, location, photoUrl, aiAnalysis });
    const batchRecord = await insertBatch({ batch_name: batchName, location, photo_url: photoUrl, hcs_tx_id: hcsResult.transactionId, ai_analysis: aiAnalysis });
    res.json({ success: true, hcsTransactionId: hcsResult.transactionId, batchId: batchRecord.id, ai_analysis: aiAnalysis, message: "Batch registered successfully on Hedera HCS" });
  } catch (error) {
    console.error("Register batch error:", error);
    const errorMessage = error?.message || String(error);
    let hint;
    if (errorMessage.includes("Invalid API key")) hint = "Backend is not receiving SUPABASE_SERVICE_ROLE_KEY. Set it in deployment env and restart.";
    else if (errorMessage.includes("Database insert failed")) hint = "Check database schema and RLS policies.";
    else if (error?.code === "42P01") hint = "Missing database table. Run the schema migration SQL first.";
    res.status(500).json({ ok: false, error: errorMessage, hint, details: error?.details || null, code: error?.code || null });
  }
});

router.post("/tokenize-batch", requireAuth, strictLimiter, validateTokenizeBatch, async (req, res) => {
  try {
    const { hcsTransactionIds, batchId } = req.body;
    if (!hcsTransactionIds || !Array.isArray(hcsTransactionIds) || hcsTransactionIds.length === 0) {
      return res.status(400).json({ error: "hcsTransactionIds must be a non-empty array" });
    }
    let hcsTimeline = [];
    let aiSummary = null;
    try {
      hcsTimeline = hcsTransactionIds.map((txId, idx) => ({ timestamp: new Date().toISOString(), event: `Event ${idx + 1}`, txId, location: "Unknown", operator: req.user?.accountId || "Unknown" }));
      const summaryResult = await summarizeProvenance(hcsTimeline);
      if (!summaryResult.error) {
        aiSummary = { summary_en: summaryResult.summary_en, summary_fr: summaryResult.summary_fr, timeline: summaryResult.timeline, trustScore: summaryResult.trustScore, trustExplanation: summaryResult.trustExplanation, generatedAt: new Date().toISOString(), ms: summaryResult.ms };
      }
    } catch (error) {
      console.warn("AI provenance summary failed:", error.message);
    }
    const nftResult = await createBatchNFT(hcsTransactionIds);

    // Look up existing batch
    let batchRecord = null;
    if (batchId) {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .eq("id", batchId)
        .single();
      if (!error && data) {
        batchRecord = data;
      }
    } else {
      // Try lookup by transaction ID
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .in("hcs_tx_id", hcsTransactionIds)
        .limit(1);
      if (!error && data && data.length > 0) {
        batchRecord = data[0];
      }
    }

    if (batchRecord) {
      // Update existing batch
      const { data, error } = await supabase
        .from("batches")
        .update({
          hedera_token_id: nftResult.tokenId,
          hedera_serial_number: nftResult.serialNumber,
          tokenized_at: new Date().toISOString(),
          hcs_transaction_ids: hcsTransactionIds,
          ai_provenance_summary: aiSummary ? JSON.stringify(aiSummary) : null
        })
        .eq("id", batchRecord.id)
        .select()
        .single();
      if (error) throw new Error(`Database update failed: ${error.message}`);
      batchRecord = data;
    } else {
      // Fallback: insert new batch
      batchRecord = await insertBatch({
        hedera_token_id: nftResult.tokenId,
        hedera_serial_number: nftResult.serialNumber,
        hcs_transaction_ids: hcsTransactionIds,
        batch_name: `Tokenized Batch - ${new Date().toLocaleDateString()}`,
        product_type: 'Unknown',
        location: 'Unknown',
        photo_url: '',
        hcs_tx_id: hcsTransactionIds[0] || '',
        ai_provenance_summary: aiSummary ? JSON.stringify(aiSummary) : null
      });
    }

    const tokenRecord = await insertToken({ token_id: nftResult.tokenId, serial_number: nftResult.serialNumber, hcs_tx_ids: hcsTransactionIds });
    
    if (aiSummary) {
      await upsertVerification({ token_id: nftResult.tokenId, serial_number: nftResult.serialNumber, trace: { ai: aiSummary, hcsTimeline } });
    }

    res.json({
      success: true,
      tokenId: nftResult.tokenId,
      serialNumber: nftResult.serialNumber,
      batchId: batchRecord.id,
      hcsTransactionIds,
      ai_summary: aiSummary,
      message: "Batch tokenized successfully as NFT"
    });
  } catch (error) {
    console.error("Tokenize batch error:", error);
    res.status(500).json({ error: "Failed to tokenize batch", details: error.message });
  }
});

router.get("/verify-batch/:tokenId/:serialNumber", validateVerifyBatch, async (req, res) => {
  try {
    const { tokenId, serialNumber } = req.params;
    const cachedVerification = await getVerification(tokenId, serialNumber);
    if (cachedVerification && cachedVerification.trace?.ai) {
      return res.json({ success: true, cached: true, ...cachedVerification.trace, ai_summary: cachedVerification.trace.ai });
    }
    const tokenRecord = await getToken(tokenId, serialNumber);
    if (!tokenRecord) return res.status(404).json({ error: "Token not found in database" });
    const hcsTransactionIds = tokenRecord.hcs_tx_ids;
    if (!hcsTransactionIds || hcsTransactionIds.length === 0) return res.status(404).json({ error: "No HCS transaction IDs found for this token" });
    const nftMetadata = await fetchNFTMetadata(tokenId, serialNumber);
    const hcsMessages = [];
    for (const txId of hcsTransactionIds) {
      try {
        hcsMessages.push({ transactionId: txId, note: "Full HCS message retrieval requires sequence number mapping" });
      } catch (error) {
        console.warn(`Failed to fetch HCS message for ${txId}:`, error.message);
      }
    }
    let aiSummary = cachedVerification?.trace?.ai || null;
    if (!aiSummary && hcsMessages.length > 0) {
      try {
        const timeline = hcsMessages.map((msg) => ({ timestamp: new Date().toISOString(), event: msg.note || "Event", txId: msg.transactionId, location: "Unknown", operator: "Unknown" }));
        const summaryResult = await summarizeProvenance(timeline);
        if (!summaryResult.error) {
          aiSummary = { summary_en: summaryResult.summary_en, summary_fr: summaryResult.summary_fr, timeline: summaryResult.timeline, trustScore: summaryResult.trustScore, trustExplanation: summaryResult.trustExplanation, generatedAt: new Date().toISOString(), ms: summaryResult.ms };
        }
      } catch (error) {
        console.warn("AI provenance summary failed:", error.message);
      }
    }
    const trace = { tokenId, serialNumber, nftMetadata, hcsTransactionIds, hcsMessages, ai: aiSummary, verifiedAt: new Date().toISOString(), status: "verified" };
    await upsertVerification({ token_id: tokenId, serial_number: serialNumber, trace });
    res.json({ success: true, cached: false, ...trace, ai_summary: aiSummary });
  } catch (error) {
    console.error("Verify batch error:", error);
    res.status(500).json({ error: "Failed to verify batch", details: error.message });
  }
});

// GET /api/batches/:batchId
router.get("/batches/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(batchId)) {
      return res.status(400).json({ error: "Invalid batch ID format. Must be a valid UUID." });
    }

    // Fetch batch from Supabase
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .select("*")
      .eq("id", batchId)
      .single();

    if (batchError || !batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Check if soft deleted
    if (batch.deleted_at) {
      return res.status(410).json({ error: "Batch has been deleted" });
    }

    // Generate QR code if not present
    let qrCodeUrl = batch.qr_code_url;
    if (!qrCodeUrl) {
      try {
        const frontendUrl = env.FRONTEND_URL || "http://localhost:5173";
        const qrPayload = {
          batchId,
          verificationUrl: `${frontendUrl}/verify/${batchId}`
        };
        qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));
        
        // Update database with the generated QR code
        await supabase
          .from("batches")
          .update({ qr_code_url: qrCodeUrl })
          .eq("id", batchId);
        
        batch.qr_code_url = qrCodeUrl;
      } catch (qrErr) {
        console.error("Failed to generate/store QR code for batch:", qrErr.message);
      }
    }

    // Check if tokenized
    if (batch.hedera_token_id && batch.hedera_serial_number) {
      const tokenId = batch.hedera_token_id;
      const serialNumber = batch.hedera_serial_number;

      // Try to get cached verification
      const cachedVerification = await getVerification(tokenId, serialNumber);
      if (cachedVerification && cachedVerification.trace?.ai) {
        return res.json({
          success: true,
          cached: true,
          batch,
          ...cachedVerification.trace,
          ai_summary: cachedVerification.trace.ai
        });
      }

      // If not cached, retrieve and construct it
      const tokenRecord = await getToken(tokenId, serialNumber);
      const hcsTransactionIds = batch.hcs_transaction_ids || (tokenRecord ? tokenRecord.hcs_tx_ids : []) || [];
      
      let nftMetadata = null;
      try {
        nftMetadata = await fetchNFTMetadata(tokenId, serialNumber);
      } catch (nftErr) {
        console.warn(`Failed to fetch NFT metadata for token ${tokenId} serial ${serialNumber}:`, nftErr.message);
      }

      const hcsMessages = [];
      for (const txId of hcsTransactionIds) {
        hcsMessages.push({ transactionId: txId, note: "Full HCS message retrieval requires sequence number mapping" });
      }

      let aiSummary = null;
      if (batch.ai_provenance_summary) {
        try {
          aiSummary = JSON.parse(batch.ai_provenance_summary);
        } catch {
          aiSummary = { summary_en: batch.ai_provenance_summary, summary_fr: batch.ai_provenance_summary, trustScore: 70, trustExplanation: "Restored from batch provenance" };
        }
      }

      if (!aiSummary && hcsMessages.length > 0) {
        try {
          const timeline = hcsMessages.map((msg) => ({ timestamp: new Date().toISOString(), event: msg.note || "Event", txId: msg.transactionId, location: "Unknown", operator: "Unknown" }));
          const summaryResult = await summarizeProvenance(timeline);
          if (!summaryResult.error) {
            aiSummary = {
              summary_en: summaryResult.summary_en,
              summary_fr: summaryResult.summary_fr,
              timeline: summaryResult.timeline,
              trustScore: summaryResult.trustScore,
              trustExplanation: summaryResult.trustExplanation,
              generatedAt: new Date().toISOString(),
              ms: summaryResult.ms
            };
          }
        } catch (aiErr) {
          console.warn("AI provenance summary generation failed:", aiErr.message);
        }
      }

      const trace = {
        tokenId,
        serialNumber,
        nftMetadata,
        hcsTransactionIds,
        hcsMessages,
        ai: aiSummary,
        verifiedAt: new Date().toISOString(),
        status: "verified"
      };

      await upsertVerification({ token_id: tokenId, serial_number: serialNumber, trace });

      return res.json({
        success: true,
        cached: false,
        batch,
        ...trace,
        ai_summary: aiSummary
      });
    } else {
      // Registered but not yet tokenized
      const hcsTransactionIds = batch.hcs_tx_id ? [batch.hcs_tx_id] : [];
      const hcsMessages = batch.hcs_tx_id ? [{ transactionId: batch.hcs_tx_id, note: "Batch registered on Hedera Consensus Service" }] : [];
      
      const aiSummary = {
        summary_en: `This Indonesian agricultural batch (${batch.product_type || batch.batch_name}) is registered on Indonesia's AgroDex ledger. It has not yet been tokenized as an NFT certificate.`,
        summary_fr: `Ce lot agricole indonésien (${batch.product_type || batch.batch_name}) est enregistré sur le registre AgroDex Indonésie. Il n'a pas encore été tokenisé sous forme de certificat NFT.`,
        trustScore: batch.ai_analysis?.confidence ? Math.round(batch.ai_analysis.confidence * 100) : 60,
        trustExplanation: batch.ai_analysis?.caption || "The batch registration proof is recorded. NFT certificate minting is pending.",
        timeline: [
          {
            timestamp: batch.created_at,
            event: "Batch Registered on HCS",
            txId: batch.hcs_tx_id
          }
        ]
      };

      return res.json({
        success: true,
        cached: true,
        batch,
        tokenId: null,
        serialNumber: null,
        nftMetadata: null,
        hcsTransactionIds,
        hcsMessages,
        ai_summary: aiSummary,
        verifiedAt: batch.created_at,
        status: "registered"
      });
    }
  } catch (error) {
    console.error("Get batch error:", error);
    res.status(500).json({ error: "Failed to fetch batch details", details: error.message });
  }
});

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "AgroDex-backend" });
});

export default router;
