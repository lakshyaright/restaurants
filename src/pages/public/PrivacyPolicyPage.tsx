import React from 'react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-xl border border-stone-200 shadow-xs space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Legal Documentation</div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 mt-1">Privacy Policy</h1>
            <p className="text-xs text-stone-500 mt-2">Last Updated: October 2026 · TechRescue Digital Menu (techrescue.in)</p>
          </div>

          <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900">1. Information We Collect</h2>
              <p>
                When you create an account on TechRescue Digital Menu as a restaurant owner or manager, we collect your email address, full name, and restaurant profile details (such as restaurant name, public address, phone number, operating hours, and menu data).
              </p>
              <p>
                Diners who scan public QR codes to browse restaurant menus do not need to register, provide personal identifiers, or install applications. We do not track diner identities or require diner personal data to display menus.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900">2. How We Use Information</h2>
              <p>
                We use collected information solely to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Provide, operate, and maintain your restaurant&apos;s digital menu dashboard.</li>
                <li>Authenticate your identity and protect your restaurant data from unauthorized access.</li>
                <li>Generate stable QR codes and serve public digital menus to customers.</li>
                <li>Communicate important service notices, security alerts, and system updates.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900">3. Data Security & Storage</h2>
              <p>
                We implement industry-standard database security via PostgreSQL Row Level Security (RLS) to ensure multi-tenant data isolation. Each restaurant owner and manager has access strictly to their designated restaurant data. Public visitors may only view active categories and available menu items of published restaurants.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900">4. Third-Party Services</h2>
              <p>
                We utilize trusted cloud infrastructure including Supabase for authentication and database management, and Cloudflare for high-speed edge delivery and DDoS mitigation.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900">5. Contact Us</h2>
              <p>
                If you have questions regarding this Privacy Policy, please contact our team at{' '}
                <a href="mailto:support@techrescue.in" className="text-emerald-700 underline font-medium">
                  support@techrescue.in
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
