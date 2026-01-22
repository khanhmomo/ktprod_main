'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Album, AlbumImage } from '../../types/album';

export default function AlbumPreview({ albumId }: { albumId: string }) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await fetch(`/api/albums/${albumId}`, {
          next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch album');
        }
        
        const { data } = await response.json();
        
        if (!data) {
          throw new Error('No album data found');
        }
        
        setAlbum(data);
      } catch (err) {
        console.error('Error fetching album:', err);
        setError(err instanceof Error ? err.message : 'Failed to load album. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="text-center py-12 text-red-500">
        {error || 'Album not found'}
      </div>
    );
  }

  // Only show the first 6 images as a preview
  const previewImages = album.images?.slice(0, 6) || [];

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {previewImages.map((image, index) => (
          <div key={image._id || index} className="aspect-square relative overflow-hidden rounded-sm">
            <Image
              src={image.url}
              alt={`${album.title} - ${index + 1}`}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 33vw"
              priority={index < 3} // Only prioritize first 3 images
            />
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <a 
          href={`/albums/${albumId}`}
          className="inline-block px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors duration-300 rounded"
        >
          View Full Album
        </a>
      </div>
    </div>
  );
}
