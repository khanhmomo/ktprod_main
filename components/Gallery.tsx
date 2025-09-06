'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Sample gallery images with reliable Unsplash URLs
const galleryImages = [
  { 
    id: 1, 
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&auto=format&fit=crop', 
    alt: 'Professional headshot portrait', 
    category: 'portrait' 
  },
  { 
    id: 2, 
    src: 'https://images.unsplash.com/photo-1529333241834-215489d29660?w=1200&auto=format&fit=crop', 
    alt: 'Wedding couple', 
    category: 'wedding' 
  },
  { 
    id: 3, 
    src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&auto=format&fit=crop', 
    alt: 'Corporate portrait', 
    category: 'portrait' 
  },
  { 
    id: 4, 
    src: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&auto=format&fit=crop', 
    alt: 'Product photography', 
    category: 'commercial' 
  },
  { 
    id: 5, 
    src: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1200&auto=format&fit=crop', 
    alt: 'Conference event', 
    category: 'event' 
  },
  { 
    id: 6, 
    src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&auto=format&fit=crop', 
    alt: 'Wedding rings', 
    category: 'wedding' 
  },
  { 
    id: 7, 
    src: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&auto=format&fit=crop', 
    alt: 'Music festival', 
    category: 'event' 
  },
  { 
    id: 8, 
    src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop', 
    alt: 'Fashion photography', 
    category: 'commercial' 
  },
  { 
    id: 9, 
    src: 'https://images.unsplash.com/photo-1554151228-14d9a65613ce?w=1200&auto=format&fit=crop', 
    alt: 'Casual portrait', 
    category: 'portrait' 
  },
  { 
    id: 10, 
    src: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=1200&auto=format&fit=crop', 
    alt: 'Wedding ceremony', 
    category: 'wedding' 
  },
  { 
    id: 11, 
    src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop', 
    alt: 'Corporate event', 
    category: 'event' 
  },
  { 
    id: 12, 
    src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop', 
    alt: 'Lifestyle product', 
    category: 'commercial' 
  },
];

const categories = ['all', 'portrait', 'wedding', 'event', 'commercial'];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const filteredImages = selectedCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(image => image.category === selectedCategory);

  const openLightbox = (id: number) => {
    setSelectedImage(id);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <section className="py-20 bg-gray-50" id="gallery">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Gallery</h2>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our collection of stunning photographs from various sessions and events.
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              className="group relative overflow-hidden rounded-lg cursor-pointer aspect-square"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => openLightbox(image.id)}
            >
              <div className="relative w-full h-full">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading={index < 4 ? 'eager' : 'lazy'}
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 text-white text-lg font-medium">
                  View
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedImage !== null && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button 
              className="absolute top-4 right-4 text-white text-3xl"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
            >
              &times;
            </button>
            <div className="relative w-full max-w-4xl h-full max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <img
                src={galleryImages.find(img => img.id === selectedImage)?.src || ''}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
