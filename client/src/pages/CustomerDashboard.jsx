import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  Package,
  ChevronRight,
  Eye,
  Grid,
  Laptop,
  Shirt,
  Footprints,
  BookOpen,
  UtensilsCrossed,
  Armchair,
  Dumbbell,
  Sparkles,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getOrdersApi, getCategoriesApi, getProductsApi, getInventoryByProductIdApi } from '../services/api';
import { OrderStatusBadge } from '../components/StatusBadge';
import { CurrencyPrice } from '../components/CurrencyPrice';
import { useToast } from '../context/ToastContext';
import { ProductCard } from '../components/ProductCard';

// Category icon helper
const getCategoryIcon = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('elec') || lower.includes('gadget') || lower.includes('tech')) return Laptop;
  if (lower.includes('footwear') || lower.includes('shoe') || lower.includes('sneaker')) return Footprints;
  if (lower.includes('cloth') || lower.includes('fashion') || lower.includes('apparel')) return Shirt;
  if (lower.includes('book') || lower.includes('read') || lower.includes('literature')) return BookOpen;
  if (lower.includes('kitchen') || lower.includes('cook') || lower.includes('home')) return UtensilsCrossed;
  if (lower.includes('furnit') || lower.includes('office') || lower.includes('desk')) return Armchair;
  if (lower.includes('sport') || lower.includes('fit') || lower.includes('gym')) return Dumbbell;
  if (lower.includes('beaut') || lower.includes('care') || lower.includes('skin')) return Sparkles;
  if (lower.includes('bag') || lower.includes('travel') || lower.includes('luggage')) return Briefcase;
  return Package;
};

