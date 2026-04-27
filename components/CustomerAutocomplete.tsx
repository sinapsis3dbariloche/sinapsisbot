import React, { useState, useEffect, useRef } from 'react';
import { Customer } from '../types';
import { Search, X } from 'lucide-react';

interface CustomerAutocompleteProps {
  customers: Customer[];
  value: string;
  onChange: (customerId: string) => void;
  placeholder?: string;
  className?: string;
}

const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  customers,
  value,
  onChange,
  placeholder = "Buscar cliente...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = customers.find(c => c.id === value);

  useEffect(() => {
    if (selectedCustomer) {
      setSearchTerm(selectedCustomer.name);
    } else {
      setSearchTerm('');
    }
  }, [value, selectedCustomer]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedCustomer) {
          setSearchTerm(selectedCustomer.name);
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCustomer]);

  const filteredCustomers = searchTerm.length >= 2 
    ? customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleSelect = (customerId: string) => {
    onChange(customerId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value && e.target.value !== selectedCustomer?.name) {
              onChange('');
            }
          }}
          onFocus={() => {
            if (searchTerm.length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900 pr-10 ${className}`}
        />
        {value ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        ) : (
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
        )}
      </div>

      {isOpen && searchTerm.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-100 shadow-xl max-h-60 overflow-y-auto">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleSelect(customer.id)}
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
              >
                <div className="font-bold text-sm text-slate-900 uppercase">
                  {customer.name}
                </div>
                {(customer.cuit || customer.phone) && (
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {customer.cuit && <span>CUIT: {customer.cuit}</span>}
                    {customer.cuit && customer.phone && <span className="mx-2">•</span>}
                    {customer.phone && <span>Tel: {customer.phone}</span>}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No se encontraron clientes
              </span>
            </div>
          )}
        </div>
      )}
      
      {isOpen && searchTerm.length > 0 && searchTerm.length < 2 && (
         <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-100 shadow-xl p-4 text-center">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             Escribí al menos 2 letras...
           </span>
         </div>
      )}
    </div>
  );
};

export default CustomerAutocomplete;
