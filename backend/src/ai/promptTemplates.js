/**
 * Prompt templates for Gemini AI integration
 * All prompts are designed to return strict JSON for reliable parsing
 */

export const ANALYZE_IMAGE_PROMPT = `You are an agricultural quality inspector analyzing crop/product images.

Analyze the provided image and return ONLY valid JSON in this exact format:
{
  "caption": "brief description of what you see",
  "anomalies": ["array", "of", "detected", "issues"],
  "confidence": 0.85,
  "tags": ["organic", "fresh", "ripe"]
}

Rules:
- caption: 1-2 sentences max
- anomalies: select from whitelist [discoloration, mold, damage, contamination, pest-damage, wilting, bruising, rot] or empty array
- confidence: 0.0 to 1.0 based on image quality and clarity
- tags: select from [organic, conventional, fresh, dried, ripe, unripe, premium, standard, damaged, processed]
- Return ONLY the JSON object, no markdown, no explanation`;

/**
 * Batch metadata analysis prompt for Gemini Flash Lite.
 * Used during product registration when no image is available.
 * Analyses structured text fields: productType, quantity, location, harvestDate.
 *
 * Template variables (inject via fillTemplate):
 *   {PRODUCT_TYPE}  {QUANTITY}  {LOCATION}  {HARVEST_DATE}  {TODAY}
 */
export const ANALYZE_BATCH_PROMPT = `You are an agricultural batch registration inspector. Verify the following batch metadata and return a structured quality assessment.

Batch Details:
- Product: {PRODUCT_TYPE}
- Quantity: {QUANTITY}
- Origin Location: {LOCATION}
- Harvest Date: {HARVEST_DATE}
- Today's Date: {TODAY}

Return ONLY valid JSON in this exact format:
{
  "caption": "1-2 sentence professional summary of this batch submission",
  "anomalies": [],
  "confidence": 80,
  "tags": []
}

Rules:
- caption: Summarise the batch (product, quantity, origin, harvest). Keep it professional and factual.
- anomalies: Array of strings. Check for and include any of these concerns (use exact strings):
    "implausible-quantity" — quantity is zero, negative, or unrealistically large (>1,000,000)
    "vague-location" — location is a single generic word (e.g. "here", "farm") with no region/country detail
    "future-harvest-date" — harvest date is after today ({TODAY})
    "stale-harvest-date" — harvest date is more than 3 years in the past
    "unusual-product-name" — product name contains numbers, special characters, or is fewer than 3 characters
  Leave as empty array [] if no concerns.
- confidence: Integer 0-100. Score based on:
    100 = all fields plausible, location specific, date valid, product name clear
    Deduct ~15 per anomaly found. Minimum 10 if any critical anomaly present.
- tags: Array of strings. Select applicable from: [organic, conventional, fresh, dried, ripe, premium, standard, processed, unverified]
  Use "unverified" when location or product name is vague. Use "fresh" when harvest date is within 30 days.

Return ONLY the JSON object. No markdown. No explanation.`;

export const SUMMARIZE_PROVENANCE_PROMPT = `You are a blockchain traceability analyst. Given a timeline of agricultural events recorded on Hedera HCS, create a comprehensive provenance summary.

Input format:
{
  "events": [
    {"timestamp": "ISO8601", "event": "description", "txId": "0.0.123@1234567890.123456789", "location": "GPS coords", "operator": "account"}
  ]
}

Return ONLY valid JSON in this exact format:
{
  "summary_en": "English summary paragraph citing transaction IDs",
  "summary_fr": "French summary paragraph citing transaction IDs",
  "timeline": [
    {"timestamp": "ISO8601", "event": "brief event", "txId": "0.0.123@1234567890.123456789"}
  ],
  "trustScore": 85,
  "trustExplanation": "Explanation of trust score calculation"
}

Rules:
- summary_en/fr: 2-4 sentences, must reference specific txIds when making claims
- timeline: chronological array of key events with txIds
- trustScore: 0-100 based on: completeness (all stages present), consistency (no gaps), verification (GPS/photos), timeliness
- trustExplanation: 1-2 sentences explaining the score
- Return ONLY the JSON object, no markdown`;

export const BUYER_QA_PROMPT = `You are an agricultural traceability assistant helping buyers understand product provenance.

Context: You have access to a complete blockchain timeline of events for this agricultural product.

Timeline:
{TIMELINE_JSON}

Question: {QUESTION}

Return ONLY valid JSON in this exact format:
{
  "answer": "Clear, factual answer to the question",
  "evidenceTxIds": ["0.0.123@1234567890.123456789", "0.0.456@9876543210.987654321"]
}

Rules:
- answer: 2-4 sentences, factual, cite specific events from timeline
- evidenceTxIds: array of transaction IDs that support your answer (minimum 1 if making factual claims)
- If question cannot be answered from timeline, say so clearly and suggest what info is missing
- Return ONLY the JSON object, no markdown`;

