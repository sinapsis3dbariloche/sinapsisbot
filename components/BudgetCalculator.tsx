
import React, { useState } from 'react';
import { FILAMENT_PRICE_PER_KILO } from '../constants';
import { DollarSign, Scale, UserCheck, TrendingUp, Info } from 'lucide-react';

const BudgetCalculator: React.FC = () => {
  const [weight, setWeight] = useState<number | ''>('');
  const [clientType, setClientType] = useState<'minorista' | 'mayorista'>('minorista');
  const [filamentPrice, setFilamentPrice] = useState<number>(FILAMENT_PRICE_PER_KILO);

  const calculate = () => {
    if (!weight) return null;
    const costPerGram = filamentPrice / 1000;
    const materialCost = costPerGram * Number(weight);
    const baseCost = materialCost * 1.4;
    const multiplier = clientType === 'minorista' ? 4 : 3;
    const finalPrice = baseCost * multiplier;
    const roundedPrice = Math.round(finalPrice / 100) * 100;

    return {
      materialCost,
      baseCost,
      finalPrice: roundedPrice
    };
  };

  const results = calculate();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Calculadora de Presupuestos</h2>
        <p className="text-slate-500 text-sm">Usando la fórmula oficial de Sinapsis 3D para evitar errores.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Peso del Modelo (g)</label>
              <div className="relative">
                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="Ej: 150"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Cliente</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setClientType('minorista')}
                  className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${clientType === 'minorista' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-100'}`}
                >
                  Minorista
                </button>
                <button
                  onClick={() => setClientType('mayorista')}
                  className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${clientType === 'mayorista' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-100'}`}
                >
                  Mayorista
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Precio Filamento ($/kg)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="number"
                  value={filamentPrice}
                  onChange={(e) => setFilamentPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl flex items-start gap-3 border border-indigo-100">
            <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900/70 leading-relaxed">
              La fórmula incluye un <strong>40% de margen</strong> para cubrir desperdicio, electricidad y mantenimiento de máquinas.
            </p>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-white/20 p-2 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <span className="font-bold uppercase tracking-widest text-xs opacity-80">Resultado Presupuesto</span>
            </div>

            {results ? (
              <div className="space-y-8">
                <div>
                  <div className="text-indigo-200 text-xs font-bold uppercase mb-1">Costo Material</div>
                  <div className="text-2xl font-bold">${results.materialCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-indigo-200 text-xs font-bold uppercase mb-1">Costo Base (Energía + Margen)</div>
                  <div className="text-2xl font-bold">${results.baseCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="text-white text-xs font-bold uppercase mb-1">Precio Sugerido Final</div>
                  <div className="text-5xl font-black text-white drop-shadow-sm">
                    ${results.finalPrice.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Scale size={32} className="opacity-40" />
                </div>
                <p className="text-indigo-100 font-medium">Cargá el peso para ver el presupuesto</p>
              </div>
            )}
          </div>

          {results && (
            <button className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl mt-8 hover:bg-indigo-50 transition-colors">
              COPIAR PARA CLIENTE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetCalculator;
