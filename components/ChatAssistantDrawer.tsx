import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Minus, Maximize2, Minimize2, Send, MessageSquarePlus, 
  RotateCcw, Sparkles, CheckCircle, AlertTriangle, ArrowRight,
  TrendingUp, TrendingDown, DollarSign, Package, FileText, Check, Clock,
  ExternalLink
} from 'lucide-react';
import { 
  processChatMessage, 
  AssistantState, 
  ChatContext, 
  AssistantResponseCard, 
  QuickReply,
  formatCurrency
} from '../services/chatAssistantLogic';
import { Customer, Supplier, StockItem, Remito, Expense, Quote } from '../types';

export interface ChatDrawerMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  card?: AssistantResponseCard;
  quickReplies?: QuickReply[];
}

interface ChatAssistantDrawerProps {
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

export const ChatAssistantDrawer: React.FC<ChatAssistantDrawerProps> = ({
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
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message
  const initialWelcomeMsg: ChatDrawerMessage = {
    id: 'welcome-1',
    role: 'model',
    text: `Hola ${userName || 'Lucas'}. Soy tu **Asistente Operativo SinaSoft**.\n\nEstoy conectado en tiempo real al sistema. Podés pedirme registrar ventas, gastos, chequear stock crítico, o consultar métricas del día.`,
    timestamp: new Date(),
    quickReplies: [
      { label: '➕ Registrar Venta', action: 'send_text', payload: 'quiero registrar una venta' },
      { label: '💰 Registrar Gasto', action: 'send_text', payload: 'quiero registrar un gasto' },
      { label: '📦 Ver Stock Crítico', action: 'send_text', payload: '¿cómo está el stock?' },
      { label: '📊 Ventas de Hoy', action: 'send_text', payload: '¿cuáles son las ventas de hoy?' },
      { label: '⚖️ Balance del Día', action: 'send_text', payload: 'balance de hoy' }
    ]
  };

  const [messages, setMessages] = useState<ChatDrawerMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch (e) {
      console.warn("Failed to parse saved chat history:", e);
    }
    return [initialWelcomeMsg];
  });

