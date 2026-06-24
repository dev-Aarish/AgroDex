-- Migration: Create chat_usage table for tracking Anthropic API rate limits

CREATE TABLE IF NOT EXISTS public.chat_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Service role (Edge Functions) can do everything
CREATE POLICY "Service role has full access to chat_usage" ON public.chat_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Users can only read their own usage (if we ever want to show them their limit)
CREATE POLICY "Users can view their own chat usage" ON public.chat_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Create a function to increment the usage securely via RPC, 
-- or we can just let the edge function update it directly since it uses service_role key.
-- Since the edge function will use the service_role key, it can just run a normal upsert.

-- Create an index for faster lookups by user and date
CREATE INDEX IF NOT EXISTS idx_chat_usage_user_date ON public.chat_usage(user_id, date);
