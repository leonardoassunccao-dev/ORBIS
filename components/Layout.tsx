
import React from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, Settings, Wallet, Landmark, FileInput } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'income' | 'expense' | 'import' | 'patrimony' | 'settings';
  onTabChange: (tab: 'dashboard' | 'income' | 'expense' | 'import' | 'patrimony' | 'settings') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'income', label: 'Ganhos', icon: TrendingUp },
    { id: 'expense', label: 'Gastos', icon: TrendingDown },
    { id: 'import', label: 'Importar', icon: FileInput },
    { id: 'patrimony', label: 'Patrimônio', icon: Landmark },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-orbis-bg text-orbis-text transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-white/5 bg-white dark:bg-orbis-surface sticky top-0 h-screen z-20">
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

      {/* Main Content */}
      <main 
        className="flex-1 w-full pb-32 md:pb-8 overflow-y-auto no-scrollbar relative"
      >
        <div className="max-w-5xl mx-auto p-4 md:p-8 safe-area-top">
            {children}
            
            {/* Signature Footer */}
            <div 
                className="mt-16 mb-6 text-center opacity-0 animate-fade-in select-none pointer-events-none"
                style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}
            >
                <p className="text-xs font-semibold tracking-widest text-orbis-textMuted/65 uppercase mb-1">Orbis</p>
                <p className="text-xs text-orbis-textMuted/65">desenvolvido por Leonardo Assunção</p>
            </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-orbis-surface/90 backdrop-blur-lg border-t border-gray-200 dark:border-white/5 z-50 safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center px-4 py-2">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                // For mobile, skip 'settings' or condense if too many? 
                // Currently 6 items fits tight on small screens, let's keep it but monitor overflow
                // We might want to use scrollable container or hide label for small screens if needed.
                // For now, flex-between usually handles 6 items okay on modern phones (360px+)
                return (
                <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95 min-w-[50px] ${
                    isActive ? 'text-orbis-accent dark:text-orbis-primary' : 'text-gray-400 dark:text-orbis-textMuted'
                    }`}
                >
                    <div className={`
                        relative p-1 rounded-full transition-all duration-300
                        ${isActive ? 'bg-orbis-accent/10 dark:bg-orbis-primary/10' : 'bg-transparent'}
                    `}>
                        <Icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
                    </div>
                    <span className={`text-[9px] font-medium tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                        {item.label}
                    </span>
                </button>
                )
            })}
        </div>
      </div>
    </div>
  );
};
