// Check what was updated during migration
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkMigration() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🔍 Checking migration results...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('customergalleries');
    
    // Get all galleries with their basic info
    const galleries = await collection.find({}).project({
      albumCode: 1,
      customerName: 1,
      title: 1,
      faceRecognitionEnabled: 1,
      createdAt: 1
    }).toArray();
    
    console.log(`\n📊 Total galleries in database: ${galleries.length}`);
    console.log('=====================================');
    
    galleries.forEach((gallery, index) => {
      console.log(`${index + 1}. ${gallery.albumCode}`);
      console.log(`   Customer: ${gallery.customerName}`);
      console.log(`   Title: ${gallery.title || 'No title'}`);
      console.log(`   Face Recognition: ${gallery.faceRecognitionEnabled}`);
      console.log(`   Created: ${gallery.createdAt ? new Date(gallery.createdAt).toLocaleDateString() : 'Unknown'}`);
      console.log('');
    });
    
    // Count by face recognition status
    const enabled = await collection.countDocuments({ faceRecognitionEnabled: true });
    const disabled = await collection.countDocuments({ faceRecognitionEnabled: false });
    const missing = await collection.countDocuments({ faceRecognitionEnabled: { $exists: false } });
    
    console.log('📈 Summary:');
    console.log(`   Enabled: ${enabled}`);
    console.log(`   Disabled: ${disabled}`);
    console.log(`   Missing field: ${missing}`);
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

checkMigration();
