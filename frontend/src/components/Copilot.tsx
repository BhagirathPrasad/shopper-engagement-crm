import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, User, Rocket, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  isError?: boolean;
}

const Copilot = () => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Marketing Copilot. Tell me your business goal and I'll build a customer segment and launch a campaign.\n\nTry: \"Re-engage customers who haven't purchased in 60 days\" or \"Target high-value customers in Mumbai\"",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [launchingId, setLaunchingId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/segments/build', { query: input });

      const aiResponse: Message = {
        role: 'assistant',
        content: `I've analyzed your request and built a segment!\n\n📋 ${data.explanation}`,
        data,
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || 'Sorry, I encountered an error building the segment. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errMsg, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (msgIndex: number, msgData: any) => {
    setLaunchingId(msgIndex);
    try {
      await api.post('/campaigns/launch', {
        name: `AI Campaign — ${new Date().toLocaleDateString('en-IN')}`,
        mongoFilter: msgData.mongoFilter,
        messageTemplate: msgData.messageTemplate,
        audienceSize: msgData.audienceSize,
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '🚀 Campaign launched! It\'s now queued for delivery. Check the Recent Campaigns panel or the Analytics page to track performance.',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Failed to launch the campaign. Please try again.', isError: true },
      ]);
    } finally {
      setLaunchingId(null);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col shadow-md border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-lg pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Marketing Copilot
        </CardTitle>
        <p className="text-indigo-200 text-xs mt-1">Powered by Gemini AI — describe your target audience in plain English</p>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] bg-slate-50/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`p-1.5 rounded-full h-8 w-8 flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white border border-slate-200 shadow-sm'}`}>
                {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-indigo-600" />}
              </div>

              {/* Bubble */}
              <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : msg.isError
                  ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
              }`}>
                {msg.isError && <AlertTriangle className="w-4 h-4 mb-1 text-red-500" />}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {/* Segment preview card */}
                {msg.data && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 space-y-3">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-100 text-center">
                        <div className="text-lg font-bold text-indigo-600">{msg.data.audienceSize.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Audience Size</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-100 text-center">
                        <div className="text-lg font-bold text-purple-600">{msg.data.engagementRate}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Est. Engagement</div>
                      </div>
                    </div>

                    {/* Message template */}
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Message Template</span>
                      <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-sm italic leading-relaxed">
                        "{msg.data.messageTemplate}"
                      </div>
                    </div>

                    {/* Mongo filter */}
                    <details className="cursor-pointer">
                      <summary className="text-xs font-semibold text-slate-500 uppercase tracking-wide select-none">
                        Segment Filter (MongoDB)
                      </summary>
                      <div className="font-mono text-xs bg-slate-900 text-green-400 p-3 rounded-lg mt-2 overflow-x-auto">
                        {JSON.stringify(msg.data.mongoFilter, null, 2)}
                      </div>
                    </details>

                    {/* Launch button */}
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2 mt-1"
                      onClick={() => handleLaunch(idx, msg.data)}
                      disabled={launchingId === idx}
                    >
                      <Rocket className="w-4 h-4" />
                      {launchingId === idx ? 'Launching…' : 'Launch Campaign'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-2.5">
              <div className="p-1.5 rounded-full h-8 w-8 flex items-center justify-center shrink-0 bg-white border border-slate-200 shadow-sm">
                <Bot size={14} className="text-indigo-600" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </CardContent>

      <CardFooter className="p-4 border-t bg-white rounded-b-lg">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full gap-2">
          <Input
            ref={inputRef}
            placeholder="e.g. Customers who spent over ₹5000 but haven't bought in 60 days…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-white border-slate-200 focus:border-indigo-400 rounded-xl"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default Copilot;
