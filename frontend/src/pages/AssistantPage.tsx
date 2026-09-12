import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Sparkles, Send, ArrowRight, ShieldCheck, 
  Store, PlusCircle, Sliders, Truck, Layers
} from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  suggested_actions?: any[];
  time: string;
}

export const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello, I am LoopMarket's AI Circular Assistant. I use MiniMax NLP parsing and Gemini grounded recommendations to help you procure surplus materials, rank verified buyers, and calculate freight logistics.\n\nHow can I support your secondary material exchange today?",
      suggested_actions: [
        { label: "Find cardboard near Ahmedabad", action: "QUERY", prompt: "Find cardboard near Ahmedabad" },
        { label: "Who buys used pallets?", action: "QUERY", prompt: "Who buys used pallets in Gujarat?" },
        { label: "Calculate delivery cost to Vadodara", action: "QUERY", prompt: "How much will delivery cost from Ahmedabad to Vadodara?" },
        { label: "Launch What-If Simulator", action: "NAVIGATE", route: "/simulator" }
      ],
      time: "Just now"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await api.chatAssistant(query);
      const botMsg: Message = {
        sender: 'assistant',
        text: res.reply,
        suggested_actions: res.suggested_actions || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: "I am having trouble reaching the AI gateway. You can continue exploring the Marketplace or Simulator manually.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (act: any) => {
    if (act.action === 'NAVIGATE') {
      navigate(act.route);
    } else if (act.action === 'QUERY') {
      handleSendMessage(act.prompt);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4 text-xs h-[calc(100vh-5rem)] flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-950 text-white rounded-lg">
            <Bot className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-950">LoopMarket AI Circular Copilot</h1>
            <p className="text-slate-500 text-xs">Connected to Layer 1 (MiniMax L6) & Layer 2 (Gemini Grounded Recommender)</p>
          </div>
        </div>
        <span className="b2b-badge bg-emerald-50 text-emerald-700 border-emerald-300">
          DATABASE GROUNDED
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl p-4 rounded-xl text-xs space-y-2.5 ${
                m.sender === 'user'
                  ? 'bg-slate-950 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

              {/* Action Chips */}
              {m.suggested_actions && m.suggested_actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {m.suggested_actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleActionClick(act)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      {act.label} <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1 px-1">{m.time}</span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-500" />
            LoopMarket Copilot querying circular database...
          </div>
        )}
      </div>

      {/* Bottom Input Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm shrink-0 flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask anything (e.g. 'Find cardboard near Ahmedabad', 'How much will delivery cost?')..."
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-900"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputVal.trim()}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </div>

    </div>
  );
};
