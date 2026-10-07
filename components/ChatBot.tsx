import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Scale, AlertTriangle, Sparkles, Trash2, 
  MessageSquarePlus, Check, CheckCircle, Clock, DollarSign, FileText,
  TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react';
import { Customer, Supplier, StockItem, Remito, Expense, Quote } from '../types';
import { 
  processChatMessage, 
  AssistantState, 
  ChatContext, 
  AssistantResponseCard, 
  QuickReply,
  formatCurrency
} from '../services/chatAssistantLogic';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  card?: AssistantResponseCard;
  quickReplies?: QuickReply[];
}

interface ChatBotProps {
  customers: Customer[];
  suppliers: Supplier[];
  stock: StockItem[];
  remitos: Remito[];
  expenses: Expense[];
  quotes: Quote[];
  userName: string;
  getNextRemitoNumber: () => Promise<number>;
  onSaveRemito: (remito: Remito) => Promise<void> | void;
  onSaveExpense: (expense: Expense) => Promise<void> | void;
  onNavigate: (tab: string, filters?: any) => void;
}

const STORAGE_KEY = 'sinasoft_assistant_chat_v2';
const STATE_STORAGE_KEY = 'sinasoft_assistant_state_v2';

const ChatBot: React.FC<ChatBotProps> = ({
  customers,
  suppliers,
  stock,
  remitos,
  expenses,
  quotes,
  userName,
  getNextRemitoNumber,
  onSaveRemito,
  onSaveExpense,
  onNavigate
}) => {
  const initialWelcomeMsg: ChatMessageItem = {
    id: 'full-welcome',
    role: 'model',
    text: `Bienvenido al Centro de Control Conversacional, ${userName || 'Lucas'}.\n\nEste asistente está conectado directamente a los servicios y base de datos de SinaSoft. Podés registrar ventas y gastos guiados paso a paso, chequear el estado del stock o consultar métricas del día mediante lenguaje natural.`,
    timestamp: new Date(),
    quickReplies: [
      { label: '➕ Registrar Venta', action: 'send_text', payload: 'quiero registrar una venta' },
      { label: '💰 Registrar Gasto', action: 'send_text', payload: 'quiero registrar un gasto' },
      { label: '📦 Stock Crítico', action: 'send_text', payload: '¿cómo está el stock?' },
      { label: '📊 Ventas de Hoy', action: 'send_text', payload: '¿cuáles son las ventas de hoy?' },
      { label: '⚖️ Balance del Día', action: 'send_text', payload: 'balance de hoy' }
    ]
  };

  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch (e) {
      console.warn("Failed to parse saved chat:", e);
    }
    return [initialWelcomeMsg];
  });

  const [assistantState, setAssistantState] = useState<AssistantState>(() => {
    try {
      const saved = localStorage.getItem(STATE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to parse saved state:", e);
    }
    return { currentIntent: 'idle' };
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(assistantState));
    } catch (e) {
      console.warn("Storage error:", e);
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, assistantState]);

  const handleClearChat = () => {
    if (window.confirm('¿Deseas reiniciar la conversación con el asistente?')) {
      setMessages([initialWelcomeMsg]);
      setAssistantState({ currentIntent: 'idle' });
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STATE_STORAGE_KEY);
    }
  };

  const handleCancelActiveFlow = () => {
    setAssistantState({ currentIntent: 'idle' });
    const cancelMsg: ChatMessageItem = {
      id: Date.now().toString(),
      role: 'model',
      text: '🔄 Operación cancelada. El asistente está listo para una nueva consulta.',
      timestamp: new Date(),
      quickReplies: [
        { label: '➕ Registrar Venta', action: 'send_text', payload: 'quiero registrar una venta' },
        { label: '💰 Registrar Gasto', action: 'send_text', payload: 'quiero registrar un gasto' },
        { label: '📦 Stock Crítico', action: 'send_text', payload: '¿cómo está el stock?' }
      ]
    };
    setMessages(prev => [...prev, cancelMsg]);
  };

  const handleSend = async (textToSend?: string) => {
    const rawText = textToSend !== undefined ? textToSend : input;
    const messageText = rawText.trim();
    if (!messageText || isLoading) return;

    const userMsg: ChatMessageItem = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context: ChatContext = {
        customers,
        suppliers,
        stock,
        remitos,
        expenses,
        quotes,
        userName
      };

      const result = processChatMessage(messageText, assistantState, context);
      setAssistantState(result.newState);

      // Execute action if needed
      if (result.actionToExecute) {
        if (result.actionToExecute.type === 'create_sale') {
          const draft = result.actionToExecute.payload;
          const nextNum = await getNextRemitoNumber();
          const formattedNumber = `0001 - ${nextNum.toString().padStart(5, '0')}`;

          const newRemito: Remito = {
            id: `R${Date.now()}`,
            number: formattedNumber,
            customerId: draft.customerId || 'c_anonimo',
            customerName: draft.customerName || 'Cliente General',
            date: new Date().toISOString().split('T')[0],
            items: draft.items || [{ description: draft.itemDescription || 'Venta 3D', quantity: draft.itemQuantity || 1, unitPrice: draft.itemUnitPrice || 0, total: draft.total || 0 }],
            total: draft.total || 0,
            status: draft.status || 'Pendiente',
            productionStatus: 'En Producción',
            amountPaid: draft.amountPaid || 0,
            paymentHistory: draft.amountPaid > 0 ? [{ amount: draft.amountPaid, date: new Date().toISOString().split('T')[0] }] : [],
            notes: 'Registrado mediante Asistente Conversacional',
            createdAt: new Date().toISOString(),
            history: [{
              id: Date.now().toString(),
              date: new Date().toISOString(),
              user: userName || 'Asistente',
              action: 'Creación de Venta',
              changes: 'Registrado a través del Asistente Conversacional.'
            }]
          };

          await onSaveRemito(newRemito);
        } else if (result.actionToExecute.type === 'create_expense') {
          const draft = result.actionToExecute.payload;
          const newExpense: Expense = {
            id: `E${Date.now()}`,
            date: new Date().toISOString(),
            supplierId: draft.supplierId || 's_general',
            supplierName: draft.supplierName || 'Gastos Operativos',
            items: [{
              id: `item-${Date.now()}`,
              description: draft.description || 'Gasto operativo',
              quantity: 1,
              unitPrice: draft.amount || 0,
              total: draft.amount || 0
            }],
            total: draft.amount || 0,
            notes: `Método: ${draft.paymentMethod || 'Efectivo'}. Registrado vía Asistente.`,
            createdAt: new Date().toISOString(),
            history: [{
              id: Date.now().toString(),
              date: new Date().toISOString(),
              user: userName || 'Asistente',
              action: 'Creación de Gasto',
              changes: 'Registrado a través del Asistente Conversacional.'
            }]
          };

          await onSaveExpense(newExpense);
        } else if (result.actionToExecute.type === 'navigate') {
          onNavigate(result.actionToExecute.payload);
        }
      }

      const modelMsg: ChatMessageItem = {
        id: `mod-${Date.now()}`,
        role: 'model',
        text: result.replyText,
        timestamp: new Date(),
        card: result.card,
        quickReplies: result.quickReplies
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("ChatBot error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'Error de comunicación. Por favor, reintente su consulta.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (qr: QuickReply) => {
    if (qr.action === 'send_text' && qr.payload) {
      handleSend(qr.payload);
    } else if (qr.action === 'navigate' && qr.payload) {
      onNavigate(qr.payload);
    }
  };

  const isFlowActive = assistantState.currentIntent !== 'idle';
  const flowLabel = assistantState.currentIntent === 'sale_registration'
    ? `Registrando Venta: ${assistantState.saleStep === 'AWAITING_CONFIRMATION' ? 'Resumen Final' : 'Paso ' + (assistantState.saleStep === 'ASK_CUSTOMER' ? '1/4' : assistantState.saleStep === 'ASK_ITEMS' ? '2/4' : assistantState.saleStep === 'ASK_PRICE' ? '3/4' : '4/4')}`
    : assistantState.currentIntent === 'expense_registration'
    ? `Registrando Gasto: ${assistantState.expenseStep === 'AWAITING_CONFIRMATION' ? 'Resumen Final' : 'Paso ' + (assistantState.expenseStep === 'ASK_DESCRIPTION' ? '1/4' : assistantState.expenseStep === 'ASK_SUPPLIER_OR_CATEGORY' ? '2/4' : assistantState.expenseStep === 'ASK_AMOUNT' ? '3/4' : '4/4')}`
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-600/30">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black uppercase tracking-widest text-xs text-orange-500">SinapsisBot</h2>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                CONECTADO
              </span>
            </div>
            <p className="text-xs font-bold text-slate-300 flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> ASISTENTE OPERATIVO DEL SISTEMA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFlowActive && flowLabel && (
            <div className="hidden sm:flex items-center gap-2 bg-orange-950/80 border border-orange-800/80 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-bold text-orange-300 uppercase">{flowLabel}</span>
              <button
                onClick={handleCancelActiveFlow}
                className="text-[9px] font-bold text-orange-400 hover:text-white underline ml-1"
              >
                Cancelar
              </button>
            </div>
          )}
          <button 
            onClick={handleClearChat}
            title="Borrar Chat"
            className="p-2 hover:bg-red-900/30 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-orange-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>

              <div className="space-y-3 min-w-0">
                <div className={`p-6 rounded-[2rem] text-[13px] font-medium leading-relaxed shadow-sm whitespace-pre-line border ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                    : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                }`}>
                  {msg.text}
                  <div className={`text-[9px] mt-3 font-bold opacity-30 uppercase tracking-widest ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Cards */}
                {msg.card && (
                  <div className="space-y-2">
                    {msg.card.type === 'sale_confirmation' && (
                      <div className="p-5 bg-white border-2 border-orange-500 rounded-2xl shadow-lg space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                            <FileText size={16} /> Resumen de Venta
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            msg.card.data.status === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {msg.card.data.status}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold">Cliente:</span>
                            <span className="font-bold text-slate-900">{msg.card.data.customerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold">Ítems:</span>
                            <span className="font-medium text-slate-800">{msg.card.data.items?.map((i: any) => `${i.quantity}x ${i.description}`).join(', ')}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-100">
                            <span className="font-bold text-slate-900">Monto Total:</span>
                            <span className="font-black text-base text-orange-600">{formatCurrency(msg.card.data.total || 0)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleSend('confirmar venta')}
                            className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Check size={16} /> Confirmar y Guardar Venta
                          </button>
                          <button
                            onClick={() => handleSend('cancelar')}
                            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.card.type === 'sale_success' && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-2">
                        <div className="flex items-center gap-2 text-emerald-800">
                          <CheckCircle size={18} className="text-emerald-600" />
                          <span className="font-black text-xs uppercase tracking-wider">¡Venta Registrada con Éxito!</span>
                        </div>
                        <p className="text-xs text-emerald-900">
                          Registrada para <strong>{msg.card.data.customerName}</strong> por un total de <strong>{formatCurrency(msg.card.data.total || 0)}</strong>.
                        </p>
                        <button
                          onClick={() => onNavigate('remitos')}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <FileText size={14} /> Ver en Módulo Ventas
                        </button>
                      </div>
                    )}

                    {msg.card.type === 'expense_confirmation' && (
                      <div className="p-5 bg-white border-2 border-red-500 rounded-2xl shadow-lg space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                            <DollarSign size={16} /> Resumen de Gasto
                          </span>
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {msg.card.data.paymentMethod || 'Efectivo'}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold">Concepto:</span>
                            <span className="font-bold text-slate-900">{msg.card.data.description}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold">Proveedor:</span>
                            <span className="font-medium text-slate-800">{msg.card.data.supplierName}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-100">
                            <span className="font-bold text-slate-900">Monto:</span>
                            <span className="font-black text-base text-red-600">{formatCurrency(msg.card.data.amount || 0)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleSend('confirmar gasto')}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Check size={16} /> Confirmar y Guardar Gasto
                          </button>
                          <button
                            onClick={() => handleSend('cancelar')}
                            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick replies */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.quickReplies.map((qr, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickReply(qr)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-300 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                      >
                        {qr.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 items-center bg-white px-6 py-4 rounded-full shadow-sm border border-slate-100">
              <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce [animation-delay:200ms]" />
              <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce [animation-delay:400ms]" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Procesando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isFlowActive 
                ? "Respondé el dato solicitado..." 
                : "Escribí tu consulta (ej: 'Venta a Juan por $15000' o '¿Cómo está el stock?')..."
            }
            className="flex-1 bg-slate-100 border border-transparent rounded-2xl px-6 py-4 text-sm focus:bg-white focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all font-semibold outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-orange-600 text-white px-8 rounded-2xl hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xl shadow-orange-600/20 active:scale-95 flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
