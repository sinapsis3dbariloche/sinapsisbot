import { Remito, Expense, Quote } from '../types';
import { calculateDashboardFinancials, normalizeDateString } from './balanceCalculator';

export interface RankingEntry {
  id: string;
  entityId: string;
  name: string;
  amount: number;
}

export interface DebtorRankingEntry {
  id: string;
  customerId: string;
  name: string;
  debt: number;
  priorDebt: number;
  currentMonthDebt: number;
  hasPriorDebt: boolean;
}

export interface DailyChartPoint {
  day: number;
  dayLabel: string;
  date: string; // YYYY-MM-DD
  cobrosDia: number;
  gastosDia: number;
  cobrosCount: number;
  gastosCount: number;
  cobrosAcum: number | null;
  gastosAcum: number | null;
  balanceAcum: number | null;
  isToday: boolean;
}

export interface CurrentMonthDashboardData {
  monthKey: string; // YYYY-MM
  isCurrentMonth: boolean;
  todayDay: number | null;
  daysInMonth: number;
  collectedTotal: number;
  collectedFromCurrentMonthSales: number;
  collectedFromPriorMonths: number;
  billedTotal: number;
  billedCount: number;
  billedCollectedSoFar: number;
  billedCollectionRate: number;
  expensesTotal: number;
  expensesCount: number;
  netBalance: number;
  projectedBalance: number;
  receivables: {
    totalPending: number;
    totalPendingCount: number;
    priorMonthsPending: number;
    priorMonthsCount: number;
    currentMonthPending: number;
    currentMonthCount: number;
    otherMonthsPending: number;
  };
  operations: {
    inProductionCount: number;
    inProductionPendingAmount: number;
    readyToDeliverCount: number;
    readyToDeliverPendingAmount: number;
    quotesToDoCount: number;
    quotesPendingCount: number;
    quotesPendingAmount: number;
    draftRemitosCount: number;
    draftRemitosAmount: number;
    draftExpensesCount: number;
    draftExpensesAmount: number;
  };
  dailySeries: DailyChartPoint[];
  hasActivity: boolean;
  activeDaysCount: number;
  topPayers: RankingEntry[];
  topSuppliers: RankingEntry[];
  topDebtors: DebtorRankingEntry[];
}

export interface MonthlyChartPoint {
  monthKey: string; // YYYY-MM
  cobros: number;
  gastos: number;
  balance: number;
  balanceAcum: number;
}

export interface CycleDashboardData {
  isCycleActive: boolean;
  cycleStartDate: string | null;
  totalCollected: number;
  totalBilled: number;
  remitosCount: number;
  totalExpenses: number;
  expensesCount: number;
  netBalance: number;
  totalPending: number;
  projectedBalance: number;
  quotesStats: {
    borrador: number;
    presupuestado: number;
    confirmado: number;
    total: number;
    conversionRate: number;
  };
  ventasStats: {
    enProduccion: number;
    paraEntregar: number;
    entregadas: number;
  };
  monthlySeries: MonthlyChartPoint[];
  topPayers: RankingEntry[];
  topSuppliers: RankingEntry[];
  topDebtors: { id: string; customerId: string; name: string; debt: number }[];
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export const getLocalDateParts = (referenceDate: Date = new Date()) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;
  const day = referenceDate.getDate();
  return {
    year,
    month,
    day,
    monthKey: `${year}-${pad2(month)}`,
    dateStr: `${year}-${pad2(month)}-${pad2(day)}`
  };
};

const getDaysInMonthKey = (monthKey: string): number => {
  const [yStr, mStr] = monthKey.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  if (!year || !month) return 30;
  return new Date(year, month, 0).getDate();
};

const getNextDayMonthKey = (dateStr: string): string => {
  const [yStr, mStr, dStr] = dateStr.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (!year || !month || !day) return dateStr.slice(0, 7);
  const next = new Date(year, month - 1, day + 1);
  return `${next.getFullYear()}-${pad2(next.getMonth() + 1)}`;
};

