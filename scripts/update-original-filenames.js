const { MongoClient } = require('mongodb');
const { google } = require('googleapis');

// Connect to your MongoDB
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb+srv://ktprod:ktprod@cluster0.luj7tfc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_PRIVATE_KEY_PATH || './service-account.json',
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  projectId: process.env.GOOGLE_PROJECT_ID,
});

const drive = google.drive({ version: 'v3', auth });

async function getOriginalFilename(driveFileId) {
  try {
    const response = await drive.files.get({
      fileId: driveFileId,
      fields: 'name',
    });
    return response.data.name;
  } catch (error) {
    console.log(`  ❌ Error fetching filename for ${driveFileId}: ${error.message}`);
    return null;
  }
}

async function updateOriginalFilenames() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Finding galleries with photos missing originalFilename...');
    
    // Find all galleries that have photos but missing originalFilename
    const galleries = await db.collection('customergalleries').find({
      'photos.0': { $exists: true },
      'photos.originalFilename': { $exists: false }
    }).toArray();
    
    console.log(`📊 Found ${galleries.length} galleries to update`);
    
    let totalUpdated = 0;
    
    for (const gallery of galleries) {
      console.log(`\n🔄 Processing gallery: ${gallery.albumCode}`);
      
      const updatedPhotos = [];
      
      // Process photos in batches to avoid API rate limits
      for (let i = 0; i < gallery.photos.length; i++) {
        const photo = gallery.photos[i];
        
        if (photo.driveFileId) {
          console.log(`  📸 Processing photo ${i + 1}/${gallery.photos.length}: ${photo.driveFileId}`);
          
          // Get original filename from Google Drive API
          const originalFilename = await getOriginalFilename(photo.driveFileId);
          
          if (originalFilename) {
            console.log(`  ✅ Found filename: ${originalFilename}`);
            updatedPhotos.push({
              ...photo,
              originalFilename: originalFilename
            });
            totalUpdated++;
          } else {
            console.log(`  ⚠️  No filename found, keeping original`);
            updatedPhotos.push(photo);
          }
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          console.log(`  ⚠️  No driveFileId for photo ${i + 1}`);
          updatedPhotos.push(photo);
        }
      }
      
      // Update the gallery with the new photos array
      const result = await db.collection('customergalleries').updateOne(
        { _id: gallery._id },
        { $set: { photos: updatedPhotos } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`  ✅ Updated gallery ${gallery.albumCode}`);
      }
    }
    
    console.log(`\n🎉 SUCCESS! Updated ${totalUpdated} photos with original filenames`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

updateOriginalFilenames();
