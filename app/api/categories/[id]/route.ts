import { NextRequest, NextResponse } from 'next/server';
import { Category } from '@/models/Category';
import dbConnect from '@/lib/db';

// PUT update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await request.json();
    
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Check if new name or slug conflicts with existing categories
    if (body.name || body.slug) {
      const existingCategory = await Category.findOne({
        _id: { $ne: id },
        $or: [
          ...(body.name ? [{ name: body.name }] : []),
          ...(body.slug ? [{ slug: body.slug }] : [])
        ]
      });
      
      if (existingCategory) {
        return NextResponse.json(
          { error: 'Category with this name or slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category: {
        id: updatedCategory._id.toString(),
        name: updatedCategory.name,
        slug: updatedCategory.slug,
        coverImage: updatedCategory.coverImage,
        description: updatedCategory.description,
        order: updatedCategory.order,
        isActive: updatedCategory.isActive,
        createdAt: updatedCategory.createdAt,
        updatedAt: updatedCategory.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Check if there are albums in this category
    const { default: Album } = await import('@/models/Album');
    const albumCount = await Album.countDocuments({ category: category.slug });
    
    if (albumCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing albums. Please move or delete albums first.' },
        { status: 400 }
      );
    }
    
    await Category.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
