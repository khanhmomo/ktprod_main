'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isTransparentPage = pathname === '/' || pathname.startsWith('/academy');

  useEffect(() => {
    const handleScroll = () => {
      if (isTransparentPage) {
        const isScrolled = window.scrollY > 10;
        if (isScrolled !== scrolled) {
          setScrolled(isScrolled);
        }
      } else if (!scrolled) {
        setScrolled(true);
      }
    };

    // Set initial state based on current page
    if (!isTransparentPage) {
      setScrolled(true);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled, isTransparentPage]);

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled || !isTransparentPage
          ? 'bg-white text-black shadow-md h-16' 
          : 'bg-transparent text-white h-20'
      }`}
    >
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          <Link href="/" className="flex items-center h-20">
            {/* White logo for hero section */}
            <div 
              className={`relative h-10 w-32 ${!scrolled && isTransparentPage ? 'block' : 'hidden'}`}
            >
              <Image
                src="/thewildlogo.png"
                alt="The Wild Photography"
                fill
                className="object-contain"
                priority
              />
            </div>
            {/* Black logo for scrolled/non-home pages */}
            <div className={`relative h-12 w-40 ${scrolled || !isTransparentPage ? 'block' : 'hidden'}`}>
              <Image
                src="/thewildlogo_black.png"
                alt="The Wild Photography"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isTransparentPage) ? 'text-black' : 'text-white'}`}
            >
              Home
            </Link>
            <Link 
              href="/introduction" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isTransparentPage) ? 'text-black' : 'text-white'}`}
            >
              About Us
            </Link>
            <Link 
              href="/services" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isTransparentPage) ? 'text-black' : 'text-white'}`}
            >
              Services
            </Link>
            <Link 
              href="/gallery" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isTransparentPage) ? 'text-black' : 'text-white'}`}
            >
              Gallery
            </Link>
            <Link 
              href="/film" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isTransparentPage) ? 'text-black' : 'text-white'}`}
            >
              Film
            </Link>
            <Link 
              href="/blog" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isTransparentPage) ? 'text-black' : 'text-white'}`}
            >
              Blog
            </Link>
            <Link 
              href="/kind-words" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isTransparentPage) ? 'text-black' : 'text-white'}`}
            >
              Kind Words
            </Link>
            
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-2xl focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <FiX className={(scrolled || !isTransparentPage) ? 'text-black' : 'text-white'} />
            ) : (
              <FiMenu className={(scrolled || !isTransparentPage) ? 'text-black' : 'text-white'} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div 
          className={`md:hidden absolute left-0 right-0 transition-all duration-300 ${
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
          } ${
            (scrolled || !isTransparentPage) ? 'bg-white text-black' : 'bg-black/90 text-white'
          }`}
          style={{
            top: 'calc(100% + 1px)', // +1px to prevent gap
            boxShadow: scrolled ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
          }}
        >
          <div className="flex flex-col space-y-4 py-4 px-4">
            <Link 
              href="/" 
              className="hover:opacity-80 transition-opacity py-2"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/introduction" 
              className="hover:opacity-80 transition-opacity py-2"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            <Link 
              href="/services" 
              className="hover:opacity-80 transition-opacity py-2"
              onClick={() => setIsOpen(false)}
            >
              Services
            </Link>
            <Link 
              href="/gallery" 
              className="hover:opacity-80 transition-opacity py-2"
              onClick={() => setIsOpen(false)}
            >
              Gallery
            </Link>
            <Link 
              href="/film" 
              className="hover:opacity-80 transition-opacity py-2"
              onClick={() => setIsOpen(false)}
            >
              Film
            </Link>
            <Link 
              href="/blog" 
              className="hover:opacity-80 transition-opacity py-2"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            <Link 
              href="/kind-words" 
              className="hover:opacity-80 transition-opacity py-2"
              onClick={() => setIsOpen(false)}
            >
              Kind Words
            </Link>
            
          </div>
        </div>
      </div>
    </nav>
  );
}
