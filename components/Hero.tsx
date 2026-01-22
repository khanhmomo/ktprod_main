'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useEffect, useState, useRef } from 'react';

interface ShowcaseItem {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
}

interface HeroContent {
  headline: string;
  primaryButton: { text: string; href: string; style: string };
  secondaryButton: { text: string; href: string; style: string };
  slideshowInterval: number;
  showNavigation: boolean;
  showIndicators: boolean;
}

export default function Hero() {
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseItem[]>([]);
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Use useRef to store the interval ID
  const slideshowInterval = useRef<NodeJS.Timeout | null>(null);

  const startSlideshow = () => {
    console.log('startSlideshow called, showcaseItems.length:', showcaseItems.length);
    console.log('heroContent:', heroContent);
    
    // Clear any existing interval
    if (slideshowInterval.current) {
      console.log('Clearing existing interval');
      clearInterval(slideshowInterval.current);
    }
    
    // Set up new interval to change slides using dynamic interval
    const interval = heroContent?.slideshowInterval || 2000;
    console.log('Setting interval to:', interval);
    
    if (showcaseItems.length > 1) {
      slideshowInterval.current = setInterval(() => {
        console.log('Slideshow tick, current slide:', currentSlide);
        setCurrentSlide((prev) => (prev + 1) % showcaseItems.length);
      }, interval);
      console.log('Slideshow interval started');
    } else {
      console.log('Not enough items for slideshow');
    }
  };

  // Handle manual slide change
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    // Reset the slideshow timer when manually changing slides
    startSlideshow();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch showcase items
        console.log('Fetching showcase items...');
        const showcaseResponse = await fetch('/api/showcase?activeOnly=true');
        if (showcaseResponse.ok) {
          const showcaseData = await showcaseResponse.json();
          console.log(`Received ${showcaseData.length} showcase items from API`);
          setShowcaseItems(showcaseData);
          // Start slideshow only if we have showcase items
          if (showcaseData.length > 0) {
            console.log('About to call startSlideshow with', showcaseData.length, 'items');
            // Note: We'll call startSlideshow after heroContent is also loaded
          }
        }

        // Fetch hero content
        console.log('Fetching hero content...');
        const contentResponse = await fetch('/api/homepage');
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          console.log('Hero content received:', contentData.hero);
          setHeroContent(contentData.hero);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      // Cleanup slideshow interval on component unmount
      if (slideshowInterval.current) {
        clearInterval(slideshowInterval.current);
      }
    };
  }, []);

  // Start slideshow when both showcaseItems and heroContent are available
  useEffect(() => {
    console.log('useEffect for slideshow - showcaseItems.length:', showcaseItems.length, 'heroContent:', !!heroContent);
    if (showcaseItems.length > 1 && heroContent) {
      console.log('Starting slideshow in useEffect');
      startSlideshow();
    }
  }, [showcaseItems, heroContent]);

  return (
    <section className="relative h-screen w-full -mt-24 pt-24 flex items-center justify-center overflow-hidden">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        {isLoading ? (
          <div className="w-full h-full bg-gray-200 animate-pulse" />
        ) : showcaseItems.length > 0 ? (
          <div className="relative w-full h-full">
            {showcaseItems.map((item, index) => (
              <motion.div
                key={item._id}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: index === currentSlide ? 1 : 0,
                  zIndex: index === currentSlide ? 1 : 0
                }}
                transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title || 'Showcase Background'}
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

      {/* Hero Content */}
      <div className="container mx-auto px-4 z-10 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 px-4 text-center">
            {heroContent?.headline || 'Let us tell your story in a different way'}
          </h1>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={heroContent?.primaryButton?.href || '#contact'}
              className="bg-white text-black px-8 py-4 rounded-full font-semibold flex items-center justify-center border-2 border-white hover:bg-gray-100 transition-colors"
            >
              {heroContent?.primaryButton?.text || 'Book now'}
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={heroContent?.secondaryButton?.href || '/gallery'}
              className=" text-white px-8 py-4 rounded-full font-semibold flex items-center justify-center border-2 border-white  transition-colors"
            >
              {heroContent?.secondaryButton?.text || 'View Our Work'}
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
