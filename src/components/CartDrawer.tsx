import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function CartDrawer() {
  const { isCartOpen, toggleCart, cart, removeFromCart, updateQuantity, getCartTotal } = useStore();
  const isOpen = isCartOpen;
  const onClose = () => toggleCart(false);
  const total = getCartTotal();
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      });

      gsap.to(drawerRef.current, {
        x: 0,
        duration: 0.4,
        ease: 'power3.out',
      });

      gsap.fromTo(
        contentRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, delay: 0.2, ease: 'power2.out' }
      );
    } else {
      document.body.style.overflow = '';

      gsap.to(drawerRef.current, {
        x: '100%',
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

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-full max-w-md z-[160] flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0B3A2E 0%, #0f4a3a 100%)',
          transform: 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-farm-cream/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-farm-gold" />
            <h2 className="text-xl font-heading font-bold text-farm-cream">
              Your Cart
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-farm-cream/60 hover:text-farm-cream transition-colors duration-300"
            aria-label="Close cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-farm-cream/20 mb-4" />
              <p className="text-farm-cream/60 text-lg">Your cart is empty</p>
              <p className="text-farm-cream/40 text-sm mt-2">
                Add some fresh produce to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel p-4 flex gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-farm-cream font-semibold">{item.name}</h3>
                    <p className="text-farm-gold font-mono mt-1">
                      ₹{item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-farm-cream/10 flex items-center justify-center text-farm-cream hover:bg-farm-cream/20 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-farm-cream w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-farm-cream/10 flex items-center justify-center text-farm-cream hover:bg-farm-cream/20 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-farm-cream/40 hover:text-farm-cream/80 transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-farm-cream/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-farm-cream/60">Subtotal</span>
              <span className="text-farm-cream font-mono text-lg">
                ₹{total.toFixed(2)}
              </span>
            </div>
            <button className="w-full btn-primary">
              Proceed to Checkout
            </button>
            <p className="text-center text-farm-cream/40 text-xs">
              Shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}
