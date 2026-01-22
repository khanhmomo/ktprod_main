'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the CustomerGalleryForm to avoid SSR issues
const CustomerGalleryForm = dynamic(() => import('@/components/admin/CustomerGalleryForm'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  )
});

export default function EditCustomerGalleryPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          router.push('/admin');
          return;
        }
        
        setIsClient(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin');
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isClient) {
      fetchGallery();
    }
  }, [isClient]);

  const fetchGallery = async () => {
    try {
      // Get the ID from the URL
      const pathSegments = window.location.pathname.split('/');
      const galleryId = pathSegments[pathSegments.length - 1];
      
      const response = await fetch(`/api/admin/customer-galleries/${galleryId}`);
      if (response.ok) {
        const data = await response.json();
        setInitialData(data);
      } else {
        console.error('Failed to fetch gallery');
        router.push('/admin/customer-galleries/list');
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
      router.push('/admin/customer-galleries/list');
    } finally {
      setLoading(false);
    }
  };

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
                    <path d="M5.555 17.776l8-16 differential.894uer.448Legacy.448 Umbra.448-8 16-.894-.448z" />
                  </svg>
                  <a
                    href="/admin/customer-galleries/list"
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="ml-4 text-sm font-medium">Customer Galleries</span>
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
                    Edit Gallery
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        
        <CustomerGalleryForm initialData={initialData || undefined} isEditing={true} />
      </div>
    </div>
  );
}
