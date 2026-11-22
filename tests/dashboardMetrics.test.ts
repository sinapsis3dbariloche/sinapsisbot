import { describe, it, expect } from 'vitest';
import {
  calculateCurrentMonthDashboard,
  calculateCycleDashboard,
  getAvailableDashboardMonths
} from '../services/dashboardMetrics';
import { Remito, Expense, Quote } from '../types';

describe('Dashboard Metrics (Mes en Curso & Balance en Curso)', () => {
  const referenceDate = new Date(2026, 10, 15, 12, 0, 0); // 2026-11-15 (Nov 2026)

  const sampleRemitos: Remito[] = [
    // Prior-month remito partially paid in Oct and partially paid in Nov, still has $20k debt
    {
      id: 'r-oct-carry',
      number: '0001-0010',
      customerId: 'c1',
      customerName: 'Cliente Histórico',
      date: '2026-10-10',
      total: 100000,
      amountPaid: 80000,
      status: 'Parcial',
      productionStatus: 'Entregada',
      items: [],
      createdAt: '2026-10-10',
      paymentHistory: [
        { amount: 50000, date: '2026-10-10' },
        { amount: 30000, date: '2026-11-04' }
      ]
    },
    // Current-month remito fully paid on Nov 6
    {
      id: 'r-nov-paid',
      number: '0001-0011',
      customerId: 'c2',
      customerName: 'Cliente Noviembre',
      date: '2026-11-05',
      total: 60000,
      amountPaid: 60000,
      status: 'Pagado',
      productionStatus: 'Para entregar',
      items: [],
      createdAt: '2026-11-05',
      paymentHistory: [{ amount: 60000, date: '2026-11-06' }]
    },
    // Current-month remito unpaid (in production)
    {
      id: 'r-nov-unpaid',
      number: '0001-0012',
      customerId: 'c3',
      customerName: 'Cliente Deudor Nuevo',
      date: '2026-11-10',
      total: 40000,
      amountPaid: 10000,
      status: 'Parcial',
      productionStatus: 'En Producción',
      items: [],
      createdAt: '2026-11-10',
      paymentHistory: [{ amount: 10000, date: '2026-11-10' }]
    },
    // Draft remito (must not affect official cash/billing, must appear in drafts alert)
    {
      id: 'r-draft',
      number: '0001-0013',
      customerId: 'c3',
      customerName: 'Cliente Borrador',
      date: '2026-11-12',
      total: 25000,
      amountPaid: 0,
      status: 'Pendiente',
      productionStatus: 'En Producción',
      items: [],
      createdAt: '2026-11-12',
      isDraft: true
    }
  ];

  const sampleExpenses: Expense[] = [
    {
      id: 'e-oct',
      date: '2026-10-15',
      supplierId: 's1',
      supplierName: 'Proveedor Viejo',
      items: [],
      total: 70000,
      createdAt: '2026-10-15'
    },
    {
      id: 'e-nov-1',
      date: '2026-11-04',
      supplierId: 's2',
      supplierName: 'Proveedor Filamento',
      items: [],
      total: 25000,
      createdAt: '2026-11-04'
    },
    {
      id: 'e-nov-2',
      date: '2026-11-10',
      supplierId: 's2',
      supplierName: 'Proveedor Filamento',
      items: [],
      total: 15000,
      createdAt: '2026-11-10'
    },
    {
      id: 'e-draft',
      date: '2026-11-12',
      supplierId: 's3',
      supplierName: 'Proveedor Borrador',
      items: [],
      total: 9000,
      createdAt: '2026-11-12',
      isDraft: true
    }
  ];

  const sampleQuotes: Quote[] = [
    {
      id: 'q1',
      number: 'P-001',
      customerId: 'c1',
      customerName: 'Cliente Histórico',
      date: '2026-10-05',
      items: [],
      total: 20000,
      status: 'confirmado',
      confirmedAt: '2026-10-06',
      createdAt: '2026-10-05'
    },
    {
      id: 'q2',
      number: 'P-002',
      customerId: 'c2',
      customerName: 'Cliente Noviembre',
      date: '2026-11-03',
      items: [],
      total: 55000,
      status: 'presupuestado',
      createdAt: '2026-11-03'
    },
    {
      id: 'q3',
      number: 'P-003',
      customerId: 'c3',
      customerName: 'Cliente Deudor Nuevo',
      date: '2026-11-08',
      items: [],
      total: 12000,
      status: 'borrador',
      createdAt: '2026-11-08'
    }
  ];

  it('computes current month KPIs, cross-month payments, receivables carry-over, and drafts', () => {
    const data = calculateCurrentMonthDashboard({
      remitos: sampleRemitos,
      expenses: sampleExpenses,
      quotes: sampleQuotes,
      monthKey: '2026-11',
      referenceDate
    });

    // Cash collected in Nov: 30k (from Oct sale) + 60k (Nov) + 10k (Nov) = 100k
    expect(data.collectedTotal).toBe(100000);
    expect(data.collectedFromPriorMonths).toBe(30000);
    expect(data.collectedFromCurrentMonthSales).toBe(70000);

    // Billed in Nov: 60k + 40k = 100k (draft excluded)
    expect(data.billedTotal).toBe(100000);
    expect(data.billedCount).toBe(2);
    expect(data.billedCollectionRate).toBe(70);

    // Expenses in Nov: 25k + 15k = 40k (draft excluded)
    expect(data.expensesTotal).toBe(40000);
    expect(data.expensesCount).toBe(2);

    // Net balance: 100k - 40k = 60k
    expect(data.netBalance).toBe(60000);

    // Pending receivables breakdown: Oct carry-over 20k + Nov unpaid 30k = 50k total
    expect(data.receivables.totalPending).toBe(50000);
    expect(data.receivables.priorMonthsPending).toBe(20000);
    expect(data.receivables.priorMonthsCount).toBe(1);
    expect(data.receivables.currentMonthPending).toBe(30000);
    expect(data.receivables.currentMonthCount).toBe(1);

    // Projected balance: 60k + 50k = 110k
    expect(data.projectedBalance).toBe(110000);

    // Operational factors & drafts
    expect(data.operations.inProductionCount).toBe(2); // r-nov-unpaid + r-draft
    expect(data.operations.inProductionPendingAmount).toBe(30000);
    expect(data.operations.readyToDeliverCount).toBe(1);
    expect(data.operations.quotesToDoCount).toBe(1);
    expect(data.operations.quotesPendingCount).toBe(1);
    expect(data.operations.quotesPendingAmount).toBe(55000);
    expect(data.operations.draftRemitosCount).toBe(1);
    expect(data.operations.draftRemitosAmount).toBe(25000);
    expect(data.operations.draftExpensesCount).toBe(1);
    expect(data.operations.draftExpensesAmount).toBe(9000);

    // Monthly rankings
    expect(data.topPayers[0].name).toBe('Cliente Noviembre');
    expect(data.topPayers[0].amount).toBe(60000);
    expect(data.topSuppliers[0].name).toBe('Proveedor Filamento');
    expect(data.topSuppliers[0].amount).toBe(40000);
    expect(data.topDebtors).toHaveLength(2);
    expect(data.topDebtors[0].name).toBe('Cliente Deudor Nuevo');
    expect(data.topDebtors[1].name).toBe('Cliente Histórico');
    expect(data.topDebtors[1].hasPriorDebt).toBe(true);
    expect(data.topDebtors[1].priorDebt).toBe(20000);
  });

  it('builds a complete 30-day series with daily bars and cumulative lines stopping at today', () => {
    const data = calculateCurrentMonthDashboard({
      remitos: sampleRemitos,
      expenses: sampleExpenses,
      quotes: sampleQuotes,
      monthKey: '2026-11',
      referenceDate
    });

    expect(data.daysInMonth).toBe(30);
    expect(data.dailySeries).toHaveLength(30);
    expect(data.activeDaysCount).toBe(3); // Nov 4, Nov 6, Nov 10

    // Day 4: +30k cobros, +25k gastos
    const day4 = data.dailySeries[3];
    expect(day4.dayLabel).toBe('04');
    expect(day4.cobrosDia).toBe(30000);
    expect(day4.gastosDia).toBe(25000);
    expect(day4.cobrosAcum).toBe(30000);
    expect(day4.gastosAcum).toBe(25000);
    expect(day4.balanceAcum).toBe(5000);

    // Day 6: +60k cobros -> cumulative 90k
    const day6 = data.dailySeries[5];
    expect(day6.cobrosDia).toBe(60000);
    expect(day6.cobrosAcum).toBe(90000);
    expect(day6.gastosAcum).toBe(25000);

    // Day 15 (today): flagged as isToday, cumulative equals full month-to-date
    const day15 = data.dailySeries[14];
    expect(day15.isToday).toBe(true);
    expect(day15.cobrosAcum).toBe(100000);
    expect(day15.gastosAcum).toBe(40000);

    // Day 16 (future day): cumulative lines are null so line doesn't draw flat into the future
    const day16 = data.dailySeries[15];
    expect(day16.cobrosAcum).toBeNull();
    expect(day16.gastosAcum).toBeNull();
    expect(day16.balanceAcum).toBeNull();
  });

  it('scopes Balance en Curso monthly chart, rankings, and quotes strictly after lastClosingDate', () => {
    const cycle = calculateCycleDashboard({
      remitos: sampleRemitos,
      expenses: sampleExpenses,
      quotes: sampleQuotes,
      lastClosingDate: '2026-10-31',
      isAllTime: false,
      referenceDate
    });

    expect(cycle.isCycleActive).toBe(true);
    expect(cycle.totalCollected).toBe(100000); // Only Nov payments (includes 30k payment for Oct debt)
    expect(cycle.totalBilled).toBe(100000); // Only Nov emitted remitos
    expect(cycle.totalExpenses).toBe(40000); // Only Nov expenses
    expect(cycle.netBalance).toBe(60000);
    expect(cycle.totalPending).toBe(50000); // Live debt remains alive across closing
    expect(cycle.projectedBalance).toBe(110000);

    // Monthly series starts after 2026-10-31 -> only 2026-11
    expect(cycle.monthlySeries).toHaveLength(1);
    expect(cycle.monthlySeries[0].monthKey).toBe('2026-11');
    expect(cycle.monthlySeries[0].cobros).toBe(100000);
    expect(cycle.monthlySeries[0].gastos).toBe(40000);

    // Quotes scoped to cycle exclude Oct confirmed quote
    expect(cycle.quotesStats.confirmado).toBe(0);
    expect(cycle.quotesStats.presupuestado).toBe(1);
    expect(cycle.quotesStats.borrador).toBe(1);

    // Rankings scoped to cycle exclude Oct supplier
    expect(cycle.topSuppliers).toHaveLength(1);
    expect(cycle.topSuppliers[0].name).toBe('Proveedor Filamento');
  });

  it('returns available months sorted descending including current month', () => {
    const months = getAvailableDashboardMonths(sampleRemitos, sampleExpenses, referenceDate);
    expect(months).toEqual(['2026-11', '2026-10']);
  });
});
