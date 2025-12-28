'use client';

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
  return (
    <>
      <AdvertisementPopup />
      <CustomerChatWidget />
    </>
  );
}
