import { Expense, ExpenseItem } from '../types';

export const calculateExpenseItemTotal = (quantity: number, unitPrice: number): number => {
  return Math.max(0, quantity) * Math.max(0, unitPrice);
};

export const calculateExpenseTotal = (items: ExpenseItem[]): number => {
  return items.reduce((acc, item) => acc + (item.total ?? calculateExpenseItemTotal(item.quantity, item.unitPrice)), 0);
};

export interface ExpenseFilterOptions {
  searchTerm?: string;
  supplierId?: string;
  includeDrafts?: boolean;
  month?: number | null; // 1-12
  year?: number | null;
}

export const filterExpenses = (expenses: Expense[], filters: ExpenseFilterOptions): Expense[] => {
  const search = (filters.searchTerm || '').trim().toLowerCase();
  const includeDrafts = filters.includeDrafts ?? true;

  return expenses.filter(e => {
    // 1. Search term (by supplier name or items description)
    if (search) {
      const matchSupplier = e.supplierName.toLowerCase().includes(search);
      const matchItem = e.items.some(item => item.description.toLowerCase().includes(search));
      const matchNotes = (e.notes || '').toLowerCase().includes(search);
      if (!matchSupplier && !matchItem && !matchNotes) return false;
    }

    // 2. Supplier ID
    if (filters.supplierId && e.supplierId !== filters.supplierId) {
      return false;
    }

    // 3. Draft filter
    if (!includeDrafts && e.isDraft) {
      return false;
    }

    // 4. Month & Year filter
    if (filters.month || filters.year) {
      const d = new Date(e.date + 'T12:00:00');
      if (filters.month && d.getMonth() + 1 !== filters.month) return false;
      if (filters.year && d.getFullYear() !== filters.year) return false;
    }

    return true;
  });
};

export interface SupplierExpenseSummary {
  supplierId: string;
  supplierName: string;
  total: number;
  count: number;
}

export const calculateExpensesBySupplier = (
  expenses: Expense[],
  includeDrafts: boolean = false
): SupplierExpenseSummary[] => {
  const map: Record<string, SupplierExpenseSummary> = {};

  expenses.forEach(e => {
    if (!includeDrafts && e.isDraft) return;

    if (!map[e.supplierId]) {
      map[e.supplierId] = {
        supplierId: e.supplierId,
        supplierName: e.supplierName,
        total: 0,
        count: 0
      };
    }
    map[e.supplierId].total += e.total || 0;
    map[e.supplierId].count += 1;
  });

  return Object.values(map).sort((a, b) => b.total - a.total);
};
