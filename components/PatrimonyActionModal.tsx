import React, { useState } from 'react';
import { PatrimonyTransaction } from '../types';
import { X, AlertTriangle } from 'lucide-react';
import { CustomKeypad } from './CustomKeypad';

interface PatrimonyActionModalProps {
    isOpen: boolean;
    type: 'deposit' | 'withdraw';
    onClose: () => void;
    onConfirm: (data: Omit<PatrimonyTransaction, 'id' | 'createdAt'>) => Promise<void>;
}

export const PatrimonyActionModal: React.FC<PatrimonyActionModalProps> = ({ isOpen, type, onClose, onConfirm }) => {
    const [amountStr, setAmountStr] = useState('');
    const [amountRaw, setAmountRaw] = useState(0);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const isDepositing = type === 'deposit';

    const handleSubmit = async () => {
        if (amountRaw <= 0) return;
        
        setIsSubmitting(true);
        await onConfirm({
            amount: amountRaw,
            type,
            dateISO: new Date().toISOString(),
            description: description || (isDepositing ? 'Aporte Patrimônio' : 'Resgate Patrimônio')
        });
        setIsSubmitting(false);
        setAmountStr('');
        setAmountRaw(0);
        setDescription('');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-orbis-surface border border-gray-200 dark:border-orbis-border rounded-2xl p-6 shadow-2xl relative animate-slide-up">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${isDepositing ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                            {isDepositing ? 'Adicionar ao Patrimônio' : 'Usar o Patrimônio'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-orbis-textMuted mt-1">
                            {isDepositing 
                                ? 'Esse valor será separado para sua segurança financeira.' 
                                : 'Você está prestes a retirar dinheiro que foi guardado para sua segurança.'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {!isDepositing && (
                    <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <p className="text-sm text-red-600 dark:text-red-400">
                            Isso não é um erro, mas deve ser uma decisão consciente.
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Valor</label>
                        <div className="w-full text-4xl font-bold bg-transparent text-gray-900 dark:text-white tracking-tight flex items-center h-12">
                            {amountStr || 'R$ 0,00'}
                        </div>
                        <CustomKeypad 
                            value={amountRaw} 
                            onChange={(val) => {
                                setAmountRaw(val);
                                setAmountStr(val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
                            }} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Descrição (Opcional)</label>
                        <input 
                            type="text" 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={isDepositing ? "Ex: Aporte mensal" : "Ex: Emergência médica"}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-orbis-border rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                        />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={isSubmitting || amountRaw <= 0}
                            className={`flex-1 py-4 rounded-xl font-bold text-white transition-all active:scale-95 ${
                                isSubmitting ? 'opacity-70 cursor-wait' : ''
                            } ${isDepositing ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-red-500 shadow-lg shadow-red-500/20'}`}
                        >
                            {isSubmitting ? 'Processando...' : (isDepositing ? 'Confirmar aporte' : 'Confirmar retirada')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};