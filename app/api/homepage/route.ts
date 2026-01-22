import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HomepageContent from '@/models/HomepageContent';

// GET homepage content
export async function GET() {
  try {
    await dbConnect();
    
    let homepageContent = await HomepageContent.findOne();
    
    // If no content exists, create default content
    if (!homepageContent) {
      homepageContent = new HomepageContent({
        hero: {
          headline: 'Let us tell your story in a different way',
          primaryButton: {
            text: 'Book now',
            href: '#contact',
            style: 'primary'
          },
          secondaryButton: {
            text: 'View Our Work',
            href: '/gallery',
            style: 'secondary'
          },
          slideshowInterval: 2000,
          showNavigation: true,
          showIndicators: true
        },
        about: {
          title: 'Our Story',
          paragraphs: [
            {
              text: 'We believe that photography and videography are the most beautiful ways to preserve life\'s most meaningful moments, especially during the most important milestones. That\'s why we strive to capture each couple\'s unique emotions and genuine connection with every click of the shutter.',
              isItalic: false,
              isBold: false
            },
            {
              text: 'To us, every love story has a distinct color. The memories and feelings behind them create this uniqueness, and your wedding photos and films will be the keepsake that holds all those sweet elevated moments of love.',
              isItalic: false,
              isBold: false
            },
            {
              text: 'Let us tell your story differently way',
              isItalic: true,
              isBold: true
            }
          ],
          imageUrl: 'https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/547372679_1235470425050601_4278193282923074331_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=127cfc&_nc_ohc=UV15EZcV1EcQ7kNvwFRuzhx&_nc_oc=AdnnxASGoT_ztI8U4tJTb7LsPCz7UaCmnCfjoQUJL9kjAv4Q_UQirn92UwIXSrGlGnE&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=MEbMqNNc8HfLitcYBYqhwg&oh=00_Afa2erBphQve0m4OZkPnIzYjYpguTxyY4sCBdzUnLXd11w&oe=68D11A55',
          imageAlt: 'Our Story',
          stats: [
            { value: '8+', label: 'Years Experience' },
            { value: '500+', label: 'Happy Clients' },
            { value: '10K+', label: 'Photos Captured' }
          ],
          ctaButton: {
            text: 'Learn More About Us',
            href: '/introduction'
          }
        },
        services: {
          title: 'Our Services',
          description: 'We offer a wide range of professional photography services to meet all your needs. Each session is tailored to capture your unique story.',
          services: [
            {
              icon: 'FaCamera',
              title: 'Portrait Photography',
              description: 'Professional portrait sessions that capture your personality and style in stunning detail.',
              order: 0
            },
            {
              icon: 'FaUsers',
              title: 'Event Coverage',
              description: 'Comprehensive photography services for weddings, parties, and corporate events.',
              order: 1
            },
            {
              icon: 'FaVideo',
              title: 'Videography',
              description: 'Cinematic video production to bring your special moments to life.',
              order: 2
            },
            {
              icon: 'FaMagic',
              title: 'Photo Editing',
              description: 'Professional retouching and editing services to make your photos look their absolute best.',
              order: 3
            }
          ]
        },
        contactForm: {
          title: 'Get In Touch',
          description: 'Have a project in mind? Let\'s talk about how we can help you capture your vision.',
          fields: [
            {
              name: 'name',
              label: 'Your Name',
              type: 'text',
              required: true,
              placeholder: 'John Doe',
              order: 0
            },
            {
              name: 'email',
              label: 'Email Address',
              type: 'email',
              required: true,
              placeholder: 'your@email.com',
              order: 1
            },
            {
              name: 'subject',
              label: 'Subject',
              type: 'text',
              required: false,
              placeholder: 'How can we help?',
              order: 2
            },
            {
              name: 'message',
              label: 'Your Message',
              type: 'textarea',
              required: true,
              placeholder: 'Tell us about your project...',
              order: 3
            }
          ],
          submitButtonText: 'Send Message'
        },
        contactInfo: {
          location: {
            line1: '9710 South Kirkwood, Suite 500',
            line2: 'Houston, Texas 77099'
          },
          phone: '(832) 992-7879',
          email: 'thewildstudio.nt@gmail.com',
          hours: [
            { day: 'Monday - Friday', time: '9:00 AM - 6:00 PM' },
            { day: 'Saturday', time: '10:00 AM - 4:00 PM' },
            { day: 'Sunday', time: 'Closed' }
          ],
          socialLinks: [
            {
              platform: 'facebook',
              url: 'https://www.facebook.com/thewildpresents',
              icon: 'facebook'
            },
            {
              platform: 'instagram',
              url: 'https://www.instagram.com/thewildstudio',
              icon: 'instagram'
            }
          ]
        }
      });
      
      await homepageContent.save();
    }
    
    return NextResponse.json(homepageContent);
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage content' },
      { status: 500 }
    );
  }
}

// PUT/PATCH to update homepage content
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
    let homepageContent = await HomepageContent.findOne();
    
    if (!homepageContent) {
      homepageContent = new HomepageContent({});
    }
    
    // Update the specified section
    homepageContent[section] = { ...homepageContent[section], ...data };
    homepageContent.lastUpdated = new Date();
    homepageContent.updatedBy = updatedBy;
    
    await homepageContent.save();
    
    return NextResponse.json(homepageContent);
  } catch (error) {
    console.error('Error updating homepage content:', error);
    return NextResponse.json(
      { error: 'Failed to update homepage content' },
      { status: 500 }
    );
  }
}
