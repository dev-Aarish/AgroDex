import express from "express";
import { analyzeImage, summarizeProvenance, buyerQA, translateMarketing, priceSuggestion } from "../ai/gemini.js";
import { supabase } from "../db.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, error: "Validation failed", details: errors.array().map((e) => ({ field: e.path, message: e.msg })) });
  }
  next();
};

router.post("/analyze-image", aiLimiter, [
  body("photoUrl").trim().notEmpty().withMessage("photoUrl is required").isURL().withMessage("photoUrl must be a valid URL"),
  body("batchId").optional().trim().isUUID().withMessage("batchId must be a valid UUID"),
  validate,
], async (req, res) => {
  try {
    const { photoUrl, batchId } = req.body;
    const result = await analyzeImage(photoUrl);
    if (batchId && !result.error) {
      const { error: dbError } = await supabase.from("batches").update({ ai_analysis: { caption: result.caption, anomalies: result.anomalies, confidence: result.confidence, tags: result.tags, generatedAt: new Date().toISOString(), ms: result.ms } }).eq("id", batchId);
      if (dbError) console.error("Failed to cache AI analysis:", dbError);
    }
    res.json({ ok: true, data: result });
  } catch (error) {
    console.error("AI analyze-image error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/summarize-provenance", aiLimiter, [
  body("hcsTimeline").isArray({ min: 1 }).withMessage("hcsTimeline must be a non-empty array"),
  body("tokenId").optional().trim(),
  body("serial").optional().trim(),
  validate,
], async (req, res) => {
  try {
    const { hcsTimeline, tokenId, serial } = req.body;
    const result = await summarizeProvenance(hcsTimeline);
    if (tokenId && serial && !result.error) {
      const { error: dbError } = await supabase.from("verifications").update({ trace: { ai: { summary_en: result.summary_en, summary_fr: result.summary_fr, timeline: result.timeline, trustScore: result.trustScore, trustExplanation: result.trustExplanation, generatedAt: new Date().toISOString(), ms: result.ms } } }).eq("token_id", tokenId).eq("serial_number", serial);
      if (dbError) console.error("Failed to cache provenance summary:", dbError);
    }
    res.json({ ok: true, data: result });
  } catch (error) {
    console.error("AI summarize-provenance error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/buyer-qa", aiLimiter, [
  body("question").trim().notEmpty().withMessage("question is required").isLength({ max: 500 }).withMessage("question must be under 500 characters").escape(),
  body("hcsTimeline").isArray({ min: 1 }).withMessage("hcsTimeline must be a non-empty array"),
  validate,
], async (req, res) => {
  try {
    const { question, hcsTimeline } = req.body;
    const result = await buyerQA(question, hcsTimeline);
    res.json({ ok: true, data: result });
  } catch (error) {
    console.error("AI buyer-qa error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/translate-marketing", aiLimiter, [
  body("summary_en").trim().notEmpty().withMessage("summary_en is required").isLength({ max: 2000 }).withMessage("summary_en must be under 2000 characters"),
  validate,
], async (req, res) => {
  try {
    const { summary_en } = req.body;
    const result = await translateMarketing(summary_en);
    res.json({ ok: true, data: result });
  } catch (error) {
    console.error("AI translate-marketing error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/price-suggestion", aiLimiter, [
  body("commodity").trim().notEmpty().withMessage("commodity is required").isLength({ max: 100 }).withMessage("commodity must be under 100 characters").escape(),
  body("region").optional().trim().isLength({ max: 100 }).escape(),
  body("qualityTags").optional().isArray().withMessage("qualityTags must be an array"),
  body("trustScore").optional().isFloat({ min: 0, max: 100 }).withMessage("trustScore must be between 0 and 100"),
  validate,
], async (req, res) => {
  try {
    const { commodity, region, qualityTags, trustScore } = req.body;
    const result = await priceSuggestion({ commodity, region: region || "unknown", qualityTags: qualityTags || [], trustScore: trustScore || 0 });
    res.json({ ok: true, data: result });
  } catch (error) {
    console.error("AI price-suggestion error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
