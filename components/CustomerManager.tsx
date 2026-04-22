
import React, { useState } from 'react';
import { Customer } from '../types';
import { UserPlus, Search, Edit2, Trash2, Save, X, Phone, Mail, MapPin, Hash, Instagram, FileText, User, MessageCircle, ExternalLink } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  onUpdate: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cuit.includes(searchTerm)
  );

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData(customer);
    setIsAdding(false);
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
            <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Nuevo Registro de Cliente</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group relative">
            {editingId === customer.id ? (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center p-4">
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black"
                >
                  Editando... (Ver Formulario Arriba)
                </button>
              </div>
            ) : null}
            
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 uppercase text-sm leading-tight">{customer.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <User size={10} /> {customer.contactName || 'Sin contacto'}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(customer)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => {if(confirm('¿Eliminar cliente?')) onDelete(customer.id)}} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="space-y-3">
              {customer.phone && (
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone size={14} className="text-slate-300" />
                    <span className="text-xs font-medium">{customer.phone}</span>
                  </div>
                  <a 
                    href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-1.5 text-green-600 bg-green-50 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-green-100"
                    title="WhatsApp"
                  >
                    <MessageCircle size={12} />
                  </a>
                </div>
              )}
              
              {customer.email && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail size={14} className="text-slate-300" />
                  <span className="text-xs font-medium truncate">{customer.email}</span>
                </div>
              )}

              {customer.street && (
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin size={14} className="text-slate-300" />
                    <span className="text-xs font-medium truncate">
                      {customer.street} {customer.number}{customer.city ? `, ${customer.city}` : ''}
                    </span>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${customer.street} ${customer.number}, ${customer.city || ''}`)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-1.5 text-blue-600 bg-blue-50 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-blue-100"
                    title="Ver en Google Maps"
                  >
                    <MapPin size={12} />
                  </a>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-50 flex flex-wrap gap-2 items-center">
              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-slate-50 text-slate-400 rounded-md">
                {customer.taxCondition}
              </span>
              {customer.cuit && (
                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-slate-50 text-slate-400 rounded-md flex items-center gap-1">
                  <Hash size={8} /> {customer.cuit}
                </span>
              )}
              {customer.instagram && (
                <a 
                  href={`https://instagram.com/${customer.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-blue-50 text-blue-600 rounded-md flex items-center gap-1 hover:bg-blue-100 transition-colors"
                >
                  <Instagram size={8} /> {customer.instagram}
                  <ExternalLink size={8} />
                </a>
              )}
            </div>
            
            {customer.notes && (
              <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                <p className="text-[9px] text-slate-400 font-medium italic line-clamp-2">
                  <FileText size={8} className="inline mr-1" /> "{customer.notes}"
                </p>
              </div>
            )}
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
            <Search size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No se encontraron clientes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManager;
