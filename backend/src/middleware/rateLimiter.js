import rateLimit from "express-rate-limit";

// General rate limit for all API routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests",
    message: "You have exceeded the request limit. Please try again later.",
  },
});

// Strict limit for sensitive routes (Hedera transactions)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests",
    message: "Transaction limit exceeded. Please wait before trying again.",
  },
});

// AI endpoints limit
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests",
    message: "AI request limit exceeded. Please slow down.",
  },
});
