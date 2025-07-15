'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SearchPopup from '@/components/SearchPopup';
import { getUserInfo } from '@/utils/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const userInfo = getUserInfo();
    if (!userInfo) {
      router.push('/login');
    } else {
      setUser(userInfo);
    }
  }, [router]);

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
        onSearchClick={handleSearchOpen}
      />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-6">
          {children}
        </div>
      </main>

      {isSearchOpen && (
        <SearchPopup onClose={handleSearchClose} />
      )}
    </div>
  );
}