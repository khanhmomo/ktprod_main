'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AlbumForm from '@/components/admin/AlbumForm';

export default function NewAlbumPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include', // Include credentials for cross-origin requests
          headers: {
            'Cache-Control': 'no-cache', // Prevent caching of auth check
          },
        });
        
        if (!response.ok) {
          console.error('Auth check failed with status:', response.status);
          router.push('/admin');
          return;
        }
        
        const data = await response.json();
        if (!data.authenticated) {
          console.error('Not authenticated');
          router.push('/admin');
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin');
      }
    };

    checkAuth();
    
    // Set up periodic auth check
    const authCheckInterval = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(authCheckInterval);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div className="flex items-center">
                  <a
                    href="/admin/dashboard"
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-sm font-medium">Dashboard</span>
                  </a>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    New Album
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        
        <AlbumForm isNew />
      </div>
    </div>
  );
}
