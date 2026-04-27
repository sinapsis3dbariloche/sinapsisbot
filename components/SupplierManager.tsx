
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
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
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
      <div className="flex flex-col gap-3">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all group relative flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex flex-col min-w-[200px]">
              <h3 className="font-black text-slate-900 uppercase text-sm leading-tight">{supplier.name}</h3>
              {supplier.contactName && (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                  <Edit2 size={10} /> {supplier.contactName}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 flex-1">
              {supplier.phone && (
                <a 
                  href={`https://wa.me/${supplier.phone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors group/phone"
                  title="Enviar WhatsApp"
                >
                  <MessageCircle size={14} className="text-slate-300 group-hover/phone:text-green-500" />
                  <span className="text-xs font-medium">{supplier.phone}</span>
                </a>
              )}
              
              {supplier.email && (
                <a 
                  href={`mailto:${supplier.email}`}
                  className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors group/mail"
                >
                  <Mail size={14} className="text-slate-300 group-hover/mail:text-purple-500" />
                  <span className="text-xs font-medium truncate max-w-[150px]">{supplier.email}</span>
                </a>
              )}

              {supplier.street && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${supplier.street} ${supplier.number}, ${supplier.city || ''}`)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors group/map truncate max-w-[200px]"
                  title="Ver en Google Maps"
                >
                  <MapPin size={14} className="text-slate-300 group-hover/map:text-purple-500 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {supplier.street} {supplier.number} {supplier.city && `(${supplier.city})`}
                  </span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="flex space-x-2 mr-4">
                {supplier.web && (
                  <a 
                    href={formatUrl(supplier.web)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                    title={`Web: ${formatUrl(supplier.web)}`}
                  >
                    <Globe size={16} />
                  </a>
                )}
                {supplier.instagram && (
                  <a 
                    href={`https://instagram.com/${supplier.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                    title={`Instagram: ${supplier.instagram}`}
                  >
                    <Instagram size={16} />
                  </a>
                )}
              </div>
              
              <div className="flex gap-1 border-l border-slate-100 pl-4">
                <button onClick={() => handleEdit(supplier)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Editar"><Edit2 size={16} /></button>
                <button onClick={() => setItemToDelete(supplier.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={16} /></button>
              </div>
            </div>
            
            {supplier.notes && (
              <div className="absolute -bottom-8 left-0 right-0 hidden group-hover:block z-20">
                <div className="bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl mx-4">
                  <span className="font-bold">Notas:</span> {supplier.notes}
                </div>
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

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">¿Eliminar proveedor?</h3>
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

export default SupplierManager;
