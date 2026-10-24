import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  QrCode, 
  Smartphone, 
  Clock, 
  Layers, 
  SlidersHorizontal, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { SetupBanner } from '../../components/common/SetupNoticeModal';

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  const featureGroups = [
    {
      title: 'Digital Menu Builder & Organization',
      description: 'Easily design and structure full menus with unlimited categories, multi-item variations, and rich descriptions.',
      icon: Layers,
      items: [
        'Multi-category sorting (Starters, Mains, Desserts, Cocktails, Chef Specials)',
        'Dietary markers: Veg, Non-Veg, Egg-containing, and 100% Vegan indicators',
        'Allergen disclosures: Clear indicators for gluten, dairy, nuts, soy, and shellfish',
        'Discount pricing: Highlight promotional prices with strikethrough original prices',
      ],
    },
    {
      title: 'Live Floor Availability & 86ing',
      description: 'Never disappoint a customer with an out-of-stock dish. Toggle dish availability instantly from any phone or kitchen tablet.',
      icon: Clock,
      items: [
        'Single-click availability toggle for individual menu items',
        'Immediate real-time sync to all active diners currently looking at the menu',
        'Category-level hiding to temporarily suspend seasonal lunch menus or breakfast spreads',
        'Zero caching lag: changes display on next scan or browser pull-to-refresh',
      ],
    },
    {
      title: 'Smart QR Code & Print Engine',
      description: 'Generate high-contrast, scannable QR codes optimized for dining room lighting conditions and various table display materials.',
      icon: QrCode,
      items: [
        'Permanent URL encoding: Update your dishes forever without re-printing QR codes',
        'High-resolution PNG export up to 1024x1024 px for large signage',
        'Crisp vector SVG export for commercial graphic designers and print shops',
        'Ready-to-print acrylic table tent template featuring your restaurant logo & instructions',
      ],
    },
    {
      title: 'Smartphone Dining Experience',
      description: 'Built for iOS Safari and Android Chrome with instant load speeds and zero mobile friction.',
      icon: Smartphone,
      items: [
        'No app installation, account registration, or permissions required for diners',
        'Sticky category navigation bar for effortless thumb browsing on mobile screens',
        'Instant live search to filter dishes by name or ingredients in real-time',
        'High-contrast typography readable under low-light evening bistro environments',
      ],
    },
    {
      title: 'Enterprise Tenant Isolation & Security',
      description: 'Powered by Supabase PostgreSQL and Row Level Security for bulletproof restaurant isolation.',
      icon: ShieldCheck,
      items: [
        'Granular Row Level Security: Restaurant owners can only view and mutate their own outlets',
        'Multi-user role access: Assign kitchen managers or branch supervisors without giving admin rights',
        'Public menu privacy: Draft and suspended menus are blocked from public browsing',
        'Platform administrative control with secure server-side role validation',
      ],
    },
    {
      title: 'Brand Identity & Customization',
      description: 'Make your digital menu match your dining room ambience and brand aesthetics.',
      icon: SlidersHorizontal,
      items: [
        'Custom restaurant URL slug (e.g., menu.techrescue.in/menu/your-brand)',
        'High-resolution restaurant logo and header cover photo integration',
        'Daily operating hours display with automatic "Open Now" or "Closed" badge',
        'Configurable currency support defaulting to INR (₹) with international symbols',
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <SetupBanner />
      <Navbar />

      <main className="flex-1">
        {/* Header Banner */}
        <section className="py-16 bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="text-xs font-semibold tracking-wider uppercase text-emerald-800">
              Built for Modern Hospitality
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-stone-900">
              Features Built for Speed & Simplicity
            </h1>
            <p className="text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Every tool a restaurant or cafe needs to manage a clean, contactless menu, eliminate paper reprinting costs, and serve diners faster.
            </p>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featureGroups.map((group, idx) => {
                const IconComponent = group.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-stone-900">{group.title}</h3>
                      <p className="text-xs text-stone-600 leading-relaxed">{group.description}</p>
                      <ul className="space-y-2 pt-2 border-t border-stone-100">
                        {group.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-stone-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Banner CTA */}
            <div className="mt-16 p-8 bg-emerald-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Ready to deploy your restaurant menu?</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Set up your digital menu in minutes.</h3>
                <p className="text-xs text-emerald-200 max-w-lg">
                  Join independent eateries, cafes, and family restaurants on TechRescue Digital Menu.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="px-5 py-3 text-xs font-semibold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 rounded-lg shadow-xs transition-colors whitespace-nowrap"
                >
                  Create Your Menu Now
                </button>
                <Link
                  to="/pricing"
                  className="px-5 py-3 text-xs font-semibold text-white border border-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
