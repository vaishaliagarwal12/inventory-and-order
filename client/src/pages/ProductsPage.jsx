import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Filter
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
import { ProductCard } from '../components/ProductCard';

export const ProductsPage = ({
  globalSearch = '',
  initialCategory = '',
  openAddModalSignal,
  onModalHandled,
  onSelectProduct
}) => {
  const { isAdmin } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoriesMap, setInventoriesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View mode for Admin (grid vs table)
  const [viewMode, setViewMode] = useState('grid');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState(globalSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price_asc', 'price_desc', 'name_asc'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 16, total: 0, totalPages: 1 });

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearchTerm(globalSearch);
    }
  }, [globalSearch]);

  useEffect(() => {
    if (initialCategory !== undefined) {
      setSelectedCategory(initialCategory || '');
      setPage(1);
    }
  }, [initialCategory]);

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
      const rawCats = Array.isArray(res) ? res : (res.data || []);
      // Keep legitimate categories that have real products available in the store
      const validCats = rawCats.filter((c) => Number(c.product_count) > 0);
      setCategories(validCats);
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
        limit: 16,
        search: searchTerm,
        category_id: selectedCategory,
        is_active: selectedStatus || (isAdmin ? undefined : 'true'),
      });

      const prods = res.data || [];
      setProducts(prods);
      setPagination(res.pagination || { page: 1, limit: 16, total: prods.length, totalPages: 1 });

      // Fetch stock quantity for each product
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

  // Client-side sorting and stock-level filtering of the fetched products
  const displayedProducts = useMemo(() => {
    let result = [...products];

    if (inStockOnly) {
      result = result.filter((p) => (inventoriesMap[p.id] ?? 0) > 0);
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, sortBy, inStockOnly, inventoriesMap]);

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

  const selectedCategoryObj = categories.find((c) => String(c.id) === String(selectedCategory));

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full pb-10">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold mb-0.5">
            <span>Home</span>
            <span>/</span>
            <span className="text-emerald-700">All Products</span>
            {selectedCategoryObj && (
              <>
                <span>/</span>
                <span className="text-navy font-bold">{selectedCategoryObj.name}</span>
              </>
            )}
          </div>
          <h1 className="text-xl font-black text-navy tracking-tight">
            {selectedCategoryObj ? selectedCategoryObj.name : 'Store Catalog'}
          </h1>
          <p className="text-xs text-slate-500">
            Showing {displayedProducts.length} of {pagination.total} genuine catalog products
          </p>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <div className="bg-white border border-slate-200 p-0.5 rounded-xl flex items-center shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-navy text-white' : 'text-slate-500 hover:text-navy'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-navy text-white' : 'text-slate-500 hover:text-navy'
                }`}
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
              className="px-3.5 py-2 bg-navy hover:bg-navy-dark text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. MAIN LAYOUT: COMPACT SIDEBAR FILTERS + PRODUCT GRID */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Filter Sidebar (Desktop) */}
        <aside className="hidden lg:flex flex-col gap-4 w-60 shrink-0 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-black text-navy uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filters</span>
            </span>
            {(selectedCategory || searchTerm || inStockOnly) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchTerm('');
                  setInStockOnly(false);
                  setPage(1);
                }}
                className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Categories Filter List */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Categories
            </span>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  setPage(1);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  selectedCategory === ''
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] text-slate-400">{pagination.total}</span>
              </button>

              {categories.map((c) => {
                const count = c.product_count !== undefined ? Number(c.product_count) : 6;
                const isSelected = String(selectedCategory) === String(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected ? 'bg-emerald-100 text-emerald-800' : 'text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Availability
            </span>
            <label className="flex items-center gap-2 text-xs font-semibold text-navy cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Top Filter & Sort Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search catalog..."
                className="w-full h-8 pl-8 pr-3 bg-slate-50 rounded-xl text-navy text-xs placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              />
            </div>

            {/* Mobile Filter Toggle & Sort Dropdowns */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Mobile Filter Drawer Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-navy cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                <span>Filters {selectedCategory ? '(1)' : ''}</span>
              </button>

              {/* Price Sort Dropdown */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 text-navy text-xs h-8 px-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 cursor-pointer font-bold"
                >
                  <option value="featured">Featured Picks</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Category Pill Strip */}
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => {
                setSelectedCategory('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === ''
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  String(selectedCategory) === String(c.id)
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Products Loading / Error / Empty / Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-200 bg-white rounded-2xl text-center space-y-3 shadow-xs max-w-md mx-auto my-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-emerald-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy">
                  No products found
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search query or category filters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  setSearchTerm('');
                  setInStockOnly(false);
                  setPage(1);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : isAdmin && viewMode === 'table' ? (
            /* ADMIN TABLE VIEW */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock Status</th>
                      <th className="px-4 py-3">Visibility</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedProducts.map((product) => {
                      const stockQty = inventoriesMap[product.id] ?? 0;
                      return (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-navy">
                            <p className="font-bold text-navy text-xs">{product.name}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700">
                              {product.category_name || `Category #${product.category_id}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-navy">
                            <CurrencyPrice amount={product.price} />
                          </td>
                          <td className="px-4 py-3">
                            <StockStatusBadge quantity={stockQty} />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleStatus(product)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                product.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {product.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setIsFormOpen(true);
                              }}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-teal rounded transition-colors border border-slate-200 cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingProductId(product.id)}
                              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-colors border border-rose-200 cursor-pointer"
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
            /* PRODUCT CARD GRID (Responsive 4-cols on xl, 3-cols on lg/md, 2-cols on mobile) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  stockQty={inventoriesMap[product.id] ?? 20}
                  onEdit={(p) => {
                    setEditingProduct(p);
                    setIsFormOpen(true);
                  }}
                  onDelete={(id) => setDeletingProductId(id)}
                  isAdmin={isAdmin}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="bg-white p-3 rounded-2xl flex items-center justify-between gap-4 shadow-2xs border border-slate-200/90 mt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-navy hover:bg-slate-200 transition-colors text-xs font-bold disabled:opacity-40 border border-slate-200 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-slate-500 font-semibold">
                Page <strong className="text-navy font-black">{page}</strong> of{' '}
                <strong className="text-navy font-black">{pagination.totalPages}</strong>
              </span>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-navy hover:bg-slate-200 transition-colors text-xs font-bold disabled:opacity-40 border border-slate-200 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Modals */}
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
        message="Are you sure you want to delete this product? Historical order records will be preserved."
        confirmText="Delete Product"
        loading={deleteLoading}
      />
    </div>
  );
};
