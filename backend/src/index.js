import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./utils/config.js";
import apiRoutes from "./routes/api.js";
import healthRoutes from "./routes/health.js";
import aiRoutes from "./routes/ai.js";
import { getHederaClient } from "./hederaClient.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { logger } from "./middleware/logger.js";
import EventEmitter from 'events';

// Fix for EventEmitter memory leak warning
EventEmitter.defaultMaxListeners = 50;
const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      /localhost:\d+$/,
      /https:\/\/.*\.codenut\.dev$/,
      "http://localhost:5173",
      "http://localhost:3000",
      "https://agro-dex-nine.vercel.app",
      "https://agro-dex-1u85.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(logger);
app.use("/api", generalLimiter);
app.use("/api", healthRoutes);
app.use("/api", apiRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "AgroDex API",
    version: "1.0.0",
    description: "Backend API for agricultural batch traceability using Hedera Hashgraph",
    endpoints: {
      healthPing: "GET /api/health/ping",
      healthDb: "GET /api/health/db",
      healthFull: "GET /api/health/full",
      registerBatch: "POST /api/register-batch",
      tokenizeBatch: "POST /api/tokenize-batch",
      verifyBatch: "GET /api/verify-batch/:tokenId/:serialNumber",
      ai: {
        analyzeImage: "POST /api/ai/analyze-image",
        summarizeProvenance: "POST /api/ai/summarize-provenance",
        buyerQA: "POST /api/ai/buyer-qa",
        translateMarketing: "POST /api/ai/translate-marketing",
        priceSuggestion: "POST /api/ai/price-suggestion",
      },
    },
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

try {
  getHederaClient();
} catch (error) {
  console.error("Failed to initialize Hedera client:", error.message);
  process.exit(1);
}

const PORT = env.PORT || 4000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`AgroDex API running on http://localhost:${PORT}`);
});
