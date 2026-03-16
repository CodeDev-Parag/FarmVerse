import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, LogOut, ImagePlus, Loader2, ArrowLeft, ClipboardList, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export default function FarmerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser, products, setProducts } = useStore();
  const myProducts = products.filter(p => !p.farmer_id || p.farmer_id === user?.id);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch assigned orders for this farmer
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('assigned_farmer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data) setAssignedOrders(data);
    };
    
    fetchOrders();

    // Setup real-time subscription for assigned orders
    const ordersChannel = supabase
      .channel(`farmer_orders_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `assigned_farmer_id=eq.${user?.id}`
        },
        () => fetchOrders() // Simple refetch on any change
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [user?.id]);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    image: null as File | null,
    imagePreview: '',
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewProduct(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, imagePreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // In a real scenario, we would:
    // 1. Upload newProduct.image to Supabase Storage
    // 2. Get the public URL for the uploaded image
    // 3. Insert a new row in the user's products table with auth.user.id
    
    try {
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        image: newProduct.imagePreview || '/placeholder.png', // Save base64 preview string for MVP instead of true file upload
        category: 'Vegetables', 
        unit: 'kg',
        rating: 0,
        reviews: 0,
        isFresh: true,
        farmer_id: user?.id,
        approval_status: 'pending',
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProducts([data, ...products]);
      }
      
      setNewProduct({ name: '', price: '', stock: '', image: null, imagePreview: '' });
      setIsAdding(false);
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert('Failed to add product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-farm-cream/10 text-farm-cream' : 'text-farm-cream/60 hover:text-farm-cream hover:bg-farm-cream/5'}`}
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">{t('farmerDashboard.sidebar.products', 'My Products')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-farm-cream/10 text-farm-cream' : 'text-farm-cream/60 hover:text-farm-cream hover:bg-farm-cream/5'}`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="font-medium">{t('farmerDashboard.sidebar.orders', 'Assigned Orders')}</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-farm-cream/10 pt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-farm-gold/20 flex items-center justify-center text-farm-gold font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'F'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-farm-cream/50">{t('farmerDashboard.sidebar.account')}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('farmerDashboard.sidebar.signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10 relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url(/hero_field.jpg)', backgroundSize: 'cover' }} />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          {activeTab === 'products' && (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h1 className="text-3xl font-heading font-bold mb-2">{t('farmerDashboard.title')}</h1>
                  <p className="text-farm-cream/60">{t('farmerDashboard.subtitle')}</p>
                </div>
                <button onClick={() => setIsAdding(!isAdding)} className="btn-primary flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  {t('farmerDashboard.productsList.addProduct')}
                </button>
              </div>

              {/* Add Product Form */}
              {isAdding && (
                <div className="glass-panel p-8 mb-10 border border-farm-gold/30 animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-xl font-bold mb-6">{t('farmerDashboard.addProductModal.addTitle')}</h3>
                  <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Image Upload */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-farm-cream/80">{t('farmerDashboard.addProductModal.image')}</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-video rounded-xl border-2 border-dashed border-farm-cream/20 bg-farm-cream/5 hover:bg-farm-cream/10 hover:border-farm-gold/50 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
                      >
                        {newProduct.imagePreview ? (
                          <img src={newProduct.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImagePlus className="w-10 h-10 text-farm-cream/40 mb-3" />
                            <span className="text-sm text-farm-cream/60">Click to upload image</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-farm-cream/80 mb-2">{t('farmerDashboard.addProductModal.name')}</label>
                        <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl focus:outline-none focus:border-farm-gold transition-colors" placeholder="e.g., Organic Tomatoes" />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-farm-cream/80 mb-2">{t('farmerDashboard.addProductModal.price')}</label>
                          <input type="number" min="1" step="0.01" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl focus:outline-none focus:border-farm-gold transition-colors" placeholder="120" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-farm-cream/80 mb-2">{t('farmerDashboard.addProductModal.stock')}</label>
                          <input type="number" min="1" required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full px-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl focus:outline-none focus:border-farm-gold transition-colors" placeholder="50" />
                        </div>
                      </div>
                      
                      <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl border border-farm-cream/20 hover:bg-farm-cream/10 transition-colors">
                          {t('farmerDashboard.addProductModal.cancel')}
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary min-w-[140px] flex items-center justify-center">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('farmerDashboard.addProductModal.save')}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Product List */}
              {myProducts.length === 0 ? (
                <div className="glass-panel p-16 text-center border border-farm-cream/10">
                  <Package className="w-16 h-16 text-farm-cream/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">{t('farmerDashboard.productsList.noProducts')}</h3>
                  <p className="text-farm-cream/60">{t('farmerDashboard.productsList.noProductsDesc')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProducts.map(product => (
                    <div key={product.id} className="glass-panel border border-farm-cream/10 overflow-hidden hover:border-farm-gold/30 transition-colors group">
                      <div className="h-48 overflow-hidden relative">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-mono border border-white/10 text-farm-gold">
                          ₹{product.price.toFixed(2)}/kg
                        </div>
                        {/* Approval Badge */}
                        <div className="absolute top-3 left-3">
                          {(product as any).approval_status === 'pending' && (
                            <span className="bg-yellow-500/90 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded shadow-sm backdrop-blur-md uppercase tracking-wider">Pending Approval</span>
                          )}
                          {(product as any).approval_status === 'approved' && (
                            <span className="bg-green-500/90 text-green-50 text-[10px] font-bold px-2 py-1 rounded shadow-sm backdrop-blur-md uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {(product as any).approval_status === 'rejected' && (
                            <span className="bg-red-500/90 text-red-50 text-[10px] font-bold px-2 py-1 rounded shadow-sm backdrop-blur-md uppercase tracking-wider">Rejected</span>
                          )}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-heading font-bold text-xl text-farm-cream mb-1">{product.name}</h3>
                        <p className="text-farm-cream/60 text-sm flex items-center gap-2">
                           <Package className="w-4 h-4" /> {(product as any).stock || 'Available'} {t('farmerDashboard.productsList.stock')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold mb-2">{t('farmerDashboard.orders.title', 'Assigned Orders')}</h1>
                <p className="text-farm-cream/60">{t('farmerDashboard.orders.subtitle', 'Manage orders assigned to your farm.')}</p>
              </div>

              {assignedOrders.length === 0 ? (
                <div className="glass-panel p-16 text-center border border-farm-cream/10">
                  <ClipboardList className="w-16 h-16 text-farm-cream/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">{t('farmerDashboard.orders.noOrders', 'No Assigned Orders')}</h3>
                  <p className="text-farm-cream/60 text-sm max-w-sm mx-auto">
                    {t('farmerDashboard.orders.noOrdersDesc', 'You have not been assigned any orders yet. Admin will assign orders here.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedOrders.map(order => (
                    <div key={order.id} className="glass-panel border border-farm-cream/10 p-6 flex flex-wrap items-center justify-between gap-6">
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm text-farm-cream/60 mb-1">Order #{order.short_id || order.id.substring(0,8)}</p>
                        <h4 className="font-medium text-lg">{order.shipping_details?.name || 'Customer'}</h4>
                        <div className="text-sm text-farm-cream/60 mt-1 flex flex-col gap-1">
                          <p>{order.shipping_details?.address}, {order.shipping_details?.city}</p>
                          <p>Phone: {order.shipping_details?.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-[200px]">
                         <p className="text-sm font-bold text-farm-cream mb-2">Order Items:</p>
                         <ul className="text-sm text-farm-cream/80 space-y-1">
                           {order.items.map((item: any) => (
                             <li key={item.id} className="flex justify-between">
                               <span>{item.quantity}x {item.name}</span>
                               <span className="font-mono">₹{item.price * item.quantity}</span>
                             </li>
                           ))}
                         </ul>
                      </div>
                      
                      <div className="flex flex-col items-center gap-3 bg-black/30 p-4 rounded-xl border border-farm-cream/5">
                        <span className="text-farm-gold font-bold text-xl font-mono">₹{order.total.toFixed(2)}</span>
                        
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20' :
                          order.status === 'processing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' :
                          order.status === 'shipped' ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' :
                          'bg-green-500/20 text-green-400 border-green-500/20'
                        }`}>
                          {order.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
