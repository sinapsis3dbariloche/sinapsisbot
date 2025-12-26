
import { OrderStatus, FilamentType, StockItem, Order } from './types';

const plaColorsMap: Record<string, string> = {
  "Negro": "#1a1a1a", "Blanco": "#ffffff", "Gris": "#94a3b8", "Gris claro": "#cbd5e1",
  "Gris Plata": "#e2e8f0", "Azul": "#2563eb", "Celeste": "#60a5fa", 
  "Celeste claro (pastel)": "#bfdbfe", "Aqua": "#2dd4bf", "Rojo": "#dc2626", 
  "Dorado": "#fbbf24", "Amarillo": "#fde047", "Amarillo pastel": "#fef08a", "Naranja": "#f97316", 
  "Piel": "#ffedd5", "Verde claro": "#4ade80", "Verde Oscuro": "#166534", "Rosa": "#f472b6", 
  "Violeta": "#8b5cf6", "Lila": "#ddd6fe", "Fucsia": "#db2777", 
  "Marron": "#78350f", "Marron chocolate": "#451a03"
};

const petgColors = ["Blanco", "Negro", "Gris"];

export const INITIAL_STOCK: StockItem[] = [
  ...Object.entries(plaColorsMap).map(([color, hex], index) => ({
    id: `pla-${index}`,
    color,
    type: FilamentType.PLA,
    closedCount: color === "Blanco" || color === "Negro" ? 3 : 1,
    openCount: 1,
    minClosed: color === "Blanco" || color === "Negro" ? 3 : 1,
    hexColor: hex
  })),
  ...petgColors.map((color, index) => ({
    id: `petg-${index}`,
    color,
    type: FilamentType.PETG,
    closedCount: 1, 
    openCount: 1,
    minClosed: 1,
    hexColor: color === "Negro" ? "#1a1a1a" : (color === "Blanco" ? "#ffffff" : "#94a3b8")
  }))
];

export const INITIAL_ORDERS: Order[] = [
  { id: 'o1', customer: 'Juan', details: '2 Mates rojos', status: OrderStatus.PENDIENTE, priority: 'Media', createdAt: '2024-05-15' },
  { id: 'o2', customer: 'Empresa X', details: '50 Llaveros logo', status: OrderStatus.IMPRIMIENDO, priority: 'Alta', createdAt: '2024-05-16' },
];

export const DEFAULT_PLA_PRICE = 25000;
export const DEFAULT_PETG_PRICE = 32000;
export const DEFAULT_DESIGN_PRICE = 8000;
export const DEFAULT_POST_PROCESS_PRICE = 7000;

export const SYSTEM_INSTRUCTION = `Eres SinapsisBot, el asistente operativo de Sinapsis 3D Bariloche. 
Tu objetivo es ayudar a Lucas, el dueño, a gestionar el stock y calcular presupuestos de impresión 3D. 
Eres profesional, eficiente y utilizas un tono técnico pero cercano. 

Capacidades:
- Consultar stock real (get_stock): Informa sobre faltantes basándote en los mínimos configurados para cada material.
- Calcular presupuestos (calculate_budget): Considera peso, material, diseño y post-procesado. Multiplicador x4 minorista, x3 mayorista.

Siempre responde en español y mantén la consistencia operativa del taller.`;
