import { Remito, Customer, Supplier, Expense, StockItem, Quote, RemitoItem } from '../types';
import { formatRemitoNumber } from './remitoLogic';

export type ConversationIntent = 
  | 'idle' 
  | 'sale_registration' 
  | 'expense_registration' 
  | 'stock_query' 
  | 'orders_query' 
  | 'balance_query'
  | 'budget_calc';

export type SaleSlotStep = 
  | 'ASK_CUSTOMER' 
  | 'ASK_ITEMS' 
  | 'ASK_PRICE' 
  | 'ASK_PAYMENT' 
  | 'AWAITING_CONFIRMATION';

export type ExpenseSlotStep = 
  | 'ASK_DESCRIPTION' 
  | 'ASK_SUPPLIER_OR_CATEGORY' 
  | 'ASK_AMOUNT' 
  | 'ASK_PAYMENT_METHOD' 
  | 'AWAITING_CONFIRMATION';

export interface SaleDraft {
  customerId?: string;
  customerName?: string;
  items?: RemitoItem[];
  itemDescription?: string;
  itemQuantity?: number;
  itemUnitPrice?: number;
  total?: number;
  status?: 'Pagado' | 'Pendiente';
  amountPaid?: number;
  notes?: string;
}

export interface ExpenseDraft {
  description?: string;
  categoryOrSupplier?: string;
  supplierId?: string;
  supplierName?: string;
  amount?: number;
  paymentMethod?: string;
}

export interface AssistantState {
  currentIntent: ConversationIntent;
  saleStep?: SaleSlotStep;
  saleDraft?: SaleDraft;
  expenseStep?: ExpenseSlotStep;
  expenseDraft?: ExpenseDraft;
}

export interface QuickReply {
  label: string;
  action: string;
  payload?: any;
  color?: string;
}

export interface AssistantResponseCard {
  type: 
    | 'sale_confirmation' 
    | 'sale_success' 
    | 'expense_confirmation' 
    | 'expense_success' 
    | 'stock_critical' 
    | 'orders_summary' 
    | 'balance_summary';
  data: any;
}

export interface ProcessedAssistantOutput {
  replyText: string;
  card?: AssistantResponseCard;
  quickReplies?: QuickReply[];
  newState: AssistantState;
  actionToExecute?: {
    type: 'create_sale' | 'create_expense' | 'navigate';
    payload: any;
  };
}

export interface ChatContext {
  customers: Customer[];
  suppliers: Supplier[];
  stock: StockItem[];
  remitos: Remito[];
  expenses: Expense[];
  quotes: Quote[];
  userName: string;
}

/**
 * Format currency in Argentine Pesos
 */
export const formatCurrency = (val: number): string => {
  return `$${Math.round(val).toLocaleString('es-AR')}`;
};

/**
 * Normalize date string to YYYY-MM-DD
 */
export const toDateKey = (dateStr?: string | Date): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr instanceof Date) return dateStr.toISOString().split('T')[0];
  return dateStr.slice(0, 10);
};

/**
 * Extract numbers from text (e.g., "$15000", "15.000", "15000")
 */
export const extractNumberFromText = (text: string): number | null => {
  const clean = text.replace(/[$€]/g, '').trim();
  // Match standard numbers or numbers with thousands separator (e.g. 15.000, 15000)
  const match = clean.match(/(?:(?:c\/u|total|de|por)\s*)?(\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+)/i);
  if (!match) return null;
  
  let numStr = match[1];
  // If format is like 15.000 (thousands dot)
  if (numStr.includes('.') && !numStr.includes(',')) {
    const parts = numStr.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      numStr = parts.join('');
    }
  } else if (numStr.includes(',') && !numStr.includes('.')) {
    const parts = numStr.split(',');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      numStr = parts.join('');
    } else {
      numStr = parts.join('.');
    }
  }
  
  const parsed = parseFloat(numStr);
  return isNaN(parsed) ? null : Math.round(parsed);
};

/**
 * Detect customer in text from customer list
 */
export const matchCustomerInText = (text: string, customers: Customer[]): Customer | null => {
  const lower = text.toLowerCase().trim();
  for (const c of customers) {
    if (!c.name) continue;
    const nameLower = c.name.toLowerCase();
    if (lower === nameLower || lower.includes(nameLower) || (nameLower.length > 3 && lower.includes(nameLower.split(' ')[0]))) {
      return c;
    }
  }
  return null;
};

/**
 * Detect supplier in text from supplier list
 */
export const matchSupplierInText = (text: string, suppliers: Supplier[]): Supplier | null => {
  const lower = text.toLowerCase().trim();
  for (const s of suppliers) {
    if (!s.name) continue;
    const nameLower = s.name.toLowerCase();
    if (lower === nameLower || lower.includes(nameLower)) {
      return s;
    }
  }
  return null;
};

