
export enum OrderStatus {
  PENDIENTE = 'Pendiente',
  EN_DISENO = 'En Diseño',
  IMPRIMIENDO = 'Imprimiendo',
  LISTO = 'Listo para entregar',
  ENTREGADO = 'Entregado'
}

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

export interface Order {
  id: string;
  customer: string;
  details: string;
  status: OrderStatus;
  priority: 'Alta' | 'Media' | 'Baja';
  createdAt: string;
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

// Interface for chat history messages used by SinapsisBot
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
