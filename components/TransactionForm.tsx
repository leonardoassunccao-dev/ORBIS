import React, { useState, useEffect } from 'react';
import { Transaction, Category, TransactionType, RecurrenceType } from '../types';
import { Loader2, Check, Sparkles, Calendar as CalIcon, RefreshCw, Save } from 'lucide-react';
import { InsightService } from '../services/insights';

interface TransactionFormProps {
    type: TransactionType;
    categories: Category[];
    transactions: Transaction[];
    onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
    onCancel?: () => void;
    autoFocus?: boolean;
    initialData?: Transaction | null; // Added for Edit Mode
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
    type, categories, transactions, onSave, onCancel, autoFocus = true, initialData 
}) => {
    // Initial state setup based on initialData or defaults
    const [displayValue, setDisplayValue] = useState('');
    const [rawValue, setRawValue] = useState(0);
    const [desc, setDesc] = useState('');
    const [catId, setCatId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [recurrence, setRecurrence] = useState<RecurrenceType>('unique');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoSuggested, setAutoSuggested] = useState(false);

    // Effect to populate form when initialData changes (Edit Mode)
    useEffect(() => {
        if (initialData) {
            setRawValue(initialData.amount);
            setDisplayValue(initialData.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            setDesc(initialData.description);
            setCatId(initialData.categoryId);
            // Ensure we grab just the YYYY-MM-DD part
            setDate(initialData.dateISO.split('T')[0]);
            setRecurrence(initialData.recurrence || 'unique');
        }
    }, [initialData]);

    // Auto-suggestion logic (Only run if NOT editing)
    useEffect(() => {
        if (initialData) return; // Disable auto-suggest on edit
        
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
    }, [desc, transactions, categories, catId, autoSuggested, initialData]);

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
        // Small delay for UX feel
        await new Promise(r => setTimeout(r, 600));

        onSave({
            amount: rawValue,
            description: desc,
            categoryId: catId,
            dateISO: date, // Will be saved as YYYY-MM-DD (acceptable for ISO parsing)
            type,
            recurrence
        });
        
        setIsSubmitting(false);
        
        // Only reset if NOT editing (Edit modal usually closes after save)
        if (!initialData) {
            setDisplayValue('');
            setRawValue(0);
            setDesc('');
            setCatId('');
            setRecurrence('unique');
            setAutoSuggested(false);
        }
    }

    const relevantCategories = categories.filter(c => c.type === 'both' || c.type === type);
    const isEditing = !!initialData;

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount Input */}
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

            {/* Description */}
            <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-orbis-textMuted uppercase mb-2">Descrição</label>
                <input 
                    type="text" 
                    required
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder={type === 'expense' ? "Ex: Netflix, Aluguel..." : "Ex: Salário, Projeto..."}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-base text-gray-900 dark:text-white focus:outline-none focus:border-orbis-primary focus:ring-1 focus:ring-orbis-primary transition-all"
                />
            </div>

            {/* Category */}
            <div>
                <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-orbis-textMuted uppercase">Categoria</label>
                        {autoSuggested && !isEditing && (
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

            {/* Date */}
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

            {/* Recurrence (New Field) */}
            <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-orbis-textMuted uppercase mb-2">Recorrência</label>
                <div className="flex bg-gray-50 dark:bg-black/20 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                    <button
                        type="button"
                        onClick={() => setRecurrence('unique')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                            recurrence === 'unique' 
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        Único
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecurrence('monthly')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                            recurrence === 'monthly' 
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        <RefreshCw size={14} />
                        Mensal
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecurrence('yearly')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                            recurrence === 'yearly' 
                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        Anual
                    </button>
                </div>
            </div>

            {/* Actions */}
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
                            {isEditing ? 'Atualizando...' : 'Salvando...'}
                        </>
                    ) : (
                        <>
                            {isEditing ? <Save size={20} /> : <Check size={20} />}
                            {isEditing ? 'Atualizar' : 'Salvar'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};