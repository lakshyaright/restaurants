import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface SetupNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupNoticeModal: React.FC<SetupNoticeModalProps> = ({ isOpen, onClose }) => {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  if (!isOpen) return null;

  const envSample = `# Add to your .env file in the project root:
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
VITE_APP_URL="${window.location.origin}"`;

  const copyToClipboard = (text: string, type: 'env' | 'sql') => {
    navigator.clipboard.writeText(text);
    if (type === 'env') {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } else {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  const testConnection = async () => {
    setTestResult({ status: 'testing' });
    if (!isSupabaseConfigured || !supabase) {
      setTestResult({
        status: 'error',
        message: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env',
      });
      return;
    }
    try {
      const { error } = await supabase.from('restaurants').select('count', { count: 'exact', head: true });
      if (error) {
        setTestResult({
          status: 'error',
          message: `Connected to Supabase, but query failed: ${error.message}. Please verify you ran the SQL migration.`,
        });
      } else {
        setTestResult({
          status: 'success',
          message: 'Connection verified successfully! Database schema and tables are active.',
        });
      }
    } catch (err: unknown) {
      setTestResult({
        status: 'error',
        message: err instanceof Error ? err.message : 'Connection failed',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base">Supabase Database & Auth Setup</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Alert */}
          <div className={`p-4 rounded-lg flex items-start gap-3 border ${
            isSupabaseConfigured ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {isSupabaseConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-semibold">
                {isSupabaseConfigured ? 'Supabase Credentials Detected' : 'Supabase Not Configured'}
              </p>
              <p className="text-xs mt-1 leading-relaxed text-stone-600">
                {isSupabaseConfigured
                  ? 'Your environment variables are set. Click "Test Live Connection" below to confirm table access.'
                  : 'Follow the 2 simple steps below to connect your own free Supabase PostgreSQL database and enable real cloud authentication.'}
              </p>
            </div>
          </div>

          {/* Step 1: Environment Variables */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-stone-900">Step 1: Set Environment Variables in .env</h4>
              <button
                onClick={() => copyToClipboard(envSample, 'env')}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEnv ? 'Copied' : 'Copy Template'}
              </button>
            </div>
            <pre className="p-3 bg-stone-900 text-emerald-400 text-xs rounded-lg overflow-x-auto font-mono">
              {envSample}
            </pre>
            <p className="text-xs text-stone-500">
              Obtain your project URL & Anon Key from your{' '}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5 text-emerald-700">
                Supabase Dashboard <ExternalLink className="w-3 h-3" />
              </a>{' '}
              under Project Settings &gt; API.
            </p>
          </div>

          {/* Step 2: SQL Migration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-stone-900">Step 2: Run SQL Schema in Supabase SQL Editor</h4>
              <button
                onClick={() => {
                  fetch('/supabase/migrations/20261024000000_techrescue_digital_menu.sql')
                    .then(res => res.text())
                    .then(text => copyToClipboard(text, 'sql'))
                    .catch(() => copyToClipboard('-- Run migration from /supabase/migrations/20261024000000_techrescue_digital_menu.sql', 'sql'));
                }}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Copied SQL' : 'Copy Full Migration SQL'}
              </button>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Open your Supabase project&apos;s SQL Editor, paste the contents of{' '}
              <code className="text-xs bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">
                supabase/migrations/20261024000000_techrescue_digital_menu.sql
              </code>
              , and click <strong>Run</strong>. This creates all tables (`profiles`, `restaurants`, `categories`, `menu_items`, `restaurant_members`, `platform_admins`), indexes, and Row Level Security policies.
            </p>
          </div>

          {/* Step 3: Test Connection */}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-stone-900">Step 3: Verify Live Integration</h4>
                <p className="text-xs text-stone-500">Run a test query against your Supabase tables.</p>
              </div>
              <button
                onClick={testConnection}
                disabled={testResult.status === 'testing'}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
              >
                {testResult.status === 'testing' ? 'Querying...' : 'Test Live Connection'}
              </button>
            </div>

            {testResult.status === 'success' && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{testResult.message}</span>
              </div>
            )}
            {testResult.status === 'error' && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export const SetupBanner: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  if (isSupabaseConfigured) return null;

  return (
    <>
      <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-medium text-center flex items-center justify-center gap-2 border-b border-amber-600">
        <ShieldAlert className="w-4 h-4 shrink-0 text-stone-950" />
        <span>
          Supabase environment variables not configured yet. Live database persistence requires your project keys.
        </span>
        <button
          onClick={() => setModalOpen(true)}
          className="ml-2 font-bold underline hover:text-stone-900 cursor-pointer"
        >
          View Setup Instructions & SQL
        </button>
      </div>
      <SetupNoticeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
