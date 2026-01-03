'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the BusinessGalleryForm to avoid SSR issues
const BusinessGalleryForm = dynamic(() => import('@/components/admin/BusinessGalleryForm'), {
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

export default function EditBusinessGalleryPage() {
  const router = useRouter();
  const params = useParams();
  const [isClient, setIsClient] = useState(false);
  const [galleryId, setGalleryId] = useState<string>('');
  const [galleryData, setGalleryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the ID from params
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (id) {
      setGalleryId(id);
    }
  }, [params.id]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          router.push('/admin');
        } else {
          setIsClient(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin');
      }
    };
    
    if (galleryId) {
      checkAuth();
    }
  }, [router, galleryId]);

  useEffect(() => {
    const fetchGallery = async () => {
      if (!galleryId || !isClient) return;
      
      try {
        const response = await fetch(`/api/business-galleries?id=${galleryId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch gallery');
        }
        const data = await response.json();
        setGalleryData(data);
      } catch (error) {
        console.error('Error fetching gallery:', error);
        router.push('/admin/business-renting/list');
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [galleryId, isClient, router]);

  if (!isClient || loading || !galleryId) {
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

  if (!galleryData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gallery Not Found</h2>
            <p className="text-gray-600 mb-4">The requested gallery could not be found.</p>
            <button
              onClick={() => router.push('/admin/business-renting/list')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Galleries
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <BusinessGalleryForm initialData={galleryData} isEditing={true} />;
}
