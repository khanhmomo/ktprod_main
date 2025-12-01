'use client';

import { useState, useEffect, use } from 'react';
import CategoryForm from '@/components/admin/CategoryForm';

interface Category {
  id: string;
  name: string;
  slug: string;
  coverImage: string;
  description?: string;
  isActive: boolean;
}

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    try {
      const response = await fetch('/api/categories?includeInactive=true');
      if (response.ok) {
        const categories = await response.json();
        const foundCategory = categories.find((cat: Category) => cat.id === id);
        
        if (foundCategory) {
          setCategory(foundCategory);
        } else {
          // Category not found
          return (
            <div className="max-w-2xl mx-auto px-4 py-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Category Not Found</h1>
                <p className="text-gray-600 mb-8">The category you're looking for doesn't exist.</p>
                <a
                  href="/admin/categories"
                  className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Back to Categories
                </a>
              </div>
            </div>
          );
        }
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-8">The category you're looking for doesn't exist.</p>
          <a
            href="/admin/categories"
            className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to Categories
          </a>
        </div>
      </div>
    );
  }

  return <CategoryForm initialData={category} isEditing={true} />;
}