export const CustomerDashboard = ({
  setActiveTab,
  onSelectOrder,
  onSelectCategory,
  onSelectProduct
}) => {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [inventoriesMap, setInventoriesMap] = useState({});
  const [selectedHomeCategory, setSelectedHomeCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch public categories and active catalog products directly from backend
      const [catRes, prodRes] = await Promise.all([
        getCategoriesApi().catch(() => ({ data: [] })),
        getProductsApi({ limit: 54, is_active: 'true' }).catch(() => ({ data: [] })),
      ]);

      const cats = Array.isArray(catRes) ? catRes : (catRes.data || catRes.categories || []);
      const prods = Array.isArray(prodRes) ? prodRes : (prodRes.data || prodRes.products || []);

      // Only show categories that have real catalog products available in the store
      const activeCats = cats.filter((c) => Number(c.product_count) > 0);
      setCategories(activeCats);
      setAllProducts(prods);

      // 2. Fetch inventory balances for displayed products
      if (prods.length > 0) {
        const invMap = {};
        await Promise.all(
          prods.slice(0, 36).map(async (p) => {
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

      // 3. Fetch recent customer orders if logged in
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const ordRes = await getOrdersApi({ limit: 4 });
          const userOrders = Array.isArray(ordRes) ? ordRes : (ordRes.data || ordRes.orders || []);
          setOrders(userOrders);
        } catch (ordErr) {
          console.warn('Orders unavailable for dashboard:', ordErr.message);
        }
      }
    } catch (err) {
      console.error('Error fetching homepage data:', err);
      setError(err.message || 'Failed to load store data');
    } finally {
      setLoading(false);
    }
  };

  // Filter products by selected category tab on homepage
  const displayedCategoryProducts = selectedHomeCategory === 'ALL'
    ? allProducts
    : allProducts.filter((p) => String(p.category_id) === String(selectedHomeCategory));

  // Top Value Picks / Deals of the day (First 4 items)
  const topValuePicks = allProducts.slice(0, 4);

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full pb-10">
      {/* 1. FLIPKART-INSPIRED CATEGORY NAVIGATION ROW */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-emerald-600" />
            <span>Top Categories</span>
          </span>
          <button
            onClick={() => setActiveTab('categories')}
            className="text-xs font-bold text-emerald-700 hover:text-navy flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>All Categories ({categories.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-4 overflow-x-auto py-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[72px] animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-slate-100"></div>
                <div className="w-12 h-2.5 rounded bg-slate-100"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto pb-1 no-scrollbar justify-start sm:justify-between">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const count = cat.product_count !== undefined ? Number(cat.product_count) : 6;

              return (
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
                  className="flex flex-col items-center gap-1.5 min-w-[70px] sm:min-w-[80px] p-1.5 rounded-xl hover:bg-slate-50 transition-all text-center group cursor-pointer shrink-0"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 group-hover:from-emerald-50 group-hover:to-teal-50 border border-slate-200/80 group-hover:border-emerald-300 flex items-center justify-center text-slate-700 group-hover:text-emerald-700 group-hover:scale-105 transition-all shadow-2xs">
                    <Icon className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-navy group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {cat.name}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 group-hover:text-emerald-600">
                    {count} items
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. CATALOG HIGHLIGHTS BANNER */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Banner A: Catalog Showcase */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-navy text-white rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-1.5 max-w-sm z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 tracking-wider uppercase">
              Catalog Showcase
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              54 Products Across 9 Distinct Categories
            </h2>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Real-time database-backed inventory with live USD and INR pricing support.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between z-10">
            <button
              onClick={() => setActiveTab('products')}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-emerald-800 text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-emerald-200">
              54 Products Available
            </span>
          </div>

          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none"></div>
        </div>

        {/* Banner B: Transparent Inventory */}
        <div className="bg-gradient-to-r from-slate-800 via-navy to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between relative overflow-hidden border border-slate-700/50">
          <div className="space-y-1.5 max-w-sm z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-700 text-slate-200 tracking-wider uppercase">
              Warehouse Stock
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              Transparent Inventory &amp; Order Tracking
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Transactional stock reservation, instant order updates, and self-service cancellation.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between z-10">
            <button
              onClick={() => setActiveTab('products')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-400">
              PostgreSQL Verified
            </span>
          </div>

          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none"></div>
        </div>
      </section>

      {/* 3. FEATURED CATALOG PICKS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-navy">Featured Store Catalog</h2>
              <p className="text-[11px] text-slate-500">Live products with current inventory ready for checkout</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="text-xs font-bold text-emerald-700 hover:text-navy flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All ({allProducts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            {topValuePicks.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                stockQty={inventoriesMap[prod.id] ?? 25}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. EXPLORE BY CATEGORY TABS & LIVE PRODUCT CATALOG */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-sm sm:text-base font-black text-navy">Live Store Catalog</h2>
            <p className="text-[11px] text-slate-500">Real-time inventory ready for immediate checkout</p>
          </div>

          {/* Quick Category Filter Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedHomeCategory('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedHomeCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Items ({allProducts.length})
            </button>
            {categories.slice(0, 6).map((c) => {
              const isSelected = String(selectedHomeCategory) === String(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedHomeCategory(c.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse"></div>
            ))}
          </div>
        ) : displayedCategoryProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            No products found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {displayedCategoryProducts.slice(0, 16).map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                stockQty={inventoriesMap[prod.id] ?? 20}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        )}

        {/* View Full Catalog Button */}
        <div className="text-center pt-3">
          <button
            onClick={() => setActiveTab('products')}
            className="px-6 py-2.5 bg-white hover:bg-slate-50 text-navy font-bold text-xs rounded-xl border border-slate-200 shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <span>View Full 54-Item Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>
      </section>

      {/* 5. RECENT ORDERS WIDGET (For Authenticated Customers) */}
      {isAuthenticated && orders.length > 0 && (
        <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs sm:text-sm font-bold text-navy">Your Recent Orders</h2>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-emerald-700 hover:text-navy cursor-pointer transition-colors"
            >
              View All Orders
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div key={order.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-navy">Order #{order.id}</span>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="font-black text-navy">
                    <CurrencyPrice amount={order.total_amount} />
                  </span>
                  <OrderStatusBadge status={order.status} />
                  <button
                    onClick={() => onSelectOrder && onSelectOrder(order.id)}
                    className="p-1 text-emerald-700 hover:text-navy cursor-pointer"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
