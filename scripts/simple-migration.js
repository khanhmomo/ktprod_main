// Simple migration script using the app's database connection
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function migrateFaceRecognition() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('customergalleries');
    
    // Count galleries without faceRecognitionEnabled
    const count = await collection.countDocuments({
      faceRecognitionEnabled: { $exists: false }
    });
    
    console.log(`📊 Found ${count} galleries to update`);
    
    if (count === 0) {
      console.log('✅ All galleries already have faceRecognitionEnabled field');
      return;
    }
    
    // Update all galleries to have faceRecognitionEnabled: true
    const result = await collection.updateMany(
      { faceRecognitionEnabled: { $exists: false } },
      { $set: { faceRecognitionEnabled: true } }
    );
    
    console.log(`🎉 Successfully updated ${result.modifiedCount} galleries`);
    
    // Verify update
    const remaining = await collection.countDocuments({
      faceRecognitionEnabled: { $exists: false }
    });
    
    if (remaining === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log(`⚠️ ${remaining} galleries still need updates`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

migrateFaceRecognition();
