/**
 * Anomaly Detector Service
 * Analyzes a batch against historical data to detect individual fraud signals.
 *
 * Each detector function returns:
 *   { detected: boolean, signal: string, weight: number, description: string }
 *
 * IMPORTANT: This module computes ONLY boolean signal detection.
 *            Score calculation is handled exclusively by risk-engine.service.js.
 *            Gemini is NOT involved here.
 */

import { supabase } from '../db.js';

/**
 * Parse quantity string to a numeric value.
 * Supports "500 kg", "500", "500.5", etc.
 * @param {string|number} q
 * @returns {number|null}
 */
function parseQuantity(q) {
  if (q === null || q === undefined) return null;
  const num = parseFloat(String(q).replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Detect yield anomaly: batch quantity deviates >2 SD from the farmer's median.
 * Falls back to a global median if farmer has <3 historical batches.
 *
 * @param {Object} batch - The batch record from Supabase
 * @returns {Promise<Object>} Signal result
 */
export async function detectYieldAnomaly(batch) {
  const signal = 'YIELD_ANOMALY';
  const weight = 20;

  try {
    const currentQty = parseQuantity(batch.quantity);
    if (currentQty === null) {
      return { detected: false, signal, weight, description: 'Quantity not parseable; skipping yield check.' };
    }

    // Fetch historical quantities for this farmer (or globally if no farmer_id)
    let query = supabase
      .from('batches')
      .select('quantity')
      .neq('id', batch.id)
      .not('quantity', 'is', null);

    if (batch.farmer_id) {
      query = query.eq('farmer_id', batch.farmer_id);
    }

    const { data: historicalBatches, error } = await query.limit(100);

    if (error || !historicalBatches || historicalBatches.length < 3) {
      // Not enough history to judge
      return { detected: false, signal, weight, description: 'Insufficient historical data for yield comparison.' };
    }

    const quantities = historicalBatches
      .map(b => parseQuantity(b.quantity))
      .filter(v => v !== null);

    if (quantities.length < 3) {
      return { detected: false, signal, weight, description: 'Insufficient valid quantity records.' };
    }

    const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const variance = quantities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / quantities.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      return { detected: false, signal, weight, description: 'All historical quantities are identical; no deviation detected.' };
    }

    const zScore = Math.abs((currentQty - mean) / stdDev);
    const detected = zScore > 2.0;

    return {
      detected,
      signal,
      weight,
      description: detected
        ? `Quantity ${currentQty} is ${zScore.toFixed(1)}σ from the farmer mean of ${mean.toFixed(1)} (SD: ${stdDev.toFixed(1)}). This is a statistically significant outlier.`
        : `Quantity ${currentQty} is within normal range (z-score: ${zScore.toFixed(2)}).`
    };
  } catch (err) {
    console.error('[anomaly-detector] detectYieldAnomaly error:', err.message);
    return { detected: false, signal, weight, description: `Error during yield check: ${err.message}` };
  }
}

/**
 * Detect missing HCS lifecycle events:
 * Batch was registered on HCS (hcs_tx_id present) but never tokenized
 * and is older than 7 days (not just unfinished).
 *
 * @param {Object} batch
 * @returns {Promise<Object>} Signal result
 */
export async function detectMissingLifecycleEvents(batch) {
  const signal = 'MISSING_LIFECYCLE_EVENTS';
  const weight = 15;

  try {
    const hasRegistration = !!batch.hcs_tx_id;
    const hasTokenization = !!(batch.hedera_token_id && batch.hedera_serial_number);
    const hasHcsTransactions = Array.isArray(batch.hcs_transaction_ids) && batch.hcs_transaction_ids.length > 0;

    // Only flag if registered but never tokenized AND old enough that it's suspicious
    const createdAt = batch.created_at ? new Date(batch.created_at) : null;
    const ageMs = createdAt ? Date.now() - createdAt.getTime() : 0;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    const detected = hasRegistration && !hasTokenization && !hasHcsTransactions && ageDays > 7;

    return {
      detected,
      signal,
      weight,
      description: detected
        ? `Batch was registered on HCS ${ageDays.toFixed(0)} days ago but has no tokenization event or HCS transaction chain. Expected lifecycle: Register → HCS Confirmation → NFT Minting.`
        : 'Batch has expected lifecycle events or is recent.'
    };
  } catch (err) {
    console.error('[anomaly-detector] detectMissingLifecycleEvents error:', err.message);
    return { detected: false, signal, weight, description: `Error during lifecycle check: ${err.message}` };
  }
}

/**
 * Detect duplicate metadata: another batch shares same (batch_name, location, harvest_date).
 *
 * @param {Object} batch
 * @returns {Promise<Object>} Signal result
 */
export async function detectDuplicateMetadata(batch) {
  const signal = 'DUPLICATE_METADATA';
  const weight = 20;

  try {
    if (!batch.batch_name || !batch.location) {
      return { detected: false, signal, weight, description: 'Insufficient metadata to check for duplicates.' };
    }

    const { data: duplicates, error } = await supabase
      .from('batches')
      .select('id, batch_name, location, harvest_date, created_at')
      .eq('batch_name', batch.batch_name)
      .eq('location', batch.location)
      .neq('id', batch.id)
      .is('deleted_at', null)
      .limit(5);

    if (error) {
      return { detected: false, signal, weight, description: `DB error during duplicate check: ${error.message}` };
    }

    // Filter by harvest_date if available
    let matchingDuplicates = duplicates || [];
    if (batch.harvest_date && matchingDuplicates.length > 0) {
      matchingDuplicates = matchingDuplicates.filter(d =>
        d.harvest_date && d.harvest_date === batch.harvest_date
      );
    }

    const detected = matchingDuplicates.length > 0;

    return {
      detected,
      signal,
      weight,
      description: detected
        ? `Found ${matchingDuplicates.length} batch(es) with identical name "${batch.batch_name}", location "${batch.location}"${batch.harvest_date ? `, harvest date ${batch.harvest_date}` : ''}. Possible duplicate submission or copy-paste fraud.`
        : 'No duplicate metadata detected.'
    };
  } catch (err) {
    console.error('[anomaly-detector] detectDuplicateMetadata error:', err.message);
    return { detected: false, signal, weight, description: `Error during duplicate check: ${err.message}` };
  }
}

/**
 * Detect excessive batch creation frequency:
 * Farmer created >3 batches within any 24-hour rolling window.
 *
 * @param {Object} batch
 * @returns {Promise<Object>} Signal result
 */
export async function detectHighBatchFrequency(batch) {
  const signal = 'HIGH_BATCH_FREQUENCY';
  const weight = 25;

  try {
    if (!batch.farmer_id) {
      return { detected: false, signal, weight, description: 'No farmer_id; frequency check skipped.' };
    }

    // Look at last 30 days of this farmer's batches
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: farmerBatches, error } = await supabase
      .from('batches')
      .select('created_at')
      .eq('farmer_id', batch.farmer_id)
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (error || !farmerBatches || farmerBatches.length < 4) {
      return { detected: false, signal, weight, description: 'Less than 4 batches in last 30 days; frequency is normal.' };
    }

    // Sliding window: check if any 24h window contains >3 batches
    const timestamps = farmerBatches.map(b => new Date(b.created_at).getTime());
    let maxInWindow = 0;

    for (let i = 0; i < timestamps.length; i++) {
      const windowEnd = timestamps[i] + 24 * 60 * 60 * 1000;
      const countInWindow = timestamps.filter(t => t >= timestamps[i] && t <= windowEnd).length;
      maxInWindow = Math.max(maxInWindow, countInWindow);
    }

    const detected = maxInWindow > 3;

    return {
      detected,
      signal,
      weight,
      description: detected
        ? `Farmer created ${maxInWindow} batches within a single 24-hour window. This exceeds the normal threshold of 3 batches/day and may indicate automated or fraudulent submission.`
        : `Maximum batch frequency is ${maxInWindow}/day, within normal range.`
    };
  } catch (err) {
    console.error('[anomaly-detector] detectHighBatchFrequency error:', err.message);
    return { detected: false, signal, weight, description: `Error during frequency check: ${err.message}` };
  }
}

