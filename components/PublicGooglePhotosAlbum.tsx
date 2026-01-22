'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface GooglePhoto {
  id: string;
  baseUrl: string;
  filename: string;
}

export default function PublicGooglePhotosAlbum({ shareableLink }: { shareableLink: string }) {
  const [photos, setPhotos] = useState<GooglePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const extractAlbumId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (url.includes('photos.app.goo.gl')) {
        return url.split('/').pop() || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    async function fetchPhotos() {
      const albumId = extractAlbumId(shareableLink);
      if (!albumId) {
        setError('❌ Invalid Google Photos album link. Please check the URL and try again.');
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching photos for album ID: ${albumId}`);
        const response = await fetch(`/api/google-photos?albumId=${encodeURIComponent(albumId)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received photos data:', data);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (!data.photos || data.photos.length === 0) {
          throw new Error('No photos found in this album. The album might be empty or not publicly accessible.');
        }
        
        if (isMounted) {
          setPhotos(data.photos);
        }
      } catch (err) {
        console.error('Error in fetchPhotos:', err);
        if (isMounted) {
          setError(`❌ Unable to load photos: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Reset states when shareableLink changes
    setLoading(true);
    setError('');
    setPhotos([]);
    
    fetchPhotos();
    
    return () => {
      isMounted = false;
    };
  }, [shareableLink]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No photos found in this album.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <div 
          key={photo.id || `photo-${index}`} 
          className="relative aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <Image
            src={photo.baseUrl}
            alt={photo.filename || `Photo ${index + 1}`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={index < 4}
          />
        </div>
      ))}
    </div>
  );
}
