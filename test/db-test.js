const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('Connecting to database...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Not configured');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Successfully connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections:');
    collections.forEach(coll => console.log(`- ${coll.name}`));
    
    // Check if albums collection exists
    const albumsExist = collections.some(coll => coll.name === 'albums');
    if (!albumsExist) {
      console.log('\n❌ Albums collection does not exist');
      return;
    }
    
    // Get Album model
    const Album = require('../models/Album').default;
    
    // Count albums
    const count = await Album.countDocuments();
    console.log(`\n📊 Total albums: ${count}`);
    
    // List first 5 albums
    if (count > 0) {
      console.log('\n📝 Sample albums:');
      const albums = await Album.find().limit(5).lean();
      albums.forEach((album, i) => {
        console.log(`\nAlbum ${i + 1}:`);
        console.log(`ID: ${album._id}`);
        console.log(`Title: ${album.title}`);
        console.log(`Published: ${album.isPublished}`);
        console.log(`Images: ${album.images?.length || 0}`);
      });
    }
    
    // Test specific album if ID provided
    if (process.argv[2]) {
      const albumId = process.argv[2];
      console.log(`\n🔍 Looking for album with ID: ${albumId}`);
      try {
        const album = await Album.findById(albumId).lean();
        if (album) {
          console.log('✅ Found album:', album.title);
          console.log('Images:', album.images?.length || 0);
          console.log('Published:', album.isPublished);
        } else {
          console.log('❌ Album not found');
        }
      } catch (err) {
        console.error('❌ Error finding album:', err.message);
      }
    }
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'MongooseServerSelectionError') {
      console.error('Failed to connect to MongoDB. Please check your MONGODB_URI in .env.local');
    }
    process.exit(1);
  }
}

testConnection();