/**
 * Parse item and quantity (e.g., "2 mates de messi", "50 stickers vinilo")
 */
export const parseItemAndQuantity = (text: string): { quantity: number; description: string } => {
  const match = text.match(/^(\d+)\s*(?:x\s*|unidades?\s*de\s*|de\s*)?(.+)$/i);
  if (match) {
    const qty = parseInt(match[1], 10);
    const desc = match[2].trim();
    if (qty > 0 && desc.length > 0) {
      return { quantity: qty, description: desc };
    }
  }
  return { quantity: 1, description: text.trim() };
};

/**
 * Main conversational processor
 */
export function processChatMessage(
  input: string,
  state: AssistantState,
  context: ChatContext
): ProcessedAssistantOutput {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Global Cancellations / Reset
  if (['cancelar', 'abortar', 'reiniciar', 'salir', 'empezar de nuevo', 'volver'].includes(lower)) {
    return {
      replyText: '🔄 Operación cancelada. El asistente está listo para una nueva consulta o tarea. ¿En qué puedo ayudarte?',
      quickReplies: [
        { label: '➕ Registrar Venta', action: 'send_text', payload: 'quiero registrar una venta' },
        { label: '💰 Registrar Gasto', action: 'send_text', payload: 'quiero registrar un gasto' },
        { label: '📦 Ver Stock Crítico', action: 'send_text', payload: '¿cómo está el stock?' },
        { label: '📊 Ventas de Hoy', action: 'send_text', payload: '¿cuáles son las ventas de hoy?' }
      ],
      newState: { currentIntent: 'idle' }
    };
  }

  // 2. Navigation Commands
  if (lower.startsWith('ir a ') || lower.startsWith('ver ') || lower.startsWith('abrir ')) {
    const target = lower.replace(/^(ir a|ver|abrir)\s+/, '').trim();
    if (target.includes('venta') || target.includes('remito')) {
      return {
        replyText: 'Navegando a la sección de **Ventas (Remitos)**...',
        newState: { currentIntent: 'idle' },
        actionToExecute: { type: 'navigate', payload: 'remitos' }
      };
    }
    if (target.includes('gasto')) {
      return {
        replyText: 'Navegando a la sección de **Gastos**...',
        newState: { currentIntent: 'idle' },
        actionToExecute: { type: 'navigate', payload: 'expenses' }
      };
    }
    if (target.includes('cliente')) {
      return {
        replyText: 'Navegando a la sección de **Clientes**...',
        newState: { currentIntent: 'idle' },
        actionToExecute: { type: 'navigate', payload: 'customers' }
      };
    }
    if (target.includes('stock')) {
      return {
        replyText: 'Navegando al tablero de **Stock**...',
        newState: { currentIntent: 'idle' },
        actionToExecute: { type: 'navigate', payload: 'stock' }
      };
    }
    if (target.includes('balance')) {
      return {
        replyText: 'Navegando a la sección de **Balances**...',
        newState: { currentIntent: 'idle' },
        actionToExecute: { type: 'navigate', payload: 'balances' }
      };
    }
    if (target.includes('dashboard') || target.includes('inicio')) {
      return {
        replyText: 'Navegando al **Dashboard Principal**...',
        newState: { currentIntent: 'idle' },
        actionToExecute: { type: 'navigate', payload: 'dashboard' }
      };
    }
  }

  // 3. Handle Active Intent: SALE REGISTRATION
  if (state.currentIntent === 'sale_registration') {
    return handleSaleFlow(text, lower, state, context);
  }

  // 4. Handle Active Intent: EXPENSE REGISTRATION
  if (state.currentIntent === 'expense_registration') {
    return handleExpenseFlow(text, lower, state, context);
  }

  // 5. Detect New Intent: Sale Registration Start
  if (
    /(registrar|cargar|nueva|anotar|iniciar|crear)\s+(una\s+)?venta/i.test(lower) ||
    lower.includes('registrar venta') || 
    lower.includes('cargar venta') || 
    lower.includes('nueva venta') || 
    lower.includes('anotar venta') ||
    lower.startsWith('venta a ') ||
    lower.startsWith('venta para ') ||
    lower === 'venta'
  ) {
    // Check if partial data is already present in prompt
    const initialDraft: SaleDraft = {};
    const matchedCust = matchCustomerInText(text, context.customers);
    if (matchedCust) {
      initialDraft.customerId = matchedCust.id;
      initialDraft.customerName = matchedCust.name;
    }

    // Next step determination
    return getNextSalePrompt({
      currentIntent: 'sale_registration',
      saleStep: initialDraft.customerName ? 'ASK_ITEMS' : 'ASK_CUSTOMER',
      saleDraft: initialDraft
    }, context, initialDraft.customerName ? `¡Perfecto! Detecté el cliente **${initialDraft.customerName}**.\n\n` : '');
  }

  // 6. Detect New Intent: Expense Registration Start
  if (
    /(registrar|cargar|nuevo|anotar|iniciar|crear)\s+(un\s+)?gasto/i.test(lower) ||
    lower.includes('registrar gasto') || 
    lower.includes('cargar gasto') || 
    lower.includes('nuevo gasto') || 
    lower.includes('anotar gasto') ||
    lower.includes('compré insumo') ||
    lower.includes('compra de insumo') ||
    lower === 'gasto'
  ) {
    return getNextExpensePrompt({
      currentIntent: 'expense_registration',
      expenseStep: 'ASK_DESCRIPTION',
      expenseDraft: {}
    }, context);
  }

  // 7. Query: Stock status
  if (lower.includes('stock') || lower.includes('filamento') || lower.includes('faltante')) {
    return handleStockQuery(context);
  }

  // 8. Query: Today's sales or sales overview
  if (lower.includes('ventas de hoy') || lower.includes('venta hoy') || lower.includes('cuanto vendimos') || lower.includes('cuánto vendimos')) {
    return handleTodaySalesQuery(context);
  }

  // 9. Query: Pending orders / production queue
  if (lower.includes('pedido') || lower.includes('producción') || lower.includes('produccion') || lower.includes('para entregar')) {
    return handlePendingOrdersQuery(context);
  }

  // 10. Query: Balance today / metrics
  if (lower.includes('balance') || lower.includes('métrica') || lower.includes('metrica') || lower.includes('caja de hoy')) {
    return handleBalanceQuery(context);
  }

  // 11. Help / Default Fallback
  return {
    replyText: `Hola ${context.userName || 'Lucas'}. Soy tu asistente operativo en **SinaSoft**. Puedo ayudarte a:
- 📝 **Registrar ventas** de forma guiada ("cargar venta")
- 💸 **Registrar gastos** de insumos o taller ("cargar gasto")
- 📦 **Consultar stock** y alertas de reposición ("¿cómo está el stock?")
- 📊 **Consultar ventas y caja del día** ("¿cuáles son las ventas de hoy?")
- ⏳ **Ver pedidos pendientes y producción** ("pedidos pendientes")

¿Qué deseas realizar hoy?`,
    quickReplies: [
      { label: '➕ Registrar Venta', action: 'send_text', payload: 'quiero registrar una venta' },
      { label: '💰 Registrar Gasto', action: 'send_text', payload: 'quiero registrar un gasto' },
      { label: '📦 Consultar Stock', action: 'send_text', payload: '¿cómo está el stock?' },
      { label: '📊 Ventas de Hoy', action: 'send_text', payload: '¿cuáles son las ventas de hoy?' },
      { label: '⚙️ Pedidos en Producción', action: 'send_text', payload: 'pedidos pendientes' }
    ],
    newState: { currentIntent: 'idle' }
  };
}

