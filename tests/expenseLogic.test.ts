import { describe, it, expect } from 'vitest';
import { Expense, ExpenseItem } from '../types';
import {
  calculateExpenseItemTotal,
  calculateExpenseTotal,
  filterExpenses,
  calculateExpensesBySupplier
} from '../services/expenseLogic';

describe('Expenses & Supplier Logic', () => {
  it('calculates expense item and total correctly', () => {
    expect(calculateExpenseItemTotal(5, 18000)).toBe(90000);
    expect(calculateExpenseItemTotal(0, 1000)).toBe(0);

    const items: ExpenseItem[] = [
      { id: '1', description: 'Bobina PLA Grilon3', quantity: 4, unitPrice: 20000, total: 80000 },
      { id: '2', description: 'Alcohol Isopropílico', quantity: 2, unitPrice: 8000, total: 16000 }
    ];
    expect(calculateExpenseTotal(items)).toBe(96000);
  });

  it('filters expenses by search term, supplier, and drafts', () => {
    const expensesList: Expense[] = [
      {
        id: 'e-1',
        date: '2026-03-10',
        supplierId: 's-1',
        supplierName: 'Grilon3 Argentina',
        items: [{ id: 'i-1', description: 'PLA Negro', quantity: 10, unitPrice: 22000, total: 220000 }],
        total: 220000,
        createdAt: '2026-03-10'
      },
      {
        id: 'e-2',
        date: '2026-03-15',
        supplierId: 's-2',
        supplierName: 'Ferretería Bariloche',
        items: [{ id: 'i-2', description: 'Tornillos M3', quantity: 1, unitPrice: 15000, total: 15000 }],
        total: 15000,
        createdAt: '2026-03-15'
      },
      {
        id: 'e-3',
        date: '2026-04-01',
        supplierId: 's-1',
        supplierName: 'Grilon3 Argentina',
        items: [{ id: 'i-3', description: 'Borrador PETG', quantity: 2, unitPrice: 30000, total: 60000 }],
        total: 60000,
        isDraft: true,
        createdAt: '2026-04-01'
      }
    ];

    // Filter by supplier
    expect(filterExpenses(expensesList, { supplierId: 's-1' })).toHaveLength(2);

    // Search by item description
    expect(filterExpenses(expensesList, { searchTerm: 'Tornillos' })).toHaveLength(1);

    // Exclude drafts
    expect(filterExpenses(expensesList, { includeDrafts: false })).toHaveLength(2);
  });

  it('aggregates expenses per supplier sorted by highest expenditure', () => {
    const expensesList: Expense[] = [
      {
        id: 'e-1',
        date: '2026-01-10',
        supplierId: 's-1',
        supplierName: 'Filamentos SA',
        items: [],
        total: 300000,
        createdAt: '2026-01-10'
      },
      {
        id: 'e-2',
        date: '2026-02-10',
        supplierId: 's-2',
        supplierName: 'Electricidad Sur',
        items: [],
        total: 50000,
        createdAt: '2026-02-10'
      },
      {
        id: 'e-3',
        date: '2026-03-10',
        supplierId: 's-1',
        supplierName: 'Filamentos SA',
        items: [],
        total: 200000,
        createdAt: '2026-03-10'
      }
    ];

    const summary = calculateExpensesBySupplier(expensesList);
    expect(summary).toHaveLength(2);
    // Filamentos SA: 300.000 + 200.000 = 500.000 (comes first)
    expect(summary[0].supplierName).toBe('Filamentos SA');
    expect(summary[0].total).toBe(500000);
    expect(summary[0].count).toBe(2);

    expect(summary[1].supplierName).toBe('Electricidad Sur');
    expect(summary[1].total).toBe(50000);
    expect(summary[1].count).toBe(1);
  });
});
