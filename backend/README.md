# AgroDex Backend Services

This directory contains the Node.js Express backend and documentation for the Supabase Edge Functions.

## AI Chatbot Configuration

The AI Chatbot relies on an Anthropic API Key to function correctly. The chatbot endpoint runs as a **Supabase Edge Function** (`supabase/functions/ai-chat/index.ts`).

### How to configure the AI Chatbot

1. **Get an API Key**: Obtain an API key from the [Anthropic Console](https://console.anthropic.com/).
2. **Set the Supabase Secret**:
   Open your terminal and use the Supabase CLI to configure the secret for your local or production project:
   ```bash
   # Set the secret for the Edge Function
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
3. **Restart the Edge Functions (Local)**:
   If you are running the project locally, restart your edge functions to pick up the new secret:
   ```bash
   npx supabase functions serve
   ```
4. **Deploy (Production)**:
   If deploying to production, make sure the secret is pushed and then deploy the function:
   ```bash
   npx supabase functions deploy ai-chat
   ```

If the API key is missing, the chatbot widget in the frontend will gracefully display an error indicating that configuration is required.

## Additional Variables

If you are running local development, you should also copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp .env.example .env
```
