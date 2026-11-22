
import { Package, Menu, RotateCcw, Settings2, Wrench, MonitorSmartphone, Users, FileText, LayoutDashboard, LogOut, Briefcase, DollarSign, Globe, Instagram, Box, Hexagon, ChevronLeft, ChevronRight, ChevronDown, Scale, Layers } from 'lucide-react';
import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { useUnsavedChanges } from '../lib/UnsavedChangesContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavSubItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isGroup?: boolean;
  subItems?: NavSubItem[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'quotes', label: 'Presupuestos', icon: FileText },
  { id: 'remitos', label: 'Ventas', icon: FileText },
  {
    id: 'expenses',
    label: 'Gastos',
    icon: DollarSign,
    subItems: [
      { id: 'suppliers', label: 'Proveedores', icon: Briefcase },
    ],
  },
  { id: 'balances', label: 'Balances', icon: Scale },
  {
    id: 'stock-group',
    label: 'Stock',
    icon: Package,
    isGroup: true,
    subItems: [
      { id: 'stock', label: 'Filamento', icon: Box },
      { id: 'stock-grafica', label: 'Gráfica', icon: Layers },
      { id: 'stock-edit', label: 'Catálogo', icon: Settings2 },
      { id: 'stock-reset', label: 'Reiniciar', icon: RotateCcw },
    ],
  },
  {
    id: 'maint',
    label: 'Mantenimiento',
    icon: Wrench,
    subItems: [
      { id: 'maint-edit', label: 'Impresoras', icon: MonitorSmartphone },
    ],
  },
];

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});
  const { logout, user } = useAuth();
  const { confirmIfDirty } = useUnsavedChanges();

  // Auto-expand parent group if navigation jumps directly to a subitem from another view
  React.useEffect(() => {
    const parent = NAV_ITEMS.find(item => item.subItems?.some(sub => sub.id === activeTab));
    if (parent) {
      setExpandedGroups(prev => (prev[parent.id] ? prev : { ...prev, [parent.id]: true }));
    }
  }, [activeTab]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const versionString = React.useMemo(() => {
    if (typeof __BUILD_TIME__ === 'undefined' || __BUILD_TIME__ === 'dev') return 'v.DEV';
    const date = new Date(parseInt(__BUILD_TIME__, 10));
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `v${year}.${month}.${day}-${hours}${minutes}`;
  }, []);

  const navigateWithCheck = (tabId: string, onConfirmed?: () => void) => {
    if (activeTab === tabId) {
      onConfirmed?.();
      return;
    }
    confirmIfDirty(() => {
      setActiveTab(tabId);
      onConfirmed?.();
    }, 'Tenés datos cargados sin guardar en el formulario actual. Si cambiás de sección, se perderán los datos no guardados. ¿Deseas volver para guardar, o descartar todo y avanzar?');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 ${isSidebarCollapsed ? 'w-16' : 'w-56'} bg-slate-950 border-r border-slate-800 transition-all duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          className="hidden lg:flex absolute -right-3 top-6 bg-slate-800 text-slate-400 p-1 rounded-full border border-slate-700 hover:text-white hover:bg-slate-700 z-50 transition-colors"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="flex flex-col h-full bg-slate-950 relative z-10">
          <div className={`py-3 border-b border-slate-900 transition-all duration-300 ${isSidebarCollapsed ? 'px-1' : 'px-4'}`}>
            <div className="flex flex-col items-center">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity focus:outline-none flex flex-col items-center"
              >
                {isSidebarCollapsed ? (
                  <h1 className="text-xl font-black text-white leading-tight tracking-tighter uppercase italic">S</h1>
                ) : (
                  <>
                    <h1 className="text-2xl font-black text-white leading-tight tracking-tighter uppercase italic">SINASOFT</h1>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-0.5 opacity-80">Gestión</p>
                    <div className="mt-1.5 bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest text-[8px] font-black">
                      {versionString}
                    </div>
                  </>
                )}
              </button>
              
              {!isSidebarCollapsed ? (
                <div className="flex gap-3 mt-2.5 text-slate-400">
                  <a href="https://www.sinapsis3dbariloche.com.ar/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="Sitio Web">
                    <Globe size={16} />
                  </a>
                  <a href="https://www.instagram.com/sinapsis3dbariloche/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="Instagram">
                    <Instagram size={16} />
                  </a>
                  <a href="https://makerworld.com/es/@sinapsis3d" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="MakerWorld">
                    <Box size={16} />
                  </a>
                  <a href="https://cults3d.com/es/usuarios/Sinapsis3D" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="Cults3D">
                    <Hexagon size={16} />
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-2.5 text-slate-400 items-center">
                  <a href="https://www.sinapsis3dbariloche.com.ar/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="Sitio Web">
                    <Globe size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 px-2 space-y-1 mt-1 overflow-y-auto scrollbar-hide py-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
              const isExpanded = Boolean(expandedGroups[item.id]);
              const isActive = activeTab === item.id;
              const hasActiveChild = Boolean(item.subItems?.some(sub => sub.id === activeTab));

              const handleRootClick = () => {
                if (item.isGroup) {
                  toggleGroup(item.id);
                  return;
                }

                if (hasSubItems) {
                  if (isActive) {
                    toggleGroup(item.id);
                    return;
                  }
                  navigateWithCheck(item.id, () => {
                    setExpandedGroups(prev => ({ ...prev, [item.id]: true }));
                  });
                  return;
                }

                navigateWithCheck(item.id, () => {
                  setIsSidebarOpen(false);
                });
              };

              const rootButtonClasses = isActive
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/40 translate-x-1 opacity-100'
                : hasActiveChild && !isExpanded
                  ? 'bg-slate-900 text-orange-400'
                  : item.isGroup && isExpanded
                    ? 'text-slate-200 hover:bg-slate-900 hover:text-white'
                    : 'text-slate-500 hover:bg-slate-900 hover:text-white';

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={handleRootClick}
                    aria-expanded={hasSubItems ? isExpanded : undefined}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 shrink-0 ${rootButtonClasses}`}
                  >
                    <span className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} min-w-0`}>
                      <Icon size={18} className={item.isGroup && !isActive ? 'text-orange-500 shrink-0' : 'shrink-0'} />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </span>

                    {hasSubItems && !isSidebarCollapsed && (
                      <span
                        role="button"
                        tabIndex={-1}
                        aria-label={isExpanded ? `Colapsar ${item.label}` : `Desplegar ${item.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(item.id);
                        }}
                        className="p-0.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </span>
                    )}
                  </button>

                  {hasSubItems && isExpanded && (
                    <div className="space-y-1">
                      {item.subItems!.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.id;

                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              navigateWithCheck(sub.id, () => {
                                setIsSidebarOpen(false);
                              });
                            }}
                            title={isSidebarCollapsed ? sub.label : undefined}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 pl-8 pr-4 text-[9px]'} py-2.5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shrink-0 ${isSubActive ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/40 translate-x-1 opacity-100' : 'text-slate-500 opacity-75 hover:opacity-100 hover:bg-slate-900 hover:text-white'}`}
                          >
                            <SubIcon size={isSidebarCollapsed ? 16 : 14} className="shrink-0" />
                            {!isSidebarCollapsed && <span className="truncate">{sub.label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className={`p-4 space-y-4 border-t border-slate-900 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
            {user && (
              <div className={`bg-slate-900/50 rounded-2xl ${isSidebarCollapsed ? 'p-2' : 'p-3'} border border-slate-800 flex items-center gap-3 overflow-hidden w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} 
                  alt="Avatar" 
                  className={`${isSidebarCollapsed ? 'w-8 h-8 rounded-lg' : 'w-9 h-9 rounded-xl shrink-0'}`}
                  referrerPolicy="no-referrer"
                />
                {!isSidebarCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">{user.displayName || 'Admin'}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase truncate">{user.email}</span>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={() => {
                confirmIfDirty(() => logout(), 'Tenés datos cargados sin guardar. Si cerrás sesión, se perderá la información ingresada. ¿Deseas cerrar sesión de todos modos?');
              }}
              title={isSidebarCollapsed ? "Cerrar Sesión" : undefined}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} ${isSidebarCollapsed ? 'p-3' : 'px-4 py-3'} rounded-2xl font-black uppercase tracking-widest text-[11px] text-red-500 hover:bg-red-500/10 transition-all duration-300`}
            >
              <LogOut size={18} />
              {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-slate-200 lg:hidden shrink-0">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
          >
            <span className="font-black text-slate-900 uppercase text-sm tracking-tighter italic">SINASOFT Gestión</span>
          </button>
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
