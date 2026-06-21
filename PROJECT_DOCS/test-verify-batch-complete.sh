#!/bin/bash

# Test complet de verify-batch Edge Function
# Usage: ./test-verify-batch-complete.sh

set -e

SUPABASE_URL="https://udnpbqtvbnepicwyubnm.supabase.co"
FUNCTION_URL="${SUPABASE_URL}/functions/v1/verify-batch"
ANON_KEY="your_supabase_anon_key"

echo "ðŸ§ª Test complet verify-batch Edge Function"
echo "=========================================="
echo ""

# Test 1: OPTIONS (preflight CORS)
echo "ðŸ“‹ Test 1: OPTIONS (preflight CORS)"
echo "-----------------------------------"
curl -i -X OPTIONS "$FUNCTION_URL" 2>&1 | grep -E "(HTTP|access-control)"
echo ""
echo "âœ… Attendu: HTTP/2 200 + access-control-allow-origin: *"
echo ""
sleep 2

# Test 2: POST sans Authorization (payload invalide)
echo "ðŸ“‹ Test 2: POST sans payload (validation error)"
echo "-----------------------------------------------"
curl -i -X POST "$FUNCTION_URL" \
  -H 'Content-Type: application/json' \
  -d '{}' 2>&1 | head -20
echo ""
echo "âœ… Attendu: HTTP/2 400 + { stage: 'validation', error: '...' }"
echo ""
sleep 2

# Test 3: POST avec payload valide, sans Authorization
echo "ðŸ“‹ Test 3: POST avec payload valide (sans auth)"
echo "-----------------------------------------------"
curl -i -X POST "$FUNCTION_URL" \
  -H 'Content-Type: application/json' \
  -d '{"tokenId":"0.0.7160982","serialNumber":"1"}' 2>&1 | head -30
echo ""
echo "âœ… Attendu: HTTP/2 200 ou 404 (NFT not found) - PAS 404 (route not found)"
echo ""
sleep 2

# Test 4: POST avec Authorization header
echo "ðŸ“‹ Test 4: POST avec Authorization (Bearer anon key)"
echo "----------------------------------------------------"
curl -i -X POST "$FUNCTION_URL" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"tokenId":"0.0.7160982","serialNumber":"1"}' 2>&1 | head -30
echo ""
echo "âœ… Attendu: HTTP/2 200 (si NFT existe) ou 404 (si NFT n'existe pas en DB)"
echo ""

echo ""
echo "ðŸŽ¯ RÃ©sumÃ© des tests"
echo "==================="
echo ""
echo "Si vous voyez 404 sur TOUS les tests POST:"
echo "  â†’ La fonction n'est PAS dÃ©ployÃ©e"
echo "  â†’ Solution: supabase functions deploy verify-batch --project-ref mrbfrwtymikayrbrzgmp"
echo ""
echo "Si vous voyez 200/400/404 (avec body JSON):"
echo "  â†’ La fonction EST dÃ©ployÃ©e et fonctionne"
echo "  â†’ VÃ©rifier les logs: supabase functions logs verify-batch --follow"
echo ""
echo "Logs attendus dans Supabase Dashboard:"
echo "  ==> VERIFY-BATCH REQUEST RECEIVED <=="
echo "  Method: POST"
echo "  Stage: Parsing request body"
echo ""
