import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pencil, Trash2, Calendar, Tag, RefreshCw, FileText } from 'lucide-react';
import { Transaction, Category } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  categories,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!transaction) return null;

  const category = categories.find(c => c.id === transaction.categoryId);
  const date = parseISO(transaction.dateISO);
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-orbis-surface rounded-3xl p-6 shadow-2xl z-50 border border-gray-200 dark:border-orbis-border"
          >
            <div className="flex justify-between items-start mb-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner"
                style={{ backgroundColor: `${category?.color || '#9AA0C3'}20`, color: category?.color || '#9AA0C3' }}
              >
                {category?.name.substring(0, 1).toUpperCase() || '?'}
              </div>
              <button onClick={onClose} className="p-2 -mr-2 -mt-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-white/5 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium text-gray-500 dark:text-orbis-textMuted uppercase tracking-wider mb-1">
                {transaction.type === 'income' ? 'Ganho' : 'Despesa'}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {transaction.description}
              </h2>
              <p className={`text-4xl font-bold tracking-tight ${transaction.type === 'income' ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                {transaction.type === 'expense' ? '- ' : '+ '}
                {formattedAmount}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <DetailRow icon={Tag} label="Categoria" value={category?.name || 'Sem categoria'} color={category?.color} />
              <DetailRow icon={Calendar} label="Data" value={format(date, "dd 'de' MMMM, yyyy", { locale: ptBR })} />
              {transaction.recurrence && transaction.recurrence !== 'unique' && (
                <DetailRow 
                  icon={RefreshCw} 
                  label="Recorrência" 
                  value={transaction.recurrence === 'monthly' ? 'Mensal' : 'Anual'} 
                />
              )}
              {transaction.isImported && (
                <DetailRow icon={FileText} label="Origem" value="Importado via arquivo" />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  onClose();
                  onDelete();
                }}
                className="flex-1 py-4 rounded-xl font-bold text-red-500 bg-red-50 dark:bg-red-500/10 flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-red-100 dark:hover:bg-red-500/20"
              >
                <Trash2 size={20} />
                Excluir
              </button>
              <button
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-orbis-primary flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orbis-primary/20"
              >
                <Pencil size={20} />
                Editar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const DetailRow = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-orbis-border">
    <div className="w-10 h-10 rounded-xl bg-orbis-surface dark:bg-black/20 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <Icon size={18} style={{ color }} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-orbis-textMuted">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);
