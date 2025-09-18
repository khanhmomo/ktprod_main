'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function About() {
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
                src="https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/547372679_1235470425050601_4278193282923074331_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=127cfc&_nc_ohc=UV15EZcV1EcQ7kNvwFRuzhx&_nc_oc=AdnnxASGoT_ztI8U4tJTb7LsPCz7UaCmnCfjoQUJL9kjAv4Q_UQirn92UwIXSrGlGnE&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=MEbMqNNc8HfLitcYBYqhwg&oh=00_Afa2erBphQve0m4OZkPnIzYjYpguTxyY4sCBdzUnLXd11w&oe=68D11A55"
                alt="Our Story"
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
            <p className="text-gray-600 mb-6">
            We believe that photography and videography are the most beautiful ways to preserve life's most meaningful moments,
          especially during the most important milestones.
          That's why we strive to capture each couple's unique emotions and genuine connection
          with every click of the shutter.

            </p>
            <p className="text-gray-600 mb-8">
            To us, every love story has a distinct color.
            The memories and feelings behind them create this uniqueness, and your wedding photos and films
            will be the keepsake that holds
            all those sweet elevated moments of love.
            </p>
            <p className="text-gray-600 mb-8 font-bold italic">
            "Let us tell your story differently way"
            </p>
            
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-2">8+</div>
                <div className="text-gray-600">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-2">500+</div>
                <div className="text-gray-600">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-2">10K+</div>
                <div className="text-gray-600">Photos Captured</div>
              </div>
            </div>
            
            <div className="flex justify-center md:justify-start">
              <Link 
                href="/introduction" 
                className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors inline-block text-center"
              >
                Learn More About Us
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
