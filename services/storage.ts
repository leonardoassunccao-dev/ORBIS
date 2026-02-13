
import { Transaction, Category, PatrimonyTransaction, ImportBatch } from '../types';

const STORAGE_KEY_TRANSACTIONS = 'orbis_transactions_v1';
const STORAGE_KEY_PATRIMONY = 'orbis_patrimony_v1';
const STORAGE_KEY_CATEGORIES = 'orbis_categories_v1';
const STORAGE_KEY_THEME = 'orbis_theme_pref';
const STORAGE_KEY_BATCHES = 'orbis_import_batches_v1';

export type ThemeType = 'dark' | 'light' | 'pink';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Salário', type: 'income', color: '#8AFFC1' },
  { id: 'cat_2', name: 'Freelance', type: 'income', color: '#4ADE80' },
  { id: 'cat_3', name: 'Investimentos', type: 'income', color: '#60A5FA' },
  { id: 'cat_4', name: 'Alimentação', type: 'expense', color: '#FF8A8A' },
  { id: 'cat_5', name: 'Moradia', type: 'expense', color: '#F87171' },
  { id: 'cat_6', name: 'Transporte', type: 'expense', color: '#FBBF24' },
  { id: 'cat_7', name: 'Lazer', type: 'expense', color: '#A78BFA' },
  { id: 'cat_8', name: 'Saúde', type: 'expense', color: '#34D399' },
  { id: 'cat_9', name: 'Educação', type: 'expense', color: '#60A5FA' },
  { id: 'cat_11', name: 'Assinaturas', type: 'expense', color: '#C084FC' },
  { id: 'cat_10', name: 'Outros', type: 'both', color: '#9AA0C3' },
];

export const StorageService = {
  getTransactions: (): Transaction[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error loading transactions", e);
      return [];
    }
  },

  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  },

  getPatrimony: (): PatrimonyTransaction[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PATRIMONY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  savePatrimony: (transactions: PatrimonyTransaction[]) => {
    localStorage.setItem(STORAGE_KEY_PATRIMONY, JSON.stringify(transactions));
  },

  getCategories: (): Category[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories: (categories: Category[]) => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  },

  getImportBatches: (): ImportBatch[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY_BATCHES);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
  },

  saveImportBatches: (batches: ImportBatch[]) => {
      localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(batches));
  },

  getTheme: (): ThemeType => {
    return (localStorage.getItem(STORAGE_KEY_THEME) as ThemeType) || 'dark';
  },

  saveTheme: (theme: ThemeType) => {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  },

  exportData: () => {
    const data = {
      transactions: StorageService.getTransactions(),
      patrimony: StorageService.getPatrimony(),
      categories: StorageService.getCategories(),
      batches: StorageService.getImportBatches(),
      exportedAt: new Date().toISOString(),
      app: 'ORBIS'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbis_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData: (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (data.app === 'ORBIS' && Array.isArray(data.transactions)) {
            StorageService.saveTransactions(data.transactions);
            if (Array.isArray(data.patrimony)) {
                StorageService.savePatrimony(data.patrimony);
            }
            if (Array.isArray(data.batches)) {
                StorageService.saveImportBatches(data.batches);
            }
            StorageService.saveCategories(data.categories || DEFAULT_CATEGORIES);
            resolve(true);
          } else {
            reject(new Error("Invalid format"));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  },

  resetData: () => {
    localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEY_PATRIMONY);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY_BATCHES);
    // Keep theme preference
  }
};
