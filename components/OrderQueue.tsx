
import React from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, CheckCircle2, Send, Palette, Printer, MoreVertical, Plus } from 'lucide-react';

interface OrderQueueProps {
  orders: Order[];
}

const OrderQueue: React.FC<OrderQueueProps> = ({ orders }) => {
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDIENTE: return <Clock size={16} className="text-slate-400" />;
      case OrderStatus.EN_DISENO: return <Palette size={16} className="text-blue-500" />;
      case OrderStatus.IMPRIMIENDO: return <Printer size={16} className="text-indigo-500 animate-pulse" />;
      case OrderStatus.LISTO: return <CheckCircle2 size={16} className="text-green-500" />;
      case OrderStatus.ENTREGADO: return <Send size={16} className="text-slate-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'text-red-600 bg-red-50';
      case 'Media': return 'text-indigo-600 bg-indigo-50';
      case 'Baja': return 'text-slate-600 bg-slate-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cola de Producción</h2>
          <p className="text-sm text-slate-500">Gestionando {orders.length} pedidos activos</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
          <Plus size={18} />
          Nuevo Pedido
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pedido</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{order.customer}</div>
                    <div className="text-[10px] text-slate-400 font-mono">#{order.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700 font-medium">{order.details}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="text-xs font-semibold text-slate-600">{order.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-500 font-medium">{order.createdAt}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {orders.map((order) => (
            <div key={order.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900 leading-tight">{order.customer}</div>
                  <div className="text-[10px] text-slate-400 font-mono">#{order.id}</div>
                </div>
                <button className="p-1 -mr-1 text-slate-400">
                  <MoreVertical size={16} />
                </button>
              </div>
              
              <p className="text-sm text-slate-600">{order.details}</p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg">
                  {getStatusIcon(order.status)}
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{order.status}</span>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg ${getPriorityColor(order.priority)}`}>
                  {order.priority}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase ml-auto">{order.createdAt}</span>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-sm">
              No hay pedidos en la cola
            </div>
          )}
        </div>
      </div>
  </div>
);
};

export default OrderQueue;
