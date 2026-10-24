import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Smartphone, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  ChevronDown, 
  SlidersHorizontal, 
  Check,
  Eye
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { SetupBanner } from '../../components/common/SetupNoticeModal';
import { DietaryBadge } from '../../components/common/DietaryBadge';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'starters' | 'mains'>('all');

  const faqs = [
    {
      q: 'Do diners need to install any app to view our menu?',
      a: 'No app download is required. Customers simply open their regular phone camera (iPhone or Android), point at the table QR code, and your restaurant menu opens instantly in their native mobile browser.',
    },
    {
      q: 'How fast do price and item updates reflect on customer phones?',
      a: 'Updates are instantaneous. The moment you change a price, edit a description, or mark a sold-out item as unavailable in your dashboard, any customer scanning or refreshing the menu sees the updated version immediately.',
    },
    {
      q: 'Can we print table standees and stickers with our QR code?',
      a: 'Yes. TechRescue Digital Menu includes high-resolution PNG and vector SVG downloads, as well as a pre-formatted print-ready acrylic table standee template containing your restaurant name and instructions.',
    },
    {
      q: 'Do QR codes change when we add new food items or change prices?',
      a: 'No. The QR code encodes a permanent, stable URL for your restaurant slug (e.g. menu.techrescue.in/menu/your-restaurant). You can modify dishes, categories, and prices as often as you like without ever having to reprint table QR codes.',
    },
    {
      q: 'Is there a setup fee or contract commitment?',
      a: 'There are no hidden setup fees. The Starter plan is completely free to launch your first digital menu, and premium plans with multi-branch management can be upgraded or cancelled at any time.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <SetupBanner />
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Value Proposition */}
              <div className="lg:col-span-7 space-y-6">
                <div className="text-xs font-semibold tracking-wider uppercase text-emerald-800">
                  Contactless Dining by TechRescue
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 leading-[1.1] text-balance">
                  Your Restaurant Menu. <br />
                  <span className="text-emerald-700">One Scan Away.</span>
                </h1>

                <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed">
                  Eliminate outdated printed paper menus. Empower your kitchen and floor staff with instant price updates, item availability toggles, and clean contactless QR codes diners love scanning.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                  >
                    <span>Launch Free Digital Menu</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    to="/menu/cafe-raj"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-xs transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <span>View Customer Demo Menu</span>
                  </Link>
                </div>

                {/* Proof strip */}
                <div className="pt-6 border-t border-stone-200 grid grid-cols-3 gap-4 text-xs text-stone-600">
                  <div>
                    <span className="block font-bold text-stone-900 text-sm">0s Re-print Cost</span>
                    <span>Update prices anytime</span>
                  </div>
                  <div>
                    <span className="block font-bold text-stone-900 text-sm">No App Download</span>
                    <span>Runs in phone browser</span>
                  </div>
                  <div>
                    <span className="block font-bold text-stone-900 text-sm">FSSAI Compliant</span>
                    <span>Veg / Non-veg & allergens</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Mobile Menu Preview Mockup */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm rounded-[2.5rem] p-3 bg-stone-900 shadow-2xl ring-1 ring-stone-800">
                  {/* Phone Speaker Notch */}
                  <div className="w-24 h-4 bg-stone-950 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-stone-800"></div>
                  </div>

                  {/* Phone Screen Canvas */}
                  <div className="bg-stone-50 rounded-[2rem] overflow-hidden text-stone-900 border border-stone-200 shadow-inner flex flex-col h-[560px]">
                    
                    {/* Mobile Header */}
                    <div className="bg-stone-900 text-white p-4">
                      <div className="flex items-center justify-between text-xs text-emerald-400 font-mono-nums mb-1">
                        <span>TABLE #04</span>
                        <span className="text-emerald-400 font-medium">● OPEN NOW</span>
                      </div>
                      <h3 className="font-bold text-base tracking-tight text-white">Cafe Raj & Bistro</h3>
                      <p className="text-xs text-stone-400 truncate">Indiranagar, Bengaluru · Multi-cuisine</p>
                    </div>

                    {/* Interactive Filter Tabs in Mockup */}
                    <div className="flex items-center gap-1.5 p-2 bg-stone-100 border-b border-stone-200">
                      <button
                        onClick={() => setPreviewFilter('all')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          previewFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        All Items
                      </button>
                      <button
                        onClick={() => setPreviewFilter('starters')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          previewFilter === 'starters' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Starters
                      </button>
                      <button
                        onClick={() => setPreviewFilter('mains')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          previewFilter === 'mains' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Mains
                      </button>
                    </div>

                    {/* Live Food Items Mock Feed */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                      {(previewFilter === 'all' || previewFilter === 'starters') && (
                        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs flex justify-between gap-3">
                          <div className="space-y-1">
                            <DietaryBadge type="veg" />
                            <h4 className="text-xs font-bold text-stone-900">Smoked Malai Paneer Tikka</h4>
                            <p className="text-[11px] text-stone-500 line-clamp-2 leading-tight">
                              Charred organic cottage cheese marinated in cardamom cream with mint emulsion.
                            </p>
                            <div className="text-xs font-bold text-stone-900 font-mono-nums pt-1">
                              ₹320 <span className="text-[10px] text-stone-400 line-through">₹360</span>
                            </div>
                          </div>
                          <div className="w-16 h-16 rounded-lg bg-stone-100 border border-stone-200 shrink-0 flex items-center justify-center text-stone-400">
                            <Sparkles className="w-5 h-5 text-emerald-600" />
                          </div>
                        </div>
                      )}

                      {(previewFilter === 'all' || previewFilter === 'starters') && (
                        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs flex justify-between gap-3">
                          <div className="space-y-1">
                            <DietaryBadge type="non_veg" />
                            <h4 className="text-xs font-bold text-stone-900">Old Delhi Spiced Chicken Tikka</h4>
                            <p className="text-[11px] text-stone-500 line-clamp-2 leading-tight">
                              Charred boneless thighs spiced with degi mirch and roasted kasuri methi.
                            </p>
                            <div className="text-xs font-bold text-stone-900 font-mono-nums pt-1">
                              ₹420
                            </div>
                          </div>
                          <div className="w-16 h-16 rounded-lg bg-stone-100 border border-stone-200 shrink-0 flex items-center justify-center text-stone-400">
                            <Sparkles className="w-5 h-5 text-amber-600" />
                          </div>
                        </div>
                      )}

                      {(previewFilter === 'all' || previewFilter === 'mains') && (
                        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs flex justify-between gap-3">
                          <div className="space-y-1">
                            <DietaryBadge type="veg" />
                            <h4 className="text-xs font-bold text-stone-900">Margherita Napoli Pizza</h4>
                            <p className="text-[11px] text-stone-500 line-clamp-2 leading-tight">
                              48-hour sourdough crust, San Marzano sauce, and buffalo mozzarella.
                            </p>
                            <div className="text-xs font-bold text-stone-900 font-mono-nums pt-1">
                              ₹470 <span className="text-[10px] text-stone-400 line-through">₹520</span>
                            </div>
                          </div>
                          <div className="w-16 h-16 rounded-lg bg-stone-100 border border-stone-200 shrink-0 flex items-center justify-center text-stone-400">
                            <Sparkles className="w-5 h-5 text-emerald-600" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Phone Bar */}
                    <div className="p-3 bg-white border-t border-stone-200 text-center text-xs text-stone-500">
                      <span>Powered by TechRescue Digital Menu</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-16 lg:py-24 bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-semibold tracking-wider uppercase text-emerald-800 mb-2">
                Simple 3-Step Workflow
              </h2>
              <p className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                From Sign-Up to Tabletop in 5 Minutes
              </p>
              <p className="mt-3 text-stone-600 text-sm">
                No complex POS installations or hardware purchases required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="p-6 rounded-xl border border-stone-200 bg-stone-50/50 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-bold text-stone-900">Create Your Digital Menu</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Enter your restaurant details, create categories (Starters, Pizzas, Drinks), and add your dishes with prices, dietary tags, and photos.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-xl border border-stone-200 bg-stone-50/50 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-stone-900">Generate & Print Table QR</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Download high-resolution QR codes as PNG or SVG. Print them directly onto acrylic table tents, stickers, or tabletop coasters.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-xl border border-stone-200 bg-stone-50/50 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="text-lg font-bold text-stone-900">Diners Scan & Order with Staff</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Guests scan with their phone camera, browse high-res photos and allergen tags, and place their orders with your dining room staff.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section className="py-16 lg:py-24 bg-stone-50 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-semibold tracking-wider uppercase text-emerald-800 mb-2">
                Platform Capabilities
              </h2>
              <p className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                Engineered for Modern Food Businesses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-xs space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Real-Time Availability Toggles</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Run out of an ingredient during evening rush? Mark any item unavailable with one tap in your dashboard so guests never order 86&apos;d dishes.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-xs space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Zero App Installs Needed</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Fast, lightweight mobile web menu designed to load in under 1 second on low 4G connectivity without making diners download an app.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-xs space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Permanent Smart QR Code</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Your table QR code points to your permanent restaurant URL slug. Update menu items, prices, and specials without re-printing.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-xs space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Opening Hours & Status</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Configure daily operating schedules. The menu automatically shows diners whether the kitchen is open or closed for service.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-xs space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Dietary & Allergen Clarity</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Prominent Veg, Non-Veg, Egg, and Vegan indicators alongside listed allergens like Gluten, Dairy, and Nuts build guest trust.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-xs space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Multi-Tenant Tenant Isolation</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  PostgreSQL Row Level Security ensures complete data privacy. Every restaurant owner manages strictly their own menu and assets.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-16 lg:py-24 bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-semibold tracking-wider uppercase text-emerald-800 mb-2">
                Transparent Plans
              </h2>
              <p className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                Simple Pricing for Every Food Business
              </p>
              <p className="mt-2 text-stone-600 text-sm">
                No credit card required to get started. Cancel anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
              {/* Plan 1 */}
              <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">Starter</h3>
                    <p className="text-xs text-stone-500 mt-1">For single-outlet cafes and eateries</p>
                  </div>
                  <div className="font-mono-nums">
                    <span className="text-3xl font-bold text-stone-900">₹0</span>
                    <span className="text-xs text-stone-500"> / forever free</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-stone-700 pt-2 border-t border-stone-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1 Restaurant Location</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Up to 50 Menu Items</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Standard QR code downloads</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Unlimited Diner Scans</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-stone-800 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Start with Free
                </button>
              </div>

              {/* Plan 2: Highlighted */}
              <div className="p-6 bg-white rounded-xl border-2 border-emerald-600 shadow-md flex flex-col justify-between space-y-6 relative">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">Pro Restaurant</h3>
                      <p className="text-xs text-stone-500 mt-1">For busy dining rooms and bistros</p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Most Popular
                    </span>
                  </div>
                  <div className="font-mono-nums">
                    <span className="text-3xl font-bold text-stone-900">₹799</span>
                    <span className="text-xs text-stone-500"> / month</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-stone-700 pt-2 border-t border-stone-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Unlimited Menu Categories & Items</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>High-Res Photo Uploads (Supabase Storage)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Vector SVG & Print-Ready Acrylic Standees</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Manager & Kitchen Floor Staff Access</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
                >
                  Get Started with Pro
                </button>
              </div>

              {/* Plan 3 */}
              <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">Multi-Outlet</h3>
                    <p className="text-xs text-stone-500 mt-1">For restaurant chains and franchises</p>
                  </div>
                  <div className="font-mono-nums">
                    <span className="text-3xl font-bold text-stone-900">₹1,999</span>
                    <span className="text-xs text-stone-500"> / month</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-stone-700 pt-2 border-t border-stone-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Up to 5 Outlets & Branches</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Centralized Brand Menu Sync</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Custom Subdomain (techrescue.in)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Priority Phone & WhatsApp Support</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-stone-800 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Choose Multi-Outlet
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="py-16 lg:py-24 bg-stone-50 border-b border-stone-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-xs font-semibold tracking-wider uppercase text-emerald-800 mb-2">
                Questions & Answers
              </h2>
              <p className="text-3xl font-bold tracking-tight text-stone-900">
                Frequently Asked Questions
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-stone-900 text-sm hover:bg-stone-50/50"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-500 shrink-0 transition-transform ${
                        activeFaq === idx ? 'rotate-180 text-emerald-700' : ''
                      }`}
                    />
                  </button>
                  {activeFaq === idx && (
                    <div className="px-5 pb-4 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="py-16 bg-stone-900 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Upgrade Your Dining Experience Today
            </h2>
            <p className="text-stone-300 text-sm max-w-xl mx-auto leading-relaxed">
              Join forward-thinking restaurants and cafes using TechRescue Digital Menu. Generate your free table QR code in under 5 minutes.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 text-xs font-semibold text-stone-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                Create Restaurant Menu Free
              </button>
              <Link
                to="/pricing"
                className="px-6 py-3 text-xs font-semibold text-stone-300 hover:text-white border border-stone-700 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap"
              >
                Compare All Plans
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
