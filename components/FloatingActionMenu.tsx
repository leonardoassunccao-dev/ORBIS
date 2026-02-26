import React, { useState, useEffect } from 'react';
import { Plus, TrendingDown, TrendingUp, Landmark } from 'lucide-react';

interface FloatingActionMenuProps {
    onAction: (action: 'income' | 'expense' | 'patrimony') => void;
    isVisible: boolean; // Controlled by parent based on scroll/forms
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({ onAction, isVisible }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTouched, setIsTouched] = useState(false);

    // Auto close when visibility changes to false
    useEffect(() => {
        if (!isVisible) setIsOpen(false);
    }, [isVisible]);

    const handleAction = (action: 'income' | 'expense' | 'patrimony') => {
        onAction(action);
        setIsOpen(false);
    };

    const menuItems = [
        { id: 'patrimony', label: 'Adicionar ao patrimônio', icon: Landmark, color: 'text-indigo-500' },
        { id: 'income', label: 'Adicionar ganho', icon: TrendingUp, color: 'text-green-500' },
        { id: 'expense', label: 'Adicionar despesa', icon: TrendingDown, color: 'text-red-500' },
    ];

    if (!isVisible && !isOpen) return null;

    return (
        <>
            {/* Backdrop for menu */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 animate-fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`fixed right-4 md:right-8 bottom-[80px] md:bottom-8 z-50 flex flex-col items-end gap-3 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                
                {/* Speed Dial Menu */}
                {isOpen && (
                    <div className="flex flex-col gap-3 mb-2 items-end">
                        {menuItems.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(item.id as any);
                                }}
                                className="group flex items-center gap-3 active:scale-95 transition-transform"
                                style={{ 
                                    animation: `slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                                    animationDelay: `${index * 60}ms`,
                                    opacity: 0,
                                    transform: 'translateY(10px)'
                                }}
                            >
                                <span className="bg-orbis-surface text-gray-700 dark:text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg border border-gray-100 dark:border-orbis-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden xs:block">
                                    {item.label}
                                </span>
                                <div className="w-12 h-12 rounded-full bg-orbis-surface border border-gray-100 dark:border-orbis-border shadow-lg flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <item.icon size={20} className={item.color} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Main FAB */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    onTouchStart={() => setIsTouched(true)}
                    onTouchEnd={() => setIsTouched(false)}
                    className={`
                        w-14 h-14 rounded-full bg-[#C9C7FF] text-[#0F1115] shadow-lg shadow-[#C9C7FF]/30 
                        flex items-center justify-center transition-all duration-200
                        ${isTouched ? 'scale-90' : 'scale-100 hover:scale-105'}
                        ${isOpen ? 'rotate-45 bg-orbis-surface text-gray-900 dark:text-white' : ''}
                    `}
                    aria-label="Ações rápidas"
                >
                    <Plus size={26} strokeWidth={2.5} />
                </button>
            </div>
        </>
    );
};