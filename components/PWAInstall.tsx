import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

export const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    // Handle Android/Desktop Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user has previously dismissed the banner
      const hasDismissed = localStorage.getItem('orbis_pwa_dismissed');
      if (!isStandaloneMode && !hasDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS instructions if not installed and not dismissed
    if (ios && !isStandaloneMode) {
       const hasDismissed = localStorage.getItem('orbis_pwa_dismissed');
       if (!hasDismissed) setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('orbis_pwa_dismissed', 'true');
  };

  if (isStandalone || !showInstallBanner) return null;

  return (
    <div className="fixed bottom-[80px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-orbis-surface dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 p-4 rounded-2xl shadow-2xl z-40 animate-slide-up">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
          <Smartphone size={18} className="text-orbis-accent" />
          Instalar App
        </h3>
        <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-1">
          <X size={16} />
        </button>
      </div>
      
      {isIOS ? (
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <p>Para instalar o ORBIS no seu iPhone:</p>
          <div className="flex items-center gap-2">
            1. Toque em <Share size={14} className="inline text-blue-500" /> <b>Compartilhar</b>
          </div>
          <div className="flex items-center gap-2">
            2. Selecione <PlusSquare size={14} className="inline" /> <b>Adicionar à Tela de Início</b>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-300">
            <p className="mb-3">Instale para ter a melhor experiência offline e tela cheia.</p>
            <button 
                onClick={handleInstallClick}
                className="w-full py-2 bg-orbis-primary text-orbis-bg font-bold rounded-xl flex items-center justify-center gap-2"
            >
                <Download size={16} />
                Instalar Agora
            </button>
        </div>
      )}
    </div>
  );
};