import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Check, ShoppingBag, Star } from 'lucide-react';

import { useStore } from '../store/useStore';

interface Product {
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

const products: Product[] = [
  { id: '1', name: 'Organic Apples', price: 180, image: '/marketplace_fruit.jpg', category: 'Fruits', unit: 'kg', rating: 4.8, reviews: 124, isFresh: true, freeDelivery: true },
  { id: '2', name: 'Fresh Carrots', price: 40, image: '/marketplace_veg.jpg', category: 'Vegetables', unit: 'kg', rating: 4.6, reviews: 89, isFresh: true },
  { id: '3', name: 'Farm Eggs', price: 90, image: '/marketplace_dairy.jpg', category: 'Dairy', unit: 'dozen', rating: 4.9, reviews: 215, freeDelivery: true },
  { id: '4', name: 'Mixed Berries', price: 250, image: '/marketplace_fruit.jpg', category: 'Fruits', unit: 'pack', rating: 4.7, reviews: 156, isFresh: true },
  { id: '5', name: 'Broccoli', price: 60, image: '/marketplace_veg.jpg', category: 'Vegetables', unit: 'head', rating: 4.5, reviews: 78, isFresh: true },
  { id: '6', name: 'Fresh Milk', price: 70, image: '/marketplace_dairy.jpg', category: 'Dairy', unit: 'L', rating: 4.9, reviews: 342, freeDelivery: true },
];

const categories = ['All', 'Fruits', 'Vegetables', 'Dairy'];

export default function MarketplaceSection() {
  const { addToCart, toggleCart, searchQuery } = useStore();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        headingRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Grid items animation
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll('.product-card');
        gsap.fromTo(
          cards,
          { y: 60, rotateX: 10, opacity: 0 },
          {
            y: 0,
            rotateX: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });

    setAddedProducts(prev => new Set(prev).add(product.id));

    setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  return (
    <section
      ref={sectionRef}
      id="marketplace"
      className="relative z-60 py-24 md:py-32"
      style={{
        background: '#0B3A2E',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(212,160,58,0.1) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Heading */}
        <div ref={headingRef} className="mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-farm-cream mb-4">
            Browse the <span className="text-gradient-gold">Marketplace.</span>
          </h2>
          <p className="text-lg text-farm-cream/70 max-w-xl">
            From field to cart—no middlemen, no markup. Fresh produce delivered directly from local farms.
          </p>

          {/* Cart quick access */}
          <button
            onClick={() => toggleCart(true)}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 glass-panel text-farm-cream hover:bg-farm-cream/10 transition-colors duration-300"
          >
            <ShoppingBag className="w-5 h-5 text-farm-gold" />
            <span>View Cart</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === category
                ? 'bg-farm-gold text-farm-green'
                : 'bg-farm-cream/5 text-farm-cream/70 border border-farm-cream/10 hover:bg-farm-cream/10'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card group glass-panel overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-glow flex flex-col"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-farm-green/80 to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 bg-farm-gold/20 backdrop-blur-sm text-farm-gold text-xs font-medium rounded-full">
                  {product.category}
                </span>

                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                  {product.isFresh && (
                    <span className="px-2 py-1 bg-green-500/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded">
                      Fresh
                    </span>
                  )}
                  {product.freeDelivery && (
                    <span className="px-2 py-1 bg-blue-500/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded">
                      Prime Del.
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-semibold text-farm-cream">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 text-farm-gold text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="font-bold">{product.rating}</span>
                    <span className="text-farm-cream/40">({product.reviews})</span>
                  </div>
                </div>

                <p className="text-sm text-farm-cream/50 mb-4">
                  per {product.unit}
                </p>

                <div className="mt-auto flex items-center justify-between gap-4">
                  <span className="text-2xl font-heading font-bold text-farm-gold">
                    ₹{product.price.toFixed(2)}
                  </span>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 transform active:scale-95 ${addedProducts.has(product.id)
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                      : 'bg-gradient-to-r from-farm-gold to-yellow-500 text-farm-green shadow-lg shadow-farm-gold/25 hover:shadow-farm-gold/40 hover:brightness-110'
                      }`}
                  >
                    {addedProducts.has(product.id) ? (
                      <>
                        <Check className="w-4 h-4" />
                        Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
