import { create } from 'zustand';

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
}

interface StoreState {
    // Cart Slice
    cart: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
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
}

export const useStore = create<StoreState>((set, get) => ({
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
    products: [],
    setProducts: (products) => set({ products }),
}));
