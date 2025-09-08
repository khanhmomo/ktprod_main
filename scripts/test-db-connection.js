import dbConnect from '../lib/db/connect';
import Album from '../models/Album';

async function testConnection() {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('✅ Successfully connected to MongoDB');
    
    // Test query to list all albums
    const albums = await Album.find({}).limit(5).lean();
    console.log('\n📋 Found albums:', albums.length);
    albums.forEach((album, index) => {
      console.log(`\nAlbum ${index + 1}:`);
      console.log(`ID: ${album._id}`);
      console.log(`Title: ${album.title}`);
      console.log(`Images: ${album.images?.length || 0}`);
    });
    
    // Test specific album ID
    if (process.argv[2]) {
      const albumId = process.argv[2];
      console.log(`\n🔍 Looking for album with ID: ${albumId}`);
      const album = await Album.findById(albumId).lean();
      if (album) {
        console.log('✅ Found album:', album.title);
      } else {
        console.log('❌ Album not found');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testConnection();