/**
 * Handle Sale Flow Steps
 */
function handleSaleFlow(
  text: string,
  lower: string,
  state: AssistantState,
  context: ChatContext
): ProcessedAssistantOutput {
  const draft: SaleDraft = { ...(state.saleDraft || {}) };
  const currentStep = state.saleStep || 'ASK_CUSTOMER';

  // Step 1: Customer
  if (currentStep === 'ASK_CUSTOMER') {
    const matched = matchCustomerInText(text, context.customers);
    if (matched) {
      draft.customerId = matched.id;
      draft.customerName = matched.name;
    } else {
      draft.customerId = '';
      draft.customerName = text.trim();
    }
    return getNextSalePrompt({ ...state, saleStep: 'ASK_ITEMS', saleDraft: draft }, context);
  }

  // Step 2: Items & Quantity
  if (currentStep === 'ASK_ITEMS') {
    const parsed = parseItemAndQuantity(text);
    draft.itemDescription = parsed.description;
    draft.itemQuantity = parsed.quantity;
    return getNextSalePrompt({ ...state, saleStep: 'ASK_PRICE', saleDraft: draft }, context);
  }

  // Step 3: Price / Total
  if (currentStep === 'ASK_PRICE') {
    const amount = extractNumberFromText(text);
    if (amount === null || amount <= 0) {
      return {
        replyText: '⚠️ No pude identificar un monto válido. Por favor ingresá un número, por ejemplo: `15000` o `4500 c/u`.',
        newState: state,
        quickReplies: [
          { label: '$5.000', action: 'send_text', payload: '5000' },
          { label: '$10.000', action: 'send_text', payload: '10000' },
          { label: '$25.000', action: 'send_text', payload: '25000' }
        ]
      };
    }

    const qty = draft.itemQuantity || 1;
    // Check if user specified "c/u" or unit price
    if (lower.includes('c/u') || lower.includes('cada uno') || lower.includes('por unidad')) {
      draft.itemUnitPrice = amount;
      draft.total = amount * qty;
    } else if (amount > 100 && amount % qty === 0 && qty > 1 && !lower.includes('total')) {
      // If divisible and qty > 1, assume total or calculate unit
      draft.total = amount;
      draft.itemUnitPrice = Math.round(amount / qty);
    } else {
      draft.total = amount;
      draft.itemUnitPrice = Math.round(amount / qty);
    }

    draft.items = [{
      description: draft.itemDescription || 'Venta de impresión 3D',
      quantity: qty,
      unitPrice: draft.itemUnitPrice,
      total: draft.total
    }];

    return getNextSalePrompt({ ...state, saleStep: 'ASK_PAYMENT', saleDraft: draft }, context);
  }

  // Step 4: Payment Status
  if (currentStep === 'ASK_PAYMENT') {
    const isPaid = lower.includes('pagad') || lower.includes('cobrad') || lower.includes('efectivo') || lower.includes('transferencia') || lower.includes('ya cobrado') || lower.includes('si') || lower.includes('sí');
    const isPending = lower.includes('pend') || lower.includes('debe') || lower.includes('falta') || lower.includes('seña');

    if (!isPaid && !isPending) {
      return {
        replyText: '¿El pago está ya **Cobrado (Pagado)** o queda **Pendiente**? Seleccioná una de las opciones:',
        newState: state,
        quickReplies: [
          { label: '✅ Ya Cobrado / Pagado', action: 'send_text', payload: 'Cobrado' },
          { label: '⏳ Queda Pendiente', action: 'send_text', payload: 'Pendiente' }
        ]
      };
    }

    draft.status = isPaid ? 'Pagado' : 'Pendiente';
    draft.amountPaid = isPaid ? (draft.total || 0) : 0;

    return getNextSalePrompt({ ...state, saleStep: 'AWAITING_CONFIRMATION', saleDraft: draft }, context);
  }

  // Step 5: Confirmation
  if (currentStep === 'AWAITING_CONFIRMATION') {
    if (lower.includes('confirm') || lower.includes('si') || lower.includes('sí') || lower.includes('guardar') || lower.includes('dale') || lower.includes('ok')) {
      return {
        replyText: `✅ ¡Venta registrada con éxito para **${draft.customerName}** por **${formatCurrency(draft.total || 0)}**! Se ha generado la venta y añadido a la cola de producción.`,
        card: {
          type: 'sale_success',
          data: {
            customerName: draft.customerName,
            total: draft.total,
            status: draft.status,
            itemDescription: draft.itemDescription,
            quantity: draft.itemQuantity
          }
        },
        quickReplies: [
          { label: '📄 Ver en Ventas', action: 'navigate', payload: 'remitos' },
          { label: '➕ Registrar Otra Venta', action: 'send_text', payload: 'quiero registrar una venta' },
          { label: '📦 Ver Stock', action: 'send_text', payload: '¿cómo está el stock?' }
        ],
        newState: { currentIntent: 'idle' },
        actionToExecute: {
          type: 'create_sale',
          payload: draft
        }
      };
    }

    return {
      replyText: '¿Deseas confirmar y guardar esta venta en el sistema o cancelar?',
      newState: state,
      quickReplies: [
        { label: '✅ Confirmar Venta', action: 'send_text', payload: 'confirmar venta' },
        { label: '❌ Cancelar', action: 'send_text', payload: 'cancelar' }
      ]
    };
  }

  return {
    replyText: 'Disculpa, no entendí. Podés escribir "cancelar" para reiniciar.',
    newState: state
  };
}

