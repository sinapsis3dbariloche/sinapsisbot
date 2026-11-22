import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
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
  Clock,
  FileText,
  PackageCheck,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CurrentMonthDashboardData, DailyChartPoint } from '../services/dashboardMetrics';

interface DashboardCurrentMonthProps {
  data: CurrentMonthDashboardData;
  availableMonths: string[];
  selectedMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
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

const formatMonthTitle = (monthKey: string) => {
  try {
    const raw = format(parseISO(`${monthKey}-01`), "MMMM 'de' yyyy", { locale: es });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch {
    return monthKey;
  }
};

const formatDayFull = (dateStr: string) => {
  try {
    const raw = format(parseISO(dateStr), "EEEE d 'de' MMMM", { locale: es });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch {
    return dateStr;
  }
};

const DailyTooltip: React.FC<{ active?: boolean; payload?: any[] }> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point: DailyChartPoint | undefined = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-4 min-w-[230px] text-xs">
      <div className="flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-100">
        <span className="font-bold text-slate-900">{formatDayFull(point.date)}</span>
        {point.isToday && <span className="text-[11px] font-semibold text-orange-600">Hoy</span>}
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-slate-400">Actividad del día</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">
            Cobros{point.cobrosCount > 0 ? ` (${point.cobrosCount})` : ''}
          </span>
          <span className="font-bold tabular-nums text-emerald-600">
            {formatCurrency(point.cobrosDia)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">
            Gastos{point.gastosCount > 0 ? ` (${point.gastosCount})` : ''}
          </span>
          <span className="font-bold tabular-nums text-red-600">
            {formatCurrency(point.gastosDia)}
          </span>
        </div>
      </div>

      {point.cobrosAcum !== null && point.gastosAcum !== null && point.balanceAcum !== null && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Acumulado del mes</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Cobros acumulados</span>
            <span className="font-bold tabular-nums text-emerald-700">
              {formatCurrency(point.cobrosAcum)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Gastos acumulados</span>
            <span className="font-bold tabular-nums text-red-700">
              {formatCurrency(point.gastosAcum)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-50">
            <span className="font-semibold text-slate-700">Balance acumulado</span>
            <span
              className={`font-black tabular-nums ${
                point.balanceAcum >= 0 ? 'text-slate-900' : 'text-red-600'
              }`}
            >
              {formatCurrency(point.balanceAcum)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardCurrentMonth: React.FC<DashboardCurrentMonthProps> = ({
  data,
  availableMonths,
  selectedMonthKey,
  onSelectMonth,
  isMounted,
  onNavigateAction
}) => {
  const netStatusLabel =
    data.netBalance > 0 ? 'Superávit' : data.netBalance < 0 ? 'Déficit' : 'Equilibrio';

  const projectedStatusLabel =
    data.projectedBalance > 0
      ? 'Proyección positiva'
      : data.projectedBalance < 0
        ? 'Proyección negativa'
        : 'En equilibrio';

  const todayPoint = data.dailySeries.find(d => d.isToday);
  const maxDaily = Math.max(
    0,
    ...data.dailySeries.map(d => Math.max(d.cobrosDia, d.gastosDia))
  );
  const maxCumulative = Math.max(
    0,
    ...data.dailySeries.map(d => Math.max(d.cobrosAcum ?? 0, d.gastosAcum ?? 0))
  );
  const alignAxes = maxDaily > 0 && maxCumulative <= maxDaily * 1.25;
  const sharedAxisMax = alignAxes ? Math.ceil(Math.max(maxDaily, maxCumulative) * 1.15) : undefined;

  const hasDrafts = data.operations.draftRemitosCount > 0 || data.operations.draftExpensesCount > 0;

  return (
    <div className="space-y-8">
      {/* Month Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {formatMonthTitle(selectedMonthKey)}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {data.isCurrentMonth && data.todayDay
              ? `Día ${data.todayDay} de ${data.daysInMonth}`
              : `${data.daysInMonth} días`}
            <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
            {data.activeDaysCount} {data.activeDaysCount === 1 ? 'día con movimiento' : 'días con movimiento'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Calendar size={15} className="text-slate-400 shrink-0" />
          <label htmlFor="dashboard-month-select" className="sr-only">
            Seleccionar mes
          </label>
          <select
            id="dashboard-month-select"
            value={selectedMonthKey}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {formatMonthTitle(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Financial KPIs (5 metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Cobros del Mes (Caja Real) */}
        <button
          type="button"
          onClick={() =>
            onNavigateAction('remitos', {
              remitoStatus: 'ConCobros',
              month: selectedMonthKey,
              draftFilter: 'Emitido'
            })
          }
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-colors group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">Cobros del mes</span>
              <TrendingUp size={16} className="text-emerald-600 shrink-0" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              {formatCurrency(data.collectedTotal)}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed tabular-nums">
              {data.collectedFromPriorMonths > 0 ? (
                <>
                  Mes: <strong className="text-slate-700">{formatCurrency(data.collectedFromCurrentMonthSales)}</strong>
                  <span aria-hidden="true" className="mx-1 text-slate-300">·</span>
                  Ant.: <strong className="text-emerald-700">{formatCurrency(data.collectedFromPriorMonths)}</strong>
                </>
              ) : (
                <>Caja real por fecha de pago</>
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-emerald-700 text-[11px] font-semibold">
            <span>Ver cobros</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>

        {/* 2. Ventas Facturadas del Mes */}
        <button
          type="button"
          onClick={() =>
            onNavigateAction('remitos', {
              month: selectedMonthKey,
              draftFilter: 'Emitido'
            })
          }
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">Ventas facturadas</span>
              <Receipt size={16} className="text-slate-600 shrink-0" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              {formatCurrency(data.billedTotal)}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 tabular-nums">
              {data.billedCount} {data.billedCount === 1 ? 'remito' : 'remitos'}
              <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
              {data.billedCollectionRate}% cobrado
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-600 text-[11px] font-semibold">
            <span>Ver ventas</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>

        {/* 3. Gastos del Mes */}
        <button
          type="button"
          onClick={() =>
            onNavigateAction('expenses', {
              month: selectedMonthKey,
              includeDrafts: false
            })
          }
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-red-300 transition-colors group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">Gastos del mes</span>
              <TrendingDown size={16} className="text-red-600 shrink-0" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              {formatCurrency(data.expensesTotal)}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 tabular-nums">
              {data.expensesCount} {data.expensesCount === 1 ? 'comprobante' : 'comprobantes'} emitidos
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-red-600 text-[11px] font-semibold">
            <span>Ver gastos</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </button>

        {/* 4. Balance Neto del Mes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">Balance neto</span>
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
              Cobros menos gastos del mes
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
            <span className={data.netBalance >= 0 ? 'text-emerald-700' : 'text-red-600'}>
              {netStatusLabel}
            </span>
            <span className="text-slate-400">Caja real</span>
          </div>
        </div>

        {/* 5. Balance Proyectado del Mes */}
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
              Si se cobra toda la cartera abierta
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
            <span className={data.projectedBalance >= 0 ? 'text-orange-700' : 'text-red-600'}>
              {projectedStatusLabel}
            </span>
            <span className="text-slate-400 tabular-nums">+{formatAxisCurrency(data.receivables.totalPending)}</span>
          </div>
        </div>
      </div>

      {/* Arrastre de Pendientes e Impacto Operativo en el Mes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Cartera Pendiente de Cobro (Arrastre + Mes Actual) */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-orange-400">
                Pendiente de cobro total
              </span>
              <button
                type="button"
                onClick={() =>
                  onNavigateAction('remitos', { remitoStatus: 'Deudores', draftFilter: 'Emitido' })
                }
                className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Ver deudores
                <ArrowUpRight size={14} />
              </button>
            </div>

            <p className="text-3xl font-black tracking-tight tabular-nums mt-2">
              {formatCurrency(data.receivables.totalPending)}
            </p>
            <p className="text-xs text-slate-400 mt-1 tabular-nums">
              {data.receivables.totalPendingCount}{' '}
              {data.receivables.totalPendingCount === 1 ? 'remito con saldo pendiente' : 'remitos con saldo pendiente'}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-200">Arrastre de meses anteriores</p>
                <p className="text-[11px] text-slate-400 tabular-nums">
                  {data.receivables.priorMonthsCount}{' '}
                  {data.receivables.priorMonthsCount === 1 ? 'remito anterior' : 'remitos anteriores'}
                </p>
              </div>
              <span className="text-base font-black text-orange-400 tabular-nums shrink-0">
                {formatCurrency(data.receivables.priorMonthsPending)}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-200">Pendiente de este mes</p>
                <p className="text-[11px] text-slate-400 tabular-nums">
                  {data.receivables.currentMonthCount}{' '}
                  {data.receivables.currentMonthCount === 1 ? 'remito del mes' : 'remitos del mes'}
                </p>
              </div>
              <span className="text-base font-black text-white tabular-nums shrink-0">
                {formatCurrency(data.receivables.currentMonthPending)}
              </span>
            </div>

            {data.receivables.otherMonthsPending > 0 && (
              <div className="flex items-baseline justify-between gap-4 pt-2 border-t border-slate-800/80">
                <p className="text-xs text-slate-400">Emitidos en meses posteriores</p>
                <span className="text-sm font-bold text-slate-300 tabular-nums shrink-0">
                  {formatCurrency(data.receivables.otherMonthsPending)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Factores Operativos en Curso */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Actividad en curso que impacta el mes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pedidos activos, presupuestos pendientes de cierre y comprobantes en borrador
            </p>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {/* Producción */}
            <button
              type="button"
              onClick={() => onNavigateAction('remitos', { remitoProdStatus: 'En Producción' })}
              className="w-full py-3.5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Clock size={16} className="text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">En producción</p>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {data.operations.inProductionPendingAmount > 0
                      ? `Saldo a cobrar al entregar: ${formatCurrency(data.operations.inProductionPendingAmount)}`
                      : 'Sin saldo pendiente asociado'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-lg font-black text-slate-900 tabular-nums">
                  {data.operations.inProductionCount}
                </span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
            </button>

            {/* Para Entregar */}
            <button
              type="button"
              onClick={() => onNavigateAction('remitos', { remitoProdStatus: 'Para entregar' })}
              className="w-full py-3.5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <PackageCheck size={16} className="text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">Para entregar</p>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {data.operations.readyToDeliverPendingAmount > 0
                      ? `Cobro inmediato al entregar: ${formatCurrency(data.operations.readyToDeliverPendingAmount)}`
                      : 'Listos para retiro o envío'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-lg font-black text-slate-900 tabular-nums">
                  {data.operations.readyToDeliverCount}
                </span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
            </button>

            {/* Presupuestos Abiertos */}
            <button
              type="button"
              onClick={() =>
                onNavigateAction('quotes', {
                  quoteStatus: data.operations.quotesPendingCount > 0 ? 'presupuestado' : 'borrador'
                })
              }
              className="w-full py-3.5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={16} className="text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">Presupuestos abiertos</p>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {data.operations.quotesToDoCount} para hacer
                    <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
                    {data.operations.quotesPendingCount} presupuestados
                    {data.operations.quotesPendingAmount > 0 && (
                      <>
                        <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
                        Potencial {formatCurrency(data.operations.quotesPendingAmount)}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-lg font-black text-slate-900 tabular-nums">
                  {data.operations.quotesToDoCount + data.operations.quotesPendingCount}
                </span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
            </button>

            {/* Borradores sin contabilizar */}
            {hasDrafts && (
              <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle size={15} className="text-amber-600 shrink-0" />
                  <p className="text-xs text-slate-700 tabular-nums">
                    <strong className="font-bold text-slate-900">Borradores sin contabilizar:</strong>{' '}
                    {data.operations.draftRemitosCount > 0 && (
                      <span>
                        {data.operations.draftRemitosCount}{' '}
                        {data.operations.draftRemitosCount === 1 ? 'venta' : 'ventas'} (
                        {formatCurrency(data.operations.draftRemitosAmount)})
                      </span>
                    )}
                    {data.operations.draftRemitosCount > 0 && data.operations.draftExpensesCount > 0 && (
                      <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
                    )}
                    {data.operations.draftExpensesCount > 0 && (
                      <span>
                        {data.operations.draftExpensesCount}{' '}
                        {data.operations.draftExpensesCount === 1 ? 'gasto' : 'gastos'} (
                        {formatCurrency(data.operations.draftExpensesAmount)})
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-semibold shrink-0">
                  {data.operations.draftRemitosCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onNavigateAction('remitos', { draftFilter: 'Borrador' })}
                      className="text-orange-600 hover:text-orange-700 cursor-pointer whitespace-nowrap"
                    >
                      Ver ventas
                    </button>
                  )}
                  {data.operations.draftExpensesCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onNavigateAction('expenses', { includeDrafts: true })}
                      className="text-orange-600 hover:text-orange-700 cursor-pointer whitespace-nowrap"
                    >
                      Ver gastos
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Composed Chart: Daily Bars + Monthly Cumulative Lines */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Evolución diaria y acumulado del mes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Barras por día con actividad (eje derecho) y líneas de total acumulado mensual (eje izquierdo)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
              Cobros del día
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/80" />
              Gastos del día
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-4 h-0.5 bg-emerald-700 rounded-full" />
              Cobros acumulados
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-4 h-0.5 bg-red-700 rounded-full" />
              Gastos acumulados
            </span>
          </div>
        </div>

        {!data.hasActivity ? (
          <div className="h-[320px] flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-2xl p-6">
            <p className="text-sm font-bold text-slate-700">
              Sin cobros ni gastos registrados en {formatMonthTitle(selectedMonthKey)}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              A medida que cargues cobros de ventas o gastos emitidos en este mes, verás aquí cada día con actividad y el crecimiento acumulado.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => onNavigateAction('remitos')}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                Ir a Ventas
              </button>
              <button
                type="button"
                onClick={() => onNavigateAction('expenses')}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Ir a Gastos
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full min-w-0 h-[360px]" style={{ width: '100%', height: 360, minWidth: 0, minHeight: 360 }}>
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={360}>
                <ComposedChart
                  data={data.dailySeries}
                  margin={{ top: 16, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="dayLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    interval={0}
                    dy={8}
                  />
                  <YAxis
                    yAxisId="acumulado"
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    domain={sharedAxisMax ? [0, sharedAxisMax] : [0, 'auto']}
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={formatAxisCurrency}
                  />
                  <YAxis
                    yAxisId="diario"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    domain={sharedAxisMax ? [0, sharedAxisMax] : [0, 'auto']}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={formatAxisCurrency}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={<DailyTooltip />}
                  />
                  {todayPoint && (
                    <ReferenceLine
                      x={todayPoint.dayLabel}
                      yAxisId="acumulado"
                      stroke="#ea580c"
                      strokeDasharray="4 4"
                      strokeOpacity={0.7}
                      label={{
                        value: 'Hoy',
                        position: 'insideTopRight',
                        fill: '#ea580c',
                        fontSize: 10,
                        fontWeight: 800
                      }}
                    />
                  )}
                  <Bar
                    yAxisId="diario"
                    dataKey="cobrosDia"
                    name="Cobros del día"
                    fill="#10b981"
                    fillOpacity={0.85}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={14}
                  />
                  <Bar
                    yAxisId="diario"
                    dataKey="gastosDia"
                    name="Gastos del día"
                    fill="#ef4444"
                    fillOpacity={0.85}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={14}
                  />
                  <Line
                    yAxisId="acumulado"
                    type="monotone"
                    dataKey="cobrosAcum"
                    name="Cobros acumulados"
                    stroke="#047857"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#047857', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                  <Line
                    yAxisId="acumulado"
                    type="monotone"
                    dataKey="gastosAcum"
                    name="Gastos acumulados"
                    stroke="#b91c1c"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#b91c1c', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls={false}
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

      {/* Rankings del Mes + Deudores Activos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Clientes del Mes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900">Top 5 clientes del mes</h3>
              <p className="text-[11px] text-slate-500">Por cobros recibidos en el mes</p>
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
                Sin cobros registrados en este mes
              </p>
            )}
          </div>
        </div>

        {/* Top 5 Proveedores del Mes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900">Top 5 proveedores del mes</h3>
              <p className="text-[11px] text-slate-500">Por gastos emitidos en el mes</p>
            </div>
            <Briefcase size={18} className="text-slate-600 shrink-0" />
          </div>

          <div className="divide-y divide-slate-100">
            {data.topSuppliers.map((supplier, index) => (
              <button
                key={supplier.id}
                type="button"
                onClick={() =>
                  onNavigateAction('expenses', { month: selectedMonthKey, includeDrafts: false })
                }
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
                Sin gastos registrados en este mes
              </p>
            )}
          </div>
        </div>

        {/* Top 5 Deudores Activos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900">Top 5 deudores activos</h3>
              <p className="text-[11px] text-slate-500">Saldos abiertos (incluye arrastre)</p>
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
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xs font-black text-slate-400 tabular-nums w-5 shrink-0 mt-0.5">
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{debtor.name}</p>
                    {debtor.hasPriorDebt && (
                      <p className="text-[11px] text-orange-600 tabular-nums">
                        Arrastre: {formatCurrency(debtor.priorDebt)}
                      </p>
                    )}
                  </div>
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

export default DashboardCurrentMonth;
