
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import StockBoard from './components/StockBoard';
import OrderQueue from './components/OrderQueue';
import BudgetCalculator from './components/BudgetCalculator';
import { StockItem, Order } from './types';
import { subscribeToStock, subscribeToOrders, subscribeToSettings, updateStockItemInDb, updateSettings, resetAllStockInDb } from './services/firebaseService';
import { DEFAULT_PLA_PRICE, DEFAULT_PETG_PRICE, DEFAULT_DESIGN_PRICE, DEFAULT_POST_PROCESS_PRICE } from './constants';
import { Loader2, RotateCcw, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calc');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [plaPrice, setPlaPrice] = useState<number>(DEFAULT_PLA_PRICE);
  const [petgPrice, setPetgPrice] = useState<number>(DEFAULT_PETG_PRICE);
  const [designPrice, setDesignPrice] = useState<number>(DEFAULT_DESIGN_PRICE);
  const [postProcessPrice, setPostProcessPrice] = useState<number>(DEFAULT_POST_PROCESS_PRICE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);

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
      if (settings?.postProcessPrice) setPostProcessPrice(settings.postProcessPrice);
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

  const handleResetAllStock = async () => {
    if (window.confirm('⚠️ ¿Estás seguro? Esta acción pondrá TODOS los contadores de stock en CERO. Esto es útil para iniciar un control de inventario desde cero.')) {
      await resetAllStockInDb();
      setActiveTab('stock');
      alert('Inventario reiniciado correctamente.');
    }
  };

  const handleUpdatePrices = async (updates: { pla?: number, petg?: number, design?: number, postProcess?: number }) => {
    await updateSettings({ 
      ...(updates.pla && { plaPrice: updates.pla }),
      ...(updates.petg && { petgPrice: updates.petg }),
      ...(updates.design && { designPrice: updates.design }),
      ...(updates.postProcess && { postProcessPrice: updates.postProcess })
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-orange-600" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Conectando con Sinapsis 3D...</p>
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
        {activeTab === 'stock' && <StockBoard stock={stock} onUpdateStock={handleUpdateStockItem} />}
        
        {activeTab === 'stock-reset' && (
          <div className="max-w-2xl mx-auto py-20 px-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-12 text-center space-y-8 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Reiniciar Inventario</h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
                  Esta acción establecerá todos los contadores de filamentos (Cerrados y Abiertos) en <strong>cero</strong>. Úsalo únicamente si vas a realizar un conteo físico completo desde cero.
                </p>
              </div>
              <button 
                onClick={handleResetAllStock}
                className="w-full flex items-center justify-center gap-4 py-6 bg-red-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-600/30 active:scale-95 group"
              >
                <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                Ejecutar Reinicio Maestro
              </button>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">
                Requiere confirmación adicional después de hacer clic.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'queue' && <OrderQueue orders={orders} />}
        {activeTab === 'calc' && (
          <BudgetCalculator 
            plaPrice={plaPrice} 
            petgPrice={petgPrice}
            designPrice={designPrice}
            postProcessPrice={postProcessPrice}
            onUpdatePrices={handleUpdatePrices} 
          />
        )}
      </div>
    </Layout>
  );
};

export default App;
