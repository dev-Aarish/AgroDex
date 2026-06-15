/**
 * Regional Analyzer Service
 * Detects whether a batch's yield quantity is a regional outlier
 * compared to other batches in the same geographic area.
 *
 * Uses IQR (Interquartile Range) method:
 * - Outlier if value > Q3 + 1.5 * IQR  (high outlier = over-reporting)
 * - Outlier if value < Q1 - 1.5 * IQR  (low outlier = under-reporting)
 *
 * IMPORTANT: This module detects signals only.
 *            Scoring is handled exclusively by risk-engine.service.js.
 */

import { supabase } from '../db.js';

/**
 * Parse quantity string to float.
 * @param {string|number} q
 * @returns {number|null}
 */
function parseQuantity(q) {
  if (q === null || q === undefined) return null;
  const num = parseFloat(String(q).replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Extract a normalized region identifier from a location string.
 * Uses the first two significant words to group by province/district.
 * E.g., "Surabaya, East Java" → "surabaya east"
 *       "Bandung Regency, West Java" → "bandung regency"
 *
 * @param {string} location
 * @returns {string}
 */
function extractRegion(location) {
  if (!location) return '';
  return location
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
}

/**
 * Compute percentile value from a sorted array.
 * @param {number[]} sorted - Sorted numeric array
 * @param {number} p - Percentile 0–100
 * @returns {number}
 */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (idx - lower) * (sorted[upper] - sorted[lower]);
}

/**
 * Detect regional outlier: batch quantity is outside IQR fence vs region peers.
 *
 * @param {Object} batch - Full batch record from Supabase
 * @returns {Promise<Object>} Signal result
 */
export async function detectRegionalOutlier(batch) {
  const signal = 'REGIONAL_OUTLIER';
  const weight = 15;

  try {
    const currentQty = parseQuantity(batch.quantity);
    if (currentQty === null) {
      return {
        detected: false,
        signal,
        weight,
        description: 'Quantity not parseable; regional check skipped.'
      };
    }

    const region = extractRegion(batch.location);
    if (!region) {
      return {
        detected: false,
        signal,
        weight,
        description: 'No location data; regional check skipped.'
      };
    }

    // Fetch all non-deleted batches in the same region (ilike search)
    const { data: regionalBatches, error } = await supabase
      .from('batches')
      .select('quantity, location')
      .ilike('location', `%${region.split(' ')[0]}%`)
      .neq('id', batch.id)
      .is('deleted_at', null)
      .not('quantity', 'is', null)
      .limit(200);

    if (error) {
      return { detected: false, signal, weight, description: `DB error during regional check: ${error.message}` };
    }

    const quantities = (regionalBatches || [])
      .map(b => parseQuantity(b.quantity))
      .filter(v => v !== null)
      .sort((a, b) => a - b);

    if (quantities.length < 5) {
      return {
        detected: false,
        signal,
        weight,
        description: `Insufficient regional data (${quantities.length} batches found in region "${region}"); regional check requires at least 5.`
      };
    }

    const q1 = percentile(quantities, 25);
    const q3 = percentile(quantities, 75);
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    const isHighOutlier = currentQty > upperFence;
    const isLowOutlier = currentQty < lowerFence && currentQty > 0;
    const detected = isHighOutlier || isLowOutlier;

    // Collect summary stats for description
    const regionSummary = {
      region,
      sampleSize: quantities.length,
      q1: q1.toFixed(1),
      q3: q3.toFixed(1),
      lowerFence: lowerFence.toFixed(1),
      upperFence: upperFence.toFixed(1),
    };

    return {
      detected,
      signal,
      weight,
      description: detected
        ? `Batch quantity ${currentQty} is a ${isHighOutlier ? 'high' : 'low'} regional outlier in "${region}" (${quantities.length} peers). Expected range: ${lowerFence.toFixed(1)}–${upperFence.toFixed(1)} (Q1: ${q1.toFixed(1)}, Q3: ${q3.toFixed(1)}, IQR: ${iqr.toFixed(1)}).`
        : `Batch quantity ${currentQty} is within the regional IQR range for "${region}" (${quantities.length} peers, fence: ${lowerFence.toFixed(1)}–${upperFence.toFixed(1)}).`,
      metadata: regionSummary
    };
  } catch (err) {
    console.error('[regional-analyzer] detectRegionalOutlier error:', err.message);
    return { detected: false, signal, weight, description: `Error during regional check: ${err.message}` };
  }
}

/**
 * Get regional fraud analytics for the overview dashboard.
 * Returns batch counts grouped by region with their average risk scores.
 *
 * @returns {Promise<Array>} Array of {region, totalBatches, flaggedBatches, avgScore}
 */
export async function getRegionalAnalytics() {
  try {
    // Get all fraud scores joined with batch locations
    const { data, error } = await supabase
      .from('fraud_scores')
      .select(`
        risk_score,
        risk_level,
        batch:batch_id (
          location
        )
      `)
      .not('batch_id', 'is', null)
      .limit(500);

    if (error) {
      console.error('[regional-analyzer] getRegionalAnalytics error:', error.message);
      return [];
    }

    // Group by normalized region
    const regionMap = {};

    for (const record of data || []) {
      const location = record.batch?.location || 'Unknown';
      const region = extractRegion(location) || 'Unknown';

      if (!regionMap[region]) {
        regionMap[region] = {
          region,
          displayName: location.split(',')[0]?.trim() || region,
          totalBatches: 0,
          flaggedBatches: 0,
          scoreSum: 0
        };
      }

      regionMap[region].totalBatches++;
      regionMap[region].scoreSum += record.risk_score;
      if (['HIGH', 'CRITICAL'].includes(record.risk_level)) {
        regionMap[region].flaggedBatches++;
      }
    }

    return Object.values(regionMap)
      .map(r => ({
        ...r,
        avgScore: r.totalBatches > 0 ? Math.round(r.scoreSum / r.totalBatches) : 0
      }))
      .sort((a, b) => b.flaggedBatches - a.flaggedBatches)
      .slice(0, 15);
  } catch (err) {
    console.error('[regional-analyzer] getRegionalAnalytics error:', err.message);
    return [];
  }
}
