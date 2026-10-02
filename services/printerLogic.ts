import { Printer, MaintenanceRecord } from '../types';

export const canPerformHotendChange = (hotendStock: number): boolean => {
  return hotendStock > 0;
};

export const registerHotendChange = (
  printer: Printer,
  currentHotendStock: number,
  date: string = new Date().toISOString(),
  notes: string = 'Cambio preventivo. Se utilizó 1 unidad del stock central.'
): { updatedPrinter: Printer; newHotendStock: number; success: boolean; error?: string } => {
  if (!canPerformHotendChange(currentHotendStock)) {
    return {
      updatedPrinter: printer,
      newHotendStock: currentHotendStock,
      success: false,
      error: 'No hay hotends disponibles en stock'
    };
  }

  const newRecord: MaintenanceRecord = {
    id: `maint-${Date.now()}`,
    date,
    type: 'Cambio de Hotend',
    notes
  };

  const updatedPrinter: Printer = {
    ...printer,
    history: [newRecord, ...(printer.history || [])]
  };

  return {
    updatedPrinter,
    newHotendStock: currentHotendStock - 1,
    success: true
  };
};

export const deleteMaintenanceRecord = (
  printer: Printer,
  recordId: string,
  currentHotendStock: number
): { updatedPrinter: Printer; newHotendStock: number } => {
  const recordToDelete = printer.history.find(r => r.id === recordId);
  const isHotendChange = recordToDelete?.type === 'Cambio de Hotend';

  const updatedPrinter: Printer = {
    ...printer,
    history: printer.history.filter(r => r.id !== recordId)
  };

  const newHotendStock = isHotendChange ? currentHotendStock + 1 : currentHotendStock;

  return {
    updatedPrinter,
    newHotendStock
  };
};

export const getPrinterMaintenanceSummary = (printer: Printer) => {
  const history = printer.history || [];
  const totalRecords = history.length;
  const hotendChanges = history.filter(r => r.type === 'Cambio de Hotend').length;
  const lastRecord = history[0] || null;

  return {
    totalRecords,
    hotendChanges,
    lastMaintenanceDate: lastRecord ? lastRecord.date : null,
    lastMaintenanceType: lastRecord ? lastRecord.type : null
  };
};
