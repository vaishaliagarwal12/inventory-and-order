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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Inventory Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time warehouse stock levels, adjust quantities, and set stock thresholds
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          {/* Search Product Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by product name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Stock Status Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedStockStatus}
              onChange={(e) => {
                setSelectedStockStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt; 10)</option>
              <option value="low_stock">Low Stock (1 - 10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Total Count */}
        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-slate-100 font-bold">{inventoryList.length}</span> of{' '}
          <span className="text-slate-100 font-bold">{pagination.total}</span> inventory records
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
          <p>Loading inventory data...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : inventoryList.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
          <Boxes className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No inventory records found</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Product ID</th>
                  <th className="px-4 py-3.5">Product Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Catalog Price</th>
                  <th className="px-4 py-3.5">Current Stock</th>
                  <th className="px-4 py-3.5">Stock Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inventoryList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-400">#{item.product_id}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-100">{item.product_name}</td>
                    <td className="px-4 py-3.5 text-slate-400">
                      <span className="px-2.5 py-1 bg-slate-800 border border-slate-700/60 rounded-full text-[10px] font-medium text-slate-300">
                        {item.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-200">
                      <CurrencyPrice amount={item.product_price} />
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-100 text-sm">
                      {item.quantity} units
                    </td>
                    <td className="px-4 py-3.5">
                      <StockStatusBadge status={item.stock_status} quantity={item.quantity} />
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setAdjustModalItem(item);
                          setAdjustChange('');
                          setAdjustError('');
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                        title="Relative Adjustment (+/-)"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Adjust Stock</span>
                      </button>
                      <button
                        onClick={() => {
                          setSetModalItem(item);
                          setAbsoluteQty(String(item.quantity));
                          setSetErrorMsg('');
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                        title="Set Absolute Quantity"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
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
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Page <span className="text-slate-100 font-bold">{page}</span> of{' '}
            <span className="text-slate-100 font-bold">{pagination.totalPages}</span>
          </span>

          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Adjust Stock Relative Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setAdjustModalItem(null)}
              disabled={adjustLoading}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Adjust Stock Quantity</h3>
                <p className="text-xs text-slate-400">{adjustModalItem.product_name}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-400">Current Stock Quantity:</span>
              <span className="text-sm font-bold text-slate-100">{adjustModalItem.quantity} units</span>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Stock Adjustment Change (+/-) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustChange}
                  onChange={(e) => setAdjustChange(e.target.value)}
                  placeholder="e.g. 15 or -5"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter positive number to restock (e.g. 20) or negative number to reduce stock (e.g. -5).
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  disabled={adjustLoading}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center space-x-2"
                >
                  {adjustLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  <span>Apply Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Absolute Stock Modal */}
      {setModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setSetModalItem(null)}
              disabled={setLoadingState}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Set Absolute Quantity</h3>
                <p className="text-xs text-slate-400">{setModalItem.product_name}</p>
              </div>
            </div>

            {setErrorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                {setErrorMsg}
              </div>
            )}

            <form onSubmit={handleAbsoluteSetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Total Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={absoluteQty}
                  onChange={(e) => setAbsoluteQty(e.target.value)}
                  placeholder="50"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSetModalItem(null)}
                  disabled={setLoadingState}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setLoadingState}
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50 flex items-center space-x-2"
                >
                  {setLoadingState && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
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
