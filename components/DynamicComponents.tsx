'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy components in a client component
const AdvertisementPopup = dynamic(() => import('./AdvertisementPopup'), {
  ssr: false,
  loading: () => null
});

const CustomerChatWidget = dynamic(() => import('./CustomerChatWidget'), {
  ssr: false,
  loading: () => null
});

export default function DynamicComponents() {
  const [isBusinessGalleryPage, setIsBusinessGalleryPage] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setIsBusinessGalleryPage(pathname?.startsWith('/business-gallery') || false);
  }, [pathname]);
  
  return (
    <>
      <AdvertisementPopup />
      {!isBusinessGalleryPage && <CustomerChatWidget />}
    </>
  );
}
