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
  
  return {
    title: `${category.name} Gallery | The Wild Studio`,
    description: category.description || `Browse our collection of ${category.name.toLowerCase()} photography.`,
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
