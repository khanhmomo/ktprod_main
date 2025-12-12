import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Services from '@/models/Services';

export async function GET() {
  try {
    await connectDB();
    
    // Try to find existing services data
    let servicesData = await Services.findOne();
    
    // If no data exists, create default data
    if (!servicesData) {
      const defaultServicesData = {
        heroTitle: 'Our Services',
        heroDescription: 'Discover our comprehensive photography and videography packages for your special day.',
        heroImageUrl: 'https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/494737167_1135629205034724_2926229135502320159_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=127cfc&_nc_ohc=xwzJ14FSvgcQ7kNvwEVZ_5D&_nc_oc=AdlKZx7BJDGTprTKOTnzqgyPOZkstrZCntBz81a59wFqom9mU6uERFNWZPxKmpG3258&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=WjsNLW6uui5Bl07TLiW5pA&oh=00_Afbg4ZM_OBUpWB-F_3iRorQnXXB5hj1z3-blyIvOGgx00Q&oe=68D12EA6',
        heroImageAlt: 'Wedding photography',
        photographyPackages: [
          {
            name: 'Gold Package',
            features: [
              '1 photographer',
              'Wedding day coverage (full day)',
              'Planning with other suppliers',
              '30 sneak peek photos after 1 week',
              'All images edited (800 - 1000 files)',
              'Online download and sharing library',
              'Full quality, no logo'
            ]
          },
          {
            name: 'Diamond Package',
            features: [
              '2 photographers',
              'Wedding day coverage (full day)',
              'Planning with other suppliers',
              '50 sneak peek photos after 1 week',
              'All images edited (1200 - 1500 files)',
              'Private online gallery for view, share & download',
              'Full quality, no logo'
            ]
          },
          {
            name: 'Special Package',
            features: [
              '3 photographers',
              'Wedding day coverage (full day)',
              'Planning with other suppliers',
              '80 sneak peek photos after 1 week',
              'All images edited (1500 - 2000 files)',
              'Private online gallery for view, share & download',
              'Full quality, no logo'
            ]
          }
        ],
        videographyPackages: [
          {
            name: 'Gold Package',
            features: [
              '1 Videographer',
              'Wedding Day coverage',
              'Planning with other suppliers',
              'Video Highlight 4-6 mins full HD',
              'Music license, full quality, no logo',
              'Private online gallery for view, share and download'
            ]
          },
          {
            name: 'Diamond Package',
            features: [
              '2 Videographers',
              'Drone footage',
              'Wedding Day coverage',
              'Planning with other suppliers',
              'Video Highlight 4-6 mins full HD',
              'Video full document 45 - 60 mins full HD',
              'Music license, full quality, no logo',
              'Private online gallery for view, share and download'
            ]
          }
        ],
        addOns: [
          'Instant photos',
          '24x36 canvas',
          'Fine Art photo book 11x14 30 pages',
          'Fine Art photo book 11x14 50 pages'
        ],
        bookingProcess: [
          'Initial contact',
          'Consultation',
          'Electronic Contract (e-Contract)',
          'Contract Adjustments',
          'Deposit to secure your date',
          'Information Exchange',
          'Wedding/Event Day Coverage',
          'Final Payment',
          'Sneak Peek Delivery',
          'Final Product Delivery'
        ],
        faqs: [
          {
            question: "How far in advance should I book?",
            answer: "We recommend booking as soon as you have your wedding date and venue secured. Popular dates book up quickly, especially during peak wedding season (May-October)."
          },
          {
            question: "Do you travel for weddings?",
            answer: "Yes! We love traveling for weddings. Travel fees may apply for locations outside our standard service area, which we can discuss during your consultation."
          },
          {
            question: "How long until we receive our photos?",
            answer: "You'll receive a sneak peek within 1-2 weeks after your wedding. The full gallery will be delivered within 6-8 weeks, depending on the season."
          },
          {
            question: "Can we request specific shots or a shot list?",
            answer: "Absolutely! We'll work with you to create a photography plan that includes all your must-have shots while still capturing the natural flow of your day."
          },
          {
            question: "What's your cancellation policy?",
            answer: "We require a non-refundable retainer to secure your date. In case of cancellation, the retainer is non-refundable but can be applied to a future session within one year."
          }
        ]
      };
      
      servicesData = await Services.create(defaultServicesData);
    }
    
    return NextResponse.json(servicesData);
  } catch (error) {
    console.error('Error fetching services data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('Updating services data:', body);
    
    // Find existing services data or create new one
    let servicesData = await Services.findOne();
    
    if (servicesData) {
      // Update existing data
      servicesData = await Services.findOneAndUpdate(
        {},
        body,
        { new: true, upsert: true }
      );
    } else {
      // Create new data
      servicesData = await Services.create(body);
    }
    
    return NextResponse.json(servicesData);
  } catch (error) {
    console.error('Error updating services data:', error);
    return NextResponse.json(
      { error: 'Failed to update services data' },
      { status: 500 }
    );
  }
}