/**
 * Generate Next Prompt for Sale Flow
 */
function getNextSalePrompt(state: AssistantState, context: ChatContext, prefix: string = ''): ProcessedAssistantOutput {
  const draft = state.saleDraft || {};
  const step = state.saleStep;

  if (step === 'ASK_CUSTOMER') {
    // Generate quick customer suggestions
    const topCustomers = context.customers.slice(0, 4).map(c => ({
      label: `👤 ${c.name}`,
      action: 'send_text',
      payload: c.name
    }));

    return {
      replyText: `${prefix}📝 **Registro de Venta (Paso 1/4)**\n¿Para qué cliente o comprador es la venta? Podés escribir el nombre o elegir uno de los clientes frecuentes:`,
      quickReplies: [
        ...topCustomers,
        { label: 'Consumidor Final', action: 'send_text', payload: 'Consumidor Final' }
      ],
      newState: state
    };
  }

  if (step === 'ASK_ITEMS') {
    return {
      replyText: `${prefix}📦 **Paso 2/4 - Producto y Cantidad**\nCliente: **${draft.customerName}**.\n\n¿Qué producto o ítem se vendió y en qué cantidad?\n*(Por ejemplo: "2 Mates 3D", "1 Topper de torta" o "50 Stickers vinilo")*`,
      quickReplies: [
        { label: '1 Mate 3D Personalizado', action: 'send_text', payload: '1 Mate 3D Personalizado' },
        { label: '1 Topper de Torta', action: 'send_text', payload: '1 Topper de Torta' },
        { label: '2 Soportes Auricular', action: 'send_text', payload: '2 Soportes Auricular' }
      ],
      newState: state
    };
  }

  if (step === 'ASK_PRICE') {
    return {
      replyText: `${prefix}💵 **Paso 3/4 - Precio de Venta**\nÍtem: **${draft.itemQuantity}x ${draft.itemDescription}**.\n\n¿Cuál es el precio unitario o el monto total de la venta?\n*(Por ejemplo: "15000" o "4500 c/u")*`,
      quickReplies: [
        { label: '$8.000', action: 'send_text', payload: '8000' },
        { label: '$15.000', action: 'send_text', payload: '15000' },
        { label: '$25.000', action: 'send_text', payload: '25000' },
        { label: '$40.000', action: 'send_text', payload: '40000' }
      ],
      newState: state
    };
  }

  if (step === 'ASK_PAYMENT') {
    return {
      replyText: `${prefix}💳 **Paso 4/4 - Estado de Pago**\nTotal calculado: **${formatCurrency(draft.total || 0)}** (${draft.itemQuantity} unid. a ${formatCurrency(draft.itemUnitPrice || 0)} c/u).\n\n¿Cuál es el estado de cobro?`,
      quickReplies: [
        { label: '✅ Ya Cobrado / Pagado', action: 'send_text', payload: 'Ya Cobrado' },
        { label: '⏳ Queda Pendiente', action: 'send_text', payload: 'Pendiente' }
      ],
      newState: state
    };
  }

  if (step === 'AWAITING_CONFIRMATION') {
    return {
      replyText: `📋 **Resumen de la Venta**\nRevisá los datos antes de guardarla:`,
      card: {
        type: 'sale_confirmation',
        data: {
          customerName: draft.customerName,
          items: draft.items || [],
          total: draft.total,
          status: draft.status,
          amountPaid: draft.amountPaid
        }
      },
      quickReplies: [
        { label: '✅ Confirmar Venta', action: 'send_text', payload: 'confirmar venta' },
        { label: '❌ Cancelar', action: 'send_text', payload: 'cancelar' }
      ],
      newState: state
    };
  }

  return { replyText: 'Error en flujo de venta.', newState: { currentIntent: 'idle' } };
}

