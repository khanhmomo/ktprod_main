'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the GalleryForm component with no SSR
const GalleryForm = dynamic(
  () => import('@/components/admin/GalleryForm'),
  { ssr: false }
);

interface GalleryData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
  images: { url: string; alt?: string }[];
  createdAt: string;
  updatedAt: string;
}

export default function EditGalleryPage() {
  const router = useRouter();
  const params = useParams();
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGallery = async () => {
      // Check authentication first
      const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
      if (!isAuthenticated) {
        router.push('/admin');
        return;
      }

      try {
        const response = await fetch(`/api/galleries/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Gallery not found');
          }
          throw new Error('Failed to fetch gallery');
        }
        
        const data = await response.json();
        setGallery(data);
      } catch (error) {
        console.error('Error fetching gallery:', error);
        setError(error instanceof Error ? error.message : 'Failed to load gallery');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchGallery();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/admin/galleries')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Galleries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {gallery && <GalleryForm initialData={gallery} isEdit={true} />}
    </div>
  );
}
