#!/bin/bash

# Test script for register-batch Edge Function (UI simulation)
# This simulates the exact call made by the frontend
# Supports both JWT-enabled and JWT-disabled modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    # Use hardcoded values from .env.example
    export SUPABASE_URL="https://udnpbqtvbnepicwyubnm.supabase.co"
    export SUPABASE_ANON_KEY="your_supabase_anon_key"
fi

# Check required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set${NC}"
    echo "Please set them in your .env file or export them"
    exit 1
fi

# Test mode: with or without JWT
MODE="${1:-both}"  # Options: jwt, no-jwt, both

echo -e "${YELLOW}Testing register-batch Edge Function (UI simulation)${NC}"
echo "=================================================="
echo -e "${BLUE}Mode: $MODE${NC}"
echo ""

# Test payload matching frontend format
PAYLOAD='{
  "productType": "CafÃ© Arabica",
  "quantity": "500",
  "location": "RÃ©gion de Dschang, Cameroun",
  "imageData": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800",
  "harvestDate": "15-01-2025"
}'

echo -e "${YELLOW}Request Payload:${NC}"
echo "$PAYLOAD" | jq '.'
echo ""

# Function to test with specific headers
test_request() {
  local test_name="$1"
  local auth_header="$2"
  
  echo -e "${BLUE}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${NC}"
  echo -e "${YELLOW}Test: $test_name${NC}"
  echo -e "${BLUE}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${NC}"
  
  if [ -n "$auth_header" ]; then
    echo -e "${BLUE}Headers: apikey + Authorization${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" \
      -X POST \
      "${SUPABASE_URL}/functions/v1/register-batch" \
      -H "Content-Type: application/json" \
      -H "apikey: ${SUPABASE_ANON_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
      -H "x-debug: 1" \
      -d "$PAYLOAD")
  else
    echo -e "${BLUE}Headers: apikey only (no Authorization)${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" \
      -X POST \
      "${SUPABASE_URL}/functions/v1/register-batch" \
      -H "Content-Type: application/json" \
      -H "apikey: ${SUPABASE_ANON_KEY}" \
      -H "x-debug: 1" \
      -d "$PAYLOAD")
  fi
  
  # Extract HTTP status code (last line)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  # Extract response body (all but last line)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  echo ""
  echo -e "${YELLOW}HTTP Status Code:${NC} $HTTP_CODE"
  echo ""
  
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo -e "${GREEN}âœ“ Success!${NC}"
    echo ""
    echo -e "${YELLOW}Response:${NC}"
    echo "$BODY" | jq '.'
    return 0
  else
    echo -e "${RED}âœ— Error (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo -e "${YELLOW}Error Response:${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    
    if [ "$HTTP_CODE" = "401" ]; then
      echo ""
      echo -e "${YELLOW}ðŸ’¡ Solution:${NC}"
      echo "1. DÃ©sactiver JWT: Supabase Dashboard â†’ Edge Functions â†’ register-batch â†’ DÃ©sactiver 'Verify JWT'"
      echo "2. OU redÃ©ployer: supabase functions deploy register-batch --no-verify-jwt"
      echo "3. OU tester avec Authorization header (voir mode 'jwt')"
    fi
    return 1
  fi
}

# Run tests based on mode
if [ "$MODE" = "jwt" ] || [ "$MODE" = "both" ]; then
  test_request "With JWT (Authorization header)" "yes"
  JWT_RESULT=$?
fi

if [ "$MODE" = "no-jwt" ] || [ "$MODE" = "both" ]; then
  if [ "$MODE" = "both" ]; then
    echo ""
    echo ""
  fi
  test_request "Without JWT (apikey only)" ""
  NO_JWT_RESULT=$?
fi

echo ""
echo -e "${BLUE}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${NC}"
echo -e "${YELLOW}Summary${NC}"
echo -e "${BLUE}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${NC}"

if [ "$MODE" = "both" ]; then
  if [ $JWT_RESULT -eq 0 ]; then
    echo -e "${GREEN}âœ“ JWT mode: Working${NC}"
  else
    echo -e "${RED}âœ— JWT mode: Failed${NC}"
  fi
  
  if [ $NO_JWT_RESULT -eq 0 ]; then
    echo -e "${GREEN}âœ“ No-JWT mode: Working (verify_jwt = false is active)${NC}"
  else
    echo -e "${RED}âœ— No-JWT mode: Failed (verify_jwt may still be true)${NC}"
  fi
fi

echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  supabase functions logs register-batch --limit 20"
echo "  supabase functions deploy register-batch --no-verify-jwt"
echo ""
echo -e "${YELLOW}Test modes:${NC}"
echo "  ./test-register-ui.sh jwt      # Test with Authorization header"
echo "  ./test-register-ui.sh no-jwt   # Test without Authorization header"
echo "  ./test-register-ui.sh both     # Test both modes (default)"
echo "=================================================="
