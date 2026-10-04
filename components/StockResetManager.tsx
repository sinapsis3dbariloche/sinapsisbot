import React, { useState } from 'react';
import { StockItem } from '../types';
import { AlertTriangle, RotateCcw, Package, Layers, ShieldAlert, Check } from 'lucide-react';

interface StockResetManagerProps {
  stock: StockItem[];
  onReset: (category: 'all' | '3d' | 'grafica') => Promise<void>;
}

export const StockResetManager: React.FC<StockResetManagerProps> = ({ stock, onReset }) => {
  const [selectedScope, setSelectedScope] = useState<'all' | '3d' | 'grafica'>('all');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [justReset, setJustReset] = useState(false);

  const filamentsCount = stock.filter(item => !item.category || item.category === '3d').length;
  const graphicCount = stock.filter(item => item.category === 'grafica').length;
  const totalCount = stock.length;

  const countToReset = 
    selectedScope === '3d' ? filamentsCount :
    selectedScope === 'grafica' ? graphicCount : totalCount;

  const handleExecuteReset = async () => {
    setIsResetting(true);
    try {
      await onReset(selectedScope);
      setIsConfirming(false);
      setJustReset(true);
      setTimeout(() => setJustReset(false), 3000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 sm:p-12 text-center space-y-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-red-600"></div>

        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle size={38} />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
            Reiniciar Inventario a Cero
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            Esta acción establecerá los contadores de stock (Cerrados y Abiertos) en <strong>cero (0)</strong> para los artículos seleccionados. El catálogo de productos y los mínimos de seguridad se conservarán intactos.
          </p>
        </div>

        {/* Scope Selector Options */}
        <div className="space-y-3 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block text-center">
            Seleccionar alcance del reinicio
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => { setSelectedScope('3d'); setIsConfirming(false); }}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-1.5 ${
                selectedScope === '3d'
                  ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                  : 'border-slate-100 bg-slate-50/60 hover:border-slate-200'
              }`}
            >
              <Package size={20} className={selectedScope === '3d' ? 'text-orange-600' : 'text-slate-400'} />
              <span className="text-xs font-black text-slate-900 uppercase">Solo Stock 3D</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {filamentsCount} filamentos
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedScope('grafica'); setIsConfirming(false); }}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-1.5 ${
                selectedScope === 'grafica'
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                  : 'border-slate-100 bg-slate-50/60 hover:border-slate-200'
              }`}
            >
              <Layers size={20} className={selectedScope === 'grafica' ? 'text-blue-600' : 'text-slate-400'} />
              <span className="text-xs font-black text-slate-900 uppercase">Solo Gráfica</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {graphicCount} materiales
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedScope('all'); setIsConfirming(false); }}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-1.5 ${
                selectedScope === 'all'
                  ? 'border-red-500 bg-red-50/50 shadow-sm'
                  : 'border-slate-100 bg-slate-50/60 hover:border-slate-200'
              }`}
            >
              <RotateCcw size={20} className={selectedScope === 'all' ? 'text-red-600' : 'text-slate-400'} />
              <span className="text-xs font-black text-slate-900 uppercase">Todo el Stock</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {totalCount} artículos
              </span>
            </button>
          </div>
        </div>

        {/* Warning pill */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs text-left flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Se reiniciarán a 0 los contadores de <strong className="font-bold">{countToReset} ítems</strong>. Realizá este reinicio únicamente cuando vayas a llevar a cabo un recuento físico completo en el taller.
          </p>
        </div>

        {/* Action Button & Confirmation */}
        {!isConfirming ? (
          <button 
            type="button"
            onClick={() => setIsConfirming(true)}
            disabled={countToReset === 0 || isResetting}
            className="w-full flex items-center justify-center gap-3 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-600/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
          >
            <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            Reiniciar a Cero ({selectedScope === '3d' ? '3D' : selectedScope === 'grafica' ? 'Gráfica' : 'Todo'})
          </button>
        ) : (
          <div className="p-6 bg-red-50/80 border-2 border-red-200 rounded-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <p className="text-xs font-black text-red-700 uppercase tracking-wide">
              ¿Estás seguro de restablecer el stock a cero para {countToReset} ítems?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                disabled={isResetting}
                className="flex-1 py-3 text-[10px] font-black uppercase text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={isResetting}
                className="flex-1 py-3 text-[10px] font-black uppercase text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
              >
                {isResetting ? 'Reiniciando...' : 'Sí, Poner en Cero'}
              </button>
            </div>
          </div>
        )}

        {justReset && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <Check size={16} /> ¡El stock ha sido reiniciado a cero exitosamente!
          </div>
        )}
      </div>
    </div>
  );
};
