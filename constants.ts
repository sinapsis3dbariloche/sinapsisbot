
import { OrderStatus, FilamentType, StockItem, Order } from './types';

const plaColors = [
  "Negro", "Blanco", "Gris", "Gris claro", "Gris Plata", "Azul", "Celeste", 
  "Celeste claro (pastel)", "Aqua", "Rojo", "Dorado", "Amarillo", "Amarillo pastel", "Naranja", 
  "Piel", "Verde claro", "Verde Oscuro", "Rosa", "Violeta", "Lila", "Fucsia", 
  "Marron", "Marron chocolate"
];

const petgColors = ["Blanco", "Negro", "Gris"];

export const INITIAL_STOCK: StockItem[] = [
  ...plaColors.map((color, index) => ({
    id: `pla-${index}`,
    color,
    type: FilamentType.PLA,
    closedCount: color === "Blanco" || color === "Negro" ? 3 : 1,
    openCount: 1
  })),
  ...petgColors.map((color, index) => ({
    id: `petg-${index}`,
    color,
    type: FilamentType.PETG,
    closedCount: 1, 
    openCount: 1
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

// System instruction for the Gemini model in SinapsisBotService
export const SYSTEM_INSTRUCTION = `Eres SinapsisBot, el asistente operativo de Sinapsis 3D Bariloche. 
Tu objetivo es ayudar a Lucas, el dueño, a gestionar el stock y calcular presupuestos de impresión 3D. 
Eres profesional, eficiente y utilizas un tono técnico pero cercano. 

Capacidades:
- Consultar stock real (get_stock): Informa sobre faltantes basándote en mínimos (PLA: 1, excepto Blanco/Negro: 3; PET-G: 1).
- Calcular presupuestos (calculate_budget): Considera peso, material, diseño y post-procesado. Multiplicador x4 minorista, x3 mayorista.

Siempre responde en español y mantén la consistencia operativa del taller.`;
