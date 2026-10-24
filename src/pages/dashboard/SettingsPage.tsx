import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Save, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const SettingsPage: React.FC = () => {
  const { user, profile, refreshUserData, signOut, isAdmin } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    setIsSavingProfile(true);
    setProfileFeedback(null);

    try {
      // 1. Update Supabase user metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      // 2. Update profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        });

      if (profileErr) {
        setProfileFeedback({ type: 'error', message: profileErr.message });
      } else {
        await refreshUserData();
        setProfileFeedback({ type: 'success', message: 'Profile updated successfully!' });
      }
    } catch (err: unknown) {
      setProfileFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordFeedback(null);

    try {
      const { error: passErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passErr) {
        setPasswordFeedback({ type: 'error', message: passErr.message });
      } else {
        setPasswordFeedback({ type: 'success', message: 'Password changed successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: unknown) {
      setPasswordFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Account Settings</h1>
        <p className="text-xs text-stone-500 mt-0.5">Manage your personal credentials, profile name, and account security</p>
      </div>

      {/* Profile Form */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-700" />
          <span>Profile Information</span>
        </h3>

        {profileFeedback && (
          <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            profileFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {profileFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{profileFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-900 mb-1">
              Account Email
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3 py-2 border border-stone-200 bg-stone-100 text-stone-500 rounded-lg cursor-not-allowed"
            />
            <p className="text-[11px] text-stone-400 mt-1">Managed via Supabase Auth</p>
          </div>

          <div>
            <label className="block font-semibold text-stone-900 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-900">
              <Shield className="w-4 h-4 text-amber-700 shrink-0" />
              <span>You have Platform Administrator privileges on this account.</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
            >
              {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-700" />
          <span>Change Password</span>
        </h3>

        {passwordFeedback && (
          <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            passwordFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {passwordFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{passwordFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-900 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-900 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
            >
              {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sign Out Card */}
      <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-stone-900">Sign Out of Dashboard</h4>
          <p className="text-[11px] text-stone-500">Safely close your current session on this device.</p>
        </div>
        <button
          onClick={() => signOut().then(() => window.location.href = '/')}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
