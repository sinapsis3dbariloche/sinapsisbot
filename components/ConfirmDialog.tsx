import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmStyle?: 'danger' | 'primary';
  isAlert?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmStyle = 'danger',
  isAlert = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95">
        <div className={`flex items-center gap-3 mb-4 ${confirmStyle === 'danger' ? 'text-red-600' : 'text-blue-600'}`}>
          <AlertCircle size={24} />
          <h3 className="font-black text-lg">{title}</h3>
        </div>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          {!isAlert && (
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button 
            onClick={() => {
              onConfirm();
              if (!isAlert) onCancel();
            }}
            className={`px-4 py-2 rounded-xl text-sm font-black text-white hover:opacity-90 transition-colors ${
              confirmStyle === 'danger' ? 'bg-red-600' : 'bg-blue-600'
            }`}
          >
            {isAlert ? 'Entendido' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
