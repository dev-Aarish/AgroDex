import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Client, TopicMessageSubmitTransaction, TopicId, PrivateKey, AccountId } from 'npm:@hashgraph/sdk@^2.49.0'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@^0.21.0'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-debug, x-dry-run',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return crypto.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/**
 * Get days in month for date validation
 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Normalize date from DD-MM-YYYY to YYYY-MM-DD (ISO date-only format)
 * Also accepts YYYY-MM-DD and returns it unchanged
 * Validates day/month ranges strictly
 */
function normalizeDate(input: string): string {
  // ISO format: YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch
    const year = parseInt(yyyy, 10)
    const month = parseInt(mm, 10)
    const day = parseInt(dd, 10)
    
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month in ISO date: ${input}`)
    }
    if (day < 1 || day > daysInMonth(year, month)) {
      throw new Error(`Invalid day in ISO date: ${input}`)
    }
    return input
  }
  
  // DMY format: DD-MM-YYYY
  const dmyMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(input)
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch
    const day = parseInt(dd, 10)
    const month = parseInt(mm, 10)
    const year = parseInt(yyyy, 10)
    
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month in DMY date: ${input}. Expected DD-MM-YYYY or YYYY-MM-DD`)
    }
    if (day < 1 || day > daysInMonth(year, month)) {
      throw new Error(`Invalid day in DMY date: ${input}. Expected DD-MM-YYYY or YYYY-MM-DD`)
    }
    
    return `${yyyy}-${mm}-${dd}`
  }
  
  // Detect potential MM-DD-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(input)) {
    throw new Error(`Unsupported date format (looks like MM-DD-YYYY): ${input}. Use DD-MM-YYYY or YYYY-MM-DD`)
  }
  
  throw new Error(`Unsupported date format: ${input}. Expected DD-MM-YYYY or YYYY-MM-DD`)
}

/**
 * Timeout wrapper for async operations with AbortSignal support
 */
async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms = 15000,
  label = 'Operation'
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(`${label} timeout after ${ms}ms`), ms)
  
  try {
    return await fn(controller.signal)
  } finally {
    clearTimeout(timeoutId)
  }
}

// Request validation schema
const RegisterBatchSchema = z.object({
  productType: z.string().min(1, 'Product type is required'),
  quantity: z.union([z.string(), z.number()]).transform(val => String(val)),
  location: z.string().min(1, 'Location is required'),
  imageData: z.string().optional().default(''),
  harvestDate: z.string().min(1, 'Harvest date is required'),
  aiVerification: z.any().optional()
})

/**
 * Detect and sanitize keys with hidden whitespace/newlines
 */
function sanitizeKey(raw: string): string {
  if (!raw) return raw
  
  // Detect problematic characters
  const hasNewlines = /[\r\n]/.test(raw)
  const hasExtraSpaces = /\s{2,}/.test(raw)
  
  if (hasNewlines || hasExtraSpaces) {
    console.warn('⚠️  Key contains whitespace/newlines - auto-cleaning')
  }
  
  // Remove all whitespace
  return raw.replace(/\s+/g, '')
}

/**
 * Parse private key from multiple formats (DER, ED25519, ECDSA)
 */
function loadPrivateKeyAny(raw: string): PrivateKey {
  if (!raw) {
    throw new Error('HEDERA_OPERATOR_KEY is required')
  }

  // Sanitize and remove 0x prefix
  const cleanKey = sanitizeKey(raw).replace(/^0x/, '')

  try {
    // Case 1: DER-encoded key (starts with 302e/3030/3081)
    if (/^(302e|3030|3081)/.test(cleanKey)) {
      console.log('🔑 Detected DER-encoded key')
      return PrivateKey.fromStringDer(cleanKey)
    }

    // Case 2: 64 hex chars - Try ECDSA first, then ED25519
    if (/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      console.log('🔑 Detected 64-char hex key, trying ECDSA first')
      try {
        return PrivateKey.fromStringECDSA(cleanKey)
      } catch {
        console.log('🔑 ECDSA failed, trying ED25519')
        return PrivateKey.fromStringED25519(cleanKey)
      }
    }

    // Case 3: Fallback to generic parser
    console.log('🔑 Using generic key parser')
    return PrivateKey.fromString(cleanKey)
  } catch (error) {
    throw new Error(
      `Failed to parse HEDERA_OPERATOR_KEY: ${error.message}\n` +
      `Key format: ${cleanKey.length} chars, starts with "${cleanKey.substring(0, 10)}..."\n` +
      `Expected: 64-char hex (ED25519/ECDSA) or DER-encoded hex (starts with 302e/3030/3081)`
    )
  }
}

