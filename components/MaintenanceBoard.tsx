
import React, { useState } from 'react';
import { Printer, MaintenanceRecord } from '../types';
import { Wrench, Calendar, History, Plus, Minus, AlertTriangle, Layers, ChevronRight, Activity, Box } from 'lucide-react';

interface MaintenanceBoardProps {
  printers: Printer[];
  onUpdatePrinter: (printer: Printer) => Promise<void>;
  hotendStock: number;
  onUpdateHotendStock: (newStock: number) => Promise<void>;
}

const MaintenanceBoard: React.FC<MaintenanceBoardProps> = ({ 
  printers, 
  onUpdatePrinter, 
  hotendStock, 
  onUpdateHotendStock 
}) => {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);

  const handleRegisterHotendChange = async (printerId: string) => {
    if (hotendStock <= 0) {
      alert('⚠️ No hay hotends en stock. Por favor, cargue stock de repuestos antes de registrar el cambio.');
      return;
    }

    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;

    if (!confirm(`¿Confirmar cambio de hotend en ${printer.name}? Se descontará 1 unidad del stock de repuestos.`)) {
      return;
    }

    const newRecord: MaintenanceRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'Cambio de Hotend',
      notes: 'Cambio preventivo. Se utilizó 1 unidad del stock central.'
    };

    const updatedPrinter: Printer = {
      ...printer,
      history: [newRecord, ...printer.history]
    };

    // Descontar del stock
    await onUpdateHotendStock(hotendStock - 1);
    // Actualizar impresora
    await onUpdatePrinter(updatedPrinter);
    
    alert(`Cambio de Hotend registrado y stock actualizado.`);
  };

  const getTimeSinceLastChange = (history: MaintenanceRecord[]) => {
    const lastChange = history.find(h => h.type === 'Cambio de Hotend');
    if (!lastChange) return 'Sin registros';
    
    const diff = Date.now() - new Date(lastChange.date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Hace 1 día';
    return `Hace ${days} días`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER Y STOCK DE HOTENDS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        <div className="md:col-span-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-600 p-2.5 rounded-xl text-white shadow-lg shadow-orange-600/20">
              <Wrench size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Mantenimiento de Máquinas</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Control de Hotends y Vida Útil</p>
            </div>
          </div>
          <div className="flex bg-slate-50 px-4 py-2 rounded-xl items-center gap-2">
            <Activity size={14} className="text-orange-600" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{printers.length} Impresoras Activas</span>
          </div>
        </div>

        <div className="md:col-span-4 bg-slate-950 rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Box size={80} />
          </div>
          <div className="relative z-10 flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">Stock de Hotends</span>
            {hotendStock < 2 && (
              <span className="bg-red-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest">Reposición</span>
            )}
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <div className="text-5xl font-black tracking-tighter leading-none">{hotendStock}</div>
            <div className="flex gap-2">
              <button 
                onClick={() => onUpdateHotendStock(hotendStock - 1)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
              >
                <Minus size={14} />
              </button>
              <button 
                onClick={() => onUpdateHotendStock(hotendStock + 1)}
                className="p-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white transition-colors shadow-lg shadow-orange-600/20"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE IMPRESORAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {printers.map(printer => {
          const lastChangeStr = getTimeSinceLastChange(printer.history);
          const isSelected = selectedPrinterId === printer.id;
          const noStock = hotendStock <= 0;
          
          return (
            <div 
              key={printer.id} 
              className={`bg-white rounded-[2rem] border transition-all overflow-hidden flex flex-col ${isSelected ? 'border-orange-200 ring-4 ring-orange-50 shadow-2xl' : 'border-slate-100 shadow-sm hover:shadow-md'}`}
            >
              <div className="p-8 space-y-6 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{printer.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{printer.model}</p>
                  </div>
                  {printer.hasAMS && (
                    <span className="bg-orange-50 text-orange-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-orange-100">AMS</span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <History size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Último Hotend</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 uppercase">{lastChangeStr}</span>
                  </div>
                </div>

                <button 
                  disabled={noStock}
                  onClick={() => handleRegisterHotendChange(printer.id)}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95 ${noStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-orange-600 text-white shadow-orange-600/20 hover:bg-orange-700'}`}
                >
                  <Plus size={16} /> {noStock ? 'Sin Repuestos' : 'Registrar Cambio'}
                </button>
              </div>

              <button 
                onClick={() => setSelectedPrinterId(isSelected ? null : printer.id)}
                className={`p-4 border-t text-[9px] font-black uppercase tracking-widest flex items-center justify-between transition-colors ${isSelected ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:text-slate-600'}`}
              >
                {isSelected ? 'Ocultar Historial' : 'Ver Historial Completo'}
                <ChevronRight size={14} className={isSelected ? 'rotate-90 transition-transform' : ''} />
              </button>

              {isSelected && (
                <div className="bg-white border-t border-slate-100 animate-in slide-in-from-top duration-300">
                  <div className="p-6 space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                    {printer.history.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <AlertTriangle className="mx-auto text-slate-200" size={32} />
                        <p className="text-[10px] font-black text-slate-300 uppercase">Sin registros previos</p>
                      </div>
                    ) : (
                      printer.history.map(record => (
                        <div key={record.id} className="flex gap-4 items-start relative group">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors shrink-0">
                            <Layers size={14} />
                          </div>
                          <div className="flex-1 border-b border-slate-50 pb-4">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{record.type}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(record.date).toLocaleDateString()}</p>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">{record.notes}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MaintenanceBoard;
