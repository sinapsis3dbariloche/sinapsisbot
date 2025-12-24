
import React, { useState, useEffect } from 'react';
import { Scale, TrendingUp, Save, Cpu, Clock, Palette, Brush, Tag } from 'lucide-react';
import { FilamentType } from '../types';

interface BudgetCalculatorProps {
  plaPrice: number;
  petgPrice: number;
  designPrice: number;
  postProcessPrice: number;
  onUpdatePrices: (updates: { pla?: number, petg?: number, design?: number, postProcess?: number }) => void;
}

const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({ 
  plaPrice, 
  petgPrice, 
  designPrice, 
  postProcessPrice,
  onUpdatePrices 
}) => {
  const [weight, setWeight] = useState<number | ''>('');
  const [designMinutes, setDesignMinutes] = useState<number | ''>(0);
  const [postProcessMinutes, setPostProcessMinutes] = useState<number | ''>(0);
  const [modelCost, setModelCost] = useState<number | ''>(0);
  const [clientType, setClientType] = useState<'minorista' | 'mayorista'>('minorista');
  const [filamentType, setFilamentType] = useState<FilamentType>(FilamentType.PLA);
  
  const [localPlaPrice, setLocalPlaPrice] = useState<number>(plaPrice);
  const [localPetgPrice, setLocalPetgPrice] = useState<number>(petgPrice);
  const [localDesignPrice, setLocalDesignPrice] = useState<number>(designPrice);
  const [localPostPrice, setLocalPostPrice] = useState<number>(postProcessPrice);

  useEffect(() => {
    setLocalPlaPrice(plaPrice);
    setLocalPetgPrice(petgPrice);
    setLocalDesignPrice(designPrice);
    setLocalPostPrice(postProcessPrice);
  }, [plaPrice, petgPrice, designPrice, postProcessPrice]);

  const activePrice = filamentType === FilamentType.PLA ? localPlaPrice : localPetgPrice;

  const handlePriceChange = (newVal: number, type: 'pla' | 'petg' | 'design' | 'post') => {
    if (type === 'pla') {
      setLocalPlaPrice(newVal);
      onUpdatePrices({ pla: newVal });
    } else if (type === 'petg') {
      setLocalPetgPrice(newVal);
      onUpdatePrices({ petg: newVal });
    } else if (type === 'design') {
      setLocalDesignPrice(newVal);
      onUpdatePrices({ design: newVal });
    } else {
      setLocalPostPrice(newVal);
      onUpdatePrices({ postProcess: newVal });
    }
  };

  const calculate = () => {
    if (!weight && !designMinutes && !postProcessMinutes && !modelCost) return null;
    
    // Impresión
    let printingPrice = 0;
    if (weight) {
      const costPerGram = activePrice / 1000;
      const materialCost = costPerGram * Number(weight);
      const baseCost = materialCost * 1.4;
      const multiplier = clientType === 'minorista' ? 4 : 3;
      printingPrice = Math.round((baseCost * multiplier) / 100) * 100;
    }

    // Tiempos y Gastos Extra
    const designCost = (localDesignPrice / 60) * (Number(designMinutes) || 0);
    const postProcessCost = (localPostPrice / 60) * (Number(postProcessMinutes) || 0);
    const totalModelCost = Number(modelCost) || 0;
    
    const finalPrice = printingPrice + designCost + postProcessCost + totalModelCost;

    return {
      printingPrice,
      designCost,
      postProcessCost,
      totalModelCost,
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
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Impresión + Diseño + Post + Costos Externos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            
            {/* Tiempos y Peso (Entradas de volumen) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Peso Pieza (g)</label>
                <div className="relative">
                  <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-orange-600 font-black text-slate-900"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Diseño (min)</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="number"
                    value={designMinutes}
                    onChange={(e) => setDesignMinutes(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-orange-600 font-black text-slate-900"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Post-Procesado (min)</label>
                <div className="relative">
                  <Brush className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="number"
                    value={postProcessMinutes}
                    onChange={(e) => setPostProcessMinutes(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-orange-600 font-black text-slate-900"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Selectores de Perfil */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Material</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFilamentType(FilamentType.PLA)}
                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${filamentType === FilamentType.PLA ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
                  >
                    PLA
                  </button>
                  <button
                    onClick={() => setFilamentType(FilamentType.PETG)}
                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${filamentType === FilamentType.PETG ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
                  >
                    PET-G
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Perfil de Venta</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setClientType('minorista')}
                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${clientType === 'minorista' ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
                  >
                    Minorista
                  </button>
                  <button
                    onClick={() => setClientType('mayorista')}
                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${clientType === 'mayorista' ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
                  >
                    Mayorista
                  </button>
                </div>
              </div>
            </div>

            {/* COSTOS Y PRECIOS (Agrupados aquí) */}
            <div className="pt-6 border-t border-slate-50">
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Configuración de Precios y Cargos</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    {filamentType} $/kg <Save size={8} className="text-green-500" />
                  </label>
                  <input
                    type="number"
                    value={activePrice}
                    onChange={(e) => handlePriceChange(Number(e.target.value), filamentType === FilamentType.PLA ? 'pla' : 'petg')}
                    className="w-full bg-slate-50 border-none rounded-lg px-3 py-3 font-black text-xs text-slate-900 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    Diseño $/hr <Save size={8} className="text-green-500" />
                  </label>
                  <input
                    type="number"
                    value={localDesignPrice}
                    onChange={(e) => handlePriceChange(Number(e.target.value), 'design')}
                    className="w-full bg-slate-50 border-none rounded-lg px-3 py-3 font-black text-xs text-slate-900 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    Post $/hr <Save size={8} className="text-green-500" />
                  </label>
                  <input
                    type="number"
                    value={localPostPrice}
                    onChange={(e) => handlePriceChange(Number(e.target.value), 'post')}
                    className="w-full bg-slate-50 border-none rounded-lg px-3 py-3 font-black text-xs text-slate-900 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest flex items-center justify-between">
                    Modelo ($) <Tag size={8} />
                  </label>
                  <input
                    type="number"
                    value={modelCost}
                    onChange={(e) => setModelCost(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-orange-50 border-none rounded-lg px-3 py-3 font-black text-xs text-orange-700 focus:ring-1 focus:ring-orange-500"
                    placeholder="Cults3D..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DE RESULTADOS */}
        <div className="lg:col-span-5">
          <div className="bg-orange-600 rounded-[3rem] p-10 text-white shadow-2xl h-full flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            
            <div className="relative z-10 space-y-8">
              <div className="bg-black/10 px-4 py-2 rounded-full w-fit flex items-center gap-2">
                <TrendingUp size={14} />
                <span className="font-black uppercase tracking-[0.2em] text-[9px]">Presupuesto Final</span>
              </div>

              {results && (Number(weight) || Number(designMinutes) || Number(postProcessMinutes) || Number(modelCost)) ? (
                <div className="space-y-6">
                  <div className="space-y-3 border-b border-white/10 pb-6">
                    {Number(weight) > 0 && (
                      <div className="flex justify-between items-center opacity-80">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Impresión ({weight}g)</span>
                        <span className="font-black">${results.printingPrice.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    {Number(designMinutes) > 0 && (
                      <div className="flex justify-between items-center opacity-80">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Diseño ({designMinutes}m)</span>
                        <span className="font-black">${Math.round(results.designCost).toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    {Number(postProcessMinutes) > 0 && (
                      <div className="flex justify-between items-center opacity-80">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Post-procesado ({postProcessMinutes}m)</span>
                        <span className="font-black">${Math.round(results.postProcessCost).toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    {Number(modelCost) > 0 && (
                      <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-3 text-orange-100 italic">
                        <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                           Archivo / Modelo
                        </span>
                        <span className="font-black">${Number(modelCost).toLocaleString('es-AR')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] mb-2 opacity-90">Total Sugerido</div>
                    <div className="text-7xl font-black tracking-tighter drop-shadow-lg leading-none">
                      ${Math.round(results.finalPrice).toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center opacity-40">
                  <Scale size={40} className="mx-auto mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Esperando datos operativos...</p>
                </div>
              )}
            </div>

            {results && (
              <button 
                onClick={() => {
                  const items = [];
                  if (weight) items.push(`- Impresión (${weight}g ${filamentType}): $${results.printingPrice.toLocaleString('es-AR')}`);
                  if (Number(designMinutes) > 0) items.push(`- Diseño (${designMinutes}min): $${Math.round(results.designCost).toLocaleString('es-AR')}`);
                  if (Number(postProcessMinutes) > 0) items.push(`- Post-procesado (${postProcessMinutes}min): $${Math.round(results.postProcessCost).toLocaleString('es-AR')}`);
                  if (Number(modelCost) > 0) items.push(`- Costo Archivo (Cults3D/Otros): $${Number(modelCost).toLocaleString('es-AR')}`);
                  const text = `Sinapsis 3D - Presupuesto\n${items.join('\n')}\nTOTAL: $${Math.round(results.finalPrice).toLocaleString('es-AR')}`;
                  navigator.clipboard.writeText(text);
                  alert('¡Presupuesto copiado al portapapeles! 🚀');
                }}
                className="relative z-10 w-full bg-white text-orange-600 font-black py-5 rounded-[1.5rem] mt-8 hover:scale-[1.02] active:scale-95 shadow-xl text-[10px] uppercase tracking-widest"
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
