
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBot from './components/ChatBot';
import StockBoard from './components/StockBoard';
import OrderQueue from './components/OrderQueue';
import BudgetCalculator from './components/BudgetCalculator';
import { SinapsisBotService } from './services/geminiService';
import { StockItem, Order } from './types';
import { subscribeToStock, subscribeToOrders, updateStockItemInDb, addOrderToDb } from './services/firebaseService';
import { Loader2, Key, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  // Verificación de API Key
  useEffect(() => {
    const checkKey = async () => {
      // Si estamos en el entorno de Google AI Studio, verificamos si seleccionó llave
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // En Vercel o local con .env, asumimos que la llave está configurada
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  // Suscripción a Firebase
  useEffect(() => {
    const unsubStock = subscribeToStock((newStock) => {
      setStock(newStock);
      setIsLoading(false);
      setIsSynced(true);
      setTimeout(() => setIsSynced(false), 2000);
    });

    const unsubOrders = subscribeToOrders((newOrders) => {
      setOrders(newOrders);
    });

    return () => {
      unsubStock();
      unsubOrders();
    };
  }, []);

  const handleUpdateStockItem = async (id: string, updates: Partial<StockItem>) => {
    const item = stock.find(s => s.id === id);
    if (item) {
      const updatedItem = { ...item, ...updates };
      await updateStockItemInDb(updatedItem);
    }
  };

  const onBotUpdate = useCallback(async (newState: { stock?: StockItem[], orders?: Order[] }) => {
    if (newState.stock) {
      for (const item of newState.stock) {
        await updateStockItemInDb(item);
      }
    }
    if (newState.orders) {
      const latestOrder = newState.orders[0];
      if (latestOrder) await addOrderToDb(latestOrder);
    }
  }, []);

  const botService = useMemo(() => 
    new SinapsisBotService(stock, orders, onBotUpdate), 
    [stock, orders, onBotUpdate]
  );

  const handleSendMessage = async (msg: string) => {
    try {
      return await botService.sendMessage(msg);
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        if (window.aistudio) await window.aistudio.openSelectKey();
      }
      throw error;
    }
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Conectando con Sinapsis 3D...</p>
      </div>
    );
  }

  if (hasApiKey === false) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl">
          <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
            <Zap size={40} className="text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">¡Hola Lucas!</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Para que <strong>SinapsisBot</strong> pueda ayudarte, necesitamos vincularlo con tu cuenta de Google AI.
          </p>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            <Key size={20} />
            CONECTAR SINAPSISBOT
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="relative h-full">
        <div className={`absolute -top-6 right-0 flex items-center gap-1.5 transition-opacity duration-500 ${isSynced ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nube Sincronizada</span>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full">
          {activeTab === 'chat' && <ChatBot onSendMessage={handleSendMessage} />}
          {activeTab === 'stock' && <StockBoard stock={stock} onUpdateStock={handleUpdateStockItem} />}
          {activeTab === 'queue' && <OrderQueue orders={orders} />}
          {activeTab === 'calc' && <BudgetCalculator />}
        </div>
      </div>
    </Layout>
  );
};

export default App;
