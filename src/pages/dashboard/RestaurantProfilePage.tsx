import React, { useState, useEffect } from 'react';
import { 
  Store, 
  MapPin, 
  Phone, 
  Clock, 
  Save, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, uploadRestaurantAsset, getRestaurantMenuUrl } from '../../lib/supabase';
import type { WeeklySchedule, DaySchedule } from '../../types';

const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { open: '09:00', close: '22:00', closed: false },
  tuesday: { open: '09:00', close: '22:00', closed: false },
  wednesday: { open: '09:00', close: '22:00', closed: false },
  thursday: { open: '09:00', close: '22:00', closed: false },
  friday: { open: '09:00', close: '23:00', closed: false },
  saturday: { open: '09:00', close: '23:00', closed: false },
  sunday: { open: '09:00', close: '22:00', closed: false },
};

export const RestaurantProfilePage: React.FC = () => {
  const { currentRestaurant, refreshUserData } = useAuth();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [dietaryPreference, setDietaryPreference] = useState('all');
  const [status, setStatus] = useState<'draft' | 'published' | 'suspended'>('draft');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (currentRestaurant) {
      setName(currentRestaurant.name || '');
      setSlug(currentRestaurant.slug || '');
      setDescription(currentRestaurant.description || '');
      setAddress(currentRestaurant.address || '');
      setPhone(currentRestaurant.phone || '');
      setCurrency(currentRestaurant.currency || 'INR');
      setDietaryPreference(currentRestaurant.dietary_preference || 'all');
      setStatus(currentRestaurant.status || 'draft');
      setLogoUrl(currentRestaurant.logo_url || '');
      setCoverImageUrl(currentRestaurant.cover_image_url || '');
      if (currentRestaurant.opening_hours) {
        setSchedule(currentRestaurant.opening_hours);
      }
    }
  }, [currentRestaurant]);

  if (!currentRestaurant) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setFeedback(null);
    const { url, error } = await uploadRestaurantAsset(file, currentRestaurant.id, 'logo');
    setIsUploadingLogo(false);

    if (error) {
      setFeedback({ type: 'error', message: `Logo upload failed: ${error}` });
    } else if (url) {
      setLogoUrl(url);
      setFeedback({ type: 'success', message: 'Logo uploaded successfully! Remember to save changes.' });
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setFeedback(null);
    const { url, error } = await uploadRestaurantAsset(file, currentRestaurant.id, 'cover');
    setIsUploadingCover(false);

    if (error) {
      setFeedback({ type: 'error', message: `Cover image upload failed: ${error}` });
    } else if (url) {
      setCoverImageUrl(url);
      setFeedback({ type: 'success', message: 'Cover photo uploaded successfully! Remember to save changes.' });
    }
  };

  const handleDayChange = (day: keyof WeeklySchedule, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setFeedback(null);
    const cleanSlug = slug.toLowerCase().trim();

    if (!cleanSlug || !/^[a-z0-9-]+$/.test(cleanSlug)) {
      setFeedback({ type: 'error', message: 'URL slug may only contain lowercase letters, numbers, and hyphens.' });
      return;
    }

    setIsSaving(true);
    try {
      // If slug has changed, verify uniqueness
      if (cleanSlug !== currentRestaurant.slug) {
        const { data: existing } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', cleanSlug)
          .neq('id', currentRestaurant.id)
          .maybeSingle();

        if (existing) {
          setFeedback({ type: 'error', message: `URL slug "${cleanSlug}" is already in use by another restaurant.` });
          setIsSaving(false);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          name: name.trim(),
          slug: cleanSlug,
          description: description.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
          currency: currency.toUpperCase().trim(),
          dietary_preference: dietaryPreference,
          status,
          logo_url: logoUrl || null,
          cover_image_url: coverImageUrl || null,
          opening_hours: schedule,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentRestaurant.id);

      if (updateError) {
        setFeedback({ type: 'error', message: updateError.message });
      } else {
        await refreshUserData();
        setFeedback({ type: 'success', message: 'Restaurant profile saved successfully!' });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const daysList: { key: keyof WeeklySchedule; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Restaurant Profile</h1>
          <p className="text-xs text-stone-500 mt-0.5">Manage your eatery brand, menu slug, operating hours, and imagery</p>
        </div>
        <a
          href={getRestaurantMenuUrl(slug || currentRestaurant.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <span>Preview Public View</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Core Identity */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
            Brand Identity & Visibility
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-900 mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-900 mb-1">
                URL Identifier Slug *
              </label>
              <div className="flex rounded-lg border border-stone-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600">
                <span className="px-2.5 py-2 bg-stone-100 text-stone-500 text-xs border-r border-stone-300">
                  /menu/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-2.5 py-2 text-xs focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-900 mb-1">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'suspended')}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="published">Published (Visible to customers)</option>
                <option value="draft">Draft (Hidden from public URL)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-900 mb-1">
                Menu Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="AED">AED (د.إ - UAE Dirham)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-900 mb-1">
              Short Description / Cuisine Specialization
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Authentic coastal seafood, stone-baked pizzas, and heritage filter coffee."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Visual Assets: Logo & Cover Photo */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
            Visual Assets & Photos
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Logo */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-stone-900">
                Restaurant Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Store className="w-6 h-6 text-stone-400" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg cursor-pointer transition-colors border border-stone-300">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={isUploadingLogo} />
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Or enter direct image URL"
                    className="w-full px-2.5 py-1 text-[11px] border border-stone-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Cover Banner */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-stone-900">
                Header Cover Photo
              </label>
              <div className="space-y-2">
                <div className="h-16 w-full rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                  {coverImageUrl ? (
                    <img src={coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[11px] text-stone-400">No cover image uploaded</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg cursor-pointer transition-colors border border-stone-300 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingCover ? 'Uploading...' : 'Upload Cover'}</span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={isUploadingCover} />
                  </label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="Or enter direct image URL"
                    className="w-full px-2.5 py-1 text-[11px] border border-stone-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Location Details */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
            Location & Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-900 mb-1">
                Dining Room Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot 12, Main Street, Indiranagar"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-900 mb-1">
                Contact Phone / Reservation Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours by Day */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>Weekly Operating Hours</span>
            </h3>
            <span className="text-[11px] text-stone-500">Automatically shows Open/Closed status to diners</span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {daysList.map(({ key, label }) => {
              const day = schedule[key] || { open: '09:00', close: '22:00', closed: false };
              return (
                <div key={key} className="py-2.5 flex items-center justify-between gap-4">
                  <span className="w-24 font-medium text-stone-800">{label}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-stone-600">
                      <input
                        type="checkbox"
                        checked={day.closed}
                        onChange={(e) => handleDayChange(key, 'closed', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Closed</span>
                    </label>

                    {!day.closed && (
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <input
                          type="time"
                          value={day.open}
                          onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                          className="px-2 py-1 border border-stone-300 rounded-md bg-stone-50"
                        />
                        <span className="text-stone-400">to</span>
                        <input
                          type="time"
                          value={day.close}
                          onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                          className="px-2 py-1 border border-stone-300 rounded-md bg-stone-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Changes...' : 'Save Restaurant Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
