'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiImage, FiFolder, FiFileText, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasChecked: boolean;
};

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    hasChecked: false
  });

  // Handle authentication check and redirection
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        // First check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Expected JSON, got:', text);
          throw new Error('Invalid response format');
        }

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Authentication check failed');
        }
        
        if (!data.authenticated && !window.location.pathname.endsWith('/admin')) {
          // If not authenticated and not on login page, redirect to login
          router.push('/admin');
          return;
        }
        
        if (data.authenticated && window.location.pathname.endsWith('/admin')) {
          // If authenticated and on login page, redirect to dashboard
          router.push('/admin/dashboard');
          return;
        }
        
        setAuthState({
          isAuthenticated: data.authenticated,
          isLoading: false,
          hasChecked: true
        });
      } catch (error) {
        console.error('Error checking auth status:', error);
        if (!window.location.pathname.endsWith('/admin')) {
          router.push('/admin');
        }
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });
      
      if (response.ok) {
        // Update the auth state
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          hasChecked: true
        });
        
        // Force a full page reload to ensure all auth state is cleared
        window.location.href = '/admin';
      } else {
        console.error('Logout failed:', await response.text());
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, still try to redirect to login
      window.location.href = '/admin';
    }
  };

  // Show loading state while checking auth
  if (authState.isLoading || !authState.hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (window.location.pathname.endsWith('/admin')) {
    return <>{children}</>;
  }

  if (!authState.isAuthenticated) {
    return null; // or a loading/redirect state
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                <Link
                  href="/admin/dashboard"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 hover:text-gray-900"
                >
                  <FiHome className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/galleries"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 hover:text-gray-900"
                >
                  <FiImage className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                  Galleries
                </Link>
                <Link
                  href="/admin/albums"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 hover:text-gray-900"
                >
                  <FiFolder className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                  Albums
                </Link>
                <Link
                  href="/admin/blog"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 hover:text-gray-900"
                >
                  <FiFileText className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                  Blog
                </Link>
                <Link
                  href="/admin/categories"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 hover:text-gray-900"
                >
                  <FiFolder className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                  Categories
                </Link>
                              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={(e) => handleLogout(e)}
                className="group flex-1 flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
              >
                <FiLogOut className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="fixed inset-0 z-40 flex">
          <div
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
              isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsMenuOpen(false)}
          ></div>
          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform ease-in-out duration-300 ${
              isMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <FiX className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                <Link
                  href="/admin/dashboard"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiHome className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/albums"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiFolder className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                  Albums
                </Link>
                <Link
                  href="/admin/blog"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiFileText className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                  Blog
                </Link>
                              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={(e) => {
                  handleLogout(e);
                  setIsMenuOpen(false);
                }}
                className="group flex-1 flex items-center px-2 py-2 text-base font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
              >
                <FiLogOut className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <button
                  type="button"
                  className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black md:hidden"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <FiMenu className="h-6 w-6" />
                </button>
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
