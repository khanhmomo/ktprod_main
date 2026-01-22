import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';

const samplePosts = [
  {
    title: 'The Art of Capturing Moments',
    slug: 'the-art-of-capturing-moments',
    excerpt: 'Discover the techniques and philosophy behind capturing truly memorable photographs.',
    content: `Photography is more than just clicking a button; it's about capturing moments that tell a story. In this post, we'll explore the art behind creating images that evoke emotion and stand the test of time.
    
    ## Understanding Your Subject
    The first step to great photography is understanding your subject. Whether it's a person, landscape, or object, take the time to observe and connect with what you're photographing.
    
    ## Composition Techniques
    - Rule of Thirds
    - Leading Lines
    - Framing
    - Symmetry and Patterns
    
    ## The Right Light
    Light is the essence of photography. Learn how to work with different lighting conditions to create stunning images.`,
    featuredImage: '/images/blog/placeholder-1.jpg',
    published: true,
    publishedAt: new Date('2023-05-15'),
    tags: ['photography', 'techniques', 'composition']
  },
  {
    title: 'Top 10 Wedding Photography Tips',
    slug: 'top-10-wedding-photography-tips',
    excerpt: 'Essential tips for couples to get the best wedding photos on their special day.',
    content: `Your wedding day is one of the most important days of your life, and having beautiful photos to remember it by is essential. Here are our top 10 tips for getting the best wedding photos:
    
    1. **Hire a Professional** - Invest in a professional photographer with experience in weddings.
    2. **Create a Shot List** - Make sure to communicate your must-have shots.
    3. **Consider the Lighting** - Schedule your ceremony and portraits during golden hour for the best natural light.
    4. **Get to Know Your Photographer** - A pre-wedding shoot helps you feel comfortable in front of the camera.
    5. **Plan for Extra Time** - Things often run late, so build in buffer time for photos.
    6. **Choose Meaningful Locations** - Pick spots that are significant to you as a couple.
    7. **Trust Your Photographer** - Let them do what they do best.
    8. **Have Fun** - The more relaxed you are, the better your photos will be.`,
    featuredImage: '/images/blog/placeholder-2.jpg',
    published: true,
    publishedAt: new Date('2023-04-28'),
    tags: ['wedding', 'tips', 'photography']
  },
  {
    title: 'Mastering Natural Light Photography',
    slug: 'mastering-natural-light-photography',
    excerpt: 'Learn how to use natural light to create stunning, professional-quality photos.',
    content: `Natural light is one of the most beautiful and versatile light sources available to photographers. In this guide, we'll explore how to harness its power.
    
    ## Understanding Light Quality
    - **Soft Light**: Overcast days provide beautiful, diffused light that's perfect for portraits.
    - **Hard Light**: Direct sunlight creates strong shadows and high contrast.
    - **Golden Hour**: The hour after sunrise and before sunset offers warm, directional light.
    
    ## Techniques for Different Lighting Conditions
    1. **Backlighting** - Position your subject in front of the light source for a beautiful glow.
    2. **Window Light** - Use window light for soft, flattering portraits.
    3. **Shade** - Move into the shade for even lighting on bright days.
    
    ## Equipment Tips
    - Use a reflector to bounce light onto your subject
    - A diffuser can soften harsh sunlight
    - Consider a lens hood to reduce lens flare`,
    featuredImage: '/images/blog/placeholder-3.jpg',
    published: true,
    publishedAt: new Date('2023-04-10'),
    tags: ['lighting', 'techniques', 'tutorial']
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    
    console.log('Deleting existing blog posts...');
    await BlogPost.deleteMany({});
    
    console.log('Adding sample blog posts...');
    await BlogPost.insertMany(samplePosts);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
