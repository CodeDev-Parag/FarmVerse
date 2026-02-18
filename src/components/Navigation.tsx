import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ShoppingCart, Menu, X, Search } from 'lucide-react';

import { useStore } from '../store/useStore';

interface NavigationProps {
  onNavigate: (href: string) => void;
}

const navLinks = [
  { label: 'Marketplace', href: '#marketplace' },
  { label: 'Technology', href: '#smart' },
  { label: 'Sustainability', href: '#sustainable' },
  { label: 'Contact', href: '#contact' },
];

export default function Navigation({ onNavigate }: NavigationProps) {
  const { cart, toggleCart, searchQuery, setSearchQuery } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);



  useEffect(() => {
    // Reveal navigation on mount after a small delay
    if (navRef.current) {
      gsap.to(navRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.5,
        ease: 'power2.out',
      });
    }
  }, []);

  const handleNavigation = (href: string) => {
    onNavigate(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-[100] opacity-0 -translate-y-full pointer-events-none"
      >
        <div className="mx-4 mt-4 pointer-events-auto">
          <div className="glass-panel px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
            {/* Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 mr-12"
            >
              <span className="text-xl font-heading font-black">
                <span className="text-farm-cream">Farm</span>
                <span className="text-farm-gold">Verse</span>
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(link.href);
                  }}
                  className="group relative px-4 py-2 rounded-full text-sm font-medium text-farm-cream/80 transition-all duration-300 hover:text-farm-gold hover:bg-farm-gold/10 hover:shadow-[0_0_20px_rgba(212,160,58,0.2)]"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 mx-8 justify-center">
              <div className="relative w-full max-w-md group">
                <input
                  type="text"
                  placeholder="Search fresh produce..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNavigation('#marketplace');
                    }
                  }}
                  className="w-full bg-farm-cream/10 border border-farm-cream/20 rounded-full py-2 pl-4 pr-10 text-farm-cream placeholder:text-farm-cream/50 focus:outline-none focus:ring-2 focus:ring-farm-gold/50 transition-all duration-300"
                />
                <button
                  onClick={() => {
                    handleNavigation('#marketplace');
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-farm-gold text-farm-green rounded-full hover:bg-white transition-colors duration-300"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Cart button */}
              <button
                onClick={() => toggleCart(true)}
                className="relative p-2 text-farm-cream/80 hover:text-farm-cream transition-colors duration-300"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-farm-gold text-farm-green text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-farm-cream/80 hover:text-farm-cream transition-colors duration-300"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mx-4 mt-2 pointer-events-auto">
            <div className="glass-panel p-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(link.href);
                  }}
                  className="text-lg text-farm-cream/80 hover:text-farm-gold transition-colors duration-300 pl-2 border-l-2 border-transparent hover:border-farm-gold"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
