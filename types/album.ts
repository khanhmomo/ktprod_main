export interface AlbumImage {
  _id: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Album {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  images: AlbumImage[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string;
  eventDate?: string;
  metadata?: {
    location?: string;
    photographer?: string;
    tags?: string[];
  };
}
