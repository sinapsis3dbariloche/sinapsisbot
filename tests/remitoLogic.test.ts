import { describe, it, expect } from 'vitest';
import { Remito, RemitoItem, Quote } from '../types';
import {
  calculateRemitoItemTotal,
  calculateRemitoTotal,
  determinePaymentStatus,
  calculatePendingDebt,
  formatRemitoNumber,
  registerRemitoPayment,
  convertQuoteToRemito,
  filterRemitos
} from '../services/remitoLogic';

describe('Remitos & Sales Logic', () => {
  it('calculates remito item total and overall total', () => {
    expect(calculateRemitoItemTotal(3, 15000)).toBe(45000);
    expect(calculateRemitoItemTotal(0, 50000)).toBe(0);
    expect(calculateRemitoItemTotal(-2, 1000)).toBe(0);

    const items: RemitoItem[] = [
      { description: 'Soporte Auricular', quantity: 2, unitPrice: 15000, total: 30000 },
      { description: 'Mate 3D', quantity: 1, unitPrice: 20000, total: 20000 }
    ];
    expect(calculateRemitoTotal(items)).toBe(50000);
  });

  it('determines payment status based on total and amountPaid', () => {
    expect(determinePaymentStatus(50000, 50000)).toBe('Pagado');
    expect(determinePaymentStatus(50000, 60000)).toBe('Pagado');
    expect(determinePaymentStatus(50000, 25000)).toBe('Parcial');
    expect(determinePaymentStatus(50000, 0)).toBe('Pendiente');
    expect(determinePaymentStatus(0, 0)).toBe('Pendiente');
  });

  it('calculates remaining debt correctly', () => {
    expect(calculatePendingDebt(100000, 40000)).toBe(60000);
    expect(calculatePendingDebt(100000, 100000)).toBe(0);
    expect(calculatePendingDebt(100000, 150000)).toBe(0);
  });

  it('formats remito number padded with 5 digits', () => {
    expect(formatRemitoNumber(1)).toBe('0001 - 00001');
    expect(formatRemitoNumber(42)).toBe('0001 - 00042');
    expect(formatRemitoNumber(1234)).toBe('0001 - 01234');
  });

  it('registers partial and full payments and updates paymentHistory', () => {
    const initialRemito: Remito = {
      id: 'r-1',
      number: '0001 - 00001',
      customerId: 'c-1',
      customerName: 'Cliente Test',
      date: '2026-02-01',
      items: [{ description: 'Piezas', quantity: 1, unitPrice: 100000, total: 100000 }],
      total: 100000,
      status: 'Pendiente',
      amountPaid: 0,
      paymentHistory: [],
      createdAt: '2026-02-01'
    };

    // First installment of 40.000
    const remitoAfterInstallment1 = registerRemitoPayment(initialRemito, 40000, '2026-02-05');
    expect(remitoAfterInstallment1.amountPaid).toBe(40000);
    expect(remitoAfterInstallment1.status).toBe('Parcial');
    expect(remitoAfterInstallment1.paymentHistory).toHaveLength(1);
    expect(remitoAfterInstallment1.paymentHistory![0].amount).toBe(40000);

    // Second installment of 60.000 (completes the payment)
    const remitoAfterInstallment2 = registerRemitoPayment(remitoAfterInstallment1, 60000, '2026-02-15');
    expect(remitoAfterInstallment2.amountPaid).toBe(100000);
    expect(remitoAfterInstallment2.status).toBe('Pagado');
    expect(remitoAfterInstallment2.paymentHistory).toHaveLength(2);
    expect(remitoAfterInstallment2.paymentHistory![1].amount).toBe(60000);
  });

  it('converts a Quote into a Remito preserving items and assigning seña', () => {
    const quote: Quote = {
      id: 'q-1',
      number: 'P0001 - 00001',
      customerId: 'c-10',
      customerName: 'Studio Diseño',
      date: '2026-03-01',
      items: [{ description: 'Prototipo', quantity: 2, unitPrice: 35000, total: 70000 }],
      total: 70000,
      status: 'presupuestado',
      createdAt: '2026-03-01'
    };

    const remito = convertQuoteToRemito(quote, 20000, 15, '2026-03-02');
    expect(remito.number).toBe('0001 - 00015');
    expect(remito.customerId).toBe('c-10');
    expect(remito.total).toBe(70000);
    expect(remito.amountPaid).toBe(20000);
    expect(remito.status).toBe('Parcial');
    expect(remito.productionStatus).toBe('En Producción');
    expect(remito.paymentHistory).toHaveLength(1);
    expect(remito.paymentHistory![0].amount).toBe(20000);
  });

  it('filters remitos by status, customer, drafts and date ranges', () => {
    const remitosList: Remito[] = [
      {
        id: 'r-1',
        number: '0001 - 00001',
        customerId: 'c-1',
        customerName: 'Lucas Passa',
        date: '2026-05-10',
        items: [],
        total: 50000,
        amountPaid: 50000,
        status: 'Pagado',
        productionStatus: 'Entregada',
        createdAt: '2026-05-10'
      },
      {
        id: 'r-2',
        number: '0001 - 00002',
        customerId: 'c-2',
        customerName: 'Bariloche Tech',
        date: '2026-05-12',
        items: [],
        total: 80000,
        amountPaid: 0,
        status: 'Pendiente',
        productionStatus: 'En Producción',
        createdAt: '2026-05-12'
      },
      {
        id: 'r-3',
        number: '0001 - 00003',
        customerId: 'c-1',
        customerName: 'Lucas Passa',
        date: '2026-06-01',
        items: [],
        total: 30000,
        amountPaid: 10000,
        status: 'Parcial',
        productionStatus: 'Para entregar',
        isDraft: true,
        createdAt: '2026-06-01'
      }
    ];

    // Filter by customer
    const byCust = filterRemitos(remitosList, { customerId: 'c-1' });
    expect(byCust).toHaveLength(2);

    // Filter by debtors
    const debtors = filterRemitos(remitosList, { statusFilter: 'Deudores' });
    expect(debtors).toHaveLength(2); // r-2 (Pendiente) and r-3 (Parcial)

    // Filter by production status
    const inProd = filterRemitos(remitosList, { productionStatusFilter: 'En Producción' });
    expect(inProd).toHaveLength(1);
    expect(inProd[0].id).toBe('r-2');

    // Filter non-drafts
    const emittedOnly = filterRemitos(remitosList, { draftFilter: 'Emitido' });
    expect(emittedOnly).toHaveLength(2);
  });
});
