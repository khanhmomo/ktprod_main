'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useEffect, useState, useRef } from 'react';

interface Album {
  _id: string;
  title: string;
  coverImage: string;
  images: { url: string; alt?: string }[];
  featuredInHero?: boolean;
}

export default function Hero() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        console.log('Fetching albums...');
        const response = await fetch('/api/albums');
        if (response.ok) {
          const data = await response.json();
          console.log(`Received ${data.length} albums from API`);
          setAlbums(data);
          // Start slideshow only if we have albums
          if (data.length > 0) {
            console.log('Starting slideshow with', data.length, 'albums');
            startSlideshow();
          }
        }
      } catch (error) {
        console.error('Error fetching albums:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();

    return () => {
      // Cleanup slideshow interval on component unmount
      if (slideshowInterval.current) {
        clearInterval(slideshowInterval.current);
      }
    };
  }, []);

  const startSlideshow = () => {
    // Clear any existing interval
    if (slideshowInterval.current) {
      clearInterval(slideshowInterval.current);
    }
    
    // Set up new interval to change slides every 2 seconds on all devices
    slideshowInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % (albums.length || 1));
    }, 2000); // Change slide every 2 seconds for both mobile and desktop
  };

  // Handle manual slide change
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    // Reset the slideshow timer when manually changing slides
    startSlideshow();
  };

  // Use useRef to store the interval ID
  const slideshowInterval = useRef<NodeJS.Timeout | null>(null);

  return (
    <section className="relative h-screen w-full -mt-24 pt-24 flex items-center justify-center overflow-hidden">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        {isLoading ? (
          <div className="w-full h-full bg-gray-200 animate-pulse" />
        ) : albums.length > 0 ? (
          <div className="relative w-full h-full">
            {albums.map((album, index) => (
              <motion.div
                key={album._id}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: index === currentSlide ? 1 : 0,
                  zIndex: index === currentSlide ? 1 : 0
                }}
                transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <Image
                  src={album.coverImage}
                  alt={album.title || 'Studio Background'}
                  fill
                  priority={index <= 1} // Only prioritize first two images for loading
                  className="object-cover"
                  quality={85}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300" />
        )}
      </div>

      {/* Navigation Arrows */}
      {albums.length > 1 && (
        <>
          <button 
            onClick={() => goToSlide((currentSlide - 1 + albums.length) % albums.length)}
            className="absolute left-4 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
            aria-label="Previous slide"
          >
            <FiChevronLeft size={32} />
          </button>
          <button 
            onClick={() => goToSlide((currentSlide + 1) % albums.length)}
            className="absolute right-4 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
            aria-label="Next slide"
          >
            <FiChevronRight size={32} />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {albums.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2">
          {albums.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Hero Content */}
      <div className="container mx-auto px-4 z-10 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 px-4 text-center">
            Let us tell your story differently way
          </h1>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="#contact"
              className="bg-white text-black px-8 py-4 rounded-full font-semibold flex items-center justify-center border-2 border-white hover:bg-gray-100 transition-colors"
            >
              Book now
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/gallery"
              className=" text-white px-8 py-4 rounded-full font-semibold flex items-center justify-center border-2 border-white  transition-colors"
            >
              View Our Work
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
