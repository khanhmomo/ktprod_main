import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

type Category = {
  id: string;
  name: string;
  slug: string;
  coverImage: string;
  count: number;
};

const categories: Category[] = [
  {
    id: '1',
    name: 'WEDDING DAY',
    slug: 'wedding-day',
    coverImage: '/images/weddingday-cover.jpeg',
    count: 24,
  },
  {
    id: '2',
    name: 'TEA CEREMONY',
    slug: 'tea-ceremony',
    coverImage: '/images/teaceramony-cover.jpg',
    count: 18,
  },
  {
    id: '3',
    name: 'PREWEDDING',
    slug: 'prewedding',
    coverImage: '/images/prewedding-cover.jpg',
    count: 22,
  },
  {
    id: '4',
    name: 'FASHION',
    slug: 'fashion',
    coverImage: '/images/fashion-cover.jpeg',
    count: 15,
  },
  {
    id: '5',
    name: 'FAMILY',
    slug: 'family',
    coverImage: '/images/family-cover.jpg',
    count: 20,
  },
  {
    id: '6',
    name: 'EVENT',
    slug: 'event',
    coverImage: '/images/event-cover.jpeg',
    count: 30,
  },
];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {categories.map((category) => (
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
                  priority={parseInt(category.id) <= 4}
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
              </div>
              <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">{category.name}</h2>
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
      </div>
    </div>
  );
}
