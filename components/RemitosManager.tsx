
import React, { useState, useEffect } from 'react';
import { Remito, Customer, RemitoItem } from '../types';
import { 
  FileText, Plus, Search, Trash2, Download, Send, CheckCircle, 
  Clock, X, Save, User, Calendar, Trash, MessageCircle, Mail,
  DollarSign, ChevronRight, Pencil, List
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import CustomerAutocomplete from './CustomerAutocomplete';
import CustomerFormModal from './CustomerFormModal';
import Pagination from './Pagination';

interface RemitosManagerProps {
  remitos: Remito[];
  customers: Customer[];
  onUpdate: (remito: Remito) => void;
  onDelete: (id: string) => void;
  getNextNumber: () => Promise<number>;
  initialCustomerId?: string | null;
  initialStatusFilter?: string;
  initialProductionStatusFilter?: string;
  onCreateCustomer?: (customer: Customer) => void;
}

const RemitosManager: React.FC<RemitosManagerProps> = ({ 
  remitos, customers, onUpdate, onDelete, getNextNumber, initialCustomerId, initialStatusFilter, initialProductionStatusFilter, onCreateCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState(initialCustomerId || '');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all');
  const [productionStatusFilter, setProductionStatusFilter] = useState(initialProductionStatusFilter || 'all');
  const [draftFilter, setDraftFilter] = useState('all');

  useEffect(() => {
    if (initialCustomerId !== undefined) {
      setFilterCustomer(initialCustomerId || '');
    }
  }, [initialCustomerId]);
  
  useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialProductionStatusFilter !== undefined) {
      setProductionStatusFilter(initialProductionStatusFilter);
    }
  }, [initialProductionStatusFilter]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRemito, setSelectedRemito] = useState<Remito | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // New Remito Form State
  const [newRemito, setNewRemito] = useState<Partial<Remito>>({
    id: '',
    number: '',
    customerId: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    total: 0,
    status: 'Pendiente',
    productionStatus: 'En Producción',
    amountPaid: 0,
    notes: '',
    createdAt: new Date().toISOString()
  });

  const filteredRemitos = remitos.filter(r => {
    const matchesSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.number.includes(searchTerm) ||
                          (r.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = filterCustomer === '' || r.customerId === filterCustomer;
    const matchesStatus = statusFilter === 'all' ? true : 
                          statusFilter === 'Deudores' ? (r.status === 'Pendiente' || r.status === 'Parcial') : 
                          statusFilter === 'ConCobros' ? (r.amountPaid > 0) :
                          r.status === statusFilter;
    const currentProdStatus = r.productionStatus || 'Entregada';
    const matchesProdStatus = productionStatusFilter === 'all' || currentProdStatus === productionStatusFilter;
    const matchesDraft = draftFilter === 'all' ? true : (draftFilter === 'Borrador' ? r.isDraft : !r.isDraft);
    
    return matchesSearch && matchesCustomer && matchesStatus && matchesProdStatus && matchesDraft;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.number.localeCompare(a.number));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCustomer, statusFilter, productionStatusFilter, draftFilter]);

  const totalPages = Math.ceil(filteredRemitos.length / itemsPerPage);
  const paginatedRemitos = filteredRemitos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const calculateTotal = (items: RemitoItem[]) => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  const handleAddItem = () => {
    const items = [...(newRemito.items || []), { description: '', quantity: 1, unitPrice: 0, total: 0 }];
    setNewRemito({ ...newRemito, items, total: calculateTotal(items) });
  };

  const handleRemoveItem = (index: number) => {
    const items = (newRemito.items || []).filter((_, i) => i !== index);
    setNewRemito({ ...newRemito, items, total: calculateTotal(items) });
  };

  const handleItemChange = (index: number, field: keyof RemitoItem, value: any) => {
    const items = [...(newRemito.items || [])];
    items[index] = { ...items[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      items[index].total = items[index].quantity * items[index].unitPrice;
    }
    setNewRemito({ ...newRemito, items, total: calculateTotal(items) });
  };

  const handleSelectCustomer = (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (customer) {
      setNewRemito({ ...newRemito, customerId: customer.id, customerName: customer.name });
    }
  };

  const startNewRemito = async () => {
    const nextNum = await getNextNumber();
    setNewRemito({
      id: crypto.randomUUID(),
      number: `0001 - ${nextNum.toString().padStart(5, '0')}`,
      customerId: '',
      customerName: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      total: 0,
      status: 'Pendiente',
      productionStatus: 'En Producción',
      isDraft: false,
      amountPaid: 0,
      paymentHistory: [],
      notes: '',
      createdAt: new Date().toISOString()
    });
    setIsAdding(true);
  };

  const handleEditRemito = (remito: Remito) => {
    setNewRemito(remito);
    setIsAdding(true);
  };

  const handleSave = (asDraft = false) => {
    if (!newRemito.customerId) return alert('Selecciona un cliente');
    if (!newRemito.items?.length || !newRemito.items[0].description) return alert('Agrega al menos un item');
    
    onUpdate({ ...newRemito, isDraft: asDraft } as Remito);
    setIsAdding(false);
  };

  const generatePDF = (remito: Remito) => {
    const customer = customers.find(c => c.id === remito.customerId);
    const doc = new jsPDF();
    
    // Header Style (Matched to spreadsheet)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Al Izquierda: Datos del negocio
    doc.setFontSize(16);
    doc.setTextColor(249, 115, 22); // Naranja Sinapsis
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
    
    // Al Medio: Remito [X]
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Remito', 105, 18, { align: 'center' });
    doc.setFontSize(30);
    doc.text('[X]', 105, 30, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Documento no valido como factura', 105, 35, { align: 'center' });
    
    // A la Derecha: Fecha y Numero
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Fecha: ${new Date(remito.date).toLocaleDateString('es-AR')}`, 196, 20, { align: 'right' });
    doc.setFontSize(11);
    doc.text(`N° ${remito.number}`, 196, 30, { align: 'right' });
    
    doc.setLineWidth(0.5);
    doc.line(14, 52, 196, 52);
    
    // Customer Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', 14, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(remito.customerName, 35, 62);
    
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
    const tableData = remito.items.map(item => [
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
    doc.text(`TOTAL: $${remito.total.toLocaleString('es-AR')}`, 196, finalY, { align: 'right' });
    
    // Status / Payments
    if (remito.amountPaid > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Pagado: $${remito.amountPaid.toLocaleString('es-AR')}`, 196, finalY + 7, { align: 'right' });
      const balance = remito.total - remito.amountPaid;
      if (balance > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 0, 0);
        doc.text(`Saldo Pendiente: $${balance.toLocaleString('es-AR')}`, 196, finalY + 14, { align: 'right' });
      }
    }
    
    doc.save(`Remito_${remito.number.replace(/\s/g, '')}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg shadow-slate-900/20">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestión de Ventas</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Documentación y Pagos</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:justify-end">
          <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text"
              placeholder="Buscar venta..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">Pago: Todos</option>
              <option value="Deudores">Pendientes de Cobro</option>
              <option value="Pendiente">Pendiente</option>
              <option value="ConCobros">Con Cobros (Parcial/Pagado)</option>
              <option value="Parcial">Parcial</option>
              <option value="Pagado">Pagado</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[140px] w-full sm:w-auto">
            <select 
              value={productionStatusFilter}
              onChange={(e) => setProductionStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">Producción: Todos</option>
              <option value="En Producción">En Producción</option>
              <option value="Para entregar">Para entregar</option>
              <option value="Entregada">Entregada</option>
            </select>
          </div>

          <div className="flex-1 min-w-[140px] w-full sm:w-auto">
            <select 
              value={draftFilter}
              onChange={(e) => setDraftFilter(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">Tipo: Todos</option>
              <option value="Emitido">Emitida</option>
              <option value="Borrador">Borrador</option>
            </select>
          </div>

          <button 
            onClick={startNewRemito}
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
              {remitos.some(r => r.id === newRemito.id) ? (
                <Pencil size={18} className="text-orange-600" />
              ) : (
                <Plus size={18} className="text-orange-600" />
              )}
              {remitos.some(r => r.id === newRemito.id) ? 'Editar Venta' : 'Nueva Venta'} No {newRemito.number}
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 text-left relative">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cliente</label>
              <div className="flex gap-2">
                <CustomerAutocomplete
                  customers={customers}
                  value={newRemito.customerId || ''}
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
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha</label>
              <input 
                type="date"
                value={newRemito.date}
                onChange={(e) => setNewRemito({ ...newRemito, date: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Estado de Producción</label>
              <select 
                value={newRemito.productionStatus || 'Entregada'}
                onChange={(e) => setNewRemito({ ...newRemito, productionStatus: e.target.value as Remito['productionStatus'] })}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
              >
                <option value="En Producción">En Producción</option>
                <option value="Para entregar">Para entregar</option>
                <option value="Entregada">Entregada</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items del Remito</h4>
              <button 
                onClick={handleAddItem}
                className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                + Agregar Item
              </button>
            </div>
            
            <div className="space-y-2">
              {newRemito.items?.map((item, idx) => (
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

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">
            <div className="text-left w-full md:w-auto">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Venta</span>
              <span className="text-3xl font-black text-slate-900">$ {newRemito.total?.toLocaleString('es-AR')}</span>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all border border-slate-100"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSave(true)}
                className="flex-[1.5] flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
              >
                <Save size={16} /> Borrador
              </button>
              <button 
                onClick={() => handleSave(false)}
                className="flex-2 flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
              >
                <CheckCircle size={16} /> Emitir Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {!isAdding && (
        <div className="space-y-3">
          {paginatedRemitos.map(remito => (
            <RemitoRow 
              key={remito.id}
              remito={remito}
              onGeneratePDF={generatePDF}
              onRegisterPayment={setSelectedRemito}
              onEdit={handleEditRemito}
              onDelete={setItemToDelete}
              onUpdate={onUpdate}
            />
          ))}

          {filteredRemitos.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredRemitos.length}
            />
          )}

          {filteredRemitos.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron ventas</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {selectedRemito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Registrar Pago</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Venta No {selectedRemito.number}</p>
              </div>
              <button onClick={() => setSelectedRemito(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-500">Total Venta:</span>
                  <span className="font-black text-slate-900">$ {selectedRemito.total.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-500">Ya Pagado:</span>
                  <span className="font-black text-blue-600">$ {selectedRemito.amountPaid.toLocaleString('es-AR')}</span>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                  <span className="font-black text-slate-900">Saldo Pendiente:</span>
                  <span className="text-xl font-black text-red-600">$ {(selectedRemito.total - selectedRemito.amountPaid).toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha de Pago</label>
                  <input 
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    id="payment-date"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Monto del Pago</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                    <input 
                      type="number"
                      defaultValue={selectedRemito.total - selectedRemito.amountPaid}
                      id="payment-amount"
                      className="w-full bg-slate-50 border-none rounded-xl pl-8 pr-4 py-3 text-sm font-black focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button 
                onClick={() => setSelectedRemito(null)}
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-2xl"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  const inputAmount = document.getElementById('payment-amount') as HTMLInputElement;
                  const inputDate = document.getElementById('payment-date') as HTMLInputElement;
                  const newPaymentAmount = Number(inputAmount.value);
                  const newPaymentDate = inputDate.value;
                  
                  const totalPaid = selectedRemito.amountPaid + newPaymentAmount;
                  const newHistory = [...(selectedRemito.paymentHistory || []), { amount: newPaymentAmount, date: newPaymentDate }];
                  
                  let status: Remito['status'] = 'Pendiente';
                  if (totalPaid >= selectedRemito.total) status = 'Pagado';
                  else if (totalPaid > 0) status = 'Parcial';
                  
                  onUpdate({ ...selectedRemito, amountPaid: totalPaid, paymentHistory: newHistory, status });
                  setSelectedRemito(null);
                }}
                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/20"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">¿Eliminar venta?</h3>
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

interface RemitoRowProps {
  remito: Remito;
  onGeneratePDF: (remito: Remito) => void;
  onRegisterPayment: (remito: Remito) => void;
  onEdit: (remito: Remito) => void;
  onDelete: (id: string) => void;
  onUpdate: (remito: Remito) => void;
}

const RemitoRow: React.FC<RemitoRowProps> = ({ remito, onGeneratePDF, onRegisterPayment, onEdit, onDelete, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNextProductionStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentStatus = remito.productionStatus || 'Entregada';
    let nextStatus: Remito['productionStatus'] = 'Entregada';
    
    if (currentStatus === 'En Producción') {
      nextStatus = 'Para entregar';
    } else if (currentStatus === 'Para entregar') {
      nextStatus = 'Entregada';
    } else {
      return;
    }
    
    const newHistory = [...(remito.productionHistory || []), { status: nextStatus, date: new Date().toISOString() }];
    
    onUpdate({
      ...remito,
      productionStatus: nextStatus,
      productionHistory: newHistory
    });
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:border-orange-100 transition-all">
      <div className="p-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Number & Date */}
        <div className="col-span-2">
          <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-widest block w-fit mb-1">
            {remito.number}
          </span>
          <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 whitespace-nowrap">
            <Calendar size={10} /> {new Date(remito.date).toLocaleDateString('es-AR')}
          </p>
        </div>

        {/* Customer */}
        <div className="col-span-3">
          <h3 className="font-black text-slate-900 uppercase text-sm leading-tight truncate" title={remito.customerName}>
            {remito.customerName}
          </h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{remito.items.length} ítems</p>
        </div>

        {/* Status */}
        <div className="col-span-2 md:text-center flex flex-col md:items-center gap-1">
          {remito.isDraft ? (
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block bg-slate-100 text-slate-600 border border-slate-200">
              Borrador
            </span>
          ) : (
            <>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${
                remito.status === 'Pagado' ? 'bg-green-100 text-green-700' :
                remito.status === 'Parcial' ? 'bg-blue-100 text-blue-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {remito.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${
                (remito.productionStatus || 'Entregada') === 'En Producción' ? 'bg-purple-100 text-purple-700' :
                (remito.productionStatus || 'Entregada') === 'Para entregar' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-800 text-white'
              }`}>
                {remito.productionStatus || 'Entregada'}
              </span>
            </>
          )}
        </div>

        {/* Total */}
        <div className="col-span-2 text-left md:text-right flex flex-col md:items-end">
          <span className="text-lg font-black text-slate-900 tracking-tighter">
            $ {remito.total.toLocaleString('es-AR')}
          </span>
          {remito.status === 'Parcial' && (
            <span className="text-[10px] font-black text-red-600 tracking-widest uppercase">
              Pendiente: ${(remito.total - remito.amountPaid).toLocaleString('es-AR')}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-3 flex justify-end items-center gap-1.5">
          {(remito.productionStatus === 'En Producción' || remito.productionStatus === 'Para entregar') && (
            <button 
              onClick={handleNextProductionStatus}
              className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-200 hover:border-slate-300 text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-1"
              title={remito.productionStatus === 'En Producción' ? 'Pasar a Para Entregar' : 'Pasar a Entregada'}
            >
              <ChevronRight size={14} />
              {remito.productionStatus === 'En Producción' ? 'Para Entregar' : 'Entregada'}
            </button>
          )}

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'}`}
            title="Ver detalle"
          >
            <List size={16} />
          </button>
          {!remito.isDraft && (
            <>
              <button 
                onClick={() => onGeneratePDF(remito)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                title="Descargar Remito"
              >
                <Download size={16} />
              </button>
              <button 
                onClick={() => onRegisterPayment(remito)}
                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                title="Registrar Pago"
              >
                <DollarSign size={16} />
              </button>
            </>
          )}
          <button 
            onClick={() => onEdit(remito)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            title="Editar Venta"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => onDelete(remito.id)}
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
            {remito.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 items-center">
                <div className="col-span-7 text-[10px] font-bold text-slate-700 uppercase">{item.description}</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 text-center">x{item.quantity}</div>
                <div className="col-span-3 text-[10px] font-black text-slate-900 text-right">${item.total.toLocaleString()}</div>
              </div>
            ))}
            {(remito.notes || remito.paymentHistory?.length > 0 || remito.productionHistory?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {remito.notes && (
                  <div className="p-3 bg-white rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 font-black">Observaciones:</p>
                    <p className="text-[10px] text-slate-600 italic">"{remito.notes}"</p>
                  </div>
                )}
                {remito.paymentHistory && remito.paymentHistory.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 font-black">Historial de Pagos:</p>
                    <div className="space-y-1">
                      {remito.paymentHistory.map((p, i) => (
                        <div key={i} className="flex justify-between items-center text-[9px] text-slate-500 font-bold">
                          <span>{new Date(p.date).toLocaleDateString()}</span>
                          <span className="text-green-600">$ {p.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {remito.productionHistory && remito.productionHistory.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 font-black">Historial de Producción:</p>
                    <div className="space-y-1">
                      {remito.productionHistory.map((h, i) => (
                        <div key={i} className="flex justify-between items-center text-[9px] text-slate-500 font-bold">
                          <span>{new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span className="text-purple-600">{h.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RemitosManager;
