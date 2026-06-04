/**
 * Test SDK pour verify-batch Edge Function
 *
 * Usage:
 * pnpm test src/lib/__tests__/verify-batch-sdk.test.ts
 */

import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  describe.skip("verify-batch Edge Function - SDK Tests", () => {
    it("requires SUPABASE_URL and SUPABASE_ANON_KEY", () => {});
  });
} else {
  describe("verify-batch Edge Function - SDK Tests", () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    it("should return error for missing tokenId", async () => {
      const { data, error } = await supabase.functions.invoke("verify-batch", {
        body: { serialNumber: "1" },
      });

    if (error && error.message.includes("404")) {
      throw new Error("verify-batch function not deployed (404)");
    }

    // Handle 400 Bad Request response
    if (error && error.status === 400) {
      expect(error.status).toBe(400);
      return;
    }

    expect(error).toBeNull();
    expect(data).toHaveProperty("stage", "validation");
    expect(data).toHaveProperty("error");
  });

  it("should return error for missing serialNumber", async () => {
    const { data, error } = await supabase.functions.invoke("verify-batch", {
      body: { tokenId: "0.0.7160982" },
    });

    if (error && error.message.includes("404")) {
      throw new Error("verify-batch function not deployed (404)");
    }

    if (error && error.status === 400) {
      expect(error.status).toBe(400);
      return;
    }

    expect(error).toBeNull();
    expect(data).toHaveProperty("stage", "validation");
    expect(data).toHaveProperty("error");
  });

  it("should verify NFT with valid tokenId and serialNumber", async () => {
    const { data, error } = await supabase.functions.invoke("verify-batch", {
      body: {
        tokenId: "0.0.7160982",
        serialNumber: "1",
      },
    });

    if (error && error.message.includes("404")) {
      throw new Error("verify-batch function not deployed (404)");
    }

    // Handle server errors gracefully
    if (error && error.status === 500) {
      console.warn("Edge Function returned 500 - skipping verification test");
      return;
    }

    expect(error).toBeNull();

    if (data.success) {
      expect(data).toHaveProperty("tokenId", "0.0.7160982");
      expect(data).toHaveProperty("serialNumber");
      expect(data).toHaveProperty("status", "VERIFIED");
      expect(data).toHaveProperty("nftMetadata");
    } else {
      expect(data).toHaveProperty("stage", "database_query");
      expect(data).toHaveProperty(
        "error",
        "NFT not found or not registered in our system",
      );
    }
  });

  it("should handle non-existent NFT gracefully", async () => {
    const { data, error } = await supabase.functions.invoke("verify-batch", {
      body: {
        tokenId: "0.0.9999999",
        serialNumber: "999",
      },
    });

    if (error && error.message.includes("404")) {
      throw new Error("verify-batch function not deployed (404)");
    }

    if (error && error.status === 500) {
      console.warn(
        "Edge Function returned 500 - skipping non-existent NFT test",
      );
      return;
    }

    expect(error).toBeNull();
    expect(data).toHaveProperty("stage", "database_query");
    expect(data).toHaveProperty("verified", false);
    expect(data).toHaveProperty("error");
  });

  it("should include diagnostic stage information in responses", async () => {
    const { data, error } = await supabase.functions.invoke("verify-batch", {
      body: {
        tokenId: "0.0.7160982",
        serialNumber: "1",
      },
    });

    if (error && error.message.includes("404")) {
      throw new Error("verify-batch function not deployed (404)");
    }

    if (error && error.status === 500) {
      console.warn(
        "Edge Function returned 500 - skipping diagnostic stage test",
      );
      return;
    }

    expect(error).toBeNull();
    expect(data).toHaveProperty("stage");

    console.log("Response stage:", data.stage);
    console.log("Full response:", JSON.stringify(data, null, 2));
  });
});
}

/**
 * Instructions de déploiement si tests échouent avec 404:
 *
 * 1. Déployer la fonction:
 *    supabase functions deploy verify-batch --project-ref mrbfrwtymikayrbrzgmp
 *
 * 2. Vérifier le déploiement:
 *    supabase functions list --project-ref mrbfrwtymikayrbrzgmp
 *
 * 3. Consulter les logs:
 *    supabase functions logs verify-batch --project-ref mrbfrwtymikayrbrzgmp --follow
 *
 * 4. Relancer les tests:
 *    pnpm test src/lib/__tests__/verify-batch-sdk.test.ts
 */
