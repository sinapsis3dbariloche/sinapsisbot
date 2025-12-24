
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Scale, AlertTriangle, Sparkles, Trash2, MessageSquarePlus } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatBotProps {
  onSendMessage: (msg: string) => Promise<string>;
}

const ChatBot: React.FC<ChatBotProps> = ({ onSendMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('sinapsis_chat_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
    return [{ 
      role: 'model', 
      text: 'Bienvenido, Lucas. Sistema operativo de Sinapsis 3D listo. ¿En qué puedo asistirte?', 
      timestamp: new Date() 
    }];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    { text: "¿Qué filamento tengo que reponer?", icon: <AlertTriangle size={14} />, color: "bg-orange-50 text-orange-700 border-orange-200" },
    { text: "Calcular nuevo presupuesto", icon: <Scale size={14} />, color: "bg-slate-50 text-slate-700 border-slate-200" },
    { text: "¿Cómo vienen los pedidos?", icon: <Sparkles size={14} />, color: "bg-blue-50 text-blue-700 border-blue-200" }
  ];

  useEffect(() => {
    localStorage.setItem('sinapsis_chat_history', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleClearChat = () => {
    if (confirm('¿Desea eliminar todo el historial de conversación?')) {
      const initialMsg: ChatMessage = { 
        role: 'model', 
        text: 'Historial eliminado. Sistema reiniciado.', 
        timestamp: new Date() 
      };
      setMessages([initialMsg]);
      localStorage.removeItem('sinapsis_chat_history');
    }
  };

  const handleNewContext = () => {
    const initialMsg: ChatMessage = { 
      role: 'model', 
      text: 'Nueva ventana de contexto operativa. Los datos previos han sido omitidos de la memoria activa.', 
      timestamp: new Date() 
    };
    setMessages([initialMsg]);
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await onSendMessage(messageText);
      const modelMsg: ChatMessage = { role: 'model', text: response, timestamp: new Date() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Error de comunicación. Por favor, reintente su consulta.', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-2.5 rounded-2xl shadow-lg">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-black uppercase tracking-widest text-[11px] text-orange-500">SinapsisBot</h2>
            <p className="text-xs font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ASISTENTE OPERATIVO
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleNewContext}
            title="Nuevo Contexto"
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
          >
            <MessageSquarePlus size={20} />
          </button>
          <button 
            onClick={handleClearChat}
            title="Borrar Chat"
            className="p-2 hover:bg-red-900/30 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-orange-600 text-white'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`p-6 rounded-[2rem] text-[13px] font-medium leading-relaxed shadow-sm whitespace-pre-wrap border ${msg.role === 'user' ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'}`}>
                {msg.text}
                <div className={`text-[9px] mt-3 font-bold opacity-30 uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 items-center bg-white px-6 py-4 rounded-full shadow-sm border border-slate-100">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t border-slate-100">
        <div className="flex flex-wrap gap-2 mb-6">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s.text)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider border transition-all hover:translate-y-[-2px] hover:shadow-md disabled:opacity-50 ${s.color}`}
            >
              {s.icon}
              {s.text}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escriba su consulta operativa..."
            className="flex-1 bg-slate-100 border-none rounded-2xl px-8 py-5 text-sm focus:ring-2 focus:ring-orange-600 transition-all font-semibold"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-orange-600 text-white px-8 rounded-2xl hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xl shadow-orange-600/20"
          >
            <Send size={22} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
