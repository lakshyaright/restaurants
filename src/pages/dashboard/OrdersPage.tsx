import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChefHat, 
  Utensils, 
  Trash2, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  User, 
  MessageSquare,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, formatCurrency } from '../../lib/supabase';
import type { Order, OrderStatus } from '../../types';

export const OrdersPage: React.FC = () => {
  const { currentRestaurant } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const fetchOrders = async (silent = false) => {
    if (!currentRestaurant || !supabase) {
      setIsLoading(false);
      return;
    }

    if (!silent) setIsRefreshing(true);
    setErrorFeedback(null);

    try {
      // 1. Fetch Orders
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('created_at', { ascending: false });

      if (ordersErr) {
        // Table might not exist yet if user hasn't run migration
        setErrorFeedback(ordersErr.message);
        setOrders([]);
      } else if (ordersData) {
        const orderIds = ordersData.map(o => o.id);
        
        // 2. Fetch Order Items
        let itemsMap: Record<string, any[]> = {};
        if (orderIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds);

          if (itemsData) {
            itemsData.forEach(item => {
              if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
              itemsMap[item.order_id].push(item);
            });
          }
        }

        const hydratedOrders: Order[] = ordersData.map(o => ({
          ...o,
          items: itemsMap[o.id] || [],
        }));

        setOrders(hydratedOrders);
      }
    } catch (err: unknown) {
      setErrorFeedback(err instanceof Error ? err.message : 'Error fetching orders');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto-poll orders every 6 seconds so incoming orders show up automatically
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [currentRestaurant]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    if (!supabase) return;
    setStatusUpdatingId(orderId);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (!error) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      } else {
        setErrorFeedback(error.message);
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (!error) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }
    } catch (err) {
      console.error('Delete order error:', err);
    }
  };

  if (!currentRestaurant) return null;

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'served');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  const displayedOrders = activeTab === 'active' ? activeOrders : activeTab === 'completed' ? completedOrders : orders;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>New Order Received</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <ChefHat className="w-3.5 h-3.5 text-blue-600" />
            <span>Cooking in Kitchen</span>
          </span>
        );
      case 'served':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Utensils className="w-3.5 h-3.5 text-purple-600" />
            <span>Served to Table</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span>Cancelled</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Live Table Orders & Kitchen Feed</h1>
            {activeOrders.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white font-mono-nums">
                {activeOrders.length} Active
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time incoming orders placed directly from customer smartphones at their tables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              soundEnabled ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-500 border-stone-200'
            }`}
            title={soundEnabled ? 'Notification sound enabled' : 'Notification sound muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => fetchOrders(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-700' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {errorFeedback && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Orders Table Migration Notice</span>
          </div>
          <p className="text-stone-600">
            If orders don&apos;t appear, please make sure you executed the orders table SQL migration in your Supabase SQL Editor:
            <code className="block mt-1 font-mono bg-stone-100 p-2 rounded text-stone-800">
              supabase/migrations/20261024000001_restaurant_orders.sql
            </code>
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'active' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200/60'
          }`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'completed' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200/60'
          }`}
        >
          Completed & History ({completedOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200/60'
          }`}
        >
          All Orders ({orders.length})
        </button>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-stone-500">
          <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mx-auto mb-2" />
          <p>Connecting to kitchen live orders...</p>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">No Orders in this view</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            When diners scan your QR code at their table and click &quot;Place Order&quot;, their tickets will appear here with live sound and status controls.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedOrders.map((order) => {
            const isUpdating = statusUpdatingId === order.id;
            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                  order.status === 'pending'
                    ? 'border-amber-400 ring-2 ring-amber-200/60'
                    : order.status === 'preparing'
                    ? 'border-blue-300'
                    : 'border-stone-200'
                }`}
              >
                {/* Order Card Header */}
                <div className="p-4 border-b border-stone-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900 text-base">
                          {order.order_number}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-stone-900 text-white">
                          {order.table_number}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 font-mono-nums block mt-0.5">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Customer name and notes if provided */}
                  {(order.customer_name || order.notes) && (
                    <div className="pt-2 text-xs text-stone-600 space-y-1">
                      {order.customer_name && (
                        <div className="flex items-center gap-1.5 font-medium text-stone-800">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>Guest: {order.customer_name}</span>
                        </div>
                      )}
                      {order.notes && (
                        <div className="flex items-start gap-1.5 p-2 bg-stone-50 rounded-lg border border-stone-200 text-stone-700 text-[11px]">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="italic">&quot;{order.notes}&quot;</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-2 text-xs">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                    Ordered Dishes
                  </span>

                  <div className="space-y-1.5 divide-y divide-stone-100">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((it, idx) => (
                        <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-stone-100 font-bold text-stone-900 text-[11px] flex items-center justify-center font-mono-nums shrink-0">
                              {it.quantity}x
                            </span>
                            <span className="font-semibold text-stone-800">{it.item_name}</span>
                          </div>
                          <span className="font-mono-nums text-stone-600">
                            {formatCurrency(it.total_price, currentRestaurant.currency)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-stone-400 italic text-[11px]">Items data loading...</p>
                    )}
                  </div>
                </div>

                {/* Bill Amount & Status Action Buttons */}
                <div className="p-4 bg-stone-50/70 border-t border-stone-100 space-y-3">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold text-stone-600">Total Bill:</span>
                    <span className="font-mono-nums font-bold text-base text-stone-900">
                      {formatCurrency(order.total_amount, currentRestaurant.currency)}
                    </span>
                  </div>

                  {/* Flow Action Buttons */}
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        disabled={isUpdating}
                        className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Start Cooking 🔥</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'served')}
                        disabled={isUpdating}
                        className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Mark as Served 🍽️</span>
                      </button>
                    )}

                    {order.status === 'served' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        disabled={isUpdating}
                        className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Bill ✅</span>
                      </button>
                    )}

                    {order.status === 'completed' && (
                      <span className="text-[11px] font-semibold text-emerald-800 py-1">
                        ✓ Order Completed & Paid
                      </span>
                    )}

                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        disabled={isUpdating}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Cancel Order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
