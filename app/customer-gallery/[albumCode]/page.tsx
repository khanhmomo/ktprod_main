import { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';
import { notFound } from 'next/navigation';
import GalleryClient from './GalleryClient';
import { generateGalleryMetadata } from './metadata';

interface PageProps {
  params: {
    albumCode: string;
  };
}

async function getGallery(albumCode: string) {
  try {
    await connectDB();
    
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] },
      isActive: true 
    }).select('-customerFavorites');
    
    if (!gallery) {
      return null;
    }
    
    return JSON.parse(JSON.stringify(gallery));
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const gallery = await getGallery(params.albumCode);
  
  if (!gallery) {
    return {
      title: 'Gallery Not Found | KhanhTran Production',
      description: 'The requested gallery could not be found.',
    };
  }

  return generateGalleryMetadata({
    title: gallery.title,
    customerName: gallery.customerName,
    eventType: gallery.eventType,
    coverPhotoUrl: gallery.coverPhotoUrl,
    albumCode: gallery.albumCode,
  });
}

export default async function GalleryPage({ params }: PageProps) {
  const gallery = await getGallery(params.albumCode);
  
  if (!gallery) {
    notFound();
  }
  
  return <GalleryClient gallery={gallery} />;
}
