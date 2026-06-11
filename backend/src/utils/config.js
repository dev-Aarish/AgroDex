import { cleanEnv, str, num } from "envalid";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Force load .env file with override to bypass system env vars
dotenv.config({ path: join(__dirname, "../../.env"), override: true });

// Debug: Log what we're getting
console.log("🔍 Debug - SUPABASE_SERVICE_ROLE_KEY from process.env:");
console.log("   Value:", process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("   Length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
console.log(
  "   Starts with eyJ:",
  process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith("eyJ")
);

export const env = cleanEnv(process.env, {
  SUPABASE_URL: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(),
  SUPABASE_ANON_KEY: str(),
  HEDERA_OPERATOR_ID: str(),
  HEDERA_OPERATOR_KEY: str({ default: "" }),
  HEDERA_TOPIC_ID: str(),
  MIRROR_NODE_URL: str({ default: "https://testnet.mirrornode.hedera.com" }),
  GEMINI_API_KEY: str(),
  PORT: num({ default: 4000 }),
  NODE_ENV: str({ default: "development" }),
  FRONTEND_URL: str({ default: "http://localhost:5173" }),
});

// Clean HEDERA_OPERATOR_KEY: remove 0x prefix if present
if (env.HEDERA_OPERATOR_KEY.startsWith("0x")) {
  process.env.HEDERA_OPERATOR_KEY = env.HEDERA_OPERATOR_KEY.slice(2);
}

// Backward compatibility: set OPERATOR_ID and OPERATOR_KEY for legacy code
process.env.OPERATOR_ID = env.HEDERA_OPERATOR_ID;
process.env.OPERATOR_KEY = env.HEDERA_OPERATOR_KEY;

// Extra guard: ensure real Service Role Secret (JWT)
if (
  env.SUPABASE_SERVICE_ROLE_KEY.length < 100 ||
  !env.SUPABASE_SERVICE_ROLE_KEY.startsWith("eyJ")
) {
  throw new Error(
    'Invalid SUPABASE_SERVICE_ROLE_KEY: expected long JWT (starts with "eyJ", length >= 100). ' +
      "Copy the Service Role Secret from Supabase → Settings → API → service_role (secret) and restart."
  );
}

console.log("✅ Environment validation passed");
console.log(
  `   Service Role Key length: ${env.SUPABASE_SERVICE_ROLE_KEY.length} chars`
);
