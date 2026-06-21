#!/bin/bash

# Test Hedera Edge Functions
# Usage: SUPABASE_URL=... ANON_KEY=... ./run-tests.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—${NC}"
echo -e "${BLUE}â•‘   Hedera Edge Functions Test Suite                        â•‘${NC}"
echo -e "${BLUE}â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo ""

# Set default values if not provided
SUPABASE_URL="${SUPABASE_URL:-https://udnpbqtvbnepicwyubnm.supabase.co}"
ANON_KEY="${ANON_KEY:-your_supabase_anon_key}"

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Hedera Credentials
echo -e "${YELLOW}Test 1: Hedera Credentials Verification${NC}"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/test-hedera-credentials" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json")

echo "$response" | jq '.'
success=$(echo "$response" | jq -r '.success // false')

if [ "$success" = "true" ]; then
    echo -e "${GREEN}âœ“ PASSED${NC}\n"
    ((TESTS_PASSED++))
else
    echo -e "${RED}âœ— FAILED${NC}\n"
    ((TESTS_FAILED++))
fi

# Test 2: Register Batch - Debug Mode
echo -e "${YELLOW}Test 2: Register Batch - Debug Mode${NC}"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
    -H "apikey: ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -H "x-debug: 1" \
    -d '{
        "productType": "Organic Tomatoes",
        "quantity": "500",
        "location": "Farm A",
        "imageData": "https://example.com/tomatoes.jpg",
        "harvestDate": "15-03-2025"
    }')

echo "$response" | jq '.'
success=$(echo "$response" | jq -r '.success // false')

if [ "$success" = "true" ]; then
    echo -e "${GREEN}âœ“ PASSED${NC}\n"
    ((TESTS_PASSED++))
else
    echo -e "${RED}âœ— FAILED${NC}\n"
    ((TESTS_FAILED++))
fi

# Test 3: Register Batch - Dry-Run (DD-MM-YYYY)
echo -e "${YELLOW}Test 3: Register Batch - Dry-Run (DD-MM-YYYY)${NC}"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
    -H "apikey: ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -H "x-dry-run: 1" \
    -d '{
        "productType": "Organic Carrots",
        "quantity": "300",
        "location": "Farm B",
        "imageData": "https://example.com/carrots.jpg",
        "harvestDate": "28-10-2025"
    }')

echo "$response" | jq '.'
success=$(echo "$response" | jq -r '.success // false')

if [ "$success" = "true" ]; then
    echo -e "${GREEN}âœ“ PASSED${NC}\n"
    ((TESTS_PASSED++))
else
    echo -e "${RED}âœ— FAILED${NC}\n"
    ((TESTS_FAILED++))
fi

# Test 4: Register Batch - Dry-Run (YYYY-MM-DD)
echo -e "${YELLOW}Test 4: Register Batch - Dry-Run (YYYY-MM-DD)${NC}"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
    -H "apikey: ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -H "x-dry-run: 1" \
    -d '{
        "productType": "Organic Lettuce",
        "quantity": "200",
        "location": "Farm C",
        "imageData": "https://example.com/lettuce.jpg",
        "harvestDate": "2025-11-15"
    }')

echo "$response" | jq '.'
success=$(echo "$response" | jq -r '.success // false')

if [ "$success" = "true" ]; then
    echo -e "${GREEN}âœ“ PASSED${NC}\n"
    ((TESTS_PASSED++))
else
    echo -e "${RED}âœ— FAILED${NC}\n"
    ((TESTS_FAILED++))
fi

# Test 5: Invalid Date Format (should fail)
echo -e "${YELLOW}Test 5: Invalid Date Format (should reject)${NC}"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
    -H "apikey: ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -H "x-dry-run: 1" \
    -d '{
        "productType": "Test Product",
        "quantity": "100",
        "location": "Test Location",
        "imageData": "https://example.com/test.jpg",
        "harvestDate": "10-28-2025"
    }')

echo "$response" | jq '.'
error=$(echo "$response" | jq -r '.error // "none"')

if [ "$error" != "none" ]; then
    echo -e "${GREEN}âœ“ PASSED - Correctly rejected invalid date${NC}\n"
    ((TESTS_PASSED++))
else
    echo -e "${RED}âœ— FAILED - Should reject MM-DD-YYYY format${NC}\n"
    ((TESTS_FAILED++))
fi

# Test 6: Missing Required Field (should fail)
echo -e "${YELLOW}Test 6: Missing Required Field (should reject)${NC}"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
    -H "apikey: ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -H "x-dry-run: 1" \
    -d '{
        "productType": "Test Product",
        "quantity": "100",
        "location": "Test Location"
    }')

echo "$response" | jq '.'
error=$(echo "$response" | jq -r '.error // "none"')

if [ "$error" != "none" ]; then
    echo -e "${GREEN}âœ“ PASSED - Correctly rejected missing fields${NC}\n"
    ((TESTS_PASSED++))
else
    echo -e "${RED}âœ— FAILED - Should reject missing imageData/harvestDate${NC}\n"
    ((TESTS_FAILED++))
fi

# Summary
echo -e "${BLUE}â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—${NC}"
echo -e "${BLUE}â•‘                    Test Summary                            â•‘${NC}"
echo -e "${BLUE}â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo ""
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}âœ“ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}âœ— Some tests failed${NC}"
    exit 1
fi
