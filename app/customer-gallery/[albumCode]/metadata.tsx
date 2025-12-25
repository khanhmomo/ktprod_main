import { Metadata } from 'next';

interface GalleryMetadata {
  title: string;
  customerName: string;
  eventType: string;
  coverPhotoUrl: string;
  albumCode: string;
}

export function generateGalleryMetadata(gallery: GalleryMetadata): Metadata {
  const siteUrl = 'https://thewildstudio.org';
  const galleryUrl = `${siteUrl}/customer-gallery/${gallery.albumCode}`;
  
  return {
    title: `${gallery.title || `${gallery.customerName}'s ${gallery.eventType}`} | The Wild`,
    description: `View ${gallery.customerName}'s ${gallery.eventType} gallery by The Wild. Professional photography and videography services.`,
    openGraph: {
      title: gallery.title || `${gallery.customerName}'s ${gallery.eventType}`,
      description: `View ${gallery.customerName}'s ${gallery.eventType} gallery by The Wild. Professional photography and videography services.`,
      url: galleryUrl,
      siteName: 'The Wild Studio',
      images: [
        {
          url: gallery.coverPhotoUrl,
          width: 1200,
          height: 630,
          alt: `${gallery.customerName}'s ${gallery.eventType} - ${gallery.title || 'Gallery'}`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: gallery.title || `${gallery.customerName}'s ${gallery.eventType}`,
      description: `View ${gallery.customerName}'s ${gallery.eventType} gallery by The Wild.`,
      images: [gallery.coverPhotoUrl],
    },
    alternates: {
      canonical: galleryUrl,
    },
    metadataBase: new URL(siteUrl),
  };
}
