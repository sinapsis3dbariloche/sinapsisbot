
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
}

export interface Order {
  id: string;
  customer: string;
  details: string;
  status: OrderStatus;
  priority: 'Alta' | 'Media' | 'Baja';
  createdAt: string;
}

// Interface for chat history messages used by SinapsisBot
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
