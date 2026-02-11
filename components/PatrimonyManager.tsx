import React, { useState, useMemo } from 'react';
import { PatrimonyTransaction, Transaction } from '../types';
import { PatrimonyService } from '../services/patrimony';
import { AnalyticsService } from '../services/analytics';
import { Landmark, ArrowUpCircle, ArrowDownCircle, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PatrimonyActionModal } from './PatrimonyActionModal';

interface PatrimonyManagerProps {
  transactions: PatrimonyTransaction[];
  regularTransactions: Transaction[];
  onAdd: (t: Omit<PatrimonyTransaction, 'id' | 'createdAt'>) => void;
  onFormToggle?: (isOpen: boolean) => void;
}

export const PatrimonyManager: React.FC<PatrimonyManagerProps> = ({ transactions, regularTransactions, onAdd, onFormToggle }) => {
  const [modalType, setModalType] = useState<'deposit' | 'withdraw' | null>(null);

  const total = useMemo(() => PatrimonyService.calculateTotal(transactions), [transactions]);
  
  // Calculate average monthly expenses (3 months history)
  const avgExpense = useMemo(() => AnalyticsService.getAverageMonthlyExpenses(regularTransactions), [regularTransactions]);

  // Goal: 6 months of expenses (or default 20k if no data)
  const goal = useMemo(() => {
    return avgExpense > 0 ? avgExpense * 6 : 20000;
  }, [avgExpense]);

  const progress = useMemo(() => PatrimonyService.getGoalProgress(total, goal), [total, goal]);
  
  const progressMessage = useMemo(() => {
    if (progress.percentage >= 100) return "Parabéns. Você construiu uma base sólida.";
    if (progress.percentage >= 71) return "Falta pouco. Seu futuro agradece.";
    if (progress.percentage >= 31) return "Você está no caminho certo. Continue.";
    return "Todo patrimônio começa do zero. O importante é constância.";
  }, [progress.percentage]);

  const sortedHistory = useMemo(() => 
    [...transactions].sort((a, b) => b.createdAt - a.createdAt), 
  [transactions]);

  const handleModalOpen = (type: 'deposit' | 'withdraw') => {
      setModalType(type);
      onFormToggle?.(true);
  }

  const handleModalClose = () => {
      setModalType(null);
      onFormToggle?.(false);
  }

  const handleConfirm = async (data: any) => {
    await new Promise(r => setTimeout(r, 800)); // Premium delay simulation
    onAdd(data);
    handleModalClose();
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
        {/* Header */}
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 dark:text-indigo-400">
                    <Landmark size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patrimônio</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-orbis-textMuted">
                Dinheiro protegido para o seu futuro.
            </p>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-white/10">
            {/* Glow Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 blur-[80px] rounded-full pointer-events-none -mt-10 -mr-10" />
            
            <div className="relative z-10 flex flex-col items-center justify-center py-6">
                <span className="text-indigo-200 text-sm font-medium mb-1 flex items-center gap-2">
                    <ShieldCheck size={14} />
                    Patrimônio atual
                </span>
                <span className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                    {formatCurrency(total)}
                </span>
                <p className="text-xs text-indigo-200/70 font-medium">
                    Esse dinheiro não é gasto. É segurança.
                </p>
            </div>
        </div>

        {/* Goal Section */}
        <div className="bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        🎯 Meta de segurança
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-orbis-textMuted mt-1 leading-relaxed">
                        {avgExpense > 0 
                            ? (
                                <>
                                    Meta ajustada com base no seu histórico real.<br/>
                                    <span className="opacity-70 font-medium">
                                        (6x média mensal de {formatCurrency(avgExpense)})
                                    </span>
                                </>
                            )
                            : 'O ideal é ter pelo menos 6 meses do seu custo fixo guardados.'}
                    </p>
                </div>
                <span className="text-xs font-semibold bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                    {Math.round(progress.percentage)}%
                </span>
            </div>
            
            <div className="w-full bg-gray-100 dark:bg-black/20 rounded-full h-2.5 mb-3 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                    style={{ width: `${progress.percentage}%` }}
                />
            </div>
            <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {progressMessage}
                </span>
                <span className="text-gray-400">
                    Meta: {formatCurrency(goal)}
                </span>
            </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={() => handleModalOpen('deposit')}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm hover:border-indigo-500/50 transition-all active:scale-95 group"
            >
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowUpCircle size={24} />
                </div>
                <div className="text-center">
                    <span className="block font-semibold text-gray-900 dark:text-white text-sm">Adicionar ao patrimônio</span>
                    <span className="block text-[10px] text-gray-400 mt-1">Um passo hoje vale muito amanhã</span>
                </div>
            </button>

            <button 
                onClick={() => handleModalOpen('withdraw')}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm hover:border-red-500/50 transition-all active:scale-95 group"
            >
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowDownCircle size={24} />
                </div>
                <div className="text-center">
                    <span className="block font-semibold text-gray-900 dark:text-white text-sm">Usar patrimônio</span>
                    <span className="block text-[10px] text-gray-400 mt-1">Use apenas se necessário</span>
                </div>
            </button>
        </div>

        {/* Shared Reusable Modal */}
        <PatrimonyActionModal 
            isOpen={modalType !== null}
            type={modalType || 'deposit'}
            onClose={handleModalClose}
            onConfirm={handleConfirm}
        />

        {/* History List */}
        <div className="space-y-3 pt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white px-1">Histórico do patrimônio</h3>
            {sortedHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-400 bg-white/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <p className="font-medium mb-1">Nenhum aporte ainda.</p>
                    <p className="text-xs">Comece hoje, mesmo que seja pouco.</p>
                </div>
            ) : (
                sortedHistory.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                t.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                                {t.type === 'deposit' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{t.description}</p>
                                <p className="text-xs text-gray-500">{format(parseISO(t.dateISO), "d 'de' MMMM yyyy", { locale: ptBR })}</p>
                            </div>
                        </div>
                        <span className={`font-bold ${t.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                            {t.type === 'deposit' ? '+' : '-'} {formatCurrency(t.amount)}
                        </span>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};