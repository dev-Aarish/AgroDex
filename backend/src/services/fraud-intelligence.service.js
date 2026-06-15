/**
 * Fraud Intelligence Service — Main Orchestrator
 * Coordinates the complete fraud detection pipeline for a single batch:
 *
 *   1. Fetch batch from Supabase
 *   2. Run anomaly detectors (anomaly-detector.service.js)
 *   3. Run regional outlier detection (regional-analyzer.service.js)
 *   4. Compute deterministic risk score (risk-engine.service.js)
 *   5. Generate Gemini explanation (gemini-explainer.service.js)
 *   6. Upsert result to fraud_scores table
 *   7. Return structured FraudScore object
 *
 * Caching: Results in fraud_scores are reused if generated_at < 1 hour ago.
 */

import { supabase } from '../db.js';
import { runAllDetectors } from './anomaly-detector.service.js';
import { detectRegionalOutlier } from './regional-analyzer.service.js';
import { computeRiskScore, getRiskLevelColor } from './risk-engine.service.js';
import { generateFraudExplanation } from './gemini-explainer.service.js';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Check if a cached fraud score is still valid.
 * @param {Object} cached - Row from fraud_scores
 * @returns {boolean}
 */
function isCacheValid(cached) {
  if (!cached?.generated_at) return false;
  const age = Date.now() - new Date(cached.generated_at).getTime();
  return age < CACHE_TTL_MS;
}

/**
 * Analyze a single batch for fraud signals and compute a risk score.
 * Results are persisted to the fraud_scores table.
 *
 * @param {string} batchId - UUID of the batch to analyze
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh=false] - Skip cache and re-run analysis
 * @returns {Promise<Object>} FraudScore result
 */
export async function analyzeBatchFraud(batchId, { forceRefresh = false } = {}) {
  // ── 1. Validate batchId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(batchId)) {
    throw new Error('Invalid batch ID format. Must be a valid UUID.');
  }

  // ── 2. Check cache
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from('fraud_scores')
      .select('*')
      .eq('batch_id', batchId)
      .single();

    if (cached && isCacheValid(cached)) {
      console.log(`📋 Returning cached fraud score for batch ${batchId} (age: ${Math.round((Date.now() - new Date(cached.generated_at).getTime()) / 60000)}m)`);
      return formatFraudScore(cached, true);
    }
  }

  // ── 3. Fetch batch from Supabase
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (batchError || !batch) {
    throw new Error(`Batch ${batchId} not found: ${batchError?.message || 'not found'}`);
  }

  if (batch.deleted_at) {
    throw new Error(`Batch ${batchId} has been deleted and cannot be analyzed.`);
  }

  console.log(`🔍 Running fraud analysis for batch ${batchId} ("${batch.batch_name}")`);

  // ── 4. Run all detectors in parallel
  const [anomalySignals, regionalSignal] = await Promise.all([
    runAllDetectors(batch),
    detectRegionalOutlier(batch),
  ]);

  const allSignals = [...anomalySignals, regionalSignal];

  // ── 5. Compute deterministic risk score
  const { score, level, triggeredSignals, allSignals: signalDetails } = computeRiskScore(allSignals);

  console.log(`📊 Batch ${batchId}: score=${score}, level=${level}, signals=${triggeredSignals.length}/${allSignals.length}`);

  // ── 6. Generate Gemini explanation (explanation only, not scoring)
  const aiExplanation = await generateFraudExplanation({
    batchName: batch.batch_name,
    location: batch.location,
    riskLevel: level,
    triggeredSignals,
  });

  // ── 7. Upsert to fraud_scores (conflict on batch_id)
  const fraudScoreRecord = {
    batch_id: batchId,
    farmer_id: batch.farmer_id || null,
    risk_score: score,
    risk_level: level,
    reasons: signalDetails,
    ai_explanation: aiExplanation,
    generated_at: new Date().toISOString(),
  };

  const { data: upserted, error: upsertError } = await supabase
    .from('fraud_scores')
    .upsert(fraudScoreRecord, { onConflict: 'batch_id' })
    .select()
    .single();

  if (upsertError) {
    console.error(`❌ Failed to persist fraud score for batch ${batchId}:`, upsertError.message);
    // Return the result even if persistence failed
    return {
      batchId,
      farmerId: batch.farmer_id || null,
      batchName: batch.batch_name,
      location: batch.location,
      riskScore: score,
      riskLevel: level,
      riskColor: getRiskLevelColor(level),
      reasons: signalDetails,
      triggeredSignals,
      aiExplanation,
      generatedAt: fraudScoreRecord.generated_at,
      cached: false,
      persistError: upsertError.message,
    };
  }

  return formatFraudScore({ ...upserted, batch_name: batch.batch_name, location: batch.location }, false);
}

/**
 * Get all fraud scores for a specific farmer.
 *
 * @param {string} farmerId - Supabase auth user UUID
 * @param {number} [limit=20]
 * @returns {Promise<Array>}
 */
