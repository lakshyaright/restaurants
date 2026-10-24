import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Restaurant, Profile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  currentRestaurant: Restaurant | null;
  userRestaurants: Restaurant[];
  isLoading: boolean;
  isConfigured: boolean;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  refreshUserData: () => Promise<void>;
  createInitialRestaurant: (name: string, slug: string) => Promise<{ restaurant: Restaurant | null; error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [userRestaurants, setUserRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async (activeUser: User) => {
    if (!supabase) return;

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .maybeSingle();

      if (!profileErr && profileData) {
        setProfile(profileData as Profile);
      } else {
        // Fallback default
        setProfile({
          id: activeUser.id,
          full_name: activeUser.user_metadata?.full_name || activeUser.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // 2. Check Admin status
      const { data: adminData } = await supabase
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', activeUser.id)
        .maybeSingle();

      setIsAdmin(Boolean(adminData));

      // 3. Fetch user's restaurants via memberships
      const { data: memberData, error: memberErr } = await supabase
        .from('restaurant_members')
        .select('restaurant_id, role')
        .eq('user_id', activeUser.id);

      if (!memberErr && memberData && memberData.length > 0) {
        const restaurantIds = memberData.map(m => m.restaurant_id);
        const { data: rests, error: restsErr } = await supabase
          .from('restaurants')
          .select('*')
          .in('id', restaurantIds)
          .order('created_at', { ascending: false });

        if (!restsErr && rests) {
          const typedRests = rests as Restaurant[];
          setUserRestaurants(typedRests);

          // Preserve or set default active restaurant
          setCurrentRestaurant(prev => {
            if (prev && typedRests.some(r => r.id === prev.id)) {
              return typedRests.find(r => r.id === prev.id) || typedRests[0];
            }
            return typedRests[0] || null;
          });
        }
      } else {
        setUserRestaurants([]);
        setCurrentRestaurant(null);
      }
    } catch (err) {
      console.error('Error fetching user data from Supabase:', err);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!user) return;
    await fetchUserData(user);
  }, [user, fetchUserData]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }).catch(err => {
      console.error('Session retrieval error:', err);
      if (isMounted) setIsLoading(false);
    });

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
        setCurrentRestaurant(null);
        setUserRestaurants([]);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const createInitialRestaurant = async (name: string, slug: string): Promise<{ restaurant: Restaurant | null; error: string | null }> => {
    if (!supabase || !user) {
      return { restaurant: null, error: 'User is not authenticated or Supabase is not configured.' };
    }

    try {
      // 1. Check slug uniqueness
      const { data: existingSlug } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existingSlug) {
        return { restaurant: null, error: 'This URL slug is already taken. Please choose another one.' };
      }

      // 2. Insert restaurant
      const { data: newRest, error: restError } = await supabase
        .from('restaurants')
        .insert({
          name: name.trim(),
          slug: slug.toLowerCase().trim(),
          status: 'draft',
          created_by: user.id,
          currency: 'INR',
          default_language: 'en',
          dietary_preference: 'all',
        })
        .select()
        .single();

      if (restError || !newRest) {
        return { restaurant: null, error: restError?.message || 'Failed to create restaurant profile.' };
      }

      // 3. Insert membership as owner
      const { error: memberError } = await supabase
        .from('restaurant_members')
        .insert({
          restaurant_id: newRest.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        console.error('Membership assignment error:', memberError);
      }

      // 4. Create default initial menu categories (Starters, Main Course, Beverages)
      await supabase.from('categories').insert([
        { restaurant_id: newRest.id, name: 'Starters & Appetizers', sort_order: 1, is_active: true },
        { restaurant_id: newRest.id, name: 'Main Course', sort_order: 2, is_active: true },
        { restaurant_id: newRest.id, name: 'Beverages & Desserts', sort_order: 3, is_active: true },
      ]);

      const created = newRest as Restaurant;
      await refreshUserData();
      setCurrentRestaurant(created);
      return { restaurant: created, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred creating your restaurant.';
      return { restaurant: null, error: msg };
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setCurrentRestaurant(null);
    setUserRestaurants([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        currentRestaurant,
        userRestaurants,
        isLoading,
        isConfigured: isSupabaseConfigured,
        setCurrentRestaurant,
        refreshUserData,
        createInitialRestaurant,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
