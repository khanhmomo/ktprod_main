// Check isActive status of galleries
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkActiveStatus() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🔍 Checking isActive status...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('customergalleries');
    
    // Get all galleries with isActive status
    const galleries = await collection.find({}).project({
      albumCode: 1,
      customerName: 1,
      isActive: 1,
      createdAt: 1
    }).toArray();
    
    console.log(`\n📊 Total galleries in database: ${galleries.length}`);
    console.log('=====================================');
    
    const active = [];
    const inactive = [];
    
    galleries.forEach((gallery) => {
      const info = `${gallery.albumCode} - ${gallery.customerName} (${gallery.isActive ? 'ACTIVE' : 'INACTIVE'})`;
      
      if (gallery.isActive) {
        active.push(info);
      } else {
        inactive.push(info);
      }
    });
    
    console.log(`\n✅ Active galleries (${active.length}):`);
    active.forEach(gallery => console.log(`   ${gallery}`));
    
    if (inactive.length > 0) {
      console.log(`\n❌ Inactive galleries (${inactive.length}):`);
      inactive.forEach(gallery => console.log(`   ${gallery}`));
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

checkActiveStatus();
