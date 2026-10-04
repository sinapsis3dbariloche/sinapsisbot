import { StockItem, FilamentType, GraphicCategory, StockCategory } from '../types';

export const getMinStockThreshold = (item: StockItem): number => {
  if (item.minClosed !== undefined) return item.minClosed;
  if (item.type === FilamentType.PETG) return 1;
  return item.color === 'Blanco' || item.color === 'Negro' ? 3 : 1;
};

export const isStockAlert = (item: StockItem): boolean => {
  return item.closedCount < getMinStockThreshold(item);
};

export const isCriticalFilament = (color: string): boolean => {
  const normalized = color.trim().toLowerCase();
  return normalized === 'blanco' || normalized === 'negro';
};

export const updateSpoolCount = (current: number, delta: number): number => {
  return Math.max(0, current + delta);
};

export const openNewSpool = (item: StockItem): { updatedItem: StockItem; success: boolean } => {
  if (item.closedCount <= 0) {
    return { updatedItem: item, success: false };
  }
  return {
    updatedItem: {
      ...item,
      closedCount: item.closedCount - 1,
      openCount: item.openCount + 1
    },
    success: true
  };
};

export const resetAllStockItems = (
  stock: StockItem[], 
  targetCategory: 'all' | '3d' | 'grafica' = 'all'
): StockItem[] => {
  return stock.map(item => {
    const is3d = !item.category || item.category === '3d';
    const isGrafica = item.category === 'grafica';
    const shouldReset = 
      targetCategory === 'all' ||
      (targetCategory === '3d' && is3d) ||
      (targetCategory === 'grafica' && isGrafica);

    if (shouldReset) {
      return {
        ...item,
        closedCount: 0,
        openCount: 0
      };
    }
    return item;
  });
};

export const filterAndSortStock = (
  stock: StockItem[],
  activeType: FilamentType,
  searchTerm: string = ''
): StockItem[] => {
  const term = searchTerm.trim().toLowerCase();

  return stock
    .filter(item => (!item.category || item.category === '3d') && item.type === activeType)
    .filter(item => (term ? (item.color || '').toLowerCase().includes(term) : true))
    .sort((a, b) => {
      const aAlert = isStockAlert(a);
      const bAlert = isStockAlert(b);

      // 1. Alerts come first
      if (aAlert && !bAlert) return -1;
      if (!aAlert && bAlert) return 1;

      // 2. If both are on alert, critical colors (Blanco / Negro) come first
      if (aAlert && bAlert) {
        const aCrit = isCriticalFilament(a.color || '');
        const bCrit = isCriticalFilament(b.color || '');
        if (aCrit && !bCrit) return -1;
        if (!aCrit && bCrit) return 1;
      }

      // 3. Lowest open spools first
      if (a.openCount !== b.openCount) {
        return a.openCount - b.openCount;
      }

      // 4. Alphabetical by color
      return (a.color || '').localeCompare(b.color || '');
    });
};

export const calculateStockSummary = (stock: StockItem[]) => {
  let totalClosed = 0;
  let totalOpen = 0;
  let totalAlerts = 0;
  let plaCount = 0;
  let petgCount = 0;

  const filaments = stock.filter(item => !item.category || item.category === '3d');

  filaments.forEach(item => {
    totalClosed += item.closedCount;
    totalOpen += item.openCount;
    if (isStockAlert(item)) totalAlerts++;
    if (item.type === FilamentType.PLA) plaCount++;
    if (item.type === FilamentType.PETG) petgCount++;
  });

  return {
    totalClosed,
    totalOpen,
    totalSpools: totalClosed + totalOpen,
    totalAlerts,
    plaCount,
    petgCount
  };
};

// --- Gráfica & Papelería Logic ---

export const getGraphicMinStock = (item: StockItem): number => {
  return item.minClosed !== undefined ? item.minClosed : 1;
};

export const isGraphicStockAlert = (item: StockItem): boolean => {
  return item.closedCount < getGraphicMinStock(item);
};

export const filterAndSortGraphicStock = (
  stock: StockItem[],
  activeCategory: 'Todos' | GraphicCategory = 'Todos',
  searchTerm: string = ''
): StockItem[] => {
  const term = searchTerm.trim().toLowerCase();

  return stock
    .filter(item => item.category === 'grafica')
    .filter(item => activeCategory === 'Todos' || item.graphicCategory === activeCategory)
    .filter(item => {
      if (!term) return true;
      const name = (item.name || '').toLowerCase();
      const cat = (item.graphicCategory || '').toLowerCase();
      const format = (item.sizeFormat || '').toLowerCase();
      const weight = (item.weightThickness || '').toLowerCase();
      const finish = (item.finishColor || '').toLowerCase();
      return name.includes(term) || cat.includes(term) || format.includes(term) || weight.includes(term) || finish.includes(term);
    })
    .sort((a, b) => {
      const aAlert = isGraphicStockAlert(a);
      const bAlert = isGraphicStockAlert(b);

      // 1. Alerts first
      if (aAlert && !bAlert) return -1;
      if (!aAlert && bAlert) return 1;

      // 2. Lowest open count first
      if (a.openCount !== b.openCount) {
        return a.openCount - b.openCount;
      }

      // 3. Alphabetical by name
      return (a.name || '').localeCompare(b.name || '');
    });
};

export const calculateGraphicStockSummary = (stock: StockItem[]) => {
  let totalClosed = 0;
  let totalOpen = 0;
  let totalAlerts = 0;
  let paperCount = 0;
  let vinylCount = 0;
  let otherCount = 0;

  const graphicItems = stock.filter(item => item.category === 'grafica');

  graphicItems.forEach(item => {
    totalClosed += item.closedCount;
    totalOpen += item.openCount;
    if (isGraphicStockAlert(item)) totalAlerts++;
    if (item.graphicCategory === 'Papel') paperCount++;
    else if (item.graphicCategory === 'Vinilo') vinylCount++;
    else otherCount++;
  });

  return {
    totalItems: graphicItems.length,
    totalClosed,
    totalOpen,
    totalPackages: totalClosed + totalOpen,
    totalAlerts,
    paperCount,
    vinylCount,
    otherCount
  };
};
