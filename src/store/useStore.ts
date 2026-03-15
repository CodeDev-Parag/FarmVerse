import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    unit: string;
    rating: number;
    reviews: number;
    isFresh?: boolean;
    freeDelivery?: boolean;
    farmer_id?: string;
}

const initialProducts: Product[] = [
  { id: '1', name: 'Organic Heirloom Tomatoes', price: 120, unit: 'kg', image: '/fresh_tomatoes.png', category: 'Vegetables', rating: 4.7, reviews: 180, isFresh: true },
  { id: '2', name: 'Farm Fresh Sweet Corn', price: 60, unit: 'dozen', image: '/golden_corn.png', category: 'Vegetables', rating: 4.5, reviews: 95, isFresh: true },
  { id: '3', name: 'Crisp Green Lettuce', price: 45, unit: 'head', image: '/crisp_lettuce.png', category: 'Leafy Greens', rating: 4.6, reviews: 110, isFresh: true },
  { id: '4', name: 'Mixed Berries', price: 250, image: '/marketplace_fruit.jpg', category: 'Fruits', unit: 'pack', rating: 4.7, reviews: 156, isFresh: true },
  { id: '5', name: 'Broccoli', price: 60, image: '/marketplace_veg.jpg', category: 'Vegetables', unit: 'head', rating: 4.5, reviews: 78, isFresh: true },
  { id: '6', name: 'Fresh Milk', price: 70, image: '/marketplace_dairy.jpg', category: 'Dairy', unit: 'L', rating: 4.9, reviews: 342, freeDelivery: true },
];

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

// The Order interface is now mapped directly from the Supabase DB
export interface Order {
    id: string; // The UUID from Supabase
    short_id: string; // The FV-###### string
    customer_id: string;
    total: number;
    status: OrderStatus;
    items: CartItem[];
    shipping_details: any;
    created_at: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    roomId: string;
    senderId: string;
    senderRole: 'customer' | 'admin';
    isRead: boolean;
    timestamp: string;
}

interface StoreState {
    // Auth Slice
    user: User | null;
    setUser: (user: User | null) => void;
    isAuthInitialized: boolean;
    setIsAuthInitialized: (initialized: boolean) => void;
    userRole: 'customer' | 'farmer' | 'admin' | null;
    setUserRole: (role: 'customer' | 'farmer' | 'admin' | null) => void;

    // Cart Slice
    cart: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getCartCount: () => number;

    // UI Slice
    isCartOpen: boolean;
    toggleCart: (isOpen?: boolean) => void;
    isFarmerModalOpen: boolean;
    toggleFarmerModal: (isOpen?: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // Products Slice (Ready for backend)
    products: Product[];
    setProducts: (products: Product[]) => void;
    fetchProducts: () => Promise<void>;

    // Orders Slice is removed - Orders are now fetched directly from Supabase
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
    setUser: (user) => set({ user }),
    isAuthInitialized: false,
    setIsAuthInitialized: (initialized) => set({ isAuthInitialized: initialized }),
    userRole: null,
    setUserRole: (role) => set({ userRole: role }),

    // Cart
    cart: [],
    addToCart: (item) =>
        set((state) => {
            const existing = state.cart.find((i) => i.id === item.id);
            if (existing) {
                return {
                    cart: state.cart.map((i) =>
                        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                    ),
                };
            }
            return { cart: [...state.cart, { ...item, quantity: 1 }] };
        }),
    removeFromCart: (id) =>
        set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),
    updateQuantity: (id, quantity) =>
        set((state) => {
            if (quantity <= 0) {
                return { cart: state.cart.filter((i) => i.id !== id) };
            }
            return {
                cart: state.cart.map((i) => (i.id === id ? { ...i, quantity } : i)),
            };
        }),
    clearCart: () => set({ cart: [] }),
    getCartTotal: () => {
        return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    getCartCount: () => {
        return get().cart.reduce((sum, item) => sum + item.quantity, 0);
    },

    // UI
    isCartOpen: false,
    toggleCart: (isOpen) =>
        set((state) => ({ isCartOpen: isOpen ?? !state.isCartOpen })),
    isFarmerModalOpen: false,
    toggleFarmerModal: (isOpen) =>
        set((state) => ({ isFarmerModalOpen: isOpen ?? !state.isFarmerModalOpen })),
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
    isLoading: true,
    setIsLoading: (loading) => set({ isLoading: loading }),

    // Products
    products: initialProducts,
    setProducts: (products) => set({ products }),
    fetchProducts: async () => {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching products from Supabase:', error);
            return;
        }
        if (data) {
            set({ products: data });
        }
    },

    // Orders slice removed from Zustand initialization
    }),
    {
      name: 'farmverse-storage',
      partialize: (state) => ({ 
        cart: state.cart
      }), // Only persist cart now, products come from DB
    }
  )
);
