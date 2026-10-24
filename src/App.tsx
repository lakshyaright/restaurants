import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { PricingPage } from './pages/public/PricingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { PublicMenuPage } from './pages/public/PublicMenuPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/public/TermsOfServicePage';

// Owner Dashboard Pages
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { RestaurantProfilePage } from './pages/dashboard/RestaurantProfilePage';
import { CategoriesPage } from './pages/dashboard/CategoriesPage';
import { MenuItemsPage } from './pages/dashboard/MenuItemsPage';
import { QRCodePage } from './pages/dashboard/QRCodePage';
import { MenuPreviewPage } from './pages/dashboard/MenuPreviewPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { OrdersPage } from './pages/dashboard/OrdersPage';

// Platform Administration Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminRestaurantsPage } from './pages/admin/AdminRestaurantsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/menu/:slug" element={<PublicMenuPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />

          {/* Protected Restaurant Owner Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="restaurant" element={<RestaurantProfilePage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="menu-items" element={<MenuItemsPage />} />
            <Route path="qr-code" element={<QRCodePage />} />
            <Route path="preview" element={<MenuPreviewPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Protected Platform Administration Area */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="restaurants" element={<AdminRestaurantsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
