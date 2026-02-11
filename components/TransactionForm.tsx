import React, { useState, useEffect } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { Loader2, Check, Sparkles, Calendar as CalIcon } from 'lucide-react';
import { InsightService } from '../services/insights';

interface TransactionFormProps {
    type: TransactionType;
    categories: Category[];
    transactions: Transaction[];
    onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
    onCancel?: () => void;
    autoFocus?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ type, categories, transactions, onSave, onCancel, autoFocus = true }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [rawValue, setRawValue] = useState(0);
    const [desc, setDesc] = useState('');
    const [catId, setCatId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoSuggested, setAutoSuggested] = useState(false);

    // Auto-suggestion logic
    useEffect(() => {
        if (!desc || desc.length < 3) {
            if (desc.length === 0) setAutoSuggested(false);
            return;
        }
        
        if (catId === "" || autoSuggested) {
            const suggestedId = InsightService.suggestCategory(desc, transactions);
            if (suggestedId && categories.some(c => c.id === suggestedId)) {
                setCatId(suggestedId);
                setAutoSuggested(true);
            }
        }
    }, [desc, transactions, categories, catId, autoSuggested]);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCatId(e.target.value);
        setAutoSuggested(false);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        const numberValue = Number(value) / 100;
        setRawValue(numberValue);
        
        const formatted = numberValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        setDisplayValue(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rawValue <= 0 || !desc || !catId) return;

        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 800));

        onSave({
            amount: rawValue,
            description: desc,
            categoryId: catId,
            dateISO: date,
            type
        });
        setIsSubmitting(false);
        // Reset
        setDisplayValue('');
        setRawValue(0);
        setDesc('');
        setCatId('');
        setAutoSuggested(false);
    }

    const relevantCategories = categories.filter(c => c.type === 'both' || c.type === type);

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-orbis-textMuted uppercase mb-1">Valor</label>
                <input 
                    type="tel" 
                    inputMode="numeric"
                    autoFocus={autoFocus}
                    required
                    value={displayValue}
                    onChange={handleAmountChange}
                    placeholder="R$ 0,00"
                    className="w-full text-5xl font-bold bg-transparent text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 border-none focus:ring-0 p-0 tracking-tight"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-orbis-textMuted uppercase mb-2">Descrição</label>
                <input 
                    type="text" 
                    required
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder={type === 'expense' ? "Ex: Supermercado" : "Ex: Freela Design"}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-base text-gray-900 dark:text-white focus:outline-none focus:border-orbis-primary focus:ring-1 focus:ring-orbis-primary transition-all"
                />
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-orbis-textMuted uppercase">Categoria</label>
                        {autoSuggested && (
                        <span className="flex items-center gap-1 text-[10px] text-orbis-accent animate-fade-in font-medium bg-orbis-accent/10 px-2 py-0.5 rounded-full">
                            <Sparkles size={10} /> Sugestão automática
                        </span>
                        )}
                </div>
                <div className="relative">
                    <select 
                        required
                        value={catId}
                        onChange={handleCategoryChange}
                        className={`w-full bg-gray-50 dark:bg-black/20 border rounded-xl px-4 py-3.5 text-base text-gray-900 dark:text-white focus:outline-none focus:border-orbis-primary focus:ring-1 focus:ring-orbis-primary transition-all appearance-none ${autoSuggested ? 'border-orbis-accent/50 ring-1 ring-orbis-accent/20' : 'border-gray-200 dark:border-white/10'}`}
                    >
                        <option value="" disabled>Selecione...</option>
                        {relevantCategories.map(c => (
                            <option key={c.id} value={c.id} className="dark:bg-orbis-surface text-black dark:text-white">{c.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-orbis-textMuted uppercase mb-2">Data</label>
                <div className="relative">
                    <CalIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="date" 
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-base text-gray-900 dark:text-white focus:outline-none focus:border-orbis-primary focus:ring-1 focus:ring-orbis-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex items-end col-span-1 md:col-span-2 gap-3 pt-2">
                {onCancel && (
                    <button 
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`
                        flex-1 py-4 rounded-xl font-bold text-lg text-orbis-bg transition-all active:scale-[0.98] flex items-center justify-center gap-2
                        ${isSubmitting ? 'bg-orbis-primary cursor-wait' : 'bg-orbis-primary shadow-lg shadow-orbis-primary/20'}
                    `}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Check size={20} />
                            Salvar
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};