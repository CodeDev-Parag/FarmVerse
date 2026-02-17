import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const horizonRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete,
          });
        },
      });

      // Sunrise animation
      tl.fromTo(
        sunRef.current,
        { y: 200, scale: 0.5, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 2, ease: 'power2.out' }
      );

      // Horizon glow
      tl.fromTo(
        horizonRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1.5, ease: 'power2.out' },
        '-=1.5'
      );

      // Text reveal
      tl.fromTo(
        textRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=1'
      );

      // Progress bar fill
      tl.fromTo(
        progressRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.5, ease: 'power2.inOut' },
        '-=0.5'
      );

      // Hold and fade out
      tl.to({}, { duration: 0.5 });
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0B3A2E 0%, #1a4d3e 50%, #0B3A2E 100%)' }}
    >
      {/* Sun */}
      <div
        ref={sunRef}
        className="absolute w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, #F3D17A 0%, #D4A03A 50%, transparent 70%)',
          boxShadow: '0 0 80px rgba(212, 160, 58, 0.6), 0 0 120px rgba(212, 160, 58, 0.3)',
          bottom: '40%',
        }}
      />

      {/* Horizon glow */}
      <div
        ref={horizonRef}
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          background: 'linear-gradient(180deg, rgba(212, 160, 58, 0.3) 0%, transparent 60%)',
        }}
      />

      {/* Field silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-32">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          className="absolute bottom-0 w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L48 110C96 100 192 80 288 75C384 70 480 80 576 85C672 90 768 90 864 85C960 80 1056 70 1152 70C1248 70 1344 80 1392 85L1440 90V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"
            fill="#0B3A2E"
          />
        </svg>
        {/* Wheat stalks */}
        <div className="absolute bottom-0 left-1/4 flex gap-1">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-farm-gold/40 rounded-t-full"
              style={{
                height: `${20 + Math.random() * 30}px`,
                transform: `rotate(${-5 + Math.random() * 10}deg)`,
              }}
            />
          ))}
        </div>
        <div className="absolute bottom-0 right-1/3 flex gap-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-farm-gold/40 rounded-t-full"
              style={{
                height: `${15 + Math.random() * 25}px`,
                transform: `rotate(${-5 + Math.random() * 10}deg)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Logo text */}
      <div ref={textRef} className="relative z-10 text-center">
        <h1 className="text-5xl md:text-7xl font-heading font-black tracking-tight">
          <span className="text-farm-cream">Farm</span>
          <span className="text-gradient-gold">Verse</span>
        </h1>
        <p className="mt-4 text-farm-cream/70 text-sm font-mono tracking-[0.2em] uppercase">
          Empowering Farmers. Connecting the World.
        </p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-1 bg-farm-cream/10 rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-gradient-to-r from-farm-gold to-[#F3D17A] rounded-full origin-left"
        />
      </div>
    </div>
  );
}
