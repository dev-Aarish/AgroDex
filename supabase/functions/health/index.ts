import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Client } from 'npm:@hashgraph/sdk@^2.49.0'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@^0.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'agri-trust-edge-functions',
    checks: {
      supabase: { ok: false, error: null },
      hedera: { ok: false, error: null },
      gemini: { ok: false, error: null }
    }
  }

  // Check Supabase connection
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const { error } = await supabase.from('batches').select('id').limit(1)
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    health.checks.supabase.ok = true
  } catch (error) {
    health.checks.supabase.error = error.message
  }

  // Check Hedera credentials
  try {
    const operatorId = Deno.env.get('HEDERA_OPERATOR_ID')
    const operatorKey = Deno.env.get('HEDERA_OPERATOR_KEY')
    const topicId = Deno.env.get('HEDERA_TOPIC_ID')
    
    if (!operatorId || !operatorKey || !topicId) {
      throw new Error('Missing Hedera credentials')
    }
    
    health.checks.hedera.ok = true
  } catch (error) {
    health.checks.hedera.error = error.message
  }

  // Check Gemini API
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }
    
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })
    
    const result = await model.generateContent('Return JSON: {"pong": true}')
    const response = await result.response
    const text = response.text()
    
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    
    if (parsed.pong === true) {
      health.checks.gemini.ok = true
    } else {
      throw new Error('Invalid response from Gemini')
    }
  } catch (error) {
    health.checks.gemini.error = error.message
  }

  // Overall status
  const allOk = Object.values(health.checks).every(check => check.ok)
  health.status = allOk ? 'ok' : 'degraded'

  return new Response(
    JSON.stringify(health, null, 2),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
})
