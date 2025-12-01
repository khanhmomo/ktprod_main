'use client';

import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiFileText, FiImage, FiLogOut, FiFolder, FiMail } from 'react-icons/fi';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: <FiHome className="h-5 w-5" />,
  },
  {
    name: 'Blog',
    href: '/admin/blog',
    icon: <FiFileText className="h-5 w-5" />,
  },
  {
    name: 'Categories',
    href: '/admin/categories',
    icon: <FiFolder className="h-5 w-5" />,
  },
  {
    name: 'Inquiries',
    href: '/admin/inquiries',
    icon: <FiMail className="h-5 w-5" />,
  },
];

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
  const currentPath = usePathname();

  // Check if this is the login page
  const isLoginPage = pathname === '/admin';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        console.log('Auth check response status:', response.status);
        
        // First, check if the response is HTML (starts with <!DOCTYPE)
        const responseText = await response.text();
        console.log('Response text:', responseText.substring(0, 100)); // Log first 100 chars
        
        let data;
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          console.error('Response content:', responseText);
          throw new Error('Invalid JSON response from server');
        }
        
        console.log('Auth check response data:', data);
        
        if (response.ok && data.authenticated) {
          console.log('User is authenticated');
          setIsAuthenticated(true);
          // If on login page but already authenticated, redirect to dashboard
          if (isLoginPage) {
            console.log('Redirecting to dashboard...');
            router.push('/admin/dashboard');
          }
        } else if (!isLoginPage) {
          console.log('User is not authenticated, redirecting to login');
          // If not authenticated and not on login page, redirect to login
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
    <div className={`${inter.className} bg-gray-50 min-h-screen flex`}>
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Logo/Brand */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    currentPath === item.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-gray-500">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
            
            {/* User & Logout */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/admin');
                }}
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <FiLogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {menuItems.find(item => item.href === currentPath)?.name || 'Dashboard'}
            </h2>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
