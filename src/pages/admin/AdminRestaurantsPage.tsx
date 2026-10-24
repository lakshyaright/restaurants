import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Store, 
  Search, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';
import { supabase, getRestaurantMenuUrl } from '../../lib/supabase';
import type { Restaurant } from '../../types';

export const AdminRestaurantsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'suspended'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Inspect detail modal state
  const [inspectTarget, setInspectTarget] = useState<Restaurant | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRestaurants(data as Restaurant[]);
      }
    } catch (err) {
      console.error('Error fetching admin restaurants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleUpdateStatus = async (restaurantId: string, newStatus: 'published' | 'draft' | 'suspended') => {
    if (!supabase) return;
    setIsUpdatingStatus(true);
    setActionFeedback(null);

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', restaurantId);

      if (error) {
        setActionFeedback(`Failed to update status: ${error.message}`);
      } else {
        setActionFeedback(`Restaurant status successfully updated to ${newStatus}.`);
        setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, status: newStatus } : r));
        if (inspectTarget && inspectTarget.id === restaurantId) {
          setInspectTarget({ ...inspectTarget, status: newStatus });
        }
      }
    } catch (err: unknown) {
      setActionFeedback(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.name.toLowerCase().includes(q);
      const matchSlug = r.slug.toLowerCase().includes(q);
      const matchAddress = r.address?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchSlug && !matchAddress) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Restaurant Management</h1>
        <p className="text-xs text-stone-500 mt-0.5">Audit registered outlets, inspect details, and regulate publication or suspension states</p>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-stone-900 text-white rounded-lg text-xs flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-stone-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by restaurant name, slug, or address..."
            className="w-full pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft' | 'suspended')}
            className="px-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-700"
          >
            <option value="all">All Statuses ({restaurants.length})</option>
            <option value="published">Published Only</option>
            <option value="draft">Draft Mode Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Outlets Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-stone-500">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-2" />
            <p>Loading restaurant directory...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-500 space-y-2">
            <Store className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="font-semibold text-stone-800">No restaurants found</p>
            <p>Try modifying your query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-100 border-b border-stone-200 font-semibold text-stone-900">
                <tr>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Slug & URL</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRestaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-stone-900 block">{r.name}</span>
                        {r.address && <span className="text-[11px] text-stone-500 truncate block max-w-xs">{r.address}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      <a
                        href={getRestaurantMenuUrl(r.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:underline inline-flex items-center gap-1"
                      >
                        <span>/menu/{r.slug}</span>
                        <ExternalLink className="w-3 h-3 text-stone-400" />
                      </a>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        r.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'suspended'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {r.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                        {r.status === 'draft' && <Clock className="w-3 h-3" />}
                        {r.status === 'suspended' && <AlertTriangle className="w-3 h-3" />}
                        <span>{r.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-stone-500 font-mono-nums">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setInspectTarget(r)}
                          className="px-2.5 py-1 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded font-medium transition-colors"
                        >
                          Inspect Details
                        </button>

                        {r.status === 'suspended' ? (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'published')}
                            disabled={isUpdatingStatus}
                            className="px-2.5 py-1 text-white bg-emerald-700 hover:bg-emerald-800 rounded font-medium transition-colors"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'suspended')}
                            disabled={isUpdatingStatus}
                            className="px-2.5 py-1 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded font-medium transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {inspectTarget && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-stone-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-stone-900">{inspectTarget.name}</h3>
                <span className="text-xs text-stone-500 font-mono">ID: {inspectTarget.id}</span>
              </div>
              <button onClick={() => setInspectTarget(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="grid grid-cols-2 gap-2 p-3 bg-stone-50 rounded-lg">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Status</span>
                  <span className="font-bold">{inspectTarget.status}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Currency</span>
                  <span className="font-bold">{inspectTarget.currency}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Created Date</span>
                  <span>{new Date(inspectTarget.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Owner User ID</span>
                  <span className="font-mono truncate block">{inspectTarget.created_by || 'None'}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold block text-stone-900">Address</span>
                <p className="text-stone-600 mt-0.5">{inspectTarget.address || 'No physical address provided'}</p>
              </div>

              <div>
                <span className="font-semibold block text-stone-900">Phone</span>
                <p className="text-stone-600 mt-0.5">{inspectTarget.phone || 'No phone provided'}</p>
              </div>

              <div>
                <span className="font-semibold block text-stone-900">Description</span>
                <p className="text-stone-600 mt-0.5">{inspectTarget.description || 'No description entered'}</p>
              </div>

              {/* Status Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-stone-500 font-medium">Change Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(inspectTarget.id, 'published')}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded hover:bg-emerald-100"
                  >
                    Set Published
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(inspectTarget.id, 'draft')}
                    className="px-2.5 py-1 text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300 rounded hover:bg-stone-200"
                  >
                    Set Draft
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(inspectTarget.id, 'suspended')}
                    className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 rounded hover:bg-rose-100"
                  >
                    Set Suspended
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setInspectTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
