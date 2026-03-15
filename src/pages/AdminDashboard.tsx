import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, Package, MessageSquare, Send, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import type { OrderStatus, ChatMessage, Order } from '../store/useStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'support'>('orders');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch historical orders (Globally for Admin)
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data) {
        const formatted = data.map((ord: any) => ({
          id: ord.id,
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

    // 2. Fetch initial historical messages (Globally for Admin)
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data) {
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

    // 3. Subscribe to ALL real-time WebSockets
    const messagesChannel = supabase
      .channel('admin_global_messages')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERTs and UPDATEs
          schema: 'public',
          table: 'messages',
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
            setMessages((current) => 
              current.map(msg => msg.id === payload.new.id ? { ...msg, isRead: payload.new.is_read } : msg)
            );
          }
        }
      )
      .subscribe();

    // 4. Subscribe to ALL real-time orders globally
    const ordersChannel = supabase
      .channel('admin_global_orders')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERTs and UPDATEs
          schema: 'public',
          table: 'orders',
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
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'support' && selectedRoomId) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

      // Mark unread customer messages as read in this active room
      const markAsRead = async () => {
        const unreadCustomerMsgs = messages.filter(m => m.roomId === selectedRoomId && m.senderRole === 'customer' && !m.isRead);
        if (unreadCustomerMsgs.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('room_id', selectedRoomId)
            .eq('sender_role', 'customer')
            .eq('is_read', false);
        }
      };
      markAsRead();
    }
  }, [messages, activeTab, selectedRoomId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistically update UI
    setOrders(current => current.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Broadcast mutation to DB
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedRoomId) return;

    await supabase.from('messages').insert({
      text: chatInput,
      room_id: selectedRoomId,
      sender_id: user?.id || 'admin-id',
      sender_role: 'admin',
      is_read: false
    });
    
    setChatInput('');
  };

  // Extract unique chat rooms (customers) from global messages
  const chatRooms = Array.from(new Set(messages.map(m => m.roomId)));

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/20'
  };

  return (
    <div className="min-h-screen bg-farm-green text-farm-cream flex">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-farm-cream/10 fixed h-full p-6 flex flex-col z-20">
        <div className="mb-10 flex items-center gap-2">
          <button onClick={() => navigate('/')} className="hover:text-farm-gold transition-colors mr-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-heading font-black text-farm-gold">FarmVerse Admin</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-farm-cream/10 text-farm-cream' : 'text-farm-cream/60 hover:text-farm-cream hover:bg-farm-cream/5'}`}
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">All Orders</span>
          </button>
          <button 
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'support' ? 'bg-farm-cream/10 text-farm-cream' : 'text-farm-cream/60 hover:text-farm-cream hover:bg-farm-cream/5'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Support Hub</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-farm-cream/10 pt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Mediator Admin</p>
              <p className="text-xs text-farm-cream/50">System Control</p>
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
        
        <div className="relative z-10 max-w-5xl mx-auto h-[calc(100vh-80px)]">
          {activeTab === 'orders' && (
            <div className="h-full flex flex-col">
              <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold mb-2">Global Command Center</h1>
                <p className="text-farm-cream/60">Mediate orders between customers and local farmers.</p>
              </div>

              <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="glass-panel border border-farm-cream/10 p-6 flex flex-wrap items-center justify-between gap-6">
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm text-farm-cream/60 mb-1">Order {order.short_id || order.id.substring(0,8)}</p>
                        <h4 className="font-medium">{order.shipping_details?.name || 'Customer'}</h4>
                        <p className="text-sm text-farm-cream/60">{order.items.length} items • ₹{order.total.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${statusColors[order.status]}`}>
                          {order.status.toUpperCase()}
                        </span>
                        
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="bg-black/50 border border-farm-cream/20 text-farm-cream text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-farm-gold"
                        >
                          <option value="pending">Pending Vendor</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                     <div className="text-center p-12 glass-panel border border-farm-cream/10 text-farm-cream/50">
                       No orders in the system yet.
                     </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="h-full flex flex-col glass-panel border border-farm-cream/10 overflow-hidden">
              <div className="p-6 border-b border-farm-cream/10 bg-farm-cream/5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UserCircle className="w-6 h-6 text-farm-gold" />
                  Global Support Chat
                </h2>
                <p className="text-sm text-farm-cream/60">Manage customer queries and support tickets.</p>
              </div>

              <div className="flex-1 overflow-hidden flex">
                {/* Chat Rooms Sidebar */}
                <div className="w-64 border-r border-farm-cream/10 bg-black/20 overflow-y-auto custom-scrollbar">
                  {chatRooms.length === 0 ? (
                    <div className="p-6 text-sm text-farm-cream/40 text-center">No active chats</div>
                  ) : (
                    chatRooms.map(roomId => {
                      const unreadCount = messages.filter(m => m.roomId === roomId && m.senderRole === 'customer' && !m.isRead).length;
                      return (
                        <button
                          key={roomId}
                          onClick={() => setSelectedRoomId(roomId)}
                          className={`w-full text-left p-4 border-b border-farm-cream/5 transition-colors flex items-center justify-between ${selectedRoomId === roomId ? 'bg-farm-cream/10' : 'hover:bg-farm-cream/5'}`}
                        >
                          <div className="truncate">
                            <p className="text-sm font-medium text-farm-gold truncate">Customer</p>
                            <p className="text-xs text-farm-cream/50 font-mono truncate">{roomId.substring(0, 8)}...</p>
                          </div>
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>

                {/* Chat Area */}
                {!selectedRoomId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-farm-cream/40 bg-black/40">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                    <p>Select a customer chat to start messaging.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col bg-black/40 relative">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                      {messages.filter(m => m.roomId === selectedRoomId).map((msg: ChatMessage) => (
                        <div key={msg.id} className={`flex w-full ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`relative px-5 pt-4 pb-9 rounded-2xl text-sm max-w-[85%] min-w-[120px] shadow-sm ${msg.senderRole === 'admin' ? 'bg-farm-gold text-farm-green rounded-tr-sm' : 'glass-panel border border-farm-cream/20 rounded-tl-sm'}`}>
                            {msg.senderRole === 'customer' && <p className="text-xs text-farm-gold mb-1.5 font-bold">Customer</p>}
                            <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <div className="absolute bottom-2 right-3 flex items-center gap-1.5">
                              <span className="text-[10px] opacity-60 font-medium">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.senderRole === 'admin' && (
                                <span className={`text-[12px] leading-none ${msg.isRead ? 'text-blue-600 font-black' : 'opacity-40 font-bold'}`}>
                                  ✓✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-farm-cream/10 bg-farm-cream/5">
                      <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                        <input 
                          type="text" 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type a message to the customer..."
                          className="flex-1 bg-black/50 border border-farm-cream/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-farm-gold transition-colors pr-12"
                        />
                        <button 
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-farm-gold text-farm-green rounded-lg disabled:opacity-50 transition-opacity"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
