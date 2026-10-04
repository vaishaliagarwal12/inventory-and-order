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
    <div className="space-y-6">
      {/* Admin Quick Action Shortcuts Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/40 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Admin Control Center</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management of products, inventory levels, categories, and order fulfillment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => onOpenAddProduct && onOpenAddProduct()}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
          <button
            onClick={() => onOpenAddCategory && onOpenAddCategory()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Adjust Inventory</span>
          </button>
        </div>
      </div>

      {/* Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products Card */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Products</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold text-slate-100">{loading ? '...' : metrics.totalProducts}</span>
              <span className="text-[10px] text-emerald-400 font-medium">{metrics.activeProducts} Active</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Low Stock Items</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold text-slate-100">{loading ? '...' : metrics.lowStockCount}</span>
              <span className="text-[10px] text-rose-400 font-medium">{metrics.outOfStockCount} Out of Stock</span>
            </div>
          </div>
        </div>

        {/* Total Inventory Units Card */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Stock Units</p>
            <p className="text-xl font-bold text-slate-100">{loading ? '...' : metrics.totalStockCount}</p>
          </div>
        </div>

        {/* Orders Fulfillment Card */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold text-slate-100">{loading ? '...' : metrics.totalOrders}</span>
              <span className="text-[10px] text-amber-400 font-medium">{metrics.pendingOrders} Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Recent Customer Orders</h3>
            <p className="text-xs text-slate-400">Review incoming orders and update fulfillment status</p>
          </div>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center space-x-1 transition-colors"
          >
            <span>Manage All Orders</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <p>Loading recent orders...</p>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-400">
            No orders found in the system yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-200">#{order.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-300">
                      {order.customer_name || `User #${order.user_id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-100">
                      <CurrencyPrice amount={order.total_amount} />
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {order.status === 'PENDING' && (
                        <button
                          disabled={updatingStatusId === order.id}
                          onClick={() => handleQuickStatusChange(order.id, 'CONFIRMED')}
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <button
                          disabled={updatingStatusId === order.id}
                          onClick={() => handleQuickStatusChange(order.id, 'PROCESSING')}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          Process
                        </button>
                      )}
                      {order.status === 'PROCESSING' && (
                        <button
                          disabled={updatingStatusId === order.id}
                          onClick={() => handleQuickStatusChange(order.id, 'SHIPPED')}
                          className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          Ship
                        </button>
                      )}
                      {order.status === 'SHIPPED' && (
                        <button
                          disabled={updatingStatusId === order.id}
                          onClick={() => handleQuickStatusChange(order.id, 'DELIVERED')}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          Deliver
                        </button>
                      )}
                      <button
                        onClick={() => onSelectOrder && onSelectOrder(order.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors"
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
