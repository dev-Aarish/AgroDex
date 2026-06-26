/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyBatch, registerBatch, verifyBatchById, updateProfile } from "../api";

// ---------------------------------------------------------------------------
// vi.mock() is hoisted to the top of the file by Vitest's transform, so any
// variables used inside the factory must also be hoisted via vi.hoisted().
// ---------------------------------------------------------------------------
const { mockInvoke, mockGetSession } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockGetSession: vi.fn(),
}));

vi.mock("../supabaseClient", () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    functions: { invoke: mockInvoke },
  },
}));

// ---------------------------------------------------------------------------
// verifyBatch — existing tests (unchanged)
// ---------------------------------------------------------------------------
describe("verifyBatch", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should call verify-batch endpoint with correct payload", async () => {
    const mockResponse = {
      success: true,
      cached: false,
      tokenId: "0.0.123",
      serialNumber: "1",
      nftMetadata: {},
      hcsTransactionIds: [],
      hcsMessages: [],
      verifiedAt: new Date().toISOString(),
      status: "verified",
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await verifyBatch("0.0.123", "1");

    expect(fetch).toHaveBeenCalledWith(
      "https://udnpbqtvbnepicwyubnm.supabase.co/functions/v1/verify-batch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: "0.0.123", serialNumber: 1 }),
      },
    );
    expect(result).toEqual(mockResponse);
  });

  it("should return not_found result for 404 business response", async () => {
    const errorPayload = {
      stage: "database_query",
      message: "Batch missing",
    };

    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue(errorPayload),
    } as any);

    const result = await verifyBatch("0.0.123", "1");
    expect(result).toEqual({
      verified: false,
      reason: "not_found",
      details: errorPayload,
    });
  });

  it("should throw explicit error when response not ok", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({
        error: "Unauthorized",
      }),
    } as any);

    await expect(verifyBatch("0.0.123", "1")).rejects.toThrow(
      "verify-batch failed: Unauthorized",
    );
  });

  it("should fallback to HTTP status when JSON body missing", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error("invalid json")),
    } as any);

    await expect(verifyBatch("0.0.123", "1")).rejects.toThrow(
      "verify-batch failed: HTTP 500",
    );
  });
});

// ---------------------------------------------------------------------------
// registerBatch — Issue #7 tests
// Verifies that the function correctly forwards batch data to the Edge Function
// and surfaces the ai_analysis returned by Gemini Flash Lite.
// ---------------------------------------------------------------------------
describe("registerBatch", () => {
  const validRequest = {
    productType: "Organic Arabica Coffee",
    quantity: "500",
    location: "Kigali Region, Rwanda",
    imageData: "",
    harvestDate: "2025-10-15",
  };

  beforeEach(() => {
    // Default: unauthenticated session (no access_token)
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns success response with ai_analysis when Gemini analysis succeeds", async () => {
    const mockAiAnalysis = {
      caption:
        "A batch of 500 units of Organic Arabica Coffee harvested on 2025-10-15 in Kigali Region, Rwanda.",
      anomalies: [],
      confidence: 95,
      tags: ["organic", "fresh"],
      generatedAt: "2025-10-15T10:00:00.000Z",
      ms: 412,
    };

    const mockResponse = {
      success: true,
      hcsTransactionId: "0.0.123@1234567890.000000001",
      batchId: "uuid-batch-001",
      ai_analysis: mockAiAnalysis,
      message: "Batch registered successfully on Hedera HCS",
    };

    mockInvoke.mockResolvedValue({ data: mockResponse, error: null });

    const result = await registerBatch(validRequest);

    expect(mockInvoke).toHaveBeenCalledWith(
      "register-batch",
      expect.objectContaining({
        body: expect.objectContaining({
          productType: "Organic Arabica Coffee",
          quantity: "500",
          location: "Kigali Region, Rwanda",
          harvestDate: "2025-10-15",
        }),
      }),
    );

    expect(result.success).toBe(true);
    expect(result.hcsTransactionId).toBe("0.0.123@1234567890.000000001");
    expect(result.ai_analysis).toMatchObject({
      caption: expect.any(String),
      anomalies: expect.any(Array),
      confidence: 95,
      tags: expect.arrayContaining(["organic"]),
    });
  });

  it("returns success even when ai_analysis is null (Gemini graceful degradation)", async () => {
    const mockResponse = {
      success: true,
      hcsTransactionId: "0.0.123@1234567890.000000002",
      batchId: "uuid-batch-002",
      ai_analysis: null,
      message: "Batch registered successfully on Hedera HCS",
    };

    mockInvoke.mockResolvedValue({ data: mockResponse, error: null });

    const result = await registerBatch(validRequest);

    expect(result.success).toBe(true);
    expect(result.ai_analysis).toBeNull();
  });

  it("normalises DD-MM-YYYY harvestDate to YYYY-MM-DD before sending", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        hcsTransactionId: "0.0.123@1234567890.000000003",
        batchId: "uuid-batch-003",
        ai_analysis: null,
        message: "ok",
      },
      error: null,
    });

    await registerBatch({ ...validRequest, harvestDate: "15-10-2025" });

    expect(mockInvoke).toHaveBeenCalledWith(
      "register-batch",
      expect.objectContaining({
        body: expect.objectContaining({ harvestDate: "2025-10-15" }),
      }),
    );
  });

  it("includes Authorization header when user session is active", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "test-jwt-token" } },
    });

    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        hcsTransactionId: "0.0.123@1234567890.000000004",
        batchId: "uuid-batch-004",
        ai_analysis: null,
        message: "ok",
      },
      error: null,
    });

    await registerBatch(validRequest);

    expect(mockInvoke).toHaveBeenCalledWith(
      "register-batch",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt-token",
        }),
      }),
    );
  });

  it("throws a structured error when the Edge Function returns an error", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        message: JSON.stringify({
          error: "HEDERA_OPERATOR_KEY not configured",
          hint: "Set the key in Supabase secrets",
        }),
      },
    });

    await expect(registerBatch(validRequest)).rejects.toThrow(
      "HEDERA_OPERATOR_KEY not configured",
    );
  });

  it("throws with hint appended when hint is present in error body", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        message: JSON.stringify({
          error: "Database timeout",
          hint: "Retry in a moment",
        }),
      },
    });

    await expect(registerBatch(validRequest)).rejects.toThrow(
      /Database timeout.*Retry in a moment/s,
    );
  });
});

