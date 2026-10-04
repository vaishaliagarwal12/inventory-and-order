import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CheckCheck,
  Clock,
  ArrowRight,
  DollarSign,
  Package,
  TrendingUp,
  Truck,
  ChevronRight,
  Bolt,
  FileText,
  Eye,
  ShoppingCart,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getOrdersApi } from '../services/api';
import { OrderStatusBadge } from '../components/StatusBadge';
import { CurrencyPrice } from '../components/CurrencyPrice';

export const CustomerDashboard = ({ setActiveTab, onSelectOrder }) => {
  const { user } = useAuth();
  const { cartItemCount, cartTotal } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomerOrders();
  }, []);

  const fetchCustomerOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrdersApi({ limit: 10 });
      setOrders(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const pendingOrders = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PROCESSING'
  ).length;
  const totalSpent = orders.reduce(
    (sum, o) => sum + (o.status !== 'CANCELLED' ? parseFloat(o.total_amount || 0) : 0),
    0
  );

  const activeOrder = orders.find(
    (o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'SHIPPED'
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Top Level Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#00c2ff]/15 text-[#00c2ff] text-[10px] font-mono uppercase tracking-wider font-semibold">
              Nexus Portal v2.4
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span className="text-xs text-[#bcc8d1] font-mono">NODE // US-EAST-01</span>
          </div>
          <h1 className="text-2xl text-[#dfe2ef] tracking-tight font-semibold">Dashboard Overview</h1>
          <p className="text-xs md:text-sm text-[#bcc8d1]">
            Welcome back, <span className="text-[#dfe2ef] font-semibold">{user?.name || 'Customer'}</span>. Here is a summary of your recent orders, cart status, and procurement metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('cart')}
            className="px-4 py-2 rounded-xl bg-[#181b25] hover:bg-[#262a34] text-[#dfe2ef] text-xs font-medium transition-colors border border-[#262a34] flex items-center gap-2 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4 text-[#00c2ff]" />
            <span>My Cart ({cartItemCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className="px-4 py-2 rounded-xl bg-[#00c2ff] hover:bg-[#00a2e6] text-[#00344e] text-xs font-semibold transition-all shadow-[0_0_18px_rgba(0,194,255,0.3)] flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Catalog</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Total Orders */}
        <div className="bg-[#181b25] border border-[#262a34] rounded-2xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#00c2ff]/5 rounded-full blur-xl group-hover:bg-[#00c2ff]/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#86929a] font-semibold">Total Orders Placed</span>
            <div className="w-8 h-8 rounded-lg bg-[#262a34] flex items-center justify-center text-[#00c2ff]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-mono text-3xl text-[#dfe2ef] tracking-tight font-bold">
              {loading ? '...' : totalOrders}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#5ae9ac] font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              Active account
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#262a34]/60 flex items-center justify-between text-[#bcc8d1]">
            <span className="text-xs text-[#86929a]">Order History</span>
            <span className="text-[11px] font-mono text-[#dfe2ef]">{deliveredOrders} Completed</span>
          </div>
        </div>

        {/* KPI 2: Active Orders */}
        <div className="bg-[#181b25] border border-[#262a34] rounded-2xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#86929a] font-semibold">Pending Deliveries</span>
            <div className="w-8 h-8 rounded-lg bg-[#262a34] flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl text-[#dfe2ef] tracking-tight font-bold">
                {loading ? '...' : pendingOrders}
              </span>
              <span className="text-xs text-[#bcc8d1]">Orders</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              In Progress
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#262a34]/60 flex items-center justify-between text-[#bcc8d1]">
            <span className="text-xs text-[#86929a]">Status Tracking</span>
            <span className="text-[11px] font-mono text-[#00c2ff]">Real-Time Sync</span>
          </div>
        </div>

        {/* KPI 3: Cart Items */}
        <div className="bg-[#181b25] border border-[#262a34] rounded-2xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#00c2ff]/5 rounded-full blur-xl group-hover:bg-[#00c2ff]/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#86929a] font-semibold">Items in Cart</span>
            <div className="w-8 h-8 rounded-lg bg-[#262a34] flex items-center justify-center text-[#00c2ff]">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl text-[#dfe2ef] tracking-tight font-bold">
                {cartItemCount}
              </span>
              <span className="text-xs text-[#bcc8d1]">Items</span>
            </div>
            <span className="font-mono text-sm font-bold text-[#00c2ff]">
              <CurrencyPrice amount={cartTotal} />
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#262a34]/60 flex items-center justify-between text-[#bcc8d1]">
            <span className="text-xs text-[#86929a]">Ready for checkout</span>
            <button
              onClick={() => setActiveTab('cart')}
              className="text-[11px] text-[#00c2ff] hover:underline flex items-center gap-0.5"
            >
              Review <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 4: Total Spent */}
        <div className="bg-[#181b25] border border-[#262a34] rounded-2xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#5ae9ac]/5 rounded-full blur-xl group-hover:bg-[#5ae9ac]/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#86929a] font-semibold">Total Spent</span>
            <div className="w-8 h-8 rounded-lg bg-[#262a34] flex items-center justify-center text-[#5ae9ac]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-mono text-2xl text-[#dfe2ef] tracking-tight font-bold truncate">
              {loading ? '...' : <CurrencyPrice amount={totalSpent} />}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#262a34]/60 flex items-center justify-between text-[#bcc8d1]">
            <span className="text-xs text-[#86929a]">Accumulated Orders</span>
            <span className="text-[11px] font-mono text-[#5ae9ac]">Verified</span>
          </div>
        </div>
      </div>

      {/* Main Content Dual-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          {/* Recent Orders Card */}
          <div className="bg-[#181b25] border border-[#262a34] rounded-2xl p-6 shadow-md flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[#00c2ff]" />
                <h2 className="text-base font-bold text-[#dfe2ef]">Recent Orders</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#262a34] text-[#bcc8d1] text-[10px] font-mono">
                  Latest {orders.slice(0, 5).length}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-semibold text-[#00c2ff] hover:text-[#75d1ff] transition-colors flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-[#bcc8d1] space-y-2">
                <div className="w-6 h-6 border-2 border-[#00c2ff]/30 border-t-[#00c2ff] rounded-full animate-spin mx-auto"></div>
                <p>Loading recent orders...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                {error}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 border border-dashed border-[#262a34] rounded-xl text-center space-y-3">
                <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-[#bcc8d1]">You haven't placed any orders yet.</p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-4 py-2 bg-[#262a34] hover:bg-[#31353f] text-[#00c2ff] text-xs font-semibold rounded-xl transition-colors border border-[#31353f]"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#dfe2ef]">
                  <thead className="bg-[#0a0e17] text-[10px] font-semibold text-[#86929a] uppercase tracking-wider border-b border-[#262a34]">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262a34]/60">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-[#1c1f29] transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#00c2ff]">#{order.id}</td>
                        <td className="px-4 py-3.5 text-[#bcc8d1]">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#dfe2ef]">
                          <CurrencyPrice amount={order.total_amount} />
                        </td>
                        <td className="px-4 py-3.5">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => onSelectOrder && onSelectOrder(order.id)}
                            className="px-3 py-1.5 bg-[#262a34] hover:bg-[#31353f] text-[#00c2ff] rounded-lg text-xs font-semibold transition-colors flex items-center justify-end gap-1 ml-auto border border-[#31353f]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
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

        {/* Right Column (4 Cols Sidebar) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Active Shipment Tracker Card */}
          <div className="bg-[#181b25] border border-[#262a34] rounded-2xl p-6 shadow-md flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00c2ff] animate-pulse"></span>
                <h2 className="text-sm font-bold text-[#dfe2ef]">Active Order Status</h2>
              </div>
              {activeOrder && (
                <span className="text-xs font-mono font-bold text-[#00c2ff]">#{activeOrder.id}</span>
              )}
            </div>

            {activeOrder ? (
              <div className="space-y-4">
                <div className="p-3 bg-[#0a0e17] rounded-xl border border-[#262a34] flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#86929a] uppercase">Current Status</span>
                    <span className="font-semibold text-[#dfe2ef] mt-0.5">{activeOrder.status}</span>
                  </div>
                  <OrderStatusBadge status={activeOrder.status} />
                </div>

                <button
                  onClick={() => onSelectOrder && onSelectOrder(activeOrder.id)}
                  className="w-full py-2 bg-[#262a34] hover:bg-[#31353f] text-[#00c2ff] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-[#31353f]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Track Order #{activeOrder.id}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#0a0e17] rounded-xl border border-[#262a34] text-center space-y-2">
                <Truck className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs text-[#bcc8d1]">No active shipments in transit right now.</p>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-[#181b25] border border-[#262a34] rounded-2xl p-6 shadow-md flex flex-col space-y-3">
            <div className="flex items-center gap-2 pb-1">
              <Bolt className="w-4 h-4 text-[#86929a]" />
              <h2 className="text-sm font-bold text-[#dfe2ef]">Quick Actions</h2>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('products')}
                className="p-3 rounded-xl bg-[#0a0e17] hover:bg-[#1c1f29] border border-[#262a34] transition-all flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00c2ff]/10 text-[#00c2ff] flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dfe2ef] group-hover:text-[#00c2ff] transition-colors">
                      Browse Catalog
                    </span>
                    <span className="text-[11px] text-[#86929a]">Explore products &amp; items</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#86929a] group-hover:text-[#00c2ff] transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className="p-3 rounded-xl bg-[#0a0e17] hover:bg-[#1c1f29] border border-[#262a34] transition-all flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5ae9ac]/10 text-[#5ae9ac] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dfe2ef] group-hover:text-[#5ae9ac] transition-colors">
                      Order History
                    </span>
                    <span className="text-[11px] text-[#86929a]">View past orders &amp; invoices</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#86929a] group-hover:text-[#5ae9ac] transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className="p-3 rounded-xl bg-[#0a0e17] hover:bg-[#1c1f29] border border-[#262a34] transition-all flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00c2ff]/10 text-[#00c2ff] flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dfe2ef] group-hover:text-[#00c2ff] transition-colors">
                      Account Profile
                    </span>
                    <span className="text-[11px] text-[#86929a]">Manage account &amp; settings</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#86929a] group-hover:text-[#00c2ff] transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

