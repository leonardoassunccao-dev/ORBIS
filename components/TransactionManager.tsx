import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { Plus, Search, Trash2, X, Receipt, FileSearch } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionForm } from './TransactionForm';

interface TransactionManagerProps {
  type: TransactionType;
  transactions: Transaction[];
  categories: Category[];
  onAdd: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
  highlightId: string | null;
  onFormToggle?: (isOpen: boolean) => void;
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({ 
  type, transactions, categories, onAdd, onDelete, onEdit, highlightId, onFormToggle
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Notify parent when form state changes
  useEffect(() => {
    onFormToggle?.(isFormOpen);
  }, [isFormOpen, onFormToggle]);
  
  // Filter relevant transactions
  const listData = useMemo(() => {
    return transactions
      .filter(t => t.type === type)
      .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  }, [transactions, type, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {type === 'income' ? 'Meus Ganhos' : 'Minhas Despesas'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-orbis-textMuted mt-1">
                {type === 'income' ? 'Entradas registradas.' : 'Saídas registradas.'}
            </p>
            </div>
            
            <button 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all shadow-lg active:scale-95 touch-manipulation
                    ${isFormOpen 
                        ? 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white' 
                        : 'bg-orbis-primary text-orbis-bg shadow-orbis-primary/20'}
                `}
            >
                {isFormOpen ? <X size={20} /> : <Plus size={20} />}
                <span className="hidden xs:inline">{isFormOpen ? 'Cancelar' : 'Adicionar'}</span>
            </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="animate-slide-up origin-top bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-xl mb-6 relative overflow-hidden">
            <TransactionForm 
                type={type} 
                categories={categories} 
                transactions={transactions}
                onSave={(data) => {
                    onAdd(data);
                    setIsFormOpen(false);
                }}
            />
        </div>
      )}

      {/* Search Bar (Only show if there are transactions to search) */}
      {transactions.some(t => t.type === type) && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar por descrição..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-base text-gray-900 dark:text-white focus:outline-none focus:border-orbis-primary/50 transition-colors shadow-sm"
            />
          </div>
      )}

      {/* Mobile-First List View */}
      <div className="space-y-3">
        {listData.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-70 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 text-gray-400 dark:text-orbis-textMuted">
                    {searchTerm ? <FileSearch size={32} /> : <Receipt size={32} />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {searchTerm ? 'Nenhum resultado' : (type === 'income' ? 'Nenhum ganho ainda' : 'Nenhuma despesa ainda')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-orbis-textMuted max-w-[250px]">
                    {searchTerm 
                        ? 'Tente buscar com outro termo ou limpe o filtro.' 
                        : 'Toque no botão "Adicionar" ou use o botão + no canto da tela.'}
                </p>
            </div>
        ) : (
            listData.map((t) => (
                <TransactionItem 
                    key={t.id} 
                    transaction={t} 
                    categories={categories}
                    onDelete={onDelete}
                    isHighlighted={highlightId === t.id}
                />
            ))
        )}
      </div>
    </div>
  );
};

interface TransactionItemProps {
    transaction: Transaction;
    categories: Category[];
    onDelete: (id: string) => void;
    isHighlighted: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, categories, onDelete, isHighlighted }) => {
    const category = categories.find(c => c.id === transaction.categoryId);
    const date = parseISO(transaction.dateISO);
    
    // Get category initials or icon placeholder
    const catInitial = category?.name.substring(0, 1).toUpperCase() || '?';
    
    return (
        <div className={`
            relative overflow-hidden rounded-2xl p-4 transition-all duration-500 border
            bg-white dark:bg-orbis-surface
            ${isHighlighted 
                ? 'border-orbis-accent shadow-[0_0_20px_rgba(138,123,255,0.25)] animate-pulse-glow z-10' 
                : 'border-gray-200 dark:border-white/5 shadow-sm'}
        `}>
            {isHighlighted && (
                 <div className="absolute inset-0 bg-orbis-accent/10 animate-fade-in pointer-events-none" />
            )}
            <div className="flex items-center justify-between gap-4 relative z-10">
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 shadow-inner"
                        style={{ backgroundColor: `${category?.color || '#9AA0C3'}20`, color: category?.color || '#9AA0C3' }}
                    >
                        {catInitial}
                    </div>
                    <div className="truncate">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate pr-2">
                            {transaction.description}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-orbis-textMuted mt-0.5">
                            <span className="font-medium" style={{ color: category?.color }}>{category?.name}</span>
                            <span>•</span>
                            <span>{format(date, "d MMM", { locale: ptBR })}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Value & Delete */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`font-bold text-base md:text-lg ${transaction.type === 'income' ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                        {transaction.type === 'expense' ? '- ' : '+ '}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount).replace('R$', '').trim()}
                    </span>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if(confirm('Excluir este item?')) onDelete(transaction.id);
                        }}
                        className="p-2 -mr-2 text-gray-400 hover:text-red-500 active:text-red-500 transition-colors touch-manipulation"
                        aria-label="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}