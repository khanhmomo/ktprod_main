'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the GalleryForm component with no SSR
const GalleryForm = dynamic(
  () => import('@/components/admin/GalleryForm'),
  { ssr: false }
);

export default function NewGalleryPage() {
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <GalleryForm />
    </div>
  );
}
