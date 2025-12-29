const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// MongoDB connection - same as the app uses
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/photography-studio';

if (!MONGODB_URI) {
  console.error('❌ Please define the MONGODB_URI environment variable');
  process.exit(1);
}

async function migrateFaceRecognition() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('📍 URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('✅ Connected to MongoDB');

    // Get the CustomerGallery model
    const CustomerGallery = mongoose.connection.db.collection('customergalleries');

    // Find all galleries that don't have faceRecognitionEnabled field
    const galleriesToUpdate = await CustomerGallery.find({
      faceRecognitionEnabled: { $exists: false }
    });

    console.log(`📊 Found ${galleriesToUpdate.length} galleries to update`);

    if (galleriesToUpdate.length === 0) {
      console.log('✅ All galleries already have faceRecognitionEnabled field');
      await mongoose.connection.close();
      return;
    }

    // Update all galleries to have faceRecognitionEnabled: true by default
    const result = await CustomerGallery.updateMany(
      { faceRecognitionEnabled: { $exists: false } },
      { $set: { faceRecognitionEnabled: true } }
    );

    console.log(`🎉 Successfully updated ${result.modifiedCount} galleries`);
    console.log('✅ All existing galleries now have face recognition enabled by default');

    // Verify the update
    const remainingGalleries = await CustomerGallery.find({
      faceRecognitionEnabled: { $exists: false }
    });

    if (remainingGalleries.length === 0) {
      console.log('✅ Verification passed - all galleries now have the field');
    } else {
      console.log(`⚠️  Warning: ${remainingGalleries.length} galleries still missing the field`);
    }

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting face recognition migration...');
migrateFaceRecognition();
