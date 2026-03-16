import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import Navigation from '../components/Navigation';

export default function MaintenancePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-farm-green text-farm-cream flex flex-col font-sans">
      <Navigation onNavigate={() => {}} />
      
      <main className="flex-1 flex items-center justify-center relative p-6">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url(/hero_field.jpg)', backgroundSize: 'cover' }} />
        
        <div className="relative z-10 max-w-2xl w-full text-center glass-panel p-16 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-farm-gold/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-[0_0_30px_rgba(255,215,0,0.2)]">
            <Wrench className="w-12 h-12 text-farm-gold" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-heading font-black mb-6">
            {t('maintenance.title', 'Under Maintenance')}
          </h1>
          
          <p className="text-xl text-farm-cream/80 mb-8 max-w-lg mx-auto leading-relaxed">
            {t('maintenance.description', 'We are currently performing scheduled maintenance to improve the FarmVerse platform. We will be back shortly cultivating fresh updates for you.')}
          </p>

          <div className="inline-flex flex-col items-center">
            <div className="w-16 h-1 bg-farm-gold rounded-full mb-6"></div>
            <p className="text-sm font-medium text-farm-cream/50 tracking-widest uppercase">
              {t('maintenance.status', 'System Offline')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
