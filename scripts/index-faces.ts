import { FaceCollectionService } from '../lib/face-collection.js';
import CustomerGallery from '../models/CustomerGallery.js';
import dbConnect from '../lib/db.js';

async function indexFaces() {
  await dbConnect();
  const galleries = await CustomerGallery.find({ status: 'published' });
  
  for (const gallery of galleries) {
    const collectionId = `gallery-${gallery.albumCode}`;
    await FaceCollectionService.createCollection(collectionId);
    
    for (let i = 0; i < gallery.photos.length; i++) {
      const response = await fetch(gallery.photos[i].url);
      const imageBytes = Buffer.from(await response.arrayBuffer());
      await FaceCollectionService.indexFaces(collectionId, imageBytes, `photo-${i}`);
      console.log(`Indexed photo ${i + 1}`);
    }
  }
}

indexFaces();