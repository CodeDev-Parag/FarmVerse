import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    quote: "FarmVerse helped us reach customers in Pune and Mumbai directly. Our farm income has increased significantly since joining.",
    name: "Ramesh P.",
    location: "Maharashtra, India",
    image: "/farmer_portrait_01.jpg",
    role: "Vegetable Farmer",
  },
  {
    id: 2,
    quote: "We're growing organic apples in Himachal and selling out every week. The direct connection to customers is game-changing.",
    name: "Sita D.",
    location: "Himachal Pradesh, India",
    image: "/farmer_portrait_02.jpg",
    role: "Apple Grower",
  },
  {
    id: 3,
    quote: "No more middlemen taking half our profits. We set our prices for our Coorg coffee and build real relationships.",
    name: "Rajesh K.",
    location: "Karnataka, India",
    image: "/farmer_portrait_01.jpg",
    role: "Coffee Planter",
  },
];

export default function StoriesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-slide
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        headingRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Cards animation
      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll('.testimonial-card');
        gsap.fromTo(
          cards,
          { x: '-8vw', opacity: 0 },
          {
            x: 0,
            opacity: 1,
            stagger: 0.15,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section
      ref={sectionRef}
      id="stories"
      className="relative z-70 py-24 md:py-32"
      style={{ background: '#0B3A2E' }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Heading */}
        <div ref={headingRef} className="mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-farm-cream mb-4">
            Farmer <span className="text-gradient-gold">Stories.</span>
          </h2>
          <p className="text-lg text-farm-cream/70 max-w-xl">
            Real stories from real farmers whose lives have been transformed by direct trade.
          </p>
        </div>

        {/* Testimonials - Desktop Grid */}
        <div ref={cardsRef} className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="testimonial-card glass-panel p-8"
            >
              <Quote className="w-10 h-10 text-farm-gold/30 mb-4" />

              <p className="text-farm-cream/90 text-lg leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-farm-gold/30"
                />
                <div>
                  <h4 className="font-semibold text-farm-cream">{testimonial.name}</h4>
                  <p className="text-sm text-farm-cream/60">{testimonial.role}, {testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials - Mobile Carousel */}
        <div className="md:hidden relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-2"
                >
                  <div className="glass-panel p-6">
                    <Quote className="w-8 h-8 text-farm-gold/30 mb-4" />

                    <p className="text-farm-cream/90 text-base leading-relaxed mb-6">
                      "{testimonial.quote}"
                    </p>

                    <div className="flex items-center gap-4">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-farm-gold/30"
                      />
                      <div>
                        <h4 className="font-semibold text-farm-cream">{testimonial.name}</h4>
                        <p className="text-sm text-farm-cream/60">{testimonial.role}, {testimonial.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={goToPrev}
              className="p-2 glass-panel text-farm-cream hover:bg-farm-cream/10 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                      ? 'bg-farm-gold w-6'
                      : 'bg-farm-cream/30'
                    }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="p-2 glass-panel text-farm-cream hover:bg-farm-cream/10 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