/**
 * Detect multiple NFT minting attempts for the same HCS transaction.
 * Flags if the tokens table has >1 record sharing the batch's primary hcs_tx_id.
 *
 * @param {Object} batch
 * @returns {Promise<Object>} Signal result
 */
export async function detectMultipleNFTAttempts(batch) {
  const signal = 'MULTIPLE_NFT_ATTEMPTS';
  const weight = 30;

  try {
    if (!batch.hcs_tx_id) {
      return { detected: false, signal, weight, description: 'No HCS transaction ID; NFT attempt check skipped.' };
    }

    const { data: tokens, error } = await supabase
      .from('tokens')
      .select('id, token_id, serial_number, created_at')
      .contains('hcs_tx_ids', [batch.hcs_tx_id])
      .limit(10);

    if (error) {
      return { detected: false, signal, weight, description: `DB error during NFT check: ${error.message}` };
    }

    const detected = (tokens || []).length > 1;

    return {
      detected,
      signal,
      weight,
      description: detected
        ? `Found ${tokens.length} NFT token records referencing HCS transaction ${batch.hcs_tx_id}. A legitimate batch should have only one NFT. Multiple minting is a strong fraud signal.`
        : 'Single or no NFT minting detected for this HCS transaction.'
    };
  } catch (err) {
    console.error('[anomaly-detector] detectMultipleNFTAttempts error:', err.message);
    return { detected: false, signal, weight, description: `Error during NFT attempt check: ${err.message}` };
  }
}

