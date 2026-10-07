import { describe, it, expect } from 'vitest';
import {
  extractNumberFromText,
  matchCustomerInText,
  matchSupplierInText,
  parseItemAndQuantity,
  processChatMessage,
  AssistantState,
  ChatContext
} from '../services/chatAssistantLogic';
import { Customer, Supplier, StockItem, Remito, Expense, Quote } from '../types';

const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Hospital Zonal',
    contactName: 'Dra. Gomez',
    phone: '2944123456',
    email: 'hospital@bariloche.gov.ar',
    street: 'Perito Moreno',
    number: '123',
    city: 'Bariloche',
    cuit: '30-12345678-9',
    taxCondition: 'Exento',
    createdAt: '2026-01-01'
  },
  {
    id: 'c2',
    name: 'Cervecería Patagonia',
    contactName: 'Julian',
    phone: '2944987654',
    email: 'contacto@patagonia.com',
    street: 'Km 24',
    number: '',
    city: 'Bariloche',
    cuit: '30-87654321-0',
    taxCondition: 'Responsable Inscripto',
    createdAt: '2026-01-02'
  }
];

const mockSuppliers: Supplier[] = [
  {
    id: 's1',
    name: 'Printalot',
    contactName: 'Ventas',
    phone: '1145678901',
    email: 'ventas@printalot.com',
    instagram: '',
    web: '',
    street: 'Av Corrientes',
    number: '500',
    city: 'Buenos Aires',
    notes: '',
    createdAt: '2026-01-01'
  }
];

const mockStock: StockItem[] = [
  { id: '1', color: 'Negro', closedCount: 0, openCount: 1, minClosed: 3 }, // Critical
  { id: '2', color: 'Blanco', closedCount: 4, openCount: 1, minClosed: 3 }, // OK
  { id: '3', color: 'Rojo', closedCount: 2, openCount: 1, minClosed: 1 } // OK
];

const mockRemitos: Remito[] = [
  {
    id: 'r1',
    number: '0001 - 00050',
    customerId: 'c1',
    customerName: 'Hospital Zonal',
    date: new Date().toISOString().split('T')[0],
    items: [{ description: 'Soporte 3D', quantity: 2, unitPrice: 5000, total: 10000 }],
    total: 10000,
    status: 'Pagado',
    productionStatus: 'En Producción',
    amountPaid: 10000,
    createdAt: new Date().toISOString()
  }
];

const mockExpenses: Expense[] = [
  {
    id: 'e1',
    date: new Date().toISOString().split('T')[0],
    supplierId: 's1',
    supplierName: 'Printalot',
    items: [{ id: '1', description: 'Filamento PLA', quantity: 1, unitPrice: 20000, total: 20000 }],
    total: 20000,
    createdAt: new Date().toISOString()
  }
];

const mockQuotes: Quote[] = [];

const mockContext: ChatContext = {
  customers: mockCustomers,
  suppliers: mockSuppliers,
  stock: mockStock,
  remitos: mockRemitos,
  expenses: mockExpenses,
  quotes: mockQuotes,
  userName: 'Lucas'
};

describe('Chat Assistant Logic - Utilities', () => {
  it('extracts numbers correctly from natural language', () => {
    expect(extractNumberFromText('$15000')).toBe(15000);
    expect(extractNumberFromText('15.000')).toBe(15000);
    expect(extractNumberFromText('c/u 4500')).toBe(4500);
    expect(extractNumberFromText('total $35.500')).toBe(35500);
    expect(extractNumberFromText('sin números')).toBeNull();
  });

  it('matches customer in text', () => {
    expect(matchCustomerInText('hospital zonal', mockCustomers)?.id).toBe('c1');
    expect(matchCustomerInText('venta a cervecería patagonia', mockCustomers)?.id).toBe('c2');
    expect(matchCustomerInText('cliente desconocido', mockCustomers)).toBeNull();
  });

  it('matches supplier in text', () => {
    expect(matchSupplierInText('compré en printalot', mockSuppliers)?.id).toBe('s1');
    expect(matchSupplierInText('otro negocio', mockSuppliers)).toBeNull();
  });

  it('parses quantity and item description', () => {
    expect(parseItemAndQuantity('3 mates 3d')).toEqual({ quantity: 3, description: 'mates 3d' });
    expect(parseItemAndQuantity('50x stickers vinilo')).toEqual({ quantity: 50, description: 'stickers vinilo' });
    expect(parseItemAndQuantity('Topper de cumpleaños')).toEqual({ quantity: 1, description: 'Topper de cumpleaños' });
  });
});

