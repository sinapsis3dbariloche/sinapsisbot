
import React, { useState } from 'react';
import { Supplier } from '../types';
import { Search, Edit2, Trash2, Save, X, Phone, Mail, MapPin, Instagram, Globe, MessageCircle, ExternalLink, Briefcase, Plus, FileText } from 'lucide-react';

interface SupplierManagerProps {
  suppliers: Supplier[];
  onUpdate: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierManager: React.FC<SupplierManagerProps> = ({ suppliers, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData({
      street: '',
      number: '',
      city: '',
      contactName: '',
      phone: '',
      email: '',
      instagram: '',
      web: '',
      notes: '',
      ...supplier
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
      instagram: '',
      web: '',
      street: '',
      number: '',
      city: '',
      notes: '',
      createdAt: new Date().toISOString()
    });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert('El nombre del proveedor es obligatorio');
    onUpdate(formData as Supplier);
    setEditingId(null);
    setIsAdding(false);
  };

  const formatUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-3 rounded-2xl text-white shadow-lg shadow-purple-600/20">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Directorio de Proveedores</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestión de insumos y servicios</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <Plus size={16} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(editingId === 'new' || isAdding) && (
        <div className="bg-white p-6 rounded-[2rem] border-2 border-purple-100 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">
              {editingId === 'new' ? 'Nuevo Registro de Proveedor' : 'Editar Proveedor'}
            </h3>
            <button onClick={() => {setEditingId(null); setIsAdding(false);}} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre Proveedor</label>
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-600"
                placeholder="Ej: Insumos 3D S.A."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre Contacto</label>
              <input 
                type="text" 
                value={formData.contactName || ''} 
                onChange={e => setFormData({...formData, contactName: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-600"
                placeholder="Ej: Roberto Gómez"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Teléfono / WhatsApp</label>
              <input 
                type="text" 
                value={formData.phone || ''} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-600"
                placeholder="+54 9 11..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email</label>
              <input 
                type="email" 
                value={formData.email || ''} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-600"
                placeholder="ventas@proveedor.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Instagram (@)</label>
              <input 
                type="text" 
                value={formData.instagram || ''} 
                onChange={e => setFormData({...formData, instagram: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-600"
                placeholder="@usuario"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Web</label>
              <input 
                type="text" 
                value={formData.web || ''} 
                onChange={e => setFormData({...formData, web: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-600"
                placeholder="www.proveedor.com"
              />
            </div>
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Calle</label>
              <input 
                type="text" 
                value={formData.street || ''} 
                onChange={e => setFormData({...formData, street: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-600"
                placeholder="Ej: Mitre"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Número</label>
              <input 
                type="text" 
                value={formData.number || ''} 
                onChange={e => setFormData({...formData, number: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-600"
                placeholder="Ej: 123"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ciudad</label>
              <input 
                type="text" 
                value={formData.city || ''} 
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-600"
                placeholder="Ej: Bariloche"
              />
            </div>
            <div className="space-y-1.5 lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notas / Preferencias</label>
              <textarea 
                value={formData.notes || ''} 
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-600 min-h-[80px]"
                placeholder="Horarios, plazos de entrega, montos mínimos, etc."
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
              className="flex items-center gap-2 bg-purple-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
            >
              <Save size={16} /> Guardar Proveedor
            </button>
          </div>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 uppercase text-sm leading-tight">{supplier.name}</h3>
                {supplier.contactName && (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Edit2 size={10} /> {supplier.contactName}
                  </p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(supplier)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => {if(confirm('¿Eliminar proveedor?')) onDelete(supplier.id)}} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="space-y-3">
              {supplier.phone && (
                <a 
                  href={`https://wa.me/${supplier.phone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 text-slate-600 hover:text-green-600 transition-colors group/phone"
                  title="Enviar WhatsApp"
                >
                  <MessageCircle size={14} className="text-slate-300 group-hover/phone:text-green-500" />
                  <span className="text-xs font-medium">{supplier.phone}</span>
                </a>
              )}
              
              {supplier.email && (
                <a 
                  href={`mailto:${supplier.email}`}
                  className="flex items-center gap-3 text-slate-600 hover:text-purple-600 transition-colors group/mail"
                >
                  <Mail size={14} className="text-slate-300 group-hover/mail:text-purple-500" />
                  <span className="text-xs font-medium truncate">{supplier.email}</span>
                </a>
              )}

              {supplier.street && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${supplier.street} ${supplier.number}, ${supplier.city || ''}`)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-start gap-3 text-slate-600 hover:text-purple-600 transition-colors group/map"
                  title="Ver en Google Maps"
                >
                  <MapPin size={14} className="text-slate-300 mt-0.5 group-hover/map:text-purple-500 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium leading-tight">
                      {supplier.street} {supplier.number}
                    </span>
                    {supplier.city && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 group-hover/map:text-purple-400">
                        {supplier.city}
                      </span>
                    )}
                  </div>
                </a>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-50 flex flex-wrap gap-2 items-center">
              {supplier.web && (
                <a 
                  href={formatUrl(supplier.web)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-purple-50 text-purple-600 rounded-md flex items-center gap-1 hover:bg-purple-100 transition-colors"
                >
                  <Globe size={8} /> Web
                  <ExternalLink size={8} />
                </a>
              )}
              {supplier.instagram && (
                <a 
                  href={`https://instagram.com/${supplier.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-blue-50 text-blue-600 rounded-md flex items-center gap-1 hover:bg-blue-100 transition-colors"
                >
                  <Instagram size={8} /> {supplier.instagram}
                  <ExternalLink size={8} />
                </a>
              )}
            </div>
            
            {supplier.notes && (
              <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                <p className="text-[9px] text-slate-400 font-medium italic line-clamp-2">
                  <FileText size={8} className="inline mr-1" /> "{supplier.notes}"
                </p>
              </div>
            )}
          </div>
        ))}

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
            <Search size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No hay proveedores registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierManager;
