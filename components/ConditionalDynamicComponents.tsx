'use client';

import { usePathname } from 'next/navigation';
import DynamicComponents from './DynamicComponents';

export default function ConditionalDynamicComponents() {
  const pathname = usePathname();
  const isBusinessGalleryPage = pathname?.startsWith('/business-gallery');
  
  // Only load DynamicComponents for non-business-gallery pages to avoid SSR issues
  if (isBusinessGalleryPage) {
    return null;
  }
  
  return <DynamicComponents />;
}
