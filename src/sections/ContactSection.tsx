import { useRef, useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Mail, Phone, MapPin, Send, Loader2, Check, Instagram, Twitter, Linkedin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ContactSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
    { icon: Mail, label: t('contact.details.email'), value: 'hello@farmverse.io' },
    { icon: Phone, label: t('contact.details.phone'), value: '+91 98765 43210' },
    { icon: MapPin, label: t('contact.details.location'), value: 'Pune, Maharashtra, India' },
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
              {t('contact.titlePart1')} <span className="text-gradient-gold">{t('contact.titlePart2')}</span>
            </h2>
            <p className="text-farm-cream/70 mb-8">
              {t('contact.subtitle')}
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
            <div className="p-5 bg-farm-gold/10 border border-farm-gold/20 rounded-xl max-w-sm">
              <h3 className="text-base font-semibold text-farm-cream mb-1">
                {t('contact.farmerCta.title')}
              </h3>
              <p className="text-sm text-farm-cream/70 mb-3">
                {t('contact.farmerCta.desc')}
              </p>
              <button
                onClick={() => navigate('/auth?type=signup&role=farmer')}
                className="text-farm-gold text-sm font-medium hover:underline"
              >
                {t('contact.farmerCta.link')}
              </button>
            </div>
          </div>

          {/* Right Panel - Contact Form */}
          <div ref={rightPanelRef} className="glass-panel p-8 md:p-10">
            <h3 className="text-2xl font-heading font-bold text-farm-cream mb-6">
              {t('contact.form.title')}
            </h3>

            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-xl font-semibold text-farm-cream mb-2">
                  {t('contact.form.successTitle')}
                </h4>
                <p className="text-farm-cream/60">
                  {t('contact.form.successDesc')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-farm-cream/80 mb-2">
                    {t('contact.form.name')}
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
                    {t('contact.form.email')}
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
                    {t('contact.form.message')}
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
                      {t('contact.form.submitting')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t('contact.form.submit')}
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
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="#" className="text-sm text-farm-cream/60 hover:text-farm-cream transition-colors">
                {t('contact.footer.privacy')}
              </a>
              <a href="#" className="text-sm text-farm-cream/60 hover:text-farm-cream transition-colors">
                {t('contact.footer.terms')}
              </a>
              <a href="https://enam.gov.in/web/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-farm-gold hover:text-farm-cream transition-colors">
                {t('contact.footer.enam')}
              </a>
              <a href="#" className="text-sm text-farm-cream/60 hover:text-farm-cream transition-colors">
                {t('contact.footer.careers')}
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

          <div className="mt-8 pt-6 border-t border-farm-cream/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-center text-farm-cream/40 text-sm">
              {t('contact.footer.copyright')}
            </p>
            <p className="text-center text-farm-cream/60 text-sm font-medium" dangerouslySetInnerHTML={{ __html: t('contact.footer.madeWith').replace('❤️', '<span className="text-red-500 animate-pulse inline-block">❤️</span>').replace('Parag', '<span className="text-farm-gold font-bold">Parag</span>') }}>
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}
