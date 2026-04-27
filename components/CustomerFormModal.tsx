import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { X, Save } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer?: Customer | null;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer
}) => {
  const [formData, setFormData] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    } else {
      setFormData({
        name: '',
        contactName: '',
        cuit: '',
        phone: '',
        email: '',
        street: '',
        number: '',
        city: 'Bariloche',
        taxCondition: 'Consumidor Final',
        instagram: '',
        notes: '',
        createdAt: new Date().toISOString()
      });
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.name) return alert('El nombre es obligatorio');
    
    const customerToSave: Customer = {
      ...formData,
      id: customer?.id || `C${Date.now()}`,
      history: customer?.history || [],
      createdAt: customer?.createdAt || new Date().toISOString()
    } as Customer;

    onSave(customerToSave);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-100 shadow-xl space-y-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">
            {!customer ? 'Nuevo Registro de Cliente' : 'Editar Cliente'}
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Razón Social / Cliente</label>
            <input 
              type="text" 
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              placeholder="Ej: Librería Central"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Persona de Contacto</label>
            <input 
              type="text" 
              value={formData.contactName || ''} 
              onChange={e => setFormData({...formData, contactName: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">CUIT / CUIL</label>
            <input 
              type="text" 
              value={formData.cuit || ''} 
              onChange={e => setFormData({...formData, cuit: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              placeholder="20-XXXXXXXX-X"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Teléfono</label>
            <input 
              type="text" 
              value={formData.phone || ''} 
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              placeholder="+54 9 294..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email</label>
            <input 
              type="email" 
              value={formData.email || ''} 
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              placeholder="contacto@ejemplo.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Instagram (@)</label>
            <input 
              type="text" 
              value={formData.instagram || ''} 
              onChange={e => setFormData({...formData, instagram: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              placeholder="@usuario"
            />
          </div>
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Calle</label>
            <input 
              type="text" 
              value={formData.street || ''} 
              onChange={e => setFormData({...formData, street: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              placeholder="Ej: Mitre"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Número</label>
            <input 
              type="text" 
              value={formData.number || ''} 
              onChange={e => setFormData({...formData, number: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              placeholder="Ej: 123"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ciudad</label>
            <input 
              type="text" 
              value={formData.city || ''} 
              onChange={e => setFormData({...formData, city: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              placeholder="Ej: Bariloche"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Condición Fiscal</label>
            <select
              value={formData.taxCondition || 'Consumidor Final'}
              onChange={e => setFormData({...formData, taxCondition: e.target.value as any})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
            >
              <option value="Responsable Inscripto">Responsable Inscripto</option>
              <option value="Monotributo">Monotributo</option>
              <option value="Exento">Exento</option>
              <option value="Consumidor Final">Consumidor Final</option>
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notas / Observaciones</label>
            <textarea 
              value={formData.notes || ''} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 resize-none h-12"
              placeholder="Información adicional relevante..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormModal;
