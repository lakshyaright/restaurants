import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  AlertCircle, 
  Store, 
  UtensilsCrossed, 
  ChevronRight,
  ShieldAlert,
  Loader2,
  Share2,
  Check
} from 'lucide-react';
import { supabase, isSupabaseConfigured, formatCurrency } from '../../lib/supabase';
import { DietaryBadge } from '../../components/common/DietaryBadge';
import { DEMO_RESTAURANT, DEMO_CATEGORIES, DEMO_MENU_ITEMS } from '../../data/mockDemoData';
import type { Restaurant, Category, MenuItem, DietaryType } from '../../types';

interface PublicMenuPageProps {
  previewMode?: boolean;
  forcedRestaurant?: Restaurant | null;
}

export const PublicMenuPage: React.FC<PublicMenuPageProps> = ({ previewMode = false, forcedRestaurant = null }) => {
  const { slug } = useParams<{ slug: string }>();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(forcedRestaurant);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!forcedRestaurant);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | DietaryType>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (forcedRestaurant) {
      setRestaurant(forcedRestaurant);
      // Fetch categories & items for forcedRestaurant
      loadMenuData(forcedRestaurant.id, true);
      return;
    }

    if (!slug) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchRestaurantBySlug = async () => {
      setIsLoading(true);
      setNotFound(false);
      setStatusMessage(null);

      // Check if this is the demo restaurant or fallback
      if (slug.toLowerCase() === 'cafe-raj' && (!isSupabaseConfigured || !supabase)) {
        setRestaurant(DEMO_RESTAURANT);
        setCategories(DEMO_CATEGORIES);
        setMenuItems(DEMO_MENU_ITEMS);
        setIsLoading(false);
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        // Fallback for non-configured environment
        if (slug.toLowerCase() === 'cafe-raj') {
          setRestaurant(DEMO_RESTAURANT);
          setCategories(DEMO_CATEGORIES);
          setMenuItems(DEMO_MENU_ITEMS);
        } else {
          setNotFound(true);
        }
        setIsLoading(false);
        return;
      }

      try {
        // Query restaurant by slug
        const { data: restData, error: restError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slug.toLowerCase())
          .maybeSingle();

        if (restError || !restData) {
          // If demo slug is requested but not in DB yet, serve mock demo
          if (slug.toLowerCase() === 'cafe-raj') {
            setRestaurant(DEMO_RESTAURANT);
            setCategories(DEMO_CATEGORIES);
            setMenuItems(DEMO_MENU_ITEMS);
            setIsLoading(false);
            return;
          }
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const currentRest = restData as Restaurant;

        // Security check: Only published restaurants are accessible publicly unless previewMode is active
        if (!previewMode && currentRest.status !== 'published') {
          if (currentRest.status === 'draft') {
            setStatusMessage('This restaurant menu is currently in draft mode and has not yet been published by the owner.');
          } else if (currentRest.status === 'suspended') {
            setStatusMessage('This restaurant menu is temporarily suspended by platform administration.');
          }
          setIsLoading(false);
          return;
        }

        setRestaurant(currentRest);
        await loadMenuData(currentRest.id, previewMode);
      } catch (err) {
        console.error('Error loading public restaurant menu:', err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantBySlug();
  }, [slug, previewMode, forcedRestaurant]);

  const loadMenuData = async (restaurantId: string, allowDrafts: boolean) => {
    if (!supabase) return;

    try {
      // 1. Fetch Categories
      let catQuery = supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (!allowDrafts) {
        catQuery = catQuery.eq('is_active', true);
      }

      const { data: catData } = await catQuery;
      if (catData) setCategories(catData as Category[]);

      // 2. Fetch Menu Items
      let itemQuery = supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (!allowDrafts) {
        itemQuery = itemQuery.eq('is_available', true);
      }

      const { data: itemData } = await itemQuery;
      if (itemData) setMenuItems(itemData as MenuItem[]);
    } catch (err) {
      console.error('Error querying category/item records:', err);
    }
  };

  // Determine open/closed status based on schedule
  const isOpenNow = useMemo(() => {
    if (!restaurant?.opening_hours) return true;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const now = new Date();
    const currentDay = days[now.getDay()];
    const todaySchedule = restaurant.opening_hours[currentDay];

    if (!todaySchedule || todaySchedule.closed) return false;

    const [openH, openM] = todaySchedule.open.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.close.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (closeMinutes < openMinutes) {
      // Overnight schedule (e.g. 18:00 to 02:00)
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }, [restaurant]);

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }
      // Dietary filter
      if (dietaryFilter !== 'all' && item.dietary_type !== dietaryFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) ?? false;
        const matchesAllergens = item.allergens?.some(a => a.toLowerCase().includes(query)) ?? false;
        if (!matchesName && !matchesDesc && !matchesAllergens) {
          return false;
        }
      }
      return true;
    });
  }, [menuItems, selectedCategory, dietaryFilter, searchQuery]);

  // Group items by category for structured layout
  const groupedCategories = useMemo(() => {
    return categories
      .map(cat => ({
        ...cat,
        items: filteredItems.filter(item => item.category_id === cat.id),
      }))
      .filter(cat => cat.items.length > 0 || (selectedCategory === cat.id && searchQuery.trim() === ''));
  }, [categories, filteredItems, selectedCategory, searchQuery]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: restaurant?.name || 'Restaurant Menu',
        text: `View the live digital menu for ${restaurant?.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mb-3" />
        <p className="text-sm font-semibold text-stone-800">Loading menu...</p>
        <p className="text-xs text-stone-500 mt-1">Connecting to kitchen dishes</p>
      </div>
    );
  }

  // Not Found state
  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-4 border border-stone-200">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Restaurant Not Found</h1>
        <p className="text-xs text-stone-600 max-w-sm mt-2 leading-relaxed">
          The menu URL <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">/menu/{slug}</code> does not match any registered restaurant on TechRescue Digital Menu.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/menu/cafe-raj"
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
          >
            View Demo Menu (Cafe Raj)
          </Link>
          <Link
            to="/"
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Status Blocked / Draft / Suspended state
  if (statusMessage) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-stone-900">{restaurant.name}</h1>
        <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 max-w-md leading-relaxed">
          {statusMessage}
        </div>
        <p className="text-xs text-stone-500 mt-4">
          If you are the restaurant owner, please log in to your dashboard to publish your menu.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs"
          >
            Owner Dashboard Login
          </Link>
          <Link
            to="/"
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex justify-center selection:bg-emerald-200">
      {/* Mobile-constrained viewport container */}
      <div className="w-full max-w-md bg-stone-50 min-h-screen shadow-xl flex flex-col border-x border-stone-200 relative pb-16">
        
        {/* Top Header Banner / Brand Canvas */}
        <div className="relative bg-stone-900 text-white overflow-hidden">
          {restaurant.cover_image_url ? (
            <div className="h-44 w-full relative">
              <img
                src={restaurant.cover_image_url}
                alt={`${restaurant.name} cover`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />
            </div>
          ) : (
            <div className="h-32 w-full bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-950 relative">
              <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                <UtensilsCrossed className="w-32 h-32" />
              </div>
            </div>
          )}

          {/* Restaurant identity container */}
          <div className="px-5 pb-5 -mt-8 relative z-10 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div className="w-16 h-16 rounded-xl bg-white p-1 border-2 border-stone-100 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                {restaurant.logo_url ? (
                  <img
                    src={restaurant.logo_url}
                    alt={restaurant.name}
                    className="w-full h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold text-xl">
                    {restaurant.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  aria-label="Share menu link"
                  className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-stone-700/60 shadow-xs transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                  {restaurant.name}
                </h1>
              </div>

              {restaurant.description && (
                <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                  {restaurant.description}
                </p>
              )}
            </div>

            {/* Quick status bar */}
            <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-stone-300">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className="font-semibold text-white">
                  {isOpenNow ? 'Open for Dining' : 'Kitchen Closed'}
                </span>
              </div>

              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:text-white transition-colors">
                  <Phone className="w-3 h-3 text-stone-400" />
                  <span>{restaurant.phone}</span>
                </a>
              )}

              {restaurant.address && (
                <div className="flex items-center gap-1 text-[11px] text-stone-400 truncate w-full">
                  <MapPin className="w-3 h-3 shrink-0 text-stone-400" />
                  <span className="truncate">{restaurant.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Search & Filter Sticky Bar */}
        <div className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200 shadow-xs px-4 py-2.5 space-y-2">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, or ingredients..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 placeholder:text-stone-400"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Horizontal Scrolling Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
              }`}
            >
              All Categories ({menuItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Dietary Filter Buttons */}
          <div className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar text-[11px]">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                dietaryFilter === 'all' ? 'border-stone-900 font-bold bg-white text-stone-900' : 'border-transparent text-stone-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                dietaryFilter === 'veg' ? 'border-emerald-600 font-bold bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white text-stone-600'
              }`}
            >
              Veg Only
            </button>
            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'non_veg' ? 'all' : 'non_veg')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                dietaryFilter === 'non_veg' ? 'border-rose-600 font-bold bg-rose-50 text-rose-800' : 'border-stone-200 bg-white text-stone-600'
              }`}
            >
              Non-Veg
            </button>
            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'vegan' ? 'all' : 'vegan')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                dietaryFilter === 'vegan' ? 'border-teal-600 font-bold bg-teal-50 text-teal-800' : 'border-stone-200 bg-white text-stone-600'
              }`}
            >
              Vegan
            </button>
          </div>
        </div>

        {/* Menu Items Feed */}
        <main className="flex-1 p-4 space-y-6">
          {groupedCategories.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-stone-200/60 text-stone-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-800">No dishes match your selection</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Try clearing your search query or switching category filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setDietaryFilter('all');
                }}
                className="mt-2 text-xs font-semibold text-emerald-700 underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            groupedCategories.map((category) => (
              <section key={category.id} className="space-y-3">
                <div className="border-b border-stone-200 pb-1.5 flex items-baseline justify-between">
                  <div>
                    <h2 className="text-base font-bold text-stone-900 tracking-tight">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-xs text-stone-500 mt-0.5">{category.description}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-mono-nums text-stone-600">
                    {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {category.items.map((item) => (
                    <article
                      key={item.id}
                      className={`p-3.5 bg-white rounded-xl border transition-shadow shadow-xs flex justify-between gap-3 ${
                        !item.is_available ? 'opacity-60 bg-stone-100/70 border-stone-200' : 'border-stone-200/90 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <DietaryBadge type={item.dietary_type} />
                          {item.is_featured && (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Chef Special
                            </span>
                          )}
                          {!item.is_available && (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Sold Out Today
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-stone-900 leading-snug">
                          {item.name}
                        </h3>

                        {item.description && (
                          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {item.allergens && item.allergens.length > 0 && (
                          <div className="text-[10px] text-stone-600 pt-0.5">
                            Contains: {item.allergens.join(', ')}
                          </div>
                        )}

                        <div className="pt-1.5 flex items-baseline gap-2 font-mono-nums">
                          {item.discounted_price ? (
                            <>
                              <span className="text-sm font-bold text-stone-900">
                                {formatCurrency(item.discounted_price, restaurant.currency)}
                              </span>
                              <span className="text-xs text-stone-600 line-through">
                                {formatCurrency(item.price, restaurant.currency)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-stone-900">
                              {formatCurrency(item.price, restaurant.currency)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Food image or fallback placeholder */}
                      <div className="w-20 h-20 rounded-lg bg-stone-100 border border-stone-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-stone-100 flex flex-col items-center justify-center p-2 text-center text-stone-400">
                            <UtensilsCrossed className="w-5 h-5 text-stone-400" />
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </main>

        {/* Discreet bottom footer */}
        <footer className="mt-auto p-4 bg-stone-100 border-t border-stone-200 text-center text-[11px] text-stone-500 space-y-1">
          <p>Orders are placed directly with your server at your table.</p>
          <p className="text-[10px] text-stone-400">
            Powered by{' '}
            <Link to="/" className="text-emerald-700 font-semibold hover:underline">
              TechRescue Digital Menu
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
};
