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
    
    // Directly query the collection
    const albums = await mongoose.connection.db.collection('albums').find({}).limit(5).toArray();
    console.log(`\n📊 Found ${albums.length} albums:`);
    
    albums.forEach((album, i) => {
      console.log(`\nAlbum ${i + 1}:`);
      console.log(`ID: ${album._id}`);
      console.log(`Title: ${album.title || 'No title'}`);
      console.log(`Published: ${album.isPublished || false}`);
      console.log(`Images: ${album.images?.length || 0}`);
    });
    
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
