import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Anthropic from 'npm:@anthropic-ai/sdk@^0.32.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_DAILY_MESSAGES = 20000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify User JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders })
    }

    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), { status: 400, headers: corsHeaders })
    }

    const today = new Date().toISOString().split('T')[0]

    // Check rate limit
    const { data: usageData, error: usageError } = await supabase
      .from('chat_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    const currentCount = usageData?.message_count || 0

    if (currentCount >= MAX_DAILY_MESSAGES) {
      return new Response(JSON.stringify({ error: 'Daily limit reached' }), { status: 429, headers: corsHeaders })
    }

    // Increment usage
    await supabase
      .from('chat_usage')
      .upsert({ user_id: user.id, date: today, message_count: currentCount + 1 }, { onConflict: 'user_id,date' })

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500, headers: corsHeaders })
    }

    const anthropic = new Anthropic({ apiKey })

    const systemPrompt = "You are a helpful assistant for AgroDex, an application that fights food fraud in Indonesia by pairing Hedera's immutable ledger with AI for real-time food auditing. Provide concise and clear answers."

    // Strip out unnecessary fields and convert to Anthropic format
    const anthropicMessages = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
    })).filter(m => m.role === 'user' || m.role === 'assistant')

    const stream = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    })

    // Create a readable stream for SSE (Server-Sent Events) to work with Vercel AI SDK
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              // Vercel AI SDK expects format: 0:"text"
              controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`))
            }
          }
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    })
  } catch (error: any) {
    console.error('Error in ai-chat:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})
