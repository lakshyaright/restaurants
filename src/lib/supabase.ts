import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

const supabaseUrl = (env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined;
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseAnonKey.includes('...') &&
  supabaseUrl.startsWith('https://')
);

// Graceful client initialization
let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

export const supabase = clientInstance as SupabaseClient;

/**
 * Returns the public URL for a given restaurant menu slug
 */
export function getRestaurantMenuUrl(slug: string): string {
  const baseUrl = (env.VITE_APP_URL as string) || (typeof window !== 'undefined' ? window.location.origin : 'https://techrescue.in');
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}/menu/${slug}`;
}

/**
 * Currency symbol formatter supporting INR and international currencies
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Safe image upload helper to Supabase Storage bucket 'restaurant-assets'
 */
export async function uploadRestaurantAsset(
  file: File,
  restaurantId: string,
  prefix: 'logo' | 'cover' | 'items' = 'items'
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { url: null, error: 'Supabase storage is not configured.' };
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    return { url: null, error: 'Only JPG, PNG, WEBP, and SVG images are supported.' };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, error: 'Image size must be less than 5MB.' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${restaurantId}/${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('restaurant-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from('restaurant-assets').getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown upload error occurred.';
    return { url: null, error: message };
  }
}
