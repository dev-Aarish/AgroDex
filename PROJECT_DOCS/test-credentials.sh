#!/bin/bash
# Quick test for Hedera credentials

export SUPABASE_URL="https://udnpbqtvbnepicwyubnm.supabase.co"
export ANON_KEY="your_supabase_anon_key"

echo "Testing Hedera Credentials..."
curl -X POST "${SUPABASE_URL}/functions/v1/test-hedera-credentials" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" | jq .