/**
 * Detect historical suspicious behavior:
 * Farmer has a prior fraud_scores record with risk_level HIGH or CRITICAL.
 *
 * @param {Object} batch
 * @returns {Promise<Object>} Signal result
 */
export async function detectHistoricalSuspiciousActivity(batch) {
  const signal = 'HISTORICAL_SUSPICIOUS_ACTIVITY';
  const weight = 10;

  try {
    if (!batch.farmer_id) {
      return { detected: false, signal, weight, description: 'No farmer_id; historical check skipped.' };
    }

    const { data: priorScores, error } = await supabase
      .from('fraud_scores')
      .select('risk_level, risk_score, generated_at, batch_id')
      .eq('farmer_id', batch.farmer_id)
      .neq('batch_id', batch.id)
      .in('risk_level', ['HIGH', 'CRITICAL'])
      .order('generated_at', { ascending: false })
      .limit(5);

    if (error) {
      return { detected: false, signal, weight, description: `DB error during history check: ${error.message}` };
    }

    const detected = (priorScores || []).length > 0;

    return {
      detected,
      signal,
      weight,
      description: detected
        ? `Farmer has ${priorScores.length} prior batch(es) rated HIGH or CRITICAL risk (latest: ${priorScores[0]?.risk_level} score ${priorScores[0]?.risk_score}). Repeat suspicious behavior is a risk multiplier.`
        : 'No prior HIGH/CRITICAL risk batches found for this farmer.'
    };
  } catch (err) {
    console.error('[anomaly-detector] detectHistoricalSuspiciousActivity error:', err.message);
    return { detected: false, signal, weight, description: `Error during history check: ${err.message}` };
  }
}

/**
 * Run all anomaly detectors for a batch.
 * Returns array of signal results (detected or not).
 *
 * @param {Object} batch - Full batch record from Supabase
 * @returns {Promise<Array>} All signal results
 */
export async function runAllDetectors(batch) {
  const results = await Promise.allSettled([
    detectYieldAnomaly(batch),
    detectMissingLifecycleEvents(batch),
    detectDuplicateMetadata(batch),
    detectHighBatchFrequency(batch),
    detectMultipleNFTAttempts(batch),
    detectHistoricalSuspiciousActivity(batch),
  ]);

  return results.map(r => r.status === 'fulfilled' ? r.value : {
    detected: false,
    signal: 'ERROR',
    weight: 0,
    description: r.reason?.message || 'Unknown error'
  });
}
