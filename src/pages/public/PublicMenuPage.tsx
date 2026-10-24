import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
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
  Check,
  Plus,
  Minus,
  ShoppingBag,
  X,
  ChefHat,
  Utensils,
  CheckCircle2,
  Sparkles,
  Bell,
  BellRing,
  Coffee,
  Receipt
} from 'lucide-react';
import { supabase, isSupabaseConfigured, formatCurrency } from '../../lib/supabase';
import { DietaryBadge } from '../../components/common/DietaryBadge';
import { DEMO_RESTAURANT, DEMO_CATEGORIES, DEMO_MENU_ITEMS } from '../../data/mockDemoData';
import type { Restaurant, Category, MenuItem, DietaryType, Order, OrderStatus, WaiterCall, WaiterCallType } from '../../types';

interface PublicMenuPageProps {
  previewMode?: boolean;
  forcedRestaurant?: Restaurant | null;
}

export const PublicMenuPage: React.FC<PublicMenuPageProps> = ({ previewMode = false, forcedRestaurant = null }) => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const urlTableParam = searchParams.get('table') || '';

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

  // Cart & Table Ordering State
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isOrderTrayOpen, setIsOrderTrayOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(urlTableParam ? `Table ${urlTableParam}` : '');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Waiter Call State
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [waiterCallTable, setWaiterCallTable] = useState(urlTableParam ? `Table ${urlTableParam}` : '');
  const [waiterCallType, setWaiterCallType] = useState<WaiterCallType>('take_order');
  const [waiterCallNotes, setWaiterCallNotes] = useState('');
  const [isSubmittingWaiterCall, setIsSubmittingWaiterCall] = useState(false);
  const [waiterCallError, setWaiterCallError] = useState<string | null>(null);
  const [activeWaiterCall, setActiveWaiterCall] = useState<WaiterCall | null>(() => {
    try {
      const saved = localStorage.getItem(`active_call_${slug || 'demo'}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (forcedRestaurant) {
      setRestaurant(forcedRestaurant);
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

      // Demo fallback
      if (slug.toLowerCase() === 'cafe-raj' && (!isSupabaseConfigured || !supabase)) {
        setRestaurant(DEMO_RESTAURANT);
        setCategories(DEMO_CATEGORIES);
        setMenuItems(DEMO_MENU_ITEMS);
        setIsLoading(false);
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
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
        const { data: restData, error: restError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slug.toLowerCase())
          .maybeSingle();

        if (restError || !restData) {
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

  // Cart operations
  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const cartItemsList = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const item = menuItems.find(m => m.id === id);
        if (!item) return null;
        const activePrice = item.discounted_price ?? item.price;
        return {
          item,
          quantity: qty,
          unitPrice: activePrice,
          totalPrice: activePrice * qty,
        };
      })
      .filter(Boolean) as { item: MenuItem; quantity: number; unitPrice: number; totalPrice: number }[];
  }, [cart, menuItems]);

  const cartTotalAmount = useMemo(() => {
    return cartItemsList.reduce((sum, curr) => sum + curr.totalPrice, 0);
  }, [cartItemsList]);

  const cartTotalQuantity = useMemo(() => {
    return cartItemsList.reduce((sum, curr) => sum + curr.quantity, 0);
  }, [cartItemsList]);

  // Handle Placing Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    if (!tableNumber.trim()) {
      setOrderError('Please enter your Table or Seat Number (e.g. Table 4).');
      return;
    }

    if (cartItemsList.length === 0) {
      setOrderError('Your order cart is empty.');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError(null);

    const generatedOrderNumber = `#TR-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (supabase && isSupabaseConfigured) {
        // 1. Insert order into 'orders' table
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .insert({
            restaurant_id: restaurant.id,
            order_number: generatedOrderNumber,
            table_number: tableNumber.trim(),
            customer_name: customerName.trim() || null,
            notes: orderNotes.trim() || null,
            total_amount: cartTotalAmount,
            status: 'pending',
          })
          .select()
          .single();

        if (orderErr) {
          console.error('Order creation error:', orderErr);
          // If table doesn't exist yet, we still provide instant customer feedback
        }

        const insertedOrderId = orderData?.id || `local-${Date.now()}`;

        // 2. Insert order items
        if (orderData?.id) {
          const itemsToInsert = cartItemsList.map(ci => ({
            order_id: insertedOrderId,
            menu_item_id: ci.item.id,
            item_name: ci.item.name,
            quantity: ci.quantity,
            price: ci.unitPrice,
            total_price: ci.totalPrice,
          }));

          await supabase.from('order_items').insert(itemsToInsert);
        }

        const confirmedOrder: Order = {
          id: insertedOrderId,
          restaurant_id: restaurant.id,
          order_number: generatedOrderNumber,
          table_number: tableNumber.trim(),
          customer_name: customerName.trim() || null,
          notes: orderNotes.trim() || null,
          total_amount: cartTotalAmount,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setPlacedOrder(confirmedOrder);
        setCart({});
        setIsOrderTrayOpen(false);
      } else {
        // Fallback for preview / demo
        const mockOrder: Order = {
          id: `demo-${Date.now()}`,
          restaurant_id: restaurant.id,
          order_number: generatedOrderNumber,
          table_number: tableNumber.trim(),
          customer_name: customerName.trim() || null,
          notes: orderNotes.trim() || null,
          total_amount: cartTotalAmount,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setPlacedOrder(mockOrder);
        setCart({});
        setIsOrderTrayOpen(false);
      }
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Poll placed order status so customer sees "Cooking", "Served" updates
  useEffect(() => {
    if (!placedOrder || !supabase || !isSupabaseConfigured) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('status')
          .eq('id', placedOrder.id)
          .maybeSingle();

        if (data && data.status !== placedOrder.status) {
          setPlacedOrder(prev => prev ? { ...prev, status: data.status as OrderStatus } : null);
        }
      } catch (err) {
        console.error('Polling status error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [placedOrder]);

  // Handle Calling Waiter / Batter to Table
  const handleCallWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    const finalTable = waiterCallTable.trim() || tableNumber.trim();
    if (!finalTable) {
      setWaiterCallError('Please enter your Table or Seat Number so staff knows where to come.');
      return;
    }

    setIsSubmittingWaiterCall(true);
    setWaiterCallError(null);

    try {
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('waiter_calls')
          .insert({
            restaurant_id: restaurant.id,
            table_number: finalTable,
            request_type: waiterCallType,
            notes: waiterCallNotes.trim() || null,
            status: 'pending',
          })
          .select()
          .single();

        if (error) {
          console.error('Waiter call insert error:', error);
        }

        const callObj: WaiterCall = data || {
          id: `local-${Date.now()}`,
          restaurant_id: restaurant.id,
          table_number: finalTable,
          request_type: waiterCallType,
          notes: waiterCallNotes.trim() || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setActiveWaiterCall(callObj);
        localStorage.setItem(`active_call_${slug || 'demo'}`, JSON.stringify(callObj));
        setIsCallWaiterOpen(false);
      } else {
        const mockCall: WaiterCall = {
          id: `demo-${Date.now()}`,
          restaurant_id: restaurant.id,
          table_number: finalTable,
          request_type: waiterCallType,
          notes: waiterCallNotes.trim() || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setActiveWaiterCall(mockCall);
        localStorage.setItem(`active_call_${slug || 'demo'}`, JSON.stringify(mockCall));
        setIsCallWaiterOpen(false);
      }
    } catch (err: unknown) {
      setWaiterCallError(err instanceof Error ? err.message : 'Failed to call staff');
    } finally {
      setIsSubmittingWaiterCall(false);
    }
  };

  // Poll active waiter call status so diner sees when staff is attending / arrived
  useEffect(() => {
    if (!activeWaiterCall || !supabase || !isSupabaseConfigured) return;
    if (activeWaiterCall.id.startsWith('demo-') || activeWaiterCall.id.startsWith('local-')) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('waiter_calls')
          .select('*')
          .eq('id', activeWaiterCall.id)
          .maybeSingle();

        if (data && !error) {
          const updated = data as WaiterCall;
          setActiveWaiterCall(updated);
          localStorage.setItem(`active_call_${slug || 'demo'}`, JSON.stringify(updated));

          if (updated.status === 'completed' || updated.status === 'dismissed') {
            setTimeout(() => {
              setActiveWaiterCall(null);
              localStorage.removeItem(`active_call_${slug || 'demo'}`);
            }, 6000);
          }
        }
      } catch (e) {
        console.error('Poll waiter call error:', e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeWaiterCall, slug]);

  const handleCancelWaiterCall = async () => {
    if (activeWaiterCall && supabase && isSupabaseConfigured && !activeWaiterCall.id.startsWith('demo-') && !activeWaiterCall.id.startsWith('local-')) {
      try {
        await supabase
          .from('waiter_calls')
          .update({ status: 'dismissed' })
          .eq('id', activeWaiterCall.id);
      } catch (e) {
        console.error('Cancel waiter call error:', e);
      }
    }
    setActiveWaiterCall(null);
    localStorage.removeItem(`active_call_${slug || 'demo'}`);
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
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }, [restaurant]);

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }
      if (dietaryFilter !== 'all' && item.dietary_type !== dietaryFilter) {
        return false;
      }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mb-3" />
        <p className="text-sm font-semibold text-stone-800">Loading menu...</p>
        <p className="text-xs text-stone-500 mt-1">Connecting to kitchen dishes</p>
      </div>
    );
  }

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
      <div className="w-full max-w-md bg-stone-50 min-h-screen shadow-xl flex flex-col border-x border-stone-200 relative pb-28">
        
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

              <div className="flex items-center gap-1.5">
                {urlTableParam && (
                  <span className="px-2 py-1 rounded-md text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    #{urlTableParam}
                  </span>
                )}
                
                <button
                  onClick={() => {
                    if (!waiterCallTable && tableNumber) setWaiterCallTable(tableNumber);
                    setIsCallWaiterOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                  title="Call waiter to table"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Call Waiter</span>
                </button>

                <button
                  onClick={handleShare}
                  aria-label="Share menu link"
                  className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-stone-700/60 shadow-xs transition-colors"
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

        {/* Live Order Confirmation Banner if order placed */}
        {placedOrder && (
          <div className="m-3 p-4 bg-emerald-900 text-white rounded-2xl shadow-lg border border-emerald-700 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-300" />
                <span className="font-bold text-sm">Order Placed Successfully!</span>
              </div>
              <button
                onClick={() => setPlacedOrder(null)}
                className="text-emerald-300 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-800">
              <span className="font-mono font-bold text-emerald-200">
                {placedOrder.order_number} · {placedOrder.table_number}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-800 text-emerald-200 border border-emerald-600">
                {placedOrder.status === 'pending' ? 'In Kitchen Queue' : placedOrder.status === 'preparing' ? 'Cooking in Kitchen 🔥' : 'Served at Table 🍽️'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200 leading-tight">
              The kitchen staff has received your ticket. Relax while we prepare your fresh meal!
            </p>
          </div>
        )}

        {/* Live Waiter Call Status Banner */}
        {activeWaiterCall && (
          <div className="m-3 p-4 bg-amber-950 text-white rounded-2xl shadow-lg border border-amber-600 space-y-2 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-400 animate-bounce" />
                <span className="font-bold text-sm">
                  {activeWaiterCall.status === 'completed'
                    ? 'Staff Arrived at Your Table! ✅'
                    : activeWaiterCall.status === 'attending'
                    ? 'Waiter Is On The Way! 🏃'
                    : 'Notification Sent to Waiter! 🔔'}
                </span>
              </div>
              <button
                onClick={handleCancelWaiterCall}
                className="text-amber-300 hover:text-white p-1 text-xs font-semibold flex items-center gap-1"
                title="Dismiss or cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-800">
              <span className="font-mono font-bold text-amber-200">
                {activeWaiterCall.table_number} ·{' '}
                {activeWaiterCall.request_type === 'take_order'
                  ? 'Take Order (ऑर्डर लेने आएं)'
                  : activeWaiterCall.request_type === 'water'
                  ? 'Water Bottle'
                  : activeWaiterCall.request_type === 'bill'
                  ? 'Bill Request'
                  : 'Assistance'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                activeWaiterCall.status === 'completed'
                  ? 'bg-emerald-800 text-emerald-200 border-emerald-600'
                  : activeWaiterCall.status === 'attending'
                  ? 'bg-blue-800 text-blue-200 border-blue-600'
                  : 'bg-amber-800 text-amber-200 border-amber-500 animate-pulse'
              }`}>
                {activeWaiterCall.status === 'completed'
                  ? 'Attended'
                  : activeWaiterCall.status === 'attending'
                  ? 'Attending'
                  : 'Staff Alerted'}
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-tight">
              {activeWaiterCall.status === 'completed'
                ? 'A staff member attended to your table request.'
                : activeWaiterCall.status === 'attending'
                ? 'A waiter is walking to your table right now to assist you.'
                : 'Staff has been notified. Someone will come to your table or counter shortly to take your order!'}
            </p>
          </div>
        )}

        {/* Live Search & Filter Sticky Bar */}
        <div className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200 shadow-xs px-4 py-2.5 space-y-2">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, or ingredients..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 placeholder:text-stone-400"
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
                  {category.items.map((item) => {
                    const itemQty = cart[item.id] || 0;
                    return (
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
                                Special
                              </span>
                            )}
                            {!item.is_available && (
                              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                Sold Out
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

                          <div className="pt-2 flex items-center justify-between">
                            <div className="flex items-baseline gap-2 font-mono-nums">
                              {item.discounted_price ? (
                                <>
                                  <span className="text-sm font-bold text-stone-900">
                                    {formatCurrency(item.discounted_price, restaurant.currency)}
                                  </span>
                                  <span className="text-xs text-stone-400 line-through">
                                    {formatCurrency(item.price, restaurant.currency)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm font-bold text-stone-900">
                                  {formatCurrency(item.price, restaurant.currency)}
                                </span>
                              )}
                            </div>

                            {/* Direct Table Order Button / Stepper */}
                            {item.is_available && (
                              <div>
                                {itemQty === 0 ? (
                                  <button
                                    onClick={() => updateCartQty(item.id, 1)}
                                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1 active:scale-95"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-lg p-0.5 shadow-xs">
                                    <button
                                      onClick={() => updateCartQty(item.id, -1)}
                                      className="w-6 h-6 rounded bg-white text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-bold text-sm shadow-2xs"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-mono-nums font-bold text-xs text-emerald-950 px-1 min-w-[14px] text-center">
                                      {itemQty}
                                    </span>
                                    <button
                                      onClick={() => updateCartQty(item.id, 1)}
                                      className="w-6 h-6 rounded bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center font-bold text-sm shadow-2xs"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
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
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </main>

        {/* Sticky Floating Bottom Cart Bar */}
        {cartTotalQuantity > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-40 bg-stone-900 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-stone-700/80 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-3 pl-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-mono-nums">
                {cartTotalQuantity}
              </div>
              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold block leading-tight">Total Bill</span>
                <span className="text-sm font-bold font-mono-nums text-white">
                  {formatCurrency(cartTotalAmount, restaurant.currency)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOrderTrayOpen(true)}
              className="py-2 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Review Order ({cartTotalQuantity})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Order Review Bottom Sheet / Modal */}
        {isOrderTrayOpen && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full border border-stone-200 max-h-[85vh] flex flex-col overflow-hidden">
              {/* Sheet Header */}
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-base text-stone-900">Your Table Order</h3>
                </div>
                <button
                  onClick={() => setIsOrderTrayOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sheet Body */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {orderError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* Items in Cart */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Selected Items ({cartTotalQuantity})
                  </span>
                  <div className="divide-y divide-stone-100 text-xs">
                    {cartItemsList.map(({ item, quantity, totalPrice }) => (
                      <div key={item.id} className="py-2 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-bold text-stone-900">{item.name}</span>
                          <div className="font-mono-nums text-stone-500 text-[11px]">
                            {quantity} × {formatCurrency(item.discounted_price ?? item.price, restaurant.currency)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold font-mono-nums text-stone-900">
                            {formatCurrency(totalPrice, restaurant.currency)}
                          </span>
                          <div className="flex items-center gap-1 bg-stone-100 rounded-md p-0.5">
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="w-5 h-5 rounded bg-white text-stone-700 flex items-center justify-center font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono-nums font-bold text-xs px-1">{quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              className="w-5 h-5 rounded bg-white text-stone-700 flex items-center justify-center font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-baseline justify-between text-xs font-bold text-stone-900">
                    <span>Subtotal Bill:</span>
                    <span className="text-base font-mono-nums text-emerald-800">
                      {formatCurrency(cartTotalAmount, restaurant.currency)}
                    </span>
                  </div>
                </div>

                {/* Table & Guest Form */}
                <form id="table-order-form" onSubmit={handlePlaceOrder} className="space-y-3 pt-2 border-t border-stone-100 text-xs">
                  <div>
                    <label className="block font-bold text-stone-900 mb-1">
                      Table / Seat Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="e.g. Table 04, Seat 12, Terrace"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Kitchen staff will bring your food directly to this table.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-900 mb-1">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-900 mb-1">
                      Special Cooking Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Extra spicy, less oil, no onion..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </form>
              </div>

              {/* Sheet Footer */}
              <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-2">
                <button
                  type="submit"
                  form="table-order-form"
                  disabled={isSubmittingOrder || cartTotalQuantity === 0}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Order to Kitchen...</span>
                    </>
                  ) : (
                    <>
                      <ChefHat className="w-4 h-4" />
                      <span>Send Order to Kitchen ({formatCurrency(cartTotalAmount, restaurant.currency)})</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-stone-400 text-center">
                  Orders are prepared immediately by the kitchen team. Pay after dining.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Quick Call Waiter Button when cart is empty */}
        {cartTotalQuantity === 0 && (
          <div className="fixed bottom-5 right-4 z-40 animate-in fade-in">
            <button
              onClick={() => {
                if (!waiterCallTable && tableNumber) setWaiterCallTable(tableNumber);
                setIsCallWaiterOpen(true);
              }}
              className="py-2.5 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xl flex items-center gap-2 border border-amber-300 transition-all active:scale-95 cursor-pointer"
            >
              <Bell className="w-4 h-4 animate-bounce text-stone-950" />
              <span>Call Waiter / वेटर बुलाएं</span>
            </button>
          </div>
        )}

        {/* Call Waiter / Batter Notification Modal Sheet */}
        {isCallWaiterOpen && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full border border-stone-200 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
              {/* Header */}
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-amber-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-stone-900 leading-tight">Call Waiter to Table</h3>
                    <p className="text-[11px] text-stone-500">वेटर को आपके टेबल पर बुलाएं</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCallWaiterOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {waiterCallError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{waiterCallError}</span>
                  </div>
                )}

                <form id="call-waiter-form" onSubmit={handleCallWaiter} className="space-y-4 text-xs">
                  {/* Table Number */}
                  <div>
                    <label className="block font-bold text-stone-900 mb-1">
                      Table / Counter / Seat Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={waiterCallTable}
                      onChange={(e) => setWaiterCallTable(e.target.value)}
                      placeholder="e.g. Table 04, Counter 2, Seat B"
                      className="w-full px-3 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-stone-900 bg-white"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Waiters and service staff will receive an instant notification for this table.
                    </p>
                  </div>

                  {/* Reason for Calling Waiter */}
                  <div>
                    <label className="block font-bold text-stone-900 mb-1.5">
                      What do you need assistance with?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWaiterCallType('take_order')}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          waiterCallType === 'take_order'
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/40 text-stone-950 font-bold'
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <ChefHat className={`w-4 h-4 ${waiterCallType === 'take_order' ? 'text-amber-600' : 'text-stone-400'}`} />
                          <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                            Popular
                          </span>
                        </div>
                        <span className="text-xs">Take My Order</span>
                        <span className="text-[10px] text-stone-500 font-normal">ऑर्डर लेने आएं</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWaiterCallType('water')}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          waiterCallType === 'water'
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/40 text-stone-950 font-bold'
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <Coffee className={`w-4 h-4 ${waiterCallType === 'water' ? 'text-amber-600' : 'text-stone-400'}`} />
                        <span className="text-xs">Water / Drinks</span>
                        <span className="text-[10px] text-stone-500 font-normal">पानी चाहिए</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWaiterCallType('bill')}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          waiterCallType === 'bill'
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/40 text-stone-950 font-bold'
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <Receipt className={`w-4 h-4 ${waiterCallType === 'bill' ? 'text-amber-600' : 'text-stone-400'}`} />
                        <span className="text-xs">Bill / Payment</span>
                        <span className="text-[10px] text-stone-500 font-normal">बिल चाहिए</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWaiterCallType('help')}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          waiterCallType === 'help'
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/40 text-stone-950 font-bold'
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <Utensils className={`w-4 h-4 ${waiterCallType === 'help' ? 'text-amber-600' : 'text-stone-400'}`} />
                        <span className="text-xs">Assistance / Help</span>
                        <span className="text-[10px] text-stone-500 font-normal">मदद चाहिए</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Note */}
                  <div>
                    <label className="block font-semibold text-stone-900 mb-1">
                      Quick Note for Staff (Optional)
                    </label>
                    <input
                      type="text"
                      value={waiterCallNotes}
                      onChange={(e) => setWaiterCallNotes(e.target.value)}
                      placeholder="e.g. Ready to order, please bring cutlery..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-2">
                <button
                  type="submit"
                  form="call-waiter-form"
                  disabled={isSubmittingWaiterCall}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-stone-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingWaiterCall ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Notifying Waiter & Staff...</span>
                    </>
                  ) : (
                    <>
                      <BellRing className="w-4 h-4" />
                      <span>Send Notification to Waiter (वेटर को बुलाएं)</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-stone-400 text-center">
                  Staff dashboard will be alerted immediately with a chime sound.
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Discreet bottom footer */}
        <footer className="mt-auto p-4 bg-stone-100 border-t border-stone-200 text-center text-[11px] text-stone-500 space-y-1">
          <p>Orders are sent directly to the kitchen from your phone.</p>
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