const generateMonthRange = (startMonthKey: string, endMonthKey: string): string[] => {
  const [sy, sm] = startMonthKey.split('-').map(Number);
  const [ey, em] = endMonthKey.split('-').map(Number);
  if (!sy || !sm || !ey || !em) return [endMonthKey];

  const months: string[] = [];
  let y = sy;
  let m = sm;
  let safety = 0;

  while ((y < ey || (y === ey && m <= em)) && safety < 120) {
    months.push(`${y}-${pad2(m)}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    safety += 1;
  }

  return months.length > 0 ? months : [endMonthKey];
};

/**
 * Extracts normalized cash payment events for an emitted remito.
 * Falls back to remito date + amountPaid when paymentHistory is absent.
 */
const getRemitoPayments = (remito: Remito): { date: string; amount: number }[] => {
  if (remito.isDraft) return [];
  if (remito.paymentHistory && remito.paymentHistory.length > 0) {
    return remito.paymentHistory
      .map(p => ({ date: normalizeDateString(p.date), amount: Number(p.amount) || 0 }))
      .filter(p => p.date && p.amount > 0);
  }
  const paid = Number(remito.amountPaid) || 0;
  if (paid > 0) {
    const rDate = normalizeDateString(remito.date);
    if (rDate) return [{ date: rDate, amount: paid }];
  }
  return [];
};

/**
 * Returns all months (YYYY-MM) with activity (payments, remitos, expenses) plus the current month,
 * sorted descending (newest first).
 */
export const getAvailableDashboardMonths = (
  remitos: Remito[],
  expenses: Expense[],
  referenceDate: Date = new Date()
): string[] => {
  const { monthKey: currentMonthKey } = getLocalDateParts(referenceDate);
  const months = new Set<string>([currentMonthKey]);

  remitos.forEach(r => {
    if (r.isDraft) return;
    const rDate = normalizeDateString(r.date);
    if (rDate.length >= 7) months.add(rDate.slice(0, 7));
    getRemitoPayments(r).forEach(p => {
      if (p.date.length >= 7) months.add(p.date.slice(0, 7));
    });
  });

  expenses.forEach(e => {
    if (e.isDraft) return;
    const eDate = normalizeDateString(e.date);
    if (eDate.length >= 7) months.add(eDate.slice(0, 7));
  });

  return Array.from(months).sort((a, b) => b.localeCompare(a));
};

/**
 * Computes all KPIs, cross-month receivables breakdown, operational impact,
 * daily bars + cumulative lines series, and rankings for the Current Month view.
 */
export const calculateCurrentMonthDashboard = ({
  remitos,
  expenses,
  quotes,
  monthKey,
  referenceDate = new Date()
}: {
  remitos: Remito[];
  expenses: Expense[];
  quotes: Quote[];
  monthKey: string;
  referenceDate?: Date;
}): CurrentMonthDashboardData => {
  const today = getLocalDateParts(referenceDate);
  const isCurrentMonth = monthKey === today.monthKey;
  const daysInMonth = getDaysInMonthKey(monthKey);
  const monthStart = `${monthKey}-01`;
  const monthEnd = `${monthKey}-${pad2(daysInMonth)}`;
  const todayDay = isCurrentMonth ? Math.min(today.day, daysInMonth) : null;

  let collectedTotal = 0;
  let collectedFromCurrentMonthSales = 0;
  let collectedFromPriorMonths = 0;
  let billedTotal = 0;
  let billedCount = 0;
  let billedCollectedSoFar = 0;

  let totalPending = 0;
  let totalPendingCount = 0;
  let priorMonthsPending = 0;
  let priorMonthsCount = 0;
  let currentMonthPending = 0;
  let currentMonthCount = 0;
  let otherMonthsPending = 0;

  let inProductionCount = 0;
  let inProductionPendingAmount = 0;
  let readyToDeliverCount = 0;
  let readyToDeliverPendingAmount = 0;
  let draftRemitosCount = 0;
  let draftRemitosAmount = 0;

  const dailyBuckets: Record<string, { cobros: number; gastos: number; cobrosCount: number; gastosCount: number }> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${monthKey}-${pad2(d)}`;
    dailyBuckets[key] = { cobros: 0, gastos: 0, cobrosCount: 0, gastosCount: 0 };
  }

  const monthPayers: Record<string, { customerId: string; name: string; amount: number }> = {};
  const monthSuppliers: Record<string, { supplierId: string; name: string; amount: number }> = {};
  const debtorMap: Record<string, { customerId: string; name: string; debt: number; priorDebt: number; currentMonthDebt: number }> = {};

  remitos.forEach(r => {
    const rTotal = Number(r.total) || 0;
    const rPaid = Number(r.amountPaid) || 0;
    const pending = Math.max(0, rTotal - rPaid);
    const prodStatus = r.productionStatus || 'Entregada';

    if (prodStatus === 'En Producción') {
      inProductionCount += 1;
      if (!r.isDraft) inProductionPendingAmount += pending;
    } else if (prodStatus === 'Para entregar') {
      readyToDeliverCount += 1;
      if (!r.isDraft) readyToDeliverPendingAmount += pending;
    }

    if (r.isDraft) {
      draftRemitosCount += 1;
      draftRemitosAmount += rTotal;
      return;
    }

    const rDate = normalizeDateString(r.date);
    const isEmittedInMonth = rDate >= monthStart && rDate <= monthEnd;
    const isEmittedBeforeMonth = Boolean(rDate) && rDate < monthStart;

    if (isEmittedInMonth) {
      billedTotal += rTotal;
      billedCount += 1;
      billedCollectedSoFar += Math.min(rPaid, rTotal);
    }

    // Live open receivables (always alive across months)
    if (pending > 0) {
      totalPending += pending;
      totalPendingCount += 1;

      if (!debtorMap[r.customerId]) {
        debtorMap[r.customerId] = {
          customerId: r.customerId,
          name: r.customerName,
          debt: 0,
          priorDebt: 0,
          currentMonthDebt: 0
        };
      }
      debtorMap[r.customerId].debt += pending;

      if (isEmittedBeforeMonth) {
        priorMonthsPending += pending;
        priorMonthsCount += 1;
        debtorMap[r.customerId].priorDebt += pending;
      } else if (isEmittedInMonth) {
        currentMonthPending += pending;
        currentMonthCount += 1;
        debtorMap[r.customerId].currentMonthDebt += pending;
      } else {
        otherMonthsPending += pending;
      }
    }

    // Cash collections occurring inside the selected month
    getRemitoPayments(r).forEach(p => {
      if (p.date >= monthStart && p.date <= monthEnd) {
        collectedTotal += p.amount;
        if (isEmittedBeforeMonth) {
          collectedFromPriorMonths += p.amount;
        } else if (isEmittedInMonth) {
          collectedFromCurrentMonthSales += p.amount;
        }

        if (dailyBuckets[p.date]) {
          dailyBuckets[p.date].cobros += p.amount;
          dailyBuckets[p.date].cobrosCount += 1;
        }

        if (!monthPayers[r.customerId]) {
          monthPayers[r.customerId] = { customerId: r.customerId, name: r.customerName, amount: 0 };
        }
        monthPayers[r.customerId].amount += p.amount;
      }
    });
  });

  // Expenses
  let expensesTotal = 0;
  let expensesCount = 0;
  let draftExpensesCount = 0;
  let draftExpensesAmount = 0;

  expenses.forEach(e => {
    const eTotal = Number(e.total) || 0;
    if (e.isDraft) {
      draftExpensesCount += 1;
      draftExpensesAmount += eTotal;
      return;
    }

    const eDate = normalizeDateString(e.date);
    if (eDate >= monthStart && eDate <= monthEnd) {
      expensesTotal += eTotal;
      expensesCount += 1;

      if (dailyBuckets[eDate]) {
        dailyBuckets[eDate].gastos += eTotal;
        dailyBuckets[eDate].gastosCount += 1;
      }

      if (!monthSuppliers[e.supplierId]) {
        monthSuppliers[e.supplierId] = { supplierId: e.supplierId, name: e.supplierName, amount: 0 };
      }
      monthSuppliers[e.supplierId].amount += eTotal;
    }
  });

  // Open quotes impacting upcoming revenue
  let quotesToDoCount = 0;
  let quotesPendingCount = 0;
  let quotesPendingAmount = 0;

  quotes.forEach(q => {
    const status = q.status || (q.isDraft ? 'borrador' : 'presupuestado');
    if (status === 'borrador') {
      quotesToDoCount += 1;
    } else if (status === 'presupuestado') {
      quotesPendingCount += 1;
      quotesPendingAmount += Number(q.total) || 0;
    }
  });

  // Build daily series (1..daysInMonth) with running cumulative totals
  let runningCobros = 0;
  let runningGastos = 0;
  let activeDaysCount = 0;

  // Determine if any data exists past today in current month (e.g. future-dated entries)
  let lastDataDayInCurrentMonth = todayDay || daysInMonth;
  if (isCurrentMonth && todayDay !== null) {
    for (let d = todayDay + 1; d <= daysInMonth; d++) {
      const b = dailyBuckets[`${monthKey}-${pad2(d)}`];
      if (b && (b.cobros > 0 || b.gastos > 0)) {
        lastDataDayInCurrentMonth = d;
      }
    }
  }

  const dailySeries: DailyChartPoint[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${monthKey}-${pad2(d)}`;
    const bucket = dailyBuckets[dateKey];
    if (bucket.cobros > 0 || bucket.gastos > 0) {
      activeDaysCount += 1;
    }

    const isFutureDay = isCurrentMonth && d > lastDataDayInCurrentMonth;
    runningCobros += bucket.cobros;
    runningGastos += bucket.gastos;

    dailySeries.push({
      day: d,
      dayLabel: pad2(d),
      date: dateKey,
      cobrosDia: bucket.cobros,
      gastosDia: bucket.gastos,
      cobrosCount: bucket.cobrosCount,
      gastosCount: bucket.gastosCount,
      cobrosAcum: isFutureDay ? null : runningCobros,
      gastosAcum: isFutureDay ? null : runningGastos,
      balanceAcum: isFutureDay ? null : runningCobros - runningGastos,
      isToday: isCurrentMonth && d === todayDay
    });
  }

  const netBalance = collectedTotal - expensesTotal;
  const projectedBalance = netBalance + totalPending;
  const billedCollectionRate = billedTotal > 0 ? Math.round((billedCollectedSoFar / billedTotal) * 100) : 0;

  const topPayers: RankingEntry[] = Object.values(monthPayers)
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((c, idx) => ({ id: `month-payer-${idx}`, entityId: c.customerId, name: c.name, amount: c.amount }));

  const topSuppliers: RankingEntry[] = Object.values(monthSuppliers)
    .filter(s => s.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((s, idx) => ({ id: `month-supplier-${idx}`, entityId: s.supplierId, name: s.name, amount: s.amount }));

  const topDebtors: DebtorRankingEntry[] = Object.values(debtorMap)
    .filter(d => d.debt > 0)
    .sort((a, b) => b.debt - a.debt)
    .slice(0, 5)
    .map((d, idx) => ({
      id: `month-debtor-${idx}`,
      customerId: d.customerId,
      name: d.name,
      debt: d.debt,
      priorDebt: d.priorDebt,
      currentMonthDebt: d.currentMonthDebt,
      hasPriorDebt: d.priorDebt > 0
    }));

  return {
    monthKey,
    isCurrentMonth,
    todayDay,
    daysInMonth,
    collectedTotal,
    collectedFromCurrentMonthSales,
    collectedFromPriorMonths,
    billedTotal,
    billedCount,
    billedCollectedSoFar,
    billedCollectionRate,
    expensesTotal,
    expensesCount,
    netBalance,
    projectedBalance,
    receivables: {
      totalPending,
      totalPendingCount,
      priorMonthsPending,
      priorMonthsCount,
      currentMonthPending,
      currentMonthCount,
      otherMonthsPending
    },
    operations: {
      inProductionCount,
      inProductionPendingAmount,
      readyToDeliverCount,
      readyToDeliverPendingAmount,
      quotesToDoCount,
      quotesPendingCount,
      quotesPendingAmount,
      draftRemitosCount,
      draftRemitosAmount,
      draftExpensesCount,
      draftExpensesAmount
    },
    dailySeries,
    hasActivity: collectedTotal > 0 || expensesTotal > 0,
    activeDaysCount,
    topPayers,
    topSuppliers,
    topDebtors
  };
};

/**
 * Computes all KPIs, cycle-scoped monthly chart, operational counters,
 * and rankings for the Current Balance (Balance en Curso) view.
 */
export const calculateCycleDashboard = ({
  remitos,
  expenses,
  quotes,
  lastClosingDate = null,
  isAllTime = false,
  referenceDate = new Date()
}: {
  remitos: Remito[];
  expenses: Expense[];
  quotes: Quote[];
  lastClosingDate?: string | null;
  isAllTime?: boolean;
  referenceDate?: Date;
}): CycleDashboardData => {
  const base = calculateDashboardFinancials({
    remitos,
    expenses,
    quotes,
    lastClosingDate,
    isAllTime
  });

  const normClosingDate = base.cycleStartDate;
  const isCycleActive = base.isCycleActive;
  const { monthKey: currentMonthKey } = getLocalDateParts(referenceDate);

  const isInScopeDate = (dateStr: string) => {
    if (!dateStr) return false;
    return !normClosingDate || dateStr > normClosingDate;
  };

  // Quotes scoped to cycle
  const quotesStats = { borrador: 0, presupuestado: 0, confirmado: 0, total: 0, conversionRate: 0 };
  quotes.forEach(q => {
    const qDate = normalizeDateString(q.date || q.createdAt);
    const status = q.status || (q.isDraft ? 'borrador' : 'presupuestado');
    // Keep open draft/quoted quotes visible if in scope or active; confirmed strictly by cycle
    if (isCycleActive && status === 'confirmado' && !isInScopeDate(normalizeDateString(q.confirmedAt || q.date || q.createdAt))) {
      return;
    }
    if (isCycleActive && status !== 'confirmado' && qDate && !isInScopeDate(qDate)) {
      return;
    }

    if (status === 'borrador') quotesStats.borrador += 1;
    else if (status === 'presupuestado') quotesStats.presupuestado += 1;
    else if (status === 'confirmado') quotesStats.confirmado += 1;
  });
  quotesStats.total = quotesStats.borrador + quotesStats.presupuestado + quotesStats.confirmado;
  const decidedQuotes = quotesStats.presupuestado + quotesStats.confirmado;
  quotesStats.conversionRate = decidedQuotes > 0 ? Math.round((quotesStats.confirmado / decidedQuotes) * 100) : 0;

  // Ventas / production & cycle rankings + monthly maps
  const ventasStats = { enProduccion: 0, paraEntregar: 0, entregadas: 0 };
  let remitosCount = 0;
  let expensesCount = 0;

  const monthlyIncome: Record<string, number> = {};
  const monthlyExpenses: Record<string, number> = {};
  const cyclePayers: Record<string, { customerId: string; name: string; amount: number }> = {};
  const cycleSuppliers: Record<string, { supplierId: string; name: string; amount: number }> = {};

  let earliestActivityMonth: string | null = null;
  const trackMonth = (mKey: string) => {
    if (!mKey || mKey.length < 7) return;
    if (!earliestActivityMonth || mKey < earliestActivityMonth) {
      earliestActivityMonth = mKey;
    }
  };

  remitos.forEach(r => {
    const rDate = normalizeDateString(r.date);
    const prodStatus = r.productionStatus || 'Entregada';

    if (prodStatus === 'En Producción') {
      ventasStats.enProduccion += 1;
    } else if (prodStatus === 'Para entregar') {
      ventasStats.paraEntregar += 1;
    } else if (prodStatus === 'Entregada' && (!isCycleActive || isInScopeDate(rDate))) {
      ventasStats.entregadas += 1;
    }

    if (r.isDraft) return;

    if (isInScopeDate(rDate)) {
      remitosCount += 1;
    }

    getRemitoPayments(r).forEach(p => {
      if (isInScopeDate(p.date)) {
        const mKey = p.date.slice(0, 7);
        monthlyIncome[mKey] = (monthlyIncome[mKey] || 0) + p.amount;
        trackMonth(mKey);

        if (!cyclePayers[r.customerId]) {
          cyclePayers[r.customerId] = { customerId: r.customerId, name: r.customerName, amount: 0 };
        }
        cyclePayers[r.customerId].amount += p.amount;
      }
    });
  });

  expenses.forEach(e => {
    if (e.isDraft) return;
    const eDate = normalizeDateString(e.date);
    if (isInScopeDate(eDate)) {
      expensesCount += 1;
      const mKey = eDate.slice(0, 7);
      monthlyExpenses[mKey] = (monthlyExpenses[mKey] || 0) + (Number(e.total) || 0);
      trackMonth(mKey);

      if (!cycleSuppliers[e.supplierId]) {
        cycleSuppliers[e.supplierId] = { supplierId: e.supplierId, name: e.supplierName, amount: 0 };
      }
      cycleSuppliers[e.supplierId].amount += Number(e.total) || 0;
    }
  });

  // Determine exact month range for the cycle evolution chart
  let startMonthKey: string;
  if (isCycleActive && normClosingDate) {
    startMonthKey = getNextDayMonthKey(normClosingDate);
    if (startMonthKey > currentMonthKey) {
      startMonthKey = currentMonthKey;
    }
  } else if (earliestActivityMonth) {
    startMonthKey = earliestActivityMonth;
  } else {
    // Fallback when database is empty: show current month
    startMonthKey = currentMonthKey;
  }

  // Ensure end month includes any future-dated movement if present
  let endMonthKey = currentMonthKey;
  [...Object.keys(monthlyIncome), ...Object.keys(monthlyExpenses)].forEach(k => {
    if (k > endMonthKey) endMonthKey = k;
  });

  const monthKeys = generateMonthRange(startMonthKey, endMonthKey);
  let runningCycleBalance = 0;

  const monthlySeries: MonthlyChartPoint[] = monthKeys.map(mKey => {
    const cobros = monthlyIncome[mKey] || 0;
    const gastos = monthlyExpenses[mKey] || 0;
    const balance = cobros - gastos;
    runningCycleBalance += balance;
    return {
      monthKey: mKey,
      cobros,
      gastos,
      balance,
      balanceAcum: runningCycleBalance
    };
  });

  const topPayers: RankingEntry[] = Object.values(cyclePayers)
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((c, idx) => ({ id: `cycle-payer-${idx}`, entityId: c.customerId, name: c.name, amount: c.amount }));

  const topSuppliers: RankingEntry[] = Object.values(cycleSuppliers)
    .filter(s => s.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((s, idx) => ({ id: `cycle-supplier-${idx}`, entityId: s.supplierId, name: s.name, amount: s.amount }));

  const topDebtors = base.topDebtors.slice(0, 5).map((d, idx) => ({
    id: `cycle-debtor-${idx}`,
    customerId: d.customerId,
    name: d.customerName,
    debt: d.debt
  }));

  return {
    isCycleActive,
    cycleStartDate: normClosingDate,
    totalCollected: base.totalCollected,
    totalBilled: base.periodEmittedTotal,
    remitosCount,
    totalExpenses: base.totalExpenses,
    expensesCount,
    netBalance: base.balance,
    totalPending: base.totalPending,
    projectedBalance: base.balance + base.totalPending,
    quotesStats,
    ventasStats,
    monthlySeries,
    topPayers,
    topSuppliers,
    topDebtors
  };
};
