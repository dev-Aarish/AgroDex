# Environment Variables Setup

## Required Variables

### Frontend (Vite)

The following environment variables are required for the frontend application:

```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_SUPABASE_URL=https://udnpbqtvbnepicwyubnm.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Where They Are Used

1. **`VITE_SUPABASE_URL`** - Supabase project URL

   - Used in: `src/lib/supabaseClient.ts`
   - Purpose: Base URL for Supabase API calls

2. **`VITE_SUPABASE_ANON_KEY`** - Supabase anonymous/public key

   - Used in: `src/lib/supabaseClient.ts`
   - Purpose: Authentication for client-side API calls
   - Note: This is a public key, safe to expose in frontend code

3. **`VITE_MIRROR_NODE_URL`** - Hedera Mirror Node URL

   - Purpose: Query Hedera network data

4. **`VITE_WALLETCONNECT_PROJECT_ID`** - WalletConnect project ID
   - Purpose: Enable wallet connection features
   - Note: Contributors must obtain their own WalletConnect project ID by registering on [WalletConnect Cloud](https://cloud.walletconnect.com/) and configure it in `.env`.

## Setup Instructions

### Development

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Retrieve your own WalletConnect Project ID from the [WalletConnect Cloud Dashboard](https://cloud.walletconnect.com/) and configure it as `VITE_WALLETCONNECT_PROJECT_ID` in your `.env` file.

3. The default values in `.env.example` are already configured for the current Supabase project.

4. Start the development server:
   ```bash
   pnpm dev
   ```

### Production/Preview

Environment variables are automatically loaded from the build environment. The current values are hardcoded in `src/lib/supabaseClient.ts` as a fallback.

## Current Configuration

### Supabase Edge Functions

- **JWT Verification**: DISABLED (`verify_jwt = false` in `supabase/config.toml`)
- **Authentication Mode**: Anonymous access with `apikey` header only
- **No Authorization header required** for Edge Function calls

### API Client Configuration

The Supabase client is configured in `src/lib/supabaseClient.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Service Worker Configuration

The Service Worker (`public/sw.js`) is configured to **NOT intercept** Supabase API calls:

```javascript
if (
  url.hostname.endsWith(".supabase.co") ||
  event.request.url.includes("/api/")
) {
  return; // Let the browser handle these requests directly
}
```

## Testing

### Console Test

To verify the configuration, run this in the browser console:

```javascript
fetch("https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/register-batch", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: "your_supabase_anon_key",
  },
  body: JSON.stringify({
    batchId: "TEST-UI",
    farmerId: "test-farmer-001",
    productType: "Test Product",
    quantity: 100,
    unit: "kg",
    harvestDate: "2025-10-02",
    location: "Test Location",
    certifications: [],
    qualityScore: 80,
    images: [],
    metadata: {},
  }),
})
  .then(async (r) => ({ status: r.status, data: await r.json() }))
  .then(console.log);
```

Expected result: `status: 200` with success response.

## Troubleshooting

### Service Worker Issues

If you see "from service worker" in Network tab:

1. Open DevTools > Application > Service Workers
2. Check "Bypass for network"
3. Click "Unregister" on the service worker
4. Hard reload (Ctrl+Shift+R or Cmd+Shift+R)

### 502 Bad Gateway

Check Supabase Edge Function logs:

- Dashboard: https://supabase.com/dashboard/project/udnpbqtvbnepicwyubnm/functions/register-batch/logs
- Look for timeout, missing env vars, or runtime errors

### Date Format Issues

The app accepts dates in two formats:

- `DD-MM-YYYY` (e.g., "11-11-2025") - converted to ISO
- `YYYY-MM-DD` (e.g., "2025-11-11") - used as-is

Conversion is handled automatically in `src/lib/api.ts` via `normalizeDate()` function.

## Gemini AI Configuration (Issue #7)

The registration flow uses **Gemini Flash Lite** for batch metadata analysis.

### Model

| Variable | Default | Notes |
|----------|---------|-------|
| `GEMINI_API_KEY` | *(required)* | Get from [Google AI Studio](https://aistudio.google.com/) |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Lightweight, fast, cost-efficient tier |
| `GEMINI_TIMEOUT_MS` | `6000` (Express) / `20000` (Edge Function) | Timeout in milliseconds |

### What the AI Analyses

During batch registration, Gemini analyses the **batch metadata fields** (no image upload required):

- **Product name** — flags unusual names (too short, special characters)
- **Quantity** — flags implausible values (zero, negative, >1,000,000)
- **Origin location** — flags vague single-word locations
- **Harvest date** — flags future dates and dates older than 3 years

### Response Shape

```json
{
  "caption": "500 kg of Organic Arabica Coffee from Kigali Region, Rwanda, harvested on 2025-10-15.",
  "anomalies": [],
  "confidence": 95,
  "tags": ["organic", "fresh"],
  "generatedAt": "2026-06-09T16:00:00.000Z",
  "ms": 412
}
```

Stored in the `batches.ai_analysis` JSONB column and displayed in the registration success panel.

### Supabase Edge Function Secrets

Set these in your Supabase project dashboard under **Settings → Edge Functions → Secrets**:

```
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3.1-flash-lite
```

### Graceful Degradation

If `GEMINI_API_KEY` is not set or Gemini times out, registration still completes normally — `ai_analysis` will be `null` in the response and the AI panel will not render in the UI.
