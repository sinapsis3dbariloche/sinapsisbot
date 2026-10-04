import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

interface UnsavedChangesContextType {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  confirmIfDirty: (action: () => void, customMessage?: string) => void;
  requestNavigate: (tab: string, filters?: any) => void;
  registerNavigateHandler: (handler: (tab: string, filters?: any) => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export const UnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [dialogMessage, setDialogMessage] = useState<string>('');
  const [navigateHandler, setNavigateHandler] = useState<((tab: string, filters?: any) => void) | null>(null);

  // Browser reload / close prevention
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const confirmIfDirty = useCallback((action: () => void, customMessage?: string) => {
    if (!isDirty) {
      action();
      return;
    }

    setDialogMessage(
      customMessage ||
      'Tenés información cargada en el formulario que aún no fue guardada. Si continuás, se perderán todos los datos ingresados. ¿Deseas volver al formulario para guardar, o descartar todo y avanzar?'
    );
    setPendingAction(() => action);
  }, [isDirty]);

  const registerNavigateHandler = useCallback((handler: (tab: string, filters?: any) => void) => {
    setNavigateHandler(() => handler);
  }, []);

  const requestNavigate = useCallback((tab: string, filters?: any) => {
    confirmIfDirty(() => {
      setIsDirty(false);
      if (navigateHandler) {
        navigateHandler(tab, filters);
      }
    }, 'Tenés datos cargados sin guardar. Si cambias de sección, perderás toda la información ingresada. ¿Deseas descartar los cambios y avanzar?');
  }, [confirmIfDirty, navigateHandler]);

  const handleConfirmDiscard = () => {
    setIsDirty(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action) {
      action();
    }
  };

  const handleCancelDiscard = () => {
    setPendingAction(null);
  };

  return (
    <UnsavedChangesContext.Provider
      value={{
        isDirty,
        setIsDirty,
        confirmIfDirty,
        requestNavigate,
        registerNavigateHandler
      }}
    >
      {children}
      <ConfirmDialog
        isOpen={pendingAction !== null}
        title="Cambios sin guardar"
        message={dialogMessage}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
        confirmStyle="danger"
        confirmText="Descartar y avanzar"
        cancelText="Volver al formulario"
      />
    </UnsavedChangesContext.Provider>
  );
};

export const useUnsavedChanges = () => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChanges must be used within an UnsavedChangesProvider');
  }
  return context;
};
