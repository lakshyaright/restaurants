import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, HelpCircle } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { SetupBanner } from '../../components/common/SetupNoticeModal';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  const comparisonRows = [
    { feature: 'Restaurant Locations Included', free: '1 Outlet', pro: '1 Outlet', multi: 'Up to 5 Outlets' },
    { feature: 'Menu Items Limit', free: 'Up to 50 Dishes', pro: 'Unlimited', multi: 'Unlimited' },
    { feature: 'Menu Categories', free: 'Up to 5 Categories', pro: 'Unlimited', multi: 'Unlimited' },
    { feature: 'Customer QR Scans', free: 'Unlimited', pro: 'Unlimited', multi: 'Unlimited' },
    { feature: 'QR Code Formats', free: 'PNG Standard', pro: 'PNG + Vector SVG', multi: 'PNG + SVG + Print PDF' },
    { feature: 'Print-Ready Table Tent Template', free: 'Basic Template', pro: 'Branded Standee', proHighlight: true, multi: 'Custom White-Label' },
    { feature: 'Dish Image Uploads', free: 'Standard Quality', pro: 'High-Res CDN Storage', multi: 'High-Res CDN Storage' },
    { feature: 'Dietary & FSSAI Compliance', free: 'Yes', pro: 'Yes', multi: 'Yes' },
    { feature: 'Staff & Manager Logins', free: '1 Owner Account', pro: 'Up to 5 Staff Members', multi: 'Unlimited Team Members' },
    { feature: 'Custom URL Slug (e.g. /menu/brand)', free: 'Yes', pro: 'Yes', multi: 'Dedicated Domain' },
    { feature: 'Technical Support', free: 'Community / Email', pro: 'Priority Email & Chat', multi: 'Dedicated WhatsApp Manager' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <SetupBanner />
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="py-16 bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="text-xs font-semibold tracking-wider uppercase text-emerald-800">
              Simple, Predictable Plans
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-stone-900">
              Honest Pricing for Food Businesses
            </h1>
            <p className="text-base text-stone-600 max-w-xl mx-auto">
              Launch your restaurant menu for free today. Upgrade only when your dining volume and branch count expands.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {/* Starter Plan */}
              <div className="p-8 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Starter</h3>
                    <p className="text-xs text-stone-500 mt-1">For new food stalls, cafes, and solo dining ventures</p>
                  </div>
                  <div className="font-mono-nums">
                    <span className="text-4xl font-bold text-stone-900">₹0</span>
                    <span className="text-xs text-stone-500"> / forever free</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Get up and running immediately with core digital menu features and unlimited scans.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 px-4 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  Start Free
                </button>
              </div>

              {/* Pro Plan */}
              <div className="p-8 bg-white rounded-2xl border-2 border-emerald-600 shadow-md flex flex-col justify-between space-y-8 relative">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">Pro Restaurant</h3>
                      <p className="text-xs text-stone-500 mt-1">For busy dining rooms, bistros, and family eateries</p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  </div>
                  <div className="font-mono-nums">
                    <span className="text-4xl font-bold text-stone-900">₹799</span>
                    <span className="text-xs text-stone-500"> / month</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Unlimited menu dishes, vector SVG downloads for printing, and staff manager access.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
                >
                  Start 14-Day Pro Trial
                </button>
              </div>

              {/* Multi-Outlet Plan */}
              <div className="p-8 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Multi-Outlet</h3>
                    <p className="text-xs text-stone-500 mt-1">For regional chains and multi-branch franchises</p>
                  </div>
                  <div className="font-mono-nums">
                    <span className="text-4xl font-bold text-stone-900">₹1,999</span>
                    <span className="text-xs text-stone-500"> / month</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Manage up to 5 branch menus with centralized dishes and dedicated WhatsApp assistance.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 px-4 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  Choose Multi-Outlet
                </button>
              </div>
            </div>

            {/* Feature Comparison Matrix */}
            <div className="mt-20">
              <h2 className="text-2xl font-bold text-stone-900 mb-6 text-center">
                Plan Comparison Matrix
              </h2>
              <div className="overflow-x-auto bg-white rounded-xl border border-stone-200 shadow-xs">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-100 border-b border-stone-200 text-stone-900 font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-1/3">Feature</th>
                      <th className="py-3 px-4 w-1/5 text-center">Starter</th>
                      <th className="py-3 px-4 w-1/5 text-center bg-emerald-50/70 text-emerald-950">Pro Restaurant</th>
                      <th className="py-3 px-4 w-1/5 text-center">Multi-Outlet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {comparisonRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4 font-medium text-stone-900">{row.feature}</td>
                        <td className="py-3 px-4 text-center text-stone-600">{row.free}</td>
                        <td className="py-3 px-4 text-center font-semibold bg-emerald-50/40 text-emerald-900">
                          {row.pro}
                        </td>
                        <td className="py-3 px-4 text-center text-stone-600">{row.multi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
