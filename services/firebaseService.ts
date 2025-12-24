
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, writeBatch } from 'firebase/firestore';
import { StockItem, Order } from '../types';
import { INITIAL_STOCK, INITIAL_ORDERS } from '../constants';

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
      // Si la base está vacía por primera vez (recién creada), la inicializamos con los datos por defecto
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

export const updateStockItemInDb = async (item: StockItem) => {
  const docRef = doc(db, 'stock', item.id);
  await setDoc(docRef, item, { merge: true });
};

export const addOrderToDb = async (order: Order) => {
  const docRef = doc(db, 'orders', order.id);
  await setDoc(docRef, order);
};

const initializeDatabase = async () => {
  console.log("Inicializando base de datos por primera vez...");
  const batch = writeBatch(db);
  INITIAL_STOCK.forEach(item => {
    const ref = doc(db, 'stock', item.id);
    batch.set(ref, item);
  });
  INITIAL_ORDERS.forEach(order => {
    const ref = doc(db, 'orders', order.id);
    batch.set(ref, order);
  });
  await batch.commit();
};

export { db };
