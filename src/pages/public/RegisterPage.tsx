import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Mail, Lock, User, Store, AlertCircle, ArrowRight, Loader2, Database, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SetupNoticeModal } from '../../components/common/SetupNoticeModal';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  React.useEffect(() => {
    if (user && !successMessage) {
      navigate('/dashboard');
    }
  }, [user, navigate, successMessage]);

  const handleNameChange = (val: string) => {
    setRestaurantName(val);
    if (autoSlug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setRestaurantSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured yet. Please configure your .env credentials to enable registration.');
      setSetupModalOpen(true);
      return;
    }

    if (!fullName.trim() || !email.trim() || !password || !restaurantName.trim() || !restaurantSlug.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const cleanSlug = restaurantSlug.toLowerCase().trim();
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      setError('URL Slug can only contain lowercase letters, numbers, and hyphens (e.g., cafe-raj).');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if slug already exists
      const { data: existingSlug } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (existingSlug) {
        setError(`The menu URL slug "${cleanSlug}" is already in use by another restaurant. Please choose a different slug.`);
        setIsLoading(false);
        return;
      }

      // 2. Register user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      const newUser = authData.user;
      if (!newUser) {
        setError('Failed to create account. Please try again.');
        setIsLoading(false);
        return;
      }

      // If Supabase has email confirmation enabled and session is not immediately returned
      if (!authData.session) {
        setSuccessMessage('Registration initiated! A verification link has been sent to your email. Please verify your email, then sign in to access your restaurant dashboard.');
        setIsLoading(false);
        return;
      }

      // 3. Insert initial restaurant profile
      const { data: newRest, error: restError } = await supabase
        .from('restaurants')
        .insert({
          name: restaurantName.trim(),
          slug: cleanSlug,
          status: 'draft',
          created_by: newUser.id,
          currency: 'INR',
          default_language: 'en',
          dietary_preference: 'all',
        })
        .select()
        .single();

      if (restError) {
        console.error('Restaurant record creation error:', restError);
      } else if (newRest) {
        // 4. Insert owner membership
        await supabase.from('restaurant_members').insert({
          restaurant_id: newRest.id,
          user_id: newUser.id,
          role: 'owner',
        });

        // 5. Insert starter categories
        await supabase.from('categories').insert([
          { restaurant_id: newRest.id, name: 'Starters & Appetizers', sort_order: 1, is_active: true },
          { restaurant_id: newRest.id, name: 'Main Course', sort_order: 2, is_active: true },
          { restaurant_id: newRest.id, name: 'Beverages & Desserts', sort_order: 3, is_active: true },
        ]);
      }

      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration error occurred.';
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
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">Create your restaurant menu</h2>
        <p className="mt-2 text-xs text-stone-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800 underline">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-stone-200 sm:rounded-xl sm:px-10">
          {!isSupabaseConfigured && (
            <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Database className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Supabase Configuration Required</p>
                <p className="mt-0.5 text-stone-600">
                  Real database persistence requires adding your Supabase project keys to .env.
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

          {successMessage && (
            <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Account Created</span>
              </div>
              <p className="leading-relaxed text-stone-600">{successMessage}</p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline"
                >
                  Proceed to Login →
                </Link>
              </div>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-900 mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-900 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@your-restaurant.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-900 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-900 mb-1">
                    Restaurant / Cafe Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={restaurantName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Royal Punjab Dhaba"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <Store className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-900">
                      Public Menu URL Slug
                    </label>
                    <span className="text-[10px] text-stone-400">Unique identifier</span>
                  </div>
                  <div className="flex rounded-lg border border-stone-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600">
                    <span className="px-2.5 py-2 bg-stone-100 text-stone-500 text-xs border-r border-stone-300 select-none">
                      /menu/
                    </span>
                    <input
                      type="text"
                      required
                      value={restaurantSlug}
                      onChange={(e) => {
                        setAutoSlug(false);
                        setRestaurantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      }}
                      placeholder="royal-punjab"
                      className="w-full px-2.5 py-2 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Your QR code and table link will point to:{' '}
                    <span className="font-mono text-emerald-800">
                      techrescue.in/menu/{restaurantSlug || 'your-slug'}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mt-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating your restaurant...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Digital Menu</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <SetupNoticeModal isOpen={setupModalOpen} onClose={() => setSetupModalOpen(false)} />
    </div>
  );
};
