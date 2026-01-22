'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import Contact component with SSR disabled
const Contact = dynamic(() => import('@/components/Contact'), { ssr: false });

export default function ContactPage() {
  return (
    <div className="bg-white -mt-8">
      <section className="pt-4 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
            <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Have a project in mind? Let's talk about how we can help you capture your vision.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Contact />
          </div>
        </div>
      </section>
    </div>
  );
}
