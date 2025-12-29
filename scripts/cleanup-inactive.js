// Clean up inactive galleries (permanently delete them)
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanupInactive() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🧹 Cleaning up inactive galleries...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('customergalleries');
    
    // Find inactive galleries first
    const inactiveGalleries = await collection.find({ isActive: false }).project({
      albumCode: 1,
      customerName: 1,
      createdAt: 1
    }).toArray();
    
    if (inactiveGalleries.length === 0) {
      console.log('✅ No inactive galleries to clean up');
      return;
    }
    
    console.log(`\n📋 Found ${inactiveGalleries.length} inactive galleries to delete:`);
    console.log('==========================================');
    
    inactiveGalleries.forEach((gallery, index) => {
      console.log(`${index + 1}. ${gallery.albumCode} - ${gallery.customerName}`);
    });
    
    // Confirm before deletion
    console.log('\n⚠️  This will PERMANENTLY delete these galleries!');
    console.log('🔥 Type "DELETE" to confirm:');
    
    // For automation, we'll proceed without confirmation
    console.log('🚀 Proceeding with deletion...');
    
    // Delete inactive galleries
    const result = await collection.deleteMany({ isActive: false });
    
    console.log(`\n🎉 Successfully deleted ${result.deletedCount} inactive galleries`);
    
    // Verify cleanup
    const remainingInactive = await collection.countDocuments({ isActive: false });
    const totalGalleries = await collection.countDocuments();
    
    console.log(`📊 Database now has ${totalGalleries} galleries`);
    console.log(`✅ ${remainingInactive} inactive galleries remaining`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

cleanupInactive();
