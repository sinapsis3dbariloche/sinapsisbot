import React, { useState } from 'react';
import { PriceItem, PriceHistoryEntry } from '../types';
import { Search, Edit2, Trash2, Save, X, Plus, DollarSign, Tag, HandCoins, History } from 'lucide-react';

interface PricesManagerProps {
  prices: PriceItem[];
  onUpdate: (price: PriceItem) => void;
  onDelete: (id: string) => void;
}

const PricesManager: React.FC<PricesManagerProps> = ({ prices, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [historyPriceId, setHistoryPriceId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PriceItem>>({});

  const filteredPrices = prices.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (price: PriceItem) => {
    setEditingId(price.id);
    setFormData({ ...price });
    setIsAdding(true);
  };

  const handleAddNew = () => {
    setEditingId('new');
    setFormData({
      id: crypto.randomUUID(),
      description: '',
      wholesalePrice: 0,
      retailPrice: 0,
      wholesaleMinQuantity: 0,
      createdAt: new Date().toISOString()
    });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.description) return alert('La descripción es obligatoria');
    if (formData.wholesalePrice === undefined || formData.wholesalePrice < 0) return alert('El precio mayorista no es válido');
    if (formData.retailPrice === undefined || formData.retailPrice < 0) return alert('El precio minorista no es válido');
    if (formData.wholesaleMinQuantity === undefined || formData.wholesaleMinQuantity < 0) return alert('La cantidad desde no es válida');
    
    const tWholesalePrice = Number(formData.wholesalePrice);
    const tRetailPrice = Number(formData.retailPrice);
    const tWholesaleMinQuantity = Number(formData.wholesaleMinQuantity);

    const isExisting = editingId !== 'new';
    let newHistory = prices.find(p => p.id === editingId)?.history || [];

    if (isExisting) {
      const originalPrice = prices.find(p => p.id === editingId);
      if (originalPrice && (originalPrice.wholesalePrice !== tWholesalePrice || originalPrice.retailPrice !== tRetailPrice)) {
        newHistory = [
          ...newHistory,
          {
            date: new Date().toISOString(),
            oldWholesalePrice: originalPrice.wholesalePrice,
            newWholesalePrice: tWholesalePrice,
            oldRetailPrice: originalPrice.retailPrice,
            newRetailPrice: tRetailPrice
          }
        ];
      }
    }

    const newPrice: PriceItem = {
      ...(formData as PriceItem),
      wholesalePrice: tWholesalePrice,
      retailPrice: tRetailPrice,
      wholesaleMinQuantity: tWholesaleMinQuantity,
      history: newHistory
    };
    
    onUpdate(newPrice);
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-600/20">
            <Tag size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lista de Precios</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestión de precios mayoristas y minoristas</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text"
              placeholder="Buscar precio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <Plus size={16} /> Nuevo Precio
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(editingId === 'new' || isAdding) && (
        <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-100 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">
              {editingId === 'new' ? 'Nuevo Registro de Precio' : 'Editar Precio'}
            </h3>
            <button onClick={() => {setEditingId(null); setIsAdding(false);}} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5 md:col-span-3 lg:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descripción</label>
              <input 
                type="text" 
                value={formData.description || ''} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-600"
                placeholder="Ej: Llavero Personalizado"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Precio Minorista ($)</label>
              <input 
                type="number" 
                value={formData.retailPrice || ''} 
                onChange={e => setFormData({...formData, retailPrice: Number(e.target.value)})}
                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-600"
                placeholder="1000"
                min="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Precio Mayorista ($)</label>
              <input 
                type="number" 
                value={formData.wholesalePrice || ''} 
                onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})}
                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-600"
                placeholder="750"
                min="0"
              />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 text-ellipsis overflow-hidden whitespace-nowrap" title="Cantidad Desde (Mayorista)">Cant. Desde (May)</label>
              <input 
                type="number" 
                value={formData.wholesaleMinQuantity || ''} 
                onChange={e => setFormData({...formData, wholesaleMinQuantity: Number(e.target.value)})}
                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-600"
                placeholder="10"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={() => {setEditingId(null); setIsAdding(false);}}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Save size={16} /> Guardar Precio
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Minorista</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Mayorista</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Desde (U.)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrices.map(price => {
                if (price.id === editingId) return null;
                return (
                <tr key={price.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{price.description}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-black text-slate-900">${price.retailPrice.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-black text-emerald-600">${price.wholesalePrice.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold">
                      {price.wholesaleMinQuantity} u.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {price.history && price.history.length > 0 && (
                        <button onClick={() => setHistoryPriceId(price.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver historial">
                          <History size={16} />
                        </button>
                      )}
                      <button onClick={() => handleEdit(price)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => setItemToDelete(price.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
                );
              })}
              
              {filteredPrices.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Tag size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No hay precios registrados</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">¿Eliminar precio?</h3>
            <p className="text-sm font-bold text-slate-500">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onDelete(itemToDelete);
                  setItemToDelete(null);
                }}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* History Modal */}
      {historyPriceId && (() => {
        const item = prices.find(p => p.id === historyPriceId);
        if (!item || !item.history) return null;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Historial de Precios</h3>
                  <p className="text-xs text-slate-500 font-bold">{item.description}</p>
                </div>
              </div>
              <button 
                onClick={() => setHistoryPriceId(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/30">
              <div className="space-y-4">
                {[...item.history].reverse().map((entry, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg text-slate-500 font-black tracking-widest uppercase">
                        {new Date(entry.date).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                          <DollarSign size={24} />
                        </div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Precio Anterior</p>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-600 flex justify-between">
                            Minorista: <span>${entry.oldRetailPrice.toLocaleString()}</span>
                          </p>
                          <p className="text-sm font-black text-rose-600 flex justify-between">
                            Mayorista: <span>${entry.oldWholesalePrice.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                          <DollarSign size={24} />
                        </div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Precio Nuevo</p>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-600 flex justify-between">
                            Minorista: <span>${entry.newRetailPrice.toLocaleString()}</span>
                          </p>
                          <p className="text-sm font-black text-emerald-600 flex justify-between">
                            Mayorista: <span>${entry.newWholesalePrice.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        );
      })()}

    </div>
  );
};

export default PricesManager;
