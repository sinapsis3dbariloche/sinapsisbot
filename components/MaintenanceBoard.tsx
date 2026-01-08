
import React, { useState } from 'react';
import { Printer, MaintenanceRecord } from '../types';
import { Wrench, Calendar, History, Plus, AlertTriangle, Layers, ChevronRight, Activity } from 'lucide-react';

interface MaintenanceBoardProps {
  printers: Printer[];
  onUpdatePrinter: (printer: Printer) => Promise<void>;
}

const MaintenanceBoard: React.FC<MaintenanceBoardProps> = ({ printers, onUpdatePrinter }) => {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);

  const handleRegisterHotendChange = async (printerId: string) => {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;

    const newRecord: MaintenanceRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'Cambio de Hotend',
      notes: 'Cambio preventivo / Hotend nuevo instalado.'
    };

    const updatedPrinter: Printer = {
      ...printer,
      history: [newRecord, ...printer.history]
    };

    await onUpdatePrinter(updatedPrinter);
    alert(`Cambio de Hotend registrado para ${printer.name}`);
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm shrink-0">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {printers.map(printer => {
          const lastChangeStr = getTimeSinceLastChange(printer.history);
          const isSelected = selectedPrinterId === printer.id;
          
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
                  onClick={() => handleRegisterHotendChange(printer.id)}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-95"
                >
                  <Plus size={16} /> Registrar Cambio
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
