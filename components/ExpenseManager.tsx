
import React, { useState, useMemo, useEffect } from 'react';
import { Supplier, Expense, ExpenseItem } from '../types';
import { Search, Plus, Trash2, Edit2, Save, X, Calendar, User, FileText, DollarSign, List, ChevronRight } from 'lucide-react';
import Pagination from './Pagination';

interface ExpenseManagerProps {
  expenses: Expense[];
  suppliers: Supplier[];
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, suppliers, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIncludeDrafts, setFilterIncludeDrafts] = useState(true);
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierName: '',
    items: [],
    total: 0,
    notes: '',
    createdAt: ''
  });

  const uniqueYears = useMemo(() => {
    const years = expenses.map(e => new Date(e.date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [expenses]);

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.items.some(item => item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDraft = filterIncludeDrafts || !e.isDraft;
    
    const expenseDate = new Date(e.date);
    const matchesMonth = monthFilter === 'all' || expenseDate.getMonth() + 1 === parseInt(monthFilter);
    const matchesYear = yearFilter === 'all' || expenseDate.getFullYear() === parseInt(yearFilter);
    
    return matchesSearch && matchesDraft && matchesMonth && matchesYear;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterIncludeDrafts, monthFilter, yearFilter]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddNew = () => {
    setFormData({
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      supplierName: '',
      items: [],
      total: 0,
      notes: '',
      createdAt: new Date().toISOString(),
      isDraft: false
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      ...expense,
      date: new Date(expense.date).toISOString().split('T')[0]
    });
    setEditingId(expense.id);
    setIsAdding(true);
  };

  const handleAddItem = () => {
    const newItem: ExpenseItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const handleUpdateItem = (index: number, updates: Partial<ExpenseItem>) => {
    const updatedItems = [...(formData.items || [])];
    const item = { ...updatedItems[index], ...updates };
    item.total = item.quantity * item.unitPrice;
    updatedItems[index] = item;

    const newTotal = updatedItems.reduce((acc, curr) => acc + curr.total, 0);
    setFormData({ ...formData, items: updatedItems, total: newTotal });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = (formData.items || []).filter((_, i) => i !== index);
    const newTotal = updatedItems.reduce((acc, curr) => acc + curr.total, 0);
    setFormData({ ...formData, items: updatedItems, total: newTotal });
  };

  const handleSave = (asDraft = false) => {
    if (!formData.supplierId) return alert('Seleccione un proveedor');
    if (!formData.items || formData.items.length === 0) return alert('Agregue al menos un ítem de gasto');
    
    const supplier = suppliers.find(s => s.id === formData.supplierId);
    const finalData: Expense = {
      ...formData as Expense,
      supplierName: supplier?.name || '',
      date: new Date(formData.date!).toISOString(),
      isDraft: asDraft
    };

    onUpdate(finalData);
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-red-600 p-3 rounded-2xl text-white shadow-lg shadow-red-600/20">
            <DollarSign size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestión de Gastos</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Egresos y compras de insumos</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:justify-end">
          <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text"
              placeholder="Buscar gasto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="flex-1 min-w-[120px] w-full sm:w-auto">
            <select 
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-red-600 cursor-pointer"
            >
              <option value="all">Mes: Todos</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>

          <div className="flex-1 min-w-[120px] w-full sm:w-auto">
            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-red-600 cursor-pointer"
            >
              <option value="all">Año: Todos</option>
              {uniqueYears.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
              {uniqueYears.length === 0 && <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>}
            </select>
          </div>

          <label className="flex flex-1 w-full justify-center sm:justify-start sm:w-auto items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors shrink-0">
            <input 
              type="checkbox"
              checked={filterIncludeDrafts}
              onChange={(e) => setFilterIncludeDrafts(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
            />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Ver Borradores</span>
          </label>

          <button 
            onClick={handleAddNew}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 shrink-0"
          >
            <Plus size={16} /> Gasto
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-[2rem] border-2 border-red-100 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">
              {editingId ? 'Editar Registro de Gasto' : 'Nuevo Registro de Gasto'}
            </h3>
            <button onClick={() => {setIsAdding(false); setEditingId(null);}} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha de Gasto</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Proveedor</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <select 
                  value={formData.supplierId}
                  onChange={e => setFormData({...formData, supplierId: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-600 appearance-none"
                >
                  <option value="">Seleccionar Proveedor</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <List size={14} /> Detalle de Ítems
              </h4>
              <button 
                onClick={handleAddItem}
                className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
              >
                + Agregar Ítem
              </button>
            </div>

            <div className="space-y-2">
              {formData.items?.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="col-span-12 md:col-span-6">
                    <input 
                      placeholder="Descripción del insumo..."
                      value={item.description}
                      onChange={e => handleUpdateItem(index, { description: e.target.value })}
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input 
                      type="number"
                      placeholder="Cantidad"
                      value={item.quantity || ''}
                      onChange={e => handleUpdateItem(index, { quantity: Number(e.target.value) })}
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-red-600 text-center"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input 
                      type="number"
                      placeholder="P. Unit"
                      value={item.unitPrice || ''}
                      onChange={e => handleUpdateItem(index, { unitPrice: Number(e.target.value) })}
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-red-600 text-right"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-1 text-right font-black text-[10px] text-slate-900">
                    ${item.total.toLocaleString()}
                  </div>
                  <div className="col-span-1 md:col-span-1 flex justify-end">
                    <button onClick={() => handleRemoveItem(index)} className="text-slate-300 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end gap-1 pt-4 border-t border-slate-50">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Gasto</span>
              <span className="text-2xl font-black text-slate-900">${formData.total?.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notas / Observaciones</label>
            <textarea 
              value={formData.notes || ''} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-600 min-h-[80px]"
              placeholder="Ej: Pago con transferencia, factura A, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={() => {setIsAdding(false); setEditingId(null);}}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all border border-slate-100"
            >
              Cancelar
            </button>
            <button 
              onClick={() => handleSave(true)}
              className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
            >
              <Save size={16} /> Borrador
            </button>
            <button 
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 bg-red-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
            >
              <Save size={16} /> {editingId ? 'Actualizar Gasto' : 'Registrar Gasto'}
            </button>
          </div>
        </div>
      )}

      {/* Expenses List */}
      {!isAdding && (
        <div className="space-y-2">
          {paginatedExpenses.map(expense => (
            <ExpenseRow 
              key={expense.id} 
              expense={expense} 
              onEdit={handleEdit} 
              onDelete={setItemToDelete} 
            />
          ))}

          {filteredExpenses.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredExpenses.length}
            />
          )}

          {filteredExpenses.length === 0 && (
            <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
              <DollarSign size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No hay gastos registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">¿Eliminar gasto?</h3>
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
    </div>
  );
};

interface ExpenseRowProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const ExpenseRow: React.FC<ExpenseRowProps> = ({ expense, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-red-100 transition-all">
      <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`p-2 rounded-xl text-xs font-black uppercase ${isExpanded ? 'bg-red-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
            {new Date(expense.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 uppercase text-xs truncate">{expense.supplierName}</h3>
              {expense.isDraft && (
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                  Borrador
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{expense.items.length} ítems registrados</p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900">${expense.total.toLocaleString()}</p>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Ver detalle"
            >
              <List size={14} className={isExpanded ? 'text-red-600' : ''} />
            </button>
            <button 
              onClick={() => onEdit(expense)} 
              className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={() => onDelete(expense.id)} 
              className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-50 bg-slate-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 px-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
              <div className="col-span-7">Descripción</div>
              <div className="col-span-2 text-center">Cant.</div>
              <div className="col-span-3 text-right">Subtotal</div>
            </div>
            {expense.items.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 px-2 py-1.5 bg-white rounded-lg border border-slate-100 items-center">
                <div className="col-span-7 text-[10px] font-bold text-slate-700 uppercase">{item.description}</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 text-center">x{item.quantity}</div>
                <div className="col-span-3 text-[10px] font-black text-slate-900 text-right">${item.total.toLocaleString()}</div>
              </div>
            ))}
            {expense.notes && (
              <div className="mt-3 p-2 bg-white rounded-lg border border-slate-100">
                <p className="text-[9px] text-slate-400 italic">
                  <span className="font-black uppercase not-italic mr-2">NOTAS:</span>
                  {expense.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
