import React, { useState, useEffect } from 'react';
import { X, Package, Check } from 'lucide-react';
import { createProductApi, updateProductApi, getCategoriesApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export const ProductFormModal = ({ isOpen, onClose, productToEdit, onSuccess }) => {
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (productToEdit) {
        setName(productToEdit.name || '');
        setDescription(productToEdit.description || '');
        setPrice(productToEdit.price !== undefined ? String(productToEdit.price) : '');
        setCategoryId(productToEdit.category_id !== undefined ? String(productToEdit.category_id) : '');
        setIsActive(productToEdit.is_active !== undefined ? productToEdit.is_active : true);
      } else {
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId('');
        setIsActive(true);
      }
      setErrorMsg('');
    }
  }, [isOpen, productToEdit]);

  const fetchCategories = async () => {
    try {
      const res = await getCategoriesApi();
      setCategories(res.data || []);
      if (!productToEdit && res.data?.length > 0) {
        setCategoryId(String(res.data[0].id));
      }
    } catch (err) {
      console.error('Failed to load categories for product form', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Product name is required');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      setErrorMsg('Price must be a valid non-negative number');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Please select a category');
      return;
    }

    setLoading(true);
    const payload = {
      category_id: parseInt(categoryId, 10),
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      is_active: isActive,
    };

    try {
      if (productToEdit) {
        await updateProductApi(productToEdit.id, payload);
        showSuccess(`Product '${name}' updated successfully!`);
      } else {
        await createProductApi(payload);
        showSuccess(`Product '${name}' created successfully!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product');
      showError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {productToEdit ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs text-slate-400">
              {productToEdit ? 'Update product information and pricing' : 'Create a new product in the catalog'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ergonomic Wireless Mouse"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500/50"
              >
                <option value="" disabled>Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Price ($ USD Base) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product features, specifications, and details..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                isActive ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-950 border-slate-700 text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <span className="text-xs text-slate-300 font-medium">Active (Visible in catalog)</span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
