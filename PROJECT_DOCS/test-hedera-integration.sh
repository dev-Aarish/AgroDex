#!/bin/bash

# Hedera Edge Functions Integration Test Suite
# Tests both test-hedera-credentials and register-batch functions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="${SUPABASE_URL:-https://udnpbqtvbnepicwyubnm.supabase.co}"
ANON_KEY="${ANON_KEY:-your_supabase_anon_key}"

echo -e "${BLUE}â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—${NC}"
echo -e "${BLUE}â•‘   Hedera Edge Functions Integration Test Suite            â•‘${NC}"
echo -e "${BLUE}â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo ""
echo -e "${YELLOW}Supabase URL:${NC} $SUPABASE_URL"
echo -e "${YELLOW}Anon Key:${NC} ${ANON_KEY:0:20}..."
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local curl_cmd="$2"
    local expected_status="$3"
    
    echo -e "${BLUE}â–¶ Test:${NC} $test_name"
    
    # Run curl and capture response
    response=$(eval "$curl_cmd" 2>&1)
    status=$?
    
    # Check if curl succeeded
    if [ $status -eq 0 ]; then
        # Pretty print JSON response
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        
        # Check for success field in JSON
        success=$(echo "$response" | jq -r '.success // .ok // "unknown"' 2>/dev/null)
        
        if [ "$success" = "true" ]; then
            echo -e "${GREEN}âœ“ PASSED${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}âœ— FAILED - success field is not true${NC}"
            ((TESTS_FAILED++))
        fi
    else
        echo -e "${RED}âœ— FAILED - curl error${NC}"
        echo "$response"
        ((TESTS_FAILED++))
    fi
    
    echo ""
}

# Test 1: Test Hedera Credentials (Public Access)
echo -e "${YELLOW}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo -e "${YELLOW}Test Suite 1: Hedera Credentials Verification${NC}"
echo -e "${YELLOW}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo ""

run_test "Test Hedera Credentials (Public)" \
    "curl -s -X POST '${SUPABASE_URL}/functions/v1/test-hedera-credentials' \
        -H 'apikey: ${ANON_KEY}' \
        -H 'Authorization: Bearer ${ANON_KEY}' \
        -H 'Content-Type: application/json'" \
    200

# Test 2: Register Batch - Debug Mode
echo -e "${YELLOW}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo -e "${YELLOW}Test Suite 2: Register Batch - Debug Mode${NC}"
echo -e "${YELLOW}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo ""

run_test "Register Batch - Debug Mode (Check Env Vars)" \
    "curl -s -X POST '${SUPABASE_URL}/functions/v1/register-batch' \
        -H 'apikey: ${ANON_KEY}' \
        -H 'Content-Type: application/json' \
        -H 'x-debug: 1' \
        -d '{
            \"productType\": \"Organic Tomatoes\",
            \"quantity\": \"500\",
            \"location\": \"Farm A, Sector 7\",
            \"imageData\": \"https://example.com/tomatoes.jpg\",
            \"harvestDate\": \"15-03-2025\"
        }'" \
    200

# Test 3: Register Batch - Dry-Run Mode (DD-MM-YYYY format)
echo -e "${YELLOW}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo -e "${YELLOW}Test Suite 3: Register Batch - Dry-Run Mode${NC}"
echo -e "${YELLOW}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo ""

run_test "Register Batch - Dry-Run (DD-MM-YYYY format)" \
    "curl -s -X POST '${SUPABASE_URL}/functions/v1/register-batch' \
        -H 'apikey: ${ANON_KEY}' \
        -H 'Content-Type: application/json' \
        -H 'x-dry-run: 1' \
        -d '{
            \"productType\": \"Organic Carrots\",
            \"quantity\": \"300\",
            \"location\": \"Farm B, Sector 3\",
            \"imageData\": \"https://example.com/carrots.jpg\",
            \"harvestDate\": \"28-10-2025\"
        }'" \
    200

# Test 4: Register Batch - Dry-Run Mode (YYYY-MM-DD format)
run_test "Register Batch - Dry-Run (YYYY-MM-DD format)" \
    "curl -s -X POST '${SUPABASE_URL}/functions/v1/register-batch' \
        -H 'apikey: ${ANON_KEY}' \
        -H 'Content-Type: application/json' \
        -H 'x-dry-run: 1' \
        -d '{
            \"productType\": \"Organic Lettuce\",
            \"quantity\": \"200\",
            \"location\": \"Farm C, Sector 5\",
            \"imageData\": \"https://example.com/lettuce.jpg\",
            \"harvestDate\": \"2025-11-15\"
        }'" \
    200

# Test 5: Register Batch - Invalid Date Format (should fail)
echo -e "${YELLOW}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo -e "${YELLOW}Test Suite 4: Register Batch - Validation Tests${NC}"
echo -e "${YELLOW}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo ""

echo -e "${BLUE}â–¶ Test:${NC} Register Batch - Invalid Date Format (MM-DD-YYYY)"
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
    }' 2>&1)

echo "$response" | jq '.' 2>/dev/null || echo "$response"

# Check if error is returned
error=$(echo "$response" | jq -r '.error // "none"' 2>/dev/null)
if [ "$error" != "none" ]; then
    echo -e "${GREEN}âœ“ PASSED - Correctly rejected invalid date format${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}âœ— FAILED - Should have rejected MM-DD-YYYY format${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 6: Register Batch - Missing Required Field (should fail)
echo -e "${BLUE}â–¶ Test:${NC} Register Batch - Missing Required Field"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
    -H "apikey: ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -H "x-dry-run: 1" \
    -d '{
        "productType": "Test Product",
        "quantity": "100",
        "location": "Test Location"
    }' 2>&1)

echo "$response" | jq '.' 2>/dev/null || echo "$response"

error=$(echo "$response" | jq -r '.error // "none"' 2>/dev/null)
if [ "$error" != "none" ]; then
    echo -e "${GREEN}âœ“ PASSED - Correctly rejected missing required field${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}âœ— FAILED - Should have rejected missing imageData and harvestDate${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 7: Real Submission (Optional - uncomment to test actual Hedera submission)
echo -e "${YELLOW}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo -e "${YELLOW}Test Suite 5: Real Hedera Submission (Optional)${NC}"
echo -e "${YELLOW}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
echo ""

read -p "$(echo -e ${YELLOW}Do you want to test REAL Hedera submission? This will consume HBAR. [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    run_test "Register Batch - Real Submission" \
        "curl -s -X POST '${SUPABASE_URL}/functions/v1/register-batch' \
            -H 'apikey: ${ANON_KEY}' \
            -H 'Content-Type: application/json' \
            -d '{
                \"productType\": \"Test Batch - Integration Test\",
                \"quantity\": \"1\",
                \"location\": \"Test Farm - Automated Test\",
                \"imageData\": \"https://example.com/test-batch.jpg\",
                \"harvestDate\": \"28-10-2025\"
            }'" \
        200
else
    echo -e "${YELLOW}Skipping real submission test${NC}"
    echo ""
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
    echo -e "${RED}âœ— Some tests failed. Check the output above.${NC}"
    exit 1
fi
