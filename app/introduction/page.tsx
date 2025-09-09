'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const Logo = () => (
  <div className="relative w-96 h-24 mx-auto mb-8">
    <Image
      src="/thewildlogo_black.png"
      alt="The Wild Photography"
      width={384}
      height={96}
      className="object-contain w-full h-full"
      priority
    />
  </div>
);

export default function Introduction() {
  return (
    <div className="bg-white -mt-8">
      {/* Our Story Section */}
      <section className="pt-4 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Logo />
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
                src="https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/540087278_25374967925436750_7595366982701674223_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=wZbiKxCLbeIQ7kNvwEKxkNd&_nc_oc=Adn2yTk8apH-8aysuqUpWItnsLBWoMsU5d2MPnY7VjlwHrX1wZf-KlYUlCckdxLsS0GNDZh4oVwbaltnSOC1aT9P&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=hIm3de923HFU1MChyJYUBQ&oh=00_AfbqiRPM9o1vh8KMv04o_x0F-qVB6isqO3bzvVS5MhsObA&oe=68C56113"
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
                  src="https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/543122746_1227873785810265_2857773337091645379_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_ohc=SCLqoDTBl6QQ7kNvwFgfIrY&_nc_oc=AdkyzCh4Yr5lhsgXPoKai9HU366Y7ZuYRTZKexQB8NvkyyG58Z858HLHBpcQB9wT8okMwuLyMPH-NQhpjOlatzLQ&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=10Nxi6ZIGVEOVpbuGiXJBw&oh=00_AfY6SsSmMMcMJauoJip4ihV-x7lcVgkCAH8YY8XnwW1w0g&oe=68C58361"
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
To us, capturing authentic moments is the heart
of everything. We study the wedding schedule closely ahead of time, approaching each event with an open mind while avoiding preconceived ideas.
This allows us to naturally tell a true and vivid love story, not one that feels staged or forced.
              </p>
              <p className="text-gray-600 mb-6">
              Rather than focusing only on the couple, we seek
out the emotions of everyone present - family, friends, guests - weaving them into one heartfelt narrative.
A single hug, a smile, a tear, a glance - each small moment is captured with honesty, and later, they come together like pieces of a timeless memory.
              </p>
              <p className="text-gray-600 mb-6">
              We do not direct or interfere with natural moments during your wedding day. Instead, we observe gently, creating space for genuine emotions to unfold naturally, capturing the true spirit of your love story.
              </p>
              <p className="text-gray-600">
              We also avoid spending too much time on posing or arranging scenes artificially. Instead, we embrace
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
