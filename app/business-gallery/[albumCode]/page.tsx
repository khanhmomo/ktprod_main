import { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import BusinessGallery from '@/models/BusinessGallery';
import { notFound } from 'next/navigation';
import BusinessGalleryClient from './BusinessGalleryClient';

interface PageProps {
  params: {
    albumCode: string;
  };
}

async function getBusinessGallery(albumCode: string) {
  try {
    await connectDB();
    
    const gallery = await BusinessGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] },
      isActive: true 
    }).select('-faceIndexing');
    
    if (!gallery) {
      return null;
    }
    
    return JSON.parse(JSON.stringify(gallery));
  } catch (error) {
    console.error('Error fetching business gallery:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { albumCode } = await params;
  const gallery = await getBusinessGallery(albumCode);
  
  if (!gallery) {
    return {
      title: 'Gallery Not Found',
      description: 'The requested gallery could not be found.',
    };
  }

  // Extract drive file ID from cover photo URL to use our proxy
  let proxyImageUrl = '';
  if (gallery.coverPhotoUrl) {
    // Handle different Google Drive URL formats
    let driveFileId = '';
    
    if (gallery.coverPhotoUrl.includes('/file/d/')) {
      // Format: https://drive.google.com/file/d/FILE_ID/view
      const match = gallery.coverPhotoUrl.match(/\/(file\/d\/([a-zA-Z0-9_-]+))|\/(open\?id=([a-zA-Z0-9_-]+))/);
      driveFileId = match ? (match[2] || match[4]) : '';
    } else if (gallery.coverPhotoUrl.includes('id=')) {
      // Format: https://drive.google.com/uc?export=view&id=FILE_ID
      const match = gallery.coverPhotoUrl.match(/id=([a-zA-Z0-9_-]+)/);
      driveFileId = match ? match[1] : '';
    }
    
    if (driveFileId) {
      // Use our proxy API for social media crawlers
      proxyImageUrl = `https://thewildstudio.org/api/drive/image?id=${driveFileId}`;
    }
  }
  
  // Fallback to a default image if no cover photo or can't extract ID
  const imageUrl = proxyImageUrl || `https://thewildstudio.org/images/studio-cover.jpg`;

  return {
    title: `${gallery.title || `${gallery.businessName}'s ${gallery.eventType}`}`,
    description: `View ${gallery.businessName}'s ${gallery.eventType} gallery by The Wild. Professional photography and videography services.`,
    openGraph: {
      title: gallery.title || `${gallery.businessName}'s ${gallery.eventType}`,
      description: `View ${gallery.businessName}'s ${gallery.eventType} gallery by The Wild. Professional photography and videography services.`,
      url: `https://thewildstudio.org/business-gallery/${gallery.albumCode}`,
      siteName: 'The Wild Studio',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${gallery.businessName}'s ${gallery.eventType} - ${gallery.title || 'Gallery'}`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: gallery.title || `${gallery.businessName}'s ${gallery.eventType}`,
      description: `View ${gallery.businessName}'s ${gallery.eventType} gallery by The Wild.`,
      images: [imageUrl],
    },
    alternates: {
      canonical: `https://thewildstudio.org/business-gallery/${gallery.albumCode}`,
    },
    metadataBase: new URL('https://thewildstudio.org'),
  };
}

export default async function BusinessGalleryPage({ params }: PageProps) {
  const { albumCode } = await params;
  const gallery = await getBusinessGallery(albumCode);
  
  if (!gallery) {
    notFound();
  }
  
  return <BusinessGalleryClient gallery={gallery} />;
}
