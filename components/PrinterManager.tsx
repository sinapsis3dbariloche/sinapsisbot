
import React, { useState } from 'react';
import { Printer } from '../types';
import { Plus, Trash2, Edit2, Save, X, MonitorSmartphone, CheckSquare, Square } from 'lucide-react';

interface PrinterManagerProps {
  printers: Printer[];
  onAdd: (printer: Printer) => Promise<void>;
  onUpdate: (printer: Printer) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PrinterManager: React.FC<PrinterManagerProps> = ({ printers, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Printer>>({});

  const handleCreate = async () => {
    if (!formData.name || !formData.model) return;
    const newPrinter: Printer = {
      id: `p-${Date.now()}`,
      name: formData.name,
      model: formData.model,
      hasAMS: !!formData.hasAMS,
      history: []
    };
    await onAdd(newPrinter);
    setIsAdding(false);
    setFormData({});
  };

  const handleSaveEdit = async () => {
    if (!formData.id) return;
    await onUpdate(formData as Printer);
    setEditingId(null);
    setFormData({});
  };

  const startEdit = (printer: Printer) => {
    setEditingId(printer.id);
    setFormData(printer);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-2.5 rounded-xl text-white shadow-lg shadow-orange-600/20">
            <MonitorSmartphone size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Gestión de Máquinas</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuración del Parque de Impresoras</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
          >
            <Plus size={16} /> Nueva Impresora
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2rem] border-2 border-orange-100 shadow-xl animate-in zoom-in-95 duration-200">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Nueva Máquina</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Identificador</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-orange-600"
                placeholder="Ej: Bambu Normal #3"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modelo / Especificación</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-orange-600"
                placeholder="Ej: P1S con AMS"
                value={formData.model || ''}
                onChange={e => setFormData({...formData, model: e.target.value})}
              />
            </div>
            <div className="flex items-end h-full pb-3">
              <button 
                onClick={() => setFormData({...formData, hasAMS: !formData.hasAMS})}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full border ${formData.hasAMS ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
              >
                {formData.hasAMS ? <CheckSquare size={18} /> : <Square size={18} />}
                <span className="text-[10px] font-black uppercase tracking-widest">Módulo AMS incluido</span>
              </button>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
            <button onClick={handleCreate} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">Registrar Máquina</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Impresora</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Características</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {printers.map(printer => (
              <tr key={printer.id} className="group hover:bg-slate-50/50 transition-all">
                <td className="px-8 py-5">
                  {editingId === printer.id ? (
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="bg-slate-100 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-600"
                      />
                      <input 
                        type="text" 
                        value={formData.model} 
                        onChange={e => setFormData({...formData, model: e.target.value})}
                        className="bg-slate-100 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-600"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="font-black text-slate-900 uppercase text-xs tracking-tight leading-none mb-1">{printer.name}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{printer.model}</p>
                    </div>
                  )}
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${printer.hasAMS ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      AMS: {printer.hasAMS ? 'SI' : 'NO'}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{printer.history.length} Registros</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  {editingId === printer.id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Save size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(printer)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button 
                        onClick={() => { if(confirm('¿Eliminar esta impresora del sistema? Se perderá todo su historial.')) onDelete(printer.id); }} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrinterManager;
