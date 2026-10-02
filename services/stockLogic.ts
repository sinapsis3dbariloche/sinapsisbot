import { StockItem, FilamentType } from '../types';

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

export const resetAllStockItems = (stock: StockItem[]): StockItem[] => {
  return stock.map(item => ({
    ...item,
    closedCount: 0,
    openCount: 0
  }));
};

export const filterAndSortStock = (
  stock: StockItem[],
  activeType: FilamentType,
  searchTerm: string = ''
): StockItem[] => {
  const term = searchTerm.trim().toLowerCase();

  return stock
    .filter(item => item.type === activeType)
    .filter(item => (term ? item.color.toLowerCase().includes(term) : true))
    .sort((a, b) => {
      const aAlert = isStockAlert(a);
      const bAlert = isStockAlert(b);

      // 1. Alerts come first
      if (aAlert && !bAlert) return -1;
      if (!aAlert && bAlert) return 1;

      // 2. If both are on alert, critical colors (Blanco / Negro) come first
      if (aAlert && bAlert) {
        const aCrit = isCriticalFilament(a.color);
        const bCrit = isCriticalFilament(b.color);
        if (aCrit && !bCrit) return -1;
        if (!aCrit && bCrit) return 1;
      }

      // 3. Lowest open spools first
      if (a.openCount !== b.openCount) {
        return a.openCount - b.openCount;
      }

      // 4. Alphabetical by color
      return a.color.localeCompare(b.color);
    });
};

export const calculateStockSummary = (stock: StockItem[]) => {
  let totalClosed = 0;
  let totalOpen = 0;
  let totalAlerts = 0;
  let plaCount = 0;
  let petgCount = 0;

  stock.forEach(item => {
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
