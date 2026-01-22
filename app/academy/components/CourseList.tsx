'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Contact from '@/components/Contact';

const courses = [
  {
    id: 1,
    title: 'Product Photography Fundamentals',
    description: 'Master the essential techniques for capturing stunning product images that sell. Learn lighting, composition, and post-processing specifically for e-commerce and commercial use.',
    duration: '4 weeks',
    level: 'Beginner to Intermediate',
    image: '/images/academy/product-photography.jpg',
    category: 'photography',
    price: 299,
    instructor: 'Sarah Johnson',
    rating: 4.8,
    students: 1245,
    lessons: 24,
    projects: 5
  },
  {
    id: 2,
    title: 'Media Visual Storytelling',
    description: 'Create compelling visual narratives for social media and digital platforms. Learn to craft stories that engage and convert your audience.',
    duration: '3 weeks',
    level: 'All Levels',
    image: '/images/academy/social-media.jpg',
    category: 'media',
    price: 199,
    instructor: 'Michael Chen',
    rating: 4.7,
    students: 987,
    lessons: 18,
    projects: 4
  },
  {
    id: 3,
    title: 'Lighting Mastery',
    description: 'Unlock the power of light in your photography. From natural to artificial lighting, learn to create the perfect setup for any situation.',
    duration: '3 weeks',
    level: 'All Levels',
    image: '/images/academy/lighting.jpg',
    category: 'photography',
    price: 249,
    instructor: 'Emma Wilson',
    rating: 4.9,
    students: 1567,
    lessons: 20,
    projects: 3
  },
  {
    id: 4,
    title: 'Phone Photography Pro',
    description: 'Transform your smartphone into a professional camera. Learn advanced techniques for taking and editing stunning photos with just your phone.',
    duration: '2 weeks',
    level: 'All Levels',
    image: '/images/academy/smartphone.jpg',
    category: 'mobile',
    price: 179,
    instructor: 'David Kim',
    rating: 4.6,
    students: 2034,
    lessons: 15,
    projects: 3
  }
];

export default function CourseList() {
  return (
    <div className="py-12 bg-gray-50" id="course-list">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            In-Person Photography Courses
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Hands-on learning experiences with professional photographers in our studio
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.5,
                delay: index * 0.1
              }}
            >
              <div className="relative h-48 w-full">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {course.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                  <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full whitespace-nowrap ml-4">
                    {course.duration}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Location: Our Studio (HCMC, Vietnam)</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Duration: {course.duration} (in-person)</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Schedule: {course.lessons} practical sessions</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-3">Interested in this course?</p>
                  <a 
                    href="#contact"
                    className="w-full block text-center px-4 py-2 border-2 border-black text-black font-medium rounded-md hover:bg-black hover:text-white transition-colors"
                  >
                    Contact Us for Details
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Section */}
        <div className="py-20 bg-gray-50 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                What Our Students Say
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Join thousands of satisfied students who have transformed their skills
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "The lighting course completely changed how I approach product photography. My online store's conversion rate increased by 40%!",
                  author: "Sarah Johnson",
                  role: "E-commerce Entrepreneur"
                },
                {
                  quote: "As a complete beginner, I was nervous to start, but the instructors made everything so easy to understand. Highly recommended!",
                  author: "Michael Chen",
                  role: "Aspiring Photographer"
                },
                {
                  quote: "The community and support are incredible. I've made valuable connections and improved my skills beyond what I thought possible.",
                  author: "Emma Wilson",
                  role: "Social Media Manager"
                }
              ].map((testimonial, index) => (
                <motion.div 
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-md"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-yellow-400 text-2xl mb-4">"</div>
                  <p className="text-gray-600 mb-6">{testimonial.quote}</p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-300 mr-4"></div>
                    <div>
                      <p className="font-medium text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Contact Section */}
        <div id="contact" className="mt-16">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Ready to Join Our Workshop?</h3>
            <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
              Limited spots available for our in-person workshops in Ho Chi Minh City. 
              Contact us to schedule a visit or to learn more about our programs.
            </p>
            <Contact />
          </div>
        </div>
      </div>
    </div>
  );
}
