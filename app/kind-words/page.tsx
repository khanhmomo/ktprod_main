'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface KindWord {
  _id: string;
  text: string;
  customerName?: string;
  imageUrl: string;
  imageAlt: string;
  createdAt: string;
  order?: number;
}

export default function KindWords() {
  const [kindWords, setKindWords] = useState<KindWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchKindWords();
  }, []);

  const fetchKindWords = async () => {
    try {
      const response = await fetch('/api/kind-words');
      const data = await response.json();
      console.log('Kind words data:', data); // Debug log
      
      // Sort by order field, then by createdAt if no order
      const sortedData = data.sort((a: KindWord, b: KindWord) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      setKindWords(sortedData);
    } catch (error) {
      console.error('Error fetching kind words:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white -mt-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white -mt-8">
      {/* Hero Section */}
      <section className="relative pt-4 pb-16 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Kind Words
          </motion.h1>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Hear what our amazing couples have to say about their experience with us.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            {kindWords.map((kindWord, index) => {
              const orderNumber = kindWord.order !== undefined ? kindWord.order + 1 : index + 1;
              const isOddOrder = orderNumber % 2 === 1;
              
              return (
                <motion.div
                  key={kindWord._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`flex flex-col md:flex-row items-center gap-8 max-w-5xl mx-auto ${
                    isOddOrder ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <div className="flex-1">
                    <div className="rounded-xl overflow-hidden shadow-xl cursor-pointer hover:shadow-2xl transition-shadow duration-300">
                      {kindWord.imageUrl ? (
                        <>
                          {console.log('Rendering image with URL:', kindWord.imageUrl)}
                          <img 
                            src={kindWord.imageUrl}
                            alt={kindWord.imageAlt || 'Customer testimonial'}
                            className="w-full h-auto object-contain"
                            onClick={() => setSelectedImage(kindWord.imageUrl)}
                            onError={(e) => {
                              console.error('Img failed to load:', kindWord.imageUrl);
                              console.error('Error event:', e);
                            }}
                            onLoad={() => {
                              console.log('Img loaded successfully:', kindWord.imageUrl);
                            }}
                          />
                        </>
                      ) : (
                        <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                          <p className="text-gray-500">No image available</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`text-center ${isOddOrder ? 'md:text-left' : 'md:text-right'}`}>
                      <p className="text-lg text-gray-700 leading-relaxed mb-4 italic">
                        "{kindWord.text}"
                      </p>
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-0.5 bg-black mr-4"></div>
                        <span className="text-sm text-gray-600">{kindWord.customerName || 'Happy Client'}</span>
                        <div className="w-16 h-0.5 bg-black ml-4"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {kindWords.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No kind words available yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors z-10"
              onClick={() => setSelectedImage(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={selectedImage} 
              alt="Kind word image" 
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to create your story?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Let's capture your special moments together. Contact us to book your session today.
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-black font-bold py-3 px-8 rounded-md hover:bg-gray-200 transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
}
