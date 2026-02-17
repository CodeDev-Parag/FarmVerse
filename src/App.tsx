import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './App.css';

// Components
import LoadingScreen from './components/LoadingScreen';
import ScrollProgress from './components/ScrollProgress';
import Navigation from './components/Navigation';
import HeroSection from './sections/HeroSection';
import FreshSection from './sections/FreshSection';
import SmartSection from './sections/SmartSection';
import SustainableSection from './sections/SustainableSection';
import MovementSection from './sections/MovementSection';
import MarketplaceSection from './sections/MarketplaceSection';
import StoriesSection from './sections/StoriesSection';
import ContactSection from './sections/ContactSection';
import CartDrawer from './components/CartDrawer';
import FarmerModal from './components/FarmerModal';
import { useStore } from './store/useStore';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Cart Context
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}



function App() {
  // Use selectors to prevent unnecessary re-renders of the root component
  const isLoading = useStore((state) => state.isLoading);
  const setIsLoading = useStore((state) => state.setIsLoading);

  const mainRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    // Prevent multiple initializations in StrictMode
    if (lenisRef.current) return;

    console.log('App: Initializing Lenis');
    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    // Safety timeout: If loading takes too long, force it to complete
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('App: Loading timed out, forcing completion');
        setIsLoading(false);
      }
    }, 6000);

    return () => {
      console.log('App: Cleaning up Lenis');
      clearTimeout(safetyTimeout);
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []); // Remove isLoading dependency to prevent re-init

  // Handle loading complete
  const handleLoadingComplete = () => {
    console.log('App: Loading complete');
    setIsLoading(false);
  };



  return (
    <>
      {/* Loading Screen */}
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      {/* Scroll Progress */}
      <ScrollProgress />

      {/* Navigation */}
      <Navigation
        onNavigate={(href) => {
          if (lenisRef.current) {
            lenisRef.current.scrollTo(href);
          } else {
            const element = document.querySelector(href);
            element?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Main Content */}
      <main
        ref={mainRef}
        className={`relative transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        <HeroSection
          onExploreClick={() => {
            if (lenisRef.current) {
              lenisRef.current.scrollTo('#marketplace');
            } else {
              const marketplace = document.getElementById('marketplace');
              marketplace?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
        <FreshSection />
        <SmartSection />
        <SustainableSection />
        <MovementSection
          onMeetFarmersClick={() => {
            if (lenisRef.current) {
              lenisRef.current.scrollTo('#stories');
            } else {
              const stories = document.getElementById('stories');
              stories?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
        <MarketplaceSection />
        <StoriesSection />
        <ContactSection />
      </main>

      {/* Cart Drawer - Now managed by its own connection to store or we pass basic props if it's not refactored yet.
          For now, we will refactor CartDrawer to use store internally, so we don't need to pass props.
          But wait, the task list says "Update MarketplaceSection and CartDrawer to use Zustand".
          So I should remove props here.
       */}
      <CartDrawer />

      {/* Farmer Registration Modal */}
      <FarmerModal />

      {/* Grain Overlay */}
      <div className="grain-overlay" />
    </>
  );
}

export default App;
