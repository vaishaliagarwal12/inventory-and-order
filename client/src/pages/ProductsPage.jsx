import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ShoppingCart,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  LayoutGrid,
  List,
  Cpu,
  RefreshCw
} from 'lucide-react';
import {
  getProductsApi,
  getCategoriesApi,
  patchProductStatusApi,
  deleteProductApi,
  getInventoryByProductIdApi
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { StockStatusBadge } from '../components/StatusBadge';
import { CurrencyPrice } from '../components/CurrencyPrice';

export const ProductsPage = ({ globalSearch = '', openAddModalSignal, onModalHandled }) => {
  const { isAdmin } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoriesMap, setInventoriesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View mode state for Admin (grid vs table)
  const [viewMode, setViewMode] = useState('grid');

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState(globalSearch);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Customer Quantity Selectors
  const [itemQuantities, setItemQuantities] = useState({});

  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearchTerm(globalSearch);
    }
  }, [globalSearch]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedStatus, page]);

  useEffect(() => {
    if (openAddModalSignal) {
      setEditingProduct(null);
      setIsFormOpen(true);
      if (onModalHandled) onModalHandled();
    }
  }, [openAddModalSignal]);

  const fetchCategories = async () => {
    try {
      const res = await getCategoriesApi();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProductsApi({
        page,
        limit: 12,
        search: searchTerm,
        category_id: selectedCategory,
        is_active: selectedStatus,
      });

      const prods = res.data || [];
      setProducts(prods);
      setPagination(res.pagination || { page: 1, limit: 12, total: prods.length, totalPages: 1 });

      // Fetch stock quantity for each product to display stock badge
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
    } catch (err) {
      setError(err.message || 'Failed to fetch product catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = !product.is_active;
      await patchProductStatusApi(product.id, newStatus);
      showSuccess(`Product '${product.name}' ${newStatus ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (err) {
      showError(err.message || 'Failed to update status');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    setDeleteLoading(true);
    try {
      await deleteProductApi(deletingProductId);
      showSuccess('Product deleted successfully');
      setDeletingProductId(null);
      fetchProducts();
    } catch (err) {
      showError(err.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const qty = itemQuantities[product.id] || 1;
    const availableStock = inventoriesMap[product.id] ?? 0;

    if (availableStock <= 0) {
      showError(`'${product.name}' is currently out of stock`);
      return;
    }
    if (qty > availableStock) {
      showError(`Cannot add ${qty} units. Only ${availableStock} units available in stock`);
      return;
    }

    addToCart(product, qty);
    showSuccess(`Added ${qty} × '${product.name}' to cart`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1720px] mx-auto w-full">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#00c2ff]">
              Catalog Infrastructure
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-[11px] text-[#5ae9ac] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5ae9ac] animate-pulse shadow-[0_0_8px_rgba(90,233,172,0.8)]"></span>
              Real-Time Sync Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl text-[#dfe2ef] tracking-tight font-bold">
            Browse Products &amp; Inventory Catalog
          </h1>
          <p className="text-xs md:text-sm text-[#bcc8d1] max-w-2xl">
            Search, filter, and order industrial hardware, automation components, and electronics in real-time.
          </p>
        </div>

        {/* Metrics Bar & Actions */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="bg-[#181b25] px-4 py-2 rounded-xl flex flex-col items-start shadow-sm border border-[#262a34]">
            <span className="text-[10px] text-[#86929a] uppercase font-semibold tracking-wider">Total Active SKUs</span>
            <span className="font-mono text-lg font-bold text-[#dfe2ef]">{pagination.total}</span>
          </div>
          <div className="bg-[#181b25] px-4 py-2 rounded-xl flex flex-col items-start shadow-sm border border-[#262a34]">
            <span className="text-[10px] text-[#86929a] uppercase font-semibold tracking-wider">Categories</span>
            <span className="font-mono text-lg font-bold text-[#5ae9ac]">{categories.length}</span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <div className="bg-[#181b25] border border-[#262a34] p-1 rounded-xl flex items-center">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#00c2ff] text-[#00344e]' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-[#00c2ff] text-[#00344e]' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#00c2ff] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-[#00c2ff]/20 flex items-center justify-center space-x-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Console */}
      <div className="bg-[#181b25] p-4 rounded-2xl flex flex-col gap-4 shadow-sm border border-[#262a34]">
        {/* Category Pills */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('');
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                selectedCategory === ''
                  ? 'bg-[#00c2ff] text-[#00344e] font-bold shadow-[0_0_12px_rgba(0,194,255,0.3)]'
                  : 'bg-[#262a34] text-[#dfe2ef] hover:text-[#00c2ff] hover:bg-[#31353f] font-medium'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(c.id);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs transition-all shrink-0 ${
                  String(selectedCategory) === String(c.id)
                    ? 'bg-[#00c2ff] text-[#00344e] font-bold shadow-[0_0_12px_rgba(0,194,255,0.3)]'
                    : 'bg-[#262a34] text-[#dfe2ef] hover:text-[#00c2ff] hover:bg-[#31353f] font-medium'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[#bcc8d1] text-xs">
            <span>
              Showing <strong className="text-[#dfe2ef] font-mono font-bold">{products.length}</strong> of{' '}
              <strong className="text-[#dfe2ef] font-mono font-bold">{pagination.total}</strong> products
            </span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-[#262a34]/60">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#86929a] uppercase font-semibold tracking-wider">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="bg-[#0a0e17] text-[#dfe2ef] text-xs h-8 px-3 rounded-xl border border-[#262a34] focus:outline-none focus:border-[#00c2ff] cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#86929a] uppercase font-semibold tracking-wider">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-[#0a0e17] text-[#dfe2ef] text-xs h-8 px-3 rounded-xl border border-[#262a34] focus:outline-none focus:border-[#00c2ff] cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#86929a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Filter product catalog..."
              className="w-full h-8 pl-9 pr-3 bg-[#0a0e17] rounded-xl text-[#dfe2ef] text-xs placeholder:text-[#86929a] border border-[#262a34] focus:outline-none focus:border-[#00c2ff] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Catalog Content */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#bcc8d1] space-y-3 bg-[#181b25] border border-[#262a34] rounded-2xl">
          <div className="w-8 h-8 border-2 border-[#00c2ff]/30 border-t-[#00c2ff] rounded-full animate-spin mx-auto"></div>
          <p>Loading catalog data from server...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 border border-dashed border-[#262a34] bg-[#181b25]/50 rounded-2xl text-center space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-[#dfe2ef]">No products found</p>
          <p className="text-xs text-[#86929a]">Try adjusting your search query or category filters.</p>
        </div>
      ) : isAdmin && viewMode === 'table' ? (
        /* ADMIN TABLE VIEW */
        <div className="bg-[#181b25] border border-[#262a34] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#dfe2ef]">
              <thead className="bg-[#0a0e17] text-[10px] font-semibold text-[#86929a] uppercase tracking-wider border-b border-[#262a34]">
                <tr>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Stock Status</th>
                  <th className="px-4 py-3.5">Active Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262a34]/60">
                {products.map((product) => {
                  const stockQty = inventoriesMap[product.id] ?? 0;
                  return (
                    <tr key={product.id} className="hover:bg-[#1c1f29] transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-[#dfe2ef]">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0a0e17] border border-[#262a34] flex items-center justify-center text-[#00c2ff] shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#dfe2ef]">{product.name}</p>
                            <p className="text-[10px] text-[#86929a] truncate max-w-xs">
                              {product.description || 'No description provided.'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[#bcc8d1]">
                        <span className="px-2.5 py-1 bg-[#262a34] border border-[#31353f] rounded-full text-[10px] font-medium text-[#92d9ff]">
                          {product.category_name || `Category #${product.category_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#dfe2ef]">
                        <CurrencyPrice amount={product.price} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StockStatusBadge quantity={stockQty} />
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            product.is_active
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 bg-[#262a34] hover:bg-[#31353f] text-purple-300 rounded-lg transition-colors border border-[#31353f]"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingProductId(product.id)}
                          className="p-1.5 bg-[#262a34] hover:bg-rose-950/50 text-rose-400 rounded-lg transition-colors border border-[#31353f]"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PRODUCT CARDS GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const stockQty = inventoriesMap[product.id] ?? 0;
            const currentQty = itemQuantities[product.id] || 1;
            const isOutOfStock = stockQty <= 0 || !product.is_active;

            return (
              <div
                key={product.id}
                className="group bg-[#181b25] border border-[#262a34] rounded-2xl p-4 flex flex-col justify-between hover:bg-[#1c1f29] hover:border-[#00c2ff]/40 transition-all duration-200 shadow-md relative overflow-hidden space-y-4"
              >
                <div className="flex flex-col gap-3">
                  {/* Thumbnail Visual Container */}
                  <div className="relative h-40 rounded-xl bg-[#0a0e17] overflow-hidden flex items-center justify-center border border-[#262a34]/60">
                    <div className="w-14 h-14 rounded-2xl bg-[#1c1f29] border border-[#31353f] flex items-center justify-center text-[#00c2ff] shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <Package className="w-7 h-7" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-transparent to-transparent opacity-80 pointer-events-none"></div>

                    {/* Category Badge Top Left */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider bg-[#31353f]/90 text-[#92d9ff] backdrop-blur-md uppercase border border-[#3d484f]">
                        {product.category_name || `Category #${product.category_id}`}
                      </span>
                    </div>

                    {/* Stock Status Top Right */}
                    <div className="absolute top-2.5 right-2.5">
                      <StockStatusBadge quantity={stockQty} />
                    </div>
                  </div>

                  {/* Metadata Header */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-[#86929a] font-semibold tracking-wider">
                      SKU: PROD-00{product.id}
                    </span>
                    <span className="text-[11px] font-medium">
                      {product.is_active ? (
                        <span className="text-[#5ae9ac] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5ae9ac]"></span> Active
                        </span>
                      ) : (
                        <span className="text-rose-400">Inactive</span>
                      )}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-[#dfe2ef] group-hover:text-[#00c2ff] transition-colors leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#bcc8d1] mt-1 line-clamp-2 leading-relaxed">
                      {product.description || 'Quality industrial item available for order.'}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex flex-col gap-3 pt-3 border-t border-[#262a34]">
                  <div className="flex items-baseline justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#86929a] uppercase font-semibold">Unit Price</span>
                      <span className="text-lg font-bold text-[#dfe2ef]">
                        <CurrencyPrice amount={product.price} />
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          product.is_active
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    )}
                  </div>

                  {/* Controls Row */}
                  {isAdmin ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setIsFormOpen(true);
                        }}
                        className="flex-1 py-2 bg-[#262a34] hover:bg-[#31353f] text-purple-300 border border-[#31353f] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingProductId(product.id)}
                        className="px-3 py-2 bg-[#262a34] hover:bg-rose-950/50 text-rose-400 border border-[#31353f] hover:border-rose-800/50 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
                      {!isOutOfStock && (
                        <div className="flex items-center bg-[#0a0e17] rounded-xl border border-[#262a34] h-9 px-1">
                          <button
                            type="button"
                            onClick={() =>
                              setItemQuantities({
                                ...itemQuantities,
                                [product.id]: Math.max(1, currentQty - 1),
                              })
                            }
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#dfe2ef] rounded-lg hover:bg-[#262a34] transition-colors font-bold"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-mono text-xs font-bold text-[#dfe2ef]">{currentQty}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setItemQuantities({
                                ...itemQuantities,
                                [product.id]: Math.min(stockQty, currentQty + 1),
                              })
                            }
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#dfe2ef] rounded-lg hover:bg-[#262a34] transition-colors font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}

                      <button
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 h-9 rounded-xl bg-[#00c2ff] hover:bg-[#00a2e6] text-[#00344e] font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(0,194,255,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination & Catalog Summary Bar */}
      <div className="bg-[#181b25] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-[#262a34]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00c2ff] animate-pulse"></span>
          <span className="text-xs text-[#bcc8d1]">
            Central Automated Logistics Matrix:{' '}
            <span className="text-[#dfe2ef] font-semibold">{pagination.total} Products Available</span>
          </span>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#0a0e17] text-slate-400 hover:text-[#dfe2ef] hover:bg-[#262a34] transition-colors disabled:opacity-40 border border-[#262a34]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs text-[#bcc8d1] font-mono font-medium">
              Page <span className="text-[#00c2ff] font-bold">{page}</span> /{' '}
              <span className="text-[#dfe2ef] font-bold">{pagination.totalPages}</span>
            </span>

            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#0a0e17] text-slate-400 hover:text-[#dfe2ef] hover:bg-[#262a34] transition-colors disabled:opacity-40 border border-[#262a34]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productToEdit={editingProduct}
        onSuccess={fetchProducts}
      />

      <ConfirmationModal
        isOpen={!!deletingProductId}
        onClose={() => setDeletingProductId(null)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message="Are you sure you want to delete this product? If it has historical order records, deletion will be rejected by the server."
        confirmText="Delete Product"
        loading={deleteLoading}
      />
    </div>
  );
};

