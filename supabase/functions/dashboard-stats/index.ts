import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://agro-dex-6sp2.vercel.app, https://agro-dex-psi.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Execute all queries in parallel
    const [
      batchesResult,
      nftsResult,
      aiVerifiedResult,
      allBatchesResult
    ] = await Promise.all([
      // Count total batches
      supabaseClient.from('batches').select('*', { count: 'exact', head: true }),
      
      // Count total NFTs (batches that have been tokenized)
      supabaseClient.from('batches').select('*', { count: 'exact', head: true }).not('hedera_token_id', 'is', null),
      
      // Count AI-verified batches
      supabaseClient.from('batches').select('*', { count: 'exact', head: true }).not('ai_provenance_summary', 'is', null),
      
      // Get all batches with AI analysis for client-side filtering
      supabaseClient
        .from('batches')
        .select('hedera_token_id, hedera_serial_number, ai_provenance_summary')
        .not('ai_provenance_summary', 'is', null)
        .order('created_at', { ascending: false })
    ]);

    // Check for errors
    if (batchesResult.error) throw batchesResult.error;
    if (nftsResult.error) throw nftsResult.error;
    if (aiVerifiedResult.error) throw aiVerifiedResult.error;
    if (allBatchesResult.error) throw allBatchesResult.error;

    const totalBatches = batchesResult.count || 0;
    const totalNfts = nftsResult.count || 0;
    const aiVerified = aiVerifiedResult.count || 0;
    
    // Parse AI provenance summary (text field containing JSON)
    const allBatches = (allBatchesResult.data || []).map((item: any) => {
      let parsedSummary = null;
      if (item.ai_provenance_summary) {
        try {
          parsedSummary = typeof item.ai_provenance_summary === 'string'
            ? JSON.parse(item.ai_provenance_summary)
            : item.ai_provenance_summary;
        } catch (e) {
          console.error('Failed to parse ai_provenance_summary:', e);
        }
      }
      return {
        token_id: item.hedera_token_id,
        serial_number: item.hedera_serial_number,
        summary: parsedSummary
      };
    });
    
    // Filter approved and flagged lots
    const approvedLots = allBatches
      .filter(item => item.summary?.trustScore >= 80)
      .slice(0, 3)
      .map(item => ({
        token_id: item.token_id,
        serial_number: item.serial_number,
        score: item.summary.trustScore
      }));
    
    const flaggedLots = allBatches
      .filter(item => item.summary?.trustScore < 80)
      .slice(0, 3)
      .map(item => ({
        token_id: item.token_id,
        serial_number: item.serial_number,
        score: item.summary.trustScore,
        rationale: item.summary.trustExplanation || 'Aucune explication disponible'
      }));

    // Generate AI insight fallback
    let aiInsight = 'Analyse IA en cours...';
    if (totalNfts > 0) {
      aiInsight = `L'activité est stable, avec ${aiVerified} lots vérifiés par l'IA${flaggedLots.length > 0 ? `, dont ${flaggedLots.length} signalé(s) pour révision manuelle` : ''}.`;
    } else {
      aiInsight = 'Aucune activité détectée. Commencez par enregistrer votre premier lot.';
    }

    return new Response(
      JSON.stringify({
        ok: true,
        kpis: {
          totalBatches,
          totalNfts,
          aiVerified
        },
        audit: {
          approvedLots,
          flaggedLots
        },
        aiInsight
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Failed to fetch dashboard statistics',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
