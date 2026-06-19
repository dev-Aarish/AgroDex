import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { session } = useAuth();
  
  const functionUrl = import.meta.env.VITE_SUPABASE_URL 
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`
    : 'https://vtzlzzlzvzlz.supabase.co/functions/v1/ai-chat'; // Fallback if env var missing during dev

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: functionUrl,
    headers: {
      Authorization: `Bearer ${session?.access_token || ''}`
    },
    onError: (err) => {
      console.error('Chat error:', err);
    }
  });

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
            <CardTitle className="text-lg font-bold">AgroDex AI</CardTitle>
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
                  {error.message || 'An error occurred. Make sure you are logged in.'}
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <Input
                value={input}
                onChange={handleInputChange}
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
