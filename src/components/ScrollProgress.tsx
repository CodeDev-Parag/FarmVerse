import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function ScrollProgress() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(progressRef.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={progressRef}
      className="fixed top-0 left-0 h-1 bg-farm-gold z-[100] origin-left pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, #D4A03A, #F3D17A, #D4A03A)',
        transform: 'scaleX(0)',
      }}
    />
  );
}
