import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BalanceManager, safeFormatDate } from '../components/BalanceManager';
import { UnsavedChangesProvider } from '../lib/UnsavedChangesContext';
import { BalanceClosing, Remito, Expense } from '../types';

describe('BalanceManager Component & Initialization', () => {
  it('safeFormatDate handles valid, null, undefined, and malformed dates without throwing', () => {
    expect(safeFormatDate('2026-05-10', 'dd/MM/yyyy')).toBe('10/05/2026');
    expect(safeFormatDate(null, 'dd/MM/yyyy', undefined, 'N/A')).toBe('N/A');
    expect(safeFormatDate(undefined, 'dd/MM/yyyy', undefined, '-')).toBe('-');
    expect(safeFormatDate('invalid-date', 'dd/MM/yyyy', undefined, 'Fallback')).toBe('Fallback');
    expect(safeFormatDate({ seconds: 1775836800 }, 'dd/MM/yyyy')).toBe('10/04/2026');
  });

  it('renders BalanceManager component without throwing ReferenceError (validates React hooks imports)', () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const mockDelete = vi.fn().mockResolvedValue(undefined);

    const remitos: Remito[] = [
      {
        id: 'r1',
        number: '0001 - 00001',
        customerId: 'c1',
        customerName: 'Cliente Test',
        date: '2026-02-01',
        items: [],
        total: 50000,
        status: 'Pagado',
        amountPaid: 50000,
        createdAt: '2026-02-01'
      }
    ];

    const expenses: Expense[] = [
      {
        id: 'e1',
        date: '2026-02-02',
        supplierId: 's1',
        supplierName: 'Proveedor Test',
        items: [],
        total: 20000,
        createdAt: '2026-02-02'
      }
    ];

    const closings: BalanceClosing[] = [
      {
        id: 'b1',
        name: 'Ejercicio Anual 2025',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        closedAt: '2025-12-31T23:59:59Z',
        closedBy: 'Admin',
        totalIncome: 100000,
        totalExpenses: 40000,
        netResult: 60000,
        resultType: 'PROFIT',
        totalBilled: 120000,
        remitosCount: 5,
        expensesCount: 3,
        pendingReceivablesAtClose: 20000,
        debtorsSummary: [
          { customerId: 'c1', customerName: 'Cliente Test', debt: 20000 }
        ]
      }
    ];

    // This would throw "ReferenceError: useEffect is not defined" if React hooks are missing
    let html = '';
    expect(() => {
      html = renderToString(
        <UnsavedChangesProvider>
          <BalanceManager
            remitos={remitos}
            expenses={expenses}
            quotes={[]}
            balanceClosings={closings}
            onSaveClosing={mockSave}
            onDeleteClosing={mockDelete}
            currentUserEmail="admin@test.com"
          />
        </UnsavedChangesProvider>
      );
    }).not.toThrow();

    expect(html).toContain('Cierre de Balances');
    expect(html).toContain('Nuevo Cierre');
    expect(html).toContain('Historial');
  });
});
