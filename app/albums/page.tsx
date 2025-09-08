'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Masonry from 'react-masonry-css';

interface AlbumImage {
  url: string;
  alt?: string;
}

interface Album {
  _id: string;
  title: string;
  coverImage: string;
  images: AlbumImage[];
  date: string;
  location: string;
  description?: string;
  isPublished: boolean;
  createdAt?: string;
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, string>>({});

  // Function to get image dimensions
  const getImageDimensions = (url: string): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = () => {
        // Default to 4:3 if we can't load the image
        resolve({ width: 4, height: 3 });
      };
      img.src = url;
    });
  };

  // Load albums and calculate aspect ratios
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setIsLoading(true);
        // Fetch all albums including unpublished ones
        const response = await fetch('/api/albums?all=true');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const albumsData = Array.isArray(data) ? data : [];
        setAlbums(albumsData);

        // Calculate aspect ratios for all album covers
        const aspectRatios: Record<string, string> = {};
        await Promise.all(
          albumsData.map(async (album: Album) => {
            try {
              const dimensions = await getImageDimensions(album.coverImage);
              aspectRatios[album._id] = `aspect-[${dimensions.width}/${dimensions.height}]`;
            } catch (err) {
              console.error(`Error getting dimensions for album ${album._id}:`, err);
              aspectRatios[album._id] = 'aspect-[4/3]'; // Default fallback
            }
          })
        );
        setImageAspectRatios(aspectRatios);
      } catch (err) {
        console.error('Error fetching albums:', err);
        setError('Failed to load albums. Please try again later.');
        setAlbums([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4 text-center">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No albums available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white -mt-8">
      <section className="pt-4 pb-12">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Our Albums</h1>
            <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse through our collection of photo albums from various sessions and events.
            </p>
          </motion.div>

        <Masonry
          breakpointCols={{
            default: 3,
            1100: 3,
            700: 2,
            500: 1
          }}
          className="flex w-auto -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {albums.map((album, index) => {
            // Get the pre-calculated aspect ratio or use default
            const aspectClass = imageAspectRatios[album._id] || 'aspect-[4/3]';

            return (
              <div key={album._id} className="mb-4 break-inside-avoid">
                <Link href={`/albums/${album._id}`} className="block group">
                  <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                    <div className={`w-full ${aspectClass} bg-gray-100`}>
                      <Image
                        src={album.coverImage}
                        alt={album.title || 'Album cover'}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={index < 6}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU1ZTUiLz48L3N2Zz4="
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h2 className="text-lg font-bold text-white">{album.title}</h2>
                      <div className="text-sm text-gray-200">
                        {album.location && <p>{album.location}</p>}
                        {album.date && <p>{formatDate(album.date)}</p>}
                        {album.images && (
                          <p className="mt-1">
                            {album.images.length} {album.images.length === 1 ? 'photo' : 'photos'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </Masonry>
        </div>
      </section>
    </div>
  );
}
