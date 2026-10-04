import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  XCircle,
  Clock,
  CheckCircle2,
  X,
  Package,
  RotateCcw
} from 'lucide-react';
import { getOrdersApi, updateOrderStatusApi } from '../services/api';
import { OrderStatusBadge } from '../components/StatusBadge';
import { OrderDetailModal } from './OrderDetailModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CurrencyPrice } from '../components/CurrencyPrice';

export const OrdersPage = ({ selectedOrderId, onOrderCleared }) => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Detail Modal & Cancel Dialog
  const [activeDetailId, setActiveDetailId] = useState(selectedOrderId || null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (selectedOrderId) {
      setActiveDetailId(selectedOrderId);
    }
  }, [selectedOrderId]);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrdersApi({
        page,
        limit: 10,
        status: statusFilter,
      });

      setOrders(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrderId) return;
    setCancelLoading(true);
    try {
      await updateOrderStatusApi(cancellingOrderId, 'CANCELLED');
      showSuccess(`Order #${cancellingOrderId} cancelled and inventory stock restored.`);
      setCancellingOrderId(null);
      fetchOrders();
    } catch (err) {
      showError(err.message || 'Failed to cancel order.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Header Title and Description */}
      <div>
        <h1 className="text-2xl text-white font-bold tracking-tight">
          {isAdmin ? 'System Orders Management' : 'My Orders History'}
        </h1>
        <p className="text-sm text-slate-400 font-normal mt-1">
          {isAdmin
            ? 'View all customer orders, filter status, and process fulfillment'
            : 'Track your placed orders, view details, and cancel eligible pending orders'}
        </p>
      </div>

      {/* Filter & Meta Bar Card */}
      <section className="bg-[#081322] border border-[#142842] rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Status Dropdown Filter */}
        <div className="relative w-64">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none bg-[#0a1626] border border-[#1b3456] rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 cursor-pointer"
          >
            <option value="">All Order Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
        </div>

        {/* Total Count Indicator */}
        <div className="text-sm text-slate-400">
          Showing <strong class="font-bold text-white">{orders.length}</strong> of{' '}
          <strong class="font-bold text-white">{pagination.total}</strong> orders
        </div>
      </section>

      {/* Main Table Content */}
      {loading ? (
        <div className="p-12 bg-[#081322] border border-[#142842] rounded-xl text-center text-xs text-slate-400 space-y-3 shadow-xl">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
          <p>Loading orders from procurement server...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 bg-[#081322] border border-dashed border-[#142842] rounded-xl text-center space-y-3 shadow-xl">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No orders found</p>
          <p className="text-xs text-slate-500">No matching orders correspond to your active filter criteria.</p>
        </div>
      ) : (
        <section className="bg-[#081322] border border-[#142842] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-[#142842] text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-[#0a1628]">
                  <th className="py-4 px-6 font-semibold" scope="col">
                    ORDER ID
                  </th>
                  {isAdmin && (
                    <th className="py-4 px-6 font-semibold" scope="col">
                      CUSTOMER
                    </th>
                  )}
                  <th className="py-4 px-6 font-semibold" scope="col">
                    DATE
                  </th>
                  <th className="py-4 px-6 font-semibold" scope="col">
                    TOTAL AMOUNT
                  </th>
                  <th className="py-4 px-6 font-semibold" scope="col">
                    STATUS
                  </th>
                  <th className="py-4 px-6 font-semibold text-right" scope="col">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody className="divide-y divide-[#12233b] text-sm text-slate-300">
                {orders.map((order) => {
                  const isCancellable = order.status === 'PENDING' || order.status === 'CONFIRMED';
                  const formattedDate = new Date(order.created_at).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                  });
                  const formattedTime = new Date(order.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-[#0c1c30]/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-white whitespace-nowrap font-mono">
                        #{order.id}
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-6 text-slate-200 font-medium">
                          {order.customer_name || `User #${order.user_id}`}
                        </td>
                      )}
                      <td className="py-4 px-6 text-slate-300 whitespace-nowrap text-xs">
                        {formattedDate} {formattedTime}
                      </td>
                      <td className="py-4 px-6 font-bold text-white whitespace-nowrap font-mono text-sm">
                        <CurrencyPrice amount={order.total_amount} />
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                        {isCancellable && (
                          <button
                            type="button"
                            onClick={() => setCancellingOrderId(order.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 border border-rose-500/40 hover:bg-rose-500/10 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveDetailId(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/10 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#142842]">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3.5 py-2 bg-[#081322] border border-[#142842] hover:bg-[#0c1c30] text-slate-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Page <span className="text-white font-bold">{page}</span> of{' '}
            <span className="text-white font-bold">{pagination.totalPages}</span>
          </span>

          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3.5 py-2 bg-[#081322] border border-[#142842] hover:bg-[#0c1c30] text-slate-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <OrderDetailModal
        isOpen={!!activeDetailId}
        onClose={() => {
          setActiveDetailId(null);
          if (onOrderCleared) onOrderCleared();
        }}
        orderId={activeDetailId}
        onOrderStatusChanged={fetchOrders}
      />

      {/* Cancel Order Confirmation */}
      <ConfirmationModal
        isOpen={!!cancellingOrderId}
        onClose={() => setCancellingOrderId(null)}
        onConfirm={handleConfirmCancelOrder}
        title="Cancel Order"
        message={`Are you sure you want to cancel Order #${cancellingOrderId}? Reserved stock will be automatically restored.`}
        confirmText="Confirm Cancellation"
        loading={cancelLoading}
      />
    </div>
  );
};
