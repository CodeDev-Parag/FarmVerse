import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ArrowRight } from 'lucide-react';

export default function FreshSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const leftTagRef = useRef<HTMLSpanElement>(null);
  const rightTagRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0-30%)
      // Background
      scrollTl.fromTo(
        bgRef.current,
        { x: '18vw', y: '10vh', scale: 1.12, rotate: -2, opacity: 0 },
        { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, ease: 'none' },
        0
      );

      // Glass panel
      scrollTl.fromTo(
        panelRef.current,
        { x: '-60vw', rotateY: 18, opacity: 0 },
        { x: 0, rotateY: 0, opacity: 1, ease: 'power2.out' },
        0
      );

      // Headline words
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.word');
        scrollTl.fromTo(
          words,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.02, ease: 'power2.out' },
          0.05
        );
      }

      // Body + CTA
      scrollTl.fromTo(
        [bodyRef.current, ctaRef.current],
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.02, ease: 'power2.out' },
        0.1
      );

      // Bottom tags
      scrollTl.fromTo(
        [leftTagRef.current, rightTagRef.current],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.02, ease: 'power2.out' },
        0.15
      );

      // SETTLE (30-70%): Elements hold position

      // EXIT (70-100%)
      scrollTl.fromTo(
        panelRef.current,
        { x: 0, opacity: 1 },
        { x: '-55vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        [headlineRef.current, bodyRef.current, ctaRef.current],
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
        bgRef.current,
        { scale: 1, y: 0 },
        { scale: 1.07, y: '-5vh', ease: 'none' },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollToMarketplace = () => {
    const element = document.getElementById('marketplace');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      id="fresh"
      className="section-pinned z-20"
    >
      {/* Background Image */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-[1]"
        style={{
          backgroundImage: 'url(/produce_flatlay.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0,
        }}
      />

      {/* Dark Overlay */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: 'linear-gradient(90deg, rgba(11,58,46,0.88) 0%, rgba(11,58,46,0.5) 50%, rgba(11,58,46,0.25) 100%)',
        }}
      />

      {/* Gold Glow */}
      <div
        className="absolute z-[3]"
        style={{
          left: '5vw',
          top: '10vh',
          width: '45vw',
          height: '55vh',
          background: 'radial-gradient(circle at 30% 40%, rgba(212,160,58,0.15), transparent 55%)',
        }}
      />

      {/* Glass Panel */}
      <div
        ref={panelRef}
        className="absolute z-[4] glass-panel p-8 md:p-12"
        style={{
          left: '7vw',
          top: '14vh',
          width: 'min(40vw, 520px)',
          minWidth: '300px',
          opacity: 0,
        }}
      >
        <h2
          ref={headlineRef}
          className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-farm-cream leading-[0.95] mb-6"
        >
          <span className="word inline-block">Fresh</span>{' '}
          <span className="word inline-block">from</span>{' '}
          <span className="word inline-block">the</span>{' '}
          <span className="word inline-block text-gradient-gold">Farm.</span>
        </h2>

        <p
          ref={bodyRef}
          className="text-lg md:text-xl text-farm-cream/80 mb-8 max-w-md"
        >
          Hand-picked, locally grown produce delivered straight to your door.
        </p>

        <button
          ref={ctaRef}
          onClick={scrollToMarketplace}
          className="btn-primary group flex items-center gap-3"
        >
          Shop Seasonal Produce
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      {/* Bottom Left Tag */}
      <span
        ref={leftTagRef}
        className="absolute z-[4] font-mono text-xs tracking-[0.2em] text-farm-cream/60 uppercase"
        style={{ left: '7vw', bottom: '7vh', opacity: 0 }}
      >
        Seasonal
      </span>

      {/* Bottom Right Tag */}
      <span
        ref={rightTagRef}
        className="absolute z-[4] font-mono text-xs tracking-[0.2em] text-farm-cream/60 uppercase"
        style={{ right: '7vw', bottom: '7vh', opacity: 0 }}
      >
        Quality
      </span>
    </section>
  );
}
