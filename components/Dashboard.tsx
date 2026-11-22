import React, { useMemo, useState, useEffect } from 'react';
import { Remito, Expense, Quote, BalanceClosing } from '../types';
import { Calendar, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  calculateCurrentMonthDashboard,
  calculateCycleDashboard,
  getAvailableDashboardMonths,
  getLocalDateParts
} from '../services/dashboardMetrics';
import DashboardCurrentMonth from './DashboardCurrentMonth';
import DashboardCurrentBalance from './DashboardCurrentBalance';

interface DashboardProps {
  remitos: Remito[];
  expenses: Expense[];
  quotes: Quote[];
  balanceClosings?: BalanceClosing[];
  onNavigateAction: (tab: string, filters?: any) => void;
}

type DashboardTab = 'current-month' | 'current-balance';

const Dashboard: React.FC<DashboardProps> = ({
  remitos,
  expenses,
  quotes,
  balanceClosings = [],
  onNavigateAction
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeView, setActiveView] = useState<DashboardTab>('current-month');
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => getLocalDateParts().monthKey);
  const [viewScope, setViewScope] = useState<'cycle' | 'all'>('cycle');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const latestClosing = useMemo(() => {
    if (!balanceClosings || balanceClosings.length === 0) return null;
    return [...balanceClosings].sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    )[0];
  }, [balanceClosings]);

  const availableMonths = useMemo(
    () => getAvailableDashboardMonths(remitos, expenses),
    [remitos, expenses]
  );

  const currentMonthData = useMemo(
    () =>
      calculateCurrentMonthDashboard({
        remitos,
        expenses,
        quotes,
        monthKey: selectedMonthKey
      }),
    [remitos, expenses, quotes, selectedMonthKey]
  );

  const cycleData = useMemo(
    () =>
      calculateCycleDashboard({
        remitos,
        expenses,
        quotes,
        lastClosingDate: latestClosing?.endDate || null,
        isAllTime: viewScope === 'all' || !latestClosing
      }),
    [remitos, expenses, quotes, latestClosing, viewScope]
  );

  const todayFormatted = useMemo(() => {
    const raw = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Unified Dashboard Header + Segmented View Tabs */}
      <div className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Panel de Control
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-x-2 gap-y-1">
            <span>Sinapsis 3D</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{todayFormatted}</span>
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Vistas del Dashboard"
          className="inline-flex items-center p-1 bg-slate-100 rounded-xl self-start lg:self-auto shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'current-month'}
            onClick={() => setActiveView('current-month')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'current-month'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar size={14} className="shrink-0" />
            Mes en Curso
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'current-balance'}
            onClick={() => setActiveView('current-balance')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'current-balance'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale size={14} className="shrink-0" />
            Balance en Curso
          </button>
        </div>
      </div>

      {/* Active Dashboard Tab Content */}
      {activeView === 'current-month' ? (
        <DashboardCurrentMonth
          data={currentMonthData}
          availableMonths={availableMonths}
          selectedMonthKey={selectedMonthKey}
          onSelectMonth={setSelectedMonthKey}
          isMounted={isMounted}
          onNavigateAction={onNavigateAction}
        />
      ) : (
        <DashboardCurrentBalance
          data={cycleData}
          latestClosing={latestClosing}
          viewScope={viewScope}
          onChangeScope={setViewScope}
          isMounted={isMounted}
          onNavigateAction={onNavigateAction}
        />
      )}
    </div>
  );
};

export default Dashboard;
