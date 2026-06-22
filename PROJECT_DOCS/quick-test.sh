#!/bin/bash

# Quick test script with hardcoded values
# Use this for quick testing without .env file

export SUPABASE_URL="https://udnpbqtvbnepicwyubnm.supabase.co"
export SUPABASE_ANON_KEY="=your_supabase_anon_key"

# Run the test script
./test-register-ui.sh "$@"
