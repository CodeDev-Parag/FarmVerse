import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, Package, MessageSquare, Send, UserCircle, Settings, ShieldAlert, Globe, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import type { OrderStatus, ChatMessage, Order } from '../store/useStore';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser, isMaintenanceMode, setIsMaintenanceMode } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'support' | 'management'>('orders');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
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

    // 2.5 Fetch Users
    const fetchUsers = async () => {
      const { data, error } = await supabase.rpc('get_all_users');
      if (data && !error) {
        setUsersList(data);
      } else {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();

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

  const handleToggleMaintenance = async () => {
    const newValue = !isMaintenanceMode;
    // Optimistic UI update
    setIsMaintenanceMode(newValue);
    
    // Broadcast mutation to DB
    const { error } = await supabase
      .from('system_settings')
      .update({ value: newValue })
      .eq('key', 'maintenance_mode');
      
    if (error) {
      console.error('Failed to update maintenance mode:', error);
      // Revert on error
      setIsMaintenanceMode(!newValue);
    }
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
            <span className="font-medium">{t('adminDashboard.tabs.orders')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'support' ? 'bg-farm-cream/10 text-farm-cream' : 'text-farm-cream/60 hover:text-farm-cream hover:bg-farm-cream/5'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">{t('adminDashboard.tabs.support')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('management')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'management' ? 'bg-farm-cream/10 text-farm-cream' : 'text-farm-cream/60 hover:text-farm-cream hover:bg-farm-cream/5'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">{t('adminDashboard.tabs.management')}</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-farm-cream/10 pt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Mediator Admin</p>
              <p className="text-xs text-farm-cream/50">{t('adminDashboard.sidebar.account')}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('adminDashboard.sidebar.signOut')}</span>
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
                <h1 className="text-3xl font-heading font-bold mb-2">{t('adminDashboard.title')}</h1>
                <p className="text-farm-cream/60">{t('adminDashboard.subtitle')}</p>
              </div>

              <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="glass-panel border border-farm-cream/10 p-6 flex flex-wrap items-center justify-between gap-6">
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm text-farm-cream/60 mb-1">{t('customerDashboard.orderNumber')} {order.short_id || order.id.substring(0,8)}</p>
                        <h4 className="font-medium">{order.shipping_details?.name || t('adminDashboard.supportChat.customer')}</h4>
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
                          <option value="pending">{t('customerDashboard.status.pending')}</option>
                          <option value="processing">{t('customerDashboard.status.processing')}</option>
                          <option value="shipped">{t('customerDashboard.status.shipped')}</option>
                          <option value="delivered">{t('customerDashboard.status.delivered')}</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                     <div className="text-center p-12 glass-panel border border-farm-cream/10 text-farm-cream/50">
                       {t('farmerDashboard.ordersList.noOrders')}
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
                  {t('adminDashboard.supportChat.title')}
                </h2>
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
                            <p className="text-sm font-medium text-farm-gold truncate">{t('adminDashboard.supportChat.customer')}</p>
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
                    <p>{t('adminDashboard.supportChat.selectCustomer')}</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col bg-black/40 relative">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                      {messages.filter(m => m.roomId === selectedRoomId).map((msg: ChatMessage) => (
                        <div key={msg.id} className={`flex w-full ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`relative px-5 pt-4 pb-9 rounded-2xl text-sm max-w-[85%] min-w-[120px] shadow-sm ${msg.senderRole === 'admin' ? 'bg-farm-gold text-farm-green rounded-tr-sm' : 'glass-panel border border-farm-cream/20 rounded-tl-sm'}`}>
                            {msg.senderRole === 'customer' && <p className="text-xs text-farm-gold mb-1.5 font-bold">{t('adminDashboard.supportChat.customer')}</p>}
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
                          placeholder="Type your message..."
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

          {activeTab === 'management' && (
            <div className="h-full flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-2">
              <div className="mb-4">
                <h1 className="text-3xl font-heading font-bold mb-2">{t('adminDashboard.management.title', 'Website Management System')}</h1>
                <p className="text-farm-cream/60">{t('adminDashboard.management.subtitle', 'Configure global platform settings and monitor users.')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* System Settings Card */}
                <div className="glass-panel border border-farm-cream/10 flex flex-col">
                  <div className="p-6 border-b border-farm-cream/10 bg-farm-cream/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Globe className="w-6 h-6 text-farm-gold" />
                      {t('adminDashboard.management.globalSettings', 'Global Settings')}
                    </h2>
                  </div>
                  <div className="p-6 space-y-8 flex-1">
                    
                    <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-farm-cream/5 hover:border-farm-cream/20 transition-colors">
                      <div className="flex gap-4 items-start">
                        <div className={`p-3 rounded-full ${isMaintenanceMode ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{t('adminDashboard.management.maintenanceMode', 'Maintenance Mode')}</h3>
                          <p className="text-sm text-farm-cream/60 mt-1 max-w-[200px]">
                            {t('adminDashboard.management.maintenanceDesc', 'Prevents non-admins from accessing the website while active.')}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isMaintenanceMode} onChange={handleToggleMaintenance} />
                        <div className="w-14 h-7 bg-farm-cream/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-farm-cream after:border-farm-cream/30 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500 shadow-inner"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-farm-cream/5 hover:border-farm-cream/20 transition-colors opacity-50 cursor-not-allowed">
                      <div className="flex gap-4 items-start">
                        <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                          <Settings className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{t('adminDashboard.management.platformFee', 'Platform Fee')} (%)</h3>
                          <p className="text-sm text-farm-cream/60 mt-1 max-w-[200px]">
                            {t('adminDashboard.management.feeDesc', 'Global commission taken per successful transaction.')}
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-black/50 border border-farm-cream/20 rounded-lg text-farm-cream font-mono">
                        2.5%
                      </div>
                    </div>

                  </div>
                </div>

                {/* User Directory Card */}
                <div className="glass-panel border border-farm-cream/10 flex flex-col">
                  <div className="p-6 border-b border-farm-cream/10 bg-farm-cream/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Users className="w-6 h-6 text-farm-gold" />
                      {t('adminDashboard.management.userDirectory', 'User Directory')}
                    </h2>
                    <span className="text-xs bg-farm-cream/10 px-2 py-1 rounded-md">Live Data</span>
                  </div>
                  <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-black/20 text-farm-cream/60">
                        <tr>
                          <th className="px-6 py-4 font-medium">{t('adminDashboard.management.user', 'User')}</th>
                          <th className="px-6 py-4 font-medium">{t('adminDashboard.management.role', 'Role')}</th>
                          <th className="px-6 py-4 font-medium">{t('adminDashboard.management.status', 'Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-farm-cream/5">
                        {usersList.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-farm-cream/50">Fetching users...</td>
                            </tr>
                        ) : usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-farm-cream/5 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-farm-cream">{u.email}</p>
                              <p className="text-xs text-farm-cream/40 mt-1">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${u.role === 'farmer' ? 'bg-farm-gold/20 text-farm-gold border-farm-gold/20' : u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                                {u.role ? u.role.toUpperCase() : 'CUSTOMER'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`px-2.5 py-1 rounded-full text-xs font-bold border bg-green-500/20 text-green-400 border-green-500/20`}>
                                ACTIVE
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
