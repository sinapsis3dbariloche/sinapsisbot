
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBot from './components/ChatBot';
import StockBoard from './components/StockBoard';
import OrderQueue from './components/OrderQueue';
import BudgetCalculator from './components/BudgetCalculator';
import { SinapsisBotService } from './services/geminiService';
import { StockItem, Order, FilamentType } from './types';
import { subscribeToStock, subscribeToOrders, subscribeToSettings, updateStockItemInDb, addOrderToDb, updateSettings } from './services/firebaseService';
import { DEFAULT_PLA_PRICE, DEFAULT_PETG_PRICE, DEFAULT_DESIGN_PRICE } from './constants';
import { Loader2, Key, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [plaPrice, setPlaPrice] = useState<number>(DEFAULT_PLA_PRICE);
  const [petgPrice, setPetgPrice] = useState<number>(DEFAULT_PETG_PRICE);
  const [designPrice, setDesignPrice] = useState<number>(DEFAULT_DESIGN_PRICE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

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

    const unsubSettings = subscribeToSettings((settings) => {
      if (settings?.plaPrice) setPlaPrice(settings.plaPrice);
      if (settings?.petgPrice) setPetgPrice(settings.petgPrice);
      if (settings?.designPrice) setDesignPrice(settings.designPrice);
    });

    return () => {
      unsubStock();
      unsubOrders();
      unsubSettings();
    };
  }, []);

  const handleUpdateStockItem = async (id: string, updates: Partial<StockItem>) => {
    const item = stock.find(s => s.id === id);
    if (item) {
      await updateStockItemInDb({ ...item, ...updates });
    }
  };

  const handleUpdatePrices = async (updates: { pla?: number, petg?: number, design?: number }) => {
    await updateSettings({ 
      ...(updates.pla && { plaPrice: updates.pla }),
      ...(updates.petg && { petgPrice: updates.petg }),
      ...(updates.design && { designPrice: updates.design })
    });
  };

  const onBotUpdate = useCallback(async (newState: { stock?: StockItem[], orders?: Order[] }) => {
    if (newState.stock) {
      for (const item of newState.stock) await updateStockItemInDb(item);
    }
    if (newState.orders && newState.orders[0]) await addOrderToDb(newState.orders[0]);
  }, []);

  const botService = useMemo(() => 
    new SinapsisBotService(stock, orders, { pla: plaPrice, petg: petgPrice, design: designPrice }, onBotUpdate), 
    [stock, orders, plaPrice, petgPrice, designPrice, onBotUpdate]
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

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-orange-600" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Conectando con Sinapsis 3D...</p>
      </div>
    );
  }

  if (hasApiKey === false) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl">
          <div className="bg-orange-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Zap size={40} className="text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">SINAPSISBOT</h1>
          <button 
            onClick={() => window.aistudio?.openSelectKey().then(() => setHasApiKey(true))}
            className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-600/20 uppercase tracking-widest text-xs"
          >
            CONECTAR LLAVE AI
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="relative h-full">
        <div className={`absolute -top-6 right-0 flex items-center gap-1.5 transition-opacity duration-500 ${isSynced ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nube OK</span>
        </div>
        {activeTab === 'chat' && <ChatBot onSendMessage={handleSendMessage} />}
        {activeTab === 'stock' && <StockBoard stock={stock} onUpdateStock={handleUpdateStockItem} />}
        {activeTab === 'queue' && <OrderQueue orders={orders} />}
        {activeTab === 'calc' && (
          <BudgetCalculator 
            plaPrice={plaPrice} 
            petgPrice={petgPrice}
            designPrice={designPrice}
            onUpdatePrices={handleUpdatePrices} 
          />
        )}
      </div>
    </Layout>
  );
};

export default App;
