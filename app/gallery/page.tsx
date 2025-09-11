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
    name: 'Wedding',
    slug: 'wedding',
    coverImage: '/images/wedding-cover.jpg',
    count: 24,
  },
  {
    id: '2',
    name: 'Prewedding',
    slug: 'prewedding',
    coverImage: '/images/prewedding-cover.jpg',
    count: 18,
  },
  {
    id: '3',
    name: 'Event',
    slug: 'event',
    coverImage: '/images/event-cover.jpg',
    count: 32,
  },
  {
    id: '4',
    name: 'Studio',
    slug: 'studio',
    coverImage: '/images/studio-cover.jpg',
    count: 15,
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/gallery/${category.slug}`}
              className="group block h-full"
            >
              <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="w-full aspect-[4/3] bg-gray-100 flex-shrink-0">
                  <Image
                    src={category.coverImage}
                    alt={`${category.name} category`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    priority
                  />
                  {/* Mobile: Always visible */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-6 text-center md:hidden">
                    <span className="text-xl font-medium text-white font-cormorant">
                      {category.name}
                    </span>
                  </div>
                  
                  {/* Desktop: Visible on hover */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 transition-all duration-300 hidden md:flex opacity-0 group-hover:opacity-100">
                    <div className="text-center">
                      <h2 className="text-2xl font-medium text-white font-cormorant">{category.name}</h2>
                      <p className="text-white/80 text-sm mt-2">
                        View Collection
                      </p>
                    </div>
                  </div>
                </div>
                {/* Desktop: Always visible info */}
                <div className="p-4 hidden md:block flex-grow">
                  <h3 className="font-medium text-gray-900 line-clamp-2 text-center">{category.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
