import { Remito, Expense, Quote, BalanceClosing, DebtorSummary } from '../types';

/**
 * Normalizes a date string or timestamp to a comparable YYYY-MM-DD format
 */
export const normalizeDateString = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  // Handles YYYY-MM-DD or ISO strings like 2026-09-29T11:55:45
  return dateStr.slice(0, 10);
};

export interface BalancePeriodParams {
  remitos: Remito[];
  expenses: Expense[];
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  name?: string;
  closedBy?: string;
  notes?: string;
  id?: string;
}

/**
 * Calculates a complete balance for a custom date period.
 * Pure function: deterministic, side-effect free, easily testable.
 */
export const calculateBalancePeriod = ({
  remitos,
  expenses,
  startDate,
  endDate,
  name = 'Balance',
  closedBy = 'Sistema',
  notes = '',
  id = ''
}: BalancePeriodParams): BalanceClosing => {
  const normStart = normalizeDateString(startDate);
  const normEnd = normalizeDateString(endDate);

  let totalIncome = 0;
  let totalBilled = 0;
  let remitosCount = 0;

  // 1. Calculate Real Income & Billed Remitos within [normStart, normEnd]
  remitos.forEach(r => {
    if (r.isDraft) return;

    const remitoDate = normalizeDateString(r.date);
    const isEmittedInPeriod = remitoDate >= normStart && remitoDate <= normEnd;

    if (isEmittedInPeriod) {
      totalBilled += r.total || 0;
      remitosCount++;
    }

    // Process payment history for exact cash flow timing
    if (r.paymentHistory && r.paymentHistory.length > 0) {
      r.paymentHistory.forEach(p => {
        const paymentDate = normalizeDateString(p.date);
        if (paymentDate >= normStart && paymentDate <= normEnd) {
          totalIncome += p.amount || 0;
        }
      });
    } else if (r.amountPaid && r.amountPaid > 0) {
      // Fallback: If no payment history exists, use the remito date
      if (isEmittedInPeriod) {
        totalIncome += r.amountPaid;
      }
    }
  });

  // 2. Calculate Expenses within [normStart, normEnd]
  let totalExpenses = 0;
  let expensesCount = 0;

  expenses.forEach(e => {
    if (e.isDraft) return;

    const expenseDate = normalizeDateString(e.date);
    if (expenseDate >= normStart && expenseDate <= normEnd) {
      totalExpenses += e.total || 0;
      expensesCount++;
    }
  });

  // 3. Financial Result Calculation (Liquidated)
  const netResult = totalIncome - totalExpenses;
  let resultType: 'PROFIT' | 'LOSS' | 'BREAKEVEN' = 'BREAKEVEN';
  if (netResult > 0) resultType = 'PROFIT';
  else if (netResult < 0) resultType = 'LOSS';

  // 4. Calculate Pending Receivables (Portfolio of debtors that passes forward)
  // Evaluates outstanding debts on non-draft remitos
  const customerDebts: Record<string, { customerName: string; debt: number }> = {};
  let pendingReceivablesAtClose = 0;

  remitos.forEach(r => {
    if (r.isDraft) return;
    const debt = (r.total || 0) - (r.amountPaid || 0);
    if (debt > 0) {
      pendingReceivablesAtClose += debt;
      if (!customerDebts[r.customerId]) {
        customerDebts[r.customerId] = { customerName: r.customerName, debt: 0 };
      }
      customerDebts[r.customerId].debt += debt;
    }
  });

  const debtorsSummary: DebtorSummary[] = Object.entries(customerDebts)
    .map(([customerId, data]) => ({
      customerId,
      customerName: data.customerName,
      debt: data.debt
    }))
    .sort((a, b) => b.debt - a.debt);

  return {
    id: id || `balance-${Date.now()}`,
    name,
    startDate: normStart,
    endDate: normEnd,
    closedAt: new Date().toISOString(),
    closedBy,
    totalIncome,
    totalExpenses,
    netResult,
    resultType,
    totalBilled,
    remitosCount,
    expensesCount,
    pendingReceivablesAtClose,
    debtorsSummary,
    notes
  };
};

export interface DashboardMetricsParams {
  remitos: Remito[];
  expenses: Expense[];
  quotes: Quote[];
  lastClosingDate?: string | null; // YYYY-MM-DD or ISO of the most recent closed balance
  isAllTime?: boolean;
}

export interface DashboardFinancialMetrics {
  totalCollected: number;
  totalExpenses: number;
  balance: number;
  totalPending: number;
  cycleStartDate: string | null;
  isCycleActive: boolean;
  topDebtors: DebtorSummary[];
  periodEmittedTotal: number;
}

/**
 * Calculates dashboard metrics respecting the last closed balance.
 * When a closing exists, cash, income, and expenses reset to 0 for the open period,
 * while accounts receivable remain alive.
 */
export const calculateDashboardFinancials = ({
  remitos,
  expenses,
  lastClosingDate = null,
  isAllTime = false
}: DashboardMetricsParams): DashboardFinancialMetrics => {
  const normClosingDate = (!isAllTime && lastClosingDate) ? normalizeDateString(lastClosingDate) : null;
  const isCycleActive = Boolean(normClosingDate);

  let totalCollected = 0;
  let totalExpenses = 0;
  let totalPending = 0;
  let periodEmittedTotal = 0;

  const customerDebts: Record<string, { customerName: string; debt: number }> = {};

  // Process Remitos & Income
  remitos.forEach(r => {
    if (r.isDraft) return;

    const rDate = normalizeDateString(r.date);

    // Debt remains active across all open remitos (debt is never wiped by closing)
    const pending = (r.total || 0) - (r.amountPaid || 0);
    if (pending > 0) {
      totalPending += pending;
      if (!customerDebts[r.customerId]) {
        customerDebts[r.customerId] = { customerName: r.customerName, debt: 0 };
      }
      customerDebts[r.customerId].debt += pending;
    }

    // Remitos emitted in the active cycle
    if (!normClosingDate || rDate > normClosingDate) {
      periodEmittedTotal += r.total || 0;
    }

    // Collected cash in the active cycle
    if (r.paymentHistory && r.paymentHistory.length > 0) {
      r.paymentHistory.forEach(p => {
        const paymentDate = normalizeDateString(p.date);
        if (!normClosingDate || paymentDate > normClosingDate) {
          totalCollected += p.amount || 0;
        }
      });
    } else if (r.amountPaid && r.amountPaid > 0) {
      if (!normClosingDate || rDate > normClosingDate) {
        totalCollected += r.amountPaid;
      }
    }
  });

  // Process Expenses
  expenses.forEach(e => {
    if (e.isDraft) return;

    const eDate = normalizeDateString(e.date);
    if (!normClosingDate || eDate > normClosingDate) {
      totalExpenses += e.total || 0;
    }
  });

  const topDebtors: DebtorSummary[] = Object.entries(customerDebts)
    .map(([customerId, data]) => ({
      customerId,
      customerName: data.customerName,
      debt: data.debt
    }))
    .sort((a, b) => b.debt - a.debt);

  return {
    totalCollected,
    totalExpenses,
    balance: totalCollected - totalExpenses,
    totalPending,
    cycleStartDate: normClosingDate,
    isCycleActive,
    topDebtors,
    periodEmittedTotal
  };
};
