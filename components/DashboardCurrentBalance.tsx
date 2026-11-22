import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  LineChart,
  Receipt,
  ArrowUpRight,
  AlertCircle,
  Award,
  Briefcase,
  FileText,
  Scale
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { BalanceClosing } from '../types';
import { CycleDashboardData } from '../services/dashboardMetrics';

interface DashboardCurrentBalanceProps {
  data: CycleDashboardData;
  latestClosing: BalanceClosing | null;
  viewScope: 'cycle' | 'all';
  onChangeScope: (scope: 'cycle' | 'all') => void;
  isMounted: boolean;
  onNavigateAction: (tab: string, filters?: any) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);

const formatAxisCurrency = (val: number) => {
  if (val === 0) return '$0';
  const abs = Math.abs(val);
  if (abs >= 1000000) return `$${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1000) return `$${Math.round(val / 1000)}k`;
  return `$${val}`;
};

const formatShortMonth = (monthKey: string) => {
  try {
    return format(parseISO(`${monthKey}-01`), 'MMM yy', { locale: es }).toUpperCase();
  } catch {
    return monthKey;
  }
};

const formatFullMonth = (monthKey: string) => {
  try {
    const raw = format(parseISO(`${monthKey}-01`), "MMMM 'de' yyyy", { locale: es });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch {
    return monthKey;
  }
};

const MonthlyTooltip: React.FC<{ active?: boolean; payload?: any[] }> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-4 min-w-[220px] text-xs">
      <div className="pb-2 mb-2 border-b border-slate-100 font-bold text-slate-900">
        {formatFullMonth(point.monthKey)}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Cobros del mes</span>
          <span className="font-bold tabular-nums text-emerald-600">{formatCurrency(point.cobros)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Gastos del mes</span>
          <span className="font-bold tabular-nums text-red-600">{formatCurrency(point.gastos)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-slate-100">
          <span className="font-semibold text-slate-700">Balance del mes</span>
          <span className={`font-black tabular-nums ${point.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {formatCurrency(point.balance)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Acumulado del período</span>
          <span className={`font-bold tabular-nums ${point.balanceAcum >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {formatCurrency(point.balanceAcum)}
          </span>
        </div>
      </div>
    </div>
  );
};

const DashboardCurrentBalance: React.FC<DashboardCurrentBalanceProps> = ({
  data,
  latestClosing,
  viewScope,
  onChangeScope,
  isMounted,
  onNavigateAction
}) => {
  const isCycleMode = viewScope === 'cycle' && Boolean(latestClosing);
  const netStatusLabel =
    data.netBalance > 0 ? 'Superávit' : data.netBalance < 0 ? 'Déficit' : 'Equilibrio';

  const chartData = data.monthlySeries.map(item => ({
    ...item,
    name: formatShortMonth(item.monthKey)
  }));

  const hasChartActivity = chartData.some(c => c.cobros > 0 || c.gastos > 0);

  return (
    <div className="space-y-8">
      {/* Cycle Status Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-orange-400 flex items-center justify-center shrink-0">
            <Scale size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black tracking-tight text-white">
                {isCycleMode ? 'Balance en Curso' : 'Consolidado Histórico Total'}
              </h2>
              {latestClosing && (
                <span className="text-xs text-slate-400 tabular-nums">
                  <span aria-hidden="true" className="mr-2 text-slate-600">·</span>
                  Último cierre: {latestClosing.name} ({latestClosing.endDate})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed tabular-nums">
              {isCycleMode && latestClosing ? (
                <>
                  Caja inicial del período: <strong className="text-white">$0</strong>
                  <span aria-hidden="true" className="mx-2 text-slate-600">·</span>
                  Último balance liquidado:{' '}
                  <strong className={latestClosing.netResult >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatCurrency(latestClosing.netResult)}
                  </strong>{' '}
                  ({latestClosing.resultType === 'PROFIT' ? 'Ganancia' : latestClosing.resultType === 'LOSS' ? 'Pérdida' : 'Equilibrio'})
                </>
              ) : latestClosing ? (
                <>Mostrando el acumulado completo de cobros, gastos y actividad de todos los ejercicios.</>
              ) : (
                <>Sin cierres registrados todavía. Mostrando todos los movimientos desde el inicio de operaciones.</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0 flex-wrap">
          {latestClosing && (
            <div className="bg-slate-800 p-1 rounded-xl inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeScope('cycle')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  viewScope === 'cycle'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Balance en Curso
              </button>
              <button
                type="button"
                onClick={() => onChangeScope('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  viewScope === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Histórico Total
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigateAction('balances')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Scale size={14} className="text-orange-400" />
            Ir a Balances
          </button>
        </div>
      </div>

      {/* 5 Financial KPIs del Balance en Curso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => onNavigateAction('remitos', { remitoStatus: 'ConCobros', draftFilter: 'Emitido' })}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-colors group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">
                {isCycleMode ? 'Cobros del balance' : 'Cobros totales'}
              </span>
              <TrendingUp size={16} className="text-emerald-600 shrink-0" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              {formatCurrency(data.totalCollected)}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Ingresos reales de caja
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-emerald-700 text-[11px] font-semibold">
            <span>Ver cobros</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateAction('remitos', { draftFilter: 'Emitido' })}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">
                {isCycleMode ? 'Facturado del balance' : 'Facturado total'}
              </span>
              <Receipt size={16} className="text-slate-600 shrink-0" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              {formatCurrency(data.totalBilled)}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 tabular-nums">
              {data.remitosCount} {data.remitosCount === 1 ? 'remito emitido' : 'remitos emitidos'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-600 text-[11px] font-semibold">
            <span>Ver ventas</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateAction('expenses', { includeDrafts: false })}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-red-300 transition-colors group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">
                {isCycleMode ? 'Gastos del balance' : 'Gastos totales'}
              </span>
              <TrendingDown size={16} className="text-red-600 shrink-0" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              {formatCurrency(data.totalExpenses)}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 tabular-nums">
              {data.expensesCount} {data.expensesCount === 1 ? 'comprobante' : 'comprobantes'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-red-600 text-[11px] font-semibold">
            <span>Ver gastos</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">
                {isCycleMode ? 'Saldo de caja actual' : 'Balance neto'}
              </span>
              <Wallet size={16} className="text-slate-600 shrink-0" />
            </div>
            <p
              className={`text-2xl font-black tracking-tight tabular-nums ${
                data.netBalance >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {formatCurrency(data.netBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              {isCycleMode ? 'Inició en $0 tras cierre' : 'Cobros menos gastos'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
            <span className={data.netBalance >= 0 ? 'text-emerald-700' : 'text-red-600'}>
              {netStatusLabel}
            </span>
            <span className="text-slate-400">Caja real</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">Balance proyectado</span>
              <LineChart size={16} className="text-orange-600 shrink-0" />
            </div>
            <p
              className={`text-2xl font-black tracking-tight tabular-nums ${
                data.projectedBalance >= 0 ? 'text-slate-900' : 'text-red-600'
              }`}
            >
              {formatCurrency(data.projectedBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Incluye cartera pendiente viva
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-orange-700">Pendientes</span>
            <span className="text-slate-700 tabular-nums">{formatCurrency(data.totalPending)}</span>
          </div>
        </div>
      </div>

      {/* Operational Summary of the Cycle: Presupuestos + Ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Presupuestos del período */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-orange-600 shrink-0" />
              <h3 className="text-sm font-black text-slate-900">
                Presupuestos {isCycleMode ? 'del período' : 'totales'}
              </h3>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              Conversión {data.quotesStats.conversionRate}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onNavigateAction('quotes', { quoteStatus: 'borrador' })}
              className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-semibold text-slate-500 block">Para hacer</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums mt-1 block">
                {data.quotesStats.borrador}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateAction('quotes', { quoteStatus: 'presupuestado' })}
              className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-semibold text-slate-500 block">Presupuest.</span>
              <span className="text-2xl font-black text-blue-700 tabular-nums mt-1 block">
                {data.quotesStats.presupuestado}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateAction('quotes', { quoteStatus: 'confirmado' })}
              className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-semibold text-slate-500 block">Confirmados</span>
              <span className="text-2xl font-black text-emerald-700 tabular-nums mt-1 block">
                {data.quotesStats.confirmado}
              </span>
            </button>
          </div>
        </div>

        {/* Ventas del período */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-slate-700 shrink-0" />
              <h3 className="text-sm font-black text-slate-900">
                Estado de ventas {isCycleMode ? 'del período' : 'totales'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateAction('remitos')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              Ver todas
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => onNavigateAction('remitos', { remitoProdStatus: 'En Producción' })}
              className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-semibold text-slate-500 block">En producción</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums mt-1 block">
                {data.ventasStats.enProduccion}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateAction('remitos', { remitoProdStatus: 'Para entregar' })}
              className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-semibold text-slate-500 block">Para entregar</span>
              <span className="text-2xl font-black text-blue-700 tabular-nums mt-1 block">
                {data.ventasStats.paraEntregar}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateAction('remitos', { remitoProdStatus: 'Entregada' })}
              className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-semibold text-slate-500 block">Entregadas</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums mt-1 block">
                {data.ventasStats.entregadas}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateAction('remitos', { remitoStatus: 'Deudores', draftFilter: 'Emitido' })}
              className="text-left p-3.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-semibold text-orange-100 block">Pendiente cobro</span>
              <span className="text-lg font-black text-white tabular-nums mt-1 block truncate">
                {formatCurrency(data.totalPending)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Evolution Chart Scoped to Cycle */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Evolución mensual: Cobros vs Gastos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {isCycleMode && data.cycleStartDate
                ? `Meses del balance en curso (desde cierre ${data.cycleStartDate})`
                : 'Comparativa mensual histórica de flujo de caja'}
              <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
              {chartData.length} {chartData.length === 1 ? 'mes' : 'meses'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              Cobros
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              Gastos
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-4 h-0.5 bg-slate-900 rounded-full" />
              Balance mensual
            </span>
          </div>
        </div>

        {!hasChartActivity ? (
          <div className="h-[320px] flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-2xl p-6">
            <p className="text-sm font-bold text-slate-700">
              Sin movimientos financieros en este período
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Los cobros y gastos registrados dentro del período aparecerán agrupados mes a mes aquí.
            </p>
          </div>
        ) : (
          <div className="w-full min-w-0 h-[350px]" style={{ width: '100%', height: 350, minWidth: 0, minHeight: 350 }}>
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={350}>
                <ComposedChart data={chartData} margin={{ top: 16, right: 20, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={formatAxisCurrency}
                  />
                  <Tooltip cursor={{ fill: '#f8fafc' }} content={<MonthlyTooltip />} />
                  <Bar
                    dataKey="cobros"
                    name="Cobros"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="gastos"
                    name="Gastos"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={24}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5.5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rankings Scoped to Cycle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Clientes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900">Top 5 clientes</h3>
              <p className="text-[11px] text-slate-500">
                {isCycleMode ? 'Cobros recibidos en el balance' : 'Cobros recibidos históricos'}
              </p>
            </div>
            <Award size={18} className="text-emerald-600 shrink-0" />
          </div>

          <div className="divide-y divide-slate-100">
            {data.topPayers.map((customer, index) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => onNavigateAction('remitos', { customerId: customer.entityId })}
                className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-black text-slate-400 tabular-nums w-5 shrink-0">
                    #{index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate">{customer.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900 tabular-nums shrink-0">
                  {formatCurrency(customer.amount)}
                </span>
              </button>
            ))}
            {data.topPayers.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400">
                No hay cobros en este período
              </p>
            )}
          </div>
        </div>

        {/* Top 5 Proveedores */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900">Top 5 proveedores</h3>
              <p className="text-[11px] text-slate-500">
                {isCycleMode ? 'Gastos realizados en el balance' : 'Gastos realizados históricos'}
              </p>
            </div>
            <Briefcase size={18} className="text-slate-600 shrink-0" />
          </div>

          <div className="divide-y divide-slate-100">
            {data.topSuppliers.map((supplier, index) => (
              <button
                key={supplier.id}
                type="button"
                onClick={() => onNavigateAction('expenses', { includeDrafts: false })}
                className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-black text-slate-400 tabular-nums w-5 shrink-0">
                    #{index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate">{supplier.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900 tabular-nums shrink-0">
                  {formatCurrency(supplier.amount)}
                </span>
              </button>
            ))}
            {data.topSuppliers.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400">
                Sin gastos en este período
              </p>
            )}
          </div>
        </div>

        {/* Top 5 Deudores Vigentes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900">Top 5 deudores vigentes</h3>
              <p className="text-[11px] text-slate-500">Cartera abierta actual</p>
            </div>
            <AlertCircle size={18} className="text-orange-600 shrink-0" />
          </div>

          <div className="divide-y divide-slate-100">
            {data.topDebtors.map((debtor, index) => (
              <button
                key={debtor.id}
                type="button"
                onClick={() => onNavigateAction('remitos', { customerId: debtor.customerId })}
                className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-black text-slate-400 tabular-nums w-5 shrink-0">
                    #{index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate">{debtor.name}</span>
                </div>
                <span className="text-xs font-black text-red-600 tabular-nums shrink-0">
                  {formatCurrency(debtor.debt)}
                </span>
              </button>
            ))}
            {data.topDebtors.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400">
                Todas las cuentas están al día
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCurrentBalance;
