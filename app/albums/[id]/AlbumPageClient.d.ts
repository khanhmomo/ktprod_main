import React from 'react';

interface AlbumImage {
  url: string;
  alt?: string;
}

interface Album {
  _id: string;
  title: string;
  images: AlbumImage[];
  date: string;
  location: string;
  description?: string;
  isPublished: boolean;
}

declare const AlbumPageClient: React.FC<{
  initialAlbum: Album | null;
  id: string;
  initialError?: string | null;
}>;

export default AlbumPageClient;
