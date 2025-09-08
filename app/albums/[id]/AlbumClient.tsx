'use client';

import dynamic from 'next/dynamic';
import { AlbumPageClientProps } from './AlbumPageClient';

interface AlbumClientProps extends Omit<AlbumPageClientProps, 'initialError'> {}

// Client-side only component with dynamic import
const AlbumPageClient = dynamic<AlbumClientProps>(
  () => import('./AlbumPageClient').then(mod => mod.default as React.ComponentType<AlbumClientProps>),
  { 
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
);

export default function AlbumClient({ album, id }: AlbumClientProps) {
  return <AlbumPageClient album={album} id={id} />;
}
