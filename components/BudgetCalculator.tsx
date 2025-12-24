
import React, { useState, useEffect } from 'react';
import { DollarSign, Scale, TrendingUp, Info, Save, Cpu, Clock, Palette } from 'lucide-react';
import { FilamentType } from '../types';

interface BudgetCalculatorProps {
  plaPrice: number;
  petgPrice: number;
  designPrice: number;
  onUpdatePrices: (updates: { pla?: number, petg?: number, design?: number }) => void;
}

const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({ plaPrice, petgPrice, designPrice, onUpdatePrices }) => {
  const [weight, setWeight] = useState<number | ''>('');
  const [designMinutes, setDesignMinutes] = useState<number | ''>(0);
  const [clientType, setClientType] = useState<'minorista' | 'mayorista'>('minorista');
  const [filamentType, setFilamentType] = useState<FilamentType>(FilamentType.PLA);
  
  const [localPlaPrice, setLocalPlaPrice] = useState<number>(plaPrice);
  const [localPetgPrice, setLocalPetgPrice] = useState<number>(petgPrice);
  const [localDesignPrice, setLocalDesignPrice] = useState<number>(designPrice);

  useEffect(() => {
    setLocalPlaPrice(plaPrice);
    setLocalPetgPrice(petgPrice);
    setLocalDesignPrice(designPrice);
  }, [plaPrice, petgPrice, designPrice]);

  const activePrice = filamentType === FilamentType.PLA ? localPlaPrice : localPetgPrice;

  const handlePriceChange = (newVal: number, type: 'pla' | 'petg' | 'design') => {
    if (type === 'pla') {
      setLocalPlaPrice(newVal);
      onUpdatePrices({ pla: newVal });
    } else if (type === 'petg') {
      setLocalPetgPrice(newVal);
      onUpdatePrices({ petg: newVal });
    } else {
      setLocalDesignPrice(newVal);
      onUpdatePrices({ design: newVal });
    }
  };

  const calculate = () => {
    if (!weight && !designMinutes) return null;
    
    // Cálculo de Impresión
    let printingPrice = 0;
    let materialCost = 0;
    let baseCost = 0;
    
    if (weight) {
      const costPerGram = activePrice / 1000;
      materialCost = costPerGram * Number(weight);
      baseCost = materialCost * 1.4; // 40% operativo
      const multiplier = clientType === 'minorista' ? 4 : 3;
      printingPrice = Math.round((baseCost * multiplier) / 100) * 100;
    }

    // Cálculo de Diseño
    const designCost = (localDesignPrice / 60) * (Number(designMinutes) || 0);
    const finalPrice = printingPrice + designCost;

    return {
      materialCost,
      baseCost,
      printingPrice,
      designCost,
      finalPrice
    };
  };

  const results = calculate();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-lg shadow-orange-600/20">
          <Cpu size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Presupuestador Avanzado</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Lógica de Costos Diferenciados y Diseño</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INPUTS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Peso */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Pieza (g)</label>
                <div className="relative group">
                  <Scale className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={20} />
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-14 pr-6 py-5 focus:ring-2 focus:ring-orange-600 font-black text-xl text-slate-900 placeholder:text-slate-200"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Tiempo de Diseño */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiempo Diseño (min)</label>
                <div className="relative group">
                  <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={20} />
                  <input
                    type="number"
                    value={designMinutes}
                    onChange={(e) => setDesignMinutes(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-14 pr-6 py-5 focus:ring-2 focus:ring-orange-600 font-black text-xl text-slate-900 placeholder:text-slate-200"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Material */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Filamento</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFilamentType(FilamentType.PLA)}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${filamentType === FilamentType.PLA ? 'bg-slate-950 text-white border-slate-950 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                >
                  PLA (Estándar)
                </button>
                <button
                  onClick={() => setFilamentType(FilamentType.PETG)}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${filamentType === FilamentType.PETG ? 'bg-slate-950 text-white border-slate-950 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                >
                  PET-G (Técnico)
                </button>
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil de Cliente</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setClientType('minorista')}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${clientType === 'minorista' ? 'bg-slate-950 text-white border-slate-950 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                >
                  Minorista (x4)
                </button>
                <button
                  onClick={() => setClientType('mayorista')}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${clientType === 'mayorista' ? 'bg-slate-950 text-white border-slate-950 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                >
                  Mayorista (x3)
                </button>
              </div>
            </div>

            {/* Configuración de Costos */}
            <div className="pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                  Costo {filamentType} ($/kg)
                  <Save size={10} className="text-green-500" />
                </label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={16} />
                  <input
                    type="number"
                    value={activePrice}
                    onChange={(e) => handlePriceChange(Number(e.target.value), filamentType === FilamentType.PLA ? 'pla' : 'petg')}
                    className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-orange-600 font-black text-slate-900 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                  Costo Diseño ($/hr)
                  <Save size={10} className="text-green-500" />
                </label>
                <div className="relative group">
                  <Palette className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={16} />
                  <input
                    type="number"
                    value={localDesignPrice}
                    onChange={(e) => handlePriceChange(Number(e.target.value), 'design')}
                    className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-orange-600 font-black text-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS CARD */}
        <div className="lg:col-span-5">
          <div className="bg-orange-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-orange-600/30 h-full flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center gap-3 bg-black/10 w-fit px-4 py-2 rounded-full backdrop-blur-md">
                <TrendingUp size={16} />
                <span className="font-black uppercase tracking-[0.2em] text-[10px]">Cálculo Final</span>
              </div>

              {results && (weight || designMinutes) ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <div>
                        <div className="text-orange-200 text-[9px] font-black uppercase tracking-widest mb-1">Impresión {weight}g</div>
                        <div className="text-2xl font-black">${results.printingPrice.toLocaleString('es-AR')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-200 text-[9px] font-black uppercase tracking-widest mb-1">Diseño {designMinutes}min</div>
                        <div className="text-2xl font-black">${Math.round(results.designCost).toLocaleString('es-AR')}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] mb-4 opacity-90">Total Presupuestado</div>
                    <div className="text-7xl font-black text-white tracking-tighter drop-shadow-lg">
                      ${Math.round(results.finalPrice).toLocaleString('es-AR')}
                    </div>
                    <p className="text-orange-200 text-[10px] font-bold uppercase mt-4 tracking-widest">
                      {clientType} • {filamentType}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-6">
                  <div className="bg-white/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto backdrop-blur-md border border-white/10">
                    <Scale size={40} className="opacity-40" />
                  </div>
                  <p className="text-orange-100 font-black uppercase tracking-[0.3em] text-[10px] leading-relaxed">
                    Ingresá peso o<br/>minutos de diseño
                  </p>
                </div>
              )}
            </div>

            {results && (weight || designMinutes) && (
              <button 
                onClick={() => {
                  const designText = designMinutes ? `\n- Diseño (${designMinutes}min): $${Math.round(results.designCost).toLocaleString('es-AR')}` : '';
                  const printText = weight ? `\n- Impresión (${weight}g ${filamentType}): $${results.printingPrice.toLocaleString('es-AR')}` : '';
                  const text = `Presupuesto Sinapsis 3D${printText}${designText}\n- TOTAL: $${Math.round(results.finalPrice).toLocaleString('es-AR')}`;
                  navigator.clipboard.writeText(text);
                  alert('¡Presupuesto copiado! 🚀');
                }}
                className="relative z-10 w-full bg-white text-orange-600 font-black py-5 rounded-[1.5rem] mt-12 hover:scale-[1.02] transition-all active:scale-95 shadow-2xl text-[11px] uppercase tracking-widest"
              >
                Copiar Presupuesto Detallado
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetCalculator;
