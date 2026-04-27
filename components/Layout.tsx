
import { Package, Calculator, Menu, RotateCcw, Settings2, Wrench, ListTodo, MonitorSmartphone, Users, FileText, LayoutDashboard, LogOut, Briefcase, DollarSign, Tag } from 'lucide-react';
import React from 'react';
import { useAuth } from '../lib/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'quotes', label: 'Presupuestos', icon: FileText },
    { id: 'calc', label: 'Calculadora', icon: Calculator, isSubItem: true },
    { id: 'remitos', label: 'Ventas', icon: FileText },
    { id: 'prices', label: 'Precios', icon: Tag, isSubItem: true },
    { id: 'expenses', label: 'Gastos', icon: DollarSign },
    { id: 'suppliers', label: 'Proveedores', icon: Briefcase, isSubItem: true },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'stock-edit', label: 'Catálogo', icon: Settings2, isSubItem: true },
    { id: 'stock-reset', label: 'Reiniciar', icon: RotateCcw, isSubItem: true },
    { id: 'maint', label: 'Mantenimiento', icon: Wrench },
    { id: 'maint-edit', label: 'Gestionar Máquinas', icon: MonitorSmartphone, isSubItem: true },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-10 border-b border-slate-900">
            <div className="flex flex-col items-center">
              <div className="text-center">
                <h1 className="text-2xl font-black text-white leading-tight tracking-tighter uppercase italic">SINAPSIS 3D</h1>
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-1 opacity-80">BARILOCHE</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-6 space-y-2 mt-8 overflow-y-auto scrollbar-hide py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSub = item.isSubItem;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 py-4 rounded-[1.25rem] font-black uppercase tracking-widest transition-all duration-300 shrink-0 ${isSub ? 'pl-10 text-[9px] opacity-70' : 'px-6 text-[11px]'} ${activeTab === item.id ? 'bg-orange-600 text-white shadow-2xl shadow-orange-600/40 translate-x-1 opacity-100' : 'text-slate-500 hover:bg-slate-900 hover:text-white'}`}
                >
                  <Icon size={isSub ? 14 : 18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-6 space-y-4">
            {user && (
              <div className="bg-slate-900/50 rounded-[2rem] p-4 border border-slate-800 flex items-center gap-4 overflow-hidden">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">{user.displayName || 'Admin'}</span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase truncate">{user.email}</span>
                </div>
              </div>
            )}
            
            <button 
              onClick={logout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black uppercase tracking-widest text-[11px] text-red-500 hover:bg-red-500/10 transition-all duration-300"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-slate-200 lg:hidden shrink-0">
          <div className="flex items-center">
            <span className="font-black text-slate-900 uppercase text-sm tracking-tighter italic">SINAPSIS 3D</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-3 text-slate-950 bg-slate-100 rounded-2xl active:scale-95 transition-transform"><Menu size={24} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-12">
          <div className="max-w-6xl mx-auto h-full">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
