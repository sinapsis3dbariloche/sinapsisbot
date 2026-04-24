import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, ShieldAlert, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const { login, user, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 md:p-12 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-600/20 rotate-3">
            <Cpu className="text-white" size={40} />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white leading-tight tracking-tighter uppercase italic">
              SINAPSIS 3D
            </h1>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] opacity-80">
              SISTEMA DE GESTIÓN OPERATIVA
            </p>
          </div>

          <div className="w-full pt-8">
            {user && !isAdmin ? (
              <div className="space-y-6">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-left">
                  <ShieldAlert className="text-red-500 shrink-0" size={20} />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-red-500 uppercase tracking-widest">Acceso Denegado</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Tu cuenta ({user.email}) no tiene permisos para acceder a este sistema. Contacta con el administrador.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-700 transition-all border border-white/5"
                >
                  Cerrar Sesión e Intentar con otra cuenta
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="group w-full flex items-center justify-center gap-4 py-5 bg-white text-slate-950 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-orange-600 hover:text-white transition-all shadow-xl hover:shadow-orange-600/30 active:scale-95"
              >
                <LogIn size={18} />
                Ingresar con Google
              </button>
            )}
          </div>

          <div className="pt-10">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Sinapsis 3D Bariloche
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
