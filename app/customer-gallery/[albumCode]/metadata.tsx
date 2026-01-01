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
  
  // Extract drive file ID from cover photo URL to use our proxy
  let proxyImageUrl = '';
  if (gallery.coverPhotoUrl) {
    // Handle different Google Drive URL formats
    let driveFileId = '';
    
    if (gallery.coverPhotoUrl.includes('/file/d/')) {
      // Format: https://drive.google.com/file/d/FILE_ID/view
      const match = gallery.coverPhotoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      driveFileId = match ? match[1] : '';
    } else if (gallery.coverPhotoUrl.includes('id=')) {
      // Format: https://drive.google.com/uc?export=view&id=FILE_ID
      const match = gallery.coverPhotoUrl.match(/id=([a-zA-Z0-9_-]+)/);
      driveFileId = match ? match[1] : '';
    }
    
    if (driveFileId) {
      // Use our proxy API for social media crawlers
      proxyImageUrl = `${siteUrl}/api/drive/image?id=${driveFileId}`;
    }
  }
  
  // Fallback to a default image if no cover photo or can't extract ID
  const imageUrl = proxyImageUrl || `${siteUrl}/images/studio-cover.jpg`;
  
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
          url: imageUrl,
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
      images: [imageUrl],
    },
    alternates: {
      canonical: galleryUrl,
    },
    metadataBase: new URL(siteUrl),
  };
}
