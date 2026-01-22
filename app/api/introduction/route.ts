import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import IntroductionContent from '@/models/IntroductionContent';

// GET introduction content
export async function GET() {
  try {
    await dbConnect();
    
    let introductionContent = await IntroductionContent.findOne();
    
    // If no content exists, create default content
    if (!introductionContent) {
      introductionContent = new IntroductionContent({
        mainDescription: 'Founded with a passion for storytelling through imagery, we\'ve been capturing life\'s most precious moments for over a decade. Our journey began with a simple camera and a dream to create timeless memories for our clients.',
        philosophy: {
          text: 'We believe that every photograph should tell a story. Our approach combines technical expertise with an artistic eye to capture the essence of each moment. We focus on creating authentic, emotional images that you\'ll treasure for generations.\n\nOur team of talented photographers and videographers are dedicated to providing a personalized experience, ensuring that your unique vision comes to life in every frame.',
          image: {
            url: 'https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/544673315_1227873979143579_9123989934276526782_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=127cfc&_nc_ohc=WgjRuPpeiPIQ7kNvwFKwypp&_nc_oc=AdkNRKRlzDzNi9VaTO3VMy9DcBjOLkUx4R5t8NVeJ4tv3NZXE2C6CCLdzH5Sd-LN5M0&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=__Mv_BqpXTBp1JbXC9xH7g&oh=00_AfbCGGHcJzReXAxPTAPPFtZ7f6ZKxGuA6p7aaxMRP8u39A&oe=68D12FF8',
            alt: 'Our Team'
          }
        },
        approach: {
          text: 'No two weddings are ever the same - and that\'s exactly why we take time to understand the unique style and personality of each couple, from their wedding concept to the color tones of their special day.\n\nTo us, capturing authentic moments is the heart of everything. We study the wedding schedule closely ahead of time, approaching each event with an open mind while avoiding preconceived ideas. This allows us to naturally tell a true and vivid love story, not one that feels staged or forced.\n\nRather than focusing only on the couple, we seek out the emotions of everyone present - family, friends, guests - weaving them into one heartfelt narrative. A single hug, a smile, a tear, a glance - each small moment is captured with honesty, and later, they come together like pieces of a timeless memory.\n\nWe do not direct or interfere with natural moments during your wedding day. Instead, we observe gently, creating space for genuine emotions to unfold naturally, capturing the true spirit of your love story.\n\nWe also avoid spending too much time on posing or arranging scenes artificially. Instead, we embrace natural light candid beauty, and relaxed moments that make every couple feel truly at ease and themselves.',
          image: {
            url: 'https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/484656906_1096662685598043_1015053343159873440_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_ohc=RvU3IEhT4O0Q7kNvwES0Us0&_nc_oc=AdnK6_SDxwpjDGbWatznyvqAAZnthw6CHnhM6q1bCDhmyPIqkcNC7AR3ge7E81BmH9M&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=Eqm97qLnIFDG-4fogYRMWw&oh=00_AfYSPUEZAWelCLGnzYql_zRmli_h3gLPEmYSQoq3CT4eng&oe=68D117D4',
            alt: 'Our Approach'
          }
        },
        cta: {
          headline: 'Ready to Create Something Amazing?',
          description: 'Let\'s work together to capture your special moments and create memories that will last a lifetime.',
          buttonText: 'Get in Touch',
          buttonLink: '/contact'
        }
      });
      
      await introductionContent.save();
    }
    
    return NextResponse.json(introductionContent);
  } catch (error) {
    console.error('Error fetching introduction content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch introduction content' },
      { status: 500 }
    );
  }
}

// PUT/PATCH to update introduction content
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { section, data, updatedBy = 'admin' } = body;
    
    if (!section || !data) {
      return NextResponse.json(
        { error: 'Section and data are required' },
        { status: 400 }
      );
    }
    
    // Find existing content or create new
    let introductionContent = await IntroductionContent.findOne();
    
    if (!introductionContent) {
      introductionContent = new IntroductionContent({});
    }
    
    // Update the specified section
    introductionContent[section] = { ...introductionContent[section], ...data };
    introductionContent.lastUpdated = new Date();
    introductionContent.updatedBy = updatedBy;
    
    await introductionContent.save();
    
    return NextResponse.json(introductionContent);
  } catch (error) {
    console.error('Error updating introduction content:', error);
    return NextResponse.json(
      { error: 'Failed to update introduction content' },
      { status: 500 }
    );
  }
}
