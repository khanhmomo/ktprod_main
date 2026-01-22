import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Crew } from '@/models/Crew';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting super admin setup...');
    await dbConnect();
    console.log('Database connected');

    // Check if super admin already exists
    const existingSuperAdmin = await Crew.findOne({ email: 'admin@company.com' });
    console.log('Existing super admin check:', existingSuperAdmin);
    
    if (existingSuperAdmin) {
      // Update to super admin if not already
      if (existingSuperAdmin.role !== 'super_admin') {
        console.log('Updating existing account to super admin...');
        existingSuperAdmin.role = 'super_admin';
        await existingSuperAdmin.save();
        console.log('Account updated to super admin');
        return NextResponse.json({ 
          message: 'Existing account updated to super admin',
          email: 'admin@company.com',
          role: 'super_admin'
        });
      }
      
      console.log('Super admin already exists');
      return NextResponse.json({ 
        message: 'Super admin already exists',
        email: 'admin@company.com',
        role: 'super_admin'
      });
    }

    // Create super admin account
    console.log('Creating new super admin account...');
    const superAdmin = new Crew({
      googleId: null, // Explicitly set to null for manual account
      email: 'admin@company.com',
      name: 'System Administrator',
      role: 'super_admin',
      permissions: ['all'],
      isActive: true,
      phone: '',
      specialties: []
    });

    console.log('Saving super admin to database...');
    await superAdmin.save();
    console.log('Super admin created successfully:', superAdmin);

    // Create some test crew members
    const testCrewMembers = [
      {
        email: 'john@thewildstudio.com',
        name: 'John Photographer',
        role: 'crew',
        permissions: ['photography'],
        phone: '555-0101',
        specialties: ['Weddings', 'Portraits']
      },
      {
        email: 'sarah@thewildstudio.com',
        name: 'Sarah Videographer',
        role: 'crew',
        permissions: ['videography'],
        phone: '555-0102',
        specialties: ['Events', 'Commercial']
      },
      {
        email: 'mike@thewildstudio.com',
        name: 'Mike Assistant',
        role: 'crew',
        permissions: ['assistant'],
        phone: '555-0103',
        specialties: ['Lighting', 'Equipment']
      }
    ];

    for (const crewData of testCrewMembers) {
      const existingCrew = await Crew.findOne({ email: crewData.email });
      if (!existingCrew) {
        const crewMember = new Crew({
          googleId: null,
          ...crewData,
          isActive: true
        });
        await crewMember.save();
        console.log(`Created test crew member: ${crewData.name}`);
      }
    }

    return NextResponse.json({ 
      message: 'Super admin account and test crew members created successfully',
      email: 'admin@company.com',
      role: 'super_admin'
    });

  } catch (error) {
    console.error('Error creating super admin:', error);
    return NextResponse.json(
      { error: 'Failed to create super admin', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET to check if super admin exists
export async function GET() {
  try {
    await dbConnect();
    
    const superAdmin = await Crew.findOne({ email: 'admin@company.com' });
    
    if (superAdmin) {
      return NextResponse.json({ 
        exists: true,
        email: superAdmin.email,
        role: superAdmin.role,
        name: superAdmin.name
      });
    }
    
    return NextResponse.json({ 
      exists: false,
      message: 'Super admin account not found'
    });

  } catch (error) {
    console.error('Error checking super admin:', error);
    return NextResponse.json(
      { error: 'Failed to check super admin' },
      { status: 500 }
    );
  }
}
