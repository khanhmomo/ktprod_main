import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryClient from './CategoryClient';

// Generate static metadata
export async function generateMetadata({ 
  params 
}: { 
  params: { category: string } 
}): Promise<Metadata> {
  const categoryName = params.category.charAt(0).toUpperCase() + params.category.slice(1);
  return {
    title: `${categoryName} Gallery | The Wild Studio`,
    description: `Browse our collection of ${categoryName.toLowerCase()} photography.`,
  };
}

// This is a Server Component
export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  // Validate category
  const validCategories = ['wedding', 'prewedding', 'event', 'studio'];
  if (!validCategories.includes(params.category.toLowerCase())) {
    notFound();
  }

  return <CategoryClient />;
}
