import { Album } from './page';

declare const AlbumPageClient: React.FC<{
  initialAlbum: Album | null;
  id: string;
}>;

export default AlbumPageClient;
