# Hedera Edge Functions - Authentication & Testing Guide

## ðŸ” Understanding Supabase Edge Function Authentication

### Key Concepts

1. **`apikey` header** (ALWAYS required)
   - This is your Supabase project's anon key
   - Required for ALL Edge Function calls
   - Found in: Supabase Dashboard â†’ Settings â†’ API â†’ `anon` `public`

2. **`Authorization: Bearer` header** (conditionally required)
   - Contains a **user access token** (NOT the anon key)
   - Required only when `verify_jwt = true` in `config.toml`
   - Obtained from: `supabase.auth.getSession()` on client side

3. **verify_jwt setting** (per-function configuration)
   - `verify_jwt = true` (default): Requires authenticated user
   - `verify_jwt = false`: Allows anonymous/public access

### Common Confusion: Anon Key â‰  User Access Token

âŒ **WRONG:**
```bash
curl -H "Authorization: Bearer <ANON_KEY>"
```

âœ… **CORRECT for authenticated calls:**
```bash
curl -H "apikey: <ANON_KEY>" \
     -H "Authorization: Bearer <USER_ACCESS_TOKEN>"
```

âœ… **CORRECT for public calls (verify_jwt = false):**
```bash
curl -H "apikey: <ANON_KEY>"
```

---

## ðŸ“‹ Configuration Options

### Option 1: Public Access (No JWT verification)

**Use case:** Testing, public endpoints, service-to-service calls

**Configuration (`supabase/config.toml`):**
```toml
[functions.test-hedera-credentials]
verify_jwt = false

[functions.register-batch]
verify_jwt = false
```

**Testing:**
```bash
# Only apikey required
curl -X POST 'https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/test-hedera-credentials' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Option 2: Authenticated Access (JWT verification enabled)

**Use case:** Production, user-specific operations, protected endpoints

**Configuration (`supabase/config.toml`):**
```toml
[functions.test-hedera-credentials]
verify_jwt = true  # or omit (true is default)

[functions.register-batch]
verify_jwt = true
```

**Testing:**
```bash
# Both apikey AND user access token required
curl -X POST 'https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/test-hedera-credentials' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQwNzU...'
```

---

## ðŸ§ª Testing Commands

### Environment Setup

```bash
# Your Supabase project details
export SUPABASE_URL="https://udnpbqtvbnepicwyubnm.supabase.co"
export ANON_KEY="your_supabase_anon_key"

# Get user access token (from browser console after login):
# const { data: { session } } = await supabase.auth.getSession()
# console.log(session.access_token)
export USER_TOKEN="<paste_access_token_here>"
```

### Test 1: Hedera Credentials Check (Public Access)

```bash
# Test Hedera account connectivity
curl -X POST "${SUPABASE_URL}/functions/v1/test-hedera-credentials" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "id": "req_abc123",
  "success": true,
  "network": "testnet",
  "account": {
    "id": "0.0.12345",
    "balance": "100.00000000 â„",
    "keyType": "302a300506032b6570...",
    "isDeleted": false
  },
  "config": {
    "topicId": "0.0.67890",
    "hasSubmitKey": false,
    "operatorKeyFingerprint": "302e020100..."
  },
  "userId": "Anonymous",
  "message": "âœ… Credentials are valid and account is accessible"
}
```

### Test 2: Hedera Credentials Check (Authenticated Access)

```bash
# Test with user authentication
curl -X POST "${SUPABASE_URL}/functions/v1/test-hedera-credentials" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "id": "req_xyz789",
  "success": true,
  "network": "testnet",
  "account": { ... },
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "âœ… Credentials are valid and account is accessible"
}
```

### Test 3: Register Batch (Debug Mode)

```bash
# Debug mode - check environment variables and payload
curl -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "x-debug: 1" \
  -d '{
    "productType": "Organic Tomatoes",
    "quantity": "500",
    "location": "Farm A, Sector 7",
    "imageData": "https://example.com/tomatoes.jpg",
    "harvestDate": "15-03-2025"
  }'