/**
 * Handle Expense Flow Steps
 */
function handleExpenseFlow(
  text: string,
  lower: string,
  state: AssistantState,
  context: ChatContext
): ProcessedAssistantOutput {
  const draft: ExpenseDraft = { ...(state.expenseDraft || {}) };
  const currentStep = state.expenseStep || 'ASK_DESCRIPTION';

  // Step 1: Description
  if (currentStep === 'ASK_DESCRIPTION') {
    draft.description = text.trim();
    return getNextExpensePrompt({ ...state, expenseStep: 'ASK_SUPPLIER_OR_CATEGORY', expenseDraft: draft }, context);
  }

  // Step 2: Supplier or Category
  if (currentStep === 'ASK_SUPPLIER_OR_CATEGORY') {
    const matched = matchSupplierInText(text, context.suppliers);
    if (matched) {
      draft.supplierId = matched.id;
      draft.supplierName = matched.name;
      draft.categoryOrSupplier = matched.name;
    } else {
      draft.supplierId = '';
      draft.supplierName = text.trim();
      draft.categoryOrSupplier = text.trim();
    }
    return getNextExpensePrompt({ ...state, expenseStep: 'ASK_AMOUNT', expenseDraft: draft }, context);
  }

  // Step 3: Amount
  if (currentStep === 'ASK_AMOUNT') {
    const amount = extractNumberFromText(text);
    if (amount === null || amount <= 0) {
      return {
        replyText: '⚠️ Por favor ingresá un monto válido para el gasto (ej: `25000`).',
        newState: state,
        quickReplies: [
          { label: '$15.000', action: 'send_text', payload: '15000' },
          { label: '$30.000', action: 'send_text', payload: '30000' },
          { label: '$60.000', action: 'send_text', payload: '60000' }
        ]
      };
    }
    draft.amount = amount;
    return getNextExpensePrompt({ ...state, expenseStep: 'ASK_PAYMENT_METHOD', expenseDraft: draft }, context);
  }

  // Step 4: Payment Method
  if (currentStep === 'ASK_PAYMENT_METHOD') {
    draft.paymentMethod = text.trim();
    return getNextExpensePrompt({ ...state, expenseStep: 'AWAITING_CONFIRMATION', expenseDraft: draft }, context);
  }

  // Step 5: Confirmation
  if (currentStep === 'AWAITING_CONFIRMATION') {
    if (lower.includes('confirm') || lower.includes('si') || lower.includes('sí') || lower.includes('guardar') || lower.includes('dale') || lower.includes('ok')) {
      return {
        replyText: `✅ ¡Gasto de **${formatCurrency(draft.amount || 0)}** registrado con éxito en el sistema!`,
        card: {
          type: 'expense_success',
          data: {
            description: draft.description,
            supplierName: draft.supplierName,
            amount: draft.amount,
            paymentMethod: draft.paymentMethod
          }
        },
        quickReplies: [
          { label: '💰 Ver en Gastos', action: 'navigate', payload: 'expenses' },
          { label: '➕ Registrar Otro Gasto', action: 'send_text', payload: 'quiero registrar un gasto' },
          { label: '📊 Ver Balance', action: 'send_text', payload: 'balance de hoy' }
        ],
        newState: { currentIntent: 'idle' },
        actionToExecute: {
          type: 'create_expense',
          payload: draft
        }
      };
    }

    return {
      replyText: '¿Deseas confirmar el registro de este gasto?',
      newState: state,
      quickReplies: [
        { label: '✅ Confirmar Gasto', action: 'send_text', payload: 'confirmar gasto' },
        { label: '❌ Cancelar', action: 'send_text', payload: 'cancelar' }
      ]
    };
  }

  return { replyText: 'Error en flujo de gasto.', newState: { currentIntent: 'idle' } };
}

