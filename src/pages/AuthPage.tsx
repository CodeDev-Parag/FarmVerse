import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Loader2, Wheat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export default function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, setUserRole, setIsAuthInitialized } = useStore();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type');
  const roleParam = searchParams.get('role');
  const from = location.state?.from || '/';
  
  const [isLogin, setIsLogin] = useState(typeParam === 'signup' ? false : true);
  const [isFarmer, setIsFarmer] = useState(user ? true : roleParam === 'farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- ADMIN BYPASS ---
    // Bypasses Supabase auth for admin. Works even if email not confirmed.
    // Login: admin@farmverse.com / Admin@123
    if (isLogin && email === 'admin@farmverse.com' && password === 'Admin@123') {
      const mockAdminUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@farmverse.com',
        user_metadata: { role: 'admin' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any;
      setUser(mockAdminUser);
      setIsAuthInitialized(true);
      setUserRole('admin');
      navigate('/admin-dashboard', { replace: true });
      return;
    }

    try {
      let finalRole: 'farmer' | 'customer' | 'admin' = isFarmer ? 'farmer' : 'customer';

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // On login, we should respect the user's actual stored role, 
        // not merely the UI toggle state (unless they are admin)
        if (data.user) {
          const storedRole = data.user.user_metadata?.role;
          if (storedRole === 'admin' || storedRole === 'farmer' || storedRole === 'customer') {
            finalRole = storedRole;
          } else if (data.user.email === 'admin@farmverse.com') {
            finalRole = 'admin';
          }
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: finalRole
            }
          }
        });
        if (signUpError) throw signUpError;
      }

      // Set user role (App.tsx also does this on auth state change, but doing it here ensures immediate redirect logic works)
      setUserRole(finalRole);

      // Redirect logic:
      if (from !== '/') {
        navigate(from, { replace: true });
      } else {
        if (finalRole === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else if (finalRole === 'farmer') {
          navigate('/farmer-dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSSO = async () => {
    try {
      // Store the intended role in localStorage before redirecting to Google
      localStorage.setItem('pending_oauth_role', isFarmer ? 'farmer' : 'customer');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${from !== '/' ? from : isFarmer ? '/farmer-dashboard' : '/'}`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error connecting to Google');
    }
  };

  return (
    <div className="min-h-screen bg-farm-green text-farm-cream flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url(/hero_field.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 p-2 rounded-full bg-farm-cream/10 hover:bg-farm-cream/20 transition-colors z-10"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md p-8 glass-panel z-10 relative" style={{ background: 'rgba(11, 58, 46, 0.85)' }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-bold mb-2">
            {isLogin ? t('auth.signInTitle') : t('auth.signUpTitle')}
          </h2>
          <p className="text-farm-cream/60">
            {isLogin 
              ? t('auth.signInSubtitle') 
              : t('auth.signUpSubtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Role Toggle for Login & Sign Up */}
        {user ? (
          <div className="mb-6 flex p-1 bg-farm-cream/5 rounded-xl border border-farm-cream/10">
            <button
              type="button"
              className="flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 rounded-lg transition-colors bg-farm-gold text-farm-green"
              onClick={() => setIsFarmer(true)}
            >
              <Wheat className="w-4 h-4" />
              {t('auth.roleFarmer')}
            </button>
          </div>
        ) : (
          <div className="mb-6 flex p-1 bg-farm-cream/5 rounded-xl border border-farm-cream/10">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!isFarmer ? 'bg-farm-cream text-farm-green' : 'text-farm-cream/60 hover:text-farm-cream'}`}
              onClick={() => setIsFarmer(false)}
            >
              {t('auth.roleCustomer')}
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 rounded-lg transition-colors ${isFarmer ? 'bg-farm-gold text-farm-green' : 'text-farm-cream/60 hover:text-farm-cream'}`}
              onClick={() => setIsFarmer(true)}
            >
              <Wheat className="w-4 h-4" />
              {t('auth.roleFarmer')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-farm-cream/80 mb-1">
              {t('auth.email')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-farm-cream/40">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl focus:outline-none focus:border-farm-gold transition-colors placeholder:text-farm-cream/30"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-farm-cream/80 mb-1">
              {t('auth.password')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-farm-cream/40">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-farm-cream/5 border border-farm-cream/20 rounded-xl focus:outline-none focus:border-farm-gold transition-colors placeholder:text-farm-cream/30"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? t('auth.signInBtn') : t('auth.signUpBtn'))}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-farm-cream/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-farm-cream/40" style={{ background: 'rgba(11, 58, 46, 1)' }}>
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSSO}
            type="button"
            className="mt-4 w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-farm-cream/20 bg-farm-cream/5 hover:bg-farm-cream/10 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            {t('auth.googleBtn')}
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-farm-cream/60">
          {isLogin ? `${t('auth.noAccount')} ` : `${t('auth.hasAccount')} `}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-farm-gold hover:underline font-medium"
          >
            {isLogin ? t('auth.signUpLink') : t('auth.signInLink')}
          </button>
        </p>
      </div>
    </div>
  );
}
