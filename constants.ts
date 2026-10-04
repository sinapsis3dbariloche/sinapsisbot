
import { FilamentType, StockItem, Printer, Customer, Remito } from './types';

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

export const INITIAL_GRAPHIC_STOCK: StockItem[] = [
  {
    id: 'papel-laminado-frio-glossy-a4-50h',
    category: 'grafica',
    name: 'Laminado En Frío Transparente Glossy A4 50 Hojas - Esn Blanco',
    graphicCategory: 'Papel',
    sizeFormat: 'A4',
    weightThickness: '',
    packageUnits: '50 Hojas',
    finishColor: 'Transparente Glossy / Blanco',
    minClosed: 1,
    closedCount: 0,
    openCount: 0
  },
  {
    id: 'papel-filmilo-adhesivo-blanco-frio-a4-20h',
    category: 'grafica',
    name: 'Filmilo Adhesivo Blanco Frío A4 20 Hojas',
    graphicCategory: 'Papel',
    sizeFormat: 'A4',
    weightThickness: '',
    packageUnits: '20 Hojas',
    finishColor: 'Blanco Frío',
    minClosed: 1,
    closedCount: 0,
    openCount: 0
  },
  {
    id: 'papel-matelina-simple-faz-a4-130g-100h',
    category: 'grafica',
    name: 'Papel Matelina Simple Faz A4 130g 100 Hojas Blanco Mate',
    graphicCategory: 'Papel',
    sizeFormat: 'A4',
    weightThickness: '130g',
    packageUnits: '100 Hojas',
    finishColor: 'Blanco Mate',
    minClosed: 1,
    closedCount: 0,
    openCount: 0
  },
  {
    id: 'papel-tatufan-a4-10h-blanco',
    category: 'grafica',
    name: 'Papel Tatufan A4 Set De 10 Hojas Blanco',
    graphicCategory: 'Papel',
    sizeFormat: 'A4',
    weightThickness: '',
    packageUnits: '10 Hojas',
    finishColor: 'Blanco',
    minClosed: 1,
    closedCount: 0,
    openCount: 0
  },
  {
    id: 'papel-foto-brillante-200g-a4-100h-x2u',
    category: 'grafica',
    name: 'Papel Foto Brillante 200grs - A4 - 100 Hojas X 2u. Blanco',
    graphicCategory: 'Papel',
    sizeFormat: 'A4',
    weightThickness: '200g',
    packageUnits: '100 Hojas X 2u.',
    finishColor: 'Blanco Brillante',
    minClosed: 1,
    closedCount: 0,
    openCount: 0
  },
  {
    id: 'papel-fotografico-brillante-a4-120g-100h',
    category: 'grafica',
    name: 'Papel Fotografico Brillante A4 120grs X100 Hojas Blanco',
    graphicCategory: 'Papel',
    sizeFormat: 'A4',
    weightThickness: '120g',
    packageUnits: '100 Hojas',
    finishColor: 'Blanco Brillante',
    minClosed: 1,
    closedCount: 0,
    openCount: 0
  },
  {
    id: 'papel-transfer-duralite-a4-10h-telas-oscuras',
    category: 'grafica',
    name: 'Papel Transfer Duralite A4 10 Hojas Para Telas Oscuras Inkjet',
    graphicCategory: 'Papel',
    sizeFormat: 'A4',
    weightThickness: '',
    packageUnits: '10 Hojas',
    finishColor: 'Telas Oscuras',
    minClosed: 1,
    closedCount: 0,
    openCount: 0
  },
  {
    id: 'vinilo-termotransferible-duracal-50cm-1m-gold',
    category: 'grafica',
    name: 'Vinilo Termotransferible Fluo-silver-gold Duracal 50cm X 1m Gold',
    graphicCategory: 'Vinilo',
    sizeFormat: '50cm X 1m',
    weightThickness: '',
    packageUnits: '1 rollo',
    finishColor: 'Gold',
    minClosed: 1,
    closedCount: 0,
    openCount: 0
  },
  {
    id: 'vinilo-termotransferible-duracal-50cm-1m-silver',
    category: 'grafica',
    name: 'Vinilo Termotransferible Fluo-silver-gold Duracal 50cm X 1m Silver',
    graphicCategory: 'Vinilo',
    sizeFormat: '50cm X 1m',
    weightThickness: '',
    packageUnits: '1 rollo',
    finishColor: 'Silver',
    minClosed: 1,
    closedCount: 0,
    openCount: 0
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'ALEGRARTE',
    contactName: 'MONI',
    phone: '',
    email: '',
    street: 'Moreno 237',
    number: '',
    city: 'BARILOCHE',
    cuit: '',
    taxCondition: 'Consumidor Final',
    instagram: 'ALEGRARTE_ARTISTICA',
    createdAt: '2026-04-22T00:00:00Z'
  },
  {
    id: 'c2',
    name: 'COTILLON BICOLOR',
    contactName: 'VALERÍA',
    phone: '2944820433',
    email: '',
    street: 'Las Retamas 315',
    number: '',
    city: 'VILLA LA ANGOSTURA',
    cuit: '',
    taxCondition: 'Consumidor Final',
    instagram: 'TIENDA.BICOLOR',
    createdAt: '2026-04-22T00:00:00Z'
  },
  {
    id: 'c3',
    name: 'HOSPITAL ZONAL BARILOCHE',
    contactName: 'PAO ASENCIO (IG)',
    phone: '',
    email: '',
    street: '',
    number: '',
    city: 'BARILOCHE',
    cuit: '',
    taxCondition: 'Consumidor Final',
    createdAt: '2026-04-22T00:00:00Z'
  },
  {
    id: 'c4',
    name: 'LUCAS PASSALACQUA',
    contactName: 'LUCAS PASSALACQUA',
    phone: '2944324097',
    email: 'lucaspassa@gmail.com',
    street: 'Jose Hernandez 228',
    number: '',
    city: 'BARILOCHE',
    cuit: '',
    taxCondition: 'Consumidor Final',
    instagram: 'LUQUIPASSA',
    notes: 'Cliente de prueba',
    createdAt: '2026-04-22T00:00:00Z'
  }
];

