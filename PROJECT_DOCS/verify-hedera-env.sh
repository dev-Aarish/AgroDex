#!/bin/bash

echo "=== Checking Hedera environment variables ==="
echo ""

# Function call test-hedera-simple
SUPABASE_URL="https://udnpbqtvbnepicwyubnm.supabase.co"
SUPABASE_ANON_KEY="your_supabase_anon_key"

echo "Testing Hedera credentials via Edge Function..."

echo ""

RESPONSE=$(curl -s -X POST \
"${SUPABASE_URL}/functions/v1/test-hedera-simple" \
-H "Content-Type: application/json" \
-H "apikey: ${SUPABASE_ANON_KEY}" \
-d '{}')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check for success
if echo "$RESPONSE" | grep -q '"success":true'; then

echo "✅ Valid Hedera credentials!"

echo ""

echo "Now, test tokenization from /tokenize"
else

echo "❌ Credentials error!"
echo ""

echo "ACTIONS TO TAKE:"

echo "1. Go to Supabase Dashboard → Edge Functions → Settings → Secrets"

echo "2. Check HEDERA_OPERATOR_KEY:"

echo " - Must be a SINGLE continuous line"

echo " - No spaces before/after"

echo " - No line breaks"

echo "3. Check HEDERA_OPERATOR_ID:"

echo " - Format: 0.0.XXXXX"

echo "4. After modification, redeploy the function:"

echo " supabase functions deploy tokenize-batch"
fi