'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function Introduction() {
  return (
    <div className="bg-white -mt-8">
      {/* Our Story Section */}
      <section className="pt-4 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
            <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Founded with a passion for storytelling through imagery, we've been capturing life's most precious moments for over a decade. 
              Our journey began with a simple camera and a dream to create timeless memories for our clients.
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
                src="https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/471469351_122138681300450398_546435886968958175_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_ohc=sIJ75Z_NcU8Q7kNvwG_AQYB&_nc_oc=AdmkEltzXNJcTRIuyuTCcBvnY4bRJMtDpJyem0gHKNO-ntagWgsSKxYtSuiCELKcWCUx60B6LJQQoZJs3Q_WU7Q7&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=Rt6lJjPYRTYP5gJv0xCs4Q&oh=00_AfZZlpuYB9tCDkKF2RHmBufudEdQu-RiayBN1IpKUa7ZYQ&oe=68C445D9"
                alt="Our Team"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Our Philosophy</h3>
              <p className="text-gray-600 mb-6">
                We believe that every photograph should tell a story. Our approach combines technical expertise with an artistic eye to capture the essence of each moment. We focus on creating authentic, emotional images that you'll treasure for generations.
              </p>
              <p className="text-gray-600">
                Our team of talented photographers and videographers are dedicated to providing a personalized experience, ensuring that your unique vision comes to life in every frame.
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
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216"
                  alt="Our Approach"
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>
            <div className="md:order-1">
              <h3 className="text-2xl font-bold mb-4">Our Approach</h3>
              <p className="text-gray-600 mb-6">
              No two weddings are ever the same - and that's exactly why we take time to understand the unique style and personality of each couple, from their
wedding concept to the color tones of their special day.
To us. capturinQ authentic moments is the heart
of everything. We study the wedding schedule closely ahead of time, approaching each event with an open mind while avoidinQ preconceived ideas.
This allows us to na1urally tell a true and vivid love story, not one that feels staged or forced.
              </p>
              <p className="text-gray-600">
              Rather than focusing only on the couple, we seek
out the emotions of everyone present -	family, friends, Quests -	weaving them into one heartfelt narrative.
A single hug, a smile, a tear, a glance -	each small moment is captured with honesty, and later. they come together like pieces of a timeless memory.
              </p>
              <p className="text-gray-600">
              We do not direct or interfere with natural moments during your wedding day. Instead. we observe gently, creating space for genuine emotions to unfold naturally, capturing the true spirit of your love story.
              </p>
              <p className="text-gray-600">
              We also avoid spending too much time on posing or arranginQ scenes artificially. Instead we embrace
natural light candid beauty, and relaxed moments that make every couple feel truly at ease and themselves.
              </p>
              
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Create Something Amazing?</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Let's work together to capture your special moments and create memories that will last a lifetime.
          </p>
          <Link 
            href="/contact" 
            className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-300"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}
