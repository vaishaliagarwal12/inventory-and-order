import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { getOrderByIdApi, updateOrderStatusApi } from '../services/api';
import { OrderStatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CurrencyPrice } from '../components/CurrencyPrice';

export const OrderDetailModal = ({ isOpen, onClose, orderId, onOrderStatusChanged }) => {
  const { isAdmin, user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Change State
  const [statusLoading, setStatusLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrderByIdApi(orderId);
      setOrder(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setStatusLoading(true);
    try {
      await updateOrderStatusApi(orderId, newStatus);
      showSuccess(`Order #${orderId} status changed to ${newStatus}`);
      if (onOrderStatusChanged) onOrderStatusChanged();
      fetchOrderDetails();
    } catch (err) {
      showError(err.message || 'Failed to update order status');
    } finally {
      setStatusLoading(false);
    }
  };

  if (!isOpen) return null;

  const isOwnOrder = order && user && order.user_id === user.id;
  const isCancellable = order && (order.status === 'PENDING' || order.status === 'CONFIRMED') && (isAdmin || isOwnOrder);

  // Next valid transitions for Admin status management
  const getNextTransitions = (status) => {
    switch (status) {
      case 'PENDING':
        return ['CONFIRMED', 'CANCELLED'];
      case 'CONFIRMED':
        return ['PROCESSING', 'CANCELLED'];
      case 'PROCESSING':
        return ['SHIPPED'];
      case 'SHIPPED':
        return ['DELIVERED'];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Order #{orderId} Details
            </h3>
            <p className="text-xs text-slate-400">
              {order ? `Placed on ${new Date(order.created_at).toLocaleString()}` : 'Loading order details...'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
            <p>Loading order details...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Status Summary Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Status</span>
                <div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              {/* Status Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {isAdmin && getNextTransitions(order.status).length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-medium">Update to:</span>
                    {getNextTransitions(order.status).map((nextSt) => (
                      <button
                        key={nextSt}
                        disabled={statusLoading}
                        onClick={() => handleStatusUpdate(nextSt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          nextSt === 'CANCELLED'
                            ? 'bg-rose-950/40 text-rose-300 border-rose-700/50 hover:bg-rose-900/60'
                            : 'bg-indigo-950/40 text-indigo-300 border-indigo-700/50 hover:bg-indigo-900/60'
                        }`}
                      >
                        {nextSt}
                      </button>
                    ))}
                  </div>
                )}

                {!isAdmin && isCancellable && (
                  <button
                    disabled={statusLoading}
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700/50 rounded-xl text-xs font-semibold transition-all"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Customer Details info for Admin */}
            {isAdmin && (
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Customer Information</p>
                <p className="font-semibold text-slate-200">{order.customer_name || `User #${order.user_id}`}</p>
                <p className="text-slate-400">{order.customer_email}</p>
              </div>
            )}

            {/* Order Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Order Items</h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <tbody className="divide-y divide-slate-800/60">
                    {(order.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium text-slate-100">
                          {item.product_name || `Product #${item.product_id}`}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-center">
                          {item.quantity} × <CurrencyPrice amount={item.price_at_purchase} />
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-100 text-right">
                          <CurrencyPrice amount={item.subtotal || (item.quantity * item.price_at_purchase)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-sm font-bold">
              <span className="text-slate-300">Total Order Amount</span>
              <span className="text-lg text-cyan-300">
                <CurrencyPrice amount={order.total_amount} />
              </span>
            </div>
          </div>
        ) : null}

        {/* Cancellation Confirmation Dialog */}
        <ConfirmationModal
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={() => {
            setShowCancelConfirm(false);
            handleStatusUpdate('CANCELLED');
          }}
          title="Cancel Order"
          message={`Are you sure you want to cancel Order #${orderId}? Stock for items in this order will be automatically restored.`}
          confirmText="Yes, Cancel Order"
          loading={statusLoading}
        />
      </div>
    </div>
  );
};
