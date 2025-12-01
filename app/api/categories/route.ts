import { NextRequest, NextResponse } from 'next/server';
import { Category } from '@/models/Category';
import dbConnect from '@/lib/db';

// GET all categories (for public gallery)
export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    const query = includeInactive ? {} : { isActive: true };
    
    const categories = await Category.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    // Get album count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const { default: Album } = await import('@/models/Album');
        const albumCount = await Album.countDocuments({ 
          $or: [
            { category: category.slug },
            { category: category.name }
          ],
          isPublished: true 
        });
        
        return {
          ...category,
          id: category._id ? (category._id as any).toString() : category.id,
          count: albumCount
        };
      })
    );
    
    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST new category (admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, slug, coverImage, description } = body;
    
    // Validate required fields
    if (!name || !slug || !coverImage) {
      return NextResponse.json(
        { error: 'Name, slug, and cover image are required' },
        { status: 400 }
      );
    }
    
    // Check if category with same name or slug already exists
    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }]
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name or slug already exists' },
        { status: 409 }
      );
    }
    
    // Get the highest order value to place new category at the end
    const lastCategory = await Category.findOne().sort({ order: -1 });
    const order = lastCategory ? lastCategory.order + 1 : 0;
    
    const category = new Category({
      name,
      slug,
      coverImage,
      description,
      order
    });
    
    await category.save();
    
    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        coverImage: category.coverImage,
        description: category.description,
        order: category.order,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
