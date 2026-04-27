
import React, { useState, useEffect } from 'react';
import { Customer, Quote, Remito } from '../types';
import { UserPlus, Search, Edit2, Trash2, Save, X, Phone, Mail, MapPin, Hash, Instagram, FileText, User, MessageCircle, ExternalLink, Package } from 'lucide-react';
import { jsPDF } from 'jspdf';
import ConfirmDialog from './ConfirmDialog';
import Pagination from './Pagination';

interface CustomerManagerProps {
  customers: Customer[];
  quotes: Quote[];
  remitos: Remito[];
  onUpdate: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onViewRemitos: (id: string) => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, quotes, remitos, onUpdate, onDelete, onViewRemitos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cuit.includes(searchTerm)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      street: '',
      number: '',
      city: 'Bariloche',
      contactName: '',
      phone: '',
      email: '',
      instagram: '',
      cuit: '',
      taxCondition: 'Consumidor Final',
      notes: '',
      history: [],
      ...customer
    });
    setIsAdding(true);
  };

  const handleAddNew = () => {
    setEditingId('new');
    setFormData({
      id: crypto.randomUUID(),
      name: '',
      contactName: '',
      phone: '',
      email: '',
      street: '',
      number: '',
      city: 'Bariloche',
      cuit: '',
      taxCondition: 'Consumidor Final',
      instagram: '',
      notes: '',
      createdAt: new Date().toISOString()
    });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert('El nombre es obligatorio');
    onUpdate(formData as Customer);
    setEditingId(null);
    setIsAdding(false);
  };

  const generateShippingLabel = (customer: Customer) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const titleSize = 22;
    const contentSize = 14;
    const margin = 20;

    // --- REMITENTE ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(titleSize);
    doc.text('REMITENTE', margin, 35);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(contentSize);
    doc.text('SINAPSIS 3D', margin, 48);
    doc.text('Maria de los Angeles Crespo', margin, 58);
    doc.text('2944914816', margin, 68);
    doc.text('Bariloche - Rio Negro', margin, 78);

    // Spacing to move to middle area
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.line(margin, 95, 190, 95);

    // --- DESTINATARIO ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(titleSize);
    doc.text('DESTINATARIO', margin, 115);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(contentSize);
    doc.text(customer.name.toUpperCase(), margin, 128);
    doc.text(`ATENCIÓN: ${customer.contactName || '---'}`, margin, 138);
    doc.text(`TELÉFONO: ${customer.phone || '---'}`, margin, 148);
    doc.text(`DIRECCIÓN: ${customer.street} ${customer.number}`, margin, 158);
    doc.text(`LOCALIDAD: ${customer.city.toUpperCase()}`, margin, 168);
    
    doc.save(`Etiqueta_${customer.name.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-600/20">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Directorio de Clientes</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestión de contactos y facturación</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <UserPlus size={16} /> Nuevo Cliente
          </button>
        </div>
      </div>

      {(editingId === 'new' || isAdding) && (
        <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-100 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">
              {editingId === 'new' ? 'Nuevo Registro de Cliente' : 'Editar Cliente'}
            </h3>
            <button onClick={() => {setEditingId(null); setIsAdding(false);}} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Razón Social / Cliente</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
                placeholder="Ej: Librería Central"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Persona de Contacto</label>
              <input 
                type="text" 
                value={formData.contactName} 
                onChange={e => setFormData({...formData, contactName: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">CUIT / CUIL</label>
              <input 
                type="text" 
                value={formData.cuit} 
                onChange={e => setFormData({...formData, cuit: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
                placeholder="20-XXXXXXXX-X"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Teléfono</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
                placeholder="+54 9 294..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
                placeholder="contacto@ejemplo.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Instagram (@)</label>
              <input 
                type="text" 
                value={formData.instagram} 
                onChange={e => setFormData({...formData, instagram: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
                placeholder="@usuario"
              />
            </div>
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Calle</label>
              <input 
                type="text" 
                value={formData.street} 
                onChange={e => setFormData({...formData, street: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
                placeholder="Ej: Mitre"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Número</label>
              <input 
                type="text" 
                value={formData.number} 
                onChange={e => setFormData({...formData, number: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
                placeholder="Ej: 123"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ciudad</label>
              <input 
                type="text" 
                value={formData.city} 
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
                placeholder="Ej: Bariloche"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Condición Fiscal</label>
              <select 
                value={formData.taxCondition}
                onChange={e => setFormData({...formData, taxCondition: e.target.value as any})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              >
                <option value="Consumidor Final">Consumidor Final</option>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributista">Monotributista</option>
                <option value="Exento">Exento</option>
              </select>
            </div>
            <div className="space-y-1.5 lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notas / Preferencias</label>
              <textarea 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 min-h-[80px]"
                placeholder="Detalles sobre entregas, colores preferidos, etc."
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
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              <Save size={16} /> Guardar Cliente
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {paginatedCustomers.map(customer => (
          <div key={customer.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all group relative flex flex-col md:flex-row md:items-center gap-4 justify-between">
            {editingId === customer.id ? (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center p-4 rounded-2xl">
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black"
                >
                  Editando... (Ver Formulario Arriba)
                </button>
              </div>
            ) : null}
            
            <div className="flex flex-col min-w-[200px]">
              <h3 className="font-black text-slate-900 uppercase text-sm leading-tight">{customer.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                <User size={10} /> {customer.contactName || 'Sin contacto'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 flex-1">
              {customer.phone && (
                <a 
                  href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors group/phone"
                  title="Enviar WhatsApp"
                >
                  <MessageCircle size={14} className="text-slate-300 group-hover/phone:text-green-500" />
                  <span className="text-xs font-medium">{customer.phone}</span>
                </a>
              )}
              
              {customer.email && (
                <a 
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group/mail"
                >
                  <Mail size={14} className="text-slate-300 group-hover/mail:text-blue-500" />
                  <span className="text-xs font-medium truncate max-w-[150px]">{customer.email}</span>
                </a>
              )}

              {customer.street && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${customer.street} ${customer.number}, ${customer.city || ''}`)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group/map truncate max-w-[200px]"
                  title="Ver en Google Maps"
                >
                  <MapPin size={14} className="text-slate-300 group-hover/map:text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {customer.street} {customer.number} {customer.city && `(${customer.city})`}
                  </span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="flex space-x-2 mr-4">
                <button 
                  onClick={() => onViewRemitos(customer.id)}
                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Ver Ventas"
                >
                  <FileText size={16} />
                </button>
                <button 
                  onClick={() => generateShippingLabel(customer)}
                  className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                  title="Etiqueta Envío"
                >
                  <Package size={16} />
                </button>
                {customer.instagram && (
                  <a 
                    href={`https://instagram.com/${customer.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                    title={`Instagram: ${customer.instagram}`}
                  >
                    <Instagram size={16} />
                  </a>
                )}
              </div>
              
              <div className="flex gap-1 border-l border-slate-100 pl-4">
                <button onClick={() => handleEdit(customer)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit2 size={16} /></button>
                <button 
                  onClick={() => {
                    const hasQuotes = quotes.some(q => q.customerId === customer.id);
                    const hasRemitos = remitos.some(r => r.customerId === customer.id);
                    if (hasQuotes || hasRemitos) {
                      setAlertMessage(`No se puede eliminar el cliente "${customer.name}" porque tiene ventas o presupuestos asociados.`);
                    } else {
                      setDeleteConfirmId(customer.id);
                    }
                  }} 
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" 
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {customer.notes && (
              <div className="absolute -bottom-8 left-0 right-0 hidden group-hover:block z-20">
                <div className="bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl mx-4">
                  <span className="font-bold">Notas:</span> {customer.notes}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredCustomers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={filteredCustomers.length}
          />
        )}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
            <Search size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No se encontraron clientes</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="¿Eliminar cliente?"
        message="Esta acción no se puede deshacer. Los datos del cliente se perderán."
        onConfirm={() => {
          if (deleteConfirmId) {
            onDelete(deleteConfirmId);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <ConfirmDialog
        isOpen={alertMessage !== null}
        title="Acción no permitida"
        message={alertMessage || ''}
        isAlert={true}
        onConfirm={() => setAlertMessage(null)}
        onCancel={() => setAlertMessage(null)}
      />
    </div>
  );
};

export default CustomerManager;
