import { Quote, QuoteItem } from '../types';

export const calculateQuoteItemTotal = (quantity: number, unitPrice: number): number => {
  return Math.max(0, quantity) * Math.max(0, unitPrice);
};

export const calculateQuoteTotal = (items: QuoteItem[]): number => {
  return items.reduce((acc, item) => acc + (item.total ?? calculateQuoteItemTotal(item.quantity, item.unitPrice)), 0);
};

export const formatQuoteNumber = (num: number): string => {
  return `P0001 - ${num.toString().padStart(5, '0')}`;
};

export const updateQuoteStatus = (
  quote: Quote,
  newStatus: 'borrador' | 'presupuestado' | 'confirmado' | 'rechazado'
): Quote => {
  return {
    ...quote,
    status: newStatus,
    isDraft: newStatus === 'borrador'
  };
};

export interface QuoteFilterOptions {
  searchTerm?: string;
  customerId?: string;
  statusFilter?: string; // 'todos' | 'borrador' | 'presupuestado' | 'confirmado' | 'rechazado'
}

export const filterQuotes = (quotes: Quote[], filters: QuoteFilterOptions): Quote[] => {
  const search = (filters.searchTerm || '').trim().toLowerCase();

  return quotes.filter(q => {
    if (search) {
      const match =
        q.customerName.toLowerCase().includes(search) ||
        q.number.toLowerCase().includes(search) ||
        (q.notes || '').toLowerCase().includes(search);
      if (!match) return false;
    }

    if (filters.customerId && q.customerId !== filters.customerId) {
      return false;
    }

    if (filters.statusFilter && filters.statusFilter !== 'todos') {
      const currentStatus = q.status || (q.isDraft ? 'borrador' : 'presupuestado');
      if (currentStatus !== filters.statusFilter) return false;
    }

    return true;
  });
};
