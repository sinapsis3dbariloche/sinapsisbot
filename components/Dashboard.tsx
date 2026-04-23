
import React, { useMemo, useState, useEffect } from 'react';
import { Remito } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Calendar,
  Users,
  Award,
  AlertCircle
} from 'lucide-react';
import { format, parseISO, startOfMonth, subMonths, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardProps {
  remitos: Remito[];
}

const safeParseISO = (dateStr: string | undefined | null) => {
  if (!dateStr) return new Date();
  try {
    return parseISO(dateStr);
  } catch (e) {
    return new Date();
  }
};

const Dashboard: React.FC<DashboardProps> = ({ remitos }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const stats = useMemo(() => {
    let totalPending = 0;
    let totalCollected = 0;
    const monthlyData: Record<string, number> = {};
    const customerBalances: Record<string, { name: string, paid: number, debt: number }> = {};

    // Get last 6 months list for the chart
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(new Date(), i);
      return format(d, 'yyyy-MM');
    }).reverse();

    last6Months.forEach(m => monthlyData[m] = 0);

    remitos.forEach(r => {
      if (!customerBalances[r.customerId]) {
        customerBalances[r.customerId] = { name: r.customerName, paid: 0, debt: 0 };
      }

      const pending = r.total - (r.amountPaid || 0);
      totalPending += pending > 0 ? pending : 0;
      totalCollected += (r.amountPaid || 0);

      customerBalances[r.customerId].debt += pending > 0 ? pending : 0;
      customerBalances[r.customerId].paid += (r.amountPaid || 0);

      // Process payment history for precise monthly data
      if (r.paymentHistory && r.paymentHistory.length > 0) {
        r.paymentHistory.forEach(p => {
          const monthKey = format(safeParseISO(p.date), 'yyyy-MM');
          if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey] += p.amount;
          }
        });
      } else if (r.status === 'Pagado' || r.amountPaid > 0) {
        // Fallback: If no payment history but has amountPaid, use remito date
        const monthKey = format(safeParseISO(r.date), 'yyyy-MM');
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey] += r.amountPaid;
        }
      }
    });

    const chartData = Object.entries(monthlyData).map(([key, value]) => ({
      name: format(safeParseISO(`${key}-01`), 'MMM', { locale: es }).toUpperCase(),
      monto: value,
      rawDate: key
    })).sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    const topPayers = Object.values(customerBalances)
      .sort((a, b) => b.paid - a.paid)
      .slice(0, 5)
      .map((c, i) => ({ ...c, id: `payer-${i}` }));

    const topDebtors = Object.values(customerBalances)
      .filter(c => c.debt > 0)
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 5)
      .map((c, i) => ({ ...c, id: `debtor-${i}` }));

    return {
      totalPending,
      totalCollected,
      chartData,
      topPayers,
      topDebtors
    };
  }, [remitos]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(Math.max(0, value));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* Welcome Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Panel de Control</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Estado Financiero Sinapsis 3D</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 relative z-10">
          <Calendar className="text-orange-600" size={18} />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </span>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-col h-full">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagado Total</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalCollected)}</h3>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-2 text-green-500">
              <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center">
                <ArrowUpRight size={12} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Ingresos Reales</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-col h-full">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 transition-colors group-hover:bg-red-100">
              <Clock size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendiente de Cobro</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalPending)}</h3>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-2 text-amber-500">
              <div className="w-5 h-5 bg-amber-50 rounded-full flex items-center justify-center">
                <Filter size={12} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Saldo en Calle</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 lg:col-span-1 md:col-span-full overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600 rounded-full -mr-16 -mt-16 blur-2xl opacity-20"></div>
          <div className="flex flex-col h-full relative z-10">
            <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 border border-white/10">
              <Wallet size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Resumen General</span>
            <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(stats.totalCollected + stats.totalPending)}</h3>
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2 text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest tracking-widest group-hover:text-orange-400 transition-colors">Volumen total de remitos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Evolución de Cobros</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cierre mensual de ingresos reales</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Últimos 6 meses</span>
          </div>
        </div>

        <div className="h-[350px] w-full min-h-[350px]">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                  tickFormatter={(val) => `$${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 12 }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700, color: '#f97316' }}
                  labelStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, marginBottom: '4px', color: '#64748b' }}
                  formatter={(value: any) => [formatCurrency(value), 'COBRADO']}
                />
                <Bar 
                  dataKey="monto" 
                  radius={[8, 8, 8, 8]} 
                  barSize={40}
                >
                  {stats.chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === stats.chartData.length - 1 ? '#f97316' : '#cbd5e1'} 
                      className="hover:fill-orange-500 transition-colors duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Rankings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Payers */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-40"></div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Mejores Clientes</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mayor facturación cobrada</p>
            </div>
          </div>

          <div className="space-y-4">
            {stats.topPayers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-black text-slate-400 shadow-sm border border-slate-50">
                    #{index + 1}
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[150px] md:max-w-xs">{customer.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900">{formatCurrency(customer.paid)}</span>
                </div>
              </div>
            ))}
            {stats.topPayers.length === 0 && (
              <p className="text-center py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No hay registros aún</p>
            )}
          </div>
        </div>

        {/* Top Debtors */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-40"></div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Principales Deudores</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Saldos pendientes más altos</p>
            </div>
          </div>

          <div className="space-y-4">
            {stats.topDebtors.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-4 bg-red-50/20 rounded-2xl hover:bg-red-50/40 transition-colors border border-transparent hover:border-red-100/30">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-black text-red-400 shadow-sm border border-red-50/50">
                    #{index + 1}
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[150px] md:max-w-xs">{customer.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-red-600">{formatCurrency(customer.debt)}</span>
                </div>
              </div>
            ))}
            {stats.topDebtors.length === 0 && (
              <p className="text-center py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">¡Todas las cuentas al día!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
