'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function AcademyHero() {
  return (
    <section className="relative w-full">
      {/* Background Image with Overlay */}
      <div className="fixed top-0 left-0 right-0 h-screen z-0">
        <div className="absolute inset-0">
          <Image
            src="/images/academy/hero-bg.jpg"
            alt="Photography Academy"
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
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto w-full">
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
          
          <p className="text-xl md:text-2xl tracking-widest mb-2" style={{ fontFamily: 'var(--font-lato)' }}>WELCOME TO</p>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
            THE WILD ACADEMY
          </h1>
          
          <div className="w-24 h-px bg-white/50 mx-auto my-8"></div>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Unlock the power of visual storytelling and take your brand to the next level with our expert-led photography courses.
          </p>
          
          <Link 
            href="#courses"
            className="inline-block bg-white text-black px-8 py-3 rounded-sm hover:bg-gray-100 transition-colors font-medium tracking-wider"
          >
            EXPLORE COURSES
          </Link>
        </motion.div>
      </div>
      
      {/* Content Container - Takes up full viewport height */}
      <div className="relative min-h-screen flex items-center justify-center w-full">
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto w-full">
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
            
            <p className="text-xl md:text-2xl tracking-widest mb-2" style={{ fontFamily: 'var(--font-lato)' }}>WELCOME TO</p>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
              THE WILD ACADEMY
            </h1>
            
            <div className="w-24 h-px bg-white/50 mx-auto my-8"></div>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Unlock the power of visual storytelling and take your brand to the next level with our expert-led photography courses.
            </p>
            
            <Link 
              href="#courses"
              className="inline-block bg-white text-black px-8 py-3 rounded-sm hover:bg-gray-100 transition-colors font-medium tracking-wider"
            >
              EXPLORE COURSES
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
