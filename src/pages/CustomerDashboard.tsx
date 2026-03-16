import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, LogOut, ArrowLeft, Clock, CheckCircle2, Truck, MessageSquare, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import type { OrderStatus, ChatMessage, Order, CartItem } from '../store/useStore';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch historical orders
    const fetchOrders = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        // Map DB columns to our UI Order structure
        const formatted = data.map((ord: any) => ({
          id: ord.id, // we might want to display short_id instead
          short_id: ord.short_id,
          customer_id: ord.customer_id,
          total: Number(ord.total),
          status: ord.status,
          items: ord.items,
          shipping_details: ord.shipping_details,
          created_at: ord.created_at
        }));
        setOrders(formatted);
      }
    };
    
    fetchOrders();

    // 2. Fetch initial historical messages
    const fetchMessages = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', user.id)
        .order('created_at', { ascending: true });
      
      if (data) {
        // Map DB columns to our UI ChatMessage structure
        const formatted = data.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          roomId: msg.room_id,
          senderId: msg.sender_id,
          senderRole: msg.sender_role,
          isRead: msg.is_read,
          timestamp: msg.created_at
        }));
        setMessages(formatted);
      }
    };
    
    fetchMessages();

    // 2. Subscribe to real-time WebSockets for this specific customer's room
    const channel = supabase
      .channel(`public:messages:room_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERTs and UPDATEs (for read receipts)
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new;
            setMessages((current) => [...current, {
              id: newMsg.id,
              text: newMsg.text,
              roomId: newMsg.room_id,
              senderId: newMsg.sender_id,
              senderRole: newMsg.sender_role,
              isRead: newMsg.is_read,
              timestamp: newMsg.created_at
            }]);
          } else if (payload.eventType === 'UPDATE') {
            // Handle read receipt updates
            setMessages((current) => 
              current.map(msg => msg.id === payload.new.id ? { ...msg, isRead: payload.new.is_read } : msg)
            );
          }
        }
      )
      .subscribe();

    // 4. Subscribe to Real-time Orders for this customer
    const ordersChannel = supabase
      .channel(`public:orders:customer_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERTs (new orders) and UPDATEs (status changes)
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const ord = payload.new;
            setOrders((current) => [{
              id: ord.id,
              short_id: ord.short_id,
              customer_id: ord.customer_id,
              total: Number(ord.total),
              status: ord.status,
              items: ord.items,
              shipping_details: ord.shipping_details,
              created_at: ord.created_at
            }, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((current) => 
              current.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status } : o)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ordersChannel);
    };
  }, [user]);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      // Mark any unread admin messages as read when chat is open
      const markAsRead = async () => {
        if (!user) return;
        const unreadAdminMsgs = messages.filter(m => m.senderRole === 'admin' && !m.isRead);
        if (unreadAdminMsgs.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('room_id', user.id)
            .eq('sender_role', 'admin')
            .eq('is_read', false);
        }
      };
      markAsRead();
    }
  }, [messages, isChatOpen, user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;

    // Insert to DB, WebSocket will handle updating the UI array
    await supabase.from('messages').insert({
      text: chatInput,
      room_id: user.id, // Explicitly declare this customer's room
      sender_id: user.id,
      sender_role: 'customer',
      is_read: false
    });
    
    setChatInput('');
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch(status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing': return <Package className="w-5 h-5 text-blue-400" />;
      case 'shipped': return <Truck className="w-5 h-5 text-purple-400" />;
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

  const getStatusIndex = (status: OrderStatus) => statuses.indexOf(status);

  return (
    <div className="min-h-screen bg-farm-green text-farm-cream flex">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-farm-cream/10 fixed h-full p-6 flex flex-col z-20">
        <div className="mb-10 flex items-center gap-2">
          <button onClick={() => navigate('/')} className="hover:text-farm-gold transition-colors mr-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-heading font-bold text-farm-gold">FarmVerse</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-farm-cream/10 text-farm-cream rounded-xl transition-colors">
            <Package className="w-5 h-5" />
            <span className="font-medium">My Orders</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-farm-cream/10 pt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-farm-gold/20 flex items-center justify-center text-farm-gold font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-farm-cream/50">Customer Account</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10 relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url(/hero_field.jpg)', backgroundSize: 'cover' }} />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">My Orders</h1>
              <p className="text-farm-cream/60">Track your fresh farm produce deliveries.</p>
            </div>
          </div>

          {/* Live Mandi Ticker */}
          <div className="mb-10 w-full overflow-hidden glass-panel border border-farm-gold/30 rounded-xl relative py-3 bg-black/40">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-farm-green to-transparent z-10 flex items-center pl-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-bold text-farm-gold tracking-wider">LIVE</span>
              </div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-farm-green to-transparent z-10"></div>
            
            <div className="flex items-center animate-[marquee_20s_linear_infinite] whitespace-nowrap pl-24">
              <div className="flex items-center gap-8 px-4 text-sm font-medium">
                <span className="text-farm-cream">Wheat (Lok-1): <span className="text-green-400">₹2,850/qtl ▲ (+12)</span></span>
                <span className="text-farm-cream/40">•</span>
                <span className="text-farm-cream">Soybean (Yellow): <span className="text-red-400">₹4,200/qtl ▼ (-35)</span></span>
                <span className="text-farm-cream/40">•</span>
                <span className="text-farm-cream">Onion (Red): <span className="text-green-400">₹1,800/qtl ▲ (+50)</span></span>
                <span className="text-farm-cream/40">•</span>
                <span className="text-farm-cream">Cotton (BT): <span className="text-green-400">₹7,100/qtl ▲ (+110)</span></span>
                <span className="text-farm-cream/40">•</span>
                <span className="text-farm-cream">Maize: <span className="text-red-400">₹2,150/qtl ▼ (-5)</span></span>
                <span className="text-farm-cream/40">•</span>
                {/* Duplicate for seamless infinite loop */}
                <span className="text-farm-cream">Wheat (Lok-1): <span className="text-green-400">₹2,850/qtl ▲ (+12)</span></span>
                <span className="text-farm-cream/40">•</span>
                <span className="text-farm-cream">Soybean (Yellow): <span className="text-red-400">₹4,200/qtl ▼ (-35)</span></span>
                <span className="text-farm-cream/40">•</span>
                <span className="text-farm-cream">Onion (Red): <span className="text-green-400">₹1,800/qtl ▲ (+50)</span></span>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="glass-panel p-16 text-center border border-farm-cream/10">
              <Package className="w-16 h-16 text-farm-cream/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No orders yet</h3>
              <p className="text-farm-cream/60 mb-6">You haven't placed any orders with local farmers yet.</p>
              <button onClick={() => navigate('/')} className="btn-primary">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <div key={order.id} className="glass-panel border border-farm-cream/10 overflow-hidden">
                  <div className="p-6 border-b border-farm-cream/10 flex flex-wrap items-center justify-between gap-4 bg-farm-cream/5">
                    <div>
                      <p className="text-sm text-farm-cream/60 mb-1">Order Number</p>
                      <p className="font-mono font-medium">{order.short_id || order.id.substring(0,8)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-farm-cream/60 mb-1">Date</p>
                      <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-farm-cream/60 mb-1">Total</p>
                      <p className="font-mono font-bold text-farm-gold">₹{order.total.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full border border-farm-cream/10">
                      {getStatusIcon(order.status)}
                      <span className="font-medium text-sm">{getStatusText(order.status)}</span>
                    </div>
                  </div>
                  
                  {/* Tracking Timeline */}
                  <div className="px-8 py-6 border-b border-farm-cream/10 bg-black/20">
                    <div className="relative">
                      {/* Timeline Line Base */}
                      <div className="absolute top-4 left-4 right-4 h-1 bg-farm-cream/10 rounded-full"></div>
                      {/* Timeline Active Progress */}
                      <div 
                        className="absolute top-4 left-4 h-1 bg-farm-gold rounded-full transition-all duration-1000 ease-in-out"
                        style={{ width: `calc(${(getStatusIndex(order.status) / (statuses.length - 1)) * 100}% - 32px)` }}
                      ></div>
                      
                      <div className="flex justify-between relative z-10">
                        {statuses.map((step, idx) => {
                          const isActive = getStatusIndex(order.status) >= idx;
                          return (
                            <div key={step} className="flex flex-col items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 delay-${idx * 100} ${isActive ? 'bg-farm-gold text-farm-green shadow-[0_0_15px_rgba(255,215,0,0.5)] scale-110' : 'bg-farm-cream/10 text-farm-cream/40 scale-100'}`}>
                                {idx === 0 && <Clock className="w-4 h-4" />}
                                {idx === 1 && <Package className="w-4 h-4" />}
                                {idx === 2 && <Truck className="w-4 h-4" />}
                                {idx === 3 && <CheckCircle2 className="w-4 h-4" />}
                              </div>
                              <span className={`text-xs font-medium transition-colors duration-500 ${isActive ? 'text-farm-gold' : 'text-farm-cream/40'}`}>
                                {getStatusText(step)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {order.items.map((item: CartItem) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg bg-farm-cream/10" />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-farm-cream/60 text-sm">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-mono text-farm-cream/80">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Support Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-farm-gold text-farm-green rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform relative group"
          >
            <MessageSquare className="w-6 h-6" />
            
            {/* Ping Indicator */}
            {messages.length > 0 && messages[messages.length - 1].senderRole === 'admin' && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-farm-green rounded-full animate-pulse"></span>
            )}
            
            {/* Tooltip */}
            <span className="absolute -top-10 right-0 bg-black/80 text-farm-cream text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
              Need Help? Chat with us
            </span>
          </button>
        ) : (
          <div className="w-80 h-96 glass-panel border border-farm-cream/20 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <div className="p-4 bg-farm-cream/10 flex items-center justify-between border-b border-farm-cream/10">
              <div className="flex items-center gap-2 text-farm-gold">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="font-bold">FarmVerse Support</h3>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-farm-cream/60 hover:text-farm-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 bg-black/40">
              {messages.length === 0 ? (
                <div className="text-center text-farm-cream/50 mt-10 text-sm">
                  <p>Welcome to Support!</p>
                  <p className="mt-1">How can we help with your order?</p>
                </div>
              ) : (
                messages.map((msg: ChatMessage) => (
                  <div key={msg.id} className={`flex w-full ${msg.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative px-4 pt-3 pb-8 rounded-2xl text-sm max-w-[85%] min-w-[100px] shadow-sm ${
                      msg.senderRole === 'customer' 
                        ? 'bg-farm-gold text-farm-green rounded-br-sm' 
                        : 'bg-farm-cream/10 text-farm-cream rounded-bl-sm border border-farm-cream/10'
                    }`}>
                      <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <div className="absolute bottom-1.5 right-3 flex items-center gap-1.5">
                        <span className="text-[10px] opacity-60 font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {/* Double Tick for read receipts */}
                        {msg.senderRole === 'customer' && (
                          <span className={`text-[12px] leading-none ${msg.isRead ? 'text-blue-600 font-black' : 'opacity-40 font-bold'}`}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-farm-cream/5 border-t border-farm-cream/10 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-black/50 border border-farm-cream/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-farm-gold transition-colors"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 bg-farm-gold text-farm-green rounded-lg disabled:opacity-50 transition-opacity flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
