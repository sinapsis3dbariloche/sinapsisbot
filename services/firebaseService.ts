
import { collection, onSnapshot, doc, setDoc, writeBatch, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { StockItem, Printer, Customer, Remito, Supplier, Expense } from '../types';
import { INITIAL_STOCK, INITIAL_PRINTERS, INITIAL_CUSTOMERS, INITIAL_REMITOS, DEFAULT_PLA_PRICE, DEFAULT_PETG_PRICE, DEFAULT_DESIGN_PRICE, DEFAULT_POST_PROCESS_PRICE, DEFAULT_HOTEND_STOCK } from '../constants';

export const subscribeToStock = (callback: (stock: StockItem[]) => void) => {
  return onSnapshot(collection(db, 'stock'), {
    next: (snapshot) => {
      const stock = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
      callback(stock);
    },
    error: (error) => handleFirestoreError(error, 'list', 'stock')
  });
};

export const subscribeToPrinters = (callback: (printers: Printer[]) => void) => {
  return onSnapshot(collection(db, 'printers'), {
    next: (snapshot) => {
      if (snapshot.empty) {
        // We let subscribeToStock handle initialization to avoid race conditions
        return;
      }
      const printers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Printer));
      callback(printers);
    },
    error: (error) => handleFirestoreError(error, 'list', 'printers')
  });
};

export const subscribeToCustomers = (callback: (customers: Customer[]) => void) => {
  return onSnapshot(collection(db, 'customers'), {
    next: (snapshot) => {
      if (snapshot.empty) return;
      const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      callback(customers.sort((a, b) => a.name.localeCompare(b.name)));
    },
    error: (error) => handleFirestoreError(error, 'list', 'customers')
  });
};

export const subscribeToSuppliers = (callback: (suppliers: Supplier[]) => void) => {
  return onSnapshot(collection(db, 'suppliers'), {
    next: (snapshot) => {
      const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      callback(suppliers.sort((a, b) => a.name.localeCompare(b.name)));
    },
    error: (error) => handleFirestoreError(error, 'list', 'suppliers')
  });
};

export const subscribeToRemitos = (callback: (remitos: Remito[]) => void) => {
  return onSnapshot(collection(db, 'remitos'), {
    next: (snapshot) => {
      if (snapshot.empty) return;
      const remitos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Remito));
      callback(remitos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    },
    error: (error) => handleFirestoreError(error, 'list', 'remitos')
  });
};

export const subscribeToExpenses = (callback: (expenses: Expense[]) => void) => {
  return onSnapshot(collection(db, 'expenses'), {
    next: (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      callback(expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    },
    error: (error) => handleFirestoreError(error, 'list', 'expenses')
  });
};

export const subscribeToSettings = (callback: (settings: any) => void) => {
  const settingsRef = doc(db, 'config', 'settings');
  return onSnapshot(settingsRef, {
    next: (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      } else {
        setDoc(settingsRef, { 
          plaPrice: DEFAULT_PLA_PRICE,
          petgPrice: DEFAULT_PETG_PRICE,
          designPrice: DEFAULT_DESIGN_PRICE,
          postProcessPrice: DEFAULT_POST_PROCESS_PRICE,
          hotendStock: DEFAULT_HOTEND_STOCK
        });
      }
    },
    error: (error) => handleFirestoreError(error, 'get', 'config/settings')
  });
};

export const updateSettings = async (settings: any) => {
  const docRef = doc(db, 'config', 'settings');
  try {
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'update', 'config/settings');
  }
};

export const updateStockItemInDb = async (item: StockItem) => {
  const docRef = doc(db, 'stock', item.id);
  try {
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'write', `stock/${item.id}`);
  }
};

export const deleteStockItemFromDb = async (id: string) => {
  const docRef = doc(db, 'stock', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, 'delete', `stock/${id}`);
  }
};

export const updatePrinterInDb = async (printer: Printer) => {
  const docRef = doc(db, 'printers', printer.id);
  try {
    await setDoc(docRef, printer, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'write', `printers/${printer.id}`);
  }
};

export const deletePrinterFromDb = async (id: string) => {
  const docRef = doc(db, 'printers', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, 'delete', `printers/${id}`);
  }
};

export const updateCustomerInDb = async (customer: Customer) => {
  const docRef = doc(db, 'customers', customer.id);
  try {
    await setDoc(docRef, customer, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'write', `customers/${customer.id}`);
  }
};