/**
 * Initialize Hedera client with proper key parsing and network selection
 */
function getHederaClient() {
  const operatorId = Deno.env.get('HEDERA_OPERATOR_ID')
  const operatorKey = Deno.env.get('HEDERA_OPERATOR_KEY')
  const network = Deno.env.get('HEDERA_NETWORK') || 'testnet'
  
  if (!operatorId || !operatorKey) {
    throw new Error('Hedera credentials not configured. Set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY')
  }

  try {
    // Parse account ID and private key
    const accountId = AccountId.fromString(operatorId)
    const privateKey = loadPrivateKeyAny(operatorKey)

    // Select network
    const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet()
    client.setOperator(accountId, privateKey)

    console.log(`✅ Hedera client initialized for ${network} - Account: ${operatorId}`)
    return client
  } catch (error) {
    console.error('❌ Failed to initialize Hedera client:', error.message)
    throw new Error(`Hedera client initialization failed: ${error.message}`)
  }
}

/**
 * Submit to Hedera Consensus Service with proper freeze/sign/execute flow
 */
async function submitToHCS(batchData: any, signal?: AbortSignal) {
  const client = getHederaClient()
  const topicIdStr = Deno.env.get('HEDERA_TOPIC_ID')
  const submitKey = Deno.env.get('HEDERA_SUBMIT_KEY') // Optional: if topic requires submit key
  
  if (!topicIdStr) {
    throw new Error('HEDERA_TOPIC_ID not configured')
  }
  
  try {
    const topicId = TopicId.fromString(topicIdStr)

    const message = JSON.stringify({
      ...batchData,
      timestamp: new Date().toISOString()
    })

    console.log(`📤 Submitting to HCS topic ${topicIdStr}...`)

    // Build transaction
    let transaction = new TopicMessageSubmitTransaction({
      topicId: topicId,
      message: message
    })

    // CRITICAL: Freeze transaction BEFORE signing
    transaction = transaction.freezeWith(client)

    // Sign with submit key if required by topic
    // Note: Operator key signs automatically during execute()
    // Only add submitKey signature if topic explicitly requires it
    if (submitKey) {
      console.log('🔐 Signing with HEDERA_SUBMIT_KEY (topic requires submit key)')
      const submitPrivateKey = loadPrivateKeyAny(submitKey)
      transaction = await transaction.sign(submitPrivateKey)
    }

    // Execute transaction (operator key signs automatically here)
    const txResponse = await transaction.execute(client)
    console.log(`⏳ Transaction submitted: ${txResponse.transactionId.toString()}`)

    // Get receipt with timeout
    const receipt = await txResponse.getReceipt(client)
    console.log(`✅ HCS message confirmed - Status: ${receipt.status.toString()}`)

    return {
      transactionId: txResponse.transactionId.toString(),
      receipt: {
        status: receipt.status.toString(),
        topicSequenceNumber: receipt.topicSequenceNumber?.toString()
      }
    }
  } catch (error) {
    console.error('❌ HCS submission failed:', error)
    
    // Enhanced error messages with troubleshooting hints
    if (error.message?.includes('INVALID_SIGNATURE')) {
      throw new Error(
        'INVALID_SIGNATURE: The transaction signature is invalid. Possible causes:\n' +
        '1. HEDERA_OPERATOR_KEY does not match HEDERA_OPERATOR_ID\n' +
        '2. Topic requires a submit key - set HEDERA_SUBMIT_KEY if topic has submitKey configured\n' +
        '3. Network mismatch - verify HEDERA_NETWORK matches where your account exists\n' +
        '4. Key format issue - ensure no hidden spaces/newlines in private key'
      )
    }
    if (error.message?.includes('INVALID_TOPIC_ID')) {
      throw new Error(
        `INVALID_TOPIC_ID: Topic ${topicIdStr} does not exist on ${Deno.env.get('HEDERA_NETWORK') || 'testnet'}. ` +
        'Verify HEDERA_TOPIC_ID is correct and exists on the configured network.'
      )
    }
    if (error.message?.includes('UNAUTHORIZED')) {
      throw new Error(
        'UNAUTHORIZED: Topic requires a submit key. Set HEDERA_SUBMIT_KEY environment variable ' +
        'with the private key that matches the topic\'s submitKey.'
      )
    }
    
    throw error
  }
}

