import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, QrCode } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand wordmark */}
          <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 group">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
              <QrCode className="w-4 h-4" />
            </span>
            <span>TechRescue Digital Menu</span>
          </Link>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            <Link to="/features" className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0">
              Features
            </Link>
            <Link to="/pricing" className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0">
              Pricing
            </Link>
            <Link to="/menu/cafe-raj" className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0">
              Live Demo
            </Link>
            <a href="/#how-it-works" className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-md hover:bg-stone-200/60 transition-colors whitespace-nowrap"
                  >
                    Admin Area
                  </Link>
                )}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-md hover:bg-stone-200/60 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  Create Restaurant Menu
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-stone-50 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
          >
            Pricing
          </Link>
          <Link
            to="/menu/cafe-raj"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
          >
            Live Demo Menu
          </Link>
          <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-semibold text-stone-700 border border-stone-300 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-lg"
                >
                  Create Restaurant Menu
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
