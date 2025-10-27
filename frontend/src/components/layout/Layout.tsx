// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop apenas */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - Mobile apenas */}
      <BottomNav />
    </div>
  );
};
