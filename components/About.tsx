'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AboutContent {
  title: string;
  paragraphs: Array<{ text: string; isItalic: boolean; isBold: boolean }>;
  imageUrl: string;
  imageAlt: string;
  stats: Array<{ value: string; label: string }>;
  ctaButton: { text: string; href: string };
}

export default function About() {
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/homepage');
        if (response.ok) {
          const data = await response.json();
          setAboutContent(data.about);
        }
      } catch (error) {
        console.error('Error fetching about content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (isLoading) {
    return (
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4 max-w-md"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
          </div>
        </div>
      </section>
    );
  }

  const title = aboutContent?.title || 'Our Story';
  const paragraphs = aboutContent?.paragraphs || [];
  const imageUrl = aboutContent?.imageUrl || 'https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/547372679_1235470425050601_4278193282923074331_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=127cfc&_nc_ohc=UV15EZcV1EcQ7kNvwFRuzhx&_nc_oc=AdnnxASGoT_ztI8U4tJTb7LsPCz7UaCmnCfjoQUJL9kjAv4Q_UQirn92UwIXSrGlGnE&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=MEbMqNNc8HfLitcYBYqhwg&oh=00_Afa2erBphQve0m4OZkPnIzYjYpguTxyY4sCBdzUnLXd11w&oe=68D11A55';
  const imageAlt = aboutContent?.imageAlt || 'Our Story';
  const stats = aboutContent?.stats || [];
  const ctaButton = aboutContent?.ctaButton || { text: 'Learn More About Us', href: '/introduction' };

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center">
          <motion.div 
            className="w-full lg:w-1/2 mb-10 lg:mb-0 lg:pr-10"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden shadow-xl">
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{title}</h2>
            {paragraphs.map((paragraph, index) => (
              <p 
                key={index} 
                className={`text-gray-600 mb-6 ${paragraph.isItalic ? 'italic' : ''} ${paragraph.isBold ? 'font-bold' : ''}`}
              >
                {paragraph.text}
              </p>
            ))}
            
            {stats.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-black mb-2">{stat.value}</div>
                    <div className="text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-center md:justify-start">
              <Link 
                href={ctaButton.href} 
                className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors inline-block text-center"
              >
                {ctaButton.text}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
