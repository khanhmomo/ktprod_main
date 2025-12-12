'use client';

import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiFileText, FiImage, FiLogOut, FiFolder, FiMail, FiEdit3, FiCalendar, FiUsers, FiUser, FiMenu, FiX, FiBook, FiHeart } from 'react-icons/fi';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: <FiHome className="h-5 w-5" />,
  },
  {
    name: 'Calendar',
    href: '/admin/calendar',
    icon: <FiCalendar className="h-5 w-5" />,
  },
  {
    name: 'Crew',
    href: '/admin/crew',
    icon: <FiUsers className="h-5 w-5" />,
  },
  {
    name: 'Inquiries',
    href: '/admin/inquiries',
    icon: <FiMail className="h-5 w-5" />,
  },
];

const pageContentItems = [
  {
    name: 'Homepage',
    href: '/admin/homepage',
    icon: <FiEdit3 className="h-5 w-5" />,
  },
  {
    name: 'About Us',
    href: '/admin/introduction',
    icon: <FiBook className="h-5 w-5" />,
  },
  {
    name: 'Services',
    href: '/admin/services',
    icon: <FiEdit3 className="h-5 w-5" />,
  },
  {
    name: 'Blog',
    href: '/admin/blog',
    icon: <FiFileText className="h-5 w-5" />,
  },
  {
    name: 'Kind Words',
    href: '/admin/kind-words',
    icon: <FiHeart className="h-5 w-5" />,
  },
];

const componentsItems = [
  {
    name: 'Categories',
    href: '/admin/categories',
    icon: <FiFolder className="h-5 w-5" />,
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
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentPath = usePathname();

  // Check if this is the login page
  const isLoginPage = pathname === '/admin/login';

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      let data;
      try {
        const responseText = await response.text();
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }
      
      if (response.ok && data.authenticated) {
        setIsAuthenticated(true);
        
        // Fetch user info
        try {
          const userResponse = await fetch('/api/auth/me', {
            credentials: 'include'
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
            
            // Check if user is crew, redirect to workspace (managers and admins stay in admin)
            if (userData.role === 'crew') {
              router.push('/workspace');
              return;
            }
          }
        } catch (userError) {
          console.error('Failed to fetch user info:', userError);
        }
        
        // If on login page but already authenticated, redirect to dashboard
        if (isLoginPage) {
          router.push('/admin/dashboard');
        }
      } else if (!isLoginPage) {
        // If not authenticated and not on login page, redirect to login
        router.push('/admin/login');
      }
    } catch (error) {
      if (!isLoginPage) {
        router.push('/admin/login');
      }
    } finally {
      setIsLoading(false);
      setIsMounted(true);
    }
  };

  useEffect(() => {
    // Don't run auth checks on login page
    if (isLoginPage) {
      setIsLoading(false);
      setIsMounted(true);
      return;
    }
    
    checkAuth();
  }, [pathname, isLoginPage]);

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
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
            onClick={() => setSidebarOpen(false)}
          ></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 md:w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <h1 className="text-xl font-bold text-gray-800">TheWild Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center mb-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                  <FiUser className="text-gray-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
              </div>
            </div>
            
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/admin');
              }}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <FiLogOut className="mr-2" />
              Logout
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors md:hover:md:hover:bg-gray-100 ${
                  currentPath === item.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-gray-500 flex-shrink-0">{item.icon}</span>
                {item.name}
              </Link>
            ))}
            
            {/* Separator */}
            <div className="my-4 border-t border-gray-200"></div>
            
            {/* Page content section */}
            <div className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Page content</h3>
            </div>
            
            {pageContentItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  currentPath === item.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-gray-500 flex-shrink-0">{item.icon}</span>
                {item.name}
              </Link>
            ))}
            
            {/* Separator */}
            <div className="my-4 border-t border-gray-200"></div>
            
            {/* Components section */}
            <div className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Components</h3>
            </div>
            
            {componentsItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  currentPath === item.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-gray-500 flex-shrink-0">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with hamburger menu */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-800">TheWild Admin</h1>
        </div>
        
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
