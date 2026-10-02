import { describe, it, expect } from 'vitest';
import { 
  calculateBalancePeriod, 
  calculateDashboardFinancials,
  normalizeDateString 
} from '../services/balanceCalculator';
import { Remito, Expense, Quote } from '../types';

describe('Balance Calculator & Financial Logic', () => {

  const sampleCustomers = {
    c1: { id: 'c1', name: 'Empresa Alpha' },
    c2: { id: 'c2', name: 'Taller Beta' },
    c3: { id: 'c3', name: 'Diseños Gamma' }
  };

  it('normalizes various date formats properly to YYYY-MM-DD', () => {
    expect(normalizeDateString('2026-05-15')).toBe('2026-05-15');
    expect(normalizeDateString('2026-10-02T11:42:07-07:00')).toBe('2026-10-02');
    expect(normalizeDateString('')).toBe('');
    expect(normalizeDateString(null)).toBe('');
  });

  it('calculates a period closing with NET PROFIT (Liquidated)', () => {
    const remitos: Remito[] = [
      {
        id: 'r1',
        number: '0001-001',
        customerId: sampleCustomers.c1.id,
        customerName: sampleCustomers.c1.name,
        date: '2025-03-10',
        total: 1000000,
        amountPaid: 1000000,
        status: 'Pagado',
        items: [],
        createdAt: '2025-03-10',
        paymentHistory: [
          { amount: 1000000, date: '2025-03-10' }
        ]
      },
      {
        id: 'r2',
        number: '0001-002',
        customerId: sampleCustomers.c2.id,
        customerName: sampleCustomers.c2.name,
        date: '2025-06-20',
        total: 500000,
        amountPaid: 300000,
        status: 'Parcial',
        items: [],
        createdAt: '2025-06-20',
        paymentHistory: [
          { amount: 300000, date: '2025-06-20' }
        ]
      }
    ];

    const expenses: Expense[] = [
      {
        id: 'e1',
        date: '2025-04-05',
        supplierId: 's1',
        supplierName: 'Filamentos SA',
        items: [],
        total: 600000,
        createdAt: '2025-04-05'
      }
    ];

    const result = calculateBalancePeriod({
      remitos,
      expenses,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      name: 'Ejercicio Anual 2025',
      closedBy: 'admin@sinapsis3d.com'
    });

    // Income: 1.000.000 + 300.000 = 1.300.000
    expect(result.totalIncome).toBe(1300000);
    // Expenses: 600.000
    expect(result.totalExpenses).toBe(600000);
    // Net profit: 1.300.000 - 600.000 = 700.000
    expect(result.netResult).toBe(700000);
    expect(result.resultType).toBe('PROFIT');
    // Emitted: 1.000.000 + 500.000 = 1.500.000
    expect(result.totalBilled).toBe(1500000);
    expect(result.remitosCount).toBe(2);
    expect(result.expensesCount).toBe(1);

    // Debt from r2: 500.000 - 300.000 = 200.000 passes to next period
    expect(result.pendingReceivablesAtClose).toBe(200000);
    expect(result.debtorsSummary).toHaveLength(1);
    expect(result.debtorsSummary[0].customerName).toBe('Taller Beta');
    expect(result.debtorsSummary[0].debt).toBe(200000);
  });

  it('calculates a period closing with NET LOSS', () => {
    const remitos: Remito[] = [
      {
        id: 'r1',
        number: '0001-001',
        customerId: sampleCustomers.c1.id,
        customerName: sampleCustomers.c1.name,
        date: '2025-02-10',
        total: 300000,
        amountPaid: 300000,
        status: 'Pagado',
        items: [],
        createdAt: '2025-02-10'
      }
    ];

    const expenses: Expense[] = [
      {
        id: 'e1',
        date: '2025-03-01',
        supplierId: 's1',
        supplierName: 'Insumos 3D',
        items: [],
        total: 500000,
        createdAt: '2025-03-01'
      }
    ];

    const result = calculateBalancePeriod({
      remitos,
      expenses,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      name: 'Ejercicio Anual 2025'
    });

    expect(result.totalIncome).toBe(300000);
    expect(result.totalExpenses).toBe(500000);
    expect(result.netResult).toBe(-200000);
    expect(result.resultType).toBe('LOSS');
  });

  it('strictly filters custom date ranges (ignores outside movements and drafts)', () => {
    const remitos: Remito[] = [
      // Within range (2025)
      {
        id: 'r_in',
        number: '0001-001',
        customerId: sampleCustomers.c1.id,
        customerName: sampleCustomers.c1.name,
        date: '2025-06-15',
        total: 200000,
        amountPaid: 200000,
        status: 'Pagado',
        items: [],
        createdAt: '2025-06-15',
        paymentHistory: [{ amount: 200000, date: '2025-06-15' }]
      },
      // Before range (2024)
      {
        id: 'r_before',
        number: '0001-002',
        customerId: sampleCustomers.c2.id,
        customerName: sampleCustomers.c2.name,
        date: '2024-12-31',
        total: 500000,
        amountPaid: 500000,
        status: 'Pagado',
        items: [],
        createdAt: '2024-12-31',
        paymentHistory: [{ amount: 500000, date: '2024-12-31' }]
      },
      // After range (2026)
      {
        id: 'r_after',
        number: '0001-003',
        customerId: sampleCustomers.c3.id,
        customerName: sampleCustomers.c3.name,
        date: '2026-01-05',
        total: 700000,
        amountPaid: 700000,
        status: 'Pagado',
        items: [],
        createdAt: '2026-01-05',
        paymentHistory: [{ amount: 700000, date: '2026-01-05' }]
      },
      // Draft in 2025 (must be ignored)
      {
        id: 'r_draft',
        number: '0001-004',
        customerId: sampleCustomers.c1.id,
        customerName: sampleCustomers.c1.name,
        date: '2025-08-20',
        total: 999999,
        amountPaid: 999999,
        status: 'Pagado',
        items: [],
        createdAt: '2025-08-20',
        isDraft: true
      }
    ];

    const expenses: Expense[] = [
      {
        id: 'e_in',
        date: '2025-07-01',
        supplierId: 's1',
        supplierName: 'Proveedor OK',
        items: [],
        total: 80000,
        createdAt: '2025-07-01'
      },
      {
        id: 'e_out_before',
        date: '2024-11-20',
        supplierId: 's1',
        supplierName: 'Proveedor 2024',
        items: [],
        total: 400000,
        createdAt: '2024-11-20'
      },
      {
        id: 'e_draft',
        date: '2025-09-01',
        supplierId: 's1',
        supplierName: 'Gasto Borrador',
        items: [],
        total: 150000,
        createdAt: '2025-09-01',
        isDraft: true
      }
    ];

    const result = calculateBalancePeriod({
      remitos,
      expenses,
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    });

    expect(result.totalIncome).toBe(200000);
    expect(result.totalExpenses).toBe(80000);
    expect(result.netResult).toBe(120000);
    expect(result.remitosCount).toBe(1);
    expect(result.expensesCount).toBe(1);
  });

  it('correctly attributes partial payments made in different years', () => {
    // Remito emitted in 2024, but with payments spread between 2024 and 2025
    const remitos: Remito[] = [
      {
        id: 'r_multi',
        number: '0001-010',
        customerId: sampleCustomers.c1.id,
        customerName: sampleCustomers.c1.name,
        date: '2024-11-01',
        total: 1000000,
        amountPaid: 1000000,
        status: 'Pagado',
        items: [],
        createdAt: '2024-11-01',
        paymentHistory: [
          { amount: 300000, date: '2024-11-01' }, // 2024
          { amount: 400000, date: '2025-02-15' }, // 2025
          { amount: 300000, date: '2025-05-20' }  // 2025
        ]
      }
    ];

    const balance2025 = calculateBalancePeriod({
      remitos,
      expenses: [],
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    });

    // In 2025 only 400.000 + 300.000 = 700.000 was collected
    expect(balance2025.totalIncome).toBe(700000);
    // Billed was 0 in 2025 (since remito date was 2024)
    expect(balance2025.totalBilled).toBe(0);
  });

  it('restarts Dashboard cash and income at $0 after lastClosingDate while preserving active debt', () => {
    const lastClosingDate = '2025-12-31';

    const remitos: Remito[] = [
      // Old remito completely paid in 2025
      {
        id: 'r_old_paid',
        number: '0001-001',
        customerId: sampleCustomers.c1.id,
        customerName: sampleCustomers.c1.name,
        date: '2025-05-10',
        total: 500000,
        amountPaid: 500000,
        status: 'Pagado',
        items: [],
        createdAt: '2025-05-10',
        paymentHistory: [{ amount: 500000, date: '2025-05-10' }]
      },
      // Old remito with pending debt that carried over to 2026
      {
        id: 'r_old_debt',
        number: '0001-002',
        customerId: sampleCustomers.c2.id,
        customerName: sampleCustomers.c2.name,
        date: '2025-11-20',
        total: 800000,
        amountPaid: 200000,
        status: 'Parcial',
        items: [],
        createdAt: '2025-11-20',
        paymentHistory: [{ amount: 200000, date: '2025-11-20' }]
      }
    ];

    const expenses: Expense[] = [
      {
        id: 'e_old',
        date: '2025-06-01',
        supplierId: 's1',
        supplierName: 'Gastos 2025',
        items: [],
        total: 400000,
        createdAt: '2025-06-01'
      }
    ];

    // Right after closing (no movements yet in 2026):
    const fresh2026 = calculateDashboardFinancials({
      remitos,
      expenses,
      quotes: [],
      lastClosingDate
    });

    // Cash and new income MUST be 0!
    expect(fresh2026.totalCollected).toBe(0);
    expect(fresh2026.totalExpenses).toBe(0);
    expect(fresh2026.balance).toBe(0);
    expect(fresh2026.periodEmittedTotal).toBe(0);
    expect(fresh2026.isCycleActive).toBe(true);
    expect(fresh2026.cycleStartDate).toBe('2025-12-31');

    // BUT customer debt of 600.000 remains active and alive!
    expect(fresh2026.totalPending).toBe(600000);
    expect(fresh2026.topDebtors).toHaveLength(1);
    expect(fresh2026.topDebtors[0].customerName).toBe('Taller Beta');
    expect(fresh2026.topDebtors[0].debt).toBe(600000);

    // Now simulate a new payment arriving in 2026 (client pays 300.000 of their debt)
    const remitosWith2026Payment: Remito[] = [
      remitos[0],
      {
        ...remitos[1],
        amountPaid: 500000,
        paymentHistory: [
          { amount: 200000, date: '2025-11-20' },
          { amount: 300000, date: '2026-02-10' } // New payment in open cycle
        ]
      }
    ];

    const newExpense2026: Expense = {
      id: 'e_new',
      date: '2026-02-15',
      supplierId: 's1',
      supplierName: 'Nueva Bobina 2026',
      items: [],
      total: 100000,
      createdAt: '2026-02-15'
    };

    const updated2026 = calculateDashboardFinancials({
      remitos: remitosWith2026Payment,
      expenses: [...expenses, newExpense2026],
      quotes: [],
      lastClosingDate
    });

    // In open cycle: collected = 300.000, expenses = 100.000, net balance = 200.000
    expect(updated2026.totalCollected).toBe(300000);
    expect(updated2026.totalExpenses).toBe(100000);
    expect(updated2026.balance).toBe(200000);
    // Remaining debt is now 800.000 - 500.000 = 300.000
    expect(updated2026.totalPending).toBe(300000);
  });

  it('provides all-time aggregated metrics when isAllTime is true', () => {
    const lastClosingDate = '2025-12-31';

    const remitos: Remito[] = [
      {
        id: 'r1',
        number: '0001-001',
        customerId: sampleCustomers.c1.id,
        customerName: sampleCustomers.c1.name,
        date: '2025-05-10',
        total: 500000,
        amountPaid: 500000,
        status: 'Pagado',
        items: [],
        createdAt: '2025-05-10',
        paymentHistory: [{ amount: 500000, date: '2025-05-10' }]
      },
      {
        id: 'r2',
        number: '0001-002',
        customerId: sampleCustomers.c2.id,
        customerName: sampleCustomers.c2.name,
        date: '2026-02-10',
        total: 300000,
        amountPaid: 300000,
        status: 'Pagado',
        items: [],
        createdAt: '2026-02-10',
        paymentHistory: [{ amount: 300000, date: '2026-02-10' }]
      }
    ];

    const allTimeMetrics = calculateDashboardFinancials({
      remitos,
      expenses: [],
      quotes: [],
      lastClosingDate,
      isAllTime: true
    });

    // In all-time mode, it counts both 2025 and 2026
    expect(allTimeMetrics.totalCollected).toBe(800000);
    expect(allTimeMetrics.isCycleActive).toBe(false);
  });

});