export const deleteCustomerFromDb = async (id: string) => {
  const docRef = doc(db, 'customers', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, 'delete', `customers/${id}`);
  }
};

export const updateSupplierInDb = async (supplier: Supplier) => {
  const docRef = doc(db, 'suppliers', supplier.id);
  try {
    await setDoc(docRef, supplier, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'write', `suppliers/${supplier.id}`);
  }
};

export const deleteSupplierFromDb = async (id: string) => {
  const docRef = doc(db, 'suppliers', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, 'delete', `suppliers/${id}`);
  }
};

export const updateRemitoInDb = async (remito: Remito) => {
  const docRef = doc(db, 'remitos', remito.id);
  try {
    await setDoc(docRef, remito, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'write', `remitos/${remito.id}`);
  }
};

export const deleteRemitoFromDb = async (id: string) => {
  const docRef = doc(db, 'remitos', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, 'delete', `remitos/${id}`);
  }
};

export const updateExpenseInDb = async (expense: Expense) => {
  const docRef = doc(db, 'expenses', expense.id);
  try {
    await setDoc(docRef, expense, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'write', `expenses/${expense.id}`);
  }
};

export const deleteExpenseFromDb = async (id: string) => {
  const docRef = doc(db, 'expenses', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, 'delete', `expenses/${id}`);
  }
};

export const getNextRemitoNumber = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'remitos'));
    if (snapshot.empty) return 46; 
    const numbers = snapshot.docs.map(d => {
      const numPart = d.data().number.split('-')[1]?.trim();
      return parseInt(numPart) || 0;
    });
    return Math.max(...numbers) + 1;
  } catch (error) {
    return handleFirestoreError(error, 'list', 'remitos');
  }
};

export const resetAllStockInDb = async () => {
  try {
    const batch = writeBatch(db);
    const snapshot = await getDocs(collection(db, 'stock'));
    snapshot.docs.forEach(document => {
      const ref = doc(db, 'stock', document.id);
      batch.update(ref, { closedCount: 0, openCount: 0 });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, 'write', 'stock');
  }
};

const initializeDatabase = async () => {
  try {
    console.log('Starting hardware initialization...');
    const batch = writeBatch(db);
    
    // Check which collections are empty before filling them
    const [stockSnap, printersSnap, customersSnap, remitosSnap, settingsSnap] = await Promise.all([
      getDocs(collection(db, 'stock')),
      getDocs(collection(db, 'printers')),
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'remitos')),
      getDoc(doc(db, 'config', 'settings'))
    ]);

    let hasChanges = false;

    // Initialize stock if empty
    if (stockSnap.empty) {
      console.log('Initializing stock...');
      INITIAL_STOCK.forEach(item => {
        batch.set(doc(db, 'stock', item.id), item);
      });
      hasChanges = true;
    }
    
    // Initialize printers if empty
    if (printersSnap.empty) {
      console.log('Initializing printers...');
      INITIAL_PRINTERS.forEach(p => {
        batch.set(doc(db, 'printers', p.id), p);
      });
      hasChanges = true;
    }
    
    // Initialize customers if empty
    if (customersSnap.empty) {
      console.log('Initializing customers...');
      INITIAL_CUSTOMERS.forEach(c => {
        batch.set(doc(db, 'customers', c.id), c);
      });
      hasChanges = true;
    }
    
    // Initialize remitos if empty
    if (remitosSnap.empty) {
      console.log('Initializing remitos...');
      INITIAL_REMITOS.forEach(r => {
        batch.set(doc(db, 'remitos', r.id), r);
      });
      hasChanges = true;
    }
    
    // Initialize settings if empty
    if (!settingsSnap.exists()) {
      console.log('Initializing settings...');
      batch.set(doc(db, 'config', 'settings'), { 
        plaPrice: DEFAULT_PLA_PRICE,
        petgPrice: DEFAULT_PETG_PRICE,
        designPrice: DEFAULT_DESIGN_PRICE,
        postProcessPrice: DEFAULT_POST_PROCESS_PRICE,
        hotendStock: DEFAULT_HOTEND_STOCK
      });
      hasChanges = true;
    }
    
    if (hasChanges) {
      await batch.commit();
      console.log('Database initialized successfully with restore data.');
    }
  } catch (error) {
    console.error('Initialization error:', error);
    handleFirestoreError(error, 'write', 'initialization');
  }
};

// Call initialization immediately
initializeDatabase();

export { db };
