
import { Package, ClipboardList, Calculator, Menu, RotateCcw } from 'lucide-react';
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const navItems = [
    { id: 'calc', label: 'Calculadora', icon: Calculator },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'stock-reset', label: 'Reiniciar', icon: RotateCcw, isSubItem: true },
    { id: 'queue', label: 'Producción', icon: ClipboardList },
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

          <nav className="flex-1 px-6 space-y-2 mt-8">
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
                  className={`w-full flex items-center gap-4 py-4 rounded-[1.25rem] font-black uppercase tracking-widest transition-all duration-300 ${isSub ? 'pl-10 text-[9px] opacity-70' : 'px-6 text-[11px]'} ${activeTab === item.id ? 'bg-orange-600 text-white shadow-2xl shadow-orange-600/40 translate-x-1 opacity-100' : 'text-slate-500 hover:bg-slate-900 hover:text-white'}`}
                >
                  <Icon size={isSub ? 14 : 18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-6">
            <div className="bg-slate-900/50 rounded-[2rem] p-5 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-xs shadow-inner shadow-orange-900/40">S3D</div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Admin</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">Online</span>
              </div>
            </div>
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

        <div className="flex-1 overflow-y-auto p-6 lg:p-12">
          <div className="max-w-6xl mx-auto h-full">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
