import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryClient from './CategoryClient';
import dbConnect from '@/lib/db';
import { Category } from '@/models/Category';

// Generate static metadata
export async function generateMetadata({ 
  params 
}: { 
  params: { category: string } 
}): Promise<Metadata> {
  await dbConnect();
  
  // Find the category by slug
  const category = await Category.findOne({ 
    slug: params.category.toLowerCase(),
    isActive: true 
  });
  
  if (!category) {
    return {
      title: 'Category Not Found | The Wild Studio',
      description: 'This category does not exist or is not active.',
    };
  }
  
  const siteUrl = 'https://thewildstudio.org';
  const title = `${category.name.toUpperCase()} | THE WILD STUDIO`;
  const description = category.description || `Browse our collection of ${category.name.toLowerCase()} photography.`;
  
  return {
    title,
    description,
    alternates: {
      canonical: `/gallery/${params.category}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/gallery/${params.category}`,
      siteName: 'The Wild Studio',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${category.name} Gallery - The Wild Studio`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/images/og-image.jpg`],
    },
  };
}

// This is a Server Component
export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  await dbConnect();
  
  // Validate category exists and is active
  const category = await Category.findOne({ 
    slug: params.category.toLowerCase(),
    isActive: true 
  });
  
  if (!category) {
    notFound();
  }

  // Convert Mongoose document to plain object
  const plainCategory = {
    _id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    coverImage: category.coverImage,
    description: category.description,
    isActive: category.isActive
  };

  return <CategoryClient category={plainCategory} />;
}
