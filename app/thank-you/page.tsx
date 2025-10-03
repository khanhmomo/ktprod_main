'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import ClientLayout from './ClientLayout';

export const dynamic = 'force-dynamic';

export default function ThankYouPage() {
  return (
    <ClientLayout>
      <div className="min-h-screen bg-white">
      
      {/* Hero Section with Overlapping Nav */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0">
            <Image
              src="/images/AKT01115.jpg"
              alt="Elegant Wedding Studio"
              fill
              className="object-cover blur-sm scale-105 transform-gpu"
              style={{
                filter: 'blur(8px)',
                transform: 'scale(1.05)',
                transformOrigin: 'center',
                willChange: 'transform',
              }}
              priority
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-black/40 bg-gradient-to-b from-black/30 to-black/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            <div className="relative w-64 h-32 mx-auto my-6">
              <Image 
                src="/thewildlogo.png" 
                alt="The Wild Studio Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            
            <p className="text-xl md:text-2xl tracking-widest mb-2" style={{ fontFamily: 'var(--font-lato)' }}>Thank You For</p>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Celebrating With Us
            </h1>
            <div className="w-24 h-px bg-white/50 mx-auto my-8"></div>
          </motion.div>
        </div>
      </section>

      {/* Thank You Message Section */}
      <section className="pt-20 pb-8 md:pt-32 md:pb-12 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-left"
          >
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-12 text-center" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Our Heartfelt Gratitude
            </h2>
            
            <div className="text-gray-700 leading-relaxed space-y-6">
              <p>Dear Valued Guests,</p>
              
              <p>Words cannot express how grateful we are for your presence at our grand opening celebration. Your support means the world to us as we embark on this exciting new chapter.</p>
              
              <p>The energy and joy you brought to our studio will be cherished forever in our memories. It's because of wonderful people like you that we are inspired to create and capture life's most precious moments.</p>
              
              <p>We look forward to continuing this journey with you and creating beautiful memories together. Your trust in us is what drives us to excel in our craft every single day.</p>
              
              <p>For any inquiries or to book a session, please contact us at thewildstudio.nt@gmail.com or (832) 992-7879.</p>
              
              <div className="mt-10">
                <p className="mb-1 text-gray-600">With warmest regards,</p>
                <div className="font-caveat text-xl text-gray-800 leading-none">
                  The Wild Studio Team
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* View Album Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 text-center"
          >
            <h3 className="text-3xl font-light text-gray-900 mb-8" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Event Gallery
            </h3>
            <a 
              href="/albums/68dde4c6b4af4c97b3fcbac1"
              className="inline-block px-8 py-3 border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-colors duration-300"
            >
              View Event Photos
            </a>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-6">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <div className="relative w-40 h-20 mx-auto mb-6">
            <Image 
              src="/thewildlogo.png" 
              alt="The Wild Studio Logo" 
              fill 
              className="object-contain opacity-70"
            />
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} The Wild Studio. All rights reserved.
          </p>
          <p className="text-xs mt-2 text-gray-400">
            Thank you for being part of our story.
          </p>
        </div>
      </footer>
      </div>
    </ClientLayout>
  );
}
