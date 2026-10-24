import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
  Bell,
  BellRing,
  Coffee,
  Receipt,
  Check,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, formatCurrency } from '../../lib/supabase';
import type { Order, OrderStatus, WaiterCall, WaiterCallStatus } from '../../types';

export const OrdersPage: React.FC = () => {
  const { currentRestaurant } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all_active' | 'orders' | 'waiter_calls' | 'completed'>('all_active');
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [callUpdatingId, setCallUpdatingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const prevPendingCallsCount = useRef<number>(0);
  const prevPendingOrdersCount = useRef<number>(0);

  // Synthesized Web Audio chime (no external audio file required)
  const playAlertChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch {
      // AudioContext blocked before interaction
    }
  };

  const fetchOrdersAndCalls = async (silent = false) => {
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
        setErrorFeedback(ordersErr.message);
        setOrders([]);
      } else if (ordersData) {
        const orderIds = ordersData.map(o => o.id);
        
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

        const newPendingOrders = hydratedOrders.filter(o => o.status === 'pending').length;
        if (silent && soundEnabled && newPendingOrders > prevPendingOrdersCount.current) {
          playAlertChime();
        }
        prevPendingOrdersCount.current = newPendingOrders;
        setOrders(hydratedOrders);
      }

      // 2. Fetch Waiter Calls
      const { data: callsData, error: callsErr } = await supabase
        .from('waiter_calls')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('created_at', { ascending: false });

      if (!callsErr && callsData) {
        const currentPendingCalls = (callsData as WaiterCall[]).filter(c => c.status === 'pending').length;
        if (silent && soundEnabled && currentPendingCalls > prevPendingCallsCount.current) {
          playAlertChime();
        }
        prevPendingCallsCount.current = currentPendingCalls;
        setWaiterCalls(callsData as WaiterCall[]);
      }
    } catch (err: unknown) {
      setErrorFeedback(err instanceof Error ? err.message : 'Error fetching dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndCalls();

    // Auto-poll orders & waiter calls every 5 seconds
    const interval = setInterval(() => {
      fetchOrdersAndCalls(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentRestaurant, soundEnabled]);

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

  const handleUpdateCallStatus = async (callId: string, nextStatus: WaiterCallStatus) => {
    if (!supabase) return;
    setCallUpdatingId(callId);

    try {
      const { error } = await supabase
        .from('waiter_calls')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', callId);

      if (!error) {
        setWaiterCalls(prev => prev.map(c => c.id === callId ? { ...c, status: nextStatus } : c));
      } else {
        setErrorFeedback(error.message);
      }
    } catch (err) {
      console.error('Update call status error:', err);
    } finally {
      setCallUpdatingId(null);
    }
  };

  const handleDeleteCall = async (callId: string) => {
    if (!supabase) return;
    try {
      await supabase.from('waiter_calls').delete().eq('id', callId);
      setWaiterCalls(prev => prev.filter(c => c.id !== callId));
    } catch (err) {
      console.error('Delete call error:', err);
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

  const pendingCalls = waiterCalls.filter(c => c.status === 'pending' || c.status === 'attending');
  const completedCalls = waiterCalls.filter(c => c.status === 'completed' || c.status === 'dismissed');

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>New Order Received</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <ChefHat className="w-3.5 h-3.5 text-blue-600" />
            <span>Cooking in Kitchen</span>
          </span>
        );
      case 'served':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Utensils className="w-3.5 h-3.5 text-purple-600" />
            <span>Served to Table</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span>Cancelled</span>
          </span>
        );
    }
  };

  const getCallTypeBadge = (type: string) => {
    switch (type) {
      case 'take_order':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <ChefHat className="w-3 h-3 text-amber-700" />
            <span>Take Order (ऑर्डर लेने आएं)</span>
          </span>
        );
      case 'water':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <Coffee className="w-3 h-3 text-sky-600" />
            <span>Water / पानी</span>
          </span>
        );
      case 'bill':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Receipt className="w-3 h-3 text-emerald-600" />
            <span>Bill / बिल</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
            <Utensils className="w-3 h-3 text-stone-600" />
            <span>Assistance / मदद</span>
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
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Live Kitchen Orders & Waiter Calls</h1>
            {(activeOrders.length > 0 || pendingCalls.length > 0) && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white font-mono-nums">
                {activeOrders.length + pendingCalls.length} Active
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Live orders and table assistance notifications requested directly by customers from their phones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playAlertChime();
            }}
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              soundEnabled ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold' : 'bg-stone-100 text-stone-500 border-stone-200'
            }`}
            title={soundEnabled ? 'Alert chime enabled' : 'Alert chime muted'}
          >
            <div className="flex items-center gap-1.5">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
            </div>
          </button>

          <button
            onClick={() => fetchOrdersAndCalls(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg shadow-xs transition-colors cursor-pointer"
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
            <span>Database Table Migration Notice</span>
          </div>
          <p className="text-stone-600">
            If orders or waiter calls don&apos;t appear, please make sure you executed the SQL migration in your Supabase SQL Editor:
            <code className="block mt-1 font-mono bg-stone-100 p-2 rounded text-stone-800">
              supabase/migrations/20261024000002_waiter_calls.sql
            </code>
          </p>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. URGENT WAITER CALLS HERO SECTION (If any customer called waiter)  */}
      {/* ==================================================================== */}
      {pendingCalls.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl border-2 border-amber-400 p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-stone-950 text-base">
                    Active Waiter Calls (वेटर कॉल्स)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white animate-pulse">
                    {pendingCalls.length} Waiting
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  Customers requested staff to come to their table to take an order or provide service.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingCalls.map((call) => {
              const isUpdating = callUpdatingId === call.id;
              return (
                <div
                  key={call.id}
                  className="bg-white rounded-xl border border-amber-300 p-3.5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-mono font-bold text-xs">
                          {call.table_number}
                        </span>
                        {getCallTypeBadge(call.request_type)}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono-nums">
                        {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {call.notes && (
                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-stone-800 italic">
                        &quot;{call.notes}&quot;
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-stone-600">
                      <span className={`w-2 h-2 rounded-full ${call.status === 'attending' ? 'bg-blue-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
                      <span className="font-semibold text-stone-800">
                        {call.status === 'attending' ? 'Staff Walking to Table 🏃' : 'Diner is waiting at table'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                    {call.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateCallStatus(call.id, 'attending')}
                        disabled={isUpdating}
                        className="flex-1 py-1.5 px-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>I&apos;m Attending 🏃</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleUpdateCallStatus(call.id, 'completed')}
                      disabled={isUpdating}
                      className="flex-1 py-1.5 px-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Order Taken / Done ✅</span>
                    </button>

                    <button
                      onClick={() => handleUpdateCallStatus(call.id, 'dismissed')}
                      disabled={isUpdating}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                      title="Dismiss"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all_active')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'all_active' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200/60'
          }`}
        >
          All Active ({activeOrders.length + pendingCalls.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'orders' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200/60'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Food Orders ({activeOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('waiter_calls')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'waiter_calls' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200/60'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Waiter Calls ({pendingCalls.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'completed' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200/60'
          }`}
        >
          History & Completed ({completedOrders.length + completedCalls.length})
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-stone-500">
          <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mx-auto mb-2" />
          <p>Connecting to kitchen live orders & waiter calls...</p>
        </div>
      ) : activeTab === 'waiter_calls' ? (
        // Dedicated Waiter Calls View
        waiterCalls.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">No Waiter Calls Right Now</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              When diners tap &quot;Call Waiter (वेटर बुलाएं)&quot; from their phone menu, their table request will alert you here immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waiterCalls.map((call) => (
              <div
                key={call.id}
                className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 ${
                  call.status === 'pending'
                    ? 'border-amber-400 ring-2 ring-amber-200/50'
                    : call.status === 'attending'
                    ? 'border-blue-300'
                    : 'border-stone-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-mono font-bold text-xs">
                      {call.table_number}
                    </span>
                    {getCallTypeBadge(call.request_type)}
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono-nums">
                    {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {call.notes && (
                  <p className="text-xs text-stone-600 italic bg-stone-50 p-2 rounded-lg border border-stone-100">
                    &quot;{call.notes}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <span className="font-semibold text-stone-700 capitalize">
                    Status: {call.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {call.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateCallStatus(call.id, 'completed')}
                        className="px-2.5 py-1 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800 cursor-pointer"
                      >
                        Mark Done
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCall(call.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'completed' ? (
        // Completed History View
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-stone-900">Completed Orders ({completedOrders.length})</h3>
            {completedOrders.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No completed orders yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-stone-200 p-4 text-xs space-y-2 opacity-80">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-stone-900">{order.order_number} ({order.table_number})</span>
                      <span className="font-mono-nums font-bold text-emerald-700">
                        {formatCurrency(order.total_amount, currentRestaurant.currency)}
                      </span>
                    </div>
                    <p className="text-stone-500 text-[11px]">
                      {new Date(order.created_at).toLocaleString()} · {order.items?.length || 0} items
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Orders Grid (All Active or Food Orders)
        activeOrders.length === 0 && pendingCalls.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">No Active Orders or Calls</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              When diners scan your QR code at their table and place food orders or call the waiter, their tickets will appear here with instant live alerts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeOrders.map((order) => {
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

                      <div>{getOrderStatusBadge(order.status)}</div>
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
                          className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Start Cooking 🔥</span>
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'served')}
                          disabled={isUpdating}
                          className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          <span>Mark as Served 🍽️</span>
                        </button>
                      )}

                      {order.status === 'served' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          disabled={isUpdating}
                          className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
        )
      )}
    </div>
  );
};
