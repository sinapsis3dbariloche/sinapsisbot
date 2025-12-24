
import React, { useState } from 'react';
import { StockItem, FilamentType } from '../types';
import { Droplet, Plus, Minus, AlertCircle } from 'lucide-react';

interface StockBoardProps {
  stock: StockItem[];
  onUpdateStock?: (id: string, updates: Partial<StockItem>) => void;
}

const StockBoard: React.FC<StockBoardProps> = ({ stock, onUpdateStock }) => {
  const [activeType, setActiveType] = useState<FilamentType>(FilamentType.PLA);

  const checkAlert = (item: StockItem) => {
    const isCriticalColor = item.color === "Blanco" || item.color === "Negro";
    const minClosed = isCriticalColor ? 3 : 1;
    return item.closedCount < minClosed;
  };

  // Lógica de ordenamiento: Prioridad a los que hay que reponer, luego por cantidad ascendente
  const sortedStock = [...stock]
    .filter(item => item.type === activeType)
    .sort((a, b) => {
      const aAlert = checkAlert(a);
      const bAlert = checkAlert(b);

      // Si uno necesita reposición y el otro no, el que necesita va primero
      if (aAlert && !bAlert) return -1;
      if (!aAlert && bAlert) return 1;

      // Si ambos están en el mismo estado de alerta, ordenar por cantidad de cerrados
      if (a.closedCount !== b.closedCount) {
        return a.closedCount - b.closedCount;
      }

      // Si tienen mismos cerrados, desempatar por abiertos
      return a.openCount - b.openCount;
    });

  const updateCount = (id: string, field: 'closedCount' | 'openCount', delta: number) => {
    const item = stock.find(s => s.id === id);
    if (!item || !onUpdateStock) return;
    const newVal = Math.max(0, item[field] + delta);
    onUpdateStock(id, { [field]: newVal });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventario de Filamentos</h2>
          <p className="text-slate-500 text-sm">Los colores que faltan aparecen primero</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveType(FilamentType.PLA)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeType === FilamentType.PLA ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            PLA
          </button>
          <button 
            onClick={() => setActiveType(FilamentType.PETG)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeType === FilamentType.PETG ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            PET-G
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedStock.map((item) => {
          const isLow = checkAlert(item);
          return (
            <div key={item.id} className={`bg-white p-5 rounded-3xl shadow-sm border transition-all duration-300 ${isLow ? 'border-red-200 bg-red-50/30' : 'border-slate-200'} flex flex-col gap-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-2xl shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: getHexColor(item.color) }}
                  >
                    <Droplet size={18} className={isDark(item.color) ? 'text-white/40' : 'text-black/20'} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{item.color}</h3>
                    {isLow && (
                      <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1 mt-0.5">
                        <AlertCircle size={10} /> Reponer (Mín. {item.color === "Blanco" || item.color === "Negro" ? '3' : '1'})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cerrados</p>
                  <div className="flex items-center justify-between">
                    <button onClick={() => updateCount(item.id, 'closedCount', -1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><Minus size={14} /></button>
                    <span className={`font-black text-lg ${isLow ? 'text-red-600' : 'text-slate-700'}`}>{item.closedCount}</span>
                    <button onClick={() => updateCount(item.id, 'closedCount', 1)} className="p-1 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors"><Plus size={14} /></button>
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Abiertos</p>
                  <div className="flex items-center justify-between">
                    <button onClick={() => updateCount(item.id, 'openCount', -1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><Minus size={14} /></button>
                    <span className="font-black text-lg text-slate-700">{item.openCount}</span>
                    <button onClick={() => updateCount(item.id, 'openCount', 1)} className="p-1 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedStock.some(checkAlert) && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-800 text-sm font-medium">
            ¡Che Maru! Hay colores que están por debajo del stock mínimo. Aparecen arriba de todo marcados en rojo.
          </p>
        </div>
      )}
    </div>
  );
};

function getHexColor(color: string) {
  const map: any = {
    "Negro": "#1a1a1a", "Blanco": "#ffffff", "Gris": "#94a3b8", "Gris claro": "#cbd5e1",
    "Gris Plata": "#e2e8f0", "Azul": "#2563eb", "Celeste": "#60a5fa", "Aqua": "#2dd4bf",
    "Rojo": "#dc2626", "Dorado": "#fbbf24", "Amarillo": "#fde047", "Naranja": "#f97316",
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
