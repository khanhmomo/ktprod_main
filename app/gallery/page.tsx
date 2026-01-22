import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import GalleryClient from './GalleryClient';

type Category = {
  id: string;
  name: string;
  slug: string;
  coverImage: string;
  description?: string;
  count: number;
};

export const metadata: Metadata = {
  title: 'Gallery | The Wild Studio',
  description: 'Browse our collection of photography categories including weddings, prewedding, events, and studio sessions.',
};

export default function GalleryPage() {
  return (
    <div className="bg-white -mt-8">
      <section className="relative pt-4 pb-16 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 mt-8">Our Gallery</h1>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            Explore our curated collection of photography work across different categories.
          </p>
        </div>
      </section>
      
      <div className="container mx-auto px-4 py-12">
        <GalleryClient />
      </div>
    </div>
  );
}
