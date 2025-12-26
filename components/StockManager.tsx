
import React, { useState } from 'react';
import { StockItem, FilamentType } from '../types';
import { Plus, Trash2, Edit2, Save, X, Settings2, Droplet } from 'lucide-react';

interface StockManagerProps {
  stock: StockItem[];
  onAdd: (item: StockItem) => Promise<void>;
  onUpdate: (id: string, updates: Partial<StockItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const StockManager: React.FC<StockManagerProps> = ({ stock, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // State for forms
  const [formData, setFormData] = useState<Partial<StockItem>>({});

  const handleEdit = (item: StockItem) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const handleSave = async () => {
    if (!formData.color || !formData.id) return;
    await onUpdate(formData.id, formData);
    setEditingId(null);
    setFormData({});
  };

  const handleCreate = async () => {
    if (!formData.color || !formData.type) return;
    const newItem: StockItem = {
      id: `${formData.type.toLowerCase()}-${Date.now()}`,
      color: formData.color,
      type: formData.type,
      closedCount: 0,
      openCount: 0,
      minClosed: formData.minClosed || 1,
      hexColor: formData.hexColor || '#cccccc'
    };
    await onAdd(newItem);
    setIsAdding(false);
    setFormData({});
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-2.5 rounded-xl text-white shadow-lg shadow-orange-600/20">
            <Settings2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Catálogo de Materiales</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión de colores y alertas</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => { setIsAdding(true); setFormData({ type: FilamentType.PLA, hexColor: '#ffa500', minClosed: 1 }); }}
            className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
          >
            <Plus size={16} /> Agregar Filamento
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2rem] border-2 border-orange-100 shadow-xl animate-in zoom-in-95 duration-200">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Nuevo Material</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre / Color</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-orange-600"
                placeholder="Ej: Rojo Sangre"
                value={formData.color || ''}
                onChange={e => setFormData({...formData, color: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-orange-600"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as FilamentType})}
              >
                <option value={FilamentType.PLA}>PLA</option>
                <option value={FilamentType.PETG}>PET-G</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min. Cerrados</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-orange-600"
                value={formData.minClosed || ''}
                onChange={e => setFormData({...formData, minClosed: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Color Visual</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  className="h-10 w-20 rounded-xl cursor-pointer bg-transparent border-none"
                  value={formData.hexColor || '#cccccc'}
                  onChange={e => setFormData({...formData, hexColor: e.target.value})}
                />
                <div className="flex-1 bg-slate-50 rounded-xl px-4 flex items-center text-[10px] font-mono text-slate-400">{formData.hexColor}</div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
            <button onClick={handleCreate} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">Crear Filamento</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificación</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mínimo</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {stock.sort((a,b) => a.color.localeCompare(b.color)).map(item => (
              <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                <td className="px-8 py-4">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={formData.hexColor} 
                        onChange={e => setFormData({...formData, hexColor: e.target.value})}
                        className="w-10 h-10 rounded-xl cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={formData.color} 
                        onChange={e => setFormData({...formData, color: e.target.value})}
                        className="bg-slate-100 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-600"
                      />
                      <span className="text-[10px] font-black text-slate-300">{item.type}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl shadow-inner border border-slate-200 flex items-center justify-center" style={{ backgroundColor: item.hexColor }}>
                        <Droplet size={14} className="opacity-20" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase text-xs tracking-tight">{item.color}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{item.type}</p>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-black">Min:</span>
                      <input 
                        type="number" 
                        value={formData.minClosed} 
                        onChange={e => setFormData({...formData, minClosed: Number(e.target.value)})}
                        className="w-16 bg-slate-100 border-none rounded-lg px-2 py-2 text-xs font-bold"
                      />
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mínimo:</span>
                      <span className="font-black text-slate-900 text-xs">{item.minClosed || 1}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === item.id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Save size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button 
                        onClick={() => { if(confirm('¿Eliminar filamento del catálogo?')) onDelete(item.id); }} 
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

export default StockManager;
