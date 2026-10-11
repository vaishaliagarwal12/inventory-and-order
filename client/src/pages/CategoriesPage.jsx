import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Package,
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
  ChevronRight
} from 'lucide-react';
import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';

const getCategoryIcon = (catName) => {
  const lower = (catName || '').toLowerCase();
  if (lower.includes('elec') || lower.includes('gadget') || lower.includes('tech') || lower.includes('hardware')) return Laptop;
  if (lower.includes('footwear') || lower.includes('shoe') || lower.includes('sneaker')) return Footprints;
  if (lower.includes('cloth') || lower.includes('fashion') || lower.includes('apparel') || lower.includes('wear')) return Shirt;
  if (lower.includes('book') || lower.includes('stationery') || lower.includes('read') || lower.includes('literature')) return BookOpen;
  if (lower.includes('kitchen') || lower.includes('home & kitchen') || lower.includes('cook')) return UtensilsCrossed;
  if (lower.includes('furnit') || lower.includes('office') || lower.includes('desk') || lower.includes('chair')) return Armchair;
  if (lower.includes('sport') || lower.includes('fit') || lower.includes('gym') || lower.includes('workout')) return Dumbbell;
  if (lower.includes('beaut') || lower.includes('care') || lower.includes('skin') || lower.includes('cosmet')) return Sparkles;
  if (lower.includes('bag') || lower.includes('travel') || lower.includes('luggage') || lower.includes('pack')) return Briefcase;
  return Package;
};

export const CategoriesPage = ({ openAddModalSignal, onModalHandled, onSelectCategory }) => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (openAddModalSignal) {
      handleOpenCreate();
      if (onModalHandled) onModalHandled();
    }
  }, [openAddModalSignal]);

  // Modal Escape key handler
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !formLoading) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, formLoading]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCategoriesApi();
      const rawCats = Array.isArray(res) ? res : (res.data || []);
      const validCats = rawCats.filter((c) => Number(c.product_count) > 0);
      setCategories(validCats);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setName(category.name || '');
    setDescription(category.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Category name is required');
      return;
    }

    setFormLoading(true);
    const payload = { name: name.trim(), description: description.trim() };

    try {
      if (editingCategory) {
        await updateCategoryApi(editingCategory.id, payload);
        showSuccess(`Category '${name}' updated successfully!`);
      } else {
        await createCategoryApi(payload);
        showSuccess(`Category '${name}' created successfully!`);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
      showError(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteCategoryApi(deletingId);
      showSuccess('Category deleted successfully');
      setDeletingId(null);
      fetchCategories();
    } catch (err) {
      showError(err.message || 'Failed to delete category');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy tracking-tight">Browse Categories</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover curated collections with real-time stock levels.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-navy hover:bg-navy-dark text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        )}
      </div>

      {/* Category Display Grid */}
      {loading ? (
        <div className="p-16 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400 space-y-3 shadow-xs">
          <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin mx-auto"></div>
          <p>Loading product categories...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200 bg-white rounded-2xl text-center space-y-4 shadow-xs">
          <FolderTree className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-navy">No categories found</p>
            <p className="text-xs text-slate-500">Categories will appear here once configured.</p>
          </div>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-navy hover:bg-navy-dark text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Create Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.name);
            const count = category.product_count !== undefined ? Number(category.product_count) : 0;
            const hasProducts = count > 0;

            return (
              <div
                key={category.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between hover:border-teal/60 hover:shadow-sm transition-all duration-200 shadow-xs group"
              >
                <div
                  onClick={() => onSelectCategory && onSelectCategory(category.id)}
                  className="space-y-2.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-teal flex items-center justify-center group-hover:scale-105 group-hover:bg-teal/10 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                      hasProducts
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {count} {count === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-navy group-hover:text-teal transition-colors flex items-center justify-between">
                      <span>{category.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal transition-colors" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {category.description || 'Explore products in this collection.'}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-end space-x-2 pt-3 mt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEdit(category)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-teal rounded-lg transition-colors cursor-pointer border border-slate-200"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(category.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer border border-rose-200"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Category Create/Edit Modal (Admin Only) */}
      {isModalOpen && (
        <div
          onClick={() => { if (!formLoading) setIsModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 relative"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-sky-light text-navy border border-sky/60 rounded-xl">
                <FolderTree className="w-5 h-5 text-teal" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingCategory ? 'Modify category details' : 'Add a new product category'}
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Beverages, Electronics, Clothing"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy placeholder:text-slate-400 focus:outline-none focus:border-teal focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of products in this category..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy placeholder:text-slate-400 focus:outline-none focus:border-teal focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-navy hover:bg-navy-dark transition-all shadow-xs disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                >
                  {formLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? If products are currently assigned to this category, deletion will be rejected by the server."
        confirmText="Delete Category"
        loading={deleteLoading}
      />
    </div>
  );
};
