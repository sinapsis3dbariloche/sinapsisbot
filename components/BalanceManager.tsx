import React, { useState, useMemo } from 'react';
import { Remito, Expense, Quote, BalanceClosing } from '../types';
import { 
  Scale, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileText, 
  Trash2, 
  Eye, 
  ArrowRight, 
  Info,
  DollarSign,
  Users,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { format, subYears, startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateBalancePeriod, normalizeDateString } from '../services/balanceCalculator';
import ConfirmDialog from './ConfirmDialog';
import { useUnsavedChanges } from '../lib/UnsavedChangesContext';
import { isBalanceFormDirty } from '../services/unsavedChangesLogic';

interface BalanceManagerProps {
  remitos: Remito[];
  expenses: Expense[];
  quotes: Quote[];
  balanceClosings: BalanceClosing[];
  onSaveClosing: (closing: BalanceClosing) => Promise<void>;
  onDeleteClosing: (id: string) => Promise<void>;
  currentUserEmail?: string;
}

export const BalanceManager: React.FC<BalanceManagerProps> = ({
  remitos,
  expenses,
  quotes,
  balanceClosings,
  onSaveClosing,
  onDeleteClosing,
  currentUserEmail = 'Admin'
}) => {
  const { setIsDirty, confirmIfDirty } = useUnsavedChanges();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Sorted closings: newest end date first
  const sortedClosings = useMemo(() => {
    return [...balanceClosings].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [balanceClosings]);

  const latestClosing = sortedClosings[0] || null;

  // Default dates: start after last closing or beginning of current year
  const defaultStartDate = useMemo(() => {
    if (latestClosing) {
      // Day after last closing
      const lastEnd = new Date(latestClosing.endDate);
      lastEnd.setDate(lastEnd.getDate() + 1);
      return format(lastEnd, 'yyyy-MM-dd');
    }
    // Default to start of current year
    return format(startOfYear(new Date()), 'yyyy-MM-dd');
  }, [latestClosing]);

  const defaultEndDate = useMemo(() => {
    return format(new Date(), 'yyyy-MM-dd');
  }, []);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [closingName, setClosingName] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedClosingForView, setSelectedClosingForView] = useState<BalanceClosing | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Auto-suggest name when dates change if user hasn't explicitly set a custom one
  const suggestedName = useMemo(() => {
    if (!startDate || !endDate) return 'Balance Personalizado';
    const startY = startDate.slice(0, 4);
    const endY = endDate.slice(0, 4);
    if (startY === endY && startDate.slice(5) === '01-01' && endDate.slice(5) === '12-31') {
      return `Ejercicio Anual ${startY}`;
    }
    return `Cierre ${format(new Date(startDate + 'T12:00:00'), 'dd/MM/yyyy')} al ${format(new Date(endDate + 'T12:00:00'), 'dd/MM/yyyy')}`;
  }, [startDate, endDate]);

  const activeName = closingName.trim() || suggestedName;

  const isFormDirty = useMemo(() => {
    return activeTab === 'create' && isBalanceFormDirty(closingNotes, closingName);
  }, [activeTab, closingNotes, closingName]);

  useEffect(() => {
    setIsDirty(isFormDirty);
    return () => {
      setIsDirty(false);
    };
  }, [isFormDirty, setIsDirty]);

  // Live calculation of preview for the chosen dates
  const preview = useMemo(() => {
    if (!startDate || !endDate) return null;
    return calculateBalancePeriod({
      remitos,
      expenses,
      startDate,
      endDate,
      name: activeName,
      closedBy: currentUserEmail,
      notes: closingNotes
    });
  }, [remitos, expenses, startDate, endDate, activeName, currentUserEmail, closingNotes]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleApplyPreset = (preset: 'currentYear' | 'lastYear' | 'lastMonth' | 'ytd') => {
    const now = new Date();
    if (preset === 'currentYear') {
      setStartDate(format(startOfYear(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfYear(now), 'yyyy-MM-dd'));
      setClosingName(`Ejercicio Anual ${now.getFullYear()}`);
    } else if (preset === 'lastYear') {
      const prev = subYears(now, 1);
      setStartDate(format(startOfYear(prev), 'yyyy-MM-dd'));
      setEndDate(format(endOfYear(prev), 'yyyy-MM-dd'));
      setClosingName(`Ejercicio Anual ${prev.getFullYear()}`);
    } else if (preset === 'lastMonth') {
      const prevMonth = subMonths(now, 1);
      setStartDate(format(startOfMonth(prevMonth), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(prevMonth), 'yyyy-MM-dd'));
      setClosingName(`Cierre ${format(prevMonth, 'MMMM yyyy', { locale: es })}`);
    } else if (preset === 'ytd') {
      setStartDate(defaultStartDate);
      setEndDate(format(now, 'yyyy-MM-dd'));
      setClosingName('');
    }
  };

  const handleConfirmClosing = async () => {
    if (!preview) return;
    setIsSubmitting(true);
    try {
      setIsDirty(false);
      await onSaveClosing(preview);
      setShowConfirmModal(false);
      setClosingName('');
      setClosingNotes('');
      setActiveTab('history');
    } catch (error) {
      console.error('Error closing balance:', error);
      alert('Ocurrió un error al guardar el cierre de balance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClosing = async () => {
    if (!deleteTargetId) return;
    try {
      await onDeleteClosing(deleteTargetId);
      setDeleteTargetId(null);
      if (selectedClosingForView?.id === deleteTargetId) {
        setSelectedClosingForView(null);
      }
    } catch (error) {
      console.error('Error deleting balance:', error);
      alert('Ocurrió un error al eliminar el cierre.');
    }
  };

  const generatePDFReport = (closing: BalanceClosing) => {
    const doc = new jsPDF();

    // Brand Header
    doc.setFontSize(18);
    doc.setTextColor(234, 88, 12); // Orange
    doc.setFont('helvetica', 'bold');
    doc.text('SINAPSIS 3D', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Taller de Impresión 3D & Fabricación Digital', 14, 26);
    doc.text('Bariloche, Río Negro - Argentina', 14, 31);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE OFICIAL DE CIERRE DE BALANCE', 105, 45, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(234, 88, 12);
    doc.text(closing.name.toUpperCase(), 105, 52, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período Comprendido: ${closing.startDate} al ${closing.endDate}`, 105, 58, { align: 'center' });
    doc.text(`Fecha de Cierre: ${format(new Date(closing.closedAt), "dd/MM/yyyy HH:mm'hs'")} | Responsable: ${closing.closedBy}`, 105, 63, { align: 'center' });

    // Financial Summary Table
    const resultLabel = closing.resultType === 'PROFIT' ? 'GANANCIA NETA LIQUIDADA (+)' : closing.resultType === 'LOSS' ? 'PÉRDIDA DEL PERÍODO (-)' : 'RESULTADO NEUTRO ($0)';

    autoTable(doc, {
      startY: 72,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Concepto Financiero', 'Monto (ARS)', 'Condición Contable']],
      body: [
        ['Total Cobros Efectivos (Ingresos de Caja)', formatCurrency(closing.totalIncome), 'Percibido en el período'],
        ['Total Gastos Pagados (Egresos)', formatCurrency(closing.totalExpenses), 'Pagado a proveedores'],
        [resultLabel, formatCurrency(closing.netResult), 'Liquidado (Caja inicia en $0 para el prox. ciclo)'],
        ['Total Facturado / Remitido', formatCurrency(closing.totalBilled), `${closing.remitosCount} remitos emitidos`],
        ['Deuda de Clientes Pendiente al Corte', formatCurrency(closing.pendingReceivablesAtClose), 'PASA ABIERTA al siguiente período']
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 130;

    // Debtors Detail Table
    if (closing.debtorsSummary && closing.debtorsSummary.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalle de Cuentas por Cobrar (Deudores que continúan abiertos):', 14, finalY + 12);

      const debtorsRows = closing.debtorsSummary.map((d, index) => [
        (index + 1).toString(),
        d.customerName,
        formatCurrency(d.debt)
      ]);

      autoTable(doc, {
        startY: finalY + 16,
        theme: 'striped',
        headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: 'bold' },
        head: [['#', 'Cliente', 'Saldo Adeudado']],
        body: debtorsRows,
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          2: { halign: 'right', fontStyle: 'bold' }
        }
      });
    }

    if (closing.notes) {
      const notesY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Notas y Observaciones Contables:', 14, notesY);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(closing.notes, 14, notesY + 6);
    }

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Sinapsis 3D - Sistema de Gestión Operativa | Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
    }

    doc.save(`Balance_${closing.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center border border-orange-100 shadow-sm">
              <Scale size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Cierre de Balances</h1>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Liquidación de Períodos y Reinicio de Caja</p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl relative z-10 shrink-0">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'create'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Nuevo Cierre
          </button>
          <button
            onClick={() => {
              if (activeTab === 'history') return;
              confirmIfDirty(() => {
                setIsDirty(false);
                setClosingName('');
                setClosingNotes('');
                setActiveTab('history');
              }, 'Tenés notas o configuración del balance sin guardar. ¿Deseas descartar y ver el historial?');
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Historial
            <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-black">
              {balanceClosings.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Status of current cycle */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-7 rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                  <CheckCircle2 size={12} />
                  Período en Curso
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">
                  {latestClosing ? (
                    <>Abierto desde el {format(new Date(defaultStartDate + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })}</>
                  ) : (
                    <>Sin cierres previos registrados (Primer ejercicio)</>
                  )}
                </h2>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  {latestClosing ? (
                    <>
                      El último balance cerrado fue <strong>{latestClosing.name}</strong> al {latestClosing.endDate}. 
                      El resultado de ese balance fue liquidado y la caja actual inició en <strong>$0.00</strong>.
                    </>
                  ) : (
                    <>
                      Podés realizar cierres anuales o de cualquier rango de fechas. Al cerrar, el saldo resultante se asienta como ganancia o pérdida del balance, y la caja para el siguiente período inicia en <strong>$0.00</strong>.
                    </>
                  )}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right min-w-[200px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-300 block mb-1">
                  Regla Contable
                </span>
                <p className="text-xs text-white font-bold">
                  La caja se reinicia en <span className="text-emerald-400 font-black">$0</span>.
                </p>
                <p className="text-[10px] text-slate-300 mt-1">
                  Las deudas de clientes pasan vivas al nuevo período.
                </p>
              </div>
            </div>
          </div>

          {/* Form & Presets Card */}
          <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Calendar className="text-orange-600" size={20} />
                  Rango de Fechas Personalizado
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Elegí las fechas de inicio y fin para calcular el corte del balance
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('currentYear')}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Año Actual ({new Date().getFullYear()})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('lastYear')}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Año Anterior ({new Date().getFullYear() - 1})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('lastMonth')}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Mes Anterior
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ytd')}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Desde Último Cierre
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nombre del Balance
                </label>
                <input
                  type="text"
                  placeholder={suggestedName}
                  value={closingName}
                  onChange={(e) => setClosingName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Notas u Observaciones Contables (Opcional)
              </label>
              <textarea
                rows={2}
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Ej: Se liquidan utilidades de socios. Balance auditado con remitos y facturas de insumos."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>

          {/* Live Preview of Calculated Balance */}
          {preview && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="text-orange-500" size={20} />
                  Pre-visualización del Balance ({preview.startDate} al {preview.endDate})
                </h3>
              </div>

              {/* Result Banner: Profit vs Loss */}
              <div
                className={`p-7 rounded-[2rem] border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  preview.resultType === 'PROFIT'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : preview.resultType === 'LOSS'
                    ? 'bg-red-50/70 border-red-200 text-red-950'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        preview.resultType === 'PROFIT'
                          ? 'bg-emerald-600 text-white'
                          : preview.resultType === 'LOSS'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {preview.resultType === 'PROFIT'
                        ? 'Ganancia del Balance'
                        : preview.resultType === 'LOSS'
                        ? 'Pérdida del Balance'
                        : 'Neutro (Breakeven)'}
                    </span>
                    <span className="text-xs font-bold opacity-75">
                      {preview.startDate} → {preview.endDate}
                    </span>
                  </div>
                  <h4 className="text-3xl md:text-4xl font-black tracking-tight">
                    {formatCurrency(preview.netResult)}
                  </h4>
                  <p className="text-xs font-semibold max-w-xl opacity-80 leading-relaxed">
                    {preview.resultType === 'PROFIT' ? (
                      <>
                        Al ejecutar este cierre, estos <strong>{formatCurrency(preview.netResult)}</strong> se asientan como la ganancia oficial de este ejercicio. La caja para el nuevo período se reiniciará en <strong>$0.00</strong>.
                      </>
                    ) : preview.resultType === 'LOSS' ? (
                      <>
                        Al ejecutar este cierre, el saldo negativo de <strong>{formatCurrency(preview.netResult)}</strong> queda absorbido en este ejercicio. La caja para el nuevo período se reiniciará en <strong>$0.00</strong>.
                      </>
                    ) : (
                      <>Ingresos y egresos exactamente iguales. La caja se reiniciará en $0.00.</>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-600/30 hover:scale-[1.02] active:scale-[0.98] shrink-0 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Scale size={18} />
                  Ejecutar Cierre de Balance
                </button>
              </div>

              {/* 4 Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-3">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Cobros del Período
                  </span>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                    {formatCurrency(preview.totalIncome)}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                    Cobros registrados
                  </p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-3">
                    <TrendingDown size={20} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Gastos del Período
                  </span>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                    {formatCurrency(preview.totalExpenses)}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                    {preview.expensesCount} compras registradas
                  </p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                    <FileText size={20} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Facturado / Remitos
                  </span>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                    {formatCurrency(preview.totalBilled)}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                    {preview.remitosCount} remitos emitidos
                  </p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm bg-orange-50/20">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-3">
                    <Users size={20} />
                  </div>
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                    Pasa Abierto (Deudas)
                  </span>
                  <h4 className="text-2xl font-black text-orange-600 tracking-tight mt-1">
                    {formatCurrency(preview.pendingReceivablesAtClose)}
                  </h4>
                  <p className="text-[10px] text-orange-500/80 font-bold uppercase tracking-wider mt-2">
                    {preview.debtorsSummary.length} clientes con saldo
                  </p>
                </div>
              </div>

              {/* Debtors List Rollover */}
              {preview.debtorsSummary.length > 0 && (
                <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Users className="text-orange-600" size={18} />
                        Cartera de Cuentas por Cobrar
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Estos saldos pendientes pasan vivos al período posterior para continuar su cobro normal.
                      </p>
                    </div>
                    <span className="text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-xl border border-orange-100 self-start sm:self-auto">
                      Total a Cobrar: {formatCurrency(preview.pendingReceivablesAtClose)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {preview.debtorsSummary.map((d) => (
                      <div
                        key={d.customerId}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-black text-slate-800 block truncate">
                            {d.customerName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Saldo adeudado
                          </span>
                        </div>
                        <span className="text-sm font-black text-orange-600 shrink-0">
                          {formatCurrency(d.debt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {sortedClosings.length === 0 ? (
            <div className="bg-white p-16 rounded-[2.5rem] border border-slate-100 text-center space-y-4">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto">
                <Scale size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                No hay balances cerrados todavía
              </h3>
              <p className="text-sm text-slate-400 font-semibold max-w-md mx-auto leading-relaxed">
                Cuando finalices un ejercicio anual o período operativo, realizá el cierre en la pestaña <strong>"Nuevo Cierre"</strong>.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="px-6 py-3 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/30"
              >
                Crear Primer Cierre
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {sortedClosings.map((closing, index) => {
                const isProfit = closing.resultType === 'PROFIT';
                const isLoss = closing.resultType === 'LOSS';

                return (
                  <div
                    key={closing.id}
                    className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-6 relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                            isProfit
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : isLoss
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Scale size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                              {closing.name}
                            </h3>
                            <span
                              className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                isProfit
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isLoss
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isProfit ? 'Ganancia' : isLoss ? 'Pérdida' : 'Neutro'}
                            </span>
                            {index === 0 && (
                              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                Último Cierre
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                            Período: {closing.startDate} al {closing.endDate} • Cerrado el{' '}
                            {format(new Date(closing.closedAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedClosingForView(closing)}
                          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2"
                        >
                          <Eye size={14} />
                          Ver Detalle
                        </button>
                        <button
                          type="button"
                          onClick={() => generatePDFReport(closing)}
                          className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2"
                        >
                          <Download size={14} />
                          Descargar PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(closing.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Eliminar balance"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Numbers summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Resultado Liquidado
                        </span>
                        <span
                          className={`text-xl font-black tracking-tight ${
                            isProfit ? 'text-emerald-600' : isLoss ? 'text-red-600' : 'text-slate-800'
                          }`}
                        >
                          {formatCurrency(closing.netResult)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                          Caja reinició en $0
                        </span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Cobros Realizados
                        </span>
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                          {formatCurrency(closing.totalIncome)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                          Ingresos en el período
                        </span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Gastos Realizados
                        </span>
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                          {formatCurrency(closing.totalExpenses)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                          {closing.expensesCount} compras
                        </span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Deuda Pasó Abierta
                        </span>
                        <span className="text-xl font-black text-orange-600 tracking-tight">
                          {formatCurrency(closing.pendingReceivablesAtClose)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                          {closing.debtorsSummary?.length || 0} deudores
                        </span>
                      </div>
                    </div>

                    {closing.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                        "{closing.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                <Scale size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Confirmar Cierre de Balance
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {preview.name}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Período:</span>
                <span className="text-slate-900">{preview.startDate} al {preview.endDate}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Cobros Reales:</span>
                <span className="text-emerald-600">{formatCurrency(preview.totalIncome)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Gastos Reales:</span>
                <span className="text-red-600">{formatCurrency(preview.totalExpenses)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black">
                <span>Resultado a Asentar:</span>
                <span className={preview.netResult >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {formatCurrency(preview.netResult)} ({preview.resultType === 'PROFIT' ? 'Ganancia' : 'Pérdida'})
                </span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900 text-xs font-medium space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                Impacto en el sistema:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                <li>El resultado de caja se asienta en este balance cerrado.</li>
                <li>El Dashboard iniciará su nuevo período con <strong>caja en $0</strong>.</li>
                <li>Las deudas pendientes de clientes <strong>continuarán vivas</strong>.</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmClosing}
                className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-600/30 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Sí, Cerrar Balance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {selectedClosingForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full border border-slate-100 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {selectedClosingForView.name}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Período: {selectedClosingForView.startDate} al {selectedClosingForView.endDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClosingForView(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-black p-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cobros</span>
                <span className="text-lg font-black text-emerald-600">{formatCurrency(selectedClosingForView.totalIncome)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Gastos</span>
                <span className="text-lg font-black text-red-600">{formatCurrency(selectedClosingForView.totalExpenses)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Resultado</span>
                <span className={`text-lg font-black ${selectedClosingForView.netResult >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedClosingForView.netResult)}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Deuda Abierta</span>
                <span className="text-lg font-black text-orange-600">{formatCurrency(selectedClosingForView.pendingReceivablesAtClose)}</span>
              </div>
            </div>

            {selectedClosingForView.debtorsSummary && selectedClosingForView.debtorsSummary.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  Cuentas por Cobrar al Momento del Corte ({selectedClosingForView.debtorsSummary.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {selectedClosingForView.debtorsSummary.map((d) => (
                    <div key={d.customerId} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-xs">
                      <span className="font-bold text-slate-800">{d.customerName}</span>
                      <span className="font-black text-orange-600">{formatCurrency(d.debt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedClosingForView.notes && (
              <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Notas</span>
                <p className="text-xs text-slate-700 italic">{selectedClosingForView.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => generatePDFReport(selectedClosingForView)}
                className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-orange-600/20"
              >
                <Download size={14} />
                Descargar Reporte PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="¿Eliminar Cierre de Balance?"
        message="Esta acción eliminará el registro histórico de este balance. El Dashboard se recalculará automáticamente según los cierres restantes."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteClosing}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
