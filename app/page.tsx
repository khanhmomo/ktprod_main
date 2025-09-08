'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import components with SSR disabled
const Hero = dynamic(() => import('../components/Hero'), { ssr: false });
const About = dynamic(() => import('../components/About'), { ssr: false });
const Services = dynamic(() => import('../components/Services'), { ssr: false });
const Contact = dynamic(() => import('../components/Contact'), { ssr: false });

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Services />
      
      {/* Contact Section with Title */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
            <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Have a project in mind? Let's talk about how we can help you capture your vision.
            </p>
          </motion.div>
          
          <div className="max-w-4xl mx-auto">
            <Contact />
          </div>
        </div>
      </section>
    </main>
  );
}
