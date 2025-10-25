'use client';

import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Masonry from 'react-masonry-css';
import { Album } from '@/types';

export default function CategoryClient() {
  const params = useParams();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const category = params.category as string;
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  
  // Validate category
  const validCategories = ['wedding-day', 'tea-ceremony', 'prewedding', 'fashion', 'family', 'event'];
  const normalizedCategory = category.toLowerCase();
  if (!validCategories.includes(normalizedCategory)) {
    notFound();
  }

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await fetch(`/api/albums?category=${encodeURIComponent(normalizedCategory)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch albums: ${res.statusText}`);
        }
        const data = await res.json();
        setAlbums(data);
      } catch (error) {
        console.error('Failed to fetch albums:', error);
        // Optionally set an error state to show to the user
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, [category]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!albums || albums.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No albums available in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white -mt-8">
      <section className="relative pt-4 pb-16 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 mt-8 font-cormorant">{categoryName}</h1>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            Explore our collection of {categoryName.toLowerCase()} photography.
          </p>
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
          {albums.map((album) => (
            <div key={album._id.toString()} className="mb-4 break-inside-avoid w-full">
              <Link href={`/albums/${album._id.toString()}`} className="block group h-full">
                <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="w-full aspect-[4/3] bg-gray-100 flex-shrink-0">
                    <Image
                      src={album.coverImage}
                      alt={album.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Mobile: Always visible */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-6 text-center md:hidden">
                      <div>
                        <h2 className="text-xl font-medium text-white font-cormorant">{album.title}</h2>
                        {album.location && (
                          <p className="text-white/80 text-sm mt-1">
                            {album.location}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Desktop: Visible on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-4 transition-all duration-300 hidden md:flex opacity-0 group-hover:opacity-100">
                      <div className="text-left w-full">
                        <h2 className="text-xl font-medium text-white font-cormorant">{album.title}</h2>
                        {album.location && (
                          <p className="text-white/80 text-sm">
                            {album.location}
                          </p>
                        )}
                        {album.date && (
                          <p className="text-white/80 text-sm mt-1">
                            {new Date(album.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                        {new Date(album.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </Masonry>
      </div>
    </div>
  );
}
