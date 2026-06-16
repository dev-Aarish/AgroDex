import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  tokenId: string;
  serialNumber: string | number;
}

// Helper to create JSON responses with CORS
function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  // Log request (filter sensitive headers)
  const headers = Object.fromEntries([...req.headers]);
  const safeHeaders = { ...headers };
  if (safeHeaders.authorization) safeHeaders.authorization = "Bearer ***";
  if (safeHeaders.apikey) safeHeaders.apikey = "***";

  console.log("=== VERIFY-BATCH REQUEST ===");
  console.log("Method:", req.method);
  console.log("Headers:", safeHeaders);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("→ OPTIONS preflight OK");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse and validate body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (_) {
      console.error("→ Invalid JSON");
      return json(400, { stage: "validation", error: "Invalid JSON body" });
    }

    const { tokenId, serialNumber } = body;
    console.log("Body:", { tokenId, serialNumber });

    if (!tokenId || !serialNumber) {
      console.error("→ Missing required fields");
      return json(400, {
        stage: "validation",
        error: "tokenId and serialNumber are required",
        received: body,
      });
    }

    // Create Supabase client with SERVICE_ROLE_KEY to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("→ Missing environment variables");
      return json(500, {
        stage: "config",
        error: "Server configuration error",
        details: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("→ Supabase client created (service role)");

    // Query batches table with maybeSingle() to handle no-row case
    console.log(`→ Querying batches: ${tokenId} #${serialNumber}`);
    const { data, error: metadataError } = await supabase
  .from("nft_metadata")
  .select("*")
  .eq("token_id", tokenId)
  .eq("serial_number", serialNumber)
  .limit(1);

const nftMetadata = data?.[0] || null;

    if (metadataError) {
  console.error("FULL ERROR:", metadataError);

  return json(500, {
    stage: "database_query",
    error: "Database query failed",
    details: metadataError.message,
    code: metadataError.code,
    hint: metadataError.hint,
  });
}

    if (!nftMetadata) {
      console.log("→ NFT not found (404)");
      return json(404, {
        stage: "database_query",
        error: "NFT not found or not registered in our system",
        verified: false,
      });
    }

    console.log("→ NFT found:", nftMetadata.id);

    // Fetch HCS messages
    const hcsTransactionIds = nftMetadata.hcs_transaction_ids || [];
    console.log("→ Fetching HCS messages:", hcsTransactionIds.length);

    const { data: hcsMessages, error: hcsError } = await supabase
      .from("hcs_timeline")
      .select("*")
      .in("transaction_id", hcsTransactionIds)
      .order("timestamp", { ascending: true });

    if (hcsError) {
      console.warn("→ HCS query warning (non-fatal):", hcsError.message);
    }

    // Build response
    const response = {
      success: true,
      cached: false,
      tokenId: nftMetadata.token_id,
      serialNumber: nftMetadata.serial_number,

      status: "VERIFIED",
      verifiedAt: new Date().toISOString(),
      nftMetadata: {
        id: nftMetadata.id,
        batchNumber: nftMetadata.batch_number,
        productType: nftMetadata.product_type,
        quantity: nftMetadata.quantity,
        harvestDate: nftMetadata.harvest_date,
        location: nftMetadata.location,
        certifications: nftMetadata.certifications,
        createdAt: nftMetadata.created_at,
        mintedAt: nftMetadata.tokenized_at,
      },
      hcsTransactionIds,
      hcsMessages: hcsMessages || [],
      ai_summary: nftMetadata.ai_provenance_summary || null,
    };

    console.log("→ Success (200)");

    const trace = {
  tokenId: nftMetadata.token_id,
  serialNumber: nftMetadata.serial_number,
  nftMetadata,
  hcsTransactionIds,
  hcsMessages: hcsMessages || [],
  ai: nftMetadata.ai_provenance_summary || null,
  verifiedAt: new Date().toISOString(),
  status: "verified",
};

const { error: verificationError } = await supabase
  .from("verifications")
  .upsert(
    [{
      token_id: nftMetadata.token_id,
      serial_number: nftMetadata.serial_number,
      trace,
    }],
    {
      onConflict: "token_id,serial_number",
    }
  );

if (verificationError) {
  console.error("Failed to save verification:", verificationError);

  return json(500, {
    stage: "verification_save",
    error: "Failed to persist verification record",
    details: verificationError.message,
  });
}

    return json(200, response);
  } catch (error: any) {
    console.error("=== EXCEPTION ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    return json(500, {
      stage: "exception",
      error: "Internal server error",
      details: error.message,
    });
  }
});
