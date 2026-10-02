import { Remito, RemitoItem, Quote } from '../types';

export const calculateRemitoItemTotal = (quantity: number, unitPrice: number): number => {
  return Math.max(0, quantity) * Math.max(0, unitPrice);
};

export const calculateRemitoTotal = (items: RemitoItem[]): number => {
  return items.reduce((acc, item) => acc + (item.total ?? calculateRemitoItemTotal(item.quantity, item.unitPrice)), 0);
};

export const determinePaymentStatus = (total: number, amountPaid: number): 'Pagado' | 'Parcial' | 'Pendiente' => {
  if (amountPaid >= total && total > 0) return 'Pagado';
  if (amountPaid > 0) return 'Parcial';
  return 'Pendiente';
};

export const calculatePendingDebt = (total: number, amountPaid: number): number => {
  return Math.max(0, total - (amountPaid || 0));
};

export const formatRemitoNumber = (num: number): string => {
  return `0001 - ${num.toString().padStart(5, '0')}`;
};

export const registerRemitoPayment = (
  remito: Remito,
  paymentAmount: number,
  paymentDate: string = new Date().toISOString().split('T')[0]
): Remito => {
  if (paymentAmount <= 0) return remito;

  const currentPaid = remito.amountPaid || 0;
  const newAmountPaid = currentPaid + paymentAmount;
  const newStatus = determinePaymentStatus(remito.total, newAmountPaid);

  const history = remito.paymentHistory || [];
  const updatedPaymentHistory = [
    ...history,
    { amount: paymentAmount, date: paymentDate }
  ];

  return {
    ...remito,
    amountPaid: newAmountPaid,
    status: newStatus,
    paymentHistory: updatedPaymentHistory
  };
};

export const convertQuoteToRemito = (
  quote: Quote,
  senaAmount: number,
  nextRemitoNumber: number,
  creationDate: string = new Date().toISOString().split('T')[0]
): Remito => {
  const formattedNumber = formatRemitoNumber(nextRemitoNumber);
  const total = quote.total;
  const safeSena = Math.min(total, Math.max(0, senaAmount));
  const status = determinePaymentStatus(total, safeSena);

  const paymentHistory = safeSena > 0 ? [{ amount: safeSena, date: creationDate }] : [];

  return {
    id: `R${Date.now()}`,
    number: formattedNumber,
    customerId: quote.customerId,
    customerName: quote.customerName,
    date: creationDate,
    items: quote.items.map(i => ({ ...i })),
    total,
    status,
    productionStatus: 'En Producción',
    amountPaid: safeSena,
    paymentHistory,
    notes: quote.notes || '',
    createdAt: new Date().toISOString()
  };
};

export interface RemitoFilterOptions {
  searchTerm?: string;
  customerId?: string;
  statusFilter?: string; // 'all' | 'Pagado' | 'Parcial' | 'Pendiente' | 'Deudores' | 'ConCobros'
  productionStatusFilter?: string; // 'all' | 'En Producción' | 'Para entregar' | 'Entregada'
  draftFilter?: string; // 'all' | 'Borrador' | 'Emitido'
  month?: number | null; // 1-12
  year?: number | null; // e.g. 2026
}

export const filterRemitos = (remitos: Remito[], filters: RemitoFilterOptions): Remito[] => {
  const search = (filters.searchTerm || '').trim().toLowerCase();

  return remitos.filter(r => {
    // 1. Search term
    if (search) {
      const matchSearch =
        r.customerName.toLowerCase().includes(search) ||
        r.number.toLowerCase().includes(search) ||
        (r.notes || '').toLowerCase().includes(search);
      if (!matchSearch) return false;
    }

    // 2. Customer
    if (filters.customerId && r.customerId !== filters.customerId) {
      return false;
    }

    // 3. Status
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      if (filters.statusFilter === 'Deudores') {
        if (r.status !== 'Pendiente' && r.status !== 'Parcial') return false;
      } else if (filters.statusFilter === 'ConCobros') {
        if ((r.amountPaid || 0) <= 0) return false;
      } else if (r.status !== filters.statusFilter) {
        return false;
      }
    }

    // 4. Production status
    if (filters.productionStatusFilter && filters.productionStatusFilter !== 'all') {
      const currentProd = r.productionStatus || 'Entregada';
      if (currentProd !== filters.productionStatusFilter) return false;
    }

    // 5. Draft filter
    if (filters.draftFilter && filters.draftFilter !== 'all') {
      if (filters.draftFilter === 'Borrador' && !r.isDraft) return false;
      if (filters.draftFilter === 'Emitido' && r.isDraft) return false;
    }

    // 6. Month / Year filter
    if (filters.month || filters.year) {
      const d = new Date(r.date + 'T12:00:00');
      const matchesMainDate =
        (!filters.month || d.getMonth() + 1 === filters.month) &&
        (!filters.year || d.getFullYear() === filters.year);

      // Also check payment dates
      const hasPaymentInPeriod =
        r.paymentHistory &&
        r.paymentHistory.some(p => {
          const pd = new Date(p.date + 'T12:00:00');
          return (
            (!filters.month || pd.getMonth() + 1 === filters.month) &&
            (!filters.year || pd.getFullYear() === filters.year)
          );
        });

      if (!matchesMainDate && !hasPaymentInPeriod) return false;
    }

    return true;
  });
};
