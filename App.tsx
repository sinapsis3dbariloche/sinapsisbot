
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import StockBoard from './components/StockBoard';
import GraphicStockBoard from './components/GraphicStockBoard';
import StockManager from './components/StockManager';
import { StockResetManager } from './components/StockResetManager';
import MaintenanceBoard from './components/MaintenanceBoard';
import PrinterManager from './components/PrinterManager';
import CustomerManager from './components/CustomerManager';
import RemitosManager from './components/RemitosManager';
import QuotesManager from './components/QuotesManager';
import SupplierManager from './components/SupplierManager';
import ExpenseManager from './components/ExpenseManager';
import Dashboard from './components/Dashboard';
import { BalanceManager } from './components/BalanceManager';
import { ErrorBoundary } from './components/ErrorBoundary';
import ChatBot from './components/ChatBot';
import { ChatAssistantDrawer } from './components/ChatAssistantDrawer';
import { Quote, StockItem, Printer, Customer, Remito, Supplier, Expense, BalanceClosing } from './types';
import { 
  subscribeToQuotes,
  updateQuoteInDb,
  deleteQuoteFromDb,
  getNextQuoteNumber,
  subscribeToStock, 
  subscribeToSettings, 
  subscribeToPrinters,
  subscribeToCustomers,
  subscribeToSuppliers,
  subscribeToExpenses,
  subscribeToRemitos,
  subscribeToBalanceClosings,
  saveBalanceClosingInDb,
  deleteBalanceClosingFromDb,
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
import { Loader2, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';

import { useAuth } from './lib/AuthContext';
import Login from './components/Login';
import { testFirestoreConnection } from './lib/firebase';
import { NewVersionToast } from './components/NewVersionToast';
import { useUnsavedChanges } from './lib/UnsavedChangesContext';

const App: React.FC = () => {
  const { user, loading, isAdmin, logout } = useAuth();
  const { requestNavigate, registerNavigateHandler } = useUnsavedChanges();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navKey, setNavKey] = useState(0);
  const [remitoFilterCustomerId, setRemitoFilterCustomerId] = useState<string | null>(null);
  const [quoteFilterStatus, setQuoteFilterStatus] = useState<string>('todos');
  const [remitoFilterStatus, setRemitoFilterStatus] = useState<string>('all');
  const [remitoProductionFilterStatus, setRemitoProductionFilterStatus] = useState<string>('all');
  const [remitoDraftFilter, setRemitoDraftFilter] = useState<string>('all');
  const [expenseIncludeDrafts, setExpenseIncludeDrafts] = useState<boolean>(true);
  const [filterMonth, setFilterMonth] = useState<string | null>(null);

  const handleNavigate = useCallback((tab: string, filters?: any) => {
    setActiveTab(tab);
    setNavKey(prev => prev + 1);
    
    // Reset all filters to default
    setFilterMonth(null);
    setRemitoFilterCustomerId(null);
    setQuoteFilterStatus('todos');
    setRemitoFilterStatus('all');
    setRemitoProductionFilterStatus('all');
    setRemitoDraftFilter('all');
    setExpenseIncludeDrafts(true);

    if (filters) {
      if (filters.quoteStatus) setQuoteFilterStatus(filters.quoteStatus);
      if (filters.remitoStatus) setRemitoFilterStatus(filters.remitoStatus);
      if (filters.remitoProdStatus) setRemitoProductionFilterStatus(filters.remitoProdStatus);
      if (filters.month) setFilterMonth(filters.month);
      if (filters.customerId) setRemitoFilterCustomerId(filters.customerId);
      if (filters.draftFilter) setRemitoDraftFilter(filters.draftFilter);
      if (filters.includeDrafts !== undefined) setExpenseIncludeDrafts(filters.includeDrafts);
    }
  }, []);

  useEffect(() => {
    registerNavigateHandler(handleNavigate);
  }, [handleNavigate, registerNavigateHandler]);

  const [stock, setStock] = useState<StockItem[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [remitos, setRemitos] = useState<Remito[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [balanceClosings, setBalanceClosings] = useState<BalanceClosing[]>([]);
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
      setIsLoadingData(prev => {
        if (prev) {
          console.warn("Data sync timed out, forcing load state to false");
        }
        return false;
      });
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

    const unsubBalances = subscribeToBalanceClosings((newClosings) => {
      setBalanceClosings(newClosings);
    }, handleError);

    const unsubRemitos = subscribeToRemitos((newRemitos) => {
      setRemitos(newRemitos);
    }, handleError);

    const unsubQuotes = subscribeToQuotes((newQuotes) => {
      setQuotes(newQuotes);
    }, handleError);

    const unsubSettings = subscribeToSettings((settings) => {
      if (settings?.hotendStock !== undefined) setHotendStock(settings.hotendStock);
    }, handleError);

    return () => {
      unsubStock();
      unsubPrinters();
      unsubCustomers();
      unsubSuppliers();
      unsubExpenses();
      unsubBalances();
      unsubRemitos();
      unsubQuotes();
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

  const handleUpdateQuote = async (quote: Quote) => {
    await updateQuoteInDb(quote);
  };

  const handleConvertToRemito = async (quote: Quote, senaAmount: number) => {
    const nextNumber = await getNextRemitoNumber();
    const formattedNumber = `0001 - ${nextNumber.toString().padStart(5, '0')}`;
    
    const remito: Remito = {
      id: `R${Date.now()}`,
      number: formattedNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      date: new Date().toISOString().split('T')[0],
      items: quote.items.map(i => ({...i})),
      total: quote.total,
      status: senaAmount >= quote.total ? 'Pagado' : senaAmount > 0 ? 'Parcial' : 'Pendiente',
      productionStatus: 'En Producción',
      amountPaid: senaAmount,
      paymentHistory: senaAmount > 0 ? [{ amount: senaAmount, date: new Date().toISOString().split('T')[0] }] : [],
      createdAt: new Date().toISOString()
    };
    
    await updateRemitoInDb(remito);
    await updateQuoteInDb({ ...quote, status: 'confirmado', convertedRemitoId: remito.id, confirmedAt: new Date().toISOString() });
  };

  const handleDeleteQuote = async (id: string) => {
    await deleteQuoteFromDb(id);
  };

  const handleUpdateHotendStock = async (newStock: number) => {
    await updateSettings({ hotendStock: Math.max(0, newStock) });
  };

  const handleResetStock = async (category: 'all' | '3d' | 'grafica') => {
    await resetAllStockInDb(category);
  };

  const handleViewRemitosByCustomer = (id: string) => {
    requestNavigate('remitos', { customerId: id });
  };

  const handleSaveBalanceClosing = async (closing: BalanceClosing) => {
    await saveBalanceClosingInDb(closing);
  };

  const handleDeleteBalanceClosing = async (id: string) => {
    await deleteBalanceClosingFromDb(id);
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
    <Layout activeTab={activeTab} setActiveTab={requestNavigate}>
      <div className="relative h-full">
        <div className={`absolute -top-6 right-0 flex items-center gap-1.5 transition-opacity duration-500 ${isSynced ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nube OK</span>
        </div>

        {activeTab === 'dashboard' && (
          <Dashboard 
            remitos={remitos} 
            expenses={expenses} 
            quotes={quotes} 
            balanceClosings={balanceClosings}
            onNavigateAction={requestNavigate} 
          />
        )}
        
        {activeTab === 'stock' && <StockBoard stock={stock} onUpdateStock={handleUpdateStockItem} />}
        
        {activeTab === 'stock-grafica' && (
          <GraphicStockBoard 
            stock={stock} 
            onUpdateStock={handleUpdateStockItem}
            onNavigateToCatalog={() => requestNavigate('stock-edit')}
          />
        )}

        {activeTab === 'stock-edit' && (
          <StockManager 
            stock={stock} 
            onAdd={handleAddStockItem}
            onUpdate={handleUpdateStockItem}
            onDelete={handleDeleteStockItem}
          />
        )}

        {activeTab === 'stock-reset' && (
          <StockResetManager 
            stock={stock} 
            onReset={handleResetStock} 
          />
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

        {activeTab === 'quotes' && (
          <QuotesManager 
            key={navKey}
            quotes={quotes}
            customers={customers}
            onUpdate={handleUpdateQuote}
            onDelete={handleDeleteQuote}
            getNextNumber={getNextQuoteNumber}
            onCreateCustomer={handleUpdateCustomer}
            initialStatusFilter={quoteFilterStatus}
            onConvertToRemito={handleConvertToRemito}
            onViewRemito={(remitoId) => {
              const remito = remitos.find(r => r.id === remitoId);
              if (remito) {
                requestNavigate('remitos', { customerId: remito.customerId });
              }
            }}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerManager 
            customers={customers}
            quotes={quotes}
            remitos={remitos}
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
            key={navKey}
            expenses={expenses}
            suppliers={suppliers}
            onUpdate={handleUpdateExpense}
            onDelete={handleDeleteExpense}
            initialFilterMonth={filterMonth}
            initialIncludeDrafts={expenseIncludeDrafts}
          />
        )}

        {activeTab === 'balances' && (
          <ErrorBoundary fallbackTitle="Módulo de Balances" onReset={() => requestNavigate('dashboard')}>
            <BalanceManager 
              remitos={remitos}
              expenses={expenses}
              quotes={quotes}
              balanceClosings={balanceClosings}
              onSaveClosing={handleSaveBalanceClosing}
              onDeleteClosing={handleDeleteBalanceClosing}
              currentUserEmail={user?.email || 'Admin'}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'remitos' && (
          <RemitosManager 
            key={navKey}
            remitos={remitos}
            customers={customers}
            onUpdate={handleUpdateRemito}
            onDelete={handleDeleteRemito}
            getNextNumber={getNextRemitoNumber}
            initialCustomerId={remitoFilterCustomerId}
            initialStatusFilter={remitoFilterStatus}
            initialProductionStatusFilter={remitoProductionFilterStatus}
            initialDraftFilter={remitoDraftFilter}
            initialFilterMonth={filterMonth}
            onCreateCustomer={handleUpdateCustomer}
          />
        )}

        {activeTab === 'assistant' && (
          <ChatBot 
            customers={customers}
            suppliers={suppliers}
            stock={stock}
            remitos={remitos}
            expenses={expenses}
            quotes={quotes}
            userName={user?.displayName || user?.email || 'Lucas'}
            getNextRemitoNumber={getNextRemitoNumber}
            onSaveRemito={handleUpdateRemito}
            onSaveExpense={handleUpdateExpense}
            onNavigate={requestNavigate}
          />
        )}

        {/* Global Floating AI Assistant Accessible from All Sections */}
        {activeTab !== 'assistant' && (
          <ChatAssistantDrawer 
            customers={customers}
            suppliers={suppliers}
            stock={stock}
            remitos={remitos}
            expenses={expenses}
            quotes={quotes}
            userName={user?.displayName || user?.email || 'Lucas'}
            getNextRemitoNumber={getNextRemitoNumber}
            onSaveRemito={handleUpdateRemito}
            onSaveExpense={handleUpdateExpense}
            onNavigate={requestNavigate}
          />
        )}

        <NewVersionToast />
      </div>
    </Layout>
  );
};

export default App;
