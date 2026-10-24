import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Mail, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5 text-stone-100 font-bold text-lg">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </span>
              <span>TechRescue Digital Menu</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Cloud-native QR digital menu platform for restaurants, cafes, and eateries. Simple menu updates, instant QR table standees, and zero app installs required for diners.
            </p>
            <div className="text-xs text-stone-400 flex items-center gap-1.5 pt-1">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>techrescue.in</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-stone-100 uppercase">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/features" className="hover:text-white transition-colors">
                  Features & Tools
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Plans & Pricing
                </Link>
              </li>
              <li>
                <Link to="/menu/cafe-raj" className="hover:text-white transition-colors">
                  Customer Menu Demo
                </Link>
              </li>
              <li>
                <Link to="/dashboard/qr-code" className="hover:text-white transition-colors">
                  QR Standee Generator
                </Link>
              </li>
            </ul>
          </div>

          {/* Restaurant Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-stone-100 uppercase">Solutions</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-stone-400">Casual Dining & Family Restaurants</span>
              </li>
              <li>
                <span className="text-stone-400">Coffee Shops & Cafes</span>
              </li>
              <li>
                <span className="text-stone-400">Bars, Breweries & Lounges</span>
              </li>
              <li>
                <span className="text-stone-400">Food Trucks & Cloud Kitchens</span>
              </li>
            </ul>
          </div>

          {/* Legal & TechRescue Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-stone-100 uppercase">TechRescue</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li className="pt-2">
                <a
                  href="mailto:support@techrescue.in"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Mail className="w-3 h-3" />
                  <span>support@techrescue.in</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} TechRescue. All rights reserved. Platform hosted for high availability.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-stone-200">Privacy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-stone-200">Terms</Link>
            <span>·</span>
            <Link to="/login" className="hover:text-stone-200">Owner Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
