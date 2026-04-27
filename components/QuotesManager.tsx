import React, { useState, useEffect } from 'react';
import { Quote, Customer, QuoteItem } from '../types';
import { 
  FileText, Plus, Search, Trash2, Download, Send, CheckCircle, 
  X, Save, Calendar, Trash, Pencil, List, History
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../lib/AuthContext';

import CustomerAutocomplete from './CustomerAutocomplete';
import CustomerFormModal from './CustomerFormModal';

import Pagination from './Pagination';

interface QuotesManagerProps {
  quotes: Quote[];
  customers: Customer[];
  onUpdate: (quote: Quote) => void;
  onDelete: (id: string) => void;
  getNextNumber: () => Promise<number>;
  initialCustomerId?: string | null;
  initialStatusFilter?: string;
  onCreateCustomer?: (customer: Customer) => void;
  onConvertToRemito?: (quote: Quote, senaAmount: number) => void;
  onViewRemito?: (remitoId: string) => void;
}

const QuotesManager: React.FC<QuotesManagerProps> = ({ 
  quotes, customers, onUpdate, onDelete, getNextNumber, initialCustomerId, initialStatusFilter, onCreateCustomer, onConvertToRemito, onViewRemito
}) => {
  const { user } = useAuth();
  const userName = user?.displayName || user?.email || (user as any)?.uid || 'Usuario';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState(initialCustomerId || '');
  const [filterStatus, setFilterStatus] = useState<string>(initialStatusFilter || 'todos');

  useEffect(() => {
    if (initialCustomerId !== undefined) {
      setFilterCustomer(initialCustomerId || '');
    }
  }, [initialCustomerId]);

  useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setFilterStatus(initialStatusFilter);
    }
  }, [initialStatusFilter]);
  const [isAdding, setIsAdding] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [confirmingQuote, setConfirmingQuote] = useState<Quote | null>(null);
  const [senaAmount, setSenaAmount] = useState<number>(0);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<Quote | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // New Quote Form State
  const [newQuote, setNewQuote] = useState<Partial<Quote>>({
    id: '',
    number: '',
    customerId: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    total: 0,
    status: 'borrador',
    notes: '',
    createdAt: new Date().toISOString()
  });

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.number.includes(searchTerm) ||
                          (q.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = filterCustomer === '' || q.customerId === filterCustomer;
    
    // For backwards compatibility, consider isDraft=true as 'borrador', missing status as 'presupuestado'
    const currentStatus = q.status || (q.isDraft ? 'borrador' : 'presupuestado');
    const matchesStatus = filterStatus === 'todos' || currentStatus === filterStatus;
    
    return matchesSearch && matchesCustomer && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.number.localeCompare(a.number));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCustomer, filterStatus]);

  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const calculateTotal = (items: QuoteItem[]) => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  const handleAddItem = () => {
    const items = [...(newQuote.items || []), { description: '', quantity: 1, unitPrice: 0, total: 0 }];
    setNewQuote({ ...newQuote, items, total: calculateTotal(items) });
  };

  const handleRemoveItem = (index: number) => {
    const items = (newQuote.items || []).filter((_, i) => i !== index);
    setNewQuote({ ...newQuote, items, total: calculateTotal(items) });
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const items = [...(newQuote.items || [])];
    items[index] = { ...items[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      items[index].total = items[index].quantity * items[index].unitPrice;
    }
    setNewQuote({ ...newQuote, items, total: calculateTotal(items) });
  };

  const handleSelectCustomer = (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (customer) {
      setNewQuote({ ...newQuote, customerId: customer.id, customerName: customer.name });
    }
  };

  const startNewQuote = async () => {
    const nextNum = await getNextNumber();
    setNewQuote({
      id: crypto.randomUUID(),
      number: `0001 - ${nextNum.toString().padStart(5, '0')}`,
      customerId: '',
      customerName: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      total: 0,
      status: 'borrador',
      notes: '',
      createdAt: new Date().toISOString()
    });
    setIsAdding(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setNewQuote(quote);
    setIsAdding(true);
  };

  const handleSave = (status?: 'borrador' | 'presupuestado' | 'confirmado') => {
    if (!newQuote.customerId) return alert('Selecciona un cliente');
    if (!newQuote.items?.length || !newQuote.items[0].description) return alert('Agrega al menos un item');
    
    const finalStatus = status || newQuote.status || 'borrador';
    
    let actionLabel = quotes.some(q => q.id === newQuote.id) ? 'Edición de Presupuesto' : 'Creación de Presupuesto';
    let changesLabel = `Guardado como ${finalStatus}.`;
    
    const historyEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      user: userName,
      action: actionLabel,
      changes: changesLabel
    };
    const updatedHistory = [...(newQuote.history || []), historyEntry];
    
    onUpdate({ ...newQuote, status: finalStatus, isDraft: finalStatus === 'borrador', history: updatedHistory } as Quote);
    setIsAdding(false);
  };

  const generatePDF = (quote: Quote) => {
    const customer = customers.find(c => c.id === quote.customerId);
    const doc = new jsPDF();
    
    // Header Style (Matched to spreadsheet)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.setFontSize(16);
    doc.setTextColor(249, 115, 22); // Sinapsis Orange
    doc.setFont('helvetica', 'bold');
    doc.text('SINAPSIS 3D', 14, 18);
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('BARILOCHE', 14, 25);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text('Rio Negro - Argentina', 14, 31);
    doc.text('WhatsApp: 2944914816', 14, 36);
    doc.setTextColor(249, 115, 22);
    doc.text('www.sinapsis3dbariloche.com.ar', 14, 41);
    doc.text('@sinapsis3dbariloche', 14, 46);
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('PRESUPUESTO', 105, 24, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Valido por 15 días', 105, 30, { align: 'center' });
    
    // Right: Date, Valid until, and Number
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const quoteDate = new Date(quote.date);
    const expireDate = new Date(quoteDate);
    expireDate.setDate(quoteDate.getDate() + 15);
    
    doc.text(`Fecha: ${quoteDate.toLocaleDateString('es-AR')}`, 196, 20, { align: 'right' });
    doc.text(`Válido hasta: ${expireDate.toLocaleDateString('es-AR')}`, 196, 26, { align: 'right' });
    doc.text(`N° ${quote.number}`, 196, 34, { align: 'right' });
    
    doc.setLineWidth(0.5);
    doc.line(14, 52, 196, 52);
    
    // Customer Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', 14, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.customerName, 35, 62);
    
    let infoY = 69;
    if (customer) {
      const addressParts = [customer.street, customer.number, customer.city].filter(Boolean);
      if (addressParts.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Dirección:', 14, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(addressParts.join(' '), 35, infoY);
        infoY += 7;
      }
      if (customer.cuit) {
        doc.setFont('helvetica', 'bold');
        doc.text('CUIT/CUIL:', 14, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(customer.cuit, 35, infoY);
        infoY += 7;
      }
      if (customer.phone) {
        doc.setFont('helvetica', 'bold');
        doc.text('Tel:', 14, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(customer.phone, 35, infoY);
        infoY += 7;
      }
    }
    
    // Table
    const tableData = quote.items.map(item => [
      item.description,
      item.quantity.toString(),
      `$${item.unitPrice.toLocaleString('es-AR')}`,
      `$${item.total.toLocaleString('es-AR')}`
    ]);
    
    autoTable(doc, {
      startY: infoY + 5,
      head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: 0, 
        fontStyle: 'bold',
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`TOTAL: $${quote.total.toLocaleString('es-AR')}`, 196, finalY, { align: 'right' });
    
    // Aclaración de Seña
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const senaAmount = quote.total * 0.3;
    const legend1 = `El inicio de la producción queda sujeto a la acreditación de una seña del 30% ($${senaAmount.toLocaleString('es-AR')}) del valor total.`;
    const legend2 = `Una vez recibido el comprobante, el pedido se considerará confirmado.`;
    const legendY = finalY + 8;
    doc.text([legend1, legend2], 105, legendY, { align: 'center' });
    
    let currentY = legendY + 10;
    
    if (quote.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Observaciones:', 14, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      const splitNotes = doc.splitTextToSize(quote.notes, 180);
      doc.text(splitNotes, 14, currentY + 12);
    }
    
    doc.save(`Presupuesto_${quote.number.replace(/\s/g, '')}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg shadow-slate-900/20">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Presupuestos</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Crear y enviar cotizaciones</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:justify-end">
          <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text"
              placeholder="Buscar presupuesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-slate-900"
            />
          </div>
          
          <div className="flex-1 min-w-[180px] w-full sm:w-auto">
            <CustomerAutocomplete
              customers={customers}
              value={filterCustomer}
              onChange={setFilterCustomer}
              placeholder="Todos los Clientes"
              className="py-2.5 text-xs bg-slate-50 border-none"
            />
          </div>

          <div className="flex-1 min-w-[140px] w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="todos">Todos los Estados</option>
              <option value="borrador">Para Hacer</option>
              <option value="presupuestado">Presupuestados</option>
              <option value="confirmado">Confirmados</option>
            </select>
          </div>

          <button 
            onClick={startNewQuote}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 shrink-0"
          >
            <Plus size={16} /> Generar
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-900 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest flex items-center gap-2">
              {quotes.some(r => r.id === newQuote.id) ? (
                <Pencil size={18} className="text-orange-600" />
              ) : (
                <Plus size={18} className="text-orange-600" />
              )}
              {quotes.some(r => r.id === newQuote.id) ? 'Editar Presupuesto' : 'Nuevo Presupuesto'} No {newQuote.number}
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5 text-left relative">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cliente</label>
              <div className="flex gap-2">
                <CustomerAutocomplete
                  customers={customers}
                  value={newQuote.customerId || ''}
                  onChange={handleSelectCustomer}
                  placeholder="Seleccionar Cliente..."
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                  title="Nuevo Cliente"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha de Emisión</label>
              <input 
                type="date"
                value={newQuote.date}
                onChange={(e) => setNewQuote({ ...newQuote, date: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Válido Hasta</label>
              <input 
                type="date"
                value={(() => {
                  const date = new Date(newQuote.date || new Date().toISOString().split('T')[0]);
                  date.setDate(date.getDate() + 15);
                  return date.toISOString().split('T')[0];
                })()}
                disabled
                className="w-full bg-slate-100/50 text-slate-500 border-none rounded-xl px-4 py-3 text-sm font-bold cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items del Presupuesto</h4>
              <button 
                onClick={handleAddItem}
                className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                + Agregar Item
              </button>
            </div>
            
            <div className="space-y-2">
              {newQuote.items?.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="col-span-12 md:col-span-6">
                    <input 
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Descripción del item..."
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input 
                      type="number"
                      placeholder="Cantidad"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-bold text-center focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div className="col-span-5 md:col-span-2">
                    <input 
                      type="number"
                      placeholder="P. Unit"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-bold text-right focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2 flex justify-end items-center pr-1">
                    <span className="font-black text-[10px] text-slate-900 mr-2 flex-1 text-right whitespace-nowrap">${(item.quantity * item.unitPrice).toLocaleString()}</span>
                    <button onClick={() => handleRemoveItem(idx)} className="text-slate-300 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notas / Aclaraciones</label>
            <textarea
              value={newQuote.notes || ''}
              onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-slate-900 resize-none h-20"
              placeholder="Condiciones, tiempo de entrega, validez..."
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">
            <div className="text-left w-full md:w-auto">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Presupuesto</span>
              <span className="text-3xl font-black text-slate-900 block">$ {newQuote.total?.toLocaleString('es-AR')}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-2">
                Seña sugerida (30%): <span className="font-black text-orange-600">$ {((newQuote.total || 0) * 0.3).toLocaleString('es-AR')}</span>
              </span>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all border border-slate-100"
              >
                Cancelar
              </button>
              {newQuote.status === 'confirmado' ? (
                <button 
                  onClick={() => handleSave()}
                  className="flex-2 flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                >
                  <Save size={16} /> Guardar
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleSave('borrador')}
                    className="flex-[1.5] flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                  >
                    <Save size={16} /> Para Hacer
                  </button>
                  <button 
                    onClick={() => handleSave('presupuestado')}
                    className="flex-2 flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                  >
                    <CheckCircle size={16} /> Presupuestado
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!isAdding && (
        <div className="space-y-3">
          {paginatedQuotes.map(quote => (
            <QuoteRow 
              key={quote.id}
              quote={quote}
              onGeneratePDF={generatePDF}
              onEdit={handleEditQuote}
              onDelete={setItemToDelete}
              onConfirm={(q) => {
                setConfirmingQuote(q);
                setSenaAmount(q.total * 0.3);
              }}
              onViewRemito={onViewRemito}
              onShowHistory={(quote) => {
                setSelectedItemForHistory(quote);
                setShowHistoryModal(true);
              }}
            />
          ))}

          {filteredQuotes.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredQuotes.length}
            />
          )}

          {filteredQuotes.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron presupuestos</p>
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
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">¿Eliminar presupuesto?</h3>
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
      {showHistoryModal && selectedItemForHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <History size={16} />
                </div>
                <h3 className="font-bold text-slate-800">Historial de modif.</h3>
              </div>
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedItemForHistory(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
               {selectedItemForHistory.history && selectedItemForHistory.history.length > 0 ? (
                 <div className="space-y-4">
                   {selectedItemForHistory.history.map(entry => (
                     <div key={entry.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                       <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-bold text-slate-500">{new Date(entry.date).toLocaleString()}</span>
                         <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{entry.user}</span>
                       </div>
                       <p className="text-sm font-semibold text-slate-800 mb-1">{entry.action}</p>
                       <p className="text-xs text-slate-600 whitespace-pre-wrap">{entry.changes}</p>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-slate-400">
                    <History size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No hay historial de modificaciones</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Quote Modal */}
      {confirmingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Confirmar Presupuesto</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Pasará a estado confirmado y se generará una Venta.
            </p>
            
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pago de Seña ($)</label>
              <input 
                type="number"
                value={senaAmount || ''}
                onChange={(e) => setSenaAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
                placeholder="Ej: 50000"
              />
              <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase tracking-widest">
                Sugerencia: $ {(confirmingQuote.total * 0.3).toLocaleString('es-AR')} (30%)
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setConfirmingQuote(null)}
                className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (onConvertToRemito) {
                    onConvertToRemito(confirmingQuote, senaAmount);
                  }
                  setConfirmingQuote(null);
                }}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-600/20 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={(customer) => {
          if (onCreateCustomer) {
            onCreateCustomer(customer);
            handleSelectCustomer(customer.id);
          }
          setIsCustomerModalOpen(false);
        }}
      />
    </div>
  );
};

interface QuoteRowProps {
  quote: Quote;
  onGeneratePDF: (quote: Quote) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
  onConfirm: (quote: Quote) => void;
  onViewRemito?: (remitoId: string) => void;
  onShowHistory: (quote: Quote) => void;
}

const QuoteRow: React.FC<QuoteRowProps> = ({ quote, onGeneratePDF, onEdit, onDelete, onConfirm, onViewRemito, onShowHistory }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const dateObj = new Date(quote.date + 'T00:00:00');
  const expireDateObj = new Date(dateObj);
  expireDateObj.setDate(expireDateObj.getDate() + 15);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isExpired = expireDateObj.getTime() < today.getTime();
  const daysDiff = Math.ceil((expireDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const status = quote.status || (quote.isDraft ? 'borrador' : 'presupuestado');

  return (
    <div className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:border-orange-100 transition-all ${status === 'confirmado' ? 'border-l-4 border-l-green-500' : ''}`}>
      <div className="p-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Number & Date */}
        <div className="col-span-12 lg:col-span-2">
          <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-widest block w-fit mb-1">
            {quote.number}
          </span>
          <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 whitespace-nowrap mb-1">
            <Calendar size={10} /> {dateObj.toLocaleDateString('es-AR')}
          </p>
          {status !== 'confirmado' ? (
            <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-50 pt-1">
              <span className="text-[9px] text-slate-500 font-bold uppercase whitespace-nowrap">
                Vto: {expireDateObj.toLocaleDateString('es-AR')}
              </span>
              {isExpired ? (
                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">¡Vencido!</span>
              ) : (
                <span className="text-[9px] font-bold text-slate-400 uppercase">Quedan {daysDiff} días</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-50 pt-1">
              <span className="text-[9px] text-green-600 font-black uppercase whitespace-nowrap flex items-center gap-1">
                <CheckCircle size={10} /> 
                {quote.confirmedAt 
                  ? new Date(quote.confirmedAt).toLocaleDateString('es-AR')
                  : 'Confirmado'}
              </span>
            </div>
          )}
        </div>

        {/* Customer */}
        <div className="col-span-12 lg:col-span-2">
          <h3 className="font-black text-slate-900 uppercase text-sm leading-tight truncate" title={quote.customerName}>
            {quote.customerName}
          </h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{quote.items.length} ítems</p>
        </div>

        {/* Status */}
        <div className="col-span-12 lg:col-span-2 md:text-center">
          {status === 'borrador' ? (
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block bg-slate-100 text-slate-600 border border-slate-200">
              Para Hacer
            </span>
          ) : status === 'confirmado' ? (
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block bg-green-100 text-green-700">
              Confirmado
            </span>
          ) : isExpired ? (
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block bg-red-100 text-red-700">
              Vencido
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block bg-blue-100 text-blue-700">
              Presupuestado
            </span>
          )}
        </div>

        {/* Total */}
        <div className="col-span-12 md:col-span-6 lg:col-span-2 text-left lg:text-right">
          <span className="text-lg font-black text-slate-900 tracking-tighter">
            $ {quote.total.toLocaleString('es-AR')}
          </span>
        </div>

        {/* Actions */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 flex justify-end items-center gap-1 flex-wrap lg:flex-nowrap">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'}`}
            title="Ver detalle"
          >
            <List size={16} />
          </button>
          
          {status === 'presupuestado' && (
            <button 
              onClick={() => onConfirm(quote)}
              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
              title="Confirmar Presupuesto"
            >
              <CheckCircle size={16} />
            </button>
          )}

          {status !== 'borrador' && (
            <button 
              onClick={() => onGeneratePDF(quote)}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
              title="Descargar Presupuesto"
            >
              <Download size={16} />
            </button>
          )}

          {status === 'confirmado' && quote.convertedRemitoId && onViewRemito && (
            <button 
              onClick={() => onViewRemito(quote.convertedRemitoId!)}
              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
              title="Ir a la Venta"
            >
              <FileText size={16} />
            </button>
          )}

          <button 
            onClick={() => onEdit(quote)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            title="Editar Presupuesto"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => onShowHistory(quote)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Ver Historial"
          >
            <History size={16} />
          </button>
          <button 
            onClick={() => onDelete(quote.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-8 pb-6 pt-4 border-t border-slate-50 bg-slate-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 px-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
              <div className="col-span-7">Descripción</div>
              <div className="col-span-2 text-center">Cant.</div>
              <div className="col-span-3 text-right">Subtotal</div>
            </div>
            {quote.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 items-center">
                <div className="col-span-7 text-[10px] font-bold text-slate-700 uppercase">{item.description}</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 text-center">x{item.quantity}</div>
                <div className="col-span-3 text-[10px] font-black text-slate-900 text-right">${item.total.toLocaleString()}</div>
              </div>
            ))}
            {quote.notes && (
              <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 font-black">Observaciones:</p>
                <p className="text-[10px] text-slate-600 italic">"{quote.notes}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesManager;
