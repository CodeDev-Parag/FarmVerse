import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, User, CheckCircle2, ChevronRight, Truck, Banknote, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart, user } = useStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = getCartTotal();
  const shipping = total > 500 ? 0 : 50; // free shipping over 500
  const finalTotal = total + shipping;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call for order placement
    setTimeout(async () => {
      // Create the new order record in Supabase
      const shortId = `FV-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      
      const { error } = await supabase.from('orders').insert({
        short_id: shortId,
        customer_id: user?.id || null,
        total: finalTotal,
        status: 'pending',
        items: cart,
        shipping_details: formData,
      });

      if (error) {
        console.error("Error creating order:", error);
        alert("There was an error placing your order. Please try again.");
        setLoading(false);
        return;
      }
      
      setLoading(false);
      setSuccess(true);
      clearCart();
    }, 1500);
  };

  if (cart.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-farm-green text-farm-cream flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-heading font-bold mb-4">Your Cart is Empty</h2>
        <button onClick={() => navigate('/')} className="btn-primary">Return to Shop</button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-farm-green text-farm-cream flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url(/hero_field.jpg)', backgroundSize: 'cover' }} />
        <div className="z-10 bg-farm-cream/10 p-10 rounded-3xl backdrop-blur-md border border-farm-cream/20 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-farm-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-farm-gold" />
          </div>
          <h2 className="text-3xl font-heading font-bold mb-2">Order Placed!</h2>
          <p className="text-farm-cream/70 mb-8">Thank you for supporting local farmers. Your fresh produce is on its way!</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-farm-green text-farm-cream flex flex-col relative">
      {/* Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none fixed" style={{ backgroundImage: 'url(/hero_field.jpg)', backgroundSize: 'cover', backgroundAttachment: 'fixed' }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel py-4 px-6 md:px-12 flex items-center border-b border-farm-cream/10">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-farm-cream/80 hover:text-farm-gold transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:inline">Back to Shop</span>
        </button>
        <div className="mx-auto flex items-center gap-2">
          <span className="text-farm-gold font-medium">Checkout</span>
          <ChevronRight className="w-4 h-4 text-farm-cream/40" />
          <span className="text-farm-cream/40">Payment</span>
        </div>
        <div className="w-24"></div> {/* Spacer for centering */}
      </header>

      <div className="pt-24 pb-12 px-6 md:px-12 max-w-7xl mx-auto w-full flex-1 z-10">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column: Form */}
          <div className="flex-1 space-y-10">
            
            {/* Shipping Details */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-farm-cream/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-farm-gold" />
                </div>
                <h2 className="text-2xl font-heading font-bold">Shipping Details</h2>
              </div>
              
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="glass-panel p-6 sm:p-8 space-y-5 border border-farm-cream/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-farm-cream/70 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-farm-cream/40" />
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl focus:outline-none focus:border-farm-gold transition-colors" placeholder="John Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-farm-cream/70 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-farm-cream/40" />
                      <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl focus:outline-none focus:border-farm-gold transition-colors" placeholder="+91 98765 43210" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-farm-cream/70 mb-2">Street Address</label>
                  <input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl focus:outline-none focus:border-farm-gold transition-colors" placeholder="123 Farm Lane, Village Road" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-farm-cream/70 mb-2">City</label>
                    <input type="text" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl focus:outline-none focus:border-farm-gold transition-colors" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-sm text-farm-cream/70 mb-2">PIN Code</label>
                    <input type="text" required value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})} className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl focus:outline-none focus:border-farm-gold transition-colors" placeholder="400001" />
                  </div>
                </div>
              </form>
            </section>

            {/* Payment Method */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-farm-cream/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-farm-gold" />
                </div>
                <h2 className="text-2xl font-heading font-bold">Payment Method</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-colors ${paymentMethod === 'cod' ? 'border-farm-gold bg-farm-gold/10' : 'border-farm-cream/10 bg-farm-cream/5 hover:border-farm-cream/30'}`}
                >
                  <Banknote className={`w-8 h-8 ${paymentMethod === 'cod' ? 'text-farm-gold' : 'text-farm-cream/50'}`} />
                  <span className="font-medium">Cash on Delivery</span>
                </button>

                <button
                  type="button"
                  disabled
                  className="p-6 rounded-2xl border-2 border-farm-cream/5 bg-farm-cream/5 opacity-50 cursor-not-allowed flex flex-col items-center gap-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-farm-cream/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">Coming Soon</div>
                  <svg className="w-8 h-8 text-farm-cream/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 10h16v10H4zM4 6h16v4H4zM8 12h8" />
                  </svg>
                  <span className="font-medium text-farm-cream/60">UPI / Card</span>
                </button>
              </div>
            </section>

          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-[400px]">
            <div className="glass-panel p-6 sticky top-28 border border-farm-cream/10">
              <h3 className="text-xl font-heading font-bold border-b border-farm-cream/10 pb-4 mb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg bg-farm-cream/10" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-farm-cream/60 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-farm-cream/10 mb-6">
                <div className="flex items-center justify-between text-farm-cream/80 text-sm">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-farm-cream/80 text-sm">
                  <span className="flex items-center gap-1">Shipping <Truck className="w-4 h-4" /></span>
                  <span className="font-mono">{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-farm-gold/30 mb-8">
                <span className="font-bold text-lg">Total</span>
                <span className="font-mono font-bold text-2xl text-farm-gold">₹{finalTotal.toFixed(2)}</span>
              </div>

              <button 
                form="checkout-form"
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(212,160,58,0.3)]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : `Place Order (₹${finalTotal.toFixed(2)})`}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
