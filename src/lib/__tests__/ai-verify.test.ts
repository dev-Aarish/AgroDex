import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyRegistration as clientVerifyRegistration } from "../api";
import { generateLocalFallbackVerification } from "../../../backend/src/ai/gemini.js";

describe("AI Registration Verification System Tests", () => {
  
  // =========================================================================
  // FRONTEND API CLIENT TESTS (Part 2)
  // =========================================================================
  describe("Frontend Client - verifyRegistration", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should fetch AI verification with correct parameters and returns data", async () => {
      const mockResult = {
        ok: true,
        data: {
          productSummary: "You are registering 500kg of Rice.",
          verificationSummary: {
            quantity: "Verified",
            harvestBatch: "Verified",
            location: "Verified",
            harvestDate: "Verified",
          },
          warnings: [],
          consistencyChecks: [],
          cooperativeReadiness: { status: "Ready", notes: ["All checked"] },
          statistics: {
            batchNumber: "HB150",
            quantity: "500 kg",
            location: "Maharashtra",
            harvestDate: "2026-06-20",
          },
          fallback: false,
        },
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => name === "content-type" ? "application/json" : null
        },
        json: vi.fn().mockResolvedValue(mockResult),
      } as unknown as Response);

      const request = {
        productName: "Rice",
        harvestBatch: "HB150",
        quantity: "500",
        unit: "kg",
        location: "Maharashtra",
        harvestDate: "2026-06-20",
        metadata: "organic",
      };

      const result = await clientVerifyRegistration(request);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/ai/verify-registration"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }
      );
      expect(result).toEqual(mockResult);
    });

    it("should return local fallback verification if server returns non-ok status", async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        headers: {
          get: (name: string) => name === "content-type" ? "application/json" : null
        },
        json: vi.fn().mockResolvedValue({ error: "Gemini Service Unavailable" }),
      } as unknown as Response);

      const result = await clientVerifyRegistration({
        productName: "Rice",
        harvestBatch: "HB150",
        quantity: "500",
        unit: "kg",
        location: "Maharashtra",
        harvestDate: "2026-06-20",
      });

      expect(result.ok).toBe(true);
      expect(result.data.fallback).toBe(true);
      expect(result.data.warningMessage).toContain("AI verification unavailable");
    });
  });

  // =========================================================================
  // BACKEND FALLBACK LOGIC TESTS (Part 1 & Fallback Mode)
  // =========================================================================
  describe("Backend - generateLocalFallbackVerification", () => {
    it("should create deterministic summary and statistics for valid input", () => {
      const result = generateLocalFallbackVerification({
        productName: "Organic Rice",
        harvestBatch: "HB-150",
        quantity: "500",
        unit: "kg",
        location: "Maharashtra, India",
        harvestDate: "2026-06-18",
      });

      expect(result.fallback).toBe(true);
      expect(result.warningMessage).toContain("AI verification unavailable");
      expect(result.statistics.batchNumber).toBe("HB-150");
      expect(result.statistics.quantity).toBe("500 kg");
      expect(result.productSummary).toContain("500 kg");
      expect(result.productSummary).toContain("Organic Rice");
      expect(result.cooperativeReadiness.status).toBe("Ready");
      expect(result.warnings).toHaveLength(0);
      expect(result.consistencyChecks).toHaveLength(0);
    });

    it("should return warnings when required fields are missing", () => {
      const result = generateLocalFallbackVerification({
        productName: "",
        harvestBatch: "",
        quantity: "",
        unit: "",
        location: "",
        harvestDate: "",
      });

      expect(result.cooperativeReadiness.status).toBe("Review Required");
      expect(result.warnings).toContain("Product name is missing or too short");
      expect(result.warnings).toContain("Harvest batch not specified");
      expect(result.warnings).toContain("Quantity not specified");
      expect(result.warnings).toContain("Harvest location missing or too vague");
      expect(result.warnings).toContain("Harvest date not specified");
    });

    it("should flag future harvest date in consistency checks", () => {
      const futureDate = "2030-12-31";
      const result = generateLocalFallbackVerification({
        productName: "Organic Rice",
        harvestBatch: "HB-150",
        quantity: "500",
        unit: "kg",
        location: "Maharashtra, India",
        harvestDate: futureDate,
      });

      expect(result.consistencyChecks).toContain("Future harvest date detected");
      expect(result.cooperativeReadiness.status).toBe("Review Required");
    });

    it("should flag implausibly large quantities in consistency checks", () => {
      const result = generateLocalFallbackVerification({
        productName: "Organic Rice",
        harvestBatch: "HB-150",
        quantity: "99999999",
        unit: "kg",
        location: "Maharashtra, India",
        harvestDate: "2026-06-18",
      });

      expect(result.consistencyChecks).toContain("Quantity appears unusually large");
      expect(result.cooperativeReadiness.status).toBe("Review Required");
    });
  });
});
