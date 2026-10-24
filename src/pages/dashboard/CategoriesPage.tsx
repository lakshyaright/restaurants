import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  UtensilsCrossed
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Category, MenuItem } from '../../types';

export const CategoriesPage: React.FC = () => {
  const { currentRestaurant } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal / Form state for Add or Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategoriesAndItems = async () => {
    if (!currentRestaurant || !supabase) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setActionError(null);

    try {
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('sort_order', { ascending: true });

      if (catErr) {
        setActionError(catErr.message);
      } else {
        setCategories((catData as Category[]) || []);
      }

      const { data: itemData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id);

      if (itemData) {
        setMenuItems((itemData as MenuItem[]) || []);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error fetching categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndItems();
  }, [currentRestaurant]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsActive(cat.is_active);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !supabase) return;

    if (!name.trim()) {
      setActionError('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (editingCategory) {
        // Update
        const { error: updateErr } = await supabase
          .from('categories')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (updateErr) {
          setActionError(updateErr.message);
        } else {
          setActionSuccess(`Category "${name}" updated successfully.`);
          setIsModalOpen(false);
          await fetchCategoriesAndItems();
        }
      } else {
        // Create new category
        const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 1;
        const { error: insertErr } = await supabase
          .from('categories')
          .insert({
            restaurant_id: currentRestaurant.id,
            name: name.trim(),
            description: description.trim() || null,
            sort_order: nextOrder,
            is_active: isActive,
          });

        if (insertErr) {
          setActionError(insertErr.message);
        } else {
          setActionSuccess(`Category "${name}" created successfully.`);
          setIsModalOpen(false);
          await fetchCategoriesAndItems();
        }
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !cat.is_active, updated_at: new Date().toISOString() })
        .eq('id', cat.id);

      if (!error) {
        setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
      }
    } catch (err) {
      console.error('Error toggling category status:', err);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (!supabase) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentCat = categories[index];
    const targetCat = categories[targetIndex];

    const newCurrentOrder = targetCat.sort_order;
    const newTargetOrder = currentCat.sort_order;

    try {
      // Optimistic state update
      const updated = [...categories];
      updated[index] = { ...currentCat, sort_order: newCurrentOrder };
      updated[targetIndex] = { ...targetCat, sort_order: newTargetOrder };
      updated.sort((a, b) => a.sort_order - b.sort_order);
      setCategories(updated);

      // Persist in DB
      await supabase.from('categories').update({ sort_order: newCurrentOrder }).eq('id', currentCat.id);
      await supabase.from('categories').update({ sort_order: newTargetOrder }).eq('id', targetCat.id);
    } catch (err) {
      console.error('Reorder error:', err);
      await fetchCategoriesAndItems();
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget || !supabase) return;
    setIsDeleting(true);
    setActionError(null);

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) {
        setActionError(error.message);
      } else {
        setActionSuccess(`Category "${deleteTarget.name}" deleted.`);
        setDeleteTarget(null);
        await fetchCategoriesAndItems();
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentRestaurant) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Menu Categories</h1>
          <p className="text-xs text-stone-500 mt-0.5">Organize food sections, reorder courses, and toggle public visibility</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-stone-500">
            <Loader2 className="w-6 h-6 text-emerald-700 animate-spin mx-auto mb-2" />
            <p>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-500 space-y-3">
            <Layers className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="font-semibold text-stone-800 text-sm">No categories created yet</p>
            <p className="max-w-xs mx-auto text-stone-500">
              Create categories like &quot;Starters&quot;, &quot;Wood-Fired Pizzas&quot;, or &quot;Desserts&quot; to organize your menu items.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Category</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-100 border-b border-stone-200 font-semibold text-stone-900">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Order</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Dishes</th>
                  <th className="py-3 px-4 text-center">Public Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {categories.map((cat, idx) => {
                  const itemsCount = menuItems.filter(i => i.category_id === cat.id).length;
                  return (
                    <tr key={cat.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Sort arrows */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => handleMoveOrder(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded text-stone-400 hover:text-stone-800 disabled:opacity-20 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(idx, 'down')}
                            disabled={idx === categories.length - 1}
                            className="p-1 rounded text-stone-400 hover:text-stone-800 disabled:opacity-20 cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {cat.name}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-stone-500 max-w-xs truncate">
                        {cat.description || <span className="italic text-stone-300">No description</span>}
                      </td>

                      {/* Dishes count */}
                      <td className="py-3 px-4 text-center font-mono-nums font-semibold text-stone-800">
                        {itemsCount}
                      </td>

                      {/* Active Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                            cat.is_active
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? 'bg-emerald-600' : 'bg-stone-400'}`} />
                          <span>{cat.is_active ? 'Visible' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900">
                {editingCategory ? 'Edit Menu Category' : 'Create New Menu Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-900 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Starters & Small Plates"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-900 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Crispy tapas and chef special appetisers"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="catActive" className="text-xs font-medium text-stone-800">
                  Visible to diners on public menu
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-stone-200 p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-bold text-base text-stone-900">Delete Category?</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? Any dishes assigned to this category will also be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
