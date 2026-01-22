'use client';

import { motion } from 'framer-motion';
import { FaYoutube, FaPlay } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import VideoModal from '@/components/VideoModal';

interface Film {
  _id: string;
  title: string;
  description: string;
  youtubeId: string;
  thumbnail: string;
  createdAt: string;
}

export default function Film() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<{id: string, title: string} | null>(null);

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        console.log('Fetching films from API...');
        const response = await fetch('/api/films', {
          cache: 'no-store', // Ensure we don't get cached data
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('API response status:', response.status);
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Failed to fetch films:', data);
          throw new Error(data.error || 'Failed to fetch films');
        }
        
        console.log('Fetched films:', JSON.stringify(data, null, 2));
        setFilms(data);
      } catch (error) {
        console.error('Error fetching films:', error);
        // You might want to show an error message to the user
      } finally {
        setLoading(false);
      }
    };

    fetchFilms();
  }, []);

  const openVideo = (film: Film) => {
    setSelectedVideo({ 
      id: film.youtubeId,
      title: film.title
    });
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    // Re-enable background scrolling when modal is closed
    document.body.style.overflow = 'auto';
  };

  const getVideoThumbnail = (film: Film) => {
    // If we have a thumbnail, use it
    if (film.thumbnail) {
      console.log(`Using stored thumbnail for ${film.title}:`, film.thumbnail);
      return film.thumbnail;
    }
    
    // If we have a YouTube ID, generate thumbnail URL
    if (film.youtubeId) {
      const ytThumbnail = `https://img.youtube.com/vi/${film.youtubeId}/hqdefault.jpg`;
      console.log(`Generated YouTube thumbnail for ${film.title}:`, ytThumbnail);
      return ytThumbnail;
    }
    
    console.log(`No thumbnail available for ${film.title}, using fallback`);
    return '/placeholder-video.svg';
  };

  return (
    <div className="bg-white -mt-8">
      {/* Hero Section */}
      <section className="relative pt-4 pb-16 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-4 mt-8 font-cormorant"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Film & Motion
          </motion.h1>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <motion.p 
            className="text-gray-600 max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Experience the magic of your special moments through our cinematic storytelling.
          </motion.p>
        </div>
      </section>

      {/* Video Gallery Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {/* Video Grid */}
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {films.map((film, index) => (
                <motion.div
                  key={film._id}
                  className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="relative aspect-video bg-black">
                    <div className="relative w-full h-full overflow-hidden">
                      {/* Thumbnail Image */}
                      <img
                        src={getVideoThumbnail(film)}
                        alt={film.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-video.svg';
                        }}
                      />
                      
                      {/* Play Button Overlay - Always Visible */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 group-hover:bg-red-600 group-hover:scale-110 transition-all duration-300">
                          <FaPlay className="text-white text-3xl" />
                        </div>
                      </div>
                      
                      {/* Title Overlay - Bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h3 className="text-white font-semibold text-lg">{film.title}</h3>
                        {film.description && (
                          <p className="text-gray-200 text-sm mt-1 line-clamp-1">{film.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      className="absolute inset-0 w-full h-full focus:outline-none"
                      onClick={() => openVideo(film)}
                      aria-label={`Play ${film.title}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && films.length === 0 && (
            <div className="text-center py-12 col-span-full">
              <p className="text-gray-500">No videos available at the moment. Please check back later.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 font-cormorant">Ready to capture your story?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Let's create something beautiful together. Contact us to discuss your project and how we can help bring your vision to life.
          </p>
          <a
            href="/contact"
            className="inline-block bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={closeVideo}
          videoId={selectedVideo.id}
          title={selectedVideo.title}
        />
      )}
    </div>
  );
}