describe('Chat Assistant Logic - Guided Sale Flow (Slot Filling)', () => {
  it('walks through the 4-step guided sale flow and emits create_sale action upon confirmation', () => {
    let state: AssistantState = { currentIntent: 'idle' };

    // Step 0: User triggers sale flow
    let result = processChatMessage('quiero registrar una venta', state, mockContext);
    expect(result.newState.currentIntent).toBe('sale_registration');
    expect(result.newState.saleStep).toBe('ASK_CUSTOMER');
    state = result.newState;

    // Step 1: User provides customer
    result = processChatMessage('Hospital Zonal', state, mockContext);
    expect(result.newState.saleStep).toBe('ASK_ITEMS');
    expect(result.newState.saleDraft?.customerName).toBe('Hospital Zonal');
    expect(result.newState.saleDraft?.customerId).toBe('c1');
    state = result.newState;

    // Step 2: User provides items and quantity
    result = processChatMessage('3 soportes para monitor', state, mockContext);
    expect(result.newState.saleStep).toBe('ASK_PRICE');
    expect(result.newState.saleDraft?.itemQuantity).toBe(3);
    expect(result.newState.saleDraft?.itemDescription).toBe('soportes para monitor');
    state = result.newState;

    // Step 3: User provides price (unit price)
    result = processChatMessage('5000 c/u', state, mockContext);
    expect(result.newState.saleStep).toBe('ASK_PAYMENT');
    expect(result.newState.saleDraft?.itemUnitPrice).toBe(5000);
    expect(result.newState.saleDraft?.total).toBe(15000);
    state = result.newState;

    // Step 4: User provides payment status
    result = processChatMessage('Ya Cobrado', state, mockContext);
    expect(result.newState.saleStep).toBe('AWAITING_CONFIRMATION');
    expect(result.newState.saleDraft?.status).toBe('Pagado');
    expect(result.newState.saleDraft?.amountPaid).toBe(15000);
    expect(result.card?.type).toBe('sale_confirmation');
    state = result.newState;

    // Step 5: User confirms
    result = processChatMessage('confirmar venta', state, mockContext);
    expect(result.newState.currentIntent).toBe('idle');
    expect(result.actionToExecute?.type).toBe('create_sale');
    expect(result.actionToExecute?.payload.total).toBe(15000);
    expect(result.card?.type).toBe('sale_success');
  });

  it('can be cancelled at any point', () => {
    const state: AssistantState = {
      currentIntent: 'sale_registration',
      saleStep: 'ASK_PRICE',
      saleDraft: { customerName: 'Juan', itemDescription: 'Mate' }
    };

    const result = processChatMessage('cancelar', state, mockContext);
    expect(result.newState.currentIntent).toBe('idle');
    expect(result.replyText).toContain('cancelada');
  });
});

describe('Chat Assistant Logic - Guided Expense Flow', () => {
  it('walks through the guided expense flow and emits create_expense action upon confirmation', () => {
    let state: AssistantState = { currentIntent: 'idle' };

    // Step 0: Start expense flow
    let result = processChatMessage('cargar gasto', state, mockContext);
    expect(result.newState.currentIntent).toBe('expense_registration');
    expect(result.newState.expenseStep).toBe('ASK_DESCRIPTION');
    state = result.newState;

    // Step 1: Description
    result = processChatMessage('2 bobinas PLA negro', state, mockContext);
    expect(result.newState.expenseStep).toBe('ASK_SUPPLIER_OR_CATEGORY');
    expect(result.newState.expenseDraft?.description).toBe('2 bobinas PLA negro');
    state = result.newState;

    // Step 2: Supplier
    result = processChatMessage('Printalot', state, mockContext);
    expect(result.newState.expenseStep).toBe('ASK_AMOUNT');
    expect(result.newState.expenseDraft?.supplierName).toBe('Printalot');
    expect(result.newState.expenseDraft?.supplierId).toBe('s1');
    state = result.newState;

    // Step 3: Amount
    result = processChatMessage('48000', state, mockContext);
    expect(result.newState.expenseStep).toBe('ASK_PAYMENT_METHOD');
    expect(result.newState.expenseDraft?.amount).toBe(48000);
    state = result.newState;

    // Step 4: Payment method
    result = processChatMessage('Transferencia', state, mockContext);
    expect(result.newState.expenseStep).toBe('AWAITING_CONFIRMATION');
    expect(result.card?.type).toBe('expense_confirmation');
    state = result.newState;

    // Step 5: Confirmation
    result = processChatMessage('confirmar gasto', state, mockContext);
    expect(result.newState.currentIntent).toBe('idle');
    expect(result.actionToExecute?.type).toBe('create_expense');
    expect(result.actionToExecute?.payload.amount).toBe(48000);
    expect(result.card?.type).toBe('expense_success');
  });
});

describe('Chat Assistant Logic - Queries & Navigation', () => {
  it('answers stock queries with critical items count and details', () => {
    const result = processChatMessage('¿cómo está el stock?', { currentIntent: 'idle' }, mockContext);
    expect(result.card?.type).toBe('stock_critical');
    expect(result.replyText).toContain('crítico');
    expect(result.replyText).toContain('Negro');
  });

  it('answers today sales query', () => {
    const result = processChatMessage('¿cuáles son las ventas de hoy?', { currentIntent: 'idle' }, mockContext);
    expect(result.replyText).toContain('Ventas de Hoy');
    expect(result.replyText).toContain('$10.000');
  });

  it('answers pending orders query', () => {
    const result = processChatMessage('pedidos pendientes', { currentIntent: 'idle' }, mockContext);
    expect(result.card?.type).toBe('orders_summary');
    expect(result.replyText).toContain('Producción');
  });

  it('answers balance query', () => {
    const result = processChatMessage('balance de hoy', { currentIntent: 'idle' }, mockContext);
    expect(result.card?.type).toBe('balance_summary');
    expect(result.replyText).toContain('Balance Operativo');
  });

  it('handles navigation commands', () => {
    const result = processChatMessage('ir a ventas', { currentIntent: 'idle' }, mockContext);
    expect(result.actionToExecute?.type).toBe('navigate');
    expect(result.actionToExecute?.payload).toBe('remitos');
  });
});
