
export enum FilamentType {
  PLA = 'PLA',
  PETG = 'PET-G'
}

export interface StockItem {
  id: string;
  color: string;
  type: FilamentType;
  closedCount: number;
  openCount: number;
  minClosed?: number;
  hexColor?: string;
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
  status?: 'borrador' | 'presupuestado' | 'confirmado';
  convertedRemitoId?: string;
  confirmedAt?: string;
  notes?: string;
  createdAt: string;
  isDraft?: boolean; // Kept for backwards compatibility
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
