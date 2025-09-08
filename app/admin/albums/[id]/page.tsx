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

        const response = await fetch(`/api/albums/${albumId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch album');
        }
        const data = await response.json();
        setAlbum(data);
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Back to Dashboard
          </button>
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
        
        {album && <AlbumForm initialData={album} isEditing />}
      </div>
    </div>
  );
}
