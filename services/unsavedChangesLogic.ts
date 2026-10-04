import { Remito, Quote, Expense, Customer, Supplier, Printer, StockItem, PriceItem } from '../types';

export const isRemitoFormDirty = (
  remito: Partial<Remito>,
  initialSnapshot: string | null
): boolean => {
  if (!initialSnapshot) {
    const hasCustomer = Boolean(remito.customerId && remito.customerId.trim() !== '');
    const hasNotes = Boolean(remito.notes && remito.notes.trim() !== '');
    const hasItems = Boolean(
      remito.items &&
      remito.items.length > 0 &&
      remito.items.some(
        i => (i.description && i.description.trim() !== '') || (i.unitPrice !== undefined && i.unitPrice > 0)
      )
    );
    const hasPaid = Boolean(remito.amountPaid && remito.amountPaid > 0);
    return hasCustomer || hasNotes || hasItems || hasPaid;
  }

  try {
    const orig: Remito = JSON.parse(initialSnapshot);
    const isCustomerChanged = remito.customerId !== orig.customerId;
    const isDateChanged = remito.date !== orig.date;
    const isStatusChanged = remito.status !== orig.status;
    const isProdStatusChanged = remito.productionStatus !== orig.productionStatus;
    const isPaidChanged = remito.amountPaid !== orig.amountPaid;
    const isNotesChanged = (remito.notes || '').trim() !== (orig.notes || '').trim();
    const isItemsChanged = JSON.stringify(remito.items || []) !== JSON.stringify(orig.items || []);

    return (
      isCustomerChanged ||
      isDateChanged ||
      isStatusChanged ||
      isProdStatusChanged ||
      isPaidChanged ||
      isNotesChanged ||
      isItemsChanged
    );
  } catch {
    return false;
  }
};

export const isQuoteFormDirty = (
  quote: Partial<Quote>,
  initialSnapshot: string | null
): boolean => {
  if (!initialSnapshot) {
    const hasCustomer = Boolean(quote.customerId && quote.customerId.trim() !== '');
    const hasNotes = Boolean(quote.notes && quote.notes.trim() !== '');
    const hasItems = Boolean(
      quote.items &&
      quote.items.length > 0 &&
      quote.items.some(
        i => (i.description && i.description.trim() !== '') || (i.unitPrice !== undefined && i.unitPrice > 0)
      )
    );
    return hasCustomer || hasNotes || hasItems;
  }

  try {
    const orig: Quote = JSON.parse(initialSnapshot);
    const isCustomerChanged = quote.customerId !== orig.customerId;
    const isDateChanged = quote.date !== orig.date;
    const isStatusChanged = quote.status !== orig.status;
    const isNotesChanged = (quote.notes || '').trim() !== (orig.notes || '').trim();
    const isItemsChanged = JSON.stringify(quote.items || []) !== JSON.stringify(orig.items || []);

    return (
      isCustomerChanged ||
      isDateChanged ||
      isStatusChanged ||
      isNotesChanged ||
      isItemsChanged
    );
  } catch {
    return false;
  }
};

export const isExpenseFormDirty = (
  expense: Partial<Expense>,
  initialSnapshot: string | null
): boolean => {
  if (!initialSnapshot) {
    const hasSupplier = Boolean(expense.supplierId && expense.supplierId.trim() !== '');
    const hasNotes = Boolean(expense.notes && expense.notes.trim() !== '');
    const hasItems = Boolean(
      expense.items &&
      expense.items.length > 0 &&
      expense.items.some(
        i => (i.description && i.description.trim() !== '') || (i.unitPrice !== undefined && i.unitPrice > 0)
      )
    );
    return hasSupplier || hasNotes || hasItems;
  }

  try {
    const orig: Expense = JSON.parse(initialSnapshot);
    const isSupplierChanged = expense.supplierId !== orig.supplierId;
    const isDateChanged = expense.date !== orig.date;
    const isNotesChanged = (expense.notes || '').trim() !== (orig.notes || '').trim();
    const isItemsChanged = JSON.stringify(expense.items || []) !== JSON.stringify(orig.items || []);

    return isSupplierChanged || isDateChanged || isNotesChanged || isItemsChanged;
  } catch {
    return false;
  }
};

export const isCustomerFormDirty = (
  customer: Partial<Customer>,
  originalCustomer: Customer | null
): boolean => {
  if (!originalCustomer) {
    return Boolean(
      (customer.name && customer.name.trim() !== '') ||
      (customer.contactName && customer.contactName.trim() !== '') ||
      (customer.cuit && customer.cuit.trim() !== '') ||
      (customer.phone && customer.phone.trim() !== '') ||
      (customer.email && customer.email.trim() !== '') ||
      (customer.street && customer.street.trim() !== '') ||
      (customer.notes && customer.notes.trim() !== '') ||
      (customer.instagram && customer.instagram.trim() !== '')
    );
  }

  return (
    (customer.name || '') !== (originalCustomer.name || '') ||
    (customer.contactName || '') !== (originalCustomer.contactName || '') ||
    (customer.cuit || '') !== (originalCustomer.cuit || '') ||
    (customer.phone || '') !== (originalCustomer.phone || '') ||
    (customer.email || '') !== (originalCustomer.email || '') ||
    (customer.street || '') !== (originalCustomer.street || '') ||
    (customer.number || '') !== (originalCustomer.number || '') ||
    (customer.city || '') !== (originalCustomer.city || '') ||
    (customer.taxCondition || '') !== (originalCustomer.taxCondition || '') ||
    (customer.notes || '') !== (originalCustomer.notes || '') ||
    (customer.instagram || '') !== (originalCustomer.instagram || '')
  );
};