```

**Expected Response:**
```json
{
  "id": "req_debug123",
  "debug": true,
  "envInfo": {
    "HEDERA_OPERATOR_ID": true,
    "HEDERA_OPERATOR_KEY": true,
    "HEDERA_TOPIC_ID": true,
    "SUPABASE_URL": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,
    "GEMINI_API_KEY": true,
    "GEMINI_MODEL": "gemini-3.1-flash-lite"
  },
  "received": {
    "productType": "Organic Tomatoes",
    "quantity": "500",
    "location": "Farm A, Sector 7",
    "imageData": "https://example.com/tomatoes.jpg",
    "harvestDate": "15-03-2025"
  }
}
```

### Test 4: Register Batch (Dry-Run Mode)

```bash
# Dry-run mode - validate without submitting to Hedera/DB
curl -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "x-dry-run: 1" \
  -d '{
    "productType": "Organic Tomatoes",
    "quantity": "500",
    "location": "Farm A, Sector 7",
    "imageData": "https://example.com/tomatoes.jpg",
    "harvestDate": "2025-03-15"
  }'
```

**Expected Response:**
```json
{
  "id": "req_dryrun456",
  "ok": true,
  "mode": "dry-run",
  "received": {
    "productType": "Organic Tomatoes",
    "quantity": "500",
    "location": "Farm A, Sector 7",
    "harvestDate": "2025-03-15",
    "imageDataLength": 35
  }
}
```

### Test 5: Register Batch (Real Submission)

```bash
# Real submission to Hedera HCS and Supabase DB
curl -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "productType": "Organic Tomatoes",
    "quantity": "500",
    "location": "Farm A, Sector 7",
    "imageData": "https://example.com/tomatoes.jpg",
    "harvestDate": "15-03-2025"
  }'
```

**Expected Success Response:**
```json
{
  "id": "req_real789",
  "success": true,
  "hcsTransactionId": "0.0.12345@1740750000.123456789",
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "ai_analysis": {
    "caption": "Fresh organic tomatoes",
    "anomalies": [],
    "confidence": 95,
    "tags": ["organic", "fresh", "tomatoes"],
    "generatedAt": "2025-01-28T15:30:00.000Z",
    "ms": 1234
  },
  "message": "Batch registered successfully on Hedera HCS"
}
```

---

## ðŸš¨ Common Errors & Solutions

### Error: `401 Invalid JWT`

**Cause:** Using anon key as Authorization Bearer when `verify_jwt = true`

**Solution:**
1. Get user access token from client:
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   const accessToken = session.access_token
   ```
2. Use in curl:
   ```bash
   curl -H "Authorization: Bearer ${accessToken}"
   ```

**OR** set `verify_jwt = false` in `config.toml` for public access.

### Error: `INVALID_SIGNATURE`

**Causes:**
1. `HEDERA_OPERATOR_KEY` doesn't match `HEDERA_OPERATOR_ID`
2. Topic requires submit key but `HEDERA_SUBMIT_KEY` not set
3. Network mismatch (key from testnet, but `HEDERA_NETWORK=mainnet`)
4. Hidden whitespace/newlines in private key

**Solutions:**
1. Verify key belongs to account:
   ```bash
   # Test credentials first
   curl -X POST "${SUPABASE_URL}/functions/v1/test-hedera-credentials" \
     -H "apikey: ${ANON_KEY}"
   ```

2. Check topic submit key requirement:
   ```bash
   # If topic has submitKey, set HEDERA_SUBMIT_KEY in Edge Function secrets
   ```

3. Verify network matches:
   ```bash
   # Ensure HEDERA_NETWORK env var matches where account exists
   ```

4. Clean private key:
   ```bash
   # Remove any spaces, newlines, or formatting
   # Edge function now auto-sanitizes keys
   ```

### Error: `INVALID_TOPIC_ID`

**Cause:** Topic doesn't exist on configured network

**Solution:**
1. Verify topic exists:
   ```bash
   # Check topic on HashScan
   # Testnet: https://hashscan.io/testnet/topic/0.0.YOUR_TOPIC_ID
   # Mainnet: https://hashscan.io/mainnet/topic/0.0.YOUR_TOPIC_ID
   ```

2. Ensure `HEDERA_NETWORK` matches topic's network

---

## ðŸ”§ Environment Variables Checklist

### Required for Both Functions

```bash
# Hedera Configuration
HEDERA_OPERATOR_ID=0.0.12345          # Your Hedera account ID
HEDERA_OPERATOR_KEY=302e020100...     # Private key (DER/ED25519/ECDSA)
HEDERA_TOPIC_ID=0.0.67890             # HCS topic ID
HEDERA_NETWORK=testnet                # or "mainnet"

# Optional: If topic requires submit key
HEDERA_SUBMIT_KEY=302e020100...       # Submit key private key

# Supabase (auto-provided by Edge Functions)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Optional: AI Analysis
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-3.1-flash-lite
```

