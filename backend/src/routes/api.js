import express from "express";
import axios from "axios";
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
    const { hcsTransactionIds } = req.body;
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
    const batchRecord = await insertBatch({ hedera_token_id: nftResult.tokenId, hedera_serial_number: nftResult.serialNumber, hcs_transaction_ids: hcsTransactionIds });
    const tokenRecord = await insertToken({ token_id: nftResult.tokenId, serial_number: nftResult.serialNumber, hcs_tx_ids: hcsTransactionIds });
    if (batchRecord && tokenRecord) {
      await supabase.from("batches").update({ hedera_token_id: batchRecord.hedera_token_id, hedera_serial_number: batchRecord.hedera_serial_number }).eq("id", batchRecord.id);
    }
    if (aiSummary) {
      await upsertVerification({ token_id: nftResult.tokenId, serial_number: nftResult.serialNumber, trace: { ai: aiSummary, hcsTimeline } });
    }
    res.json({ success: true, tokenId: nftResult.tokenId, serialNumber: nftResult.serialNumber, hcsTransactionIds, ai_summary: aiSummary, message: "Batch tokenized successfully as NFT" });
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

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "AgroDex-backend" });
});

export default router;
