# AgroDex - Deployment Checklist

## Prerequisites

### Backend Environment Variables
Create `backend/.env` with the following:

```bash
# Hedera Configuration
OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
OPERATOR_KEY=YOUR_PRIVATE_KEY
HEDERA_TOPIC_ID=0.0.YOUR_TOPIC_ID
MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

# Supabase Configuration
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Gemini AI Configuration
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_TIMEOUT_MS=6000

# Server Configuration
PORT=4000
NODE_ENV=development
```

### Get Gemini API Key
1. Visit https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy and paste into `GEMINI_API_KEY`

## Local Development

### 1. Install Dependencies

```bash
# Backend
cd backend
pnpm install

# Frontend
cd ..
pnpm install
```

### 2. Run Database Migrations

```bash
# Apply migrations to Supabase
# Option 1: Via Supabase Dashboard
# - Go to SQL Editor
# - Run each migration file in order:
#   - supabase/migrations/20250125_create_agri_trust_tables_clean.sql
#   - supabase/migrations/20250126_create_user_profiles.sql
#   - supabase/migrations/20250127_add_ai_fields.sql

# Option 2: Via Supabase CLI (if installed)
supabase db push
```

### 3. Create Hedera Topic (if needed)

```bash
cd backend
pnpm run create-topic
# Copy the topic ID to .env as HEDERA_TOPIC_ID
```

### 4. Seed Demo Data

```bash
cd backend
pnpm run seed-demo
# This will create a complete demo NFT with AI analysis
# Copy the verification URL from the output
```

### 5. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
pnpm run dev

# Terminal 2: Frontend
cd ..
pnpm run dev
```

### 6. Test the Application

1. **Health Check**: Visit http://localhost:4000/api/health/full
   - Should show `gemini: { ok: true, model: "gemini-3.1-flash-lite", ms: <number> }`

2. **Register Batch**: 
   - Go to http://localhost:5173/register
   - Fill in batch details
   - Submit and verify AI analysis appears

3. **Tokenize Batch**:
   - Go to http://localhost:5173/tokenize
   - Enter HCS transaction IDs from registration
   - Submit and verify AI provenance summary appears

4. **Verify Batch**:
   - Use the verification URL from seed script or tokenization
   - Verify AI summary, trust score, and buyer Q&A work

## Production Deployment

### Backend (e.g., Railway, Render, Fly.io)

1. Set all environment variables in your hosting platform
2. Deploy backend with:
   ```bash
   cd backend
   pnpm install
   pnpm run start
   ```

### Frontend (e.g., Vercel, Netlify)

1. Set environment variable:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

2. Build and deploy:
   ```bash
   pnpm run build
   ```

## Verification Checklist

- [ ] Backend health endpoint returns `ok: true` for all checks
- [ ] Gemini AI health check passes (shows model and response time)
- [ ] Register batch returns AI analysis with caption, tags, anomalies
- [ ] Tokenize batch returns AI provenance summary with trust score
- [ ] Verify batch shows complete timeline with AI summary
- [ ] Buyer Q&A returns answers with evidence transaction IDs
- [ ] All AI calls complete within timeout (< 6 seconds)
- [ ] Database caching works (second verify call is instant)

## Troubleshooting

### Gemini API Issues
- **Error: "API key not configured"**
  - Ensure `GEMINI_API_KEY` is set in backend/.env
  - Restart backend server

- **Error: "Timeout"**
  - Increase `GEMINI_TIMEOUT_MS` (default 6000ms)
  - Check network connectivity

### Database Issues
- **Error: "Missing table"**
  - Run all migrations in order
  - Check Supabase dashboard for table existence

### HCS Issues
- **Error: "Topic not found"**
  - Run `pnpm run create-topic` to create a new topic
  - Update `HEDERA_TOPIC_ID` in .env

## Performance Notes

### Expected AI Latencies
- Image Analysis: 800-2000ms
- Provenance Summary: 1500-3000ms
- Buyer Q&A: 1000-2500ms
- Translation: 800-1500ms
- Price Suggestion: 600-1200ms

### Optimization Tips
- AI results are cached in database (7-day TTL)
- Second verification of same NFT is instant (uses cache)
- Parallel AI calls not recommended (sequential is more reliable)
- Use demo mode for testing without wallet connection

## Demo Mode

For testing without HashPack wallet:
1. Add header `x-demo-mode: true` to tokenize requests
2. Backend will use operator credentials to mint NFT
3. Response includes `demo: true` flag

## Support

For issues or questions:
- Check logs in backend console
- Verify all environment variables are set
- Test health endpoint first
- Review Gemini API quota limits
