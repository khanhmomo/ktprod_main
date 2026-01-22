'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Category = {
  id: string;
  name: string;
  slug: string;
  coverImage: string;
  description?: string;
  count: number;
};

export default function GalleryClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative block h-[500px] overflow-hidden rounded-xl shadow-lg animate-pulse">
            <div className="absolute inset-0 bg-gray-300"></div>
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No categories available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      {categories.map((category, index) => (
        <Link
          key={category.id}
          href={`/gallery/${category.slug}`}
          className="group relative block h-[500px] overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500"
        >
          <div className="absolute inset-0">
            <Image
              src={category.coverImage}
              alt={category.name}
              fill
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={index < 4}
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
          </div>
          <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">{category.name}</h2>
            {category.description && (
              <p className="text-white text-sm mb-4 max-w-md">{category.description}</p>
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="inline-flex items-center text-white text-sm font-medium border-b border-transparent hover:border-white transition-colors">
                VIEW GALLERY
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
