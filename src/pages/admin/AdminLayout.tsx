import React from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Store, 
  BarChart3, 
  ArrowLeft, 
  LogOut, 
  AlertTriangle,
  QrCode,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [user, isLoading, navigate, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-center text-white">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs font-semibold">Verifying platform administrator authorization...</p>
      </div>
    );
  }

  if (!user) return null;

  // If user is authenticated but not in platform_admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-stone-900">Access Restricted</h1>
        <p className="text-xs text-stone-600 max-w-md mt-2 leading-relaxed">
          Your account (<span className="font-mono text-stone-800">{user.email}</span>) does not have Platform Administrator authorization. Platform privileges must be securely provisioned via Supabase SQL:
        </p>
        <div className="mt-3 p-3 bg-stone-900 text-emerald-400 text-xs font-mono rounded-lg max-w-lg text-left overflow-x-auto">
          INSERT INTO public.platform_admins (user_id) VALUES (&apos;{user.id}&apos;);
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800"
          >
            Return to Owner Dashboard
          </Link>
          <Link
            to="/"
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  const adminNav = [
    { name: 'Admin Overview', to: '/admin', icon: BarChart3, end: true },
    { name: 'Restaurant Management', to: '/admin/restaurants', icon: Store },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Top Banner indicating Platform Super-Admin Mode */}
      <div className="bg-stone-950 text-white border-b border-stone-800 px-4 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-amber-400">TechRescue Platform Administration</span>
          <span className="text-stone-500">· Authenticated Administrator ({user.email})</span>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-stone-400 hover:text-white underline"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Exit to Owner Dashboard</span>
        </Link>
      </div>

      <div className="flex-1 flex">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-stone-900 text-stone-300 border-r border-stone-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-stone-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">TechRescue HQ</span>
              <span className="text-[10px] text-amber-400 block -mt-0.5">Platform Controller</span>
            </div>
          </div>

          <nav className="p-3 space-y-1 flex-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-stone-800">
            <button
              onClick={() => signOut().then(() => navigate('/'))}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
