import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Layers, 
  UtensilsCrossed, 
  QrCode, 
  Eye, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X,
  ShieldAlert,
  PlusCircle,
  Shield,
  Loader2,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SetupNoticeModal } from '../../components/common/SetupNoticeModal';

export const DashboardLayout: React.FC = () => {
  const { 
    user, 
    isLoading, 
    currentRestaurant, 
    userRestaurants, 
    setCurrentRestaurant, 
    signOut, 
    isAdmin, 
    isConfigured, 
    createInitialRestaurant 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  // Initial Restaurant Creation Modal state (if logged in user has no restaurant yet)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRestName, setNewRestName] = useState('');
  const [newRestSlug, setNewRestSlug] = useState('');
  const [isCreatingRest, setIsCreatingRest] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Protected route check
  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [user, isLoading, navigate, location]);

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestName.trim() || !newRestSlug.trim()) {
      setCreateError('Please provide restaurant name and slug.');
      return;
    }
    setIsCreatingRest(true);
    setCreateError(null);

    const { restaurant, error } = await createInitialRestaurant(newRestName, newRestSlug);
    setIsCreatingRest(false);

    if (error) {
      setCreateError(error);
    } else if (restaurant) {
      setShowCreateModal(false);
      setNewRestName('');
      setNewRestSlug('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mb-3" />
        <p className="text-sm font-semibold text-stone-800">Loading your restaurant dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'Live Orders & Calls', to: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Restaurant Profile', to: '/dashboard/restaurant', icon: Store },
    { name: 'Menu Categories', to: '/dashboard/categories', icon: Layers },
    { name: 'Food & Menu Items', to: '/dashboard/menu-items', icon: UtensilsCrossed },
    { name: 'QR Code Generator', to: '/dashboard/qr-code', icon: QrCode },
    { name: 'Customer Preview', to: '/dashboard/preview', icon: Eye },
    { name: 'Account Settings', to: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Configuration alert if Supabase is pending */}
      {!isConfigured && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Supabase environment credentials not configured yet. Live database saves will be inactive until connected.</span>
          </div>
          <button
            onClick={() => setSetupModalOpen(true)}
            className="underline hover:text-white cursor-pointer ml-4 font-bold"
          >
            Setup Guide & SQL
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (240px-260px) */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-stone-900 text-stone-300 border-r border-stone-800 shrink-0">
          {/* Brand header */}
          <div className="p-4 border-b border-stone-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight block">TechRescue Menu</span>
              <span className="text-[10px] text-stone-400 block -mt-0.5">Owner Dashboard</span>
            </div>
          </div>

          {/* Restaurant Switcher or Active Outlet Pill */}
          <div className="p-3 border-b border-stone-800 bg-stone-950/40">
            {currentRestaurant ? (
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
                  Active Restaurant
                </div>
                {userRestaurants.length > 1 ? (
                  <select
                    value={currentRestaurant.id}
                    onChange={(e) => {
                      const selected = userRestaurants.find(r => r.id === e.target.value);
                      if (selected) setCurrentRestaurant(selected);
                    }}
                    className="w-full bg-stone-800 text-xs text-white border border-stone-700 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {userRestaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span className="truncate">{currentRestaurant.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      currentRestaurant.status === 'published' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-stone-800 text-stone-400'
                    }`}>
                      {currentRestaurant.status}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-2 px-3 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Restaurant</span>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-800 text-white'
                        : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {isAdmin && (
              <div className="pt-3 mt-3 border-t border-stone-800">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-amber-300 hover:bg-stone-800/60 transition-colors"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Platform Admin Area</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Live Link Button and Sign Out */}
          <div className="p-3 border-t border-stone-800 space-y-2">
            {currentRestaurant && (
              <a
                href={`/menu/${currentRestaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-stone-800/80 hover:bg-stone-800 rounded-lg transition-colors border border-stone-700/60"
              >
                <span className="truncate">View Public Menu</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            )}

            <button
              onClick={() => signOut().then(() => navigate('/'))}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-lg transition-colors text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar Navigation */}
          <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
            {/* Mobile menu button */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-stone-600 hover:bg-stone-100"
                aria-label="Toggle Dashboard Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <span className="font-bold text-sm text-stone-900">TechRescue Menu</span>
            </div>

            {/* Breadcrumb path */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-stone-500 font-medium">
              <Link to="/dashboard" className="hover:text-stone-900">Dashboard</Link>
              <span>/</span>
              <span className="text-stone-900 font-semibold">
                {currentRestaurant ? currentRestaurant.name : 'No Restaurant Active'}
              </span>
            </div>

            {/* Right Top Bar Actions */}
            <div className="flex items-center gap-3">
              {currentRestaurant && (
                <a
                  href={`/menu/${currentRestaurant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Public Menu</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </a>
              )}

              <Link
                to="/dashboard/qr-code"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Standee</span>
              </Link>
            </div>
          </header>

          {/* Mobile drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-stone-900 text-stone-300 p-4 border-b border-stone-800 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive ? 'bg-emerald-800 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
              <div className="pt-3 border-t border-stone-800 flex justify-between">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut().then(() => navigate('/'));
                  }}
                  className="text-xs text-stone-400 hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Main Viewport Content */}
          <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
            {!currentRestaurant ? (
              <div className="bg-white p-8 rounded-xl border border-stone-200 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl mx-auto flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Create Your First Restaurant</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  You don&apos;t have an active restaurant profile linked to your account yet. Let&apos;s set up your restaurant name and URL slug.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Setup Restaurant Profile Now
                </button>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>

      {/* Create Restaurant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-stone-900">Add Restaurant Profile</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateRestaurant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-900 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={newRestName}
                  onChange={(e) => {
                    setNewRestName(e.target.value);
                    setNewRestSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'));
                  }}
                  placeholder="e.g. Royal Chai House"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-900 mb-1">
                  URL Slug (techrescue.in/menu/...)
                </label>
                <input
                  type="text"
                  required
                  value={newRestSlug}
                  onChange={(e) => setNewRestSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="royal-chai-house"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRest}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg"
                >
                  {isCreatingRest ? 'Creating...' : 'Create Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SetupNoticeModal isOpen={setupModalOpen} onClose={() => setSetupModalOpen(false)} />
    </div>
  );
};
