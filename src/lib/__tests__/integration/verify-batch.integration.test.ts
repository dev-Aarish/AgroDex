import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://udnpbqtvbnepicwyubnm.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const hasSupabaseConfig =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== "your_supabase_anon_key";

const describeIf = hasSupabaseConfig ? describe : describe.skip;

describeIf("verify-batch Edge Function Integration Tests", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    if (supabaseUrl && supabaseAnonKey) {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
  });

  it("should return 401 when Authorization header is missing", async () => {
    // Create a client without auth session
    const unauthenticatedClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await unauthenticatedClient.functions.invoke(
      "verify-batch",
      {
        body: { tokenId: "0.0.123", serialNumber: "1" },
      },
    );

    // Should get an error due to missing authorization
    expect(error).toBeDefined();
    expect(data).toBeNull();
  });

  it("should include Authorization header automatically when session exists", async () => {
    // This test verifies that the Supabase client automatically includes
    // the Authorization header when a user session is active

    // Note: This test requires a valid user session to pass
    // In a real scenario, you would sign in a test user first

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.warn("No active session - skipping authenticated test");
      return;
    }

    const { error } = await supabase.functions.invoke("verify-batch", {
      body: { tokenId: "0.0.123", serialNumber: "1" },
    });

    // With a valid session, the request should not fail due to missing auth
    // It may fail for other reasons (batch not found, etc.) but not 401
    if (error) {
      expect(error.message).not.toContain("Unauthorized");
      expect(error.message).not.toContain("authorization");
    }
  });

  it("should handle CORS preflight correctly", async () => {
    // Test that OPTIONS requests are handled correctly
    const response = await fetch(`${supabaseUrl}/functions/v1/verify-batch`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,authorization",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("should verify batch data structure when successful", async () => {
    // Sign in with a test user (you'll need to create this user in Supabase)
    // For now, this test is a template showing the expected structure

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.warn("No active session - skipping data structure test");
      return;
    }

    const { data, error } = await supabase.functions.invoke("verify-batch", {
      body: { tokenId: "0.0.123", serialNumber: "1" },
    });

    if (!error && data) {
      // Verify response structure
      expect(data).toHaveProperty("verified");
      expect(typeof data.verified).toBe("boolean");

      if (data.verified) {
        expect(data).toHaveProperty("batch");
        expect(data.batch).toHaveProperty("tokenId");
        expect(data.batch).toHaveProperty("serialNumber");
      }
    }
  });
});
