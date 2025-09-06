'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface AlbumImage {
  url: string;
  alt?: string;
}

export interface Album {
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

export default function Albums() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch albums on component mount
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/albums');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAlbums(Array.isArray(data) ? data : []);
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

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedAlbum) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? selectedAlbum.images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedAlbum) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === selectedAlbum.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const closeLightbox = () => {
    setIsOpen(false);
    // Re-enable body scroll when lightbox is closed
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const openLightbox = (album: Album, index: number = 0) => {
    setSelectedAlbum(album);
    setCurrentImageIndex(index);
    setIsOpen(true);
    // Disable body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeLightbox();
    }
  };

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
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
      <div className="text-center py-12">
        <p className="text-gray-500">No albums available at the moment.</p>
      </div>
    );
  }

  return (
    <section className="py-20 bg-white" id="albums">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Albums</h2>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse through our curated collections of photographs from various sessions and events.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {albums.map((album, index) => (
            <motion.div
              key={album._id}
              className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => openLightbox(album, 0)}
            >
              <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden">
                <img
                  src={album.coverImage}
                  alt={album.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-4 bg-black/0 group-hover:bg-black/30 transition-all duration-300">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white text-xl font-bold mb-1">{album.title}</h3>
                  <p className="text-gray-200 text-sm">{album.location}</p>
                  <p className="text-gray-300 text-xs mt-1">
                    {album.images.length} {album.images.length === 1 ? 'photo' : 'photos'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {isOpen && selectedAlbum && selectedAlbum.images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col p-4 overflow-y-auto"
          onClick={handleBackdropClick}
        >
          {/* Close button */}
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-3xl focus:outline-none z-10"
            aria-label="Close lightbox"
          >
            &times;
          </button>
          
          {/* Main image container */}
          <div className="relative w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center">
            <motion.img
              key={currentImageIndex}
              src={selectedAlbum.images[currentImageIndex].url}
              alt={selectedAlbum.images[currentImageIndex].alt || `Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            {/* Navigation arrows */}
            {selectedAlbum.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Previous image"
                >
                  &larr;
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Next image"
                >
                  &rarr;
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Navigation - Fixed at bottom */}
          {selectedAlbum.images.length > 1 && (
            <div className="w-full max-w-3xl mx-auto mt-4 px-4 pb-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedAlbum.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded overflow-hidden transition-transform ${
                      currentImageIndex === index 
                        ? 'ring-2 ring-white transform -translate-y-1' 
                        : 'opacity-70 hover:opacity-100 hover:transform hover:-translate-y-0.5'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Album info */}
          <div className="text-white text-center w-full max-w-3xl mx-auto">
            <div className="bg-black bg-opacity-75 p-4 md:p-6 rounded-lg max-h-[30vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">{selectedAlbum.title}</h3>
                <p className="text-sm text-gray-300">
                  {currentImageIndex + 1} / {selectedAlbum.images.length}
                </p>
              </div>
              
              {(selectedAlbum.location || selectedAlbum.date) && (
                <p className="text-sm text-gray-300 mb-3">
                  {selectedAlbum.location && <span>{selectedAlbum.location}</span>}
                  {selectedAlbum.location && selectedAlbum.date && ' • '}
                  {selectedAlbum.date && <span>{formatDate(selectedAlbum.date)}</span>}
                </p>
              )}
              
              {selectedAlbum.images[currentImageIndex]?.alt && (
                <p className="mt-2 text-sm italic text-gray-300">
                  {selectedAlbum.images[currentImageIndex]?.alt}
                </p>
              )}
              
              {selectedAlbum.description && (
                <p className="mt-3 text-gray-300">{selectedAlbum.description}</p>
              )}
            </div>
            
          </div>
        </div>
      )}
    </section>
  );
}
