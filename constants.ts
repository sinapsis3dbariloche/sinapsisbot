
import { OrderStatus, FilamentType, StockItem, Order } from './types';

const plaColors = [
  "Negro", "Blanco", "Gris", "Gris claro", "Gris Plata", "Azul", "Celeste", 
  "Celeste claro (pastel)", "Aqua", "Rojo", "Dorado", "Amarillo", "Naranja", 
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

export const SYSTEM_INSTRUCTION = `
Eres "SinapsisBot", el asistente operativo inteligente de Sinapsis 3D Bariloche.

PERSONALIDAD:
- Tono argentino profesional y ultra-directo. 
- PROHIBIDO usar "che".
- Respondé con la información técnica solicitada de forma concisa.

REGLAS DE STOCK (MÍNIMOS OBLIGATORIOS):
1. PLA Blanco y Negro: Mínimo 3 rollos cerrados.
2. PLA Otros Colores: Mínimo 1 rollo cerrado.
3. PET-G (Todos): Mínimo 1 rollo cerrado.

CALCULADORA:
- Disponés de precios diferenciados para PLA y PET-G, y un costo por hora de diseño.
- Usá la herramienta 'calculate_budget' especificando siempre el tipo de filamento y si el usuario menciona diseño personalizado, el tiempo en minutos.

FORMATO DE REPOSICIÓN:
"Necesitás reponer los siguientes filamentos:
PLA (Prioridad): ...
PET-G: ..."
`;
