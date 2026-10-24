import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Layers, 
  UtensilsCrossed, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Restaurant } from '../../types';

export const AdminOverview: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [totalCategories, setTotalCategories] = useState<number>(0);
  const [totalMenuItems, setTotalMenuItems] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPlatformStats = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        // 1. Fetch all restaurants
        const { data: restData } = await supabase
          .from('restaurants')
          .select('*')
          .order('created_at', { ascending: false });

        if (restData) setRestaurants(restData as Restaurant[]);

        // 2. Fetch category count
        const { count: catCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });

        if (catCount !== null) setTotalCategories(catCount);

        // 3. Fetch menu item count
        const { count: itemCount } = await supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true });

        if (itemCount !== null) setTotalMenuItems(itemCount);
      } catch (err) {
        console.error('Admin query error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformStats();
  }, []);

  const publishedCount = restaurants.filter(r => r.status === 'published').length;
  const draftCount = restaurants.filter(r => r.status === 'draft').length;
  const suspendedCount = restaurants.filter(r => r.status === 'suspended').length;

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-xs font-semibold text-stone-600">Gathering platform statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Platform Administration Overview</h1>
        <p className="text-xs text-stone-500 mt-0.5">High-level telemetry across all restaurants and dining menus on TechRescue</p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Restaurants */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Outlets</span>
            <Store className="w-4 h-4 text-stone-700" />
          </div>
          <div className="text-2xl font-bold text-stone-900 font-mono-nums">
            {restaurants.length}
          </div>
          <div className="text-[11px] text-stone-500">
            Registered on TechRescue platform
          </div>
        </div>

        {/* Live Published */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono-nums">
            {publishedCount}
          </div>
          <div className="text-[11px] text-stone-500">
            Publicly scannable by diners
          </div>
        </div>

        {/* Draft Outlets */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Draft Mode</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono-nums">
            {draftCount}
          </div>
          <div className="text-[11px] text-stone-500">
            Menu onboarding in progress
          </div>
        </div>

        {/* Suspended Outlets */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Suspended</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono-nums">
            {suspendedCount}
          </div>
          <div className="text-[11px] text-stone-500">
            Access restricted by admin
          </div>
        </div>
      </div>

      {/* Aggregate Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase">Platform Food Dishes</span>
            <div className="text-xl font-bold text-stone-900 font-mono-nums mt-1">{totalMenuItems} items</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase">Platform Menu Categories</span>
            <div className="text-xl font-bold text-stone-900 font-mono-nums mt-1">{totalCategories} categories</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Restaurants Panel */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">Recent Restaurant Outlets</h3>
          <Link
            to="/admin/restaurants"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <span>Manage All Outlets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-stone-100 text-xs">
          {restaurants.slice(0, 5).map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900">{r.name}</span>
                  <span className="font-mono text-[11px] text-stone-400">/menu/{r.slug}</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Created {new Date(r.created_at).toLocaleDateString()} · Currency: {r.currency}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  r.status === 'published' ? 'bg-emerald-100 text-emerald-800' : r.status === 'suspended' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-600'
                }`}>
                  {r.status}
                </span>
                <Link
                  to={`/admin/restaurants?search=${encodeURIComponent(r.slug)}`}
                  className="px-2.5 py-1 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded font-medium"
                >
                  Inspect
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
