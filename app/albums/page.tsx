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
  category: 'Wedding' | 'Prewedding' | 'Event' | 'Studio';
}

type Category = 'All' | 'Wedding' | 'Prewedding' | 'Event' | 'Studio';

const categories: Category[] = ['All', 'Wedding', 'Prewedding', 'Event', 'Studio'];

// Function to process image URLs to use our high quality proxy
function processImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  try {
    if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
      let fileId = '';
      
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1]?.split('/')[0];
      } else if (url.includes('id=')) {
        fileId = new URL(url).searchParams.get('id') || '';
      } else {
        const match = url.match(/[\w-]{25,}/);
        if (match) fileId = match[0];
      }
      
      if (fileId) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        return `${baseUrl}/api/drive/image?id=${fileId}`;
      }
    }
  } catch (e) {
    console.error("Error processing image URL:", url, e);
  }
  
  return url;
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
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

  // Filter albums by selected category
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredAlbums(albums);
    } else {
      setFilteredAlbums(albums.filter(album => album.category === selectedCategory));
    }
  }, [selectedCategory, albums]);

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
        
        // Process album cover images to use high quality proxy
        const processedAlbums = albumsData.map((album: Album) => ({
          ...album,
          coverImage: processImageUrl(album.coverImage)
        }));
        
        setAlbums(processedAlbums);
        setFilteredAlbums(processedAlbums); // Initialize filtered albums with all albums

        // Calculate aspect ratios for all album covers
        const aspectRatios: Record<string, string> = {};
        await Promise.all(
          processedAlbums.map(async (album: Album) => {
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

  const CategoryButton = ({ category }: { category: Category }) => (
    <button
      onClick={() => setSelectedCategory(category)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        selectedCategory === category
          ? 'bg-black text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {category}
    </button>
  );

  return (
    <div className="bg-white -mt-8">
      <section className="relative pt-4 pb-16 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-4 mt-8 font-cormorant"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Our Gallery
          </motion.h1>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            Browse through our collection of photo albums from various categories.
          </p>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 px-4">
            {categories.map((category) => (
              <CategoryButton key={category} category={category} />
            ))}
          </div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-12">

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
          {filteredAlbums.map((album, index) => {
            // Get the pre-calculated aspect ratio or use default
            const aspectClass = imageAspectRatios[album._id] || 'aspect-[4/3]';

            return (
              <div key={album._id} className="mb-4 break-inside-avoid w-full">
                <Link href={`/albums/${album._id}`} className="block group h-full">
                  <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    <div className="w-full aspect-[4/3] bg-gray-100 flex-shrink-0">
                      <Image
                        src={album.coverImage}
                        alt={album.title || 'Album cover'}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={index < 6}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU1ZTUiLz48L3N2Zz4="
                      />
                      {/* Mobile: Always visible */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-6 text-center md:hidden">
                        <div>
                          <h2 className="text-xl font-medium text-white font-cormorant">{album.title}</h2>
                          {album.date && (
                            <p className="text-white/80 text-sm mt-1">
                              {formatDate(album.date)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Desktop: Visible on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4 text-center transition-all duration-300 hidden md:flex opacity-0 group-hover:opacity-100">
                        <div className="w-full">
                          <h2 className="text-xl font-medium text-white font-cormorant">{album.title}</h2>
                          {album.date && (
                            <p className="text-white/80 text-sm">
                              {formatDate(album.date)}
                            </p>
                          )}
                          {album.location && (
                            <p className="text-white/80 text-sm mt-1">
                              {album.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Desktop: Always visible info */}
                    <div className="p-4 hidden md:block flex-grow">
                      <h3 className="font-medium text-gray-900 line-clamp-2">{album.title}</h3>
                      {album.date && (
                        <p className="text-gray-500 text-sm mt-1">
                          {formatDate(album.date)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </Masonry>
      </div>
    </div>
  );
}
