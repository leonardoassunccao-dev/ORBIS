
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { Plus, Search, Trash2, X, Receipt, FileSearch, Pencil, CloudDownload } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionForm } from './TransactionForm';
import { TransactionDetailsModal } from './TransactionDetailsModal';

interface TransactionManagerProps {
  type: TransactionType;
  transactions: Transaction[];
  categories: Category[];
  onAdd: (t: Omit<Transaction, 'id' | 'createdAt'>) => string; // Return the new ID
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
  onFormToggle?: (isOpen: boolean) => void;
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({ 
  type, transactions, categories, onAdd, onDelete, onEdit, onFormToggle
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  // Notify parent when form state changes (including edit modal)
  useEffect(() => {
    onFormToggle?.(isFormOpen || !!editingTransaction || !!viewingTransaction);
  }, [isFormOpen, editingTransaction, viewingTransaction, onFormToggle]);
  
  // Filter relevant transactions
  const listData = useMemo(() => {
    return transactions
      .filter(t => t.type === type)
      .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  }, [transactions, type, searchTerm]);

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
  };

  const handleEditSave = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
        onEdit({
            ...editingTransaction,
            ...data
        });
        setEditingTransaction(null);
    }
  };

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

      {/* Add Form (Inline) */}
      {isFormOpen && (
        <div className="animate-slide-up origin-top bg-orbis-surface border border-gray-200 dark:border-orbis-border p-6 rounded-2xl shadow-xl mb-6 relative overflow-hidden">
            <TransactionForm 
                type={type} 
                categories={categories} 
                transactions={transactions}
                onSave={(data) => {
                    const newId = onAdd(data);
                    setLastAddedId(newId);
                    setIsFormOpen(false);
                }}
            />
        </div>
      )}

      {/* Edit Modal / Bottom Sheet */}
      {editingTransaction && (
         <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={() => setEditingTransaction(null)} />
            
            <div className="relative w-full max-w-xl bg-orbis-surface border border-gray-200 dark:border-orbis-border rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                {/* Header is now handled inside TransactionForm for better control over the Save button placement */}
                <TransactionForm 
                    type={type}
                    categories={categories}
                    transactions={transactions}
                    initialData={editingTransaction}
                    onSave={handleEditSave}
                    onCancel={() => setEditingTransaction(null)}
                />
            </div>
         </div>
      )}

      {/* Details Modal */}
      <TransactionDetailsModal
        transaction={viewingTransaction}
        categories={categories}
        isOpen={!!viewingTransaction}
        onClose={() => setViewingTransaction(null)}
        onEdit={() => {
            if (viewingTransaction) {
                setEditingTransaction(viewingTransaction);
                setViewingTransaction(null);
            }
        }}
        onDelete={() => {
            if (viewingTransaction && confirm('Excluir este item?')) {
                onDelete(viewingTransaction.id);
                setViewingTransaction(null);
            }
        }}
      />

      {/* Search Bar */}
      {transactions.some(t => t.type === type) && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar por descrição..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-orbis-surface border border-gray-200 dark:border-orbis-border rounded-xl pl-12 pr-4 py-3.5 text-base text-gray-900 dark:text-white focus:outline-none focus:border-orbis-primary/50 transition-colors shadow-sm"
            />
          </div>
      )}

      {/* List View */}
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
                    onEdit={() => handleEditClick(t)}
                    onView={() => setViewingTransaction(t)}
                    isHighlighted={lastAddedId === t.id}
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
    onEdit: () => void;
    onView: () => void;
    isHighlighted: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, categories, onDelete, onEdit, onView, isHighlighted }) => {
    const category = categories.find(c => c.id === transaction.categoryId);
    const date = parseISO(transaction.dateISO);
    
    // Check if edited from original import
    const isEdited = transaction.isImported && transaction.originalDescription && transaction.description !== transaction.originalDescription;

    // Get category initials or icon placeholder
    const catInitial = category?.name.substring(0, 1).toUpperCase() || '?';
    
    return (
        <div 
            className={`
                relative overflow-hidden rounded-2xl p-4 transition-all duration-500 border group cursor-pointer active:scale-[0.98]
                bg-orbis-surface
                ${isHighlighted 
                    ? 'border-orbis-accent shadow-[0_0_20px_rgba(138,123,255,0.25)] animate-pulse-glow z-10' 
                    : 'border-gray-200 dark:border-orbis-border shadow-sm hover:border-orbis-primary/30'}
            `}
            onClick={onView}
        >
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
                        <div className="flex items-center gap-2">
                             <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                                {transaction.description}
                            </h3>
                            {transaction.isImported && (
                                <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                                    <CloudDownload size={10} />
                                    {isEdited ? 'Editado' : 'Importado'}
                                </span>
                            )}
                        </div>
                       
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-orbis-textMuted mt-0.5">
                            <span className="font-medium" style={{ color: category?.color }}>{category?.name}</span>
                            <span>•</span>
                            <span>{format(date, "d MMM", { locale: ptBR })}</span>
                            {transaction.recurrence && transaction.recurrence !== 'unique' && (
                                <span className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                    {transaction.recurrence === 'monthly' ? 'Mensal' : 'Anual'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Value */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`font-bold text-base md:text-lg ${transaction.type === 'income' ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                        {transaction.type === 'expense' ? '- ' : '+ '}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount).replace('R$', '').trim()}
                    </span>
                </div>
            </div>
        </div>
    )
}
