import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, ShieldAlert, Cpu, Lock, User as UserIcon, Loader2, Eye, EyeOff, Globe, Instagram } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const { login, loginWithPassword, user, isAdmin, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setError(null);
    setIsLoggingIn(true);
    try {
      await loginWithPassword(username, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoggingIn(false);
    }
  };

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
              SINASOFT
            </h1>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] opacity-80">
              Gestión
            </p>
          </div>

          <div className="w-full pt-4">
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
            ) : showPasswordForm ? (
              <motion.form 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handlePasswordLogin} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon size={14} className="text-slate-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-[13px] font-medium tracking-wide focus:outline-none focus:border-orange-600 transition-colors"
                      required
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={14} className="text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-[13px] font-medium tracking-wide focus:outline-none focus:border-orange-600 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-orange-500 transition-colors focus:outline-none"
                      title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-[10px] text-red-500 font-black uppercase tracking-widest text-center">{error}</p>
                )}

                <button 
                  disabled={isLoggingIn}
                  type="submit"
                  className="w-full py-5 bg-orange-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoggingIn ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
                  INGRESAR
                </button>

                <button 
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="text-[9px] text-slate-500 font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Volver al inicio
                </button>
              </motion.form>
            ) : (
              <div className="space-y-4">
                <button 
                  onClick={login}
                  className="group w-full flex items-center justify-center gap-4 py-5 bg-white text-slate-950 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-orange-600 hover:text-white transition-all shadow-xl hover:shadow-orange-600/30 active:scale-95"
                >
                  <LogIn size={18} />
                  Ingresar con Google
                </button>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">O</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button 
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full py-4 bg-slate-800 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-all border border-white/5 active:scale-95"
                >
                  Ingresar con Usuario
                </button>
              </div>
            )}
          </div>

          <div className="pt-10 space-y-4">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Sinapsis 3D Bariloche
            </p>
            <div className="flex justify-center gap-4 text-slate-500">
              <a href="https://www.sinapsis3dbariloche.com.ar/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="Sitio Web">
                <Globe size={16} />
              </a>
              <a href="https://www.instagram.com/sinapsis3dbariloche/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="Instagram">
                <Instagram size={16} />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
