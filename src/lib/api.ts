import { supabase } from "./supabaseClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://agro-dex-nine.vercel.app";

/**
 * Normalize date from DD-MM-YYYY to YYYY-MM-DD (ISO date-only format)
 * Also accepts YYYY-MM-DD and returns it unchanged
 */
export function normalizeDate(input: string): string {
  // If already YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  // Handle DD-MM-YYYY format (e.g., "28-10-2025")
  const dmyMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(input);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    const dayNum = parseInt(dd, 10);
    const monthNum = parseInt(mm, 10);

    // Validate ranges to reject ambiguous US format (MM-DD-YYYY)
    if (dayNum < 1 || dayNum > 31) {
      throw new Error(`Invalid date format: Invalid day: ${dd}. Expected DD-MM-YYYY or YYYY-MM-DD`);
    }

    if (monthNum < 1 || monthNum > 12) {
      throw new Error(
        `Invalid date format: Invalid month: ${mm}. Expected DD-MM-YYYY or YYYY-MM-DD`,
      );
    }

    return `${yyyy}-${mm}-${dd}`;
  }

  // Invalid format
  throw new Error(
    `Invalid date format: ${input}. Expected DD-MM-YYYY or YYYY-MM-DD`,
  );
}

export interface RegisterBatchRequest {
  productType: string;
  quantity: string;
  location: string;
  imageData: string;
  harvestDate: string;
  aiVerification?: unknown;
}

export interface VerifyRegistrationRequest {
  productName: string;
  harvestBatch: string;
  quantity: string;
  unit: string;
  location: string;
  harvestDate: string;
  metadata?: string;
}

export interface VerifyRegistrationResponse {
  ok: boolean;
  data: {
    productSummary: string;
    verificationSummary: {
      quantity: string;
      harvestBatch: string;
      location: string;
      harvestDate: string;
    };
    warnings: string[];
    consistencyChecks: string[];
    cooperativeReadiness: {
      status: string;
      notes: string[];
    };
    statistics: {
      batchNumber: string;
      quantity: string;
      location: string;
      harvestDate: string;
    };
    fallback?: boolean;
    warningMessage?: string;
    ms?: number;
    error?: string;
  };
}

export interface RegisterBatchResponse {
  success: boolean;
  hcsTransactionId: string;
  batchId: string;
  ai_analysis?: {
    caption: string;
    anomalies: string[];
    confidence: number;
    tags: string[];
    generatedAt: string;
    ms: number;
  };
  message: string;
}

export interface TokenizeBatchRequest {
  hcsTransactionIds: string[];
  batchId?: string;
}

export interface TokenizeBatchResponse {
  success: boolean;
  tokenId: string;
  serialNumber: string;
  batchId?: string;
  hcsTransactionIds: string[];
  ai_summary?: {
    summary_en: string;
    summary_fr: string;
    timeline: Array<{
      timestamp: string;
      event: string;
      txId: string;
    }>;
    trustScore: number;
    trustExplanation: string;
    generatedAt: string;
    ms: number;
  };
  message: string;
}

export interface VerifyBatchResponse {
  success: boolean;
  cached: boolean;
  tokenId: string;
  serialNumber: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nftMetadata: any;
  hcsTransactionIds: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hcsMessages: any[];
  ai_summary?: {
    summary_en: string;
    summary_fr: string;
    timeline: Array<{
      timestamp: string;
      event: string;
      txId: string;
    }>;
    trustScore: number;
    trustExplanation: string;
    generatedAt: string;
    ms: number;
  };
  verifiedAt: string;
  status: string;
  batch?: {
    id: string;
    batch_name: string;
    product_type: string;
    quantity: string;
    location: string;
    harvest_date: string;
    photo_url: string;
    hcs_tx_id: string;
    created_at: string;
    hedera_token_id?: string;
    hedera_serial_number?: string;
    tokenized_at?: string;
    qr_code_url?: string;
    deleted_at?: string;
  };
}

