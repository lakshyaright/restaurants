import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Layers, 
  UtensilsCrossed, 
  QrCode, 
  ExternalLink, 
  Plus, 
  Copy, 
  Check, 
  CheckCircle2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, formatCurrency, getRestaurantMenuUrl } from '../../lib/supabase';
import type { Category, MenuItem } from '../../types';

export const DashboardOverview: React.FC = () => {
  const { currentRestaurant, refreshUserData } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentRestaurant) return;

    const fetchOverviewData = async () => {
      setIsLoading(true);
      setActionError(null);
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch categories
        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', currentRestaurant.id);

        if (!catErr && catData) {
          setCategories(catData as Category[]);
        }

        // Fetch menu items
        const { data: itemData, error: itemErr } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', currentRestaurant.id);

        if (!itemErr && itemData) {
          setMenuItems(itemData as MenuItem[]);
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverviewData();
  }, [currentRestaurant]);

  if (!currentRestaurant) return null;

  const publicUrl = getRestaurantMenuUrl(currentRestaurant.slug);

  const availableItemsCount = menuItems.filter(i => i.is_available).length;
  const unavailableItemsCount = menuItems.filter(i => !i.is_available).length;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const togglePublicationStatus = async () => {
    if (!supabase) return;
    setIsUpdatingStatus(true);
    setActionError(null);

    const newStatus = currentRestaurant.status === 'published' ? 'draft' : 'published';

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', currentRestaurant.id);

      if (error) {
        setActionError(error.message);
      } else {
        await refreshUserData();
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update publication status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mb-3" />
        <p className="text-xs font-semibold text-stone-600">Loading restaurant statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Restaurant Headline & Status */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 overflow-hidden">
            {currentRestaurant.logo_url ? (
              <img
                src={currentRestaurant.logo_url}
                alt={currentRestaurant.name}
                className="w-full h-full object-contain p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Store className="w-7 h-7 text-emerald-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">{currentRestaurant.name}</h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                currentRestaurant.status === 'published'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {currentRestaurant.status === 'published' ? 'Live & Published' : 'Draft Mode'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Public URL: <span className="font-mono text-stone-700">{publicUrl}</span>
            </p>
          </div>
        </div>

        {/* Status Toggle & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={togglePublicationStatus}
            disabled={isUpdatingStatus}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              currentRestaurant.status === 'published'
                ? 'bg-stone-100 text-stone-800 hover:bg-stone-200 border-stone-300'
                : 'bg-emerald-700 text-white hover:bg-emerald-800 border-emerald-700'
            }`}
          >
            {isUpdatingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentRestaurant.status === 'published' ? (
              <ToggleRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
            <span>{currentRestaurant.status === 'published' ? 'Switch to Draft' : 'Publish Menu Live'}</span>
          </button>

          <button
            onClick={copyUrl}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg shadow-xs transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy Menu URL'}</span>
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg shadow-xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-700" />
            <span>Open Public Menu</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </a>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Live Orders Card */}
        <Link
          to="/dashboard/orders"
          className="bg-white p-5 rounded-xl border-2 border-emerald-600/80 shadow-xs space-y-2 hover:bg-emerald-50/30 transition-colors block group"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Live Kitchen Orders</span>
            <ShoppingBag className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-stone-900 font-mono-nums">
              View Feed →
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Live Feed
            </span>
          </div>
          <div className="text-[11px] text-stone-500">
            Incoming table tickets & statuses
          </div>
        </Link>

        {/* Categories count */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Categories</span>
            <Layers className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-stone-900 font-mono-nums">
            {categories.length}
          </div>
          <div className="text-[11px] text-stone-500">
            {categories.filter(c => c.is_active).length} active on public menu
          </div>
        </div>

        {/* Total Menu Items */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Menu Items</span>
            <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-stone-900 font-mono-nums">
            {menuItems.length}
          </div>
          <div className="text-[11px] text-stone-500">
            {availableItemsCount} in-stock dishes
          </div>
        </div>

        {/* 86'd / Sold out items */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Sold Out (86&apos;d)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono-nums">
            {unavailableItemsCount}
          </div>
          <div className="text-[11px] text-stone-500">
            Hidden or marked sold out
          </div>
        </div>
      </div>

      {/* Two Column Layout: Quick Actions & Live QR Standee Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Quick Actions & Recent Menu List */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900">Quick Operations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/dashboard/categories"
                className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-left transition-colors flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Manage Categories</h4>
                  <p className="text-[11px] text-stone-500">Add or reorder food sections</p>
                </div>
              </Link>

              <Link
                to="/dashboard/menu-items"
                className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-left transition-colors flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Add Menu Item</h4>
                  <p className="text-[11px] text-stone-500">Dishes, drinks, & prices</p>
                </div>
              </Link>

              <Link
                to="/dashboard/restaurant"
                className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-left transition-colors flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-md bg-stone-200 text-stone-800 flex items-center justify-center mb-2">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Restaurant Settings</h4>
                  <p className="text-[11px] text-stone-500">Hours, logo, & address</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Categories Overview Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">Categories & Dishes Summary</h3>
              <Link to="/dashboard/categories" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                Manage all →
              </Link>
            </div>

            {categories.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 space-y-2">
                <Layers className="w-8 h-8 text-stone-300 mx-auto" />
                <p>No categories created yet.</p>
                <Link
                  to="/dashboard/categories"
                  className="inline-block px-3 py-1.5 bg-emerald-700 text-white rounded-md font-semibold text-xs mt-2"
                >
                  Create First Category
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 text-xs">
                {categories.map((cat) => {
                  const catItems = menuItems.filter(i => i.category_id === cat.id);
                  return (
                    <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-stone-50">
                      <div>
                        <span className="font-semibold text-stone-900">{cat.name}</span>
                        <div className="text-[11px] text-stone-500">
                          {cat.is_active ? 'Active' : 'Hidden from menu'}
                        </div>
                      </div>
                      <div className="text-right font-mono-nums">
                        <span className="font-bold text-stone-900">{catItems.length}</span>
                        <span className="text-stone-400 text-[11px]"> items</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Table QR Code Widget */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">Table QR Code</h3>
            <Link to="/dashboard/qr-code" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              Customize Standee →
            </Link>
          </div>

          <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-stone-200">
              <QRCodeSVG
                value={publicUrl}
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-stone-900">Scan with any smartphone camera</p>
              <p className="text-[11px] text-stone-500 max-w-xs">
                Points directly to <span className="font-mono text-emerald-800">{currentRestaurant.slug}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to="/dashboard/qr-code"
              className="w-full py-2.5 px-4 text-xs font-semibold text-center text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs block transition-colors"
            >
              Download Standee & QR Images
            </Link>
            <p className="text-[11px] text-stone-500 text-center">
              Available in PNG (1024px), vector SVG, and acrylic table tent templates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
