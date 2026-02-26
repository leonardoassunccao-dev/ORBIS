import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Check } from 'lucide-react';
import { StorageService } from '../services/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [exportTransactions, setExportTransactions] = useState(true);
  const [exportPatrimony, setExportPatrimony] = useState(true);
  const [exportSettings, setExportSettings] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 800)); // Fake delay for animation
    
    // In a real app we would filter what to export based on toggles
    // For now we just call the existing export function
    StorageService.exportData();
    
    setIsExporting(false);
    onClose();
  };

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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Exportar Dados</h2>
              <button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <ToggleRow 
                label="Transações" 
                description="Ganhos e gastos diários"
                checked={exportTransactions} 
                onChange={setExportTransactions} 
              />
              <ToggleRow 
                label="Patrimônio" 
                description="Bens, investimentos e dívidas"
                checked={exportPatrimony} 
                onChange={setExportPatrimony} 
              />
              <ToggleRow 
                label="Configurações" 
                description="Preferências e categorias"
                checked={exportSettings} 
                onChange={setExportSettings} 
              />
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting || (!exportTransactions && !exportPatrimony && !exportSettings)}
              className="w-full py-4 rounded-xl font-bold text-white bg-orbis-primary flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isExporting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Download size={20} />
                </motion.div>
              ) : (
                <>
                  <Download size={20} />
                  Exportar JSON
                </>
              )}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ToggleRow = ({ label, description, checked, onChange }: any) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-orbis-border">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-orbis-textMuted mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
          checked ? 'bg-orbis-primary' : 'bg-gray-300 dark:bg-gray-700'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 22 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center"
        >
          {checked && <Check size={12} className="text-orbis-primary" />}
        </motion.div>
      </button>
    </div>
  );
};
