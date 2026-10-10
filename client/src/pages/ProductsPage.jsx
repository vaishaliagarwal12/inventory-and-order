import React, { useState, useEffect } from 'react';
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
  List
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
import { filterLegitCategories } from '../utils/categoryFilter';
import { filterLegitProducts } from '../utils/productFilter';

export const ProductsPage = ({ globalSearch = '', initialCategory = '', openAddModalSignal, onModalHandled }) => {
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
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Modal States
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
      setCategories(filterLegitCategories(res.data || []));
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

      const rawProds = res.data || [];
      const prods = filterLegitProducts(rawProds);
      setProducts(prods);
      setPagination(res.pagination || { page: 1, limit: 12, total: prods.length, totalPages: 1 });

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

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full">
      {/* Compact Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-navy tracking-tight">Shop Products</h1>
          <p className="text-xs text-slate-500">
            {pagination.total} items available in store catalog
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <div className="bg-white border border-slate-200 p-0.5 rounded-lg flex items-center shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-navy text-white' : 'text-slate-500 hover:text-slate-800'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-navy text-white' : 'text-slate-500 hover:text-slate-800'}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="px-3 py-1.5 bg-navy hover:bg-navy-dark text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Horizontal Navigation Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            selectedCategory === ''
              ? 'bg-navy text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              String(selectedCategory) === String(c.id)
                ? 'bg-navy text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Compact Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200 shadow-xs">
        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search catalog..."
            className="w-full h-8 pl-8 pr-3 bg-slate-50 rounded-lg text-navy text-xs placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-teal focus:bg-white transition-all"
          />
        </div>

        {/* Status Dropdown Filter */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 text-navy text-xs h-8 px-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal cursor-pointer font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Main Catalog Product Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
          Loading catalog...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-200 bg-white rounded-xl text-center space-y-3 shadow-xs max-w-md mx-auto my-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-teal">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy">
              {selectedCategory !== ''
                ? 'No products available in this category yet.'
                : 'No products match your filter parameters'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedCategory !== ''
                ? 'We haven\'t added inventory to this category section yet. Check back soon or browse our full store.'
                : 'Try adjusting your search terms or category filter parameters.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('');
              setSearchTerm('');
              setSelectedStatus('');
              setPage(1);
            }}
            className="px-4 py-2 bg-navy hover:bg-navy-dark text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
          >
            <span>View All Products</span>
          </button>
        </div>
      ) : isAdmin && viewMode === 'table' ? (
        /* ADMIN TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
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
                {products.map((product) => {
                  const stockQty = inventoriesMap[product.id] ?? 0;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-navy">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-teal shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-navy text-xs">{product.name}</p>
                          </div>
                        </div>
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
        /* PRODUCT CARDS GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              stockQty={inventoriesMap[product.id] ?? 0}
              onAddToCart={(p, qty) => {
                const availableStock = inventoriesMap[p.id] ?? 0;
                if (availableStock <= 0) {
                  showError(`'${p.name}' is currently out of stock`);
                  return;
                }
                if (qty > availableStock) {
                  showError(`Cannot add ${qty} units. Only ${availableStock} units available in stock`);
                  return;
                }
                addToCart(p, qty);
                showSuccess(`Added ${qty} × '${p.name}' to cart`);
              }}
              onEdit={(p) => {
                setEditingProduct(p);
                setIsFormOpen(true);
              }}
              onDelete={(id) => setDeletingProductId(id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="bg-white p-3 rounded-xl flex items-center justify-between gap-4 shadow-xs border border-slate-200">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-navy hover:bg-slate-200 transition-colors text-xs font-bold disabled:opacity-40 border border-slate-200 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-500 font-semibold">
            Page <strong className="text-navy font-extrabold">{page}</strong> of{' '}
            <strong className="text-navy font-extrabold">{pagination.totalPages}</strong>
          </span>

          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-navy hover:bg-slate-200 transition-colors text-xs font-bold disabled:opacity-40 border border-slate-200 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
