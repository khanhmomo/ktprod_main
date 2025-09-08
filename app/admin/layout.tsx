'use client';

import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is the login page
  const isLoginPage = pathname === '/admin';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            // If on login page but already authenticated, redirect to dashboard
            if (isLoginPage) {
              router.push('/admin/dashboard');
            }
          } else if (!isLoginPage) {
            // If not authenticated and not on login page, redirect to login
            router.push('/admin');
          }
        } else if (!isLoginPage) {
          // If auth check fails and not on login page, redirect to login
          router.push('/admin');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (!isLoginPage) {
          router.push('/admin');
        }
      } finally {
        setIsLoading(false);
        setIsMounted(true);
      }
    };

    checkAuth();
  }, [pathname, isLoginPage, router]);

  // Don't render anything until mounted and auth check is complete
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  // If not authenticated and not on login page, don't render anything
  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  if (isLoginPage) {
    return (
      <div className={`${inter.className} bg-gray-100 min-h-screen`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`${inter.className} bg-gray-100 min-h-screen flex`}>
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              <Link
                href="/admin/dashboard"
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/admin');
                }}
                className="w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-red-600"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
