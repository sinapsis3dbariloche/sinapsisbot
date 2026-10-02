import { Customer, Remito } from '../types';

export interface CustomerFinancialAccount {
  customerId: string;
  totalBilled: number;
  totalPaid: number;
  balanceDue: number;
  remitosCount: number;
  hasDebt: boolean;
}

export const calculateCustomerAccount = (
  customerId: string,
  remitos: Remito[]
): CustomerFinancialAccount => {
  let totalBilled = 0;
  let totalPaid = 0;
  let remitosCount = 0;

  remitos.forEach(r => {
    if (r.customerId !== customerId || r.isDraft) return;

    totalBilled += r.total || 0;
    totalPaid += r.amountPaid || 0;
    remitosCount++;
  });

  const balanceDue = Math.max(0, totalBilled - totalPaid);

  return {
    customerId,
    totalBilled,
    totalPaid,
    balanceDue,
    remitosCount,
    hasDebt: balanceDue > 0
  };
};

export const filterCustomers = (
  customers: Customer[],
  searchTerm: string = ''
): Customer[] => {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return customers;

  return customers.filter(c => {
    return (
      c.name.toLowerCase().includes(term) ||
      (c.contactName && c.contactName.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.cuit && c.cuit.includes(term))
    );
  });
};
