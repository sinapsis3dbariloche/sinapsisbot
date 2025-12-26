
import React, { useState } from 'react';
import { StockItem, FilamentType } from '../types';
import { Droplet, Plus, Minus, AlertCircle, Search, Layers, ChevronRight } from 'lucide-react';

interface StockBoardProps {
  stock: StockItem[];
  onUpdateStock?: (id: string, updates: Partial<StockItem>) => void;
}

const StockBoard: React.FC<StockBoardProps> = ({ stock, onUpdateStock }) => {
  const [activeType, setActiveType] = useState<FilamentType>(FilamentType.PLA);
  const [searchTerm, setSearchTerm] = useState('');

  const checkAlert = (item: StockItem) => {
    if (item.type === FilamentType.PETG) return item.closedCount < 1;
    const isCritical = item.color === "Blanco" || item.color === "Negro";
    return item.closedCount < (isCritical ? 3 : 1);
  };

  const getMin = (item: StockItem) => {
    if (item.type === FilamentType.PETG) return 1;
    return (item.color === "Blanco" || item.color === "Negro") ? 3 : 1;
  };

  const filteredStock = stock
    .filter(item => item.type === activeType)
    .filter(item => item.color.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aAlert = checkAlert(a);
      const bAlert = checkAlert(b);
      if (aAlert && !bAlert) return -1;
      if (!aAlert && bAlert) return 1;
      return a.color.localeCompare(b.color);
    });

  const updateCount = (id: string, field: 'closedCount' | 'openCount', delta: number) => {
    const item = stock.find(s => s.id === id);
    if (!item || !onUpdateStock) return;
    onUpdateStock(id, { [field]: Math.max(0, item[field] + delta) });
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2.5 rounded-xl text-white shadow-lg shadow-orange-600/20">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Control de Stock</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sinapsis 3D Bariloche</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-8 py-2 text-[11px] font-bold focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button 
              onClick={() => setActiveType(FilamentType.PLA)}
              className={`flex-1 sm:px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all ${activeType === FilamentType.PLA ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              PLA
            </button>
            <button 
              onClick={() => setActiveType(FilamentType.PETG)}
              className={`flex-1 sm:px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all ${activeType === FilamentType.PETG ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              PET-G
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[1.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Filamento</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cerrados</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Abiertos</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStock.map((item) => {
                const low = checkAlert(item);
                const min = getMin(item);
                return (
                  <tr key={item.id} className={`group hover:bg-slate-50/80 transition-all ${low ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-xl shadow-inner border border-black/5 shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: getHexColor(item.color) }}
                        >
                          <Droplet size={14} className={isDark(item.color) ? 'text-white/30' : 'text-black/10'} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase text-xs tracking-tight leading-none mb-1">{item.color}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{item.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => updateCount(item.id, 'closedCount', -1)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-colors"><Minus size={12} /></button>
                        <div className="flex flex-col items-center min-w-[2.5rem]">
                          <span className={`font-black text-base leading-none ${low ? 'text-orange-600' : 'text-slate-900'}`}>{item.closedCount}</span>
                          <span className="text-[7px] text-slate-400 font-bold uppercase mt-1">Min: {min}</span>
                        </div>
                        <button onClick={() => updateCount(item.id, 'closedCount', 1)} className="p-1.5 text-orange-600 hover:bg-white rounded-lg transition-colors shadow-sm"><Plus size={12} /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => updateCount(item.id, 'openCount', -1)} className="p-1.5 text-slate-300 hover:bg-white rounded-lg transition-colors"><Minus size={12} /></button>
                        <span className="font-black text-base text-slate-900 leading-none min-w-[1.5rem]">{item.openCount}</span>
                        <button onClick={() => updateCount(item.id, 'openCount', 1)} className="p-1.5 text-orange-600 hover:bg-white rounded-lg transition-colors shadow-sm"><Plus size={12} /></button>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {low ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 animate-pulse-soft">
                          <AlertCircle size={10} /> Reponer
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-1 text-green-600 text-[8px] font-black uppercase tracking-widest">
                          OK <ChevronRight size={10} className="opacity-30" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function getHexColor(color: string) {
  const map: any = {
    "Negro": "#1a1a1a", "Blanco": "#ffffff", "Gris": "#94a3b8", "Gris claro": "#cbd5e1",
    "Gris Plata": "#e2e8f0", "Azul": "#2563eb", "Celeste": "#60a5fa", "Aqua": "#2dd4bf",
    "Rojo": "#dc2626", "Dorado": "#fbbf24", "Amarillo": "#fde047", "Amarillo pastel": "#fef08a", "Naranja": "#f97316",
    "Piel": "#ffedd5", "Verde claro": "#4ade80", "Verde Oscuro": "#166534", "Rosa": "#f472b6",
    "Violeta": "#8b5cf6", "Lila": "#ddd6fe", "Fucsia": "#db2777", "Marron": "#78350f",
    "Marron chocolate": "#451a03", "Celeste claro (pastel)": "#bfdbfe"
  };
  return map[color] || "#ccc";
}

function isDark(color: string) {
  const darks = ["Negro", "Azul", "Rojo", "Verde Oscuro", "Marron", "Marron chocolate", "Violeta", "Fucsia"];
  return darks.includes(color);
}

export default StockBoard;
