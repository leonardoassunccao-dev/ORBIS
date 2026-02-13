
import React, { useState, useRef } from 'react';
import { Transaction, Category, ImportBatch } from '../types';
import { ImportService, ParsedRawTransaction } from '../services/import';
import { Upload, FileText, Check, AlertTriangle, Trash2, ArrowLeft, RefreshCcw, History, FileSpreadsheet } from 'lucide-react';

interface ImportManagerProps {
    categories: Category[];
    transactions: Transaction[];
    batches: ImportBatch[];
    onConfirmImport: (transactions: Omit<Transaction, 'createdAt'>[], batchInfo: ImportBatch) => void;
    onDeleteBatch: (batchId: string) => void;
}

type Step = 'upload' | 'map_csv' | 'review' | 'history';

export const ImportManager: React.FC<ImportManagerProps> = ({ 
    categories, transactions, batches, onConfirmImport, onDeleteBatch 
}) => {
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [parsedData, setParsedData] = useState<ParsedRawTransaction[]>([]);
    
    // CSV Mapping State
    const [csvMapping, setCsvMapping] = useState({ dateIndex: 0, descIndex: 1, amountIndex: 2 });
    const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setFileContent(content);
            
            if (uploadedFile.name.toLowerCase().endsWith('.ofx')) {
                const data = ImportService.parseOFX(content, categories, transactions);
                setParsedData(data);
                setStep('review');
            } else if (uploadedFile.name.toLowerCase().endsWith('.csv')) {
                // Prepare CSV Mapping preview
                const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 5);
                const rows = lines.map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
                setCsvPreviewRows(rows);
                setStep('map_csv');
            } else {
                alert('Formato não suportado. Use .ofx ou .csv');
            }
        };
        reader.readAsText(uploadedFile);
    };

    const processCsvMapping = () => {
        const data = ImportService.parseCSV(fileContent, csvMapping, categories, transactions);
        setParsedData(data);
        setStep('review');
    };

    const handleRemoveRow = (id: string) => {
        setParsedData(prev => prev.filter(row => row.id !== id));
    };

    const handleUpdateRow = (id: string, field: keyof ParsedRawTransaction, value: any) => {
        setParsedData(prev => prev.map(row => {
            if (row.id === id) {
                // If category changed, just update categoryId
                // If description changed, update description
                // If type changed (e.g. amount logic), manual override possible?
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const handleFinalizeImport = () => {
        if (parsedData.length === 0) return;

        const batchId = crypto.randomUUID();
        const batchInfo: ImportBatch = {
            id: batchId,
            fileName: file?.name || 'Importação',
            date: new Date().toISOString(),
            count: parsedData.length,
            totalAmount: parsedData.reduce((acc, curr) => acc + curr.amount, 0)
        };

        const newTransactions = parsedData.map(row => ({
            id: crypto.randomUUID(),
            description: row.description,
            amount: row.amount,
            type: row.type,
            dateISO: row.dateISO,
            categoryId: row.categoryId || 'cat_10', // Default to 'Outros' if empty
            importBatchId: batchId,
            isImported: true,
            originalDescription: row.description,
            recurrence: 'unique' as const
        }));

        onConfirmImport(newTransactions, batchInfo);
        
        // Reset
        setFile(null);
        setFileContent('');
        setParsedData([]);
        setStep('history');
    };

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // --- RENDERERS ---

    const renderUpload = () => (
        <div className="animate-fade-in space-y-8">
            <div className="bg-white dark:bg-orbis-surface border-2 border-dashed border-gray-300 dark:border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center hover:border-orbis-primary/50 transition-colors group cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".ofx,.csv" 
                    onChange={handleFileUpload} 
                />
                
                <div className="w-20 h-20 bg-orbis-primary/10 rounded-full flex items-center justify-center text-orbis-primary mb-6 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Importar Extrato Bancário
                </h3>
                <p className="text-gray-500 dark:text-orbis-textMuted max-w-sm mb-6">
                    Clique para selecionar arquivos <b>.OFX</b> ou <b>.CSV</b> do seu banco.
                </p>

                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-medium text-gray-500">Nubank</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-medium text-gray-500">Inter</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-medium text-gray-500">Itaú</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-medium text-gray-500">Outros</span>
                </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                 <AlertTriangle size={14} className="text-orbis-primary" />
                 <span>🔐 Seus dados são processados apenas no seu navegador. Nada é enviado para servidores.</span>
            </div>

            <div className="flex justify-center">
                 <button onClick={() => setStep('history')} className="text-sm text-orbis-primary font-medium hover:underline flex items-center gap-2">
                    <History size={16} /> Ver histórico de importações
                 </button>
            </div>
        </div>
    );

    const renderCsvMapping = () => (
        <div className="animate-slide-up space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep('upload')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                    <ArrowLeft size={20} className="text-gray-500" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mapear Colunas CSV</h2>
                    <p className="text-sm text-gray-500">Identifique as colunas do seu arquivo.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-white/5">
                            {csvPreviewRows[0]?.map((_, i) => (
                                <th key={i} className="px-4 py-3 text-gray-500 font-medium">Coluna {i + 1}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {csvPreviewRows.slice(0, 3).map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-50 dark:border-white/5">
                                {row.map((cell, i) => (
                                    <td key={i} className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[200px] truncate">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                    <select 
                        className="w-full p-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl"
                        value={csvMapping.dateIndex}
                        onChange={(e) => setCsvMapping(prev => ({...prev, dateIndex: Number(e.target.value)}))}
                    >
                        {csvPreviewRows[0]?.map((_, i) => <option key={i} value={i}>Coluna {i+1}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                    <select 
                        className="w-full p-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl"
                        value={csvMapping.descIndex}
                        onChange={(e) => setCsvMapping(prev => ({...prev, descIndex: Number(e.target.value)}))}
                    >
                        {csvPreviewRows[0]?.map((_, i) => <option key={i} value={i}>Coluna {i+1}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Valor</label>
                    <select 
                        className="w-full p-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl"
                        value={csvMapping.amountIndex}
                        onChange={(e) => setCsvMapping(prev => ({...prev, amountIndex: Number(e.target.value)}))}
                    >
                        {csvPreviewRows[0]?.map((_, i) => <option key={i} value={i}>Coluna {i+1}</option>)}
                    </select>
                </div>
            </div>

            <button 
                onClick={processCsvMapping}
                className="w-full py-4 bg-orbis-primary text-orbis-bg font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
                Continuar para Revisão
            </button>
        </div>
    );

    const renderReview = () => (
        <div className="animate-slide-up h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setStep('upload')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revisar Importação</h2>
                        <p className="text-sm text-gray-500">{parsedData.length} transações encontradas.</p>
                    </div>
                </div>
                <button 
                    onClick={handleFinalizeImport}
                    className="px-6 py-2.5 bg-orbis-primary text-orbis-bg font-bold rounded-xl flex items-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                    <Check size={18} />
                    Confirmar Importação
                </button>
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-[#1A1D26] z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Valor</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {parsedData.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                                    {row.dateISO.split('-').reverse().join('/')}
                                </td>
                                <td className="px-4 py-3">
                                    <input 
                                        type="text" 
                                        value={row.description}
                                        onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-sm text-gray-900 dark:text-white focus:ring-0 placeholder-gray-400"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <select 
                                        value={row.categoryId}
                                        onChange={(e) => handleUpdateRow(row.id, 'categoryId', e.target.value)}
                                        className={`w-full text-sm bg-transparent border-none p-0 focus:ring-0 ${!row.categoryId ? 'text-red-400 font-bold' : 'text-gray-600 dark:text-gray-300'}`}
                                    >
                                        <option value="" disabled className="text-gray-400">Selecionar...</option>
                                        <option value="cat_10" className="dark:bg-orbis-surface">Outros</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id} className="dark:bg-orbis-surface">
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className={`px-4 py-3 text-sm font-bold text-right ${row.type === 'income' ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                                    {row.type === 'expense' ? '- ' : '+ '}
                                    {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(row.amount)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button 
                                        onClick={() => handleRemoveRow(row.id)}
                                        className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-4 text-center text-xs text-gray-400">
                Revise os dados antes de confirmar. Você pode editar a descrição e a categoria diretamente na tabela.
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="animate-slide-up space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep('upload')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                    <ArrowLeft size={20} className="text-gray-500" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Histórico de Importações</h2>
                    <p className="text-sm text-gray-500">Gerencie lotes anteriores.</p>
                </div>
            </div>

            {batches.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white dark:bg-orbis-surface rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <History size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhuma importação realizada ainda.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {batches.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(batch => (
                        <div key={batch.id} className="bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{batch.fileName}</h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-orbis-textMuted mt-1">
                                        <span>{new Date(batch.date).toLocaleDateString('pt-BR')}</span>
                                        <span>•</span>
                                        <span>{batch.count} lançamentos</span>
                                        <span>•</span>
                                        <span>Movimentado: {formatCurrency(batch.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    if(confirm('Tem certeza? Isso apagará todas as transações deste lote.')) {
                                        onDeleteBatch(batch.id);
                                    }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-500/20 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                <RefreshCcw size={12} />
                                Desfazer
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <button 
                onClick={() => setStep('upload')}
                className="w-full py-4 mt-4 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                Nova Importação
            </button>
        </div>
    );

    return (
        <div className="h-full pb-8">
            {step === 'upload' && renderUpload()}
            {step === 'map_csv' && renderCsvMapping()}
            {step === 'review' && renderReview()}
            {step === 'history' && renderHistory()}
        </div>
    );
};
