'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Masonry from 'react-masonry-css';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiX, FiArrowLeft } from 'react-icons/fi';

// Breakpoints for the masonry grid
const breakpointColumnsObj = {
  default: 3,
  1280: 3,
  1024: 2,
  768: 1,
};

interface AlbumImage {
  url: string;
  alt?: string;
}

interface Album {
  _id: string;
  title: string;
  images: AlbumImage[];
  date: string;
  location: string;
  description?: string;
  isPublished: boolean;
}

interface AlbumPageClientProps {
  initialAlbum: Album | null;
  id: string;
  initialError?: string | null;
}

export default function AlbumPageClient({ 
  initialAlbum, 
  id,
  initialError = null 
}: AlbumPageClientProps) {
  const [album, setAlbum] = useState<Album | null>(initialAlbum);
  const [isLoading, setIsLoading] = useState(!initialAlbum);
  const [error, setError] = useState<string | null>(initialError);

  // Memoize the processImageUrl function to prevent unnecessary recalculations
  const processImageUrl = useCallback((url: string | undefined): string => {
    if (!url) return '';
    
    try {
      // If it's already a local URL or not a Google Drive URL, return as is
      if (!url.includes('drive.google.com')) {
        return url;
      }

      // Extract file ID from different Google Drive URL formats
      let fileId = '';
      
      if (url.includes('export=view') || url.includes('id=')) {
        const urlObj = new URL(url);
        fileId = urlObj.searchParams.get('id') || '';
      } else if (url.includes('/file/d/')) {
        const match = url.match(/\/file\/d\/([^\/]+)/);
        fileId = match ? match[1] : '';
      }

      if (fileId) {
        // Use our API endpoint to proxy the image with quality parameter
        return `/api/drive/image?id=${encodeURIComponent(fileId)}&q=80`;
      }
      
      return url;
    } catch (error) {
      console.error('Error processing image URL:', error);
      return url || '';
    }
  }, []);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Use Intersection Observer for lazy loading images
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px',
      threshold: 0.01
    });

    // Observe all lazy images
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => observer.observe(img));

    return () => {
      observer.disconnect();
    };
  }, [album]);

  // Handle clicks outside the lightbox to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (lightboxRef.current && !lightboxRef.current.contains(event.target as Node)) {
        setIsLightboxOpen(false);
      }
    };

    if (isLightboxOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isLightboxOpen]);

  // Fetch album data if not provided
  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/albums/${id}`);
        if (!response.ok) throw new Error('Failed to fetch album');
        const data = await response.json();
        setAlbum(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching album:', err);
        setError('Failed to load album. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialAlbum && !error) {
      fetchAlbum();
    }
  }, [id, initialAlbum, error]);

  const openLightbox = (index: number) => {
    console.log('Opening lightbox with image index:', index);
    console.log('Image URL:', album?.images?.[index]?.url);
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const goToPrevious = () => {
    if (!album) return;
    setCurrentImageIndex(prevIndex => 
      prevIndex === 0 ? album.images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    if (!album) return;
    setCurrentImageIndex(prevIndex => 
      prevIndex === album.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen || !album) return;

      switch (e.key) {
        case 'Escape':
          setIsLightboxOpen(false);
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, currentImageIndex, album, goToPrevious, goToNext]);

  // Debug: Log album data when it changes
  useEffect(() => {
    if (isLightboxOpen && album?.images?.[currentImageIndex]?.url) {
      console.log('Current image URL:', album.images[currentImageIndex].url);
    }
  }, [currentImageIndex, isLightboxOpen, album]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold mb-4">Loading album...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto"></div>
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Error loading album</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/albums" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <FiArrowLeft className="mr-2" /> Back to Albums
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Album not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/albums" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <FiArrowLeft className="mr-2" /> Back to Albums
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{album.title}</h1>
        
        {(album.location || album.date) && (
          <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
            {album.location && <span>{album.location}</span>}
            {album.date && <span>{new Date(album.date).toLocaleDateString()}</span>}
          </div>
        )}
        
        {album.description && (
          <div className="w-full">
            <div className="prose prose-lg text-gray-700 max-w-none px-4">
              {album.description.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-6 leading-relaxed text-lg text-justify">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Optimized Masonry Grid Layout */}
      {album && album.images && album.images.length > 0 && (
        <div className="w-full">
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {album.images.map((image, index) => {
              const imgSrc = processImageUrl(image.url);
              const blurDataURL = `data:image/svg+xml;base64,${btoa(
                `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100%" height="100%" fill="#f3f4f6"/>
                </svg>`
              )}`;
              
              return (
                <motion.div
                  key={`${image.url}-${index}`}
                  className="mb-4 relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  onClick={() => openLightbox(index)}
                >
                  <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-w-1 aspect-h-1">
                    <Image
                      src={imgSrc}
                      alt={image.alt || `${album?.title || ''} image ${index + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover transition-opacity duration-300 hover:opacity-90"
                      loading={index < 3 ? 'eager' : 'lazy'}
                      placeholder="blur"
                      blurDataURL={blurDataURL}
                      unoptimized={imgSrc.includes('drive.google.com')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.warn('Image load error, trying fallback URL:', image.url);
                        
                        if (target.src !== image.url) {
                          target.src = image.url;
                        } 
                        else if (target.src.includes('export=view')) {
                          target.src = image.url.replace('export=view', 'export=download');
                        } else {
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIyLjUiPjwvY2lyY2xlPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEiPjwvcG9seWxpbmU+PC9zdmc+';
                        }
                      }}
                    />
                    {image.alt && !image.alt.match(/\.[^/.]+$/) && (
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-sm">{image.alt}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </Masonry>
        </div>
      )}

      <style jsx global>{`
        .masonry-container {
          width: 100%;
        }
        .masonry-grid {
          display: flex;
          margin-left: -1rem;
          width: auto;
        }
        .masonry-grid_column {
          padding-left: 1rem;
          background-clip: padding-box;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .masonry-item {
          width: 100%;
          break-inside: avoid;
          position: relative;
        }
        .masonry-item > div {
          height: 100%;
          width: 100%;
        }
        .image-container {
          background: #f5f5f5;
          border-radius: 0.5rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .image-container:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .masonry-image {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 0.3s ease;
        }
        .image-container:hover .masonry-image {
          transform: scale(1.02);
        }
        .image-caption {
          padding: 0.75rem;
          background: white;
          border-top: 1px solid #eee;
        }
        .caption-text {
          font-weight: 500;
          color: #333;
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        .location-text {
          color: #6b7280;
          font-size: 0.75rem;
          line-height: 1rem;
          margin: 0;
        }
        @media (max-width: 1024px) {
          .masonry-grid {
            margin-left: -0.75rem;
          }
          .masonry-grid_column {
            padding-left: 0.75rem;
          }
        }
        @media (max-width: 640px) {
          .masonry-grid {
            margin-left: -0.5rem;
          }
          .masonry-grid_column {
            padding-left: 0.5rem;
          }
        }
      `}</style>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && album && album.images.length > 0 && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
          >
            <div className="relative w-full max-w-6xl max-h-full" ref={lightboxRef}>
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(false);
                }}
                className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-300 transition-colors"
              >
                <FiX />
              </button>

              {/* Navigation arrows */}
              {album.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevious();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors z-10"
                    aria-label="Previous image"
                  >
                    <FiChevronLeft size={32} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors z-10"
                    aria-label="Next image"
                  >
                    <FiChevronRight size={32} />
                  </button>
                </>
              )}

              {/* Current image */}
              <motion.div 
                key={`lightbox-${currentImageIndex}`}
                className="relative w-full h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {(() => {
                  if (!album) return null;
                  
                  const currentImage = album.images[currentImageIndex];
                  const imageUrl = currentImage?.url;
                  
                  if (!imageUrl) {
                    return (
                      <div className="text-white text-center p-4">
                        <p>Error: No image URL available</p>
                        <p className="text-sm opacity-75">Index: {currentImageIndex}</p>
                      </div>
                    );
                  }

                  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
                    const target = e.target as HTMLImageElement;
                    console.error('Image failed to load:', imageUrl);
                    
                    if (target && !target.src.endsWith('/placeholder-image.jpg')) {
                      target.onerror = null;
                      target.src = '/placeholder-image.jpg';
                    }
                  };

                  return (
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                      <img
                        src={processImageUrl(imageUrl)}
                        alt={currentImage.alt || `${album.title} - Image ${currentImageIndex + 1}`}
                        className="max-w-full max-h-[90vh] object-contain"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '90vh',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        onError={handleImageError}
                        onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.target as HTMLImageElement;
                          console.log('✅ Image loaded successfully', {
                            url: imageUrl,
                            resolvedUrl: target.src,
                            dimensions: {
                              naturalWidth: target.naturalWidth,
                              naturalHeight: target.naturalHeight,
                              displayWidth: target.width,
                              displayHeight: target.height
                            },
                            state: {
                              complete: target.complete,
                              readyState: target.complete ? 'complete' : 'loading'
                            },
                            timestamp: new Date().toISOString()
                          });
                        }}
                      />
                    </div>
                  );
                })()}
              </motion.div>

              {/* Image counter */}
              <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                {currentImageIndex + 1} of {album.images.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
