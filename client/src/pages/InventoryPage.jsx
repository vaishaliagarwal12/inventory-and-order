import React, { useState, useEffect } from 'react';
import { Boxes, Search, Filter, SlidersHorizontal, Edit3, X, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { getInventoryApi, adjustInventoryQuantityApi, updateInventoryQuantityApi } from '../services/api';
import { StockStatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { CurrencyPrice } from '../components/CurrencyPrice';

export const InventoryPage = () => {
  const { showSuccess, showError } = useToast();

  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Stock Adjust Modal State
  const [adjustModalItem, setAdjustModalItem] = useState(null); // item to adjust relative change
  const [adjustChange, setAdjustChange] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // Absolute Set Modal State
  const [setModalItem, setSetModalItem] = useState(null); // item to set absolute quantity
  const [absoluteQty, setAbsoluteQty] = useState('');
  const [setLoadingState, setSetLoadingState] = useState(false);
  const [setErrorMsg, setSetErrorMsg] = useState('');

  useEffect(() => {
    fetchInventory();
  }, [searchTerm, selectedStockStatus, page]);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInventoryApi({
        page,
        limit: 10,
        search: searchTerm,
        stock_status: selectedStockStatus,
      });

      setInventoryList(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory records');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustError('');

    const changeVal = parseInt(adjustChange, 10);
    if (isNaN(changeVal) || changeVal === 0) {
      setAdjustError('Adjustment change must be a non-zero integer (e.g. +10 or -5)');
      return;
    }

    setAdjustLoading(true);
    try {
      const res = await adjustInventoryQuantityApi(adjustModalItem.product_id, changeVal);
      showSuccess(`Stock for '${adjustModalItem.product_name}' adjusted to ${res.data?.quantity}`);
      setAdjustModalItem(null);
      setAdjustChange('');
      fetchInventory();
    } catch (err) {
      setAdjustError(err.message || 'Failed to adjust stock');
      showError(err.message || 'Failed to adjust stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleAbsoluteSetSubmit = async (e) => {
    e.preventDefault();
    setSetErrorMsg('');

    const qtyVal = parseInt(absoluteQty, 10);
    if (isNaN(qtyVal) || qtyVal < 0) {
      setSetErrorMsg('Quantity must be an integer greater than or equal to 0');
      return;
    }

    setSetLoadingState(true);
    try {
      const res = await updateInventoryQuantityApi(setModalItem.product_id, qtyVal);
      showSuccess(`Stock for '${setModalItem.product_name}' set to ${res.data?.quantity}`);
      setSetModalItem(null);
      setAbsoluteQty('');
      fetchInventory();
    } catch (err) {
      setSetErrorMsg(err.message || 'Failed to update stock quantity');
      showError(err.message || 'Failed to update stock quantity');
    } finally {
      setSetLoadingState(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-navy" />
            <span>Inventory Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor real-time warehouse stock levels, adjust quantities, and update stock status.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-navy border border-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center space-x-2 shrink-0 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-teal" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          {/* Search Product Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search product name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Stock Status Filter */}
          <div className="w-full sm:w-52">
            <select
              value={selectedStockStatus}
              onChange={(e) => {
                setSelectedStockStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy font-semibold focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white cursor-pointer transition-all"
            >
              <option value="">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt; 10)</option>
              <option value="low_stock">Low Stock (1 - 10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Total Count */}
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="text-navy font-bold">{inventoryList.length}</span> of{' '}
          <span className="text-navy font-bold">{pagination.total}</span> inventory records
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center text-sm text-slate-500 space-y-3 shadow-xs">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-navy rounded-full animate-spin mx-auto"></div>
          <p>Loading inventory records...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      ) : inventoryList.length === 0 ? (
        <div className="p-12 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3 shadow-xs">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-800">No inventory records found</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 font-bold">Product ID</th>
                  <th className="px-4 py-4 font-bold">Product Name</th>
                  <th className="px-4 py-4 font-bold">Category</th>
                  <th className="px-4 py-4 font-bold">Catalog Price</th>
                  <th className="px-4 py-4 font-bold">Current Stock</th>
                  <th className="px-4 py-4 font-bold">Stock Status</th>
                  <th className="px-4 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-4 font-bold text-navy">#{item.product_id}</td>
                    <td className="px-4 py-4 font-bold text-navy">{item.product_name}</td>
                    <td className="px-4 py-4 text-slate-600">
                      <span className="px-3 py-1 bg-sky-light/60 border border-sky/50 rounded-full text-xs font-semibold text-navy">
                        {item.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-navy">
                      <CurrencyPrice amount={item.product_price} />
                    </td>
                    <td className="px-4 py-4 font-black text-navy text-sm">
                      {item.quantity} units
                    </td>
                    <td className="px-4 py-4">
                      <StockStatusBadge status={item.stock_status} quantity={item.quantity} />
                    </td>
                    <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setAdjustModalItem(item);
                          setAdjustChange('');
                          setAdjustError('');
                        }}
                        className="px-3 py-1.5 bg-sky-light hover:bg-sky/40 text-navy border border-sky rounded-xl text-xs font-bold transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                        title="Relative Adjustment (+/-)"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-teal" />
                        <span>Adjust Stock</span>
                      </button>
                      <button
                        onClick={() => {
                          setSetModalItem(item);
                          setAbsoluteQty(String(item.quantity));
                          setSetErrorMsg('');
                        }}
                        className="px-3 py-1.5 bg-beige hover:bg-amber-100/70 text-navy border border-amber-200/70 rounded-xl text-xs font-bold transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                        title="Set Absolute Quantity"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-teal" />
                        <span>Set Stock</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-500 font-medium">
            Page <span className="text-navy font-bold">{page}</span> of{' '}
            <span className="text-navy font-bold">{pagination.totalPages}</span>
          </span>

          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Adjust Stock Relative Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setAdjustModalItem(null)}
              disabled={adjustLoading}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-sky-light text-navy rounded-2xl border border-sky/40">
                <SlidersHorizontal className="w-6 h-6 text-teal" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">Adjust Stock Quantity</h3>
                <p className="text-xs text-slate-500">{adjustModalItem.product_name}</p>
              </div>
            </div>

            <div className="p-4 bg-beige/60 border border-slate-200 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Current Stock Quantity:</span>
              <span className="text-base font-extrabold text-navy">{adjustModalItem.quantity} units</span>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Stock Adjustment Change (+/-) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustChange}
                  onChange={(e) => setAdjustChange(e.target.value)}
                  placeholder="e.g. 15 or -5"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter positive number to restock (e.g. 20) or negative number to reduce stock (e.g. -5).
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  disabled={adjustLoading}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-navy hover:bg-navy-dark transition-all shadow-md shadow-navy/20 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                >
                  {adjustLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  <span>Apply Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Absolute Stock Modal */}
      {setModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setSetModalItem(null)}
              disabled={setLoadingState}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-beige text-navy rounded-2xl border border-amber-200/60">
                <Edit3 className="w-6 h-6 text-teal" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">Set Absolute Quantity</h3>
                <p className="text-xs text-slate-500">{setModalItem.product_name}</p>
              </div>
            </div>

            {setErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {setErrorMsg}
              </div>
            )}

            <form onSubmit={handleAbsoluteSetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  New Total Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={absoluteQty}
                  onChange={(e) => setAbsoluteQty(e.target.value)}
                  placeholder="50"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSetModalItem(null)}
                  disabled={setLoadingState}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setLoadingState}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-navy hover:bg-navy-dark transition-all shadow-md shadow-navy/20 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                >
                  {setLoadingState && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  <span>Set Stock Quantity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
