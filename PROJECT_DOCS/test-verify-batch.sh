#!/bin/bash

echo "=== Test 1: VÃ©rification de la fonction Edge Function (OPTIONS) ==="
curl -i -X OPTIONS 'https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/verify-batch'

echo -e "\n\n=== Test 2: VÃ©rification sans auth (doit retourner 401) ==="
curl -i -X POST 'https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/verify-batch' \
  -H 'Content-Type: application/json' \
  -d '{"tokenId":"0.0.7155752","serialNumber":"1"}'

echo -e "\n\n=== Test 3: VÃ©rification avec anon key ==="
curl -i -X POST 'https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/verify-batch' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your_supabase_anon_key' \
  -d '{"tokenId":"0.0.7155752","serialNumber":"1"}'

echo -e "\n\n=== Test 4: VÃ©rification avec apikey ==="
curl -i -X POST 'https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/verify-batch' \
  -H 'Content-Type: application/json' \
  -H 'apikey: your_supabase_anon_key' \
  -d '{"tokenId":"0.0.7155752","serialNumber":"1"}'
