import { NextRequest, NextResponse } from 'next/server';
import { Category } from '@/models/Category';
import dbConnect from '@/lib/db';

// PUT reorder categories
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { categories } = body;
    
    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Categories array is required' },
        { status: 400 }
      );
    }
    
    // Validate that each category has id and order
    for (const category of categories) {
      if (!category.id || typeof category.order !== 'number') {
        return NextResponse.json(
          { error: 'Each category must have id and order' },
          { status: 400 }
        );
      }
    }
    
    // Update all categories with new order
    const updatePromises = categories.map(({ id, order }) =>
      Category.findByIdAndUpdate(id, { order }, { new: true })
    );
    
    const updatedCategories = await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: 'Categories reordered successfully',
      categories: updatedCategories.map(cat => ({
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        order: cat.order
      }))
    });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json(
      { error: 'Failed to reorder categories' },
      { status: 500 }
    );
  }
}