/**
 * Generate Next Prompt for Expense Flow
 */
function getNextExpensePrompt(state: AssistantState, context: ChatContext): ProcessedAssistantOutput {
  const draft = state.expenseDraft || {};
  const step = state.expenseStep;

  if (step === 'ASK_DESCRIPTION') {
    return {
      replyText: `💸 **Registro de Gasto (Paso 1/4)**\n¿Cuál es el concepto o descripción del gasto?\n*(Ej: "3 Bobinas PLA negro Grilon3" o "Pago de servicio eléctrico del taller")*`,
      quickReplies: [
        { label: 'Bobina Filamento PLA', action: 'send_text', payload: 'Bobina Filamento PLA' },
        { label: 'Papel Adhesivo / Gráfica', action: 'send_text', payload: 'Papel Adhesivo Gráfica' },
        { label: 'Repuestos Bambu Lab / Hotend', action: 'send_text', payload: 'Repuestos Bambu Lab Hotend' }
      ],
      newState: state
    };
  }

  if (step === 'ASK_SUPPLIER_OR_CATEGORY') {
    const topSuppliers = context.suppliers.slice(0, 3).map(s => ({
      label: `🏢 ${s.name}`,
      action: 'send_text',
      payload: s.name
    }));

    return {
      replyText: `🏢 **Paso 2/4 - Proveedor o Categoría**\nConcepto: **${draft.description}**.\n\n¿A qué proveedor o rubro corresponde?`,
      quickReplies: [
        ...topSuppliers,
        { label: 'Filamentos / Insumos 3D', action: 'send_text', payload: 'Filamentos / Insumos 3D' },
        { label: 'Insumos Gráfica', action: 'send_text', payload: 'Insumos Gráfica' },
        { label: 'Servicios / Taller', action: 'send_text', payload: 'Servicios / Taller' }
      ],
      newState: state
    };
  }

  if (step === 'ASK_AMOUNT') {
    return {
      replyText: `💰 **Paso 3/4 - Monto del Gasto**\nProveedor: **${draft.supplierName}**.\n\n¿Cuál fue el monto total abonado?`,
      quickReplies: [
        { label: '$25.000', action: 'send_text', payload: '25000' },
        { label: '$50.000', action: 'send_text', payload: '50000' },
        { label: '$75.000', action: 'send_text', payload: '75000' }
      ],
      newState: state
    };
  }

  if (step === 'ASK_PAYMENT_METHOD') {
    return {
      replyText: `💳 **Paso 4/4 - Método de Pago**\nMonto: **${formatCurrency(draft.amount || 0)}**.\n\n¿Con qué medio se abonó el gasto?`,
      quickReplies: [
        { label: 'Transferencia Bancaria', action: 'send_text', payload: 'Transferencia Bancaria' },
        { label: 'Efectivo', action: 'send_text', payload: 'Efectivo' },
        { label: 'MercadoPago', action: 'send_text', payload: 'MercadoPago' },
        { label: 'Tarjeta de Débito', action: 'send_text', payload: 'Tarjeta Débito' }
      ],
      newState: state
    };
  }

  if (step === 'AWAITING_CONFIRMATION') {
    return {
      replyText: `📋 **Resumen del Gasto**\nPor favor verificá los datos para registrar el egreso:`,
      card: {
        type: 'expense_confirmation',
        data: {
          description: draft.description,
          supplierName: draft.supplierName,
          amount: draft.amount,
          paymentMethod: draft.paymentMethod
        }
      },
      quickReplies: [
        { label: '✅ Confirmar Gasto', action: 'send_text', payload: 'confirmar gasto' },
        { label: '❌ Cancelar', action: 'send_text', payload: 'cancelar' }
      ],
      newState: state
    };
  }

  return { replyText: 'Error en flujo de gasto.', newState: { currentIntent: 'idle' } };
}