export async function getFarmerFraudScores(farmerId, limit = 20) {
  const { data, error } = await supabase
    .from('fraud_scores')
    .select(`
      *,
      batch:batch_id (
        batch_name,
        location,
        product_type,
        quantity,
        created_at
      )
    `)
    .eq('farmer_id', farmerId)
    .order('risk_score', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch farmer fraud scores: ${error.message}`);

  return (data || []).map(row => formatFraudScoreWithBatch(row));
}

/**
 * Get fraud overview statistics for the dashboard.
 *
 * @returns {Promise<Object>} Overview stats
 */
export async function getFraudOverview() {
  const [
    totalResult,
    levelCountsResult,
    topRiskyResult,
    trendResult,
  ] = await Promise.all([
    // Total analyzed batches
    supabase.from('fraud_scores').select('*', { head: true, count: 'exact' }),

    // Count by risk level
    supabase.from('fraud_scores').select('risk_level'),

    // Top 10 highest risk batches with batch details
    supabase
      .from('fraud_scores')
      .select(`
        *,
        batch:batch_id (
          batch_name,
          location,
          product_type,
          quantity,
          created_at,
          farmer_id
        )
      `)
      .in('risk_level', ['HIGH', 'CRITICAL'])
      .order('risk_score', { ascending: false })
      .limit(10),

    // 30-day trend: count per day
    supabase
      .from('fraud_scores')
      .select('generated_at, risk_level, risk_score')
      .gte('generated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('generated_at', { ascending: true }),
  ]);

  // Process level counts
  const levelCounts = { SAFE: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const row of levelCountsResult.data || []) {
    if (levelCounts.hasOwnProperty(row.risk_level)) {
      levelCounts[row.risk_level]++;
    }
  }

  // Process trend data — group by date and risk_level
  const trendMap = {};
  for (const row of trendResult.data || []) {
    const date = row.generated_at.split('T')[0];
    if (!trendMap[date]) {
      trendMap[date] = { date, SAFE: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, avgScore: 0, _scoreSum: 0, _count: 0 };
    }
    trendMap[date][row.risk_level] = (trendMap[date][row.risk_level] || 0) + 1;
    trendMap[date]._scoreSum += row.risk_score;
    trendMap[date]._count++;
  }

  const trend = Object.values(trendMap).map(d => ({
    date: d.date,
    SAFE: d.SAFE,
    LOW: d.LOW,
    MEDIUM: d.MEDIUM,
    HIGH: d.HIGH,
    CRITICAL: d.CRITICAL,
    avgScore: d._count > 0 ? Math.round(d._scoreSum / d._count) : 0,
  }));

  // Top farmer risk ranking — aggregate by farmer_id
  const { data: farmerScores } = await supabase
    .from('fraud_scores')
    .select('farmer_id, risk_score, risk_level')
    .not('farmer_id', 'is', null)
    .in('risk_level', ['MEDIUM', 'HIGH', 'CRITICAL'])
    .order('risk_score', { ascending: false })
    .limit(50);

  const farmerMap = {};
  for (const row of farmerScores || []) {
    if (!farmerMap[row.farmer_id]) {
      farmerMap[row.farmer_id] = {
        farmerId: row.farmer_id,
        batchCount: 0,
        maxScore: 0,
        worstLevel: 'SAFE',
        scoreSum: 0,
      };
    }
    farmerMap[row.farmer_id].batchCount++;
    farmerMap[row.farmer_id].scoreSum += row.risk_score;
    if (row.risk_score > farmerMap[row.farmer_id].maxScore) {
      farmerMap[row.farmer_id].maxScore = row.risk_score;
      farmerMap[row.farmer_id].worstLevel = row.risk_level;
    }
  }

  const farmerRanking = Object.values(farmerMap)
    .map(f => ({ ...f, avgScore: Math.round(f.scoreSum / f.batchCount) }))
    .sort((a, b) => b.maxScore - a.maxScore)
    .slice(0, 10);

  const totalAnalyzed = totalResult.count || 0;
  const flaggedCount = (levelCounts.HIGH || 0) + (levelCounts.CRITICAL || 0);
  const avgScore = levelCountsResult.data?.length > 0
    ? Math.round((levelCountsResult.data || []).reduce((s, r) => s + (r.risk_score || 0), 0) / levelCountsResult.data.length)
    : 0;

  return {
    summary: {
      totalAnalyzed,
      safeCount: levelCounts.SAFE,
      lowCount: levelCounts.LOW,
      mediumCount: levelCounts.MEDIUM,
      highCount: levelCounts.HIGH,
      criticalCount: levelCounts.CRITICAL,
      flaggedCount,
      safeRate: totalAnalyzed > 0 ? Math.round((levelCounts.SAFE / totalAnalyzed) * 100) : 0,
    },
    levelCounts,
    topRiskyBatches: (topRiskyResult.data || []).map(row => formatFraudScoreWithBatch(row)),
    farmerRanking,
    trend,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Format a raw fraud_scores row (without joined batch) into a clean response object.
 * @param {Object} row
 * @param {boolean} fromCache
 * @returns {Object}
 */
function formatFraudScore(row, fromCache) {
  return {
    id: row.id,
    batchId: row.batch_id,
    farmerId: row.farmer_id || null,
    batchName: row.batch_name || null,
    location: row.location || null,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    riskColor: getRiskLevelColor(row.risk_level),
    reasons: row.reasons || [],
    triggeredSignals: (row.reasons || []).filter(r => r.detected !== false),
    aiExplanation: row.ai_explanation,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
    cached: fromCache,
  };
}

/**
 * Format a fraud_scores row with joined batch data.
 * @param {Object} row
 * @returns {Object}
 */
function formatFraudScoreWithBatch(row) {
  return {
    id: row.id,
    batchId: row.batch_id,
    farmerId: row.farmer_id || null,
    batchName: row.batch?.batch_name || row.batch_name || 'Unknown',
    location: row.batch?.location || row.location || 'Unknown',
    productType: row.batch?.product_type || null,
    quantity: row.batch?.quantity || null,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    riskColor: getRiskLevelColor(row.risk_level),
    reasons: row.reasons || [],
    triggeredCount: (row.reasons || []).filter(r => r.detected !== false && r.weight > 0).length,
    aiExplanation: row.ai_explanation,
    generatedAt: row.generated_at,
    createdAt: row.created_at || row.batch?.created_at,
  };
}
