import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Leaf, Recycle, Sun } from 'lucide-react';

export default function SustainableSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
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
        { x: '-18vw', scale: 1.12, rotate: -2, opacity: 0 },
        { x: 0, scale: 1, rotate: 0, opacity: 1, ease: 'none' },
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

      // Features
      if (featuresRef.current) {
        const features = featuresRef.current.querySelectorAll('.feature-item');
        scrollTl.fromTo(
          features,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.02, ease: 'power2.out' },
          0.12
        );
      }

      // Bottom tags
      scrollTl.fromTo(
        [leftTagRef.current, rightTagRef.current],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.02, ease: 'power2.out' },
        0.15
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
        [headlineRef.current, bodyRef.current, ctaRef.current, featuresRef.current],
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
        { scale: 1, x: 0 },
        { scale: 1.06, x: '-4vh', ease: 'none' },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    { icon: Leaf, label: 'Organic Practices' },
    { icon: Recycle, label: 'Zero Waste' },
    { icon: Sun, label: 'Renewable Energy' },
  ];

  return (
    <section
      ref={sectionRef}
      id="sustainable"
      className="section-pinned z-40"
    >
      {/* Background Image */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-[1]"
        style={{
          backgroundImage: 'url(/hands_plant.jpg)',
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
          top: '14vh',
          width: 'min(44vw, 560px)',
          minWidth: '320px',
          opacity: 0,
        }}
      >
        <h2
          ref={headlineRef}
          className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-farm-cream leading-[0.95] mb-6"
        >
          <span className="word inline-block">Sustainable</span>{' '}
          <span className="word inline-block text-gradient-gold">Farming.</span>
        </h2>

        <p
          ref={bodyRef}
          className="text-lg md:text-xl text-farm-cream/80 mb-6 max-w-md"
        >
          Eco-friendly practices that protect the land and secure the future of food.
        </p>

        {/* Features */}
        <div ref={featuresRef} className="flex flex-wrap gap-3 mb-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-item flex items-center gap-2 px-4 py-2 bg-farm-cream/5 border border-farm-cream/10 rounded-full"
            >
              <feature.icon className="w-4 h-4 text-farm-gold" />
              <span className="text-sm text-farm-cream/80">{feature.label}</span>
            </div>
          ))}
        </div>

        <button
          ref={ctaRef}
          onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-primary group flex items-center gap-3"
        >
          Learn Our Practices
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      {/* Bottom Left Tag */}
      <span
        ref={leftTagRef}
        className="absolute z-[4] font-mono text-xs tracking-[0.2em] text-farm-cream/60 uppercase"
        style={{ left: '7vw', bottom: '7vh', opacity: 0 }}
      >
        Eco-Friendly
      </span>

      {/* Bottom Right Tag */}
      <span
        ref={rightTagRef}
        className="absolute z-[4] font-mono text-xs tracking-[0.2em] text-farm-cream/60 uppercase"
        style={{ right: '7vw', bottom: '7vh', opacity: 0 }}
      >
        Future
      </span>
    </section>
  );
}
