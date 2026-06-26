import { useState } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const functionUrl = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      if (!functionUrl) {
        throw new Error('Chat service is not configured. Please set VITE_SUPABASE_URL.');
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        let errorMsg = errData?.error || `Request failed with status ${response.status}`;
        
        if (errorMsg === 'ANTHROPIC_API_KEY not configured') {
          errorMsg = 'AI is not configured. Maintainer must run: supabase secrets set ANTHROPIC_API_KEY=your_key';
        }
        
        throw new Error(errorMsg);
      }

      const textResponse = await response.text();
      let assistantContent = '';
      
      // Parse Vercel AI SDK stream format (e.g., '0:"Hello"\n')
      const lines = textResponse.split('\n');
      for (const line of lines) {
        if (line.startsWith('0:')) {
          try {
            const chunk = JSON.parse(line.substring(2));
            assistantContent += chunk;
          } catch {
            // Ignore malformed chunks
          }
        }
      }

      if (!assistantContent) {
        assistantContent = textResponse || 'Sorry, I could not generate a response.';
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) return null; // Only show chat to logged-in users

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg p-0"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] shadow-xl flex flex-col z-50 animate-in slide-in-from-bottom-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-lg font-bold">AgroDex AI</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
            <ScrollArea className="flex-1 pr-4 mb-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground mt-4 text-sm">
                  Hi! I'm your AgroDex assistant. Ask me anything about food auditing or the platform!
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`mb-4 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="mb-4 flex justify-start">
                    <div className="rounded-lg px-3 py-2 bg-muted text-sm animate-pulse">
                      Typing...
                    </div>
                 </div>
              )}
              {error && (
                <div className="text-destructive text-sm text-center my-2">
                  {error}
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
