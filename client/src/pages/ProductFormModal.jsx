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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  return (
    <div
      onClick={() => { if (!loading) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3.5 pr-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {productToEdit ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {productToEdit ? 'Update product information and pricing' : 'Create a new product in the store catalog'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Green Tea"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Price ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description, features, and details..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 border-slate-300 text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <span className="text-xs text-slate-700 font-bold">Active (Visible to customers)</span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