export const isSupplierFormDirty = (
  supplier: Partial<Supplier>,
  originalSupplier: Supplier | null
): boolean => {
  if (!originalSupplier) {
    return Boolean(
      (supplier.name && supplier.name.trim() !== '') ||
      (supplier.contactName && supplier.contactName.trim() !== '') ||
      (supplier.phone && supplier.phone.trim() !== '') ||
      (supplier.email && supplier.email.trim() !== '') ||
      (supplier.street && supplier.street.trim() !== '') ||
      (supplier.city && supplier.city.trim() !== '') ||
      (supplier.web && supplier.web.trim() !== '') ||
      (supplier.notes && supplier.notes.trim() !== '') ||
      (supplier.instagram && supplier.instagram.trim() !== '')
    );
  }

  return (
    (supplier.name || '') !== (originalSupplier.name || '') ||
    (supplier.contactName || '') !== (originalSupplier.contactName || '') ||
    (supplier.phone || '') !== (originalSupplier.phone || '') ||
    (supplier.email || '') !== (originalSupplier.email || '') ||
    (supplier.street || '') !== (originalSupplier.street || '') ||
    (supplier.number || '') !== (originalSupplier.number || '') ||
    (supplier.city || '') !== (originalSupplier.city || '') ||
    (supplier.web || '') !== (originalSupplier.web || '') ||
    (supplier.notes || '') !== (originalSupplier.notes || '') ||
    (supplier.instagram || '') !== (originalSupplier.instagram || '')
  );
};

export const isPrinterFormDirty = (
  printer: Partial<Printer>,
  originalPrinter: Printer | null
): boolean => {
  if (!originalPrinter) {
    return Boolean(printer.name?.trim() || printer.model?.trim() || printer.hasAMS);
  }

  return (
    (printer.name || '') !== (originalPrinter.name || '') ||
    (printer.model || '') !== (originalPrinter.model || '') ||
    Boolean(printer.hasAMS) !== Boolean(originalPrinter.hasAMS)
  );
};

export const isStockItemFormDirty = (
  stockItem: Partial<StockItem>,
  originalItem: StockItem | null
): boolean => {
  if (!originalItem) {
    if (stockItem.category === 'grafica') {
      return Boolean(
        stockItem.name?.trim() ||
        stockItem.sizeFormat?.trim() ||
        stockItem.weightThickness?.trim() ||
        stockItem.packageUnits?.trim() ||
        stockItem.finishColor?.trim() ||
        (stockItem.minClosed !== undefined && stockItem.minClosed !== 1)
      );
    }
    return Boolean(
      stockItem.color?.trim() ||
      (stockItem.minClosed !== undefined && stockItem.minClosed !== 1)
    );
  }

  if (originalItem.category === 'grafica' || stockItem.category === 'grafica') {
    return (
      (stockItem.name || '') !== (originalItem.name || '') ||
      stockItem.graphicCategory !== originalItem.graphicCategory ||
      (stockItem.sizeFormat || '') !== (originalItem.sizeFormat || '') ||
      (stockItem.weightThickness || '') !== (originalItem.weightThickness || '') ||
      (stockItem.packageUnits || '') !== (originalItem.packageUnits || '') ||
      (stockItem.finishColor || '') !== (originalItem.finishColor || '') ||
      stockItem.minClosed !== originalItem.minClosed
    );
  }

  return (
    (stockItem.color || '') !== (originalItem.color || '') ||
    stockItem.minClosed !== originalItem.minClosed ||
    (stockItem.hexColor || '') !== (originalItem.hexColor || '') ||
    stockItem.type !== originalItem.type
  );
};

export const isPriceItemFormDirty = (
  priceItem: Partial<PriceItem>,
  originalPrice: PriceItem | null
): boolean => {
  if (!originalPrice) {
    return Boolean(
      priceItem.description?.trim() ||
      (priceItem.retailPrice !== undefined && priceItem.retailPrice > 0) ||
      (priceItem.wholesalePrice !== undefined && priceItem.wholesalePrice > 0)
    );
  }

  return (
    (priceItem.description || '') !== (originalPrice.description || '') ||
    priceItem.wholesalePrice !== originalPrice.wholesalePrice ||
    priceItem.retailPrice !== originalPrice.retailPrice ||
    priceItem.wholesaleMinQuantity !== originalPrice.wholesaleMinQuantity
  );
};

export const isBalanceFormDirty = (notes: string, name: string): boolean => {
  return Boolean((notes && notes.trim() !== '') || (name && name.trim() !== ''));
};
