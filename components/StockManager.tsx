import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StockItem, FilamentType, GraphicCategory, StockCategory } from '../types';
import { Plus, Trash2, Edit2, Save, X, Settings2, Droplet, FileText, ScrollText, Box } from 'lucide-react';
import { useUnsavedChanges } from '../lib/UnsavedChangesContext';
import { isStockItemFormDirty } from '../services/unsavedChangesLogic';

interface StockManagerProps {
  stock: StockItem[];
  onAdd: (item: StockItem) => Promise<void>;
  onUpdate: (id: string, updates: Partial<StockItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  initialTab?: StockCategory;
}

const StockManager: React.FC<StockManagerProps> = ({ 
  stock, 
  onAdd, 
  onUpdate, 
  onDelete,
  initialTab = '3d'
}) => {
  const { setIsDirty, confirmIfDirty } = useUnsavedChanges();
  const [activeCatalogTab, setActiveCatalogTab] = useState<StockCategory>(initialTab);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const initialSnapshot = useRef<string | null>(null);
  
  // State for forms
  const [formData, setFormData] = useState<Partial<StockItem>>({});

  const isFormDirty = useMemo(() => {
    if (!isAdding && !editingId) return false;
    const origStock = editingId && initialSnapshot.current
      ? JSON.parse(initialSnapshot.current)
      : null;
    return isStockItemFormDirty(formData, origStock);
  }, [isAdding, editingId, formData]);

  useEffect(() => {
    setIsDirty(isFormDirty);
    return () => {
      setIsDirty(false);
    };
  }, [isFormDirty, setIsDirty]);

  // Split stock by category
  const filamentsStock = useMemo(() => {
    return stock.filter(item => !item.category || item.category === '3d');
  }, [stock]);

  const graphicStock = useMemo(() => {
    return stock.filter(item => item.category === 'grafica');
  }, [stock]);

  const handleSwitchTab = (tab: StockCategory) => {
    if (tab === activeCatalogTab) return;
    confirmIfDirty(() => {
      setIsDirty(false);
      initialSnapshot.current = null;
      setIsAdding(false);
      setEditingId(null);
      setFormData({});
      setActiveCatalogTab(tab);
    });
  };

  const handleStartAdd = () => {
    confirmIfDirty(() => {
      initialSnapshot.current = null;
      setEditingId(null);
      setIsAdding(true);
      if (activeCatalogTab === '3d') {
        setFormData({ 
          category: '3d', 
          type: FilamentType.PLA, 
          hexColor: '#ffa500', 
          minClosed: 1 
        });
      } else {
        setFormData({ 
          category: 'grafica', 
          graphicCategory: 'Papel', 
          sizeFormat: 'A4', 
          packageUnits: '100 hojas', 
          minClosed: 1 
        });
      }
    });
  };

  const handleCancel = () => {
    confirmIfDirty(() => {
      setIsDirty(false);
      initialSnapshot.current = null;
      setIsAdding(false);
      setEditingId(null);
      setFormData({});
    }, 'Tenés datos del material sin guardar. ¿Deseas descartar y salir?');
  };

  const handleEdit = (item: StockItem) => {
    if (editingId === item.id) return;
    confirmIfDirty(() => {
      setIsAdding(false);
      initialSnapshot.current = JSON.stringify(item);
      setEditingId(item.id);
      setFormData(item);
    });
  };

  const handleSave = async () => {
    if (!formData.id) return;
    if (activeCatalogTab === '3d' && !formData.color) return;
    if (activeCatalogTab === 'grafica' && !formData.name) return;

    setIsDirty(false);
    initialSnapshot.current = null;
    await onUpdate(formData.id, formData);
    setEditingId(null);
    setFormData({});
  };

  const handleCreate = async () => {
    if (activeCatalogTab === '3d') {
      if (!formData.color || !formData.type) return;
      const newItem: StockItem = {
        id: `${formData.type.toLowerCase()}-${Date.now()}`,
        category: '3d',
        color: formData.color.trim(),
        type: formData.type,
        closedCount: 0,
        openCount: 0,
        minClosed: formData.minClosed ?? 1,
        hexColor: formData.hexColor || '#cccccc'
      };
      setIsDirty(false);
      initialSnapshot.current = null;
      await onAdd(newItem);
    } else {
      if (!formData.name?.trim()) return;
      const cat = formData.graphicCategory || 'Papel';
      const prefix = cat === 'Papel' ? 'papel' : cat === 'Vinilo' ? 'vinilo' : 'insumo';
      const newItem: StockItem = {
        id: `${prefix}-${Date.now()}`,
        category: 'grafica',
        name: formData.name.trim(),
        graphicCategory: cat,
        sizeFormat: formData.sizeFormat?.trim() || (cat === 'Papel' ? 'A4' : '50cm x 1m'),
        weightThickness: formData.weightThickness?.trim() || '',
        packageUnits: formData.packageUnits?.trim() || (cat === 'Papel' ? '100 hojas' : '1 rollo'),
        finishColor: formData.finishColor?.trim() || '',
        closedCount: 0,
        openCount: 0,
        minClosed: formData.minClosed ?? 1
      };
      setIsDirty(false);
      initialSnapshot.current = null;
      await onAdd(newItem);
    }
    setIsAdding(false);
    setFormData({});
  };

  // Adjust defaults when graphicCategory changes during form filling
  const handleGraphicCategoryChange = (newCat: GraphicCategory) => {
    setFormData(prev => ({
      ...prev,
      graphicCategory: newCat,
      sizeFormat: prev.sizeFormat || (newCat === 'Papel' ? 'A4' : newCat === 'Vinilo' ? '50cm x 1m' : ''),
      packageUnits: prev.packageUnits || (newCat === 'Papel' ? '100 hojas' : newCat === 'Vinilo' ? '1 rollo' : '1 unidad')
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-2.5 rounded-xl text-white shadow-lg shadow-orange-600/20">
            <Settings2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Catálogo de Materiales</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Configuración de insumos, especificaciones y alertas mínimas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => handleSwitchTab('3d')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all ${
                activeCatalogTab === '3d' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Filamentos 3D
            </button>
            <button 
              onClick={() => handleSwitchTab('grafica')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all ${
                activeCatalogTab === 'grafica' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Gráfica / Papelería
            </button>
          </div>

          {!isAdding && (
            <button 
              onClick={handleStartAdd}
              className={`flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                activeCatalogTab === '3d'
                  ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              <Plus size={16} /> 
              {activeCatalogTab === '3d' ? 'Agregar Filamento' : 'Agregar Insumo'}
            </button>
          )}
        </div>
      </div>

      {/* 3D Add Form */}
      {isAdding && activeCatalogTab === '3d' && (
        <div className="bg-white p-8 rounded-[2rem] border-2 border-orange-100 shadow-xl animate-in zoom-in-95 duration-200">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Nuevo Filamento 3D</h3>
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
                value={formData.type || FilamentType.PLA}
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
                min={0}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-orange-600"
                value={formData.minClosed ?? 1}
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
            <button onClick={handleCancel} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
            <button onClick={handleCreate} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">Crear Filamento</button>
          </div>
        </div>
      )}

      {/* Gráfica Add Form */}
      {isAdding && activeCatalogTab === 'grafica' && (
        <div className="bg-white p-8 rounded-[2rem] border-2 border-blue-100 shadow-xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Nuevo Material de Gráfica & Papelería</h3>
            <span className="text-[9px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg">
              Formato & Papelería
            </span>
          </div>

          <div className="space-y-5">
            {/* Nombre completo */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Nombre / Descripción rápida <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-600 placeholder:text-slate-300"
                placeholder="Ej: Papel Fotográfico Brillante A4 Art-jet® 120g X 100hojas"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Categoría */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-600"
                  value={formData.graphicCategory || 'Papel'}
                  onChange={e => handleGraphicCategoryChange(e.target.value as GraphicCategory)}
                >
                  <option value="Papel">Papel</option>
                  <option value="Vinilo">Vinilo</option>
                  <option value="Insumo Gráfico">Insumo Gráfico (Otro)</option>
                </select>
              </div>

              {/* Medida / Formato */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Medida / Formato <span className="text-slate-300 font-normal">(Default A4 papel)</span>
                </label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-600"
                  placeholder={formData.graphicCategory === 'Vinilo' ? '50cm x 1m' : 'A4, A3, Oficio...'}
                  value={formData.sizeFormat || ''}
                  onChange={e => setFormData({...formData, sizeFormat: e.target.value})}
                />
              </div>

              {/* Gramaje / Espesor */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gramaje / Espesor</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-600"
                  placeholder="Ej: 120g, 200g, Standard"
                  value={formData.weightThickness || ''}
                  onChange={e => setFormData({...formData, weightThickness: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Cantidad por paquete */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Cantidad por Paquete <span className="text-slate-300 font-normal">(100 hojas / 1 rollo)</span>
                </label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-600"
                  placeholder={formData.graphicCategory === 'Vinilo' ? '1 rollo' : '100 hojas, 10 hojas...'}
                  value={formData.packageUnits || ''}
                  onChange={e => setFormData({...formData, packageUnits: e.target.value})}
                />
              </div>

              {/* Color / Acabado */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Color / Acabado (Opcional)</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-600"
                  placeholder="Ej: Blanco, Gold, Fluo, Silver, Brillante, Matte"
                  value={formData.finishColor || ''}
                  onChange={e => setFormData({...formData, finishColor: e.target.value})}
                />
              </div>

              {/* Mínimo de stock cerrado */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mínimo Stock Cerrado (Alerta)</label>
                <input 
                  type="number" 
                  min={0}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-600"
                  value={formData.minClosed ?? 1}
                  onChange={e => setFormData({...formData, minClosed: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={handleCancel} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
            <button onClick={handleCreate} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">Crear Insumo Gráfico</button>
          </div>
        </div>
      )}

      {/* 3D Catalog List */}
      {activeCatalogTab === '3d' && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificación</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mínimo</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filamentsStock.sort((a,b) => (a.color || '').localeCompare(b.color || '')).map(item => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-4">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-4">
                          <input 
                            type="color" 
                            value={formData.hexColor || '#cccccc'} 
                            onChange={e => setFormData({...formData, hexColor: e.target.value})}
                            className="w-10 h-10 rounded-xl cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={formData.color || ''} 
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
                            value={formData.minClosed ?? 1} 
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
                          <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
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

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-50">
            {filamentsStock.sort((a,b) => (a.color || '').localeCompare(b.color || '')).map(item => (
              <div key={item.id} className="p-4 space-y-4">
                {editingId === item.id ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Color</label>
                        <input 
                          type="text" 
                          value={formData.color || ''} 
                          onChange={e => setFormData({...formData, color: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Mínimo</label>
                        <input 
                          type="number" 
                          value={formData.minClosed ?? 1} 
                          onChange={e => setFormData({...formData, minClosed: Number(e.target.value)})}
                          className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={formData.hexColor || '#cccccc'} 
                        onChange={e => setFormData({...formData, hexColor: e.target.value})}
                        className="w-full h-10 rounded-xl cursor-pointer"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSave} className="bg-green-600 text-white p-2.5 rounded-xl"><Save size={18} /></button>
                        <button onClick={handleCancel} className="bg-slate-200 text-slate-600 p-2.5 rounded-xl"><X size={18} /></button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center" style={{ backgroundColor: item.hexColor }}>
                        <Droplet size={18} className="opacity-20" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase text-xs tracking-tight">{item.color}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{item.type}</span>
                          <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-black uppercase">Min: {item.minClosed || 1}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(item)} className="p-2.5 text-slate-400 hover:text-blue-600 active:bg-blue-50 rounded-xl transition-colors"><Edit2 size={18} /></button>
                      <button 
                        onClick={() => { if(confirm('¿Eliminar filamento del catálogo?')) onDelete(item.id); }} 
                        className="p-2.5 text-slate-400 hover:text-red-600 active:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráfica Catalog List */}
      {activeCatalogTab === 'grafica' && (
        <div className="space-y-4">
          {graphicStock.length === 0 && !isAdding && (
            <div className="bg-white p-8 rounded-[2rem] border border-dashed border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 uppercase text-sm">Catálogo de Gráfica Vacío</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Todavía no has agregado insumos de gráfica. Haz clic en "Agregar Insumo" para registrar papeles o vinilos.
                </p>
              </div>
              <button
                onClick={handleStartAdd}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
              >
                <Plus size={14} />
                Agregar Insumo Gráfico
              </button>
            </div>
          )}

          {graphicStock.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {graphicStock.length} {graphicStock.length === 1 ? 'artículo en catálogo' : 'artículos en catálogo'}
                </span>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left min-w-[750px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Especificaciones</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mínimo Alerta</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {graphicStock.sort((a,b) => (a.name || '').localeCompare(b.name || '')).map(item => (
                      <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                        {editingId === item.id ? (
                          <td colSpan={5} className="p-6 bg-blue-50/20">
                            <div className="space-y-4 animate-in fade-in duration-200">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase">Nombre / Descripción</label>
                                <input 
                                  type="text" 
                                  value={formData.name || ''} 
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                />
                              </div>
                              <div className="grid grid-cols-5 gap-3">
                                <div>
                                  <label className="text-[8px] font-black text-slate-400 uppercase">Categoría</label>
                                  <select 
                                    value={formData.graphicCategory || 'Papel'}
                                    onChange={e => setFormData({...formData, graphicCategory: e.target.value as GraphicCategory})}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                  >
                                    <option value="Papel">Papel</option>
                                    <option value="Vinilo">Vinilo</option>
                                    <option value="Insumo Gráfico">Insumo</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[8px] font-black text-slate-400 uppercase">Formato</label>
                                  <input 
                                    type="text" 
                                    value={formData.sizeFormat || ''} 
                                    onChange={e => setFormData({...formData, sizeFormat: e.target.value})}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-black text-slate-400 uppercase">Gramaje</label>
                                  <input 
                                    type="text" 
                                    value={formData.weightThickness || ''} 
                                    onChange={e => setFormData({...formData, weightThickness: e.target.value})}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-black text-slate-400 uppercase">Presentación</label>
                                  <input 
                                    type="text" 
                                    value={formData.packageUnits || ''} 
                                    onChange={e => setFormData({...formData, packageUnits: e.target.value})}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-black text-slate-400 uppercase">Min. Alerta</label>
                                  <input 
                                    type="number" 
                                    value={formData.minClosed ?? 1} 
                                    onChange={e => setFormData({...formData, minClosed: Number(e.target.value)})}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <button onClick={handleCancel} className="px-4 py-2 text-xs font-black uppercase text-slate-400 hover:text-slate-600">Cancelar</button>
                                <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-md">Guardar</button>
                              </div>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              <p className="font-black text-slate-900 uppercase text-xs tracking-tight line-clamp-2 max-w-sm">
                                {item.name}
                              </p>
                              {item.finishColor && (
                                <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 inline-block">
                                  Acabado: {item.finishColor}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-[9px] font-black px-2 py-1 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wider">
                                {item.graphicCategory || 'Papel'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {item.sizeFormat && <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600">{item.sizeFormat}</span>}
                                {item.weightThickness && <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600">{item.weightThickness}</span>}
                                {item.packageUnits && <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600">{item.packageUnits}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs font-black text-slate-800">
                                {item.minClosed ?? 1} {item.graphicCategory === 'Vinilo' ? 'rollos' : 'resmas'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button 
                                  onClick={() => { if(confirm('¿Eliminar este material del catálogo?')) onDelete(item.id); }} 
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-50">
                {graphicStock.sort((a,b) => (a.name || '').localeCompare(b.name || '')).map(item => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900 uppercase text-xs tracking-tight">{item.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                            {item.graphicCategory || 'Papel'}
                          </span>
                          {item.sizeFormat && <span className="text-[8px] text-slate-500 font-bold">{item.sizeFormat}</span>}
                          {item.weightThickness && <span className="text-[8px] text-slate-500 font-bold">{item.weightThickness}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                        <button 
                          onClick={() => { if(confirm('¿Eliminar este material del catálogo?')) onDelete(item.id); }} 
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockManager;
