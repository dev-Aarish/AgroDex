import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHash } from "node:crypto";
import {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenId,
  AccountId,
} from "npm:@hashgraph/sdk@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-demo-mode",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[tokenize-batch] Request received");
    const body = await req.json();
    console.log("[tokenize-batch] Request body:", JSON.stringify(body));
    const { hcsTransactionIds, batchId } = body;

    if (
      !hcsTransactionIds ||
      !Array.isArray(hcsTransactionIds) ||
      hcsTransactionIds.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "hcsTransactionIds array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Hedera client
    const operatorId = Deno.env.get("HEDERA_OPERATOR_ID");
    const operatorKey = Deno.env.get("HEDERA_OPERATOR_KEY");
    const network = Deno.env.get("HEDERA_NETWORK") || "testnet";

    console.log("[tokenize-batch] Hedera credentials check:", {
      hasOperatorId: !!operatorId,
      operatorId: operatorId,
      hasOperatorKey: !!operatorKey,
      operatorKeyPrefix: operatorKey?.substring(0, 20),
      network,
    });

    if (!operatorId || !operatorKey) {
      throw new Error("Missing Hedera credentials");
    }

    console.log("[tokenize-batch] Creating Hedera client...");
    const client = Client.forTestnet();

    console.log("[tokenize-batch] Parsing operator key...");
    let privateKey;
    try {
      privateKey = PrivateKey.fromStringDer(operatorKey);
    } catch (derError) {
      console.log("[tokenize-batch] DER parsing failed, trying ED25519...");
      try {
        privateKey = PrivateKey.fromStringED25519(operatorKey);
      } catch (ed25519Error) {
        console.log("[tokenize-batch] ED25519 parsing failed, trying ECDSA...");
        privateKey = PrivateKey.fromStringECDSA(operatorKey);
      }
    }

    console.log("[tokenize-batch] Setting operator...");
    client.setOperator(AccountId.fromString(operatorId), privateKey);
    console.log("[tokenize-batch] Hedera client initialized successfully");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch batch data if batchId provided, or resolve it by HCS Tx IDs
    let batchData = null;
    let resolvedBatchId = batchId;
    
    if (resolvedBatchId) {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .eq("id", resolvedBatchId)
        .single();

      if (error) {
        console.error("Error fetching batch by ID:", error);
      } else {
        batchData = data;
      }
    } else if (hcsTransactionIds && hcsTransactionIds.length > 0) {
      // Look up by matching hcs_tx_id with any of the transaction IDs
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .in("hcs_tx_id", hcsTransactionIds)
        .limit(1);
      
      if (error) {
        console.error("Error searching batch by HCS Tx IDs:", error);
      } else if (data && data.length > 0) {
        batchData = data[0];
        resolvedBatchId = batchData.id;
        console.log(`[tokenize-batch] Resolved batch ID from HCS Tx ID: ${resolvedBatchId}`);
      }
    }

    // Create NFT token
    const tokenName = batchData?.product_type || "AgroDex Certificate";
    const tokenSymbol = "AGRI";
    let tokenId = TokenId;

    console.log("[tokenize-batch] Creating token transaction...");
    const tokenCreateTx = await new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1000)
      .setTreasuryAccountId(AccountId.fromString(operatorId))
      .setAdminKey(privateKey.publicKey)
      .setSupplyKey(privateKey.publicKey)
      .freezeWith(client);

    console.log("[tokenize-batch] Executing token creation...");
    const tokenCreateSubmit = await tokenCreateTx.execute(client);
    const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
    tokenId = tokenCreateReceipt.tokenId;

    if (!tokenId) {
      throw new Error("Failed to create token");
    }

    // Mint NFT with HCS transaction IDs as metadata (compact format)
    const fullMetadata = {
      hcs: hcsTransactionIds,
      bid: batchId,
      ts: new Date().toISOString(),
      batch: batchData
        ? {
            product_type: batchData.product_type,
            batch_number: batchData.batch_number,
          }
        : null,
    };

    // Créer un hash compact pour le NFT
    const metadataHash = createHash("sha256")
      .update(JSON.stringify(fullMetadata))
      .digest("hex");

    const metadata = new TextEncoder().encode(metadataHash);

    console.log(
      "[tokenize-batch] Full metadata:",
      JSON.stringify(fullMetadata)
    );
    console.log("[tokenize-batch] Metadata hash:", metadataHash);
    console.log("[tokenize-batch] Metadata size:", metadata.length, "bytes");

    // Vérification de sécurité
    if (metadata.length > 100) {
      throw new Error(`Metadata too long: ${metadata.length} bytes (max 100)`);
    }

    console.log("[tokenize-batch] Creating mint transaction...");
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([metadata])
      .freezeWith(client);

    console.log("[tokenize-batch] Executing mint transaction...");
    const mintSubmit = await mintTx.execute(client);
    const mintReceipt = await mintSubmit.getReceipt(client);

    const serialNumbers = mintReceipt.serials;

    // Stocker les métadonnées complètes en DB
    console.log("[tokenize-batch] Storing full metadata in database...");
    await supabase.from("nft_metadata").insert({
      token_id: tokenId.toString(),
      serial_number: serialNumbers[0]?.toString(),
      metadata_hash: metadataHash,
      full_metadata: fullMetadata,
    });

    // Update batch with token info if resolvedBatchId provided
    if (resolvedBatchId) {
      console.log(`[tokenize-batch] Updating batch ${resolvedBatchId} with token info...`);
      await supabase
        .from("batches")
        .update({
          hedera_token_id: tokenId.toString(),
          hedera_serial_number: serialNumbers[0]?.toString(),
          tokenized_at: new Date().toISOString(),
          hcs_transaction_ids: hcsTransactionIds,
        })
        .eq("id", resolvedBatchId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tokenId: tokenId.toString(),
        serialNumber: serialNumbers[0]?.toString(),
        batchId: resolvedBatchId,
        transactionId: mintSubmit.transactionId.toString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[tokenize-batch] Error:", error);
    console.error("[tokenize-batch] Error stack:", error.stack);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
