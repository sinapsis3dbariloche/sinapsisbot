import { describe, it, expect } from 'vitest';
import { Printer } from '../types';
import {
  canPerformHotendChange,
  registerHotendChange,
  deleteMaintenanceRecord,
  getPrinterMaintenanceSummary
} from '../services/printerLogic';

describe('3D Printers & Maintenance Logic', () => {
  const samplePrinter: Printer = {
    id: 'p-1',
    name: 'BAMBU LAB P1S #1',
    model: 'P1S',
    hasAMS: true,
    history: [
      {
        id: 'rec-1',
        date: '2026-01-15T10:00:00Z',
        type: 'Cambio de Hotend',
        notes: 'Cambio preventivo por desgaste.'
      },
      {
        id: 'rec-2',
        date: '2026-02-01T15:00:00Z',
        type: 'Limpieza',
        notes: 'Mantenimiento de ejes lineales.'
      }
    ]
  };

  it('determines if hotend change is possible based on stock', () => {
    expect(canPerformHotendChange(2)).toBe(true);
    expect(canPerformHotendChange(1)).toBe(true);
    expect(canPerformHotendChange(0)).toBe(false);
    expect(canPerformHotendChange(-1)).toBe(false);
  });

  it('registers a hotend change, prepends record and decrements stock', () => {
    const { updatedPrinter, newHotendStock, success } = registerHotendChange(samplePrinter, 3);
    expect(success).toBe(true);
    expect(newHotendStock).toBe(2);
    expect(updatedPrinter.history).toHaveLength(3);
    expect(updatedPrinter.history[0].type).toBe('Cambio de Hotend');

    // Fails when hotend stock is 0
    const failAttempt = registerHotendChange(samplePrinter, 0);
    expect(failAttempt.success).toBe(false);
    expect(failAttempt.newHotendStock).toBe(0);
    expect(failAttempt.updatedPrinter.history).toHaveLength(2);
  });

  it('restores hotend stock when deleting a hotend maintenance record', () => {
    // rec-1 is 'Cambio de Hotend' -> stock should increase by 1
    const result1 = deleteMaintenanceRecord(samplePrinter, 'rec-1', 2);
    expect(result1.newHotendStock).toBe(3);
    expect(result1.updatedPrinter.history).toHaveLength(1);

    // rec-2 is 'Limpieza y Engrase' -> stock should remain unchanged
    const result2 = deleteMaintenanceRecord(samplePrinter, 'rec-2', 2);
    expect(result2.newHotendStock).toBe(2);
    expect(result2.updatedPrinter.history).toHaveLength(1);
  });

  it('computes maintenance summary metrics correctly', () => {
    const summary = getPrinterMaintenanceSummary(samplePrinter);
    expect(summary.totalRecords).toBe(2);
    expect(summary.hotendChanges).toBe(1);
    expect(summary.lastMaintenanceType).toBe('Cambio de Hotend');
  });
});
