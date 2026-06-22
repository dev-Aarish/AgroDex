/**
 * Gemini AI Integration Module
 * Wraps Google Generative AI SDK with timeout, retry, and structured output parsing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ANALYZE_IMAGE_PROMPT,
  ANALYZE_BATCH_PROMPT,
  SUMMARIZE_PROVENANCE_PROMPT,
  BUYER_QA_PROMPT,
  TRANSLATE_MARKETING_PROMPT,
  PRICE_SUGGESTION_PROMPT,
  PROMPT_DASHBOARD_INSIGHT,
  VERIFY_REGISTRATION_PROMPT,
  fillTemplate
} from './promptTemplates.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS || '6000', 10);

let genAI = null;
let model = null;

// Initialize Gemini client
function initGemini() {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set - AI features will return fallback responses');
    return false;
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    console.log(`✅ Gemini initialized: ${GEMINI_MODEL}`);
  }
  return true;
}

/**
 * Call Gemini with timeout and retry logic
 */
async function callWithTimeout(promptText, retries = 1) {
  const start = Date.now();
  
  if (!initGemini()) {
    return { 
      result: null, 
      ms: Date.now() - start, 
      error: 'API key not configured' 
    };
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), GEMINI_TIMEOUT_MS)
      );

      const generatePromise = model.generateContent(promptText);
      const result = await Promise.race([generatePromise, timeoutPromise]);
      
      const response = await result.response;
      const text = response.text();
      const ms = Date.now() - start;

      return { result: text, ms, error: null };
    } catch (error) {
      const ms = Date.now() - start;
      
      if (attempt < retries && error.message !== 'Timeout') {
        console.log(`Retry attempt ${attempt + 1} after error:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 300));
        continue;
      }
      
      return { result: null, ms, error: error.message };
    }
  }
}

/**
 * Parse JSON from Gemini response with fallback
 */
function parseJSON(text, fallback) {
  if (!text) return { ...fallback, ai: { error: 'No response from AI' } };
  
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (error) {
    console.error('JSON parse error:', error.message, 'Text:', text.substring(0, 200));
    return { ...fallback, ai: { error: 'Invalid JSON response' } };
  }
}

/**
 * Analyse batch registration metadata using Gemini Flash Lite.
 * Used by the Express backend's /api/register-batch route.
 * The Edge Function has its own equivalent inline implementation.
 *
 * @param {Object} params - {productType, quantity, location, harvestDate}
 * @returns {Promise<{caption, anomalies, confidence, tags, ms}>}
 */
export async function analyzeBatch({ productType, quantity, location, harvestDate }) {
  console.log(`🔍 Analysing batch metadata: ${productType} @ ${location}`);

  const fallback = {
    caption: 'Batch metadata analysis unavailable',
    anomalies: [],
    confidence: 0,
    tags: []
  };

  if (!productType || !location || !harvestDate) {
    return { ...fallback, ms: 0, error: 'Missing required batch fields' };
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = fillTemplate(ANALYZE_BATCH_PROMPT, {
      PRODUCT_TYPE: productType,
      QUANTITY: String(quantity),
      LOCATION: location,
      HARVEST_DATE: harvestDate,
      TODAY: today
    });

    const { result, ms, error } = await callWithTimeout(prompt);

    if (error) {
      return { ...fallback, ms, error };
    }

    const parsed = parseJSON(result, fallback);
    return { ...parsed, ms };
  } catch (error) {
    return { ...fallback, ms: 0, error: error.message };
  }
}

/**
 * Generate a deterministic local verification fallback when Gemini is unavailable.
 */
export function generateLocalFallbackVerification({ productName, harvestBatch, quantity, unit, location, harvestDate, metadata }) {
  const cleanQty = quantity ? String(quantity).trim() : '';
  const cleanUnit = unit ? String(unit).trim() : '';
  const qtyStr = cleanQty ? `${cleanQty} ${cleanUnit}` : '';
  
  const productSummary = `You are about to register ${qtyStr || 'an unspecified quantity of'} ${productName || 'product'} from ${location || 'an unspecified location'} under Harvest Batch ${harvestBatch || 'N/A'} harvested on ${harvestDate || 'an unspecified date'}.`;
  
  const warnings = [];
  const consistencyChecks = [];
  const notes = [];
  
  if (!productName || productName.trim().length < 3) {
    warnings.push("Product name is missing or too short");
    notes.push("Product name verification failed");
  } else {
    notes.push("Product name verified locally");
  }

  if (!harvestBatch || harvestBatch.trim() === '') {
    warnings.push("Harvest batch not specified");
    notes.push("Harvest batch missing");
  } else {
    notes.push("Harvest batch info complete");
  }

  if (!cleanQty) {
    warnings.push("Quantity not specified");
    notes.push("Quantity verification failed");
  } else {
    const parsedQty = parseFloat(cleanQty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      warnings.push("Quantity must be a positive number");
      notes.push("Quantity invalid");
    } else if (parsedQty > 1000000) {
      consistencyChecks.push("Quantity appears unusually large");
      notes.push("Quantity is unusually large");
    } else {
      notes.push("Quantity verified");
    }
  }

  if (!location || location.trim().length < 3) {
    warnings.push("Harvest location missing or too vague");
    notes.push("Location verification failed");
  } else {
    notes.push("Location provided");
  }

  if (!harvestDate) {
    warnings.push("Harvest date not specified");
    notes.push("Harvest date missing");
  } else {
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      if (harvestDate > todayISO) {
        consistencyChecks.push("Future harvest date detected");
        notes.push("Harvest date is in the future");
      } else {
        notes.push("Harvest date verified");
      }
    } catch {
      notes.push("Harvest date checked");
    }
  }

  const status = warnings.length > 0 || consistencyChecks.length > 0 ? "Review Required" : "Ready";

  return {
    productSummary,
    verificationSummary: {
      quantity: cleanQty ? `Provided: ${qtyStr}` : "Quantity not specified",
      harvestBatch: harvestBatch ? `Provided: ${harvestBatch}` : "Harvest batch not specified",
      location: location ? `Provided: ${location}` : "Location not specified",
      harvestDate: harvestDate ? `Provided: ${harvestDate}` : "Harvest date not specified"
    },
    warnings,
    consistencyChecks,
    cooperativeReadiness: {
      status,
      notes
    },
    statistics: {
      batchNumber: harvestBatch || "N/A",
      quantity: qtyStr || "N/A",
      location: location || "N/A",
      harvestDate: harvestDate || "N/A"
    },
    fallback: true,
    warningMessage: "AI verification unavailable. Manual review recommended."
  };
}

/**
 * Pre-registration AI verification using Gemini 3.1 Flash Lite.
 */
export async function verifyRegistration({ productName, harvestBatch, quantity, unit, location, harvestDate, metadata }) {
  console.log(`🔍 AI Verification for registration: ${productName} Batch ${harvestBatch}`);

  const fallback = generateLocalFallbackVerification({ productName, harvestBatch, quantity, unit, location, harvestDate, metadata });

  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = fillTemplate(VERIFY_REGISTRATION_PROMPT, {
      PRODUCT_NAME: productName || 'Not specified',
      HARVEST_BATCH: harvestBatch || 'Not specified',
      QUANTITY: quantity || 'Not specified',
      UNIT: unit || '',
      LOCATION: location || 'Not specified',
      HARVEST_DATE: harvestDate || 'Not specified',
      METADATA: metadata || 'None',
      TODAY: today
    });

    const { result, ms, error } = await callWithTimeout(prompt);

    if (error) {
      console.warn("Gemini registration verification failed, returning local fallback:", error);
      return { ...fallback, ms, error };
    }

    const parsed = parseJSON(result, fallback);
    return { ...parsed, ms, fallback: false };
  } catch (error) {
    console.warn("Exception during Gemini verification, returning local fallback:", error.message);
    return { ...fallback, ms: 0, error: error.message };
  }
}

/**
 * Analyze agricultural product image
 * @param {string} photoUrl - URL of the image to analyze
 * @returns {Promise<{caption, anomalies, confidence, tags, ms}>}
 */
export async function analyzeImage(photoUrl) {
  console.log(`🔍 Analyzing image: ${photoUrl}`);
  
  const fallback = {
    caption: 'Image analysis unavailable',
    anomalies: [],
    confidence: 0,
    tags: []
  };

  if (!photoUrl) {
    return { ...fallback, ms: 0, error: 'No photo URL provided' };
  }

  try {
    // For now, use text-only analysis (vision requires different API setup)
    const prompt = `${ANALYZE_IMAGE_PROMPT}\n\nImage URL: ${photoUrl}\n\nNote: Analyze based on URL context and filename.`;
    const { result, ms, error } = await callWithTimeout(prompt);
    
    if (error) {
      return { ...fallback, ms, error };
    }

    const parsed = parseJSON(result, fallback);
    return { ...parsed, ms };
  } catch (error) {
    return { ...fallback, ms: 0, error: error.message };
  }
}

/**
 * Summarize provenance timeline from HCS events
 * @param {Array} hcsTimeline - Array of HCS events with timestamp, event, txId, location, operator
 * @returns {Promise<{summary_en, summary_fr, timeline, trustScore, trustExplanation, ms}>}
 */
export async function summarizeProvenance(hcsTimeline) {
  console.log(`📊 Summarizing provenance for ${hcsTimeline?.length || 0} events`);
  
  const fallback = {
    summary_en: 'Provenance summary unavailable',
    summary_fr: 'Résumé de provenance indisponible',
    timeline: [],
    trustScore: null,
    trustExplanation: 'Unable to calculate trust score'
  };

  if (!hcsTimeline || hcsTimeline.length === 0) {
    return { ...fallback, ms: 0, error: 'No timeline data provided' };
  }

  try {
    const eventsJson = JSON.stringify({ events: hcsTimeline }, null, 2);
    const prompt = `${SUMMARIZE_PROVENANCE_PROMPT}\n\nTimeline data:\n${eventsJson}`;
    
    const { result, ms, error } = await callWithTimeout(prompt);
    
    if (error) {
      return { ...fallback, ms, error };
    }

    const parsed = parseJSON(result, fallback);
    return { ...parsed, ms };
  } catch (error) {
    return { ...fallback, ms: 0, error: error.message };
  }
}

/**
 * Answer buyer questions about product provenance
 * @param {string} question - Buyer's question
 * @param {Array} hcsTimeline - Timeline of HCS events
 * @returns {Promise<{answer, evidenceTxIds, ms}>}
 */
export async function buyerQA(question, hcsTimeline) {
  console.log(`💬 Buyer Q&A: "${question}"`);
  
  const fallback = {
    answer: 'Unable to answer question at this time',
    evidenceTxIds: []
  };

  if (!question || !hcsTimeline || hcsTimeline.length === 0) {
    return { ...fallback, ms: 0, error: 'Missing question or timeline data' };
  }

  try {
    const timelineJson = JSON.stringify(hcsTimeline, null, 2);
    const prompt = fillTemplate(BUYER_QA_PROMPT, {
      TIMELINE_JSON: timelineJson,
      QUESTION: question
    });
    
    const { result, ms, error } = await callWithTimeout(prompt);
    
    if (error) {
      return { ...fallback, ms, error };
    }

    const parsed = parseJSON(result, fallback);
    return { ...parsed, ms };
  } catch (error) {
    return { ...fallback, ms: 0, error: error.message };
  }
}

/**
 * Translate and create marketing content
 * @param {string} summary_en - English summary to translate
 * @returns {Promise<{summary_fr, blurb_en, blurb_fr, ms}>}
 */
export async function translateMarketing(summary_en) {
  console.log(`🌐 Translating marketing content`);
  
  const fallback = {
    summary_fr: 'Traduction non disponible',
    blurb_en: 'Premium traceable product',
    blurb_fr: 'Produit traçable premium'
  };

  if (!summary_en) {
    return { ...fallback, ms: 0, error: 'No summary provided' };
  }

  try {
    const prompt = fillTemplate(TRANSLATE_MARKETING_PROMPT, { SUMMARY_EN: summary_en });
    const { result, ms, error } = await callWithTimeout(prompt);
    
    if (error) {
      return { ...fallback, ms, error };
    }

    const parsed = parseJSON(result, fallback);
    return { ...parsed, ms };
  } catch (error) {
    return { ...fallback, ms: 0, error: error.message };
  }
}

/**
 * Suggest price uplift based on quality and traceability
 * @param {Object} params - {commodity, region, qualityTags, trustScore}
 * @returns {Promise<{upliftPct, rationale, ms}>}
 */
export async function priceSuggestion({ commodity, region, qualityTags = [], trustScore = 0 }) {
  console.log(`💰 Price suggestion for ${commodity} (trust: ${trustScore})`);
  
  const fallback = {
    upliftPct: 0,
    rationale: 'Unable to calculate price suggestion'
  };

  try {
    const inputJson = JSON.stringify({ commodity, region, qualityTags, trustScore }, null, 2);
    const prompt = `${PRICE_SUGGESTION_PROMPT}\n\nInput:\n${inputJson}`;
    
    const { result, ms, error } = await callWithTimeout(prompt);
    
    if (error) {
      return { ...fallback, ms, error };
    }

    const parsed = parseJSON(result, fallback);
    return { ...parsed, ms };
  } catch (error) {
    return { ...fallback, ms: 0, error: error.message };
  }
}

/**
 * Health check - ping Gemini with minimal request
 * @returns {Promise<{ok, model, ms, error?}>}
 */
export async function dashboardInsight(stats) {
  console.log('?? Dashboard insight generation');

  const fallback = {
    insight_en: 'AI insight unavailable. Continue onboarding lots to unlock analytics.',
    insight_fr: "Analyse IA indisponible. Ajoutez de nouveaux lots pour alimenter l'analytique."
  };

  try {
    const prompt = PROMPT_DASHBOARD_INSIGHT(stats);
    const { result, ms, error } = await callWithTimeout(prompt);

    if (error) {
      return { ...fallback, ms, error };
    }

    const parsed = parseJSON(result, fallback);
    return {
      insight_en: parsed.insight_en || fallback.insight_en,
      insight_fr: parsed.insight_fr || fallback.insight_fr,
      ms
    };
  } catch (error) {
    return { ...fallback, ms: 0, error: error.message };
  }
}

export async function healthCheck() {
  if (!GEMINI_API_KEY) {
    return { ok: false, model: GEMINI_MODEL, ms: 0, error: 'API key not configured' };
  }

  try {
    const { result, ms, error } = await callWithTimeout('Return JSON: {"pong": true}');
    
    if (error) {
      return { ok: false, model: GEMINI_MODEL, ms, error };
    }

    const parsed = parseJSON(result, { pong: false });
    return { ok: parsed.pong === true, model: GEMINI_MODEL, ms };
  } catch (error) {
    return { ok: false, model: GEMINI_MODEL, ms: 0, error: error.message };
  }
}

// Export all functions
export default {
  analyzeImage,
  summarizeProvenance,
  buyerQA,
  translateMarketing,
  priceSuggestion,
  dashboardInsight,
  healthCheck,
  verifyRegistration,
  generateLocalFallbackVerification
};
