import React, { useState, useEffect, useMemo } from 'react';
import { 
  UtensilsCrossed, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Upload, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Star,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, formatCurrency, uploadRestaurantAsset } from '../../lib/supabase';
import { DietaryBadge } from '../../components/common/DietaryBadge';
import type { Category, MenuItem, DietaryType } from '../../types';

export const MenuItemsPage: React.FC = () => {
  const { currentRestaurant } = useAuth();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'sold_out'>('all');

  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [dietaryType, setDietaryType] = useState<DietaryType>('veg');
  const [allergensInput, setAllergensInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItemsAndCategories = async () => {
    if (!currentRestaurant || !supabase) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      // 1. Fetch categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('sort_order', { ascending: true });

      if (catData) setCategories(catData as Category[]);

      // 2. Fetch items
      const { data: itemData, error: itemErr } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('sort_order', { ascending: true });

      if (!itemErr && itemData) {
        setItems(itemData as MenuItem[]);
      }
    } catch (err) {
      console.error('Error querying menu items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItemsAndCategories();
  }, [currentRestaurant]);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setPrice('');
    setDiscountedPrice('');
    setDietaryType('veg');
    setAllergensInput('');
    setImageUrl('');
    setIsAvailable(true);
    setIsFeatured(false);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategoryId(item.category_id);
    setDescription(item.description || '');
    setPrice(item.price.toString());
    setDiscountedPrice(item.discounted_price ? item.discounted_price.toString() : '');
    setDietaryType(item.dietary_type);
    setAllergensInput(item.allergens?.join(', ') || '');
    setImageUrl(item.image_url || '');
    setIsAvailable(item.is_available);
    setIsFeatured(item.is_featured);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentRestaurant) return;

    setIsUploadingImage(true);
    setFeedback(null);

    const { url, error } = await uploadRestaurantAsset(file, currentRestaurant.id, 'items');
    setIsUploadingImage(false);

    if (error) {
      setFeedback({ type: 'error', message: `Image upload failed: ${error}` });
    } else if (url) {
      setImageUrl(url);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !supabase) return;

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFeedback({ type: 'error', message: 'Price must be a valid non-negative number.' });
      return;
    }

    let numDiscount: number | null = null;
    if (discountedPrice.trim()) {
      numDiscount = parseFloat(discountedPrice);
      if (isNaN(numDiscount) || numDiscount < 0 || numDiscount >= numPrice) {
        setFeedback({ type: 'error', message: 'Discounted price must be greater than 0 and less than regular price.' });
        return;
      }
    }

    if (!categoryId) {
      setFeedback({ type: 'error', message: 'Please select a menu category.' });
      return;
    }

    const allergensList = allergensInput
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (editingItem) {
        // Update item
        const { error: updateErr } = await supabase
          .from('menu_items')
          .update({
            category_id: categoryId,
            name: name.trim(),
            description: description.trim() || null,
            price: numPrice,
            discounted_price: numDiscount,
            dietary_type: dietaryType,
            allergens: allergensList,
            image_url: imageUrl || null,
            is_available: isAvailable,
            is_featured: isFeatured,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (updateErr) {
          setFeedback({ type: 'error', message: updateErr.message });
        } else {
          setIsModalOpen(false);
          await fetchItemsAndCategories();
        }
      } else {
        // Insert new item
        const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 1;
        const { error: insertErr } = await supabase
          .from('menu_items')
          .insert({
            restaurant_id: currentRestaurant.id,
            category_id: categoryId,
            name: name.trim(),
            description: description.trim() || null,
            price: numPrice,
            discounted_price: numDiscount,
            dietary_type: dietaryType,
            allergens: allergensList,
            image_url: imageUrl || null,
            is_available: isAvailable,
            is_featured: isFeatured,
            sort_order: nextOrder,
          });

        if (insertErr) {
          setFeedback({ type: 'error', message: insertErr.message });
        } else {
          setIsModalOpen(false);
          await fetchItemsAndCategories();
        }
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    if (!supabase) return;
    try {
      const nextState = !item.is_available;
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: nextState } : i));

      await supabase
        .from('menu_items')
        .update({ is_available: nextState, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    } catch (err) {
      console.error('Error toggling dish availability:', err);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget || !supabase) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', deleteTarget.id);

      if (!error) {
        setDeleteTarget(null);
        await fetchItemsAndCategories();
      }
    } catch (err) {
      console.error('Delete item error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedCategoryFilter !== 'all' && item.category_id !== selectedCategoryFilter) {
        return false;
      }
      if (availabilityFilter === 'available' && !item.is_available) {
        return false;
      }
      if (availabilityFilter === 'sold_out' && item.is_available) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [items, selectedCategoryFilter, availabilityFilter, searchQuery]);

  if (!currentRestaurant) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Food & Menu Items</h1>
          <p className="text-xs text-stone-500 mt-0.5">Manage dishes, dietary types, allergen warnings, photos, and live availability</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={categories.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {categories.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You need at least one category before adding dishes to your menu.</span>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard/categories'}
            className="font-bold underline text-amber-950"
          >
            Create Category First
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name or description..."
            className="w-full pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-stone-700"
          >
            <option value="all">All Categories ({items.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as 'all' | 'available' | 'sold_out')}
            className="px-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-stone-700"
          >
            <option value="all">All Status</option>
            <option value="available">Available Only</option>
            <option value="sold_out">Sold Out (86&apos;d)</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-stone-500">
            <Loader2 className="w-6 h-6 text-emerald-700 animate-spin mx-auto mb-2" />
            <p>Loading dishes...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-500 space-y-3">
            <UtensilsCrossed className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="font-semibold text-stone-800 text-sm">No menu items found</p>
            <p className="max-w-xs mx-auto text-stone-500">
              {searchQuery || selectedCategoryFilter !== 'all' || availabilityFilter !== 'all'
                ? 'Try clearing your search query or status filter.'
                : 'Click "Add New Dish" to add food items to your digital menu.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-100 border-b border-stone-200 font-semibold text-stone-900">
                <tr>
                  <th className="py-3 px-4 w-14">Dish</th>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Live Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.map((item) => {
                  const itemCat = categories.find(c => c.id === item.category_id);
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UtensilsCrossed className="w-4 h-4 text-stone-300" />
                          )}
                        </div>
                      </td>

                      {/* Name, Dietary & Description */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <DietaryBadge type={item.dietary_type} />
                            <span className="font-bold text-stone-900">{item.name}</span>
                            {item.is_featured && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span>Special</span>
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-stone-500 line-clamp-1 max-w-md">
                              {item.description}
                            </p>
                          )}
                          {item.allergens && item.allergens.length > 0 && (
                            <p className="text-[10px] text-stone-400">
                              Allergens: {item.allergens.join(', ')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-stone-600 font-medium">
                        {itemCat ? itemCat.name : 'Unassigned'}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-mono-nums">
                        {item.discounted_price ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-stone-900">
                              {formatCurrency(item.discounted_price, currentRestaurant.currency)}
                            </span>
                            <span className="text-[11px] text-stone-400 line-through">
                              {formatCurrency(item.price, currentRestaurant.currency)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-stone-900">
                            {formatCurrency(item.price, currentRestaurant.currency)}
                          </span>
                        )}
                      </td>

                      {/* Quick 1-click availability toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                            item.is_available
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {item.is_available ? (
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-rose-600" />
                          )}
                          <span>{item.is_available ? 'Available' : 'Sold Out (86)'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md"
                            title="Edit Dish"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-md"
                            title="Delete Dish"
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

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-stone-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900">
                {editingItem ? 'Edit Dish' : 'Add New Menu Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Garlic Butter Naan"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Regular Price ({currentRestaurant.currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="350"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Discounted Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(e.target.value)}
                    placeholder="320"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Dietary Indicator (FSSAI)
                  </label>
                  <select
                    value={dietaryType}
                    onChange={(e) => setDietaryType(e.target.value as DietaryType)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="veg">Vegetarian (Green mark)</option>
                    <option value="non_veg">Non-Vegetarian (Red mark)</option>
                    <option value="egg">Contains Egg (Amber mark)</option>
                    <option value="vegan">100% Vegan (Plant leaf)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Allergen Warnings (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={allergensInput}
                    onChange={(e) => setAllergensInput(e.target.value)}
                    placeholder="e.g. Dairy, Gluten, Nuts"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-900 mb-1">
                  Dish Description & Ingredients
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe preparation, key herbs, or accompaniments..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Photo Upload & URL preview */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <label className="block font-semibold text-stone-900">
                  Dish Photography
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Dish preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UtensilsCrossed className="w-6 h-6 text-stone-300" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg cursor-pointer border border-stone-300">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Uploading to Supabase...' : 'Upload Photo'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or enter direct image URL"
                      className="w-full px-2.5 py-1 text-[11px] border border-stone-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>In Stock (Available for ordering)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Mark as Chef&apos;s Special</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Dish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-stone-200 p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-bold text-base text-stone-900">Delete Menu Item?</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong> from your menu?
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
                onClick={handleDeleteItem}
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
