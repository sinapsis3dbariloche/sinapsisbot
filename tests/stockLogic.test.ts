import { describe, it, expect } from 'vitest';
import { FilamentType, StockItem } from '../types';
import { INITIAL_GRAPHIC_STOCK } from '../constants';
import {
  getMinStockThreshold,
  isStockAlert,
  isCriticalFilament,
  updateSpoolCount,
  openNewSpool,
  resetAllStockItems,
  filterAndSortStock,
  calculateStockSummary,
  getGraphicMinStock,
  isGraphicStockAlert,
  filterAndSortGraphicStock,
  calculateGraphicStockSummary
} from '../services/stockLogic';

describe('Stock & Filament Inventory Logic', () => {
  const samplePlaItem: StockItem = {
    id: 'pla-1',
    color: 'Blanco',
    type: FilamentType.PLA,
    closedCount: 2,
    openCount: 1,
    minClosed: 3,
    hexColor: '#ffffff'
  };

  const samplePetgItem: StockItem = {
    id: 'petg-1',
    color: 'Negro',
    type: FilamentType.PETG,
    closedCount: 1,
    openCount: 1,
    minClosed: 1,
    hexColor: '#000000'
  };

  it('determines the minimum stock threshold correctly', () => {
    expect(getMinStockThreshold(samplePlaItem)).toBe(3);
    expect(getMinStockThreshold(samplePetgItem)).toBe(1);

    // Fallback when minClosed is not specified
    const fallbackItem = { ...samplePlaItem, minClosed: undefined, color: 'Negro' };
    expect(getMinStockThreshold(fallbackItem)).toBe(3);
    const fallbackColor = { ...samplePlaItem, minClosed: undefined, color: 'Rojo' };
    expect(getMinStockThreshold(fallbackColor)).toBe(1);
  });

  it('triggers stock alert when closedCount is below minimum', () => {
    // Blanco has min 3, closedCount is 2 -> alert!
    expect(isStockAlert(samplePlaItem)).toBe(true);

    // Negro PETG has min 1, closedCount is 1 -> no alert
    expect(isStockAlert(samplePetgItem)).toBe(false);

    // If PETG closedCount drops to 0 -> alert!
    expect(isStockAlert({ ...samplePetgItem, closedCount: 0 })).toBe(true);
  });

  it('identifies critical filaments (Blanco & Negro)', () => {
    expect(isCriticalFilament('Blanco')).toBe(true);
    expect(isCriticalFilament('Negro')).toBe(true);
    expect(isCriticalFilament('blanco ')).toBe(true);
    expect(isCriticalFilament('Azul')).toBe(false);
    expect(isCriticalFilament('Rojo')).toBe(false);
  });

  it('updates spool count safely and never goes below zero', () => {
    expect(updateSpoolCount(5, 1)).toBe(6);
    expect(updateSpoolCount(5, -2)).toBe(3);
    expect(updateSpoolCount(1, -5)).toBe(0);
    expect(updateSpoolCount(0, -1)).toBe(0);
  });

  it('opens a new spool by moving 1 from closed to open', () => {
    const { updatedItem, success } = openNewSpool(samplePlaItem);
    expect(success).toBe(true);
    expect(updatedItem.closedCount).toBe(1);
    expect(updatedItem.openCount).toBe(2);

    // Cannot open when closedCount is 0
    const emptyClosed = { ...samplePlaItem, closedCount: 0 };
    const failResult = openNewSpool(emptyClosed);
    expect(failResult.success).toBe(false);
    expect(failResult.updatedItem.closedCount).toBe(0);
  });

  it('resets all stock items to zero for inventory restart', () => {
    const stock: StockItem[] = [samplePlaItem, samplePetgItem];
    const reset = resetAllStockItems(stock);
    expect(reset.every(i => i.closedCount === 0 && i.openCount === 0)).toBe(true);
  });

  it('filters by type and search term, placing alerts and critical colors first', () => {
    const stockList: StockItem[] = [
      { id: '1', color: 'Azul', type: FilamentType.PLA, closedCount: 5, openCount: 1, minClosed: 1 },
      { id: '2', color: 'Rojo', type: FilamentType.PLA, closedCount: 0, openCount: 1, minClosed: 1 }, // Alert!
      { id: '3', color: 'Blanco', type: FilamentType.PLA, closedCount: 1, openCount: 1, minClosed: 3 }, // Alert critical!
      { id: '4', color: 'Negro', type: FilamentType.PETG, closedCount: 0, openCount: 1, minClosed: 1 }
    ];

    const plaResults = filterAndSortStock(stockList, FilamentType.PLA);
    // Alerts come first, and among alerts, Blanco comes before Rojo
    expect(plaResults[0].color).toBe('Blanco');
    expect(plaResults[1].color).toBe('Rojo');
    expect(plaResults[2].color).toBe('Azul');

    // Search filter
    const searchResult = filterAndSortStock(stockList, FilamentType.PLA, 'az');
    expect(searchResult).toHaveLength(1);
    expect(searchResult[0].color).toBe('Azul');
  });

  it('calculates stock summary metrics accurately', () => {
    const stockList: StockItem[] = [
      { id: '1', color: 'Azul', type: FilamentType.PLA, closedCount: 2, openCount: 1, minClosed: 1 },
      { id: '2', color: 'Rojo', type: FilamentType.PLA, closedCount: 0, openCount: 2, minClosed: 1 }, // Alert
      { id: '3', color: 'Negro', type: FilamentType.PETG, closedCount: 3, openCount: 1, minClosed: 1 }
    ];

    const summary = calculateStockSummary(stockList);
    expect(summary.totalClosed).toBe(5);
    expect(summary.totalOpen).toBe(4);
    expect(summary.totalSpools).toBe(9);
    expect(summary.totalAlerts).toBe(1);
    expect(summary.plaCount).toBe(2);
    expect(summary.petgCount).toBe(1);
  });

  describe('Gráfica & Papelería Inventory Logic', () => {
    const samplePaper: StockItem = {
      id: 'g-1',
      category: 'grafica',
      name: 'Papel Fotográfico Brillante A4 Art-jet® 120g X 100hojas',
      graphicCategory: 'Papel',
      sizeFormat: 'A4',
      weightThickness: '120g',
      packageUnits: '100 hojas',
      finishColor: 'Brillante',
      closedCount: 1,
      openCount: 1,
      minClosed: 2
    };

    const sampleVinyl: StockItem = {
      id: 'g-2',
      category: 'grafica',
      name: 'Vinilo Termotransferible Fluo-silver-gold Duracal 50cm X 1m Silver',
      graphicCategory: 'Vinilo',
      sizeFormat: '50cm x 1m',
      packageUnits: '1 rollo',
      finishColor: 'Silver',
      closedCount: 3,
      openCount: 0,
      minClosed: 1
    };

    it('identifies minimum stock and alerts for graphic items', () => {
      // Paper has minClosed: 2, closedCount: 1 -> alert
      expect(getGraphicMinStock(samplePaper)).toBe(2);
      expect(isGraphicStockAlert(samplePaper)).toBe(true);

      // Paper with closedCount >= minClosed
      expect(isGraphicStockAlert({ ...samplePaper, closedCount: 2 })).toBe(false);
      expect(isGraphicStockAlert({ ...samplePaper, closedCount: 5 })).toBe(false);

      // Default minimum when undefined is 1
      expect(getGraphicMinStock({ ...sampleVinyl, minClosed: undefined })).toBe(1);
      expect(isGraphicStockAlert({ ...sampleVinyl, closedCount: 0, minClosed: undefined })).toBe(true);
      expect(isGraphicStockAlert(sampleVinyl)).toBe(false);
    });

    it('filters graphic stock by category and search keyword', () => {
      const stockList: StockItem[] = [
        samplePlaItem, // 3D item, should be excluded
        samplePaper,
        sampleVinyl,
        {
          id: 'g-3',
          category: 'grafica',
          name: 'Cinta Doble Faz Térmica',
          graphicCategory: 'Insumo Gráfico',
          sizeFormat: '10mm x 30m',
          closedCount: 4,
          openCount: 1,
          minClosed: 1
        }
      ];

      // Category: Todos
      const allGraphic = filterAndSortGraphicStock(stockList, 'Todos');
      expect(allGraphic).toHaveLength(3);
      expect(allGraphic.every(i => i.category === 'grafica')).toBe(true);

      // Category: Papel
      const papers = filterAndSortGraphicStock(stockList, 'Papel');
      expect(papers).toHaveLength(1);
      expect(papers[0].id).toBe(samplePaper.id);

      // Category: Vinilo
      const vinyls = filterAndSortGraphicStock(stockList, 'Vinilo');
      expect(vinyls).toHaveLength(1);
      expect(vinyls[0].id).toBe(sampleVinyl.id);

      // Category: Insumo Gráfico
      const others = filterAndSortGraphicStock(stockList, 'Insumo Gráfico');
      expect(others).toHaveLength(1);
      expect(others[0].id).toBe('g-3');

      // Search keyword matches name, size, or finish
      expect(filterAndSortGraphicStock(stockList, 'Todos', 'duracal')).toHaveLength(1);
      expect(filterAndSortGraphicStock(stockList, 'Todos', '120g')).toHaveLength(1);
      expect(filterAndSortGraphicStock(stockList, 'Todos', 'silver')).toHaveLength(1);
      expect(filterAndSortGraphicStock(stockList, 'Todos', 'inexistente')).toHaveLength(0);
    });

    it('sorts graphic stock with alerts first, then lowest open spools, then name', () => {
      const itemAlert: StockItem = {
        id: 'g-alert',
        category: 'grafica',
        name: 'Z-Papel Alert',
        graphicCategory: 'Papel',
        closedCount: 0, // Alert!
        openCount: 5,
        minClosed: 1
      };

      const itemOk1: StockItem = {
        id: 'g-ok1',
        category: 'grafica',
        name: 'B-Papel Normal',
        graphicCategory: 'Papel',
        closedCount: 5,
        openCount: 2,
        minClosed: 1
      };

      const itemOk2: StockItem = {
        id: 'g-ok2',
        category: 'grafica',
        name: 'A-Papel Normal',
        graphicCategory: 'Papel',
        closedCount: 5,
        openCount: 0, // Lower openCount
        minClosed: 1
      };

      const sorted = filterAndSortGraphicStock([itemOk1, itemAlert, itemOk2], 'Todos');
      // Alert item comes first even if name starts with Z
      expect(sorted[0].id).toBe('g-alert');
      // Then itemOk2 with openCount: 0
      expect(sorted[1].id).toBe('g-ok2');
      // Then itemOk1 with openCount: 2
      expect(sorted[2].id).toBe('g-ok1');
    });

    it('calculates graphic stock summary accurately', () => {
      const mixedStock: StockItem[] = [
        samplePlaItem, // 3D item ignored
        samplePaper, // Papel, closed: 1, open: 1, alert: true
        sampleVinyl, // Vinilo, closed: 3, open: 0, alert: false
        {
          id: 'g-other',
          category: 'grafica',
          name: 'Regla Metálica',
          graphicCategory: 'Insumo Gráfico',
          closedCount: 2,
          openCount: 1,
          minClosed: 1
        }
      ];

      const summary = calculateGraphicStockSummary(mixedStock);
      expect(summary.totalItems).toBe(3);
      expect(summary.totalClosed).toBe(6);
      expect(summary.totalOpen).toBe(2);
      expect(summary.totalPackages).toBe(8);
      expect(summary.totalAlerts).toBe(1);
      expect(summary.paperCount).toBe(1);
      expect(summary.vinylCount).toBe(1);
      expect(summary.otherCount).toBe(1);
    });

    it('resets stock selectively by category or all', () => {
      const mixedStock: StockItem[] = [samplePlaItem, samplePaper, sampleVinyl];
      
      // Reset only 3d
      const reset3d = resetAllStockItems(mixedStock, '3d');
      expect(reset3d.find(i => i.id === samplePlaItem.id)?.closedCount).toBe(0);
      expect(reset3d.find(i => i.id === samplePaper.id)?.closedCount).toBe(1);

      // Reset only grafica
      const resetGrafica = resetAllStockItems(mixedStock, 'grafica');
      expect(resetGrafica.find(i => i.id === samplePlaItem.id)?.closedCount).toBe(2);
      expect(resetGrafica.find(i => i.id === samplePaper.id)?.closedCount).toBe(0);
      expect(resetGrafica.find(i => i.id === sampleVinyl.id)?.closedCount).toBe(0);

      // Reset all
      const resetAll = resetAllStockItems(mixedStock, 'all');
      expect(resetAll.every(i => i.closedCount === 0 && i.openCount === 0)).toBe(true);
    });

    it('contains all 9 initial graphic items (7 paper, 2 vinyl)', () => {
      expect(INITIAL_GRAPHIC_STOCK).toHaveLength(9);
      const papers = INITIAL_GRAPHIC_STOCK.filter(i => i.graphicCategory === 'Papel');
      const vinyls = INITIAL_GRAPHIC_STOCK.filter(i => i.graphicCategory === 'Vinilo');
      expect(papers).toHaveLength(7);
      expect(vinyls).toHaveLength(2);

      // Verify specific requested names
      expect(INITIAL_GRAPHIC_STOCK.some(i => i.name.includes('Laminado En Frío'))).toBe(true);
      expect(INITIAL_GRAPHIC_STOCK.some(i => i.name.includes('Filmilo Adhesivo'))).toBe(true);
      expect(INITIAL_GRAPHIC_STOCK.some(i => i.name.includes('Papel Matelina'))).toBe(true);
      expect(INITIAL_GRAPHIC_STOCK.some(i => i.name.includes('Papel Tatufan'))).toBe(true);
      expect(INITIAL_GRAPHIC_STOCK.some(i => i.name.includes('Papel Foto Brillante 200grs'))).toBe(true);
      expect(INITIAL_GRAPHIC_STOCK.some(i => i.name.includes('Papel Fotografico Brillante A4 120grs'))).toBe(true);
      expect(INITIAL_GRAPHIC_STOCK.some(i => i.name.includes('Papel Transfer Duralite'))).toBe(true);
      expect(INITIAL_GRAPHIC_STOCK.some(i => i.name.includes('Duracal') && i.name.includes('Gold'))).toBe(true);
      expect(INITIAL_GRAPHIC_STOCK.some(i => i.name.includes('Duracal') && i.name.includes('Silver'))).toBe(true);
    });
  });
});