  const [assistantState, setAssistantState] = useState<AssistantState>(() => {
    try {
      const saved = localStorage.getItem(STATE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to parse saved assistant state:", e);
    }
    return { currentIntent: 'idle' };
  });

  // Save messages and state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(assistantState));
    } catch (e) {
      console.warn("Failed to store chat state:", e);
    }
  }, [messages, assistantState]);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleClearHistory = () => {
    setMessages([initialWelcomeMsg]);
    setAssistantState({ currentIntent: 'idle' });
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATE_STORAGE_KEY);
  };

  const handleCancelActiveFlow = () => {
    setAssistantState({ currentIntent: 'idle' });
    const cancelMsg: ChatDrawerMessage = {
      id: Date.now().toString(),
      role: 'model',
      text: '🔄 Flujo cancelado. El asistente vuelve al estado de consulta inicial.',
      timestamp: new Date(),
      quickReplies: [
        { label: '➕ Registrar Venta', action: 'send_text', payload: 'quiero registrar una venta' },
        { label: '💰 Registrar Gasto', action: 'send_text', payload: 'quiero registrar un gasto' },
        { label: '📦 Stock Crítico', action: 'send_text', payload: '¿cómo está el stock?' }
      ]
    };
    setMessages(prev => [...prev, cancelMsg]);
  };

  const handleOpenFullScreen = () => {
    setIsOpen(false);
    onNavigate('assistant');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend !== undefined ? textToSend : input;
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatDrawerMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: trimmed,
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

      // Process message through conversational slot-filling logic
      const result = processChatMessage(trimmed, assistantState, context);
      
      // Update state
      setAssistantState(result.newState);

      // Execute action if triggered
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
          if (result.card?.data) {
            result.card.data.remitoNumber = formattedNumber;
          }
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

      // Append model response
      const modelMsg: ChatDrawerMessage = {
        id: `mod-${Date.now()}`,
        role: 'model',
        text: result.replyText,
        timestamp: new Date(),
        card: result.card,
        quickReplies: result.quickReplies
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat assistant processing error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: '⚠️ Ocurrió un error al procesar la solicitud. Por favor intenta nuevamente.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReplyClick = (reply: QuickReply) => {
    if (reply.action === 'send_text' && reply.payload) {
      handleSendMessage(reply.payload);
    } else if (reply.action === 'navigate' && reply.payload) {
      onNavigate(reply.payload);
    }
  };

  const isFlowActive = assistantState.currentIntent !== 'idle';
  const flowLabel = assistantState.currentIntent === 'sale_registration'
    ? `Registrando Venta: ${assistantState.saleStep === 'AWAITING_CONFIRMATION' ? 'Resumen' : 'Paso ' + (assistantState.saleStep === 'ASK_CUSTOMER' ? '1/4' : assistantState.saleStep === 'ASK_ITEMS' ? '2/4' : assistantState.saleStep === 'ASK_PRICE' ? '3/4' : '4/4')}`
    : assistantState.currentIntent === 'expense_registration'
    ? `Registrando Gasto: ${assistantState.expenseStep === 'AWAITING_CONFIRMATION' ? 'Resumen' : 'Paso ' + (assistantState.expenseStep === 'ASK_DESCRIPTION' ? '1/4' : assistantState.expenseStep === 'ASK_SUPPLIER_OR_CATEGORY' ? '2/4' : assistantState.expenseStep === 'ASK_AMOUNT' ? '3/4' : '4/4')}`
    : null;

  return (
    <>
      {/* 1. Floating Launch Button (when drawer is closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group flex items-center gap-3 bg-slate-950 text-white px-5 py-3.5 rounded-full shadow-2xl border border-slate-800 hover:border-orange-500 hover:bg-slate-900 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
            title="Abrir Asistente Conversacional"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/30 group-hover:scale-110 transition-transform">
              <Bot size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black tracking-widest uppercase text-white">SinaSoft Bot</span>
                <span className="text-[8px] bg-orange-500/20 text-orange-400 font-bold px-1.5 py-0.2 rounded uppercase">Asistente</span>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold">Ventas, Gastos & Stock</p>
            </div>
            <Sparkles size={14} className="text-orange-400 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )}

      {/* 2. Minimized floating pill (when drawer is open but minimized) */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-3 bg-slate-950 text-white px-5 py-3 rounded-full shadow-2xl border border-orange-500 hover:bg-slate-900 transition-all active:scale-95"
          >
            <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white">
              <Bot size={16} />
            </div>
            <div className="text-left">
              <span className="text-[11px] font-black text-white uppercase tracking-wider block">Asistente Minimizado</span>
              {flowLabel && <span className="text-[9px] text-orange-400 font-bold">{flowLabel}</span>}
            </div>
            <Maximize2 size={16} className="text-slate-400 hover:text-white ml-2" />
          </button>
        </div>
      )}

      {/* 3. Main Drawer / Floating Panel */}
      {isOpen && !isMinimized && (
        <div 
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-300 ${
            isMaximized 
              ? 'w-[calc(100vw-2rem)] sm:w-[720px] h-[88vh] max-w-full' 
              : 'w-[calc(100vw-2rem)] sm:w-[440px] h-[640px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative bg-orange-600 p-2.5 rounded-2xl shadow-lg shadow-orange-600/30">
                <Bot size={20} className="text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black uppercase tracking-wider text-xs text-white">SinaSoft Asistente</h3>
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                    ONLINE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">Interactivo • Conectado a Base de Datos</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Nuevo contexto / Reiniciar chat"
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={handleOpenFullScreen}
                title="Llevar a ventana completa (Módulo Asistente IA)"
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-orange-400 rounded-xl transition-colors"
              >
                <ExternalLink size={16} />
              </button>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Reducir ventana" : "Maximizar ventana"}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimizar panel"
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar asistente"
                className="p-1.5 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-xl transition-colors ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Active Flow Progress Banner */}
          {isFlowActive && flowLabel && (
            <div className="px-4 py-2 bg-orange-50 border-b border-orange-100 flex items-center justify-between text-xs text-orange-900 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping" />
                <span className="font-black text-[11px] uppercase tracking-wide text-orange-800">{flowLabel}</span>
              </div>
              <button
                onClick={handleCancelActiveFlow}
                className="text-[10px] font-bold text-orange-700 hover:text-orange-900 underline uppercase tracking-wider"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[88%] flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-orange-600 text-white'
                  }`}>
                    {msg.role === 'user' ? (
                      <span className="text-[10px] font-black uppercase">{userName ? userName.slice(0, 1) : 'U'}</span>
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>

                  {/* Message Bubble & Card Container */}
                  <div className="space-y-2.5 min-w-0">
                    <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm border ${
                      msg.role === 'user' 
                        ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                        : 'bg-white text-slate-800 border-slate-200/80 rounded-tl-none whitespace-pre-line'
                    }`}>
                      {msg.text}

                      <div className={`text-[8px] mt-2 font-bold opacity-40 uppercase tracking-widest ${
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Interactive Cards */}
                    {msg.card && (
                      <div className="space-y-2">
                        {/* 1. Card: Sale Confirmation */}
                        {msg.card.type === 'sale_confirmation' && (
                          <div className="p-4 bg-white border-2 border-orange-500 rounded-2xl shadow-md space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                                <FileText size={14} /> Resumen de Venta
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
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
                                <span className="font-medium text-slate-800 text-right">
                                  {msg.card.data.items?.map((i: any) => `${i.quantity}x ${i.description}`).join(', ') || '-'}
                                </span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-slate-100">
                                <span className="font-bold text-slate-900">Monto Total:</span>
                                <span className="font-black text-sm text-orange-600">{formatCurrency(msg.card.data.total || 0)}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleSendMessage('confirmar venta')}
                                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                              >
                                <Check size={14} /> Confirmar Venta
                              </button>
                              <button
                                onClick={() => handleSendMessage('cancelar')}
                                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. Card: Sale Success */}
                        {msg.card.type === 'sale_success' && (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-2">
                            <div className="flex items-center gap-2 text-emerald-800">
                              <CheckCircle size={18} className="text-emerald-600" />
                              <span className="font-black text-xs uppercase tracking-wider">¡Venta Guardada en el Sistema!</span>
                            </div>
                            <p className="text-xs text-emerald-900">
                              Se emitió el remito para <strong>{msg.card.data.customerName}</strong> por un total de <strong>{formatCurrency(msg.card.data.total || 0)}</strong>.
                            </p>
                            <button
                              onClick={() => onNavigate('remitos')}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <FileText size={14} /> Ver en Módulo Ventas
                            </button>
                          </div>
                        )}

                        {/* 3. Card: Expense Confirmation */}
                        {msg.card.type === 'expense_confirmation' && (
                          <div className="p-4 bg-white border-2 border-red-500 rounded-2xl shadow-md space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                                <DollarSign size={14} /> Resumen de Gasto
                              </span>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {msg.card.data.paymentMethod || 'Efectivo'}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-700">
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-semibold">Concepto:</span>
                                <span className="font-bold text-slate-900">{msg.card.data.description}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-semibold">Proveedor/Rubro:</span>
                                <span className="font-medium text-slate-800">{msg.card.data.supplierName}</span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-slate-100">
                                <span className="font-bold text-slate-900">Total Egreso:</span>
                                <span className="font-black text-sm text-red-600">{formatCurrency(msg.card.data.amount || 0)}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleSendMessage('confirmar gasto')}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                              >
                                <Check size={14} /> Confirmar Gasto
                              </button>
                              <button
                                onClick={() => handleSendMessage('cancelar')}
                                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 4. Card: Expense Success */}
                        {msg.card.type === 'expense_success' && (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-2">
                            <div className="flex items-center gap-2 text-emerald-800">
                              <CheckCircle size={18} className="text-emerald-600" />
                              <span className="font-black text-xs uppercase tracking-wider">¡Gasto Registrado con Éxito!</span>
                            </div>
                            <p className="text-xs text-emerald-900">
                              Se ha imputado el gasto de <strong>{formatCurrency(msg.card.data.amount || 0)}</strong> en <strong>{msg.card.data.description}</strong>.
                            </p>
                            <button
                              onClick={() => onNavigate('expenses')}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <DollarSign size={14} /> Ver en Módulo Gastos
                            </button>
                          </div>
                        )}

                        {/* 5. Card: Critical Stock Alert */}
                        {msg.card.type === 'stock_critical' && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm space-y-2 text-xs">
                            <div className="flex items-center gap-1.5 text-amber-800 font-black uppercase tracking-wide">
                              <AlertTriangle size={15} className="text-amber-600" />
                              <span>Resumen de Stock de Taller</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-white p-2 rounded-xl border border-amber-100">
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">Cerrados</span>
                                <span className="text-sm font-black text-slate-900">{msg.card.data.totalClosed} bobinas</span>
                              </div>
                              <div className="bg-white p-2 rounded-xl border border-amber-100">
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">En Uso / Abiertos</span>
                                <span className="text-sm font-black text-slate-900">{msg.card.data.totalOpen} unidades</span>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => onNavigate('stock')}
                                className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                              >
                                Filamento 3D
                              </button>
                              <button
                                onClick={() => onNavigate('stock-grafica')}
                                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                              >
                                Stock Gráfica
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 6. Card: Orders & Production Summary */}
                        {msg.card.type === 'orders_summary' && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm space-y-2 text-xs">
                            <div className="flex items-center justify-between text-blue-900 font-black uppercase text-[11px]">
                              <span className="flex items-center gap-1.5"><Clock size={14} /> Cola de Producción</span>
                              <span className="bg-blue-200/70 text-blue-800 px-2 py-0.5 rounded-full text-[9px]">
                                {msg.card.data.totalPending} en curso
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-white p-2 rounded-xl border border-blue-100">
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">En Impresora</span>
                                <span className="text-sm font-black text-blue-700">{msg.card.data.inProductionCount} pedidos</span>
                              </div>
                              <div className="bg-white p-2 rounded-xl border border-blue-100">
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">Listos Entrega</span>
                                <span className="text-sm font-black text-emerald-700">{msg.card.data.readyCount} pedidos</span>
                              </div>
                            </div>
                            <button
                              onClick={() => onNavigate('remitos')}
                              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                            >
                              Ver Pedidos y Producción
                            </button>
                          </div>
                        )}

                        {/* 7. Card: Balance Summary */}
                        {msg.card.type === 'balance_summary' && (
                          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                              <span className="font-black text-[10px] uppercase text-slate-800 tracking-wider">Flujo del Día</span>
                              <span className={`text-[10px] font-black ${
                                msg.card.data.netToday >= 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {msg.card.data.netToday >= 0 ? '+' : ''}{formatCurrency(msg.card.data.netToday)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                                <span className="text-emerald-700 block text-[9px] uppercase font-bold flex items-center gap-1">
                                  <TrendingUp size={11} /> Cobrado
                                </span>
                                <span className="font-black text-emerald-800">{formatCurrency(msg.card.data.incomeToday)}</span>
                              </div>
                              <div className="bg-red-50 p-2 rounded-xl border border-red-100">
                                <span className="text-red-700 block text-[9px] uppercase font-bold flex items-center gap-1">
                                  <TrendingDown size={11} /> Gastos
                                </span>
                                <span className="font-black text-red-800">{formatCurrency(msg.card.data.expensesToday)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => onNavigate('balances')}
                              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                            >
                              Abrir Tablero de Balances
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Replies Buttons */}
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.quickReplies.map((qr, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickReplyClick(qr)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-300 rounded-xl text-[11px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
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

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-200">
                  <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce [animation-delay:200ms]" />
                  <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce [animation-delay:400ms]" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Procesando...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions bar (when idle) */}
          {!isFlowActive && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0 pl-1">Sugerencias:</span>
              <button
                onClick={() => handleSendMessage('quiero registrar una venta')}
                className="shrink-0 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[10px] font-bold transition-colors"
              >
                + Venta
              </button>
              <button
                onClick={() => handleSendMessage('quiero registrar un gasto')}
                className="shrink-0 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition-colors"
              >
                + Gasto
              </button>
              <button
                onClick={() => handleSendMessage('¿cómo está el stock?')}
                className="shrink-0 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-colors"
              >
                Stock Crítico
              </button>
              <button
                onClick={() => handleSendMessage('¿cuáles son las ventas de hoy?')}
                className="shrink-0 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-colors"
              >
                Ventas Hoy
              </button>
              <button
                onClick={() => handleSendMessage('pedidos pendientes')}
                className="shrink-0 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-colors"
              >
                Producción
              </button>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                handleSendMessage(); 
              }} 
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  assistantState.currentIntent === 'sale_registration'
                    ? "Respondé el dato de la venta..."
                    : assistantState.currentIntent === 'expense_registration'
                    ? "Respondé el dato del gasto..."
                    : "Escribí tu consulta o acción (ej: 'Venta a Juan por $12000')..."
                }
                className="flex-1 bg-slate-100 border border-transparent rounded-xl px-4 py-3 text-xs focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-semibold outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-700 disabled:opacity-40 transition-all shadow-md shadow-orange-600/20 active:scale-95 shrink-0"
                title="Enviar mensaje"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
