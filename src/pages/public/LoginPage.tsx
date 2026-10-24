import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { QrCode, Mail, Lock, AlertCircle, ArrowRight, Loader2, Database } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SetupNoticeModal } from '../../components/common/SetupNoticeModal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  // If already logged in, redirect to dashboard or intended target
  React.useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured yet. Please configure your .env credentials to enable authentication.');
      setSetupModalOpen(true);
      return;
    }

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during sign in.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-stone-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 text-stone-900 font-bold text-xl mb-4 group">
          <span className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <QrCode className="w-5 h-5" />
          </span>
          <span>TechRescue Digital Menu</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">Sign in to your restaurant</h2>
        <p className="mt-2 text-xs text-stone-600">
          Or{' '}
          <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800 underline">
            register a new restaurant profile
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-stone-200 sm:rounded-xl sm:px-10">
          {!isSupabaseConfigured && (
            <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Database className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Supabase Keys Required</p>
                <p className="mt-0.5 text-stone-600">
                  Authentication requires valid Supabase credentials in your .env file.
                </p>
                <button
                  type="button"
                  onClick={() => setSetupModalOpen(true)}
                  className="mt-1.5 font-bold text-emerald-800 underline block"
                >
                  View Setup Instructions & SQL Schema
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-stone-900 mb-1">
                Owner Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@your-restaurant.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-900">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-emerald-700 hover:text-emerald-800">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-200 text-center">
            <Link to="/menu/cafe-raj" className="text-xs text-stone-500 hover:text-stone-800 underline">
              Browse the live customer demo menu without logging in →
            </Link>
          </div>
        </div>
      </div>

      <SetupNoticeModal isOpen={setupModalOpen} onClose={() => setSetupModalOpen(false)} />
    </div>
  );
};