export interface VerifyBatchNotFoundResult {
  verified: false;
  reason: "not_found";
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface VerifyBatchDeletedResult {
  verified: false;
  reason: "deleted";
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export type VerifyBatchResult = VerifyBatchResponse | VerifyBatchNotFoundResult | VerifyBatchDeletedResult;

export const registerBatch = async (
  data: RegisterBatchRequest,
): Promise<RegisterBatchResponse> => {
  // Normalize harvestDate before sending
  const normalizedData = {
    ...data,
    harvestDate: data.harvestDate
      ? normalizeDate(data.harvestDate)
      : new Date().toISOString().split("T")[0],
  };

  // Get current session to include Authorization header
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};

  // If user is logged in, include Authorization header
  // If not logged in, only apikey will be sent (requires verify_jwt = false on function)
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const { data: result, error } = await supabase.functions.invoke(
    "register-batch",
    {
      body: normalizedData,
      headers,
    },
  );

  if (error) {
    // Try to extract structured error from Edge Function response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let serverError: any = null;
    try {
      serverError = JSON.parse(error.message);
    } catch {
      // If not JSON, use raw error message
    }

    const requestId = serverError?.id ? ` (Request ID: ${serverError.id})` : "";
    const errorMessage =
      serverError?.message ||
      serverError?.error ||
      error.message ||
      "Failed to register batch";
    const hint = serverError?.hint ? `\n💡 ${serverError.hint}` : "";

    throw new Error(`${errorMessage}${requestId}${hint}`);
  }

  return result;
};

export function generateLocalFallbackVerification(data: VerifyRegistrationRequest) {
  const { productName, harvestBatch, quantity, unit, location, harvestDate } = data;
  const cleanQty = quantity ? String(quantity).trim() : '';
  const cleanUnit = unit ? String(unit).trim() : '';
  const qtyStr = cleanQty ? `${cleanQty} ${cleanUnit}` : '';
  
  const productSummary = `You are about to register ${qtyStr || 'an unspecified quantity of'} ${productName || 'product'} from ${location || 'an unspecified location'} under Harvest Batch ${harvestBatch || 'N/A'} harvested on ${harvestDate || 'an unspecified date'}.`;
  
  const warnings: string[] = [];
  const consistencyChecks: string[] = [];
  const notes: string[] = [];
  
  if (!productName || productName.trim().length < 3) {
    warnings.push("Product name is missing or too short");
    notes.push("Product name verification failed");
  } else {
    notes.push("Product name verified locally");
  }

  if (!harvestBatch || harvestBatch.trim() === '') {
    warnings.push("Harvest batch not specified");
    notes.push("Harvest batch missing");
  } else {
    notes.push("Harvest batch info complete");
  }

  if (!cleanQty) {
    warnings.push("Quantity not specified");
    notes.push("Quantity verification failed");
  } else {
    const parsedQty = parseFloat(cleanQty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      warnings.push("Quantity must be a positive number");
      notes.push("Quantity invalid");
    } else if (parsedQty > 1000000) {
      consistencyChecks.push("Quantity appears unusually large");
      notes.push("Quantity is unusually large");
    } else {
      notes.push("Quantity verified");
    }
  }

  if (!location || location.trim().length < 3) {
    warnings.push("Harvest location missing or too vague");
    notes.push("Location verification failed");
  } else {
    notes.push("Location provided");
  }

  if (!harvestDate) {
    warnings.push("Harvest date not specified");
    notes.push("Harvest date missing");
  } else {
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      if (harvestDate > todayISO) {
        consistencyChecks.push("Future harvest date detected");
        notes.push("Harvest date is in the future");
      } else {
        notes.push("Harvest date verified");
      }
    } catch {
      notes.push("Harvest date checked");
    }
  }

  const status = warnings.length > 0 || consistencyChecks.length > 0 ? "Review Required" : "Ready";

  return {
    productSummary,
    verificationSummary: {
      quantity: cleanQty ? `Provided: ${qtyStr}` : "Quantity not specified",
      harvestBatch: harvestBatch ? `Provided: ${harvestBatch}` : "Harvest batch not specified",
      location: location ? `Provided: ${location}` : "Location not specified",
      harvestDate: harvestDate ? `Provided: ${harvestDate}` : "Harvest date not specified"
    },
    warnings,
    consistencyChecks,
    cooperativeReadiness: {
      status,
      notes
    },
    statistics: {
      batchNumber: harvestBatch || "N/A",
      quantity: qtyStr || "N/A",
      location: location || "N/A",
      harvestDate: harvestDate || "N/A"
    },
    fallback: true,
    warningMessage: "AI verification unavailable. Manual review recommended."
  };
}

export const verifyRegistration = async (
  data: VerifyRegistrationRequest,
): Promise<VerifyRegistrationResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/verify-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Response was not JSON");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.warn("Express AI verification unavailable, falling back to local verification:", error);
    return {
      ok: true,
      data: generateLocalFallbackVerification(data)
    };
  }
};

