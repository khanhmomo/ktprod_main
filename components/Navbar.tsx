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
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (isHomePage) {
        const isScrolled = window.scrollY > 10;
        if (isScrolled !== scrolled) {
          setScrolled(isScrolled);
        }
      } else if (!scrolled) {
        setScrolled(true);
      }
    };

    // Set initial state based on current page
    if (!isHomePage) {
      setScrolled(true);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled, isHomePage]);

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled || !isHomePage
          ? 'bg-white text-black shadow-md h-16' 
          : 'bg-transparent text-white h-20'
      }`}
    >
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          <Link href="/" className="flex items-center h-full">
            <Image
              src="/Trans_logo_white.png"
              alt="KT Productions"
              width={120}
              height={45}
              className={`h-full w-auto ${scrolled || !isHomePage ? 'hidden' : 'block'}`}
              priority
            />
            <Image
              src="/Trans_logo_white.png"
              alt="KT Productions"
              width={120}
              height={45}
              className={`h-full w-auto ${scrolled || !isHomePage ? 'block' : 'hidden'}`}
              style={{ filter: 'brightness(0) invert(0)' }}
              priority
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isHomePage) ? 'text-black' : 'text-white'}`}
            >
              Home
            </Link>
            <Link 
              href="/introduction" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isHomePage) ? 'text-black' : 'text-white'}`}
            >
              About Us
            </Link>
            <Link 
              href="/pricing" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isHomePage) ? 'text-black' : 'text-white'}`}
            >
              Pricing
            </Link>
            <Link 
              href="/albums" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isHomePage) ? 'text-black' : 'text-white'}`}
            >
              Albums
            </Link>
            <Link 
              href="/kind-words" 
              className={`hover:opacity-80 transition-opacity ${(scrolled || !isHomePage) ? 'text-black' : 'text-white'}`}
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
              <FiX className={(scrolled || !isHomePage) ? 'text-black' : 'text-white'} />
            ) : (
              <FiMenu className={(scrolled || !isHomePage) ? 'text-black' : 'text-white'} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div 
          className={`md:hidden absolute left-0 right-0 transition-all duration-300 ${
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
          } ${
            (scrolled || !isHomePage) ? 'bg-white text-black' : 'bg-black/90 text-white'
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
              href="/pricing" 
              className="hover:opacity-80 transition-opacity py-2"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/albums" 
              className="hover:opacity-80 transition-opacity py-2"
              onClick={() => setIsOpen(false)}
            >
              Albums
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
