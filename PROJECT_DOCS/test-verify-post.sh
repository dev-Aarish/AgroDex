#!/bin/bash

# Test verify-batch POST with anon key
curl -i -X POST 'https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/verify-batch' \
  -H 'Content-Type: application/json' \
  -H 'apikey: your_supabase_anon_key' \
  -d '{"tokenId":"0.0.7160672","serialNumber":"1"}'
