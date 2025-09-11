'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AlbumForm from '@/components/admin/AlbumForm';
import React from 'react';

interface AlbumData {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  images: { url: string; alt?: string }[];
  date: string;
  location: string;
  isPublished: boolean;
  category: string;
}

export default function EditAlbumPage() {
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const albumId = params?.id;

  useEffect(() => {
    if (!albumId) return;

    const fetchAlbum = async () => {
      try {
        // First check authentication
        const authCheck = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        
        if (!authCheck.ok) {
          router.push('/admin');
          return;
        }

        const response = await fetch(`/api/albums/${albumId}`, {
          cache: 'no-store'
        });
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Failed to fetch album:', response.status, errorData);
          throw new Error(`Failed to fetch album: ${response.status} ${errorData}`);
        }
        const responseData = await response.json();
        console.log('Fetched album data:', responseData);
        
        // Handle nested data structure
        const albumData = responseData.data || responseData;
        console.log('Extracted album data:', albumData);
        
        if (!albumData) {
          throw new Error('No album data found in response');
        }
        
        setAlbum({
          _id: albumData._id,
          title: albumData.title || '',
          description: albumData.description || '',
          coverImage: albumData.coverImage || (albumData.images?.[0]?.url || ''),
          images: albumData.images || [],
          date: albumData.date || new Date().toISOString(),
          location: albumData.location || '',
          isPublished: albumData.isPublished || false,
          category: albumData.category || 'Event' // Add this line
        });
      } catch (err) {
        console.error('Error fetching album:', err);
        setError('Failed to load album. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Loading album data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md" role="alert">
          <h2 className="text-xl font-bold mb-2">Error Loading Album</h2>
          <p className="mb-4">{error}</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/admin/albums')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Albums
            </button>
          </div>
        </div>
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
                    Edit Album
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        
        {album ? (
          <>
            {console.group('AlbumEditPage - Rendering AlbumForm')}
            {console.log('Album data:', album)}
            {console.log('Has images:', album.images?.length > 0)}
            {console.log('Album ID:', album._id)}
            {console.groupEnd()}
            <AlbumForm 
              key={album._id} // Force re-render when album changes
              initialData={{
                ...album,
                // Ensure images is always an array
                images: album.images || []
              }} 
              isEditing 
            />
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No album data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
