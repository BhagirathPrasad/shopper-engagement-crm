import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, User } from 'lucide-react';
import api from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
}

const Copilot = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your AI Marketing Copilot. Tell me your business goal, and I will help you build a segment and launch a campaign.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build Segment using our API
      const { data } = await api.post('/segments/build', { query: input });
      
      const aiResponse: Message = {
        role: 'assistant',
        content: `I've built a segment based on your request.
        
Explanation: ${data.explanation}`,
        data: data
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error building the segment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col shadow-md border-0 bg-white">
      <CardHeader className="bg-indigo-50 border-b pb-4 rounded-t-lg">
        <CardTitle className="text-indigo-800 flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Marketing Copilot
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.data && (
                  <div className="mt-3 p-3 bg-white rounded border text-sm text-slate-700 space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold text-slate-900">Audience Size</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {msg.data.audienceSize.toLocaleString()} users
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold text-slate-900">Est. Engagement Rate</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {msg.data.engagementRate}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block mb-1">Message Template</span>
                      <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-indigo-900 italic">
                        "{msg.data.messageTemplate}"
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block mb-1">Segment Logic</span>
                      <div className="font-mono text-xs bg-slate-50 p-2 rounded text-slate-600 overflow-x-auto">
                        {JSON.stringify(msg.data.mongoFilter, null, 2)}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700"
                      onClick={async () => {
                        try {
                          await api.post('/campaigns/launch', {
                            name: `AI Campaign - ${new Date().toLocaleDateString()}`,
                            segmentId: null, // For simplicity in this demo
                            mongoFilter: msg.data.mongoFilter,
                            messageTemplate: msg.data.messageTemplate,
                            audienceSize: msg.data.audienceSize
                          });
                          alert('Campaign Launched successfully! Check the Analytics page or terminal for callbacks.');
                        } catch (err) {
                          alert('Failed to launch campaign');
                        }
                      }}
                    >
                      Launch Campaign
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 bg-slate-200 text-slate-700">
                <Bot size={16} />
              </div>
              <div className="p-3 rounded-lg bg-slate-100 text-slate-800 rounded-tl-none flex items-center gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 border-t bg-slate-50 rounded-b-lg">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="flex w-full gap-2"
        >
          <Input 
            placeholder="e.g. Bring back customers who spent over 5000 but haven't ordered in 60 days" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-white"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default Copilot;
