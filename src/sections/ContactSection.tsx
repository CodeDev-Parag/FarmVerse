import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Mail, Phone, MapPin, Send, Loader2, Check, Instagram, Twitter, Linkedin } from 'lucide-react';

import { useStore } from '../store/useStore';

export default function ContactSection() {
  const { toggleFarmerModal } = useStore();
  const sectionRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Left panel
      gsap.fromTo(
        leftPanelRef.current,
        { x: '-10vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: leftPanelRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Right panel
      gsap.fromTo(
        rightPanelRef.current,
        { x: '10vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: rightPanelRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Footer
      gsap.fromTo(
        footerRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', message: '' });

    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const contactInfo = [
    { icon: Mail, label: 'Email', value: 'hello@farmverse.io' },
    { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
    { icon: MapPin, label: 'Location', value: 'Pune, Maharashtra, India' },
  ];

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
  ];

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative z-80 py-24 md:py-32"
      style={{
        background: 'linear-gradient(180deg, #0B3A2E 0%, #6B4F2D 100%)',
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url(/hero_field.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Left Panel - Contact Info */}
          <div ref={leftPanelRef} className="glass-panel p-8 md:p-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-farm-cream mb-4">
              Get in <span className="text-gradient-gold">Touch.</span>
            </h2>
            <p className="text-farm-cream/70 mb-8">
              Have questions? Want to partner? We're here to help. Reach out and let's grow together.
            </p>

            {/* Contact Details */}
            <div className="space-y-4 mb-8">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-farm-gold/20 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-farm-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-farm-cream/50 uppercase tracking-wider">{item.label}</p>
                    <p className="text-farm-cream">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Farmer CTA */}
            <div className="p-6 bg-farm-gold/10 border border-farm-gold/20 rounded-xl">
              <h3 className="text-lg font-semibold text-farm-cream mb-2">
                Are you a farmer?
              </h3>
              <p className="text-sm text-farm-cream/70 mb-4">
                Join our marketplace and sell directly to customers.
              </p>
              <button
                onClick={() => toggleFarmerModal(true)}
                className="text-farm-gold font-medium hover:underline"
              >
                Apply to sell →
              </button>
            </div>
          </div>

          {/* Right Panel - Contact Form */}
          <div ref={rightPanelRef} className="glass-panel p-8 md:p-10">
            <h3 className="text-2xl font-heading font-bold text-farm-cream mb-6">
              Send us a message
            </h3>

            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-xl font-semibold text-farm-cream mb-2">
                  Message Sent!
                </h4>
                <p className="text-farm-cream/60">
                  We'll get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-farm-cream/80 mb-2">
                    Your Name
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
                  <label className="block text-sm text-farm-cream/80 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl text-farm-cream placeholder-farm-cream/30 focus:outline-none focus:border-farm-gold transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-farm-cream/80 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl text-farm-cream placeholder-farm-cream/30 focus:outline-none focus:border-farm-gold transition-colors resize-none"
                    placeholder="How can we help you?"
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer ref={footerRef} className="border-t border-farm-cream/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-heading font-black">
                <span className="text-farm-cream">Farm</span>
                <span className="text-farm-gold">Verse</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-farm-cream/60 hover:text-farm-cream transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-farm-cream/60 hover:text-farm-cream transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-farm-cream/60 hover:text-farm-cream transition-colors">
                Careers
              </a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-farm-cream/5 flex items-center justify-center text-farm-cream/60 hover:text-farm-gold hover:bg-farm-cream/10 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <p className="text-center text-farm-cream/40 text-sm mt-8">
            © 2026 FarmVerse. Empowering farmers worldwide.
          </p>
        </footer>
      </div>
    </section>
  );
}
