
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, Settings, Wallet, Landmark, FileInput, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'income' | 'expense' | 'import' | 'patrimony' | 'settings';
  onTabChange: (tab: 'dashboard' | 'income' | 'expense' | 'import' | 'patrimony' | 'settings') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'income', label: 'Ganhos', icon: TrendingUp },
    { id: 'expense', label: 'Gastos', icon: TrendingDown },
    { id: 'import', label: 'Importar', icon: FileInput },
    { id: 'patrimony', label: 'Patrimônio', icon: Landmark },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  // Close mobile menu when tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  return (
    <div className="flex min-h-screen bg-orbis-bg text-orbis-text transition-colors duration-300 overflow-hidden">
      {/* Background Gradient for Dark Themes */}
      <div className="fixed inset-0 bg-orbis-bg -z-10 dark:bg-radial-gradient-dark" />

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-orbis-border bg-orbis-surface sticky top-0 h-screen z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orbis-primary flex items-center justify-center">
            <Wallet className="w-5 h-5 text-orbis-bg" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-orbis-bg dark:text-white">ORBIS</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                    ? 'bg-orbis-primary/10 text-orbis-accent dark:text-orbis-primary' 
                    : 'text-gray-500 dark:text-orbis-textMuted hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-6 text-xs text-center text-orbis-textMuted">
            <p>100% Offline & Secure</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-orbis-surface/80 backdrop-blur-md border-b border-gray-200 dark:border-orbis-border z-30 flex items-center justify-between px-4 safe-area-top">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-orbis-primary flex items-center justify-center">
            <Wallet className="w-4 h-4 text-orbis-bg" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-orbis-bg dark:text-white">ORBIS</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="md:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-orbis-surface z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between safe-area-top">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orbis-primary flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-orbis-bg" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-orbis-bg dark:text-white">ORBIS</h1>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-gray-500 dark:text-gray-400 active:scale-95 transition-transform"
              >
                <X size={24} />
              </button>
            </div>
            
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium active:scale-95 ${
                      isActive 
                        ? 'bg-orbis-primary/10 text-orbis-accent dark:text-orbis-primary' 
                        : 'text-gray-600 dark:text-orbis-textMuted'
                    }`}
                  >
                    <Icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                    {item.label}
                  </button>
                )
              })}
            </nav>
            
            <div className="p-6 text-xs text-center text-orbis-textMuted safe-area-bottom">
                <p>100% Offline & Secure</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content with Scale Effect */}
      <motion.main 
        animate={{ 
          scale: isMobileMenuOpen ? 0.96 : 1,
          opacity: isMobileMenuOpen ? 0.6 : 1,
          borderRadius: isMobileMenuOpen ? '24px' : '0px'
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex-1 w-full h-screen overflow-y-auto no-scrollbar relative pt-16 md:pt-0 origin-center"
      >
        <div className="max-w-5xl mx-auto p-4 md:p-8 safe-area-top">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
            
            {/* Signature Footer */}
            <div 
                className="mt-16 mb-6 text-center opacity-0 animate-fade-in select-none pointer-events-none"
                style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}
            >
                <p className="text-xs font-semibold tracking-widest text-orbis-textMuted/65 uppercase mb-1">Orbis</p>
                <p className="text-xs text-orbis-textMuted/65">desenvolvido por Leonardo Assunção</p>
            </div>
        </div>
      </motion.main>
    </div>
  );
};
