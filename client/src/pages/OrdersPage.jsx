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
  Package,
  Calendar,
  User,
  ArrowRight,
  Lock
} from 'lucide-react';
import { getOrdersApi, updateOrderStatusApi } from '../services/api';
import { OrderStatusBadge } from '../components/StatusBadge';
import { OrderDetailModal } from './OrderDetailModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CurrencyPrice } from '../components/CurrencyPrice';

export const OrdersPage = ({ selectedOrderId, onOrderCleared }) => {
  const { user, isAdmin, isAuthenticated, logout, isLoading: authLoading } = useAuth();
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
    if (authLoading) return;
    if (!isAuthenticated) {
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }
    fetchOrders();
  }, [authLoading, isAuthenticated, statusFilter, page]);

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

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
      const errMsg = err.message || '';
      if (
        errMsg.toLowerCase().includes('token') ||
        errMsg.toLowerCase().includes('unauthorized') ||
        errMsg.toLowerCase().includes('401')
      ) {
        logout();
        setError(null);
      } else {
        setError(errMsg || 'Failed to fetch orders');
      }
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

  if (authLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <div className="p-12 text-center text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl max-w-lg mx-auto shadow-xs my-8 space-y-3">
          <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold text-navy">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Header Title and Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2.5">
              <ShoppingBag className="w-7 h-7 text-teal" />
              <span>My Orders</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track your order status, view item details, or manage your purchases.
            </p>
          </div>
        </div>

        {/* Clean Authentication Required Card */}
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-xs max-w-lg mx-auto w-full my-8">
          <div className="w-14 h-14 rounded-2xl bg-sky-light border border-sky/60 flex items-center justify-center text-navy mx-auto">
            <Lock className="w-7 h-7 text-teal" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-navy tracking-tight">
              Sign in to view your orders
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
              Please log in or create a free account to view your past order history, inspect item details, track live deliveries, and download receipts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header Title and Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-teal" />
            <span>{isAdmin ? 'All Customer Orders' : 'My Orders'}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Manage customer orders, track fulfillment states, and update statuses.'
              : 'Track your order status, view item details, or cancel eligible pending orders.'}
          </p>
        </div>
      </div>

      {/* Filter & Meta Bar Card */}
      <section className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Status Dropdown Filter */}
        <div className="relative w-64">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-xs text-navy font-semibold focus:outline-none focus:border-teal focus:bg-white cursor-pointer transition-all"
          >
            <option value="">All Order Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <Filter className="w-4 h-4 text-teal" />
          </div>
        </div>

        {/* Total Count Indicator */}
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="font-bold text-navy">{orders.length}</strong> of{' '}
          <strong className="font-bold text-navy">{pagination.total}</strong> orders
        </div>
      </section>

      {/* Main Content */}
      {loading ? (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center text-sm text-slate-500 space-y-3 shadow-xs">
          <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin mx-auto"></div>
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-navy">No orders found</p>
          <p className="text-xs text-slate-500">There are no orders matching your selected status filter.</p>
        </div>
      ) : (
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-4 px-6 font-bold" scope="col">
                    Order ID
                  </th>
                  {isAdmin && (
                    <th className="py-4 px-6 font-bold" scope="col">
                      Customer
                    </th>
                  )}
                  <th className="py-4 px-6 font-bold" scope="col">
                    Date & Time
                  </th>
                  <th className="py-4 px-6 font-bold" scope="col">
                    Total Amount
                  </th>
                  <th className="py-4 px-6 font-bold" scope="col">
                    Status
                  </th>
                  <th className="py-4 px-6 font-bold text-right" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {orders.map((order) => {
                  const isCancellable = order.status === 'PENDING' || order.status === 'CONFIRMED';
                  const formattedDate = new Date(order.created_at).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  const formattedTime = new Date(order.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-navy whitespace-nowrap">
                        #{order.id}
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-6 text-navy font-semibold">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-sky-light text-navy font-bold text-xs flex items-center justify-center border border-sky/60">
                              {(order.customer_name || 'C')[0].toUpperCase()}
                            </div>
                            <span>{order.customer_name || `Customer #${order.user_id}`}</span>
                          </div>
                        </td>
                      )}
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}, {formattedTime}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-navy whitespace-nowrap text-base">
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveDetailId(order.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-navy bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal" />
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
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 flex items-center space-x-1 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-500 font-medium">
            Page <span className="text-slate-900 font-bold">{page}</span> of{' '}
            <span className="text-slate-900 font-bold">{pagination.totalPages}</span>
          </span>

          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 flex items-center space-x-1 shadow-xs"
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