export const tokenizeBatch = async (
  data: TokenizeBatchRequest,
  isDemoMode: boolean = false,
): Promise<TokenizeBatchResponse> => {
  console.log(
    "[api] Calling tokenize-batch with:",
    data,
    "Demo mode:",
    isDemoMode,
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  if (isDemoMode) {
    headers["x-demo-mode"] = "true";
  }

  const response = await fetch(
    "https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/tokenize-batch",
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();
  console.log("[api] Response:", { status: response.status, result });

  if (!response.ok) {
    console.error("[api] Tokenize batch error:", result);
    console.error("[api] Full response:", response);

    const errorDetails = result?.error || "Failed to tokenize batch";
    const errorStack = result?.details || "";
    const timestamp = result?.timestamp || "";

    throw new Error(
      `${errorDetails}${errorStack ? "\n\nDetails: " + errorStack : ""}${
        timestamp ? "\n\nTime: " + timestamp : ""
      }`,
    );
  }

  return result;
};

export const verifyBatch = async (
  tokenId: string,
  serialNumber: string | number,
): Promise<VerifyBatchResult> => {
  const res = await fetch(
    "https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/verify-batch",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId, serialNumber: Number(serialNumber) }),
    },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // Ignore JSON parse errors here; they are handled below via res.ok
  }

  if (res.status === 404 && json?.stage === "database_query") {
    return { verified: false, reason: "not_found", details: json };
  }

  if (!res.ok) {
    const msg = json?.error ?? json?.message ?? `HTTP ${res.status}`;
    throw new Error(`verify-batch failed: ${msg}`);
  }

  return json as VerifyBatchResponse;
};

