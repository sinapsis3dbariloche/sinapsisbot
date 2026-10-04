
declare const __BUILD_TIME__: string;

export enum FilamentType {
  PLA = 'PLA',
  PETG = 'PET-G'
}

export type StockCategory = '3d' | 'grafica';
export type GraphicCategory = 'Papel' | 'Vinilo' | 'Insumo Gráfico';

export interface StockItem {
  id: string;
  category?: StockCategory; // '3d' | 'grafica', default '3d' if undefined
  
  // Stock común
  closedCount: number;
  openCount: number;
  minClosed?: number; // Mínimo de stock cerrado de seguridad
  
  // Específico 3D
  type?: FilamentType;
  color?: string;
  hexColor?: string;

  // Específico Gráfica / Papelería
  name?: string; // Nombre / Descripción rápida
  graphicCategory?: GraphicCategory; // Papel / Vinilo / Insumo Gráfico
  sizeFormat?: string; // Medida / Formato (A4, A3, Oficio, 50cm x 1m, etc.). Default A4 para papel
  weightThickness?: string; // Gramaje / Espesor (120g, 200g, etc.)
  packageUnits?: string; // Cantidad por paquete (ej: "100 hojas", "10 hojas", "1 rollo")
  finishColor?: string; // Color / Acabado (Opcional: Blanco, Gold, Fluo, Silver, Brillante, Matte)
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'Cambio de Hotend' | 'Limpieza' | 'Engrase' | 'General';
  notes: string;
}

export interface Printer {
  id: string;
  name: string;
  model: string;
  hasAMS: boolean;
  history: MaintenanceRecord[];
}

export interface ChangeHistoryEntry {
  id: string;
  date: string;
  user: string;
  action: string;
  changes: string;
}

export interface RemitoItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentRecord {
  amount: number;
  date: string;
}

export interface Remito {
  id: string;
  number: string; // e.g., "0001 - 00046"
  customerId: string;
  customerName: string;
  date: string;
  items: RemitoItem[];
  total: number;
  status: 'Pendiente' | 'Parcial' | 'Pagado';
  productionStatus?: 'En Producción' | 'Para entregar' | 'Entregada';
  amountPaid: number;
  paymentHistory?: PaymentRecord[];
  productionHistory?: { status: 'En Producción' | 'Para entregar' | 'Entregada', date: string }[];
  notes?: string;
  createdAt: string;
  isDraft?: boolean;
  history?: ChangeHistoryEntry[];
}

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  date: string;
  items: QuoteItem[];
  total: number;
  status?: 'borrador' | 'presupuestado' | 'confirmado' | 'rechazado';
  convertedRemitoId?: string;
  confirmedAt?: string;
  notes?: string;
  createdAt: string;
  isDraft?: boolean; // Kept for backwards compatibility
  history?: ChangeHistoryEntry[];
}

export interface Customer {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  city: string;
  cuit: string;
  taxCondition: 'Consumidor Final' | 'Responsable Inscripto' | 'Monotributista' | 'Exento';
  instagram?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  instagram: string;
  web: string;
  street: string;
  number: string;
  city: string;
  notes: string;
  createdAt: string;
}

export interface ExpenseItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Expense {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: ExpenseItem[];
  total: number;
  notes?: string;
  createdAt: string;
  isDraft?: boolean;
  history?: ChangeHistoryEntry[];
}

export interface PriceHistoryEntry {
  date: string;
  oldWholesalePrice: number;
  newWholesalePrice: number;
  oldRetailPrice: number;
  newRetailPrice: number;
}

export interface PriceItem {
  id: string;
  description: string;
  wholesalePrice: number;
  retailPrice: number;
  wholesaleMinQuantity: number;
  createdAt: string;
  history?: PriceHistoryEntry[];
}

// Interface for chat history messages used by SinapsisBot
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface DebtorSummary {
  customerId: string;
  customerName: string;
  debt: number;
}

export interface BalanceClosing {
  id: string;
  name: string; // e.g., "Ejercicio Anual 2025" or "Cierre Septiembre 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  closedAt: string; // ISO string
  closedBy: string; // User email
  
  // Financial Result (Liquidated to 0 for next period)
  totalIncome: number; // Real payments collected within period
  totalExpenses: number; // Expenses paid within period
  netResult: number; // totalIncome - totalExpenses
  resultType: 'PROFIT' | 'LOSS' | 'BREAKEVEN';
  
  // Operational metrics
  totalBilled: number; // Emitted remitos in period
  remitosCount: number; // Count of remitos in period
  expensesCount: number; // Count of expenses in period

  // Open accounts receivable that pass to the new cycle
  pendingReceivablesAtClose: number;
  debtorsSummary: DebtorSummary[];

  notes?: string;
}