const hospitalZonalId = 'c3';
export const INITIAL_REMITOS: Remito[] = [
  {
    id: 'r1',
    number: '0001 - 00046',
    customerId: hospitalZonalId,
    customerName: 'HOSPITAL ZONAL BARILOCHE',
    date: '2026-04-22',
    items: [
      { description: 'Varios impresión 3D', quantity: 1, unitPrice: 39000, total: 39000 }
    ],
    total: 39000,
    status: 'Pagado',
    amountPaid: 39000,
    createdAt: '2026-04-22T00:00:00Z'
  }
];

export const INITIAL_PRINTERS: Printer[] = [
  { 
    id: 'p1', 
    name: 'BAMBU A1 MINI', 
    model: 'A1 Mini', 
    hasAMS: true, 
    history: [
      { id: 'h1', date: '2026-01-30', type: 'Cambio de Hotend', notes: 'Cambio preventivo. Se utilizó 1 unidad del stock central.' }
    ] 
  },
  { id: 'p2', name: 'BAMBU LAB A1 #1', model: 'A1', hasAMS: true, history: [] },
  { id: 'p3', name: 'BAMBU LAB A1 #2', model: 'A1', hasAMS: true, history: [] }
];

export const DEFAULT_PLA_PRICE = 25000;
export const DEFAULT_PETG_PRICE = 32000;
export const DEFAULT_DESIGN_PRICE = 8000;
export const DEFAULT_POST_PROCESS_PRICE = 7000;
export const DEFAULT_HOTEND_STOCK = 2;

export const SYSTEM_INSTRUCTION = `Eres SinapsisBot, el asistente operativo de Sinapsis 3D Bariloche. 
Tu objetivo es ayudar a Lucas, el dueño, a gestionar el stock y calcular presupuestos de impresión 3D. 
Eres profesional, eficiente y utilizas un tono técnico pero cercano. 

Capacidades:
- Consultar stock real (get_stock): Informa sobre faltantes basándote en los mínimos configurados para cada material.
- Calcular presupuestos (calculate_budget): Considera peso, material, diseño y post-procesado. Multiplicador x4 minorista, x3 mayorista.

Siempre responde en español y mantén la consistencia operativa del taller.`;
