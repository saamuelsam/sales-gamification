// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import EmailVerificationBanner from '../../features/auth/components/EmailVerificationBanner';

export const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Desktop apenas */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <EmailVerificationBanner />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-6 mobile-scroll">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - Mobile apenas */}
      <BottomNav />
    </div>
  );
};
