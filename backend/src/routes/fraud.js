/**
 * Fraud Detection API Routes
 *
 * GET /api/fraud/batch/:batchId  — Analyze a single batch and return its fraud score
 * GET /api/fraud/farmer/:farmerId — Get all fraud scores for a specific farmer
 * GET /api/fraud/overview         — Aggregated fraud stats for the Risk Intelligence dashboard
 *
 * Uses optionalAuth so the overview endpoint is publicly accessible
 * while still attaching user info when a token is present.
 */

import express from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import {
  analyzeBatchFraud,
  getFarmerFraudScores,
  getFraudOverview,
} from '../services/fraud-intelligence.service.js';
import { getRegionalAnalytics } from '../services/regional-analyzer.service.js';

const router = express.Router();

// Apply general rate limiting to all fraud routes
router.use(generalLimiter);

/**
 * GET /api/fraud/batch/:batchId
 *
 * Analyze a batch for fraud signals and return its risk score.
 * Results are cached for 1 hour in the fraud_scores table.
 *
 * Query params:
 *   ?refresh=true  — Force re-analysis even if cached result exists
 *
 * Response:
 *   200 { ok: true, data: FraudScore }
 *   400 Invalid batchId format
 *   404 Batch not found
 *   500 Internal error
 */
router.get('/batch/:batchId', optionalAuth, async (req, res) => {
  try {
    const { batchId } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(batchId)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid batchId format. Must be a valid UUID.',
      });
    }

    console.log(`🔍 [fraud] Analyzing batch ${batchId} (refresh=${forceRefresh})`);

    const result = await analyzeBatchFraud(batchId, { forceRefresh });

    return res.json({
      ok: true,
      data: result,
    });
  } catch (err) {
    console.error('[fraud] /batch error:', err.message);

    if (err.message?.includes('not found') || err.message?.includes('not found')) {
      return res.status(404).json({ ok: false, error: err.message });
    }
    if (err.message?.includes('deleted')) {
      return res.status(410).json({ ok: false, error: err.message });
    }
    if (err.message?.includes('Invalid batch ID')) {
      return res.status(400).json({ ok: false, error: err.message });
    }

    return res.status(500).json({
      ok: false,
      error: 'Failed to analyze batch fraud',
      details: err.message,
    });
  }
});

/**
 * GET /api/fraud/farmer/:farmerId
 *
 * Retrieve all fraud scores for a specific farmer (by Supabase user UUID).
 * Sorted by risk_score descending.
 *
 * Query params:
 *   ?limit=20  — Number of results (default: 20, max: 100)
 *
 * Response:
 *   200 { ok: true, farmerId, data: FraudScore[], count: number }
 *   400 Invalid farmerId
 *   500 Internal error
 */
router.get('/farmer/:farmerId', requireAuth, async (req, res) => {
  try {
    const { farmerId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(farmerId)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid farmerId format. Must be a valid UUID.',
      });
    }

    console.log(`👤 [fraud] Fetching scores for farmer ${farmerId}`);

    const scores = await getFarmerFraudScores(farmerId, limit);

    return res.json({
      ok: true,
      farmerId,
      count: scores.length,
      data: scores,
    });
  } catch (err) {
    console.error('[fraud] /farmer error:', err.message);
    return res.status(500).json({
      ok: false,
      error: 'Failed to fetch farmer fraud scores',
      details: err.message,
    });
  }
});

/**
 * GET /api/fraud/overview
 *
 * Returns aggregated fraud intelligence statistics for the Risk Intelligence dashboard.
 * Includes: level counts, top risky batches, farmer ranking, 30-day trend, regional analytics.
 *
 * This endpoint is public (no auth required) so the Risk Intelligence dashboard
 * can be viewed by compliance officers and auditors without a session.
 *
 * Response:
 *   200 { ok: true, data: FraudOverview }
 *   500 Internal error
 */
router.get('/overview', optionalAuth, async (req, res) => {
  try {
    console.log('📊 [fraud] Generating fraud overview');

    const [overview, regionalAnalytics] = await Promise.all([
      getFraudOverview(),
      getRegionalAnalytics(),
    ]);

    return res.json({
      ok: true,
      data: {
        ...overview,
        regionalAnalytics,
      },
    });
  } catch (err) {
    console.error('[fraud] /overview error:', err.message);
    return res.status(500).json({
      ok: false,
      error: 'Failed to fetch fraud overview',
      details: err.message,
    });
  }
});

export default router;
