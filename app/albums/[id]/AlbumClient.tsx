'use client';

import dynamic from 'next/dynamic';
import { AlbumPageClientProps } from './NewAlbumClient';

interface AlbumClientProps extends AlbumPageClientProps {}

const AlbumViewer = dynamic(() => import('./AlbumViewer'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function AlbumClient({ album, id }: AlbumClientProps) {
  return <AlbumViewer album={album} id={id} category={album?.category} />;
}
