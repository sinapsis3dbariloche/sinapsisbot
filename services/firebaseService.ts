
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, writeBatch } from 'firebase/firestore';
import { StockItem, Order } from '../types';
import { INITIAL_STOCK, INITIAL_ORDERS, DEFAULT_PLA_PRICE, DEFAULT_PETG_PRICE, DEFAULT_DESIGN_PRICE, DEFAULT_POST_PROCESS_PRICE } from '../constants';

// CONFIGURACIÓN DE FIREBASE - SINAPSIS 3D
const firebaseConfig = {
  apiKey: "AIzaSyDJQTY8MbQ4c7F1pC1kCfwEz1bNk1O_NrY",
  authDomain: "sinapsis3d-cb2ac.firebaseapp.com",
  projectId: "sinapsis3d-cb2ac",
  storageBucket: "sinapsis3d-cb2ac.firebasestorage.app",
  messagingSenderId: "455886449458",
  appId: "1:455886449458:web:e13064302cd37893ee852b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const subscribeToStock = (callback: (stock: StockItem[]) => void) => {
  return onSnapshot(collection(db, 'stock'), (snapshot) => {
    if (snapshot.empty) {
      initializeDatabase();
      return;
    }
    const stock = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
    callback(stock);
  });
};

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  return onSnapshot(collection(db, 'orders'), (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    callback(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });
};

export const subscribeToSettings = (callback: (settings: any) => void) => {
  const settingsRef = doc(db, 'config', 'settings');
  return onSnapshot(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      setDoc(settingsRef, { 
        plaPrice: DEFAULT_PLA_PRICE,
        petgPrice: DEFAULT_PETG_PRICE,
        designPrice: DEFAULT_DESIGN_PRICE,
        postProcessPrice: DEFAULT_POST_PROCESS_PRICE
      });
    }
  });
};

export const updateSettings = async (settings: any) => {
  const docRef = doc(db, 'config', 'settings');
  await setDoc(docRef, settings, { merge: true });
};

export const updateStockItemInDb = async (item: StockItem) => {
  const docRef = doc(db, 'stock', item.id);
  await setDoc(docRef, item, { merge: true });
};

export const addOrderToDb = async (order: Order) => {
  const docRef = doc(db, 'orders', order.id);
  await setDoc(docRef, order);
};

const initializeDatabase = async () => {
  const batch = writeBatch(db);
  INITIAL_STOCK.forEach(item => {
    const ref = doc(db, 'stock', item.id);
    batch.set(ref, item);
  });
  INITIAL_ORDERS.forEach(order => {
    const ref = doc(db, 'orders', order.id);
    batch.set(ref, order);
  });
  const configRef = doc(db, 'config', 'settings');
  batch.set(configRef, { 
    plaPrice: DEFAULT_PLA_PRICE,
    petgPrice: DEFAULT_PETG_PRICE,
    designPrice: DEFAULT_DESIGN_PRICE,
    postProcessPrice: DEFAULT_POST_PROCESS_PRICE
  });
  await batch.commit();
};

export { db };
