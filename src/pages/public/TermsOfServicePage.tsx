import React from 'react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-xl border border-stone-200 shadow-xs space-y-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Legal Documentation</div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 mt-1">Terms of Service</h1>
            <p className="text-xs text-stone-500 mt-2">Effective: October 2026 · TechRescue Digital Menu (techrescue.in)</p>
          </div>

          <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900">1. Acceptance of Terms</h2>
              <p>
                By registering for or using TechRescue Digital Menu (the &quot;Platform&quot;), operated by TechRescue (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a restaurant or dining establishment, you represent that you have the authority to bind that entity.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900">2. Restaurant Content & Accuracy</h2>
              <p>
                You are solely responsible for the accuracy, legality, and quality of all information published on your digital menu, including food descriptions, pricing, dietary indicators (Veg / Non-Veg / Vegan / Egg), and allergen warnings. You agree not to upload misleading or unlawful content.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900">3. Platform Administration & Suspension</h2>
              <p>
                TechRescue reserves the right to review restaurant accounts and suspend or deactivate any restaurant profile that violates applicable food safety laws, engages in deceptive pricing, or violates these Terms. Platform administrative actions are logged and enforced through server-side authorization.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900">4. Service Availability & Uptime</h2>
              <p>
                We strive for continuous 99.9% uptime for public customer menu viewing. However, we do not warrant that service will be uninterrupted or error-free during scheduled maintenance or third-party cloud infrastructure outages.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900">5. Contact Information</h2>
              <p>
                For questions regarding these Terms, contact our administrative office at{' '}
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
