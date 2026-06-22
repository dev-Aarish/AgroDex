#!/bin/bash

SUPABASE_URL="https://udnpbqtvbnepicwyubnm.supabase.co"
ANON_KEY="your_supabase_anon_key"

echo "=== Testing dashboard-stats ==="
curl -s -X GET "${SUPABASE_URL}/functions/v1/dashboard-stats" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n=== Testing dashboard-health ==="
curl -s -X GET "${SUPABASE_URL}/functions/v1/dashboard-health" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" | jq '.'
