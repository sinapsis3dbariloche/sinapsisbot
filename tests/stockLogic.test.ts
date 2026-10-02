import { describe, it, expect } from 'vitest';
import { FilamentType, StockItem } from '../types';
import {
  getMinStockThreshold,
  isStockAlert,
  isCriticalFilament,
  updateSpoolCount,
  openNewSpool,
  resetAllStockItems,
  filterAndSortStock,
  calculateStockSummary
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
});
