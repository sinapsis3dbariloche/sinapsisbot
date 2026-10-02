import { describe, it, expect } from 'vitest';
import { Customer, Remito } from '../types';
import {
  calculateCustomerAccount,
  filterCustomers
} from '../services/customerLogic';

describe('Customer Account & Database Logic', () => {
  const sampleCustomer: Customer = {
    id: 'c-1',
    name: 'ALEGRARTE',
    contactName: 'Lucía',
    phone: '2944123456',
    email: 'contacto@alegrarte.com',
    cuit: '27-12345678-4',
    city: 'Bariloche',
    street: 'Mitre',
    number: '123',
    taxCondition: 'Responsable Inscripto',
    createdAt: '2026-01-01'
  };

  it('calculates customer account balance across non-draft remitos', () => {
    const remitos: Remito[] = [
      {
        id: 'r-1',
        number: '0001 - 00001',
        customerId: 'c-1',
        customerName: 'ALEGRARTE',
        date: '2026-01-15',
        items: [],
        total: 100000,
        amountPaid: 100000,
        status: 'Pagado',
        createdAt: '2026-01-15'
      },
      {
        id: 'r-2',
        number: '0001 - 00002',
        customerId: 'c-1',
        customerName: 'ALEGRARTE',
        date: '2026-02-20',
        items: [],
        total: 150000,
        amountPaid: 50000,
        status: 'Parcial',
        createdAt: '2026-02-20'
      },
      // Draft remito should be excluded from financial account
      {
        id: 'r-draft',
        number: '0001 - 00003',
        customerId: 'c-1',
        customerName: 'ALEGRARTE',
        date: '2026-03-01',
        items: [],
        total: 80000,
        amountPaid: 0,
        status: 'Pendiente',
        isDraft: true,
        createdAt: '2026-03-01'
      },
      // Different customer remito
      {
        id: 'r-other',
        number: '0001 - 00004',
        customerId: 'c-2',
        customerName: 'Otro Cliente',
        date: '2026-02-10',
        items: [],
        total: 40000,
        amountPaid: 40000,
        status: 'Pagado',
        createdAt: '2026-02-10'
      }
    ];

    const account = calculateCustomerAccount('c-1', remitos);
    expect(account.totalBilled).toBe(250000);
    expect(account.totalPaid).toBe(150000);
    expect(account.balanceDue).toBe(100000);
    expect(account.remitosCount).toBe(2);
    expect(account.hasDebt).toBe(true);
  });

  it('filters customers by name, contact, cuit, or email', () => {
    const customers: Customer[] = [
      sampleCustomer,
      {
        id: 'c-2',
        name: 'PATAGONIA 3D',
        contactName: 'Esteban',
        phone: '2944987654',
        email: 'info@patagonia3d.ar',
        cuit: '20-87654321-9',
        city: 'Bariloche',
        street: 'Moreno',
        number: '456',
        taxCondition: 'Consumidor Final',
        createdAt: '2026-02-01'
      }
    ];

    expect(filterCustomers(customers, 'alegrarte')).toHaveLength(1);
    expect(filterCustomers(customers, 'Esteban')).toHaveLength(1);
    expect(filterCustomers(customers, '87654321')).toHaveLength(1);
    expect(filterCustomers(customers, 'inexistente')).toHaveLength(0);
    expect(filterCustomers(customers, '')).toHaveLength(2);
  });
});
