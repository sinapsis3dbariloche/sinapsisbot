import React, { useState } from 'react';
import { StockItem, GraphicCategory } from '../types';
import { Plus, Minus, AlertCircle, Search, FileText, ChevronRight, Layers, Sparkles, Box, ScrollText } from 'lucide-react';
import { filterAndSortGraphicStock, isGraphicStockAlert, getGraphicMinStock, calculateGraphicStockSummary } from '../services/stockLogic';

interface GraphicStockBoardProps {
  stock: StockItem[];
  onUpdateStock?: (id: string, updates: Partial<StockItem>) => void;
  onNavigateToCatalog?: () => void;
}

const GraphicStockBoard: React.FC<GraphicStockBoardProps> = ({ stock, onUpdateStock, onNavigateToCatalog }) => {
  const [activeCategory, setActiveCategory] = useState<'Todos' | GraphicCategory>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = filterAndSortGraphicStock(stock, activeCategory, searchTerm);
  const summary = calculateGraphicStockSummary(stock);

  const updateCount = (id: string, field: 'closedCount' | 'openCount', delta: number) => {
    const item = stock.find(s => s.id === id);
    if (!item || !onUpdateStock) return;
    onUpdateStock(id, { [field]: Math.max(0, (item[field] || 0) + delta) });
  };

  const getCategoryIcon = (cat?: GraphicCategory) => {
    switch (cat) {
      case 'Papel':
        return <FileText size={16} className="text-blue-500" />;
      case 'Vinilo':
        return <ScrollText size={16} className="text-purple-500" />;
      default:
        return <Box size={16} className="text-amber-500" />;
    }
  };

  const getCategoryBadgeClass = (cat?: GraphicCategory) => {
    switch (cat) {
      case 'Papel':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Vinilo':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto h-full flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/20">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Stock Gráfica & Papelería</h2>
              {summary.totalAlerts > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  {summary.totalAlerts} {summary.totalAlerts === 1 ? 'alerta' : 'alertas'}
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Resmas de papel, vinilos y sustratos
            </p>
          </div>
        </div>

        {/* Quick KPI pills */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Cerrados (Stock)</p>
            <p className="text-sm font-black text-slate-800 leading-tight">{summary.totalClosed}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Abiertos (En uso)</p>
            <p className="text-sm font-black text-slate-800 leading-tight">{summary.totalOpen}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Artículos</p>
            <p className="text-sm font-black text-slate-800 leading-tight">{summary.totalItems}</p>
          </div>
        </div>

        {/* Controls: Search and Category Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text"
              placeholder="Buscar papel, vinilo, formato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-8 py-2 text-[11px] font-bold focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {(['Todos', 'Papel', 'Vinilo', 'Insumo Gráfico'] as const).map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.12em] whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cat === 'Insumo Gráfico' ? 'Otros' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[1.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
        {filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-4">
              <FileText size={28} />
            </div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mb-1">
              {summary.totalItems === 0 ? 'No hay materiales de Gráfica cargados' : 'Sin coincidencias para la búsqueda'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-6">
              {summary.totalItems === 0 
                ? 'Agregá resmas de papel fotográfico, tatufan, vinilos termotransferibles u otros insumos en el Catálogo.'
                : 'Probá ajustando el término de búsqueda o la categoría seleccionada.'}
            </p>
            {onNavigateToCatalog && (
              <button
                onClick={onNavigateToCatalog}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                <Plus size={16} /> Ir al Catálogo de Materiales
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Material / Descripción</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Especificaciones</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cerrados (Stock)</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Abiertos (En uso)</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.map((item) => {
                    const low = isGraphicStockAlert(item);
                    const min = getGraphicMinStock(item);
                    return (
                      <tr key={item.id} className={`group hover:bg-slate-50/80 transition-all ${low ? 'bg-orange-50/30' : ''}`}>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                              {getCategoryIcon(item.graphicCategory)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 uppercase text-xs tracking-tight leading-snug line-clamp-2">
                                {item.name || 'Sin nombre'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${getCategoryBadgeClass(item.graphicCategory)}`}>
                                  {item.graphicCategory || 'Papel'}
                                </span>
                                {item.finishColor && (
                                  <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                                    {item.finishColor}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[220px] mx-auto">
                            {item.sizeFormat && (
                              <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                {item.sizeFormat}
                              </span>
                            )}
                            {item.weightThickness && (
                              <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                {item.weightThickness}
                              </span>
                            )}
                            {item.packageUnits && (
                              <span className="bg-slate-100 text-slate-600 text-[9px] font-medium px-2 py-0.5 rounded-md border border-slate-200">
                                {item.packageUnits}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-2.5">
                            <button 
                              onClick={() => updateCount(item.id, 'closedCount', -1)} 
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                              title="Restar unidad cerrada"
                            >
                              <Minus size={12} />
                            </button>
                            <div className="flex flex-col items-center min-w-[2.5rem]">
                              <span className={`font-black text-base leading-none ${low ? 'text-orange-600' : 'text-slate-900'}`}>
                                {item.closedCount}
                              </span>
                              <span className="text-[7px] text-slate-400 font-bold uppercase mt-1">
                                Min: {min}
                              </span>
                            </div>
                            <button 
                              onClick={() => updateCount(item.id, 'closedCount', 1)} 
                              className="p-1.5 text-blue-600 hover:bg-white rounded-lg transition-colors shadow-sm border border-transparent hover:border-slate-200"
                              title="Sumar unidad cerrada"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            <button 
                              onClick={() => updateCount(item.id, 'openCount', -1)} 
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                              title="Restar unidad abierta"
                            >
                              <Minus size={12} />
                            </button>
                            <div className="flex flex-col items-center min-w-[2rem]">
                              <span className="font-black text-base text-slate-900 leading-none">
                                {item.openCount}
                              </span>
                              <span className="text-[7px] text-slate-400 font-bold uppercase mt-1">
                                En uso
                              </span>
                            </div>
                            <button 
                              onClick={() => updateCount(item.id, 'openCount', 1)} 
                              className="p-1.5 text-blue-600 hover:bg-white rounded-lg transition-colors shadow-sm border border-transparent hover:border-slate-200"
                              title="Sumar unidad abierta"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {low ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 animate-pulse-soft">
                              <AlertCircle size={10} /> Reponer
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-1 text-green-600 text-[8px] font-black uppercase tracking-widest">
                              OK <ChevronRight size={10} className="opacity-30" />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {filteredItems.map((item) => {
                const low = isGraphicStockAlert(item);
                const min = getGraphicMinStock(item);
                return (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      low ? 'bg-orange-50/40 border-orange-200 shadow-md' : 'bg-white border-slate-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center mt-0.5">
                          {getCategoryIcon(item.graphicCategory)}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight leading-snug">
                            {item.name || 'Sin nombre'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${getCategoryBadgeClass(item.graphicCategory)}`}>
                              {item.graphicCategory || 'Papel'}
                            </span>
                            {item.sizeFormat && (
                              <span className="text-[8px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.sizeFormat}
                              </span>
                            )}
                            {item.weightThickness && (
                              <span className="text-[8px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.weightThickness}
                              </span>
                            )}
                            {item.finishColor && (
                              <span className="text-[8px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.finishColor}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {low && (
                        <div className="shrink-0 bg-orange-600 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md">
                          Reponer
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-2.5 rounded-xl flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Cerrados (Min: {min})
                        </span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateCount(item.id, 'closedCount', -1)} className="p-1.5 text-slate-400 hover:text-red-500">
                            <Minus size={14} />
                          </button>
                          <span className={`text-lg font-black ${low ? 'text-orange-600' : 'text-slate-900'}`}>
                            {item.closedCount}
                          </span>
                          <button onClick={() => updateCount(item.id, 'closedCount', 1)} className="p-1.5 text-blue-600">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Abiertos (En uso)
                        </span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateCount(item.id, 'openCount', -1)} className="p-1.5 text-slate-400 hover:text-red-500">
                            <Minus size={14} />
                          </button>
                          <span className="text-lg font-black text-slate-900">
                            {item.openCount}
                          </span>
                          <button onClick={() => updateCount(item.id, 'openCount', 1)} className="p-1.5 text-blue-600">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GraphicStockBoard;
