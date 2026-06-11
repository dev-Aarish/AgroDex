/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyBatch, verifyBatchById } from "../api";

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
