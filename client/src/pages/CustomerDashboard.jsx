import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  Package,
  ChevronRight,
  Eye,
  Grid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getOrdersApi, getCategoriesApi, getProductsApi, getInventoryByProductIdApi } from '../services/api';
import { OrderStatusBadge } from '../components/StatusBadge';
import { CurrencyPrice } from '../components/CurrencyPrice';
import { useToast } from '../context/ToastContext';
import { ProductCard } from '../components/ProductCard';
import { filterLegitCategories } from '../utils/categoryFilter';
import { filterLegitProducts } from '../utils/productFilter';

export const CustomerDashboard = ({ setActiveTab, onSelectOrder, onSelectCategory }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [inventoriesMap, setInventoriesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch public categories and featured products
      const [catRes, prodRes] = await Promise.all([
        getCategoriesApi().catch(() => ({ data: [] })),
        getProductsApi({ limit: 8, is_active: 'true' }).catch(() => ({ data: [] })),
      ]);

      const rawCats = Array.isArray(catRes) ? catRes : (catRes.data || catRes.categories || []);
      const cats = filterLegitCategories(rawCats);
      const rawProds = Array.isArray(prodRes) ? prodRes : (prodRes.data || prodRes.products || []);
      const prods = filterLegitProducts(rawProds);

      setCategories(cats);
      setFeaturedProducts(prods);

      // 2. Fetch recent orders if user is authenticated
      let userOrders = [];
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const ordRes = await getOrdersApi({ limit: 5 });
          userOrders = Array.isArray(ordRes) ? ordRes : (ordRes.data || ordRes.orders || []);
        } catch (ordErr) {
          console.warn('Orders unavailable for dashboard:', ordErr.message);
        }
      }
      setOrders(userOrders);

      // 3. Fetch stock quantity for featured products
      if (prods.length > 0) {
        const invMap = {};
        await Promise.all(
          prods.map(async (p) => {
            try {
              const invRes = await getInventoryByProductIdApi(p.id);
              invMap[p.id] = invRes.data?.quantity ?? 0;
            } catch {
              invMap[p.id] = 0;
            }
          })
        );
        setInventoriesMap(invMap);
      }
    } catch (err) {
      console.error('Error fetching homepage data:', err);
      setError(err.message || 'Failed to load home page data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Retail Hero Banner */}
      <div className="bg-navy text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold text-sky-light uppercase tracking-wider block">
            Multi-Category Online Store
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
            Quality Hardware, Apparel &amp; Home Goods
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Browse our wide selection of essential products with fast fulfillment and real-time inventory updates.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('products')}
            className="px-5 py-2.5 bg-white hover:bg-beige text-navy text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-navy" />
            <span>Shop Products</span>
          </button>
        </div>
      </div>

      {/* Category Navigation Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <Grid className="w-4 h-4 text-teal" />
            <span>Browse Categories</span>
          </h2>
          <button
            onClick={() => setActiveTab('categories')}
            className="text-xs font-bold text-teal hover:text-navy flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-4 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-400">
            Loading categories...
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(cat.id);
                  } else {
                    setActiveTab('products');
                  }
                }}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:border-teal hover:bg-slate-50 transition-all text-left flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-navy group-hover:text-teal transition-colors block line-clamp-1">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    {cat.product_count !== undefined ? `${cat.product_count} items` : 'Explore collection'}
                  </span>
                </div>
                <div className="mt-2 text-right">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal inline-block transition-colors" />
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Featured Product Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-navy">Featured Store Products</h2>
            <p className="text-xs text-slate-500">Explore top items available for direct purchase</p>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="text-xs font-bold text-teal hover:text-navy flex items-center gap-1 cursor-pointer"
          >
            <span>Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading products...
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                stockQty={inventoriesMap[prod.id] ?? 0}
                onAddToCart={(p, qty) => {
                  const stockQty = inventoriesMap[p.id] ?? 0;
                  if (stockQty <= 0) {
                    showError(`'${p.name}' is out of stock`);
                    return;
                  }
                  addToCart(p, qty);
                  showSuccess(`Added '${p.name}' to cart!`);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders Section (Only if orders exist) */}
      {orders.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-navy">Recent Order Activity</h2>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-teal hover:text-navy cursor-pointer"
            >
              View All Orders
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-navy">Order #{order.id}</span>
                  <span className="text-slate-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="font-bold text-navy">
                    <CurrencyPrice amount={order.total_amount} />
                  </span>
                  <OrderStatusBadge status={order.status} />
                  <button
                    onClick={() => onSelectOrder && onSelectOrder(order.id)}
                    className="p-1 text-teal hover:text-navy cursor-pointer"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
