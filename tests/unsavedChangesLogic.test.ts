import { describe, it, expect } from 'vitest';
import {
  isRemitoFormDirty,
  isQuoteFormDirty,
  isExpenseFormDirty,
  isCustomerFormDirty,
  isSupplierFormDirty,
  isPrinterFormDirty,
  isStockItemFormDirty,
  isPriceItemFormDirty,
  isBalanceFormDirty
} from '../services/unsavedChangesLogic';
import { Remito, Quote, Expense, Customer, Supplier, Printer, StockItem, PriceItem, FilamentType } from '../types';

describe('Unsaved Changes Logic & Protection', () => {
  describe('isRemitoFormDirty', () => {
    it('returns false for a brand-new empty remito without data', () => {
      const emptyRemito: Partial<Remito> = {
        customerId: '',
        customerName: '',
        notes: '',
        amountPaid: 0,
        items: []
      };
      expect(isRemitoFormDirty(emptyRemito, null)).toBe(false);
    });

    it('returns true for a new remito if customerId is selected', () => {
      expect(isRemitoFormDirty({ customerId: 'cust-1' }, null)).toBe(true);
    });

    it('returns true for a new remito if notes are written', () => {
      expect(isRemitoFormDirty({ notes: 'Entrega urgente' }, null)).toBe(true);
    });

    it('returns true for a new remito if items are added', () => {
      expect(isRemitoFormDirty({
        items: [{ description: 'Engranaje 3D', quantity: 1, unitPrice: 5000, total: 5000 }]
      }, null)).toBe(true);
    });

    it('returns true for a new remito if amountPaid is registered', () => {
      expect(isRemitoFormDirty({ amountPaid: 1000 }, null)).toBe(true);
    });

    it('returns false when editing an existing remito with identical data', () => {
      const origRemito: Remito = {
        id: 'r-1',
        number: '0001 - 00001',
        customerId: 'c-1',
        customerName: 'Cliente A',
        date: '2026-10-04',
        items: [{ description: 'Pieza A', quantity: 2, unitPrice: 1000, total: 2000 }],
        total: 2000,
        status: 'Pendiente',
        amountPaid: 0,
        createdAt: '2026-10-04'
      };
      const snapshot = JSON.stringify(origRemito);
      expect(isRemitoFormDirty({ ...origRemito }, snapshot)).toBe(false);
    });

    it('returns true when editing an existing remito and changing status, notes, or items', () => {
      const origRemito: Remito = {
        id: 'r-1',
        number: '0001 - 00001',
        customerId: 'c-1',
        customerName: 'Cliente A',
        date: '2026-10-04',
        items: [{ description: 'Pieza A', quantity: 2, unitPrice: 1000, total: 2000 }],
        total: 2000,
        status: 'Pendiente',
        amountPaid: 0,
        createdAt: '2026-10-04'
      };
      const snapshot = JSON.stringify(origRemito);

      expect(isRemitoFormDirty({ ...origRemito, status: 'Pagado' }, snapshot)).toBe(true);
      expect(isRemitoFormDirty({ ...origRemito, notes: 'Observación' }, snapshot)).toBe(true);
      expect(isRemitoFormDirty({
        ...origRemito,
        items: [{ description: 'Pieza A', quantity: 3, unitPrice: 1000, total: 3000 }]
      }, snapshot)).toBe(true);
      expect(isRemitoFormDirty({ ...origRemito, amountPaid: 500 }, snapshot)).toBe(true);
    });
  });

  describe('isQuoteFormDirty', () => {
    it('returns false for an empty new quote', () => {
      const newQuote: Partial<Quote> = {
        customerId: '',
        notes: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]
      };
      expect(isQuoteFormDirty(newQuote, null)).toBe(false);
    });

    it('returns true for a new quote with customer, notes, or valid items', () => {
      expect(isQuoteFormDirty({ customerId: 'cust-1' }, null)).toBe(true);
      expect(isQuoteFormDirty({ notes: 'Descuento 10%' }, null)).toBe(true);
      expect(isQuoteFormDirty({
        items: [{ description: 'Llaveros', quantity: 10, unitPrice: 500, total: 5000 }]
      }, null)).toBe(true);
    });

    it('detects changes when editing a quote', () => {
      const origQuote: Quote = {
        id: 'q-1',
        number: '0001 - 00001',
        customerId: 'c-1',
        customerName: 'Cliente Q',
        date: '2026-10-04',
        items: [{ description: 'Prototipo', quantity: 1, unitPrice: 10000, total: 10000 }],
        total: 10000,
        status: 'borrador',
        createdAt: '2026-10-04'
      };
      const snapshot = JSON.stringify(origQuote);
      expect(isQuoteFormDirty({ ...origQuote }, snapshot)).toBe(false);
      expect(isQuoteFormDirty({ ...origQuote, status: 'presupuestado' }, snapshot)).toBe(true);
      expect(isQuoteFormDirty({ ...origQuote, notes: 'Aprobado vía WhatsApp' }, snapshot)).toBe(true);
    });
  });

  describe('isExpenseFormDirty', () => {
    it('returns false for empty new expense and true once filled', () => {
      expect(isExpenseFormDirty({ supplierId: '', notes: '', items: [] }, null)).toBe(false);
      expect(isExpenseFormDirty({ supplierId: 'sup-1' }, null)).toBe(true);
      expect(isExpenseFormDirty({ notes: 'Factura A' }, null)).toBe(true);
      expect(isExpenseFormDirty({
        items: [{ id: '1', description: 'Bobina PLA', quantity: 2, unitPrice: 12000, total: 24000 }]
      }, null)).toBe(true);
    });

    it('detects changes when editing existing expense', () => {
      const origExpense: Expense = {
        id: 'e-1',
        date: '2026-10-04',
        supplierId: 's-1',
        supplierName: 'Printalot',
        items: [{ id: '1', description: 'PLA Gris', quantity: 1, unitPrice: 15000, total: 15000 }],
        total: 15000,
        notes: '',
        createdAt: '2026-10-04'
      };
      const snapshot = JSON.stringify(origExpense);
      expect(isExpenseFormDirty({ ...origExpense }, snapshot)).toBe(false);
      expect(isExpenseFormDirty({ ...origExpense, supplierId: 's-2' }, snapshot)).toBe(true);
      expect(isExpenseFormDirty({ ...origExpense, date: '2026-10-05' }, snapshot)).toBe(true);
    });
  });

  describe('isCustomerFormDirty', () => {
    it('returns false for clean customer creation and true when typing data', () => {
      expect(isCustomerFormDirty({ name: '', phone: '' }, null)).toBe(false);
      expect(isCustomerFormDirty({ name: 'Juan Perez' }, null)).toBe(true);
      expect(isCustomerFormDirty({ phone: '2944123456' }, null)).toBe(true);
      expect(isCustomerFormDirty({ cuit: '20-12345678-9' }, null)).toBe(true);
    });

    it('detects changes when editing an existing customer', () => {
      const origCustomer: Customer = {
        id: 'c-1',
        name: 'Maria Gomez',
        phone: '12345',
        email: 'maria@test.com',
        cuit: '',
        createdAt: '2026-10-04'
      };
      expect(isCustomerFormDirty({ ...origCustomer }, origCustomer)).toBe(false);
      expect(isCustomerFormDirty({ ...origCustomer, phone: '54321' }, origCustomer)).toBe(true);
      expect(isCustomerFormDirty({ ...origCustomer, notes: 'Cliente preferencial' }, origCustomer)).toBe(true);
    });
  });

  describe('isSupplierFormDirty', () => {
    it('returns false for clean new supplier and true when fields have content', () => {
      expect(isSupplierFormDirty({ name: '', phone: '' }, null)).toBe(false);
      expect(isSupplierFormDirty({ name: '3D Insur' }, null)).toBe(true);
      expect(isSupplierFormDirty({ web: 'www.insur.com' }, null)).toBe(true);
    });

    it('detects modifications on existing supplier', () => {
      const origSupplier: Supplier = {
        id: 's-1',
        name: 'Insur',
        web: 'www.insur.com',
        phone: '111',
        createdAt: '2026-10-04'
      };
      expect(isSupplierFormDirty({ ...origSupplier }, origSupplier)).toBe(false);
      expect(isSupplierFormDirty({ ...origSupplier, web: 'www.insur.com.ar' }, origSupplier)).toBe(true);
    });
  });

  describe('isPrinterFormDirty', () => {
    it('returns false for clean printer and true when name or model or hasAMS is set', () => {
      expect(isPrinterFormDirty({}, null)).toBe(false);
      expect(isPrinterFormDirty({ name: 'Bambu #1' }, null)).toBe(true);
      expect(isPrinterFormDirty({ model: 'P1S' }, null)).toBe(true);
      expect(isPrinterFormDirty({ hasAMS: true }, null)).toBe(true);
    });

    it('detects modifications when editing a printer', () => {
      const origPrinter: Printer = {
        id: 'p-1',
        name: 'Bambu #1',
        model: 'A1',
        hasAMS: false,
        history: []
      };
      expect(isPrinterFormDirty({ ...origPrinter }, origPrinter)).toBe(false);
      expect(isPrinterFormDirty({ ...origPrinter, hasAMS: true }, origPrinter)).toBe(true);
      expect(isPrinterFormDirty({ ...origPrinter, model: 'A1 Combo' }, origPrinter)).toBe(true);
    });
  });

  describe('isStockItemFormDirty', () => {
    it('returns false for unconfigured stock and true when color or minClosed changes', () => {
      expect(isStockItemFormDirty({ color: '', minClosed: 1 }, null)).toBe(false);
      expect(isStockItemFormDirty({ color: 'Rojo Fuego' }, null)).toBe(true);
      expect(isStockItemFormDirty({ minClosed: 3 }, null)).toBe(true);
    });

    it('detects modifications when editing a stock item', () => {
      const origStock: StockItem = {
        id: 'st-1',
        color: 'Negro',
        type: FilamentType.PLA,
        closedCount: 5,
        openCount: 1,
        minClosed: 2,
        hexColor: '#000000'
      };
      expect(isStockItemFormDirty({ ...origStock }, origStock)).toBe(false);
      expect(isStockItemFormDirty({ ...origStock, hexColor: '#111111' }, origStock)).toBe(true);
      expect(isStockItemFormDirty({ ...origStock, minClosed: 4 }, origStock)).toBe(true);
    });
  });

  describe('isPriceItemFormDirty', () => {
    it('returns false for empty price item and true when description or price > 0', () => {
      expect(isPriceItemFormDirty({ description: '', retailPrice: 0, wholesalePrice: 0 }, null)).toBe(false);
      expect(isPriceItemFormDirty({ description: 'Litofanía' }, null)).toBe(true);
      expect(isPriceItemFormDirty({ retailPrice: 1500 }, null)).toBe(true);
      expect(isPriceItemFormDirty({ wholesalePrice: 1000 }, null)).toBe(true);
    });

    it('detects modifications when editing existing price item', () => {
      const origPrice: PriceItem = {
        id: 'pr-1',
        description: 'Llavero Simple',
        retailPrice: 2000,
        wholesalePrice: 1200,
        wholesaleMinQuantity: 10,
        createdAt: '2026-10-04'
      };
      expect(isPriceItemFormDirty({ ...origPrice }, origPrice)).toBe(false);
      expect(isPriceItemFormDirty({ ...origPrice, retailPrice: 2500 }, origPrice)).toBe(true);
      expect(isPriceItemFormDirty({ ...origPrice, wholesaleMinQuantity: 20 }, origPrice)).toBe(true);
    });
  });

  describe('isBalanceFormDirty', () => {
    it('returns false when notes and name are empty or whitespace', () => {
      expect(isBalanceFormDirty('', '')).toBe(false);
      expect(isBalanceFormDirty('   ', '   ')).toBe(false);
    });

    it('returns true when custom notes or custom name are provided', () => {
      expect(isBalanceFormDirty('Notas de cierre contable', '')).toBe(true);
      expect(isBalanceFormDirty('', 'Cierre Especial Octubre')).toBe(true);
    });
  });
});
