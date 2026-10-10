import React, { useState, useEffect } from 'react';
import { Package, Boxes, ShoppingBag, AlertTriangle, ArrowRight, Plus, FolderPlus, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { getProductsApi, getInventoryApi, getOrdersApi, updateOrderStatusApi } from '../services/api';
import { OrderStatusBadge } from '../components/StatusBadge';
import { CurrencyPrice } from '../components/CurrencyPrice';
import { useToast } from '../context/ToastContext';

export const AdminDashboard = ({ setActiveTab, onSelectOrder, onOpenAddProduct, onOpenAddCategory }) => {
  const { showSuccess, showError } = useToast();

  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Execute API calls in parallel
      const [prodRes, invRes, ordRes] = await Promise.all([
        getProductsApi({ limit: 100 }),
        getInventoryApi({ limit: 100 }),
        getOrdersApi({ limit: 10 }),
      ]);

      const products = prodRes.data || [];
      const inventory = invRes.data || [];
      const orders = ordRes.data || [];

      const activeProd = products.filter((p) => p.is_active).length;
      const lowStock = inventory.filter((i) => i.quantity > 0 && i.quantity <= 10).length;
      const outOfStock = inventory.filter((i) => i.quantity === 0).length;
      const pendingOrd = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PROCESSING').length;

      setMetrics({
        totalProducts: prodRes.pagination?.total || products.length,
        activeProducts: activeProd,
        totalStockCount: inventory.reduce((sum, i) => sum + (i.quantity || 0), 0),
        lowStockCount: lowStock,
        outOfStockCount: outOfStock,
        totalOrders: ordRes.pagination?.total || orders.length,
        pendingOrders: pendingOrd,
      });

      setRecentOrders(orders);
    } catch (err) {
      console.error('Error fetching admin dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (orderId, newStatus) => {
    setUpdatingStatusId(orderId);
    try {
      await updateOrderStatusApi(orderId, newStatus);
      showSuccess(`Order #${orderId} status updated to ${newStatus}`);
      fetchDashboardData();
    } catch (err) {
      showError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Admin Quick Action Shortcuts Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy tracking-tight">Admin Overview &amp; Control</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time management of products, inventory stock levels, category taxonomy, and customer order fulfillment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => onOpenAddProduct && onOpenAddProduct()}
            className="px-4 py-2.5 bg-navy hover:bg-navy-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
          <button
            onClick={() => onOpenAddCategory && onOpenAddCategory()}
            className="px-4 py-2.5 bg-beige hover:bg-amber-100/70 text-navy border border-slate-200/80 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-teal" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-4 py-2.5 bg-beige hover:bg-amber-100/70 text-navy border border-slate-200/80 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-teal" />
            <span>Adjust Inventory</span>
          </button>
        </div>
      </div>

      {/* Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products Card */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center space-x-4 shadow-xs">
          <div className="p-3.5 bg-sky-light text-navy rounded-2xl border border-sky/40">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</p>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-2xl font-extrabold text-navy">{loading ? '...' : metrics.totalProducts}</span>
              <span className="text-xs text-emerald-600 font-bold">{metrics.activeProducts} Active</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center space-x-4 shadow-xs">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Items</p>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-2xl font-extrabold text-navy">{loading ? '...' : metrics.lowStockCount}</span>
              <span className="text-xs text-rose-600 font-bold">{metrics.outOfStockCount} Out of Stock</span>
            </div>
          </div>
        </div>

        {/* Total Inventory Units Card */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center space-x-4 shadow-xs">
          <div className="p-3.5 bg-beige text-teal rounded-2xl border border-amber-200/50">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stock Units</p>
            <p className="text-2xl font-extrabold text-navy mt-0.5">{loading ? '...' : metrics.totalStockCount}</p>
          </div>
        </div>

        {/* Orders Fulfillment Card */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center space-x-4 shadow-xs">
          <div className="p-3.5 bg-sky-light text-teal rounded-2xl border border-sky/40">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-2xl font-extrabold text-navy">{loading ? '...' : metrics.totalOrders}</span>
              <span className="text-xs text-amber-600 font-bold">{metrics.pendingOrders} Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy">Recent Orders</h3>
            <p className="text-xs text-slate-500">Review customer orders and manage fulfillment status</p>
          </div>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-xs font-bold text-navy hover:text-teal flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <span>Manage All Orders</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-navy rounded-full animate-spin mx-auto"></div>
            <p>Loading recent orders...</p>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
            No orders found in the system yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-navy">#{order.id}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {order.customer_name || `User #${order.user_id}`}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-navy text-sm">
                      <CurrencyPrice amount={order.total_amount} />
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {order.status === 'PENDING' && (
                        <button
                          disabled={updatingStatusId === order.id}
                          onClick={() => handleQuickStatusChange(order.id, 'CONFIRMED')}
                          className="px-3 py-1 bg-sky-light hover:bg-sky/40 text-navy border border-sky rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <button
                          disabled={updatingStatusId === order.id}
                          onClick={() => handleQuickStatusChange(order.id, 'PROCESSING')}
                          className="px-3 py-1 bg-teal/10 hover:bg-teal/20 text-navy border border-teal/30 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Process
                        </button>
                      )}
                      {order.status === 'PROCESSING' && (
                        <button
                          disabled={updatingStatusId === order.id}
                          onClick={() => handleQuickStatusChange(order.id, 'SHIPPED')}
                          className="px-3 py-1 bg-sky-light hover:bg-sky/40 text-navy border border-sky rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Ship
                        </button>
                      )}
                      {order.status === 'SHIPPED' && (
                        <button
                          disabled={updatingStatusId === order.id}
                          onClick={() => handleQuickStatusChange(order.id, 'DELIVERED')}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Deliver
                        </button>
                      )}
                      <button
                        onClick={() => onSelectOrder && onSelectOrder(order.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
