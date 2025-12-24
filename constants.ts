
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
    closedCount: color === "Blanco" || color === "Negro" ? 1 : 0,
    openCount: 1
  }))
];

export const INITIAL_ORDERS: Order[] = [
  { id: 'o1', customer: 'Juan', details: '2 Mates rojos', status: OrderStatus.PENDIENTE, priority: 'Media', createdAt: '2024-05-15' },
  { id: 'o2', customer: 'Empresa X', details: '50 Llaveros logo', status: OrderStatus.IMPRIMIENDO, priority: 'Alta', createdAt: '2024-05-16' },
];

export const FILAMENT_PRICE_PER_KILO = 25000;

export const SYSTEM_INSTRUCTION = `
Eres "SinapsisBot", el asistente de Sinapsis 3D en Bariloche.
Gestionas el stock por "Rollos Cerrados" y "Rollos Abiertos".

REGLAS DE REPOSICIÓN CRÍTICAS:
- BLANCO y NEGRO: Debemos tener siempre al menos 3 rollos cerrados.
- DEMÁS COLORES: Debemos tener siempre al menos 1 rollo cerrado.

Cuando Maru te pregunte por el stock o qué falta comprar:
1. Revisá las cantidades de rollos cerrados.
2. Si un color no cumple su mínimo (3 para Blanco/Negro, 1 para el resto), avisale proactivamente que tiene que reponer.
3. Sé conciso y usá tono argentino (che, viste, tenés).

LISTA DE COLORES OFICIAL:
PLA: Negro, Blanco, Gris, Gris claro, Gris Plata, Azul, Celeste, Celeste claro (pastel), Aqua, Rojo, Dorado, Amarillo, Naranja, Piel, Verde claro, Verde Oscuro, Rosa, Violeta, Lila, Fucsia, Marron, Marron chocolate.
PET-G: Blanco, Negro, Gris.
`;