// ---------------------------------------------------------------------------
// normalizeDate — utility function tests
// ---------------------------------------------------------------------------
import { normalizeDate } from "../api";

describe("normalizeDate", () => {
  it("returns YYYY-MM-DD unchanged", () => {
    expect(normalizeDate("2025-10-15")).toBe("2025-10-15");
  });

  it("converts DD-MM-YYYY to YYYY-MM-DD", () => {
    expect(normalizeDate("15-10-2025")).toBe("2025-10-15");
  });

  it("throws on invalid day", () => {
    expect(() => normalizeDate("99-10-2025")).toThrow();
  });

  it("throws on invalid month", () => {
    expect(() => normalizeDate("15-13-2025")).toThrow();
  });

  it("throws on unsupported format", () => {
    expect(() => normalizeDate("2025/10/15")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// verifyBatchById — QR-based batch verification tests
// ---------------------------------------------------------------------------
describe("verifyBatchById", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should call GET batch endpoint with correct URL and headers", async () => {
    const mockResponse = {
      success: true,
      cached: false,
      tokenId: "0.0.123",
      serialNumber: "1",
      batch: { id: "test-uuid-123" },
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await verifyBatchById("test-uuid-123");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/batches/test-uuid-123"),
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  it("should return reason not_found for 404 response", async () => {
    const mockResponse = { error: "Batch not found" };

    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await verifyBatchById("test-uuid-123");

    expect(result).toEqual({
      verified: false,
      reason: "not_found",
      details: mockResponse,
    });
  });

  it("should return reason deleted for 410 response", async () => {
    const mockResponse = { error: "Batch was soft deleted" };

    fetchSpy.mockResolvedValue({
      ok: false,
      status: 410,
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await verifyBatchById("test-uuid-123");

    expect(result).toEqual({
      verified: false,
      reason: "deleted",
      details: mockResponse,
    });
  });

  it("should throw error for other non-ok HTTP statuses", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: "Internal Server Error" }),
    } as any);

    await expect(verifyBatchById("test-uuid-123")).rejects.toThrow(
      "verifyBatchById failed: Internal Server Error",
    );
  });
});

// ---------------------------------------------------------------------------
// updateProfile — Issue #143 tests
// ---------------------------------------------------------------------------
describe("updateProfile", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    // Authenticated session by default
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "test-jwt-token" } },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("should make PATCH request to /api/account with correct body and headers", async () => {
    const mockResponse = {
      ok: true,
      message: "Profile updated successfully",
      profile: { username: "new_username" },
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await updateProfile({ username: "new_username" });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/account"),
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer test-jwt-token",
        },
        body: JSON.stringify({ username: "new_username" }),
      },
    );
    expect(result).toEqual(mockResponse);
  });

  it("should throw error if session is not active", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(updateProfile({ username: "new_username" })).rejects.toThrow(
      "No active session",
    );
  });

  it("should throw server error when response not ok", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 409,
      json: vi.fn().mockResolvedValue({
        error: "Username is already taken",
      }),
    } as any);

    await expect(updateProfile({ username: "taken_username" })).rejects.toThrow(
      "Username is already taken",
    );
  });
});