/**
 * Handle Stock Query
 */
function handleStockQuery(context: ChatContext): ProcessedAssistantOutput {
  const stock = context.stock;
  const criticalItems = stock.filter(item => {
    const min = item.minClosed !== undefined ? item.minClosed : (item.type === 'PET-G' ? 1 : (item.color === 'Blanco' || item.color === 'Negro' ? 3 : 1));
    return item.closedCount < min;
  });

  const totalClosed = stock.reduce((sum, item) => sum + item.closedCount, 0);
  const totalOpen = stock.reduce((sum, item) => sum + item.openCount, 0);

  let reply = `📦 **Estado Actual del Stock**:\n`;
  reply += `- Total unidades cerradas: **${totalClosed}**\n`;
  reply += `- Total unidades en uso: **${totalOpen}**\n\n`;

  if (criticalItems.length > 0) {
    reply += `⚠️ **${criticalItems.length} ítems en nivel crítico o por reponer:**\n`;
    criticalItems.slice(0, 6).forEach(item => {
      const name = item.name || `${item.type || 'PLA'} ${item.color || ''}`;
      reply += `• **${name}**: ${item.closedCount} cerradas (Mínimo: ${item.minClosed || 1})\n`;
    });
    if (criticalItems.length > 6) {
      reply += `• ... y ${criticalItems.length - 6} más.\n`;
    }
  } else {
    reply += `✅ **¡Todo en orden!** No hay ítems por debajo del stock mínimo de seguridad.`;
  }

  return {
    replyText: reply,
    card: {
      type: 'stock_critical',
      data: {
        criticalCount: criticalItems.length,
        totalClosed,
        totalOpen,
        items: criticalItems.slice(0, 5)
      }
    },
    quickReplies: [
      { label: '🧵 Tablero Filamentos', action: 'navigate', payload: 'stock' },
      { label: '🎨 Stock Gráfica', action: 'navigate', payload: 'stock-grafica' },
      { label: '➕ Registrar Venta', action: 'send_text', payload: 'quiero registrar una venta' }
    ],
    newState: { currentIntent: 'idle' }
  };
}

/**
 * Handle Today's Sales Query
 */
function handleTodaySalesQuery(context: ChatContext): ProcessedAssistantOutput {
  const today = toDateKey(new Date());
  const todayRemitos = context.remitos.filter(r => !r.isDraft && toDateKey(r.date) === today);

  const totalBilledToday = todayRemitos.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalCollectedToday = todayRemitos.reduce((sum, r) => {
    // If has paymentHistory, sum payments made today
    if (r.paymentHistory && r.paymentHistory.length > 0) {
      const todayPayments = r.paymentHistory
        .filter(p => toDateKey(p.date) === today)
        .reduce((pSum, p) => pSum + p.amount, 0);
      return sum + todayPayments;
    }
    return sum + (r.status === 'Pagado' ? (r.total || 0) : (r.amountPaid || 0));
  }, 0);

  const pendingToday = Math.max(0, totalBilledToday - totalCollectedToday);

  let reply = `📊 **Ventas de Hoy (${new Date().toLocaleDateString('es-AR')})**:\n`;
  reply += `- Cantidad de ventas emitidas: **${todayRemitos.length}**\n`;
  reply += `- Total facturado hoy: **${formatCurrency(totalBilledToday)}**\n`;
  reply += `- Total cobrado hoy: **${formatCurrency(totalCollectedToday)}**\n`;
  if (pendingToday > 0) {
    reply += `- Saldo pendiente de cobro: **${formatCurrency(pendingToday)}**\n`;
  }

  if (todayRemitos.length > 0) {
    reply += `\n**Últimas ventas de la jornada:**\n`;
    todayRemitos.slice(0, 4).forEach(r => {
      reply += `• N° ${r.number} - **${r.customerName}**: ${formatCurrency(r.total)} (${r.status})\n`;
    });
  }

  return {
    replyText: reply,
    quickReplies: [
      { label: '📄 Ver todas las Ventas', action: 'navigate', payload: 'remitos' },
      { label: '➕ Nueva Venta', action: 'send_text', payload: 'quiero registrar una venta' },
      { label: '⚖️ Ver Balance', action: 'send_text', payload: 'balance de hoy' }
    ],
    newState: { currentIntent: 'idle' }
  };
}