// Gemini Flash Lite batch metadata analysis
// Analyses structured text fields instead of an image URL (imageData is not captured in the registration form).
async function analyzeBatch(
  batchData: { productType: string; quantity: string; location: string; harvestDate: string },
  signal?: AbortSignal
) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')

  if (!apiKey) {
    console.warn('⚠️  GEMINI_API_KEY not set - skipping AI batch analysis')
    return {
      caption: 'AI analysis unavailable',
      anomalies: [],
      confidence: 0,
      tags: [],
      error: 'API key not configured'
    }
  }

  const startTime = Date.now()
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 512,
    }
  })

  // Today's date for harvest date validation
  const today = new Date().toISOString().split('T')[0]

  const prompt = `You are an agricultural batch registration inspector. Verify the following batch metadata and return a structured quality assessment.

Batch Details:
- Product: ${batchData.productType}
- Quantity: ${batchData.quantity}
- Origin Location: ${batchData.location}
- Harvest Date: ${batchData.harvestDate}
- Today's Date: ${today}

Return ONLY valid JSON in this exact format:
{
  "caption": "1-2 sentence professional summary of this batch submission",
  "anomalies": [],
  "confidence": 80,
  "tags": []
}

Rules:
- caption: Summarise the batch (product, quantity, origin, harvest). Keep it professional and factual.
- anomalies: Array of strings. Check for and include any of these concerns (use exact strings):
    "implausible-quantity" — quantity is zero, negative, or unrealistically large (>1,000,000)
    "vague-location" — location is a single generic word (e.g. "here", "farm") with no region/country detail
    "future-harvest-date" — harvest date is after today (${today})
    "stale-harvest-date" — harvest date is more than 3 years in the past
    "unusual-product-name" — product name contains numbers, special characters, or is fewer than 3 characters
  Leave as empty array [] if no concerns.
- confidence: Integer 0–100. Score based on:
    100 = all fields plausible, location specific, date valid, product name clear
    Deduct ~15 per anomaly found. Minimum 10 if any critical anomaly present.
- tags: Array of strings. Select applicable from: [organic, conventional, fresh, dried, ripe, premium, standard, processed, unverified]
  Use "unverified" when location or product name is vague. Use "fresh" when harvest date is within 30 days.

Return ONLY the JSON object. No markdown. No explanation.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned)

  return {
    ...parsed,
    ms: Date.now() - startTime
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const requestId = generateRequestId()
  const debug = req.headers.get('x-debug') === '1'
  const dryRun = req.headers.get('x-dry-run') === '1'

  try {
    // Parse request body with error handling
    let body: unknown = null
    const rawText = await req.text()
    
    try {
      body = rawText ? JSON.parse(rawText) : null
    } catch (jsonError) {
      console.error(`[${requestId}] JSON parse error:`, jsonError)
      return new Response(
        JSON.stringify({
          id: requestId,
          error: 'Invalid JSON body',
          message: 'Request body must be valid JSON',
          details: jsonError.message,
          rawLength: rawText.length
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      )
    }

    // Debug mode: return payload + env vars presence
    if (debug) {
      const envInfo = {
        HEDERA_OPERATOR_ID: !!Deno.env.get('HEDERA_OPERATOR_ID'),
        HEDERA_OPERATOR_KEY: !!Deno.env.get('HEDERA_OPERATOR_KEY'),
        HEDERA_TOPIC_ID: !!Deno.env.get('HEDERA_TOPIC_ID'),
        SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
        SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        GEMINI_API_KEY: !!Deno.env.get('GEMINI_API_KEY'),
        GEMINI_MODEL: 'gemini-3.1-flash-lite'
      }
      console.log(`[${requestId}] Debug mode - env check:`, envInfo)
      return new Response(
        JSON.stringify({
          id: requestId,
          debug: true,
          envInfo,
          received: body
        }),
        { 
          status: 200, 
          headers: corsHeaders
        }
      )
    }

    // Validate request schema
    const parseResult = RegisterBatchSchema.safeParse(body)
    
    if (!parseResult.success) {
      console.error(`[${requestId}] Validation error:`, parseResult.error.flatten())
      return new Response(
        JSON.stringify({
          id: requestId,
          error: 'Invalid request payload',
          details: parseResult.error.flatten().fieldErrors,
          message: 'Please check all required fields are provided correctly'
        }),
        { 
          status: 422, 
          headers: corsHeaders
        }
      )
    }

    const { productType, quantity, location, imageData, harvestDate, aiVerification } = parseResult.data

    // Normalize and validate date
    let harvestDateISO: string
    try {
      harvestDateISO = normalizeDate(harvestDate)
      
      // Additional validation: ensure it's a valid date
      const dateObj = new Date(harvestDateISO)
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date value')
      }
    } catch (dateError) {
      console.error(`[${requestId}] Date normalization error:`, dateError)
      return new Response(
        JSON.stringify({
          id: requestId,
          error: 'Invalid harvest date',
          details: { harvestDate: [dateError.message] },
          message: 'Harvest date must be in DD-MM-YYYY or YYYY-MM-DD format'
        }),
        { 
          status: 422, 
          headers: corsHeaders
        }
      )
    }

    // Dry-run mode: skip all downstream calls
    if (dryRun) {
      console.log(`[${requestId}] Dry-run mode - skipping downstream calls`)
      return new Response(
        JSON.stringify({
          id: requestId,
          ok: true,
          mode: 'dry-run',
          received: {
            productType,
            quantity,
            location,
            harvestDate: harvestDateISO,
            imageDataLength: imageData.length
          }
        }),
        { 
          status: 200, 
          headers: corsHeaders
        }
      )
    }

    console.log(`[${requestId}] 📦 Registering batch: ${productType} (${quantity} units) - Harvest: ${harvestDateISO}`)

    // AI batch metadata analysis via Gemini Flash Lite (optional, non-blocking)
    // If pre-computed AI verification is passed from frontend, use it. Otherwise call Gemini.
    let aiAnalysis = aiVerification || null
    if (!aiAnalysis) {
      try {
        const geminiResult = await withTimeout(
          async (signal) => await analyzeBatch({ productType, quantity, location, harvestDate: harvestDateISO }, signal),
          20000,
          'Gemini Flash Lite batch analysis'
        )

        if (!geminiResult.error) {
          aiAnalysis = {
            caption: geminiResult.caption,
            anomalies: geminiResult.anomalies,
            confidence: geminiResult.confidence,
            tags: geminiResult.tags,
            generatedAt: new Date().toISOString(),
            ms: geminiResult.ms
          }
        }
      } catch (error) {
        console.warn(`[${requestId}] AI batch analysis failed, continuing without it:`, error.message)
        // AI failure is non-critical — registration proceeds regardless
      }
    }

    // Submit to Hedera Consensus Service with timeout handling
    let hcsResult
    try {
      hcsResult = await withTimeout(
        async (signal) => await submitToHCS({
          productType,
          quantity,
          location,
          harvestDate: harvestDateISO,
          aiAnalysis
        }, signal),
        25000,
        'Hedera HCS submission'
      )
    } catch (hcsError) {
      console.error(`[${requestId}] HCS submission error:`, hcsError)
      
      // Determine if timeout or other network error
      const errorMsg = String(hcsError.message || hcsError)
      const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('aborted')
      const status = isTimeout ? 504 : 502
      
      return new Response(
        JSON.stringify({
          id: requestId,
          error: isTimeout ? 'Hedera network timeout' : 'Failed to submit to Hedera network',
          message: errorMsg,
          hint: isTimeout 
            ? 'Hedera network is slow or unreachable. Please retry.'
            : 'Check Hedera credentials (HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_TOPIC_ID) and network connectivity'
        }),
        { 
          status, 
          headers: corsHeaders
        }
      )
    }

    // Store in Supabase database with timeout
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(`[${requestId}] Supabase credentials missing`)
      return new Response(
        JSON.stringify({
          id: requestId,
          error: 'Database configuration error',
          message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured',
          hint: 'Set environment variables in Supabase Edge Function settings'
        }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    let batchRecord
    try {
      const { data, error: dbError } = await withTimeout(
        async (signal) => {
          return await supabase
            .from('batches')
            .insert([{
              batch_name: `${productType} - ${harvestDateISO}`,
              product_type: productType,
              quantity: quantity,
              location,
              harvest_date: harvestDateISO,
              photo_url: imageData,
              hcs_tx_id: hcsResult.transactionId,
              ai_analysis: aiAnalysis
            }])
            .select()
            .single()
        },
        10000,
        'Database insert'
      )

      if (dbError) {
        console.error(`[${requestId}] Database error:`, dbError)
        
        // Return appropriate error based on DB error type
        if (dbError.code === '42P01') {
          return new Response(
            JSON.stringify({
              id: requestId,
              error: 'Database table not found',
              message: 'The batches table does not exist. Please run migrations.',
              hint: 'Run: supabase migration up',
              code: dbError.code
            }),
            { 
              status: 500, 
              headers: corsHeaders
            }
          )
        }
        
        if (dbError.code === '42501' || dbError.code === '42502') {
          return new Response(
            JSON.stringify({
              id: requestId,
              error: 'Database permission denied',
              message: 'Insufficient permissions to insert batch record',
              hint: 'Check RLS policies and service role configuration',
              code: dbError.code
            }),
            { 
              status: 403, 
              headers: corsHeaders
            }
          )
        }
        
        return new Response(
          JSON.stringify({
            id: requestId,
            error: 'Database operation failed',
            message: dbError.message,
            details: dbError.details,
            code: dbError.code,
            hint: 'Check database schema and RLS policies'
          }),
          { 
            status: 502, 
            headers: corsHeaders
          }
        )
      }

      batchRecord = data
    } catch (dbTimeoutError) {
      console.error(`[${requestId}] Database timeout:`, dbTimeoutError)
      const errorMsg = String(dbTimeoutError.message || dbTimeoutError)
      const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('aborted')
      
      return new Response(
        JSON.stringify({
          id: requestId,
          error: isTimeout ? 'Database timeout' : 'Database operation failed',
          message: errorMsg,
          hint: isTimeout 
            ? 'Database may be slow or unreachable. Please retry.'
            : 'Database operation encountered an error'
        }),
        { 
          status: isTimeout ? 504 : 502, 
          headers: corsHeaders
        }
      )
    }

    console.log(`[${requestId}] ✅ Batch registered successfully - ID: ${batchRecord.id}`)

    // Return success response
    return new Response(
      JSON.stringify({
        id: requestId,
        success: true,
        hcsTransactionId: hcsResult.transactionId,
        batchId: batchRecord.id,
        ai_analysis: aiAnalysis,
        message: 'Batch registered successfully on Hedera HCS'
      }),
      { 
        headers: corsHeaders
      }
    )
  } catch (error) {
    console.error(`[${requestId}] Register batch fatal error:`, error)
    
    return new Response(
      JSON.stringify({
        id: requestId,
        error: 'Internal server error',
        message: error?.message || String(error),
        hint: 'An unexpected error occurred. Check server logs for details.'
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    )
  }
})
