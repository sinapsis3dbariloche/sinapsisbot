import { describe, it, expect } from 'vitest';
import { Quote, QuoteItem } from '../types';
import {
  calculateQuoteItemTotal,
  calculateQuoteTotal,
  formatQuoteNumber,
  updateQuoteStatus,
  filterQuotes
} from '../services/quoteLogic';

describe('Quotes & Presupuestos Logic', () => {
  it('calculates quote item and total correctly', () => {
    expect(calculateQuoteItemTotal(4, 12500)).toBe(50000);
    expect(calculateQuoteItemTotal(0, 10000)).toBe(0);

    const items: QuoteItem[] = [
      { description: 'Enclosure Bambu Lab', quantity: 1, unitPrice: 85000, total: 85000 },
      { description: 'Boquilla de repuesto', quantity: 2, unitPrice: 7500, total: 15000 }
    ];
    expect(calculateQuoteTotal(items)).toBe(100000);
  });

  it('formats quote numbers with P prefix and 5 digits padding', () => {
    expect(formatQuoteNumber(1)).toBe('P0001 - 00001');
    expect(formatQuoteNumber(37)).toBe('P0001 - 00037');
    expect(formatQuoteNumber(999)).toBe('P0001 - 00999');
  });

  it('updates quote status and handles isDraft flag coherently', () => {
    const baseQuote: Quote = {
      id: 'q-1',
      number: 'P0001 - 00001',
      customerId: 'c-1',
      customerName: 'Cliente Presupuesto',
      date: '2026-04-01',
      items: [],
      total: 50000,
      status: 'borrador',
      isDraft: true,
      createdAt: '2026-04-01'
    };

    const presupuestado = updateQuoteStatus(baseQuote, 'presupuestado');
    expect(presupuestado.status).toBe('presupuestado');
    expect(presupuestado.isDraft).toBe(false);

    const confirmado = updateQuoteStatus(presupuestado, 'confirmado');
    expect(confirmado.status).toBe('confirmado');
    expect(confirmado.isDraft).toBe(false);

    const rechazo = updateQuoteStatus(presupuestado, 'rechazado');
    expect(rechazo.status).toBe('rechazado');
    expect(rechazo.isDraft).toBe(false);
  });

  it('filters quotes by status and search terms', () => {
    const quotesList: Quote[] = [
      {
        id: 'q-1',
        number: 'P0001 - 00001',
        customerId: 'c-1',
        customerName: 'Lucas Passa',
        date: '2026-04-01',
        items: [],
        total: 50000,
        status: 'presupuestado',
        createdAt: '2026-04-01'
      },
      {
        id: 'q-2',
        number: 'P0001 - 00002',
        customerId: 'c-2',
        customerName: 'Estudio Alpha',
        date: '2026-04-02',
        items: [],
        total: 120000,
        status: 'borrador',
        isDraft: true,
        createdAt: '2026-04-02'
      }
    ];

    expect(filterQuotes(quotesList, { statusFilter: 'borrador' })).toHaveLength(1);
    expect(filterQuotes(quotesList, { statusFilter: 'presupuestado' })).toHaveLength(1);
    expect(filterQuotes(quotesList, { searchTerm: 'Alpha' })).toHaveLength(1);
    expect(filterQuotes(quotesList, { customerId: 'c-1' })).toHaveLength(1);
  });
});