export const verifyBatchById = async (
  batchId: string,
): Promise<VerifyBatchResult> => {
  const res = await fetch(`${API_BASE_URL}/api/batches/${batchId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // Ignore JSON parse errors
  }

  if (res.status === 404) {
    return { verified: false, reason: "not_found", details: json };
  }

  if (res.status === 410) {
    return { verified: false, reason: "deleted", details: json };
  }

  if (!res.ok) {
    const msg = json?.error ?? json?.message ?? `HTTP ${res.status}`;
    throw new Error(`verifyBatchById failed: ${msg}`);
  }

  return json as VerifyBatchResponse;
};

export const checkHealth = async () => {
  const { data: result, error } = await supabase.functions.invoke("health");

  if (error) {
    throw new Error(error.message || "Health check failed");
  }

  return result;
};

export const getDashboardStats = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/dashboard-stats`, {
    method: "GET",
    headers,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.details ||
      `dashboard-stats failed: HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
};

export const getDashboardHealth = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/dashboard-health`, {
    method: "GET",
    headers,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.details ||
      `dashboard-health failed: HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
};

// ─────────────────────────────────────────────────────────────
// Fraud Detection API
// ─────────────────────────────────────────────────────────────

export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FraudSignal {
  signal: string;
  detected: boolean;
  weight: number;
  description: string;
}

export interface FraudScore {
  id?: string;
  batchId: string;
  farmerId: string | null;
  batchName: string | null;
  location: string | null;
  productType?: string | null;
  quantity?: string | null;
  riskScore: number;
  riskLevel: RiskLevel;
  riskColor: string;
  reasons: FraudSignal[];
  triggeredSignals?: FraudSignal[];
  triggeredCount?: number;
  aiExplanation: string | null;
  generatedAt: string;
  createdAt?: string;
  cached?: boolean;
}

export interface FraudLevelCounts {
  SAFE: number;
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface FraudTrendPoint {
  date: string;
  SAFE: number;
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
  avgScore: number;
}

export interface RegionalAnalyticsPoint {
  region: string;
  displayName: string;
  totalBatches: number;
  flaggedBatches: number;
  avgScore: number;
}

export interface FarmerRankingEntry {
  farmerId: string;
  batchCount: number;
  maxScore: number;
  worstLevel: RiskLevel;
  avgScore: number;
}

export interface FraudOverview {
  summary: {
    totalAnalyzed: number;
    safeCount: number;
    lowCount: number;
    mediumCount: number;
    highCount: number;
    criticalCount: number;
    flaggedCount: number;
    safeRate: number;
  };
  levelCounts: FraudLevelCounts;
  topRiskyBatches: FraudScore[];
  farmerRanking: FarmerRankingEntry[];
  trend: FraudTrendPoint[];
  regionalAnalytics: RegionalAnalyticsPoint[];
  generatedAt: string;
}

/**
 * Helper to build auth headers for fraud API calls.
 */
async function buildAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

/**
 * Analyze a single batch for fraud signals.
 * Results are cached server-side for 1 hour.
 */
export const getFraudByBatch = async (
  batchId: string,
  forceRefresh = false,
): Promise<{ ok: boolean; data: FraudScore }> => {
  const headers = await buildAuthHeaders();
  const url = `${API_BASE_URL}/api/fraud/batch/${batchId}${forceRefresh ? '?refresh=true' : ''}`;
  const response = await fetch(url, { method: 'GET', headers });

  let payload: { ok: boolean; data: FraudScore; error?: string } | null = null;
  try { payload = await response.json(); } catch { /* ignore */ }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication session is missing or has expired. Please log in again.");
    }
    if (response.status === 429) {
      throw new Error("Too many requests. Please slow down and try again later.");
    }
    throw new Error(payload?.error ?? `getFraudByBatch failed: HTTP ${response.status}`);
  }
  return payload!;
};

/**
 * Get all fraud scores for a specific farmer (by Supabase user UUID).
 * Requires authentication.
 */
export const getFraudByFarmer = async (
  farmerId: string,
  limit = 20,
): Promise<{ ok: boolean; farmerId: string; count: number; data: FraudScore[] }> => {
  const headers = await buildAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/fraud/farmer/${farmerId}?limit=${limit}`,
    { method: 'GET', headers },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any = null;
  try { payload = await response.json(); } catch { /* ignore */ }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication session is missing or has expired. Please log in again.");
    }
    if (response.status === 429) {
      throw new Error("Too many requests. Please slow down and try again later.");
    }
    throw new Error(payload?.error ?? `getFraudByFarmer failed: HTTP ${response.status}`);
  }
  return payload;
};

/**
 * Get aggregated fraud overview stats for the Risk Intelligence dashboard.
 * Public endpoint — no authentication required.
 */
export const getFraudOverview = async (): Promise<{ ok: boolean; data: FraudOverview }> => {
  const headers = await buildAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/fraud/overview`, {
    method: 'GET',
    headers,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any = null;
  try { payload = await response.json(); } catch { /* ignore */ }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication session is missing or has expired. Please log in again.");
    }
    if (response.status === 429) {
      throw new Error("Too many requests. Please slow down and try again later.");
    }
    throw new Error(payload?.error ?? `getFraudOverview failed: HTTP ${response.status}`);
  }
  return payload;
};

export interface AuditLogEntry {
  token_id: string;
  serial_number: string;
  score: number;
  trustExplanation: string | null;
  rationale: string;
  verified_at: string;
  status: "approved" | "flagged";
}

export interface AuditLogsPagination {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface AuditLogsResponse {
  ok: boolean;
  data: AuditLogEntry[];
  pagination: AuditLogsPagination;
}

export const getAuditLogs = async (params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  search?: string;
}): Promise<AuditLogsResponse> => {
  const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "desc", status = "all", search = "" } = params;
  
  const headers = await buildAuthHeaders();
  
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
    status,
    search,
  }).toString();

  const { data: result, error } = await supabase.functions.invoke(
    `audit-logs?${query}`,
    {
      method: "GET",
      headers,
    }
  );

  if (error) {
    throw new Error(error.message || "Failed to fetch audit logs");
  }

  return result as AuditLogsResponse;
};


/**
 * Hard-deletes the authenticated user's account via the backend.
 *
 * CRITICAL — call order matters:
 * This MUST run before signOut(). The backend authenticates via the
 * session's access_token. Once signOut() runs the token is gone → 401.
 *
 * Requirements: 2.1
 */
export const deleteAccount = async (): Promise<{ ok: boolean; message: string }> => {
  const headers = await buildAuthHeaders();

  if (!headers['Authorization']) {
    throw new Error('No active session');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any = null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/account`, {
      method: 'DELETE',
      headers,
    });

    try { payload = await response.json(); } catch { /* ignore */ }

    if (!response.ok) {
      throw new Error(
        payload?.error ||
        payload?.message ||
        `deleteAccount failed: HTTP ${response.status}`
      );
    }

    return payload;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('deleteAccount failed: network error');
  }
};

/**
 * Updates the authenticated user's profile details (username/email) via the backend.
 */
export const updateProfile = async (
  data: { username?: string; email?: string }
): Promise<{ ok: boolean; message: string; profile: any }> => {
  const headers = await buildAuthHeaders();
  headers["Content-Type"] = "application/json";

  if (!headers["Authorization"]) {
    throw new Error("No active session");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any = null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/account`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });

    try {
      payload = await response.json();
    } catch {
      // ignore
    }

    if (!response.ok) {
      throw new Error(
        payload?.error ||
        payload?.message ||
        `updateProfile failed: HTTP ${response.status}`
      );
    }

    return payload;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("updateProfile failed: network error");
  }
};

