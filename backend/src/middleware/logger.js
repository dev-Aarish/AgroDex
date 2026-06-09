import morgan from "morgan";

// Custom token for request body size
morgan.token("body-size", (req) => {
  const body = JSON.stringify(req.body || {});
  return `${Buffer.byteLength(body, "utf8")}b`;
});

// Development logger — detailed output
export const devLogger = morgan(
  ":method :url :status :response-time ms - :body-size"
);

// Production logger — concise, no sensitive data
export const prodLogger = morgan(
  ":remote-addr :method :url :status :response-time ms",
  {
    skip: (req) => req.url === "/api/health/ping", // skip health check noise
  }
);

export const logger = process.env.NODE_ENV === "production"
  ? prodLogger
  : devLogger;
