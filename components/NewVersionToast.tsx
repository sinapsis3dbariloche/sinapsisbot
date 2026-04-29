import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseService';

export const NewVersionToast: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // __BUILD_TIME__ is injected by Vite config
    const currentVersion = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev';
    
    if (currentVersion === 'dev') return;

    const versionRef = doc(db, 'config', 'version');
    
    const unsubscribe = onSnapshot(versionRef, (snapshot) => {
      const data = snapshot.data();
      
      if (!data) {
        // Inicializar el documento si no existe, solo si estamos en un build real
        if (currentVersion !== 'dev') {
          setDoc(versionRef, { buildTime: currentVersion }, { merge: true });
        }
        return;
      }

      const dbVersion = data.buildTime;
      const currentInt = parseInt(currentVersion, 10);
      const dbInt = parseInt(dbVersion, 10);

      // Si el cliente tiene una versión más nueva que la BD, actualizamos la BD
      if (currentInt > dbInt) {
        setDoc(versionRef, { buildTime: currentVersion }, { merge: true });
      } 
      // Si el cliente es más viejo que la BD, le mostramos el aviso para refrescar
      else if (currentInt < dbInt) {
        setShow(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-[9999]">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center w-[calc(100vw-3rem)] sm:w-auto max-w-sm"
        >
          <div className="bg-orange-600/20 p-3 rounded-xl shrink-0 border border-orange-500/20">
            <RefreshCw className="text-orange-500 animate-spin-slow" size={24} />
          </div>
          
          <div className="flex-1 pr-6 relative w-full">
            <h3 className="text-white font-black uppercase tracking-widest text-xs mb-1">
              Nueva versión
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed pr-2">
              Se ha detectado una nueva actualización. Por favor recarga para aplicarla.
            </p>
            <button 
              onClick={() => setShow(false)}
              className="absolute top-0 right-0 p-1 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-[10px] py-2.5 rounded-xl transition-all shadow-lg shadow-orange-600/20"
            >
              Recargar página
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
