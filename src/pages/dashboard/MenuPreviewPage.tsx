import React from 'react';
import { ExternalLink, Smartphone, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PublicMenuPage } from '../public/PublicMenuPage';
import { getRestaurantMenuUrl } from '../../lib/supabase';

export const MenuPreviewPage: React.FC = () => {
  const { currentRestaurant } = useAuth();
  const [reloadKey, setReloadKey] = React.useState(0);

  if (!currentRestaurant) return null;

  const publicUrl = getRestaurantMenuUrl(currentRestaurant.slug);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Customer Menu Preview</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Test how diners view and interact with your menu on their mobile smartphones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey(prev => prev + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Preview</span>
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            <span>Open in New Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded Phone Mockup */}
      <div className="flex justify-center py-4">
        <div className="relative w-full max-w-[420px] rounded-[3rem] p-3.5 bg-stone-900 shadow-2xl ring-1 ring-stone-800 border-4 border-stone-800">
          {/* Top Speaker Bezel */}
          <div className="w-28 h-4 bg-stone-950 rounded-full mx-auto mb-3 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-stone-800"></div>
          </div>

          {/* Embedded Scrollable Screen */}
          <div className="bg-stone-50 rounded-[2.2rem] overflow-hidden border border-stone-200 h-[720px] overflow-y-auto">
            <PublicMenuPage
              key={reloadKey}
              previewMode={true}
              forcedRestaurant={currentRestaurant}
            />
          </div>

          {/* Bottom Home Indicator Line */}
          <div className="w-32 h-1 bg-stone-700 rounded-full mx-auto mt-3" />
        </div>
      </div>
    </div>
  );
};