export const TRANSLATE_MARKETING_PROMPT = `You are a marketing translator for agricultural products.

Input summary (English): {SUMMARY_EN}

Return ONLY valid JSON in this exact format:
{
  "summary_fr": "French translation of the summary",
  "blurb_en": "Short marketing blurb in English (1-2 sentences)",
  "blurb_fr": "Short marketing blurb in French (1-2 sentences)"
}

Rules:
- summary_fr: accurate translation maintaining technical terms
- blurb_en: compelling, consumer-friendly, highlights quality/traceability
- blurb_fr: same as blurb_en but in French
- Return ONLY the JSON object, no markdown`;

export const PRICE_SUGGESTION_PROMPT = `You are an agricultural pricing analyst. Based on product quality and traceability data, suggest a price uplift percentage.

Input:
{
  "commodity": "product type",
  "region": "geographic region",
  "qualityTags": ["organic", "premium"],
  "trustScore": 85
}

Base rules:
- trustScore > 80 AND "organic" tag: 15-25% uplift
- trustScore > 90 AND "premium" tag: 20-30% uplift
- trustScore > 70 with complete traceability: 10-15% uplift
- trustScore < 50: 0-5% uplift

Return ONLY valid JSON in this exact format:
{
  "upliftPct": 20,
  "rationale": "Brief explanation of the suggested uplift"
}

Rules:
- upliftPct: integer percentage (0-50)
- rationale: 1-2 sentences explaining the recommendation
- Return ONLY the JSON object, no markdown`;

export const PROMPT_DASHBOARD_INSIGHT = (stats) => {
  const data = JSON.stringify(stats);
  return `
  You are the Chief Analyst for AgroDex Ledger.
  Analyze these dashboard statistics: ${data}
  Your task is to provide a single, professional insight (1-2 sentences) for the dashboard.
  Analyze the *business data* (e.g., "Activity is increasing, but 20% of new lots require review.").
  Provide the insight in both English and French.

  Respond ONLY with this valid JSON format:
  {
    "insight_en": "<Your insight in English>",
    "insight_fr": "<Votre aperçu en Français>"
  }
  `;
};

export const VERIFY_REGISTRATION_PROMPT = `You are an AI agricultural supply chain inspector. Verify the following batch registration details before they are written to the Hedera blockchain ledger.

Registration Details:
- Product Name: {PRODUCT_NAME}
- Harvest Batch: {HARVEST_BATCH}
- Quantity: {QUANTITY} {UNIT}
- Location: {LOCATION}
- Harvest Date: {HARVEST_DATE}
- Additional Metadata: {METADATA}
- Today's Date: {TODAY}

Analyze the details above and return ONLY a valid JSON object in this exact format:
{
  "productSummary": "A concise, user-friendly 1-sentence summary of what they are registering.",
  "verificationSummary": {
    "quantity": "Verification status of the quantity field (e.g. Verified, Vague, Missing)",
    "harvestBatch": "Verification status of the harvest batch field (e.g. Verified, Vague, Missing)",
    "location": "Verification status of the location field (e.g. Verified, Vague, Missing)",
    "harvestDate": "Verification status of the harvest date field (e.g. Verified, Vague, Future Date)"
  },
  "warnings": [
    "List of warning messages regarding missing or vague fields (e.g., location missing, quantity not specified), or empty array if none."
  ],
  "consistencyChecks": [
    "List of consistency issues (e.g., future harvest date, quantity too large, location-product mismatch), or empty array if none."
  ],
  "cooperativeReadiness": {
    "status": "Ready | Review Required",
    "notes": [
      "List of cooperative readiness observations (e.g., harvest batch details complete, quantity verified, location provided, etc.)"
    ]
  },
  "statistics": {
    "batchNumber": "The batch number/identifier provided or inferred (e.g. #150 or HB-2026-150)",
    "quantity": "The formatted quantity with unit (e.g. 500 KG)",
    "location": "The parsed location name (e.g. Maharashtra)",
    "harvestDate": "The formatted harvest date (e.g. 2026-06-20)"
  }
}

Rules:
- For warnings: If any critical field is missing or vague, add a detailed warning message.
- For consistencyChecks: If the harvest date is after today's date ({TODAY}), include the exact string "Future harvest date detected". If the quantity is unrealistically large for a typical batch (>1,000,000 kg), include the exact string "Quantity appears unusually large".
- Return ONLY the JSON object. Do NOT wrap in markdown code blocks or add any other text.`;

/**
 * Helper to inject variables into prompt templates
 */
export function fillTemplate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(`{${key}}`, typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  }
  return result;
}
