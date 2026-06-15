/**
 * Gemini Explainer Service
 * Uses Gemini AI to generate HUMAN-READABLE EXPLANATIONS ONLY for detected fraud signals.
 *
 * CRITICAL CONSTRAINT:
 *   - Gemini MUST NOT calculate or modify risk scores.
 *   - Gemini receives only the list of detected signal descriptions (plain text).
 *   - Gemini returns only a narrative explanation paragraph.
 *   - All scoring is done exclusively by risk-engine.service.js.
 *
 * Reuses the existing Gemini configuration from backend/src/ai/gemini.js
 * (GEMINI_API_KEY, GEMINI_MODEL, GEMINI_TIMEOUT_MS environment variables).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS || '10000', 10);

let genAI = null;
let model = null;

/**
 * Lazily initialize the Gemini client.
 * @returns {boolean} true if initialized, false if API key missing
 */
function initGemini() {
  if (!GEMINI_API_KEY) return false;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.4,
        topP: 0.85,
        topK: 40,
        maxOutputTokens: 512,
      }
    });
    console.log(`✅ Gemini Explainer initialized: ${GEMINI_MODEL}`);
  }
  return true;
}

/**
 * Build the Gemini prompt for fraud explanation.
 * Gemini is given only the signal descriptions and asked for a narrative only.
 *
 * @param {Object} context
 * @param {string} context.batchName
 * @param {string} context.location
 * @param {string} context.riskLevel
 * @param {number} context.signalCount
 * @param {Array<string>} context.signalDescriptions - Plain-text descriptions of detected signals
 * @returns {string} Prompt text
 */
function buildExplanationPrompt({ batchName, location, riskLevel, signalCount, signalDescriptions }) {
  const signalList = signalDescriptions
    .map((desc, i) => `${i + 1}. ${desc}`)
    .join('\n');

  return `You are an agricultural fraud analyst assistant for the AgroDex platform, which tracks agricultural batches on the Hedera blockchain in Indonesia.

A deterministic fraud detection system has already calculated a risk score for the following batch. Your role is ONLY to write a clear, professional explanation for a human analyst — you must NOT suggest, modify, or recalculate any scores.

BATCH CONTEXT:
- Batch Name: ${batchName}
- Location: ${location}
- Risk Level: ${riskLevel}
- Detected Fraud Signals (${signalCount} signal(s)):
${signalList}

TASK:
Write a single professional paragraph (3–5 sentences) that:
1. Summarizes the key fraud signals detected in plain language
2. Explains why these signals are concerning in the context of agricultural supply chain fraud
3. Recommends what a compliance officer should investigate next
4. Uses specific details from the signal descriptions above
5. Is factual and formal in tone, suitable for a compliance report

Return ONLY the paragraph text — no JSON, no markdown, no headers, no score references.`;
}

/**
 * Generate a fraud explanation using Gemini.
 * Gemini only narrates; it does not calculate scores.
 *
 * @param {Object} params
 * @param {string} params.batchName
 * @param {string} params.location
 * @param {string} params.riskLevel
 * @param {Array<{signal: string, description: string}>} params.triggeredSignals
 * @returns {Promise<string>} Human-readable explanation
 */
export async function generateFraudExplanation({ batchName, location, riskLevel, triggeredSignals }) {
  // If no signals triggered, return a safe default explanation
  if (!triggeredSignals || triggeredSignals.length === 0) {
    return `No fraud signals were detected for batch "${batchName}" in ${location || 'the registered location'}. The batch passed all automated checks including yield validation, lifecycle event verification, duplicate metadata detection, submission frequency analysis, NFT minting audit, and regional outlier screening. No further investigation is required at this time.`;
  }

  // Try Gemini if API key is available
  if (initGemini()) {
    try {
      const prompt = buildExplanationPrompt({
        batchName: batchName || 'Unknown Batch',
        location: location || 'Unknown Location',
        riskLevel,
        signalCount: triggeredSignals.length,
        signalDescriptions: triggeredSignals.map(s => s.description),
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), GEMINI_TIMEOUT_MS)
      );

      const generatePromise = model.generateContent(prompt);
      const result = await Promise.race([generatePromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text()?.trim();

      if (text && text.length > 50) {
        console.log(`✅ Gemini explanation generated (${text.length} chars) for batch "${batchName}"`);
        return text;
      }
    } catch (err) {
      console.warn(`⚠️  Gemini explanation failed for "${batchName}": ${err.message}. Using fallback.`);
    }
  }

  // Fallback: deterministic template explanation
  return buildFallbackExplanation({ batchName, location, riskLevel, triggeredSignals });
}

/**
 * Generate a deterministic fallback explanation when Gemini is unavailable.
 *
 * @param {Object} params
 * @returns {string}
 */
function buildFallbackExplanation({ batchName, location, riskLevel, triggeredSignals }) {
  const signalNames = triggeredSignals.map(s => s.signal.toLowerCase().replace(/_/g, ' ')).join(', ');
  const topSignal = triggeredSignals[0];

  return `The automated fraud detection system has flagged batch "${batchName}" (${location || 'location not specified'}) with a ${riskLevel} risk rating based on ${triggeredSignals.length} detected anomal${triggeredSignals.length === 1 ? 'y' : 'ies'}: ${signalNames}. ` +
    `The most significant concern is: ${topSignal?.description || 'anomalous activity detected'}. ` +
    `Compliance officers are advised to manually review the batch registration records, cross-reference with on-chain HCS/HTS data, and verify the farmer's identity and location before approving any further tokenization or trading activity. ` +
    `This assessment is generated by AgroDex's deterministic rule engine and should be reviewed alongside any on-chain evidence.`;
}
