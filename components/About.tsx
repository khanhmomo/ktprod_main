'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function About() {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center">
          <motion.div 
            className="lg:w-1/2 mb-10 lg:mb-0 lg:pr-10"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-xl">
              <Image
                src="https://scontent.faus1-1.fna.fbcdn.net/v/t39.30808-6/471333544_122138681282450398_8999774020313144697_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_ohc=WrWBSht0_2wQ7kNvwHXOgZw&_nc_oc=Admex4JouO-Nj0BRjv5rLgZnRbQ0IzHj6u4WiKDkoKmAnQl5lqWQvSZsXRxZBGvwYkQ&_nc_zt=23&_nc_ht=scontent.faus1-1.fna&_nc_gid=RH5YmYUnarwFr34TR_lpaw&oh=00_AfYn4PZkQNgCKfgwAap8O4tDMziVcFspa-LpVY8O8fQAGA&oe=68C17E36"
                alt="Our Story"
                fill
                className="object-cover"
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
            We believe that photography and videography are the most timeless ways to preserve life’s most meaningful moments and special occasions.

With every click of the shutter, we strive to capture the unique emotions and stories of each couple—always drawn from the most genuine and heartfelt moments.


            </p>
            <p className="text-gray-600 mb-8">
            To us, “every love story carries its own distinctive color.”

It is the memories and emotions that make each story different, and through our photos and films, we preserve the sweet, elevated moments of love in their most beautiful form.

Let us tell your story—differently.
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
            
            <button className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors">
              Learn More About Us
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
