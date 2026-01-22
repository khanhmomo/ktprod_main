import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerGallery from '@/models/CustomerGallery';
import { CustomerFavorite } from '@/models/CustomerGallery';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Starting migration to global favorites...');
    
    // Find all galleries that don't have globalFavorites field
    const galleries = await CustomerGallery.find({ 
      globalFavorites: { $exists: false }
    });
    
    console.log(`Found ${galleries.length} galleries to migrate`);
    
    let migrationCount = 0;
    
    for (const gallery of galleries) {
      try {
        // Get all existing favorites for this gallery from the old CustomerFavorite collection
        const oldFavorites = await CustomerFavorite.find({
          galleryId: gallery._id
        });
        
        // Extract unique photo indices from all users' favorites
        const uniquePhotoIndices = Array.from(new Set(oldFavorites.map(fav => fav.photoIndex)));
        
        // Sort the indices
        uniquePhotoIndices.sort((a, b) => a - b);
        
        // Update the gallery with globalFavorites
        await CustomerGallery.updateOne(
          { _id: gallery._id },
          { 
            $set: { 
              globalFavorites: uniquePhotoIndices 
            }
          }
        );
        
        console.log(`Migrated gallery ${gallery.albumCode}: ${uniquePhotoIndices.length} favorites`);
        migrationCount++;
        
      } catch (error) {
        console.error(`Error migrating gallery ${gallery.albumCode}:`, error);
      }
    }
    
    // Also update galleries that have globalFavorites but it's null/undefined
    const nullGalleries = await CustomerGallery.find({ 
      globalFavorites: null 
    });
    
    for (const gallery of nullGalleries) {
      await CustomerGallery.updateOne(
        { _id: gallery._id },
        { 
          $set: { 
            globalFavorites: [] 
          }
        }
      );
      console.log(`Fixed null globalFavorites for gallery ${gallery.albumCode}`);
      migrationCount++;
    }
    
    console.log(`Migration completed. Updated ${migrationCount} galleries.`);
    
    return NextResponse.json({ 
      success: true,
      message: `Migration completed. Updated ${migrationCount} galleries.`,
      galleriesMigrated: migrationCount
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Check migration status
    const totalGalleries = await CustomerGallery.countDocuments();
    const migratedGalleries = await CustomerGallery.countDocuments({ 
      globalFavorites: { $exists: true, $ne: null }
    });
    const pendingGalleries = await CustomerGallery.countDocuments({ 
      globalFavorites: { $exists: false }
    });
    
    return NextResponse.json({
      totalGalleries,
      migratedGalleries,
      pendingGalleries,
      migrationComplete: pendingGalleries === 0
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}
