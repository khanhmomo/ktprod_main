'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const Logo = () => (
  <div className="relative w-96 h-24 mx-auto mb-8">
    <Image
      src="/thewildlogo_black.png"
      alt="The Wild Studio"
      width={384}
      height={96}
      className="object-contain w-full h-full"
      priority
    />
  </div>
);

interface IntroductionContent {
  mainDescription: string;
  philosophy: {
    text: string;
    image: {
      url: string;
      alt: string;
    };
  };
  approach: {
    text: string;
    image: {
      url: string;
      alt: string;
    };
  };
  cta: {
    headline: string;
    description: string;
    buttonText: string;
    buttonLink: string;
  };
}

export default function Introduction() {
  const [content, setContent] = useState<IntroductionContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/introduction');
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error('Error fetching introduction content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white -mt-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white -mt-8">
      {/* Our Story Section */}
      <section className="pt-4 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Logo />
            <p className="text-gray-600 text-lg leading-relaxed">
              {content?.mainDescription || 'Founded with a passion for storytelling through imagery, we\'ve been capturing life\'s most precious moments for over a decade. Our journey began with a simple camera and a dream to create timeless memories for our clients.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-96 rounded-xl overflow-hidden shadow-xl"
            >
              <Image
                src={content?.philosophy?.image?.url || "https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/544673315_1227873979143579_9123989934276526782_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=127cfc&_nc_ohc=WgjRuPpeiPIQ7kNvwFKwypp&_nc_oc=AdkNRKRlzDzNi9VaTO3VMy9DcBjOLkUx4R5t8NVeJ4tv3NZXE2C6CCLdzH5Sd-LN5M0&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=__Mv_BqpXTBp1JbXC9xH7g&oh=00_AfbCGGHcJzReXAxPTAPPFtZ7f6ZKxGuA6p7aaxMRP8u39A&oe=68D12FF8"}
                alt={content?.philosophy?.image?.alt || "Our Team"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Our Philosophy</h3>
              <p className="text-gray-600 mb-6">
                {content?.philosophy?.text || 'We believe that every photograph should tell a story. Our approach combines technical expertise with an artistic eye to capture the essence of each moment. We focus on creating authentic, emotional images that you\'ll treasure for generations.'}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="md:order-2">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative h-96 rounded-xl overflow-hidden shadow-xl"
              >
                <Image
                  src={content?.approach?.image?.url || "https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/484656906_1096662685598043_1015053343159873440_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_ohc=RvU3IEhT4O0Q7kNvwES0Us0&_nc_oc=AdnK6_SDxwpjDGbWatznyvqAAZnthw6CHnhM6q1bCDhmyPIqkcNC7AR3ge7E81BmH9M&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=Eqm97qLnIFDG-4fogYRMWw&oh=00_AfYSPUEZAWelCLGnzYql_zRmli_h3gLPEmYSQoq3CT4eng&oe=68D117D4"}
                  alt={content?.approach?.image?.alt || "Our Approach"}
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>
            <div className="md:order-1">
              <h3 className="text-2xl font-bold mb-4">Our Approach</h3>
              <p className="text-gray-600 mb-6">
                {content?.approach?.text || 'No two weddings are ever the same - and that\'s exactly why we take time to understand the unique style and personality of each couple, from their wedding concept to the color tones of their special day. To us, capturing authentic moments is the heart of everything. We study the wedding schedule closely ahead of time, approaching each event with an open mind while avoiding preconceived ideas. This allows us to naturally tell a true and vivid love story, not one that feels staged or forced.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {content?.cta?.headline || 'Ready to Create Something Amazing?'}
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            {content?.cta?.description || 'Let\'s work together to capture your special moments and create memories that will last a lifetime.'}
          </p>
          <Link 
            href={content?.cta?.buttonLink || "/contact"}
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {content?.cta?.buttonText || 'Get in Touch'}
          </Link>
        </div>
      </section>
    </div>
  );
}
