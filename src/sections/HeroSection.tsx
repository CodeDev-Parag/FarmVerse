import { useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: () => void;
}

export default function HeroSection({ onExploreClick }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const leftTagRef = useRef<HTMLSpanElement>(null);
  const rightTagRef = useRef<HTMLSpanElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Load animation (auto-play on mount)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const loadTl = gsap.timeline({ delay: 2.5 }); // Wait for loading screen

      // Background
      loadTl.fromTo(
        bgRef.current,
        { opacity: 0, scale: 1.08 },
        { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' }
      );

      // Overlay
      loadTl.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        '-=0.8'
      );

      // Glass panel
      loadTl.fromTo(
        panelRef.current,
        { x: '-12vw', opacity: 0, rotateY: 8 },
        { x: 0, opacity: 1, rotateY: 0, duration: 0.9, ease: 'power3.out' },
        '-=0.5'
      );

      // Headline (word by word)
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.word');
        loadTl.fromTo(
          words,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.05, duration: 0.8, ease: 'power3.out' },
          '-=0.6'
        );
      }

      // Subheadline
      loadTl.fromTo(
        subheadlineRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      );

      // CTA
      loadTl.fromTo(
        ctaRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      );

      // Tags
      loadTl.fromTo(
        [leftTagRef.current, rightTagRef.current],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      );

      // Scroll indicator
      loadTl.fromTo(
        scrollIndicatorRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5 },
        '-=0.2'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Scroll-driven animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            // Reset all elements when scrolling back to top
            gsap.set([panelRef.current, headlineRef.current, subheadlineRef.current, ctaRef.current], {
              opacity: 1,
              x: 0,
            });
            gsap.set([leftTagRef.current, rightTagRef.current], { opacity: 1, x: 0 });
            gsap.set(bgRef.current, { scale: 1, y: 0 });
          },
        },
      });

      // ENTRANCE (0-30%): Hold - load animation already handled it
      // Just subtle parallax on background
      scrollTl.fromTo(
        bgRef.current,
        { y: 0 },
        { y: '-1vh', ease: 'none' },
        0
      );

      // SETTLE (30-70%): Static

      // EXIT (70-100%)
      scrollTl.fromTo(
        panelRef.current,
        { x: 0, opacity: 1 },
        { x: '-55vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        [headlineRef.current, subheadlineRef.current, ctaRef.current],
        { x: 0, opacity: 1 },
        { x: '-55vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        leftTagRef.current,
        { x: 0, opacity: 1 },
        { x: '-20vw', opacity: 0, ease: 'power2.in' },
        0.75
      );

      scrollTl.fromTo(
        rightTagRef.current,
        { x: 0, opacity: 1 },
        { x: '20vw', opacity: 0, ease: 'power2.in' },
        0.75
      );

      scrollTl.fromTo(
        scrollIndicatorRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        bgRef.current,
        { scale: 1, y: '-1vh' },
        { scale: 1.06, y: '-4vh', ease: 'none' },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="section-pinned z-10"
    >
      {/* Background Image */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-[1]"
        style={{
          backgroundImage: 'url(/hero_field.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0,
        }}
      />

      {/* Dark Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-[2]"
        style={{
          background: 'linear-gradient(90deg, rgba(11,58,46,0.85) 0%, rgba(11,58,46,0.45) 55%, rgba(11,58,46,0.2) 100%)',
          opacity: 0,
        }}
      />

      {/* Gold Glow Behind Panel */}
      <div
        className="absolute z-[3]"
        style={{
          left: '5vw',
          top: '12vh',
          width: '50vw',
          height: '60vh',
          background: 'radial-gradient(circle at 30% 40%, rgba(212,160,58,0.15), transparent 55%)',
        }}
      />

      {/* Glass Panel */}
      <div
        ref={panelRef}
        className="absolute z-[4] glass-panel p-8 md:p-12"
        style={{
          left: '7vw',
          top: '18vh',
          width: 'min(46vw, 600px)',
          minWidth: '320px',
          opacity: 0,
        }}
      >
        {/* Headline */}
        <h1
          ref={headlineRef}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black text-farm-cream leading-[0.95] mb-6"
        >
          <span className="word inline-block">Empowering</span>{' '}
          <span className="word inline-block text-gradient-gold">Farmers.</span>
        </h1>

        {/* Subheadline */}
        <p
          ref={subheadlineRef}
          className="text-lg md:text-xl text-farm-cream/80 mb-8 max-w-md"
        >
          Sell directly. Earn fairly. Grow sustainably.
        </p>

        {/* CTA Button */}
        <button
          ref={ctaRef}
          onClick={onExploreClick}
          className="btn-primary group flex items-center gap-3"
        >
          Explore the Marketplace
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      {/* Bottom Left Tag */}
      <span
        ref={leftTagRef}
        className="absolute z-[4] font-mono text-xs tracking-[0.2em] text-farm-cream/60 uppercase"
        style={{ left: '7vw', bottom: '7vh' }}
      >
        Marketplace
      </span>

      {/* Bottom Right Tag */}
      <span
        ref={rightTagRef}
        className="absolute z-[4] font-mono text-xs tracking-[0.2em] text-farm-cream/60 uppercase"
        style={{ right: '7vw', bottom: '7vh' }}
      >
        Sustainability
      </span>

      {/* Scroll Indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute z-[4] left-1/2 -translate-x-1/2 bottom-8 flex flex-col items-center gap-2"
        style={{ opacity: 0 }}
      >
        <span className="text-xs font-mono text-farm-cream/50 uppercase tracking-wider">
          Scroll
        </span>
        <ChevronDown className="w-5 h-5 text-farm-gold animate-bounce" />
      </div>
    </section>
  );
}
