
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionManager } from './components/TransactionManager';
import { PatrimonyManager } from './components/PatrimonyManager';
import { ImportManager } from './components/ImportManager';
import { PWAInstall } from './components/PWAInstall';
import { Transaction, Category, PatrimonyTransaction, ImportBatch } from './types';
import { StorageService, ThemeType } from './services/storage';
import { Upload, Download, Trash2, Palette, Check } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<ThemeType>(StorageService.getTheme());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expense' | 'import' | 'patrimony' | 'settings'>('dashboard');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [patrimonyTransactions, setPatrimonyTransactions] = useState<PatrimonyTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  
  // Track last added ID for animation
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    // Clear previous classes
    root.classList.remove('dark', 'light', 'pink');
    
    // Apply logic:
    // Light -> 'light'
    // Dark -> 'dark'
    // Pink -> 'dark' + 'pink' (Inherits dark structure but overrides colors via CSS vars)
    if (theme === 'light') {
        root.classList.add('light');
    } else if (theme === 'pink') {
        root.classList.add('dark', 'pink');
    } else {
        root.classList.add('dark');
    }
    
    StorageService.saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    setTransactions(StorageService.getTransactions());
    setPatrimonyTransactions(StorageService.getPatrimony());
    setCategories(StorageService.getCategories());
    setImportBatches(StorageService.getImportBatches());
  }, []);

  const handleAddTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    
    const updated = [...transactions, newTransaction];
    setTransactions(updated);
    StorageService.saveTransactions(updated);
    
    // Trigger animation
    setLastAddedId(newTransaction.id);
    setTimeout(() => setLastAddedId(null), 2000); // Clear after animation
  }, [transactions]);

  const handleImportTransactions = useCallback((newTransactions: Omit<Transaction, 'createdAt'>[], batch: ImportBatch) => {
      // Add created timestamp to all
      const now = Date.now();
      const processed = newTransactions.map(t => ({...t, createdAt: now} as Transaction));
      
      const updatedTransactions = [...transactions, ...processed];
      setTransactions(updatedTransactions);
      StorageService.saveTransactions(updatedTransactions);

      const updatedBatches = [...importBatches, batch];
      setImportBatches(updatedBatches);
      StorageService.saveImportBatches(updatedBatches);
      
      alert(`Sucesso! ${processed.length} transações importadas.`);
      setActiveTab('income'); // Redirect to view them? Or stay? Let's stay on import or go to dashboard. The prompt says "show revision table", which is inside ImportManager. After confirm, maybe go to income/expense or just clear. Let's stay in import history.
  }, [transactions, importBatches]);

  const handleDeleteImportBatch = useCallback((batchId: string) => {
      // Remove transactions with this batchId
      const updatedTransactions = transactions.filter(t => t.importBatchId !== batchId);
      setTransactions(updatedTransactions);
      StorageService.saveTransactions(updatedTransactions);

      // Remove batch record
      const updatedBatches = importBatches.filter(b => b.id !== batchId);
      setImportBatches(updatedBatches);
      StorageService.saveImportBatches(updatedBatches);
      
      alert('Importação desfeita com sucesso.');
  }, [transactions, importBatches]);

  const handleAddPatrimony = useCallback((t: Omit<PatrimonyTransaction, 'id' | 'createdAt'>) => {
      const newTransaction: PatrimonyTransaction = {
          ...t,
          id: crypto.randomUUID(),
          createdAt: Date.now()
      };
      const updated = [...patrimonyTransactions, newTransaction];
      setPatrimonyTransactions(updated);
      StorageService.savePatrimony(updated);
  }, [patrimonyTransactions]);

  const handleDeleteTransaction = useCallback((id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    StorageService.saveTransactions(updated);
  }, [transactions]);

  const handleEditTransaction = useCallback((updatedT: Transaction) => {
    const updated = transactions.map(t => t.id === updatedT.id ? updatedT : t);
    setTransactions(updated);
    StorageService.saveTransactions(updated);
  }, [transactions]);

  const handleReset = () => {
    if (confirm("Tem certeza que deseja apagar TODOS os dados? Esta ação é irreversível.")) {
      StorageService.resetData();
      setTransactions([]);
      setPatrimonyTransactions([]);
      setImportBatches([]);
      setCategories(StorageService.getCategories()); // Reset to default
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await StorageService.importData(file);
        setTransactions(StorageService.getTransactions());
        setPatrimonyTransactions(StorageService.getPatrimony());
        setCategories(StorageService.getCategories());
        setImportBatches(StorageService.getImportBatches());
        alert("Dados importados com sucesso!");
      } catch (err) {
        alert("Erro ao importar arquivo. Verifique o formato.");
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} categories={categories} patrimonyTransactions={patrimonyTransactions} />;
      case 'income':
        return (
          <TransactionManager 
            type="income" 
            transactions={transactions} 
            categories={categories}
            onAdd={handleAddTransaction}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
            highlightId={lastAddedId}
          />
        );
      case 'expense':
        return (
          <TransactionManager 
            type="expense" 
            transactions={transactions} 
            categories={categories}
            onAdd={handleAddTransaction}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
            highlightId={lastAddedId}
          />
        );
      case 'import':
        return (
            <ImportManager 
                categories={categories}
                transactions={transactions}
                batches={importBatches}
                onConfirmImport={handleImportTransactions}
                onDeleteBatch={handleDeleteImportBatch}
            />
        );
      case 'patrimony':
        return (
            <PatrimonyManager 
                transactions={patrimonyTransactions}
                regularTransactions={transactions}
                onAdd={handleAddPatrimony}
            />
        );
      case 'settings':
        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-orbis-text dark:text-white">Configurações</h2>
                    <p className="text-orbis-textMuted">Gerencie seus dados e preferências.</p>
                </div>

                <div className="grid gap-4">
                    <div className="bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Palette size={20} className="text-orbis-primary" />
                            <h3 className="font-semibold text-lg text-orbis-text dark:text-white">Aparência</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <span className="text-sm text-orbis-textMuted">Tema do aplicativo</span>
                            <div className="grid grid-cols-3 gap-3">
                                <button 
                                    onClick={() => setTheme('dark')}
                                    className={`
                                        relative h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all
                                        bg-[#0B0E1A] overflow-hidden
                                        ${theme === 'dark' ? 'border-orbis-accent ring-2 ring-orbis-accent/20' : 'border-gray-200 dark:border-white/10 opacity-70 hover:opacity-100'}
                                    `}
                                >
                                    <div className="absolute inset-x-0 top-0 h-6 bg-[#1e1b4b]/50 w-full" />
                                    <span className="text-xs font-medium text-white relative z-10 mt-4">Dark</span>
                                    {theme === 'dark' && <div className="absolute top-2 right-2 bg-orbis-accent rounded-full p-0.5"><Check size={10} className="text-white" /></div>}
                                </button>

                                <button 
                                    onClick={() => setTheme('light')}
                                    className={`
                                        relative h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all
                                        bg-[#F4F5FF] overflow-hidden
                                        ${theme === 'light' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-white/10 opacity-70 hover:opacity-100'}
                                    `}
                                >
                                    <div className="absolute inset-x-0 top-0 h-6 bg-indigo-100 w-full" />
                                    <span className="text-xs font-medium text-gray-900 relative z-10 mt-4">Light</span>
                                    {theme === 'light' && <div className="absolute top-2 right-2 bg-indigo-500 rounded-full p-0.5"><Check size={10} className="text-white" /></div>}
                                </button>

                                <button 
                                    onClick={() => setTheme('pink')}
                                    className={`
                                        relative h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all
                                        bg-[#0F0F14] overflow-hidden
                                        ${theme === 'pink' ? 'border-[#FF2D95] ring-2 ring-[#FF2D95]/20' : 'border-gray-200 dark:border-white/10 opacity-70 hover:opacity-100'}
                                    `}
                                >
                                    <div className="absolute inset-x-0 top-0 h-6 bg-[#FF2D95]/10 w-full" />
                                    <span className="text-xs font-medium text-[#FF2D95] relative z-10 mt-4">Midnight</span>
                                    {theme === 'pink' && <div className="absolute top-2 right-2 bg-[#FF2D95] rounded-full p-0.5"><Check size={10} className="text-white" /></div>}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm">
                        <h3 className="font-semibold text-lg mb-4 text-orbis-text dark:text-white">Dados</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-orbis-textMuted">Backup dos dados (JSON)</span>
                                <button onClick={StorageService.exportData} className="flex items-center gap-2 px-4 py-2 bg-orbis-primary text-orbis-bg font-medium rounded-lg text-sm hover:opacity-90 transition">
                                    <Download className="w-4 h-4" />
                                    Exportar
                                </button>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-white/5" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-orbis-textMuted">Restaurar backup</span>
                                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 cursor-pointer rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition">
                                    <Upload className="w-4 h-4" />
                                    Importar
                                    <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                                </label>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-white/5" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-500">Apagar tudo</span>
                                <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-500 rounded-lg text-sm hover:bg-red-500/10 transition">
                                    <Trash2 className="w-4 h-4" />
                                    Resetar App
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* About Orbis Card */}
                    <div 
                        className="bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm opacity-0 animate-fade-in"
                        style={{ animationDuration: '250ms', animationDelay: '300ms', animationFillMode: 'forwards' }}
                    >
                        <h3 className="font-semibold text-lg mb-2 text-orbis-text dark:text-white">Sobre o Orbis</h3>
                        <p className="text-sm md:text-base text-gray-600 dark:text-[#F4F5FF] leading-relaxed mb-4">
                            Orbis é um app pessoal de controle financeiro, criado para clareza, constância e decisões conscientes.
                        </p>
                        <div className="flex flex-col gap-1">
                            <p className="text-xs text-[#9AA0C3]">Versão v1.1.0</p>
                            <p className="text-xs text-[#9AA0C3]">Desenvolvido por Leo Assunção</p>
                        </div>
                    </div>
                </div>
            </div>
        )
      default:
        return null;
    }
  }

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
    >
      {renderContent()}
      <PWAInstall />
    </Layout>
  );
}
