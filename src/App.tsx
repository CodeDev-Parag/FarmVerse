import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load route components for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const FarmerDashboard = lazy(() => import('./pages/FarmerDashboard'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));

import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

function App() {
  const { setUser, setIsAuthInitialized, setUserRole, fetchProducts } = useStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then((res: any) => {
      const sessionUser = res.data.session?.user;
      setUser(sessionUser ?? null);
      if (sessionUser) {
        // Intercept role from localStorage (set before Google SSO redirect)
        const pendingRole = localStorage.getItem('pending_oauth_role');
        
        if (pendingRole && (pendingRole === 'farmer' || pendingRole === 'customer')) {
          // Update Supabase user metadata with the role
          supabase.auth.updateUser({ data: { role: pendingRole } });
          setUserRole(pendingRole as 'farmer' | 'customer');
          
          // Clean up localStorage
          localStorage.removeItem('pending_oauth_role');
        } else {
          const role = sessionUser.user_metadata?.role || (sessionUser.email === 'admin@farmverse.com' ? 'admin' : 'customer');
          setUserRole(role);
        }
      }
      setIsAuthInitialized(true);
      fetchProducts();
    });

    // Listen for changes on auth state (log in, log out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const sessionUser = session?.user;
        setUser(sessionUser ?? null);
        if (sessionUser) {
          const pendingRole = localStorage.getItem('pending_oauth_role');
          
          if (pendingRole && (pendingRole === 'farmer' || pendingRole === 'customer')) {
            supabase.auth.updateUser({ data: { role: pendingRole } });
            setUserRole(pendingRole as 'farmer' | 'customer');
            localStorage.removeItem('pending_oauth_role');
          } else {
            const role = sessionUser.user_metadata?.role || (sessionUser.email === 'admin@farmverse.com' ? 'admin' : 'customer');
            setUserRole(role);
          }
        } else {
          setUserRole(null);
        }
        setIsAuthInitialized(true);
        fetchProducts();
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen bg-farm-green flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-farm-gold/30 border-t-farm-gold rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account" element={<CustomerDashboard />} />
          </Route>

          {/* Protected Farmer Routes */}
          <Route element={<ProtectedRoute requiredRole="farmer" />}>
            <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
