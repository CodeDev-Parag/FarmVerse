import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, Check, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function FarmerModal() {
  const { isFarmerModalOpen, toggleFarmerModal } = useStore();
  const isOpen = isFarmerModalOpen;
  const onClose = () => toggleFarmerModal(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<SVGRectElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    farmName: '',
    location: '',
    products: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      });

      gsap.fromTo(
        modalRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );

      // Border draw animation
      if (borderRef.current) {
        const length = borderRef.current.getTotalLength();
        gsap.fromTo(
          borderRef.current,
          { strokeDasharray: length, strokeDashoffset: length },
          { strokeDashoffset: 0, duration: 1, ease: 'power2.out', delay: 0.2 }
        );
      }

      gsap.fromTo(
        contentRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, delay: 0.3, ease: 'power2.out' }
      );
    } else {
      document.body.style.overflow = '';

      gsap.to(modalRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });

      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset after showing success
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', farmName: '', location: '', products: '' });
      onClose();
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 bg-black/70 backdrop-blur-md z-[150] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed inset-0 flex items-center justify-center z-[160] p-4"
        style={{ opacity: 0 }}
      >
        <div className="relative w-full max-w-lg">
          {/* SVG Border for draw animation */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}
          >
            <rect
              ref={borderRef}
              x="0"
              y="0"
              width="100%"
              height="100%"
              rx="18"
              ry="18"
              fill="none"
              stroke="#D4A03A"
              strokeWidth="2"
            />
          </svg>

          {/* Content */}
          <div
            className="glass-panel p-8 relative"
            style={{ background: 'rgba(11, 58, 46, 0.95)' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-farm-cream/60 hover:text-farm-cream transition-colors duration-300"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            <div ref={contentRef}>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-farm-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-farm-gold" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-farm-cream mb-2">
                    Application Submitted!
                  </h3>
                  <p className="text-farm-cream/60">
                    We&apos;ll review your application and get back to you soon.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-heading font-bold text-farm-cream mb-2">
                    Join Farm<span className="text-farm-gold">Verse</span>
                  </h2>
                  <p className="text-farm-cream/60 mb-6">
                    Sell your produce directly to customers. No middlemen, fair prices.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-farm-cream/80 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl text-farm-cream placeholder-farm-cream/30 focus:outline-none focus:border-farm-gold transition-colors"
                        placeholder="John Smith"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-farm-cream/80 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl text-farm-cream placeholder-farm-cream/30 focus:outline-none focus:border-farm-gold transition-colors"
                        placeholder="john@farm.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-farm-cream/80 mb-1">
                        Farm Name
                      </label>
                      <input
                        type="text"
                        name="farmName"
                        value={formData.farmName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl text-farm-cream placeholder-farm-cream/30 focus:outline-none focus:border-farm-gold transition-colors"
                        placeholder="Green Valley Farm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-farm-cream/80 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl text-farm-cream placeholder-farm-cream/30 focus:outline-none focus:border-farm-gold transition-colors"
                        placeholder="City, Country"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-farm-cream/80 mb-1">
                        Products You Grow
                      </label>
                      <textarea
                        name="products"
                        value={formData.products}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl text-farm-cream placeholder-farm-cream/30 focus:outline-none focus:border-farm-gold transition-colors resize-none"
                        placeholder="Vegetables, fruits, dairy..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Apply Now'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
