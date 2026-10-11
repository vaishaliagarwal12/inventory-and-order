import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Clock, CheckCircle2, AlertCircle, Package, Truck, Check, Calendar, User } from 'lucide-react';
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !statusLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, statusLoading]);

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

  // Order timeline steps helper
  const steps = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const getStepIndex = (status) => {
    if (status === 'PENDING') return 0;
    if (status === 'CONFIRMED') return 1;
    if (status === 'PROCESSING') return 2;
    if (status === 'SHIPPED') return 3;
    if (status === 'DELIVERED') return 4;
    return -1;
  };
  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  return (
    <div
      onClick={() => { if (!statusLoading) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3.5 pr-8">
          <div className="p-2.5 bg-sky-light text-navy rounded-xl border border-sky/60 shadow-xs">
            <ShoppingBag className="w-5 h-5 text-teal" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy tracking-tight">
              Order #{orderId}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{order ? `Placed on ${new Date(order.created_at).toLocaleString()}` : 'Loading order details...'}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin mx-auto"></div>
            <p>Loading order details...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Visual Order Progress Tracker */}
            {order.status !== 'CANCELLED' ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between relative px-2">
                  {steps.map((st, idx) => {
                    const isPassed = currentStepIdx >= idx + 1;
                    const isCurrent = currentStepIdx === idx + 1 || (currentStepIdx === 0 && idx === 0);

                    return (
                      <div key={st} className="flex flex-col items-center z-10 relative flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isPassed
                              ? 'bg-navy text-white shadow-xs'
                              : isCurrent
                              ? 'bg-sky-light text-navy border-2 border-navy font-bold'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {isPassed ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] font-semibold mt-1.5 capitalize text-center ${
                            isPassed || isCurrent ? 'text-navy' : 'text-slate-400'
                          }`}
                        >
                          {st.toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span className="text-sm font-bold">This order was cancelled</span>
                </div>
                <span className="text-xs font-semibold bg-rose-100 text-rose-800 px-3 py-1 rounded-full">Cancelled</span>
              </div>
            )}

            {/* Status Summary & Control Bar */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Status</span>
                <div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              {/* Status Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {isAdmin && getNextTransitions(order.status).length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-semibold">Advance Status:</span>
                    {getNextTransitions(order.status).map((nextSt) => (
                      <button
                        key={nextSt}
                        disabled={statusLoading}
                        onClick={() => handleStatusUpdate(nextSt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          nextSt === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-navy text-white border-navy hover:bg-navy-dark shadow-xs'
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
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Customer Details info for Admin */}
            {isAdmin && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</p>
                <div className="flex items-center gap-2 text-navy font-bold text-sm">
                  <User className="w-4 h-4 text-teal" />
                  <span>{order.customer_name || `Customer #${order.user_id}`}</span>
                </div>
                <p className="text-slate-500 font-medium">{order.customer_email}</p>
              </div>
            )}

            {/* Order Items List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordered Items</h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="px-4 py-3">Item Description</th>
                      <th className="px-4 py-3 text-center">Qty x Price</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(order.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 font-bold text-navy">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 text-teal flex items-center justify-center shrink-0 border border-slate-200">
                              <Package className="w-4 h-4" />
                            </div>
                            <span>{item.product_name || `Product #${item.product_id}`}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 text-center font-medium">
                          {item.quantity} × <CurrencyPrice amount={item.price_at_purchase} />
                        </td>
                        <td className="px-4 py-3.5 font-bold text-navy text-right">
                          <CurrencyPrice amount={item.subtotal || (item.quantity * item.price_at_purchase)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
              <span className="text-sm font-bold text-navy">Total Paid Amount</span>
              <span className="text-2xl font-bold text-navy tracking-tight">
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