/**
 * Handle Pending Orders Query
 */
function handlePendingOrdersQuery(context: ChatContext): ProcessedAssistantOutput {
  const pendingOrders = context.remitos.filter(r => 
    !r.isDraft && 
    (r.productionStatus === 'En Producción' || r.productionStatus === 'Para entregar')
  );

  const inProduction = pendingOrders.filter(r => r.productionStatus === 'En Producción');
  const readyToDeliver = pendingOrders.filter(r => r.productionStatus === 'Para entregar');

  let reply = `⚙️ **Estado de Producción y Pedidos**:\n`;
  reply += `- Pedidos en producción: **${inProduction.length}**\n`;
  reply += `- Listos para entregar: **${readyToDeliver.length}**\n\n`;

  if (readyToDeliver.length > 0) {
    reply += `🚀 **Listos para entregar:**\n`;
    readyToDeliver.slice(0, 3).forEach(r => {
      reply += `• **${r.customerName}**: ${r.items.map(i => `${i.quantity}x ${i.description}`).join(', ')}\n`;
    });
    reply += `\n`;
  }

  if (inProduction.length > 0) {
    reply += `⏳ **En máquinas:**\n`;
    inProduction.slice(0, 3).forEach(r => {
      reply += `• **${r.customerName}**: ${r.items.map(i => `${i.quantity}x ${i.description}`).join(', ')}\n`;
    });
  }

  return {
    replyText: reply,
    card: {
      type: 'orders_summary',
      data: {
        inProductionCount: inProduction.length,
        readyCount: readyToDeliver.length,
        totalPending: pendingOrders.length
      }
    },
    quickReplies: [
      { label: '📄 Ver Remitos', action: 'navigate', payload: 'remitos' },
      { label: '➕ Cargar Venta', action: 'send_text', payload: 'quiero registrar una venta' }
    ],
    newState: { currentIntent: 'idle' }
  };
}

/**
 * Handle Balance Query
 */
function handleBalanceQuery(context: ChatContext): ProcessedAssistantOutput {
  const today = toDateKey(new Date());
  
  // Real payments received today
  const incomeToday = context.remitos.reduce((sum, r) => {
    if (r.isDraft) return sum;
    if (r.paymentHistory && r.paymentHistory.length > 0) {
      const todayP = r.paymentHistory
        .filter(p => toDateKey(p.date) === today)
        .reduce((acc, p) => acc + p.amount, 0);
      return sum + todayP;
    }
    if (toDateKey(r.date) === today && r.status === 'Pagado') {
      return sum + (r.total || 0);
    }
    return sum;
  }, 0);

  // Expenses paid today
  const expensesToday = context.expenses.reduce((sum, e) => {
    if (e.isDraft) return sum;
    if (toDateKey(e.date) === today) {
      return sum + (e.total || 0);
    }
    return sum;
  }, 0);

  const netToday = incomeToday - expensesToday;

  let reply = `⚖️ **Balance Operativo del Día (${new Date().toLocaleDateString('es-AR')})**:\n`;
  reply += `- Cobranzas reales hoy: **+${formatCurrency(incomeToday)}**\n`;
  reply += `- Gastos registrados hoy: **-${formatCurrency(expensesToday)}**\n`;
  reply += `- Resultado Neto del Día: **${netToday >= 0 ? '+' : ''}${formatCurrency(netToday)}** ${netToday >= 0 ? '🟢 (Superávit)' : '🔴 (Déficit)'}\n`;

  return {
    replyText: reply,
    card: {
      type: 'balance_summary',
      data: {
        incomeToday,
        expensesToday,
        netToday
      }
    },
    quickReplies: [
      { label: '⚖️ Ver Módulo Balances', action: 'navigate', payload: 'balances' },
      { label: '💰 Cargar Gasto', action: 'send_text', payload: 'quiero registrar un gasto' },
      { label: '➕ Cargar Venta', action: 'send_text', payload: 'quiero registrar una venta' }
    ],
    newState: { currentIntent: 'idle' }
  };
}
