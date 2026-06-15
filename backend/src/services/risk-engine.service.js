/**
 * Risk Engine Service
 * Deterministic weighted rule scoring for fraud detection.
 *
 * THIS MODULE IS THE SOLE SOURCE OF RISK SCORES.
 * Gemini does NOT calculate scores — it only explains detected signals.
 *
 * Weights:
 *   YIELD_ANOMALY                  → +20
 *   MISSING_LIFECYCLE_EVENTS       → +15
 *   DUPLICATE_METADATA             → +20
 *   HIGH_BATCH_FREQUENCY           → +25
 *   MULTIPLE_NFT_ATTEMPTS          → +30
 *   REGIONAL_OUTLIER               → +15
 *   HISTORICAL_SUSPICIOUS_ACTIVITY → +10
 *
 * Risk Level Thresholds:
 *   0–19   → SAFE
 *   20–34  → LOW
 *   35–54  → MEDIUM
 *   55–74  → HIGH
 *   75–100 → CRITICAL
 */

/**
 * Map of signal names to their weights.
 * This is the single source of truth for scoring weights.
 */
export const SIGNAL_WEIGHTS = {
  YIELD_ANOMALY: 20,
  MISSING_LIFECYCLE_EVENTS: 15,
  DUPLICATE_METADATA: 20,
  HIGH_BATCH_FREQUENCY: 25,
  MULTIPLE_NFT_ATTEMPTS: 30,
  REGIONAL_OUTLIER: 15,
  HISTORICAL_SUSPICIOUS_ACTIVITY: 10,
};

/**
 * Risk level thresholds (inclusive lower bound).
 */
export const RISK_THRESHOLDS = [
  { min: 75, level: 'CRITICAL' },
  { min: 55, level: 'HIGH' },
  { min: 35, level: 'MEDIUM' },
  { min: 20, level: 'LOW' },
  { min: 0,  level: 'SAFE' },
];

/**
 * Determine risk level from a numeric score.
 *
 * @param {number} score - 0–100
 * @returns {'SAFE'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'}
 */
export function scoreToRiskLevel(score) {
  for (const threshold of RISK_THRESHOLDS) {
    if (score >= threshold.min) return threshold.level;
  }
  return 'SAFE';
}

/**
 * Compute the final risk score and level from an array of signal results.
 *
 * @param {Array<{detected: boolean, signal: string, weight: number, description: string}>} signals
 *   All signal results (detected and not detected)
 * @returns {{ score: number, level: string, triggeredSignals: Array, allSignals: Array }}
 */
export function computeRiskScore(signals) {
  const triggeredSignals = signals.filter(s => s.detected);

  // Sum weights of all triggered signals, clamp to 100
  const rawScore = triggeredSignals.reduce((sum, s) => sum + (s.weight || 0), 0);
  const score = Math.min(100, Math.max(0, rawScore));

  const level = scoreToRiskLevel(score);

  return {
    score,
    level,
    triggeredSignals: triggeredSignals.map(s => ({
      signal: s.signal,
      weight: s.weight,
      description: s.description,
    })),
    allSignals: signals.map(s => ({
      signal: s.signal,
      detected: s.detected,
      weight: s.detected ? s.weight : 0,
      description: s.description,
    })),
  };
}

/**
 * Get a human-readable label for a risk level.
 *
 * @param {string} level
 * @returns {string}
 */
export function getRiskLevelLabel(level) {
  const labels = {
    SAFE: '✅ Safe',
    LOW: '🟡 Low Risk',
    MEDIUM: '🟠 Medium Risk',
    HIGH: '🔴 High Risk',
    CRITICAL: '🚨 Critical Risk',
  };
  return labels[level] || level;
}

/**
 * Get CSS color class for a risk level (for API metadata).
 *
 * @param {string} level
 * @returns {string}
 */
export function getRiskLevelColor(level) {
  const colors = {
    SAFE: 'emerald',
    LOW: 'yellow',
    MEDIUM: 'orange',
    HIGH: 'red',
    CRITICAL: 'purple',
  };
  return colors[level] || 'gray';
}
