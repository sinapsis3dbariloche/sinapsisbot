
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBot from './components/ChatBot';
import StockBoard from './components/StockBoard';
import OrderQueue from './components/OrderQueue';
import BudgetCalculator from './components/BudgetCalculator';
import { SinapsisBotService } from './services/geminiService';
import { StockItem, Order } from './types';
import { subscribeToStock, subscribeToOrders, updateStockItemInDb, addOrderToDb } from './services/firebaseService';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);

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
      // El bot actualiza todo el array, pero en Firestore lo ideal es actualizar solo el cambiado.
      // Para simplificar esta versión, actualizamos los que difieran.
      newState.stock.forEach(async (item) => {
        await updateStockItemInDb(item);
      });
    }
    if (newState.orders) {
      // Si el bot agrega un pedido, lo guardamos
      const latestOrder = newState.orders[0];
      if (latestOrder) await addOrderToDb(latestOrder);
    }
  }, []);

  const botService = useMemo(() => 
    new SinapsisBotService(stock, orders, onBotUpdate), 
    [stock.length, orders.length, onBotUpdate]
  );

  const handleSendMessage = async (msg: string) => {
    return await botService.sendMessage(msg);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Conectando con Sinapsis 3D...</p>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="relative h-full">
        {/* Sync Indicator */}
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
