
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import StockBoard from './components/StockBoard';
import StockManager from './components/StockManager';
import MaintenanceBoard from './components/MaintenanceBoard';
import PrinterManager from './components/PrinterManager';
import BudgetCalculator from './components/BudgetCalculator';
import CustomerManager from './components/CustomerManager';
import RemitosManager from './components/RemitosManager';
import SupplierManager from './components/SupplierManager';
import ExpenseManager from './components/ExpenseManager';
import Dashboard from './components/Dashboard';
import { StockItem, Printer, Customer, Remito, Supplier, Expense } from './types';
import { 
  subscribeToStock, 
  subscribeToSettings, 
  subscribeToPrinters,
  subscribeToCustomers,
  subscribeToSuppliers,
  subscribeToExpenses,
  subscribeToRemitos,
  updateStockItemInDb, 
  updateSettings, 
  resetAllStockInDb, 
  deleteStockItemFromDb,
  updatePrinterInDb,
  deletePrinterFromDb,
  updateCustomerInDb,
  deleteCustomerFromDb,
  updateSupplierInDb,
  deleteSupplierFromDb,
  updateExpenseInDb,
  deleteExpenseFromDb,
  updateRemitoInDb,
  deleteRemitoFromDb,
  getNextRemitoNumber,
  initializeDatabase
} from './services/firebaseService';
import { DEFAULT_PLA_PRICE, DEFAULT_PETG_PRICE, DEFAULT_DESIGN_PRICE, DEFAULT_POST_PROCESS_PRICE } from './constants';
import { Loader2, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';

import { useAuth } from './lib/AuthContext';
import Login from './components/Login';
import { testFirestoreConnection } from './lib/firebase';

const App: React.FC = () => {
  const { user, loading, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [remitoFilterCustomerId, setRemitoFilterCustomerId] = useState<string | null>(null);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [remitos, setRemitos] = useState<Remito[]>([]);
  const [plaPrice, setPlaPrice] = useState<number>(DEFAULT_PLA_PRICE);
  const [petgPrice, setPetgPrice] = useState<number>(DEFAULT_PETG_PRICE);
  const [designPrice, setDesignPrice] = useState<number>(DEFAULT_DESIGN_PRICE);
  const [postProcessPrice, setPostProcessPrice] = useState<number>(DEFAULT_POST_PROCESS_PRICE);
  const [hotendStock, setHotendStock] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) return;

    setHasPermissionError(false);
    // Verify connection once authenticated
    testFirestoreConnection();
    
    // Run initialization once per admin session if needed
    initializeDatabase().catch(err => {
      // Ignore permission-denied during auth transition
      if (err instanceof Error && err.message.includes('permission-denied')) {
        setHasPermissionError(true);
      } else if (err instanceof Error) {
        console.error("Auto-init failed:", err);
      }
    });

    const handleError = (err: any) => {
      if (err?.code === 'permission-denied' || (err instanceof Error && err.message.includes('permission-denied'))) {
        setHasPermissionError(true);
      }
      setIsLoadingData(false);
    };

    const timer = setTimeout(() => {
      if (isLoadingData) {
        console.warn("Data sync timed out, forcing load state to false");
        setIsLoadingData(false);
      }
    }, 8000); // 8 seconds timeout

    const unsubStock = subscribeToStock((newStock) => {
      setStock(newStock);
      setIsLoadingData(false);
      clearTimeout(timer);
      setIsSynced(true);
      setTimeout(() => setIsSynced(false), 2000);
    }, (err) => {
      clearTimeout(timer);
      handleError(err);
    });

    const unsubPrinters = subscribeToPrinters((newPrinters) => {
      setPrinters(newPrinters);
    }, handleError);

    const unsubCustomers = subscribeToCustomers((newCustomers) => {
      setCustomers(newCustomers);
    }, handleError);

    const unsubSuppliers = subscribeToSuppliers((newSuppliers) => {
      setSuppliers(newSuppliers);
    }, handleError);

    const unsubExpenses = subscribeToExpenses((newExpenses) => {
      setExpenses(newExpenses);
    }, handleError);

    const unsubRemitos = subscribeToRemitos((newRemitos) => {
      setRemitos(newRemitos);
    }, handleError);

    const unsubSettings = subscribeToSettings((settings) => {
      if (settings?.plaPrice) setPlaPrice(settings.plaPrice);
      if (settings?.petgPrice) setPetgPrice(settings.petgPrice);
      if (settings?.designPrice) setDesignPrice(settings.designPrice);
      if (settings?.postProcessPrice) setPostProcessPrice(settings.postProcessPrice);
      if (settings?.hotendStock !== undefined) setHotendStock(settings.hotendStock);
    }, handleError);

    return () => {
      unsubStock();
      unsubPrinters();
      unsubCustomers();
      unsubSuppliers();
      unsubExpenses();
      unsubRemitos();
      unsubSettings();
    };
  }, [user, isAdmin]);

  const handleUpdateStockItem = async (id: string, updates: Partial<StockItem>) => {
    const item = stock.find(s => s.id === id);
    if (item) {
      await updateStockItemInDb({ ...item, ...updates });
    }
  };

  const handleAddStockItem = async (item: StockItem) => {
    await updateStockItemInDb(item);
  };

  const handleDeleteStockItem = async (id: string) => {
    await deleteStockItemFromDb(id);
  };

  const handleUpdatePrinter = async (printer: Printer) => {
    await updatePrinterInDb(printer);
  };

  const handleAddPrinter = async (printer: Printer) => {
    await updatePrinterInDb(printer);
  };

  const handleDeletePrinter = async (id: string) => {
    await deletePrinterFromDb(id);
  };

  const handleUpdateCustomer = async (customer: Customer) => {
    await updateCustomerInDb(customer);
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomerFromDb(id);
  };

  const handleUpdateSupplier = async (supplier: Supplier) => {
    await updateSupplierInDb(supplier);
  };

  const handleDeleteSupplier = async (id: string) => {
    await deleteSupplierFromDb(id);
  };

  const handleUpdateExpense = async (expense: Expense) => {
    await updateExpenseInDb(expense);
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpenseFromDb(id);
  };

  const handleUpdateRemito = async (remito: Remito) => {
    await updateRemitoInDb(remito);
  };

  const handleDeleteRemito = async (id: string) => {
    await deleteRemitoFromDb(id);
  };

  const handleUpdateHotendStock = async (newStock: number) => {
    await updateSettings({ hotendStock: Math.max(0, newStock) });
  };

  const handleResetAllStock = async () => {
    if (window.confirm('⚠️ ¿Estás seguro? Esta acción pondrá TODOS los contadores de stock en CERO. Esto es útil para iniciar un control de inventario desde cero.')) {
      await resetAllStockInDb();
      setActiveTab('stock');
      alert('Inventario reiniciado correctamente.');
    }
  };

  const handleUpdatePrices = async (updates: { pla?: number, petg?: number, design?: number, postProcess?: number }) => {
    await updateSettings({ 
      ...(updates.pla && { plaPrice: updates.pla }),
      ...(updates.petg && { petgPrice: updates.petg }),
      ...(updates.design && { designPrice: updates.design }),
      ...(updates.postProcess && { postProcessPrice: updates.postProcess })
    });
  };

  const handleViewRemitosByCustomer = (id: string) => {
    setRemitoFilterCustomerId(id);
    setActiveTab('remitos');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <Loader2 className="animate-spin text-orange-600" size={48} />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Login />;
  }

  if (hasPermissionError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-6 text-center">
        <div className="max-w-md space-y-8">
          <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-600/20">
            <ShieldAlert className="text-white" size={40} />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Fallo de Autenticación en la Nube</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              El servidor de base de datos ha denegado el acceso de lectura/escritura. 
              <br /><br />
              Si estás usando el <strong>ingreso con usuario y contraseña</strong>, asegúrate de que el método <strong>"Anonymous Auth"</strong> esté habilitado en la Consola de Firebase.
            </p>
          </div>
          <button 
            onClick={logout}
            className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-orange-600 hover:text-white transition-all shadow-xl active:scale-95"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-orange-600" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Sincronizando datos...</p>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="relative h-full">
        <div className={`absolute -top-6 right-0 flex items-center gap-1.5 transition-opacity duration-500 ${isSynced ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nube OK</span>
        </div>

        {activeTab === 'dashboard' && <Dashboard remitos={remitos} expenses={expenses} />}
        
        {activeTab === 'stock' && <StockBoard stock={stock} onUpdateStock={handleUpdateStockItem} />}
        
        {activeTab === 'stock-edit' && (
          <StockManager 
            stock={stock} 
            onAdd={handleAddStockItem}
            onUpdate={handleUpdateStockItem}
            onDelete={handleDeleteStockItem}
          />
        )}

        {activeTab === 'stock-reset' && (
          <div className="max-w-2xl mx-auto py-20 px-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-12 text-center space-y-8 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Reiniciar Inventario</h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
                  Esta acción establecerá todos los contadores de filamentos (Cerrados y Abiertos) en <strong>cero</strong>. Úsalo únicamente si vas a realizar un conteo físico completo desde cero.
                </p>
              </div>
              <button 
                onClick={handleResetAllStock}
                className="w-full flex items-center justify-center gap-4 py-6 bg-red-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-600/30 active:scale-95 group"
              >
                <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                Ejecutar Reinicio Maestro
              </button>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">
                Requiere confirmación adicional después de hacer clic.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'maint' && (
          <MaintenanceBoard 
            printers={printers} 
            onUpdatePrinter={handleUpdatePrinter}
            hotendStock={hotendStock}
            onUpdateHotendStock={handleUpdateHotendStock}
          />
        )}

        {activeTab === 'maint-edit' && (
          <PrinterManager 
            printers={printers} 
            onAdd={handleAddPrinter}
            onUpdate={handleUpdatePrinter}
            onDelete={handleDeletePrinter}
          />
        )}

        {activeTab === 'calc' && (
          <BudgetCalculator 
            plaPrice={plaPrice} 
            petgPrice={petgPrice}
            designPrice={designPrice}
            postProcessPrice={postProcessPrice}
            onUpdatePrices={handleUpdatePrices} 
          />
        )}

        {activeTab === 'customers' && (
          <CustomerManager 
            customers={customers}
            onUpdate={handleUpdateCustomer}
            onDelete={handleDeleteCustomer}
            onViewRemitos={handleViewRemitosByCustomer}
          />
        )}

        {activeTab === 'suppliers' && (
          <SupplierManager 
            suppliers={suppliers}
            onUpdate={handleUpdateSupplier}
            onDelete={handleDeleteSupplier}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseManager 
            expenses={expenses}
            suppliers={suppliers}
            onUpdate={handleUpdateExpense}
            onDelete={handleDeleteExpense}
          />
        )}

        {activeTab === 'remitos' && (
          <RemitosManager 
            remitos={remitos}
            customers={customers}
            onUpdate={handleUpdateRemito}
            onDelete={handleDeleteRemito}
            getNextNumber={getNextRemitoNumber}
            initialCustomerId={remitoFilterCustomerId}
          />
        )}
      </div>
    </Layout>
  );
};

export default App;