### How to Set in Supabase

1. Go to: Supabase Dashboard â†’ Edge Functions â†’ Settings
2. Add each variable under "Secrets"
3. Redeploy functions after adding secrets

---

## ðŸ“¦ Postman Collection

### Collection Variables

```json
{
  "supabase_url": "https://udnpbqtvbnepicwyubnm.supabase.co",
  "anon_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_token": "<get_from_browser_console>"
}
```

### Request 1: Test Hedera Credentials (Public)

```
POST {{supabase_url}}/functions/v1/test-hedera-credentials
Headers:
  apikey: {{anon_key}}
  Content-Type: application/json
```

### Request 2: Test Hedera Credentials (Authenticated)

```
POST {{supabase_url}}/functions/v1/test-hedera-credentials
Headers:
  apikey: {{anon_key}}
  Authorization: Bearer {{user_token}}
  Content-Type: application/json
```

### Request 3: Register Batch (Debug)

```
POST {{supabase_url}}/functions/v1/register-batch
Headers:
  apikey: {{anon_key}}
  Content-Type: application/json
  x-debug: 1
Body (JSON):
{
  "productType": "Organic Tomatoes",
  "quantity": "500",
  "location": "Farm A",
  "imageData": "https://example.com/image.jpg",
  "harvestDate": "15-03-2025"
}
```

### Request 4: Register Batch (Dry-Run)

```
POST {{supabase_url}}/functions/v1/register-batch
Headers:
  apikey: {{anon_key}}
  Content-Type: application/json
  x-dry-run: 1
Body (JSON):
{
  "productType": "Organic Tomatoes",
  "quantity": "500",
  "location": "Farm A",
  "imageData": "https://example.com/image.jpg",
  "harvestDate": "2025-03-15"
}
```

### Request 5: Register Batch (Real)

```
POST {{supabase_url}}/functions/v1/register-batch
Headers:
  apikey: {{anon_key}}
  Content-Type: application/json
Body (JSON):
{
  "productType": "Organic Tomatoes",
  "quantity": "500",
  "location": "Farm A",
  "imageData": "https://example.com/image.jpg",
  "harvestDate": "15-03-2025"
}
```

---

## ðŸ” Debugging Tips

### 1. Check Edge Function Logs

```bash
# Real-time logs
supabase functions logs test-hedera-credentials --follow
supabase functions logs register-batch --follow
```

### 2. Verify Environment Variables

Use debug mode to check which env vars are set:

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
  -H "apikey: ${ANON_KEY}" \
  -H "x-debug: 1" \
  -d '{}'
```

### 3. Test Hedera Credentials Separately

Always test credentials before attempting batch registration:

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/test-hedera-credentials" \
  -H "apikey: ${ANON_KEY}"
```

### 4. Use Dry-Run for Validation

Test payload validation without side effects:

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/register-batch" \
  -H "apikey: ${ANON_KEY}" \
  -H "x-dry-run: 1" \
  -d '{ ... }'
```

### 5. Check for Hidden Characters in Keys

The functions now auto-sanitize keys, but you can verify manually:

```bash
# Check for hidden characters
echo -n "$HEDERA_OPERATOR_KEY" | od -c
```

---

## ðŸ“š Additional Resources

- [Supabase Edge Functions Auth](https://supabase.com/docs/guides/functions/auth)
- [Hedera SDK Documentation](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [Hedera Topic Submit Key](https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service/submit-a-message)
- [HashScan Explorer](https://hashscan.io/)

---

## âœ… Quick Checklist

Before deploying to production:

- [ ] Set all required environment variables in Supabase Edge Function secrets
- [ ] Test credentials with `test-hedera-credentials` function
- [ ] Verify topic exists on correct network (testnet/mainnet)
- [ ] Test batch registration in debug mode
- [ ] Test batch registration in dry-run mode
- [ ] Perform real submission test
- [ ] Configure `verify_jwt` based on security requirements
- [ ] Set up proper error monitoring and logging
- [ ] Document which endpoints require authentication
- [ ] Test with actual user access tokens (not anon key)
