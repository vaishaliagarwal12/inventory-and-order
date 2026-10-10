import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  Boxes
} from 'lucide-react';
import { getReportsSummaryApi } from '../services/api';
import { CurrencyPrice } from '../components/CurrencyPrice';
import { OrderStatusBadge } from '../components/StatusBadge';

export const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReportsSummaryApi();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load operational reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin mx-auto"></div>
        <p>Generating real-time PostgreSQL operational reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchReportData}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { summary, sales_by_status = [], top_selling_products = [], low_stock_items = [], recent_movements = [] } = data || {};

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
            <span>Admin</span>
            <span>/</span>
            <span className="text-teal font-bold">Business Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-teal" />
            <span>Operational &amp; Sales Reports</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Live database-backed revenue metrics, order status breakdown, top products, and low stock warnings.
          </p>
        </div>

        <button
          onClick={fetchReportData}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-navy text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-teal" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Sales Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy">
            <CurrencyPrice amount={summary?.total_revenue || 0} />
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Excludes cancelled order amounts</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Orders Placed</span>
            <div className="p-2 bg-sky-light text-navy rounded-xl">
              <ShoppingBag className="w-4 h-4 text-teal" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy">{summary?.total_orders_count || 0}</p>
          <p className="text-[11px] text-teal font-bold">{summary?.pending_orders_count || 0} pending processing</p>
        </div>

        {/* Active Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Active Catalog Items</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy">{summary?.active_products_count || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium">Visible to customer storefront</p>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Low Stock Alerts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">{summary?.low_stock_count || 0}</p>
          <p className="text-[11px] text-slate-400 font-medium">Items with quantity ≤ 10 units</p>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal" />
              <span>Top Selling Products</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">By quantity sold</span>
          </div>

          {top_selling_products.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No completed sales data yet</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {top_selling_products.map((item, idx) => (
                <div key={item.product_id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-navy font-bold text-[11px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-navy">{item.product_name}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.category_name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-navy">{item.total_units_sold} units</p>
                    <p className="text-[10px] font-bold text-teal">
                      <CurrencyPrice amount={item.total_revenue} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales Breakdown by Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal" />
              <span>Order Status &amp; Revenue Distribution</span>
            </h2>
          </div>

          {sales_by_status.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No orders recorded in database</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-center">Orders</th>
                    <th className="px-3 py-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales_by_status.map((row) => (
                    <tr key={row.status} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2.5">
                        <OrderStatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-navy">{row.order_count}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-navy">
                        <CurrencyPrice amount={row.total_amount} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warnings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low Stock Inventory Alerts</span>
            </h2>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {low_stock_items.length} items
            </span>
          </div>

          {low_stock_items.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">All inventory levels are healthy!</div>
          ) : (
            <div className="space-y-2">
              {low_stock_items.map((item) => (
                <div key={item.product_id} className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-navy">{item.product_name}</p>
                    <p className="text-[10px] text-slate-500">{item.category_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-amber-500 text-white font-extrabold rounded-lg text-xs">
                      {item.current_stock} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Movements Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Boxes className="w-4 h-4 text-teal" />
              <span>Recent Inventory Movement Ledger</span>
            </h2>
          </div>

          {recent_movements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No inventory movement audit records</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent_movements.slice(0, 5).map((mov) => (
                <div key={mov.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-navy line-clamp-1">{mov.product_name || `Product #${mov.product_id}`}</p>
                    <p className="text-[10px] text-slate-400">{mov.notes}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-extrabold ${mov.change_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {mov.change_quantity > 0 ? `+${mov.change_quantity}` : mov.change_quantity}
                    </span>
                    <p className="text-[10px] text-slate-500 font-semibold">Bal: {mov.resulting_quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
