
import React, { useState } from 'react';
import { Printer, MaintenanceRecord } from '../types';
import { Wrench, Calendar, History, Plus, Minus, AlertTriangle, Layers, ChevronRight, Activity, Box, Loader2, Trash2, Edit2, Check, X } from 'lucide-react';

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
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');

  const handleDeleteRecord = async (printerId: string, recordId: string) => {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;

    const recordToDelete = printer.history.find(r => r.id === recordId);
    if (!confirm(`¿Eliminar este registro de "${recordToDelete?.type}"?`)) return;

    const isHotendChange = recordToDelete?.type === 'Cambio de Hotend';
    const updatedPrinter: Printer = {
      ...printer,
      history: printer.history.filter(r => r.id !== recordId)
    };

    try {
      if (isHotendChange) {
        await onUpdateHotendStock(hotendStock + 1);
      }
      await onUpdatePrinter(updatedPrinter);
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error al eliminar el registro.');
    }
  };

  const handleUpdateRecordDate = async (printerId: string, recordId: string) => {
    const printer = printers.find(p => p.id === printerId);
    if (!printer || !editDate) return;

    const updatedPrinter: Printer = {
      ...printer,
      history: printer.history.map(r => 
        r.id === recordId ? { ...r, date: new Date(editDate).toISOString() } : r
      )
    };

    try {
      await onUpdatePrinter(updatedPrinter);
      setEditingRecordId(null);
    } catch (error) {
      console.error('Error updating record date:', error);
      alert('Error al actualizar la fecha.');
    }
  };

  const handleRegisterHotendChange = async (printerId: string) => {
    if (hotendStock <= 0) {
      setStatusMsg({ type: 'error', text: '⚠️ No hay hotends en stock.' });
      setTimeout(() => setStatusMsg(null), 3000);
      return;
    }

    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;

    setIsProcessing(true);
    setStatusMsg(null);

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

    // Actualizar impresora
    try {
      // 1. Descontar del stock
      await onUpdateHotendStock(hotendStock - 1);
      // 2. Actualizar impresora
      await onUpdatePrinter(updatedPrinter);
      
      setStatusMsg({ type: 'success', text: '✅ Cambio registrado exitosamente.' });
      setConfirmingId(null);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (error) {
      console.error('Error in handleRegisterHotendChange:', error);
      setStatusMsg({ type: 'error', text: '❌ Error al registrar. Intente nuevamente.' });
      setTimeout(() => setStatusMsg(null), 3000);
    } finally {
      setIsProcessing(false);
    }
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

                {statusMsg && (
                  <div className={`p-4 rounded-xl text-[10px] font-black uppercase text-center animate-in zoom-in duration-300 ${statusMsg.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    {statusMsg.text}
                  </div>
                )}

                {confirmingId === printer.id ? (
                  <div className="flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
                    <button 
                      onClick={() => setConfirmingId(null)}
                      disabled={isProcessing}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => handleRegisterHotendChange(printer.id)}
                      disabled={isProcessing}
                      className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="animate-spin" size={14} /> Procesando...
                        </>
                      ) : (
                        'Confirmar'
                      )}
                    </button>
                  </div>
                ) : (
                  <button 
                    disabled={noStock || isProcessing}
                    onClick={() => setConfirmingId(printer.id)}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95 ${noStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-orange-600 text-white shadow-orange-600/20 hover:bg-orange-700'}`}
                  >
                    <Plus size={16} /> {noStock ? 'Sin Repuestos' : 'Registrar Cambio'}
                  </button>
                )}
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
                              
                              <div className="flex items-center gap-2">
                                {editingRecordId === record.id ? (
                                  <div className="flex items-center gap-1 animate-in zoom-in duration-200">
                                    <input 
                                      type="date"
                                      value={editDate}
                                      onChange={(e) => setEditDate(e.target.value)}
                                      className="text-[9px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-bold outline-none focus:border-orange-500"
                                    />
                                    <button 
                                      onClick={() => handleUpdateRecordDate(printer.id, record.id)}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button 
                                      onClick={() => setEditingRecordId(null)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(record.date).toLocaleDateString()}</p>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                      <button 
                                        onClick={() => {
                                          setEditingRecordId(record.id);
                                          setEditDate(new Date(record.date).toISOString().split('T')[0]);
                                        }}
                                        className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                        title="Editar fecha"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteRecord(printer.id, record.id)}
                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Eliminar registro"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
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
