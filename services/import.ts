
import { Transaction, Category } from '../types';
import { InsightService } from './insights';

export interface ParsedRawTransaction {
    id: string; // temp id
    dateISO: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    categoryId: string; // pre-filled if found
}

export const ImportService = {
    /**
     * Parse OFX Content using Regex (more robust for raw text than DOMParser for some bank formats)
     */
    parseOFX: (content: string, categories: Category[], transactions: Transaction[]): ParsedRawTransaction[] => {
        const results: ParsedRawTransaction[] = [];
        
        // Simple regex to find transaction blocks
        // Note: OFX structure is usually <STMTTRN>...</STMTTRN>
        const transactionBlocks = content.split('<STMTTRN>');
        
        transactionBlocks.slice(1).forEach((block) => {
            try {
                // Extract fields
                const amountMatch = block.match(/<TRNAMT>([\d.-]+)/);
                const dateMatch = block.match(/<DTPOSTED>(\d+)/);
                const memoMatch = block.match(/<MEMO>(.*)/);
                const nameMatch = block.match(/<NAME>(.*)/);
                
                if (amountMatch && dateMatch) {
                    const amountRaw = parseFloat(amountMatch[1]);
                    const dateRaw = dateMatch[1].substring(0, 8); // YYYYMMDD
                    
                    const description = (memoMatch ? memoMatch[1] : (nameMatch ? nameMatch[1] : 'Transação')).trim();
                    const dateISO = `${dateRaw.substring(0, 4)}-${dateRaw.substring(4, 6)}-${dateRaw.substring(6, 8)}`;
                    
                    const amount = Math.abs(amountRaw);
                    const type = amountRaw < 0 ? 'expense' : 'income';
                    
                    // Suggest category
                    const categoryId = InsightService.suggestCategory(description, transactions) || '';

                    results.push({
                        id: crypto.randomUUID(),
                        dateISO,
                        description,
                        amount,
                        type,
                        categoryId
                    });
                }
            } catch (e) {
                console.warn('Failed to parse OFX block', e);
            }
        });

        return results;
    },

    /**
     * Parse CSV Content
     * Requires a mapping function to know which columns are which
     */
    parseCSV: (
        content: string, 
        mapping: { dateIndex: number, descIndex: number, amountIndex: number },
        categories: Category[],
        transactions: Transaction[]
    ): ParsedRawTransaction[] => {
        const lines = content.split(/\r?\n/);
        const results: ParsedRawTransaction[] = [];
        
        // Skip header assumption: start from index 1 if lines[0] looks like header
        // For simplicity, we filter out lines that don't look like data
        
        lines.forEach((line) => {
            if (!line.trim()) return;
            
            // Handle quotes in CSV (basic split)
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
            
            if (cols.length < Math.max(mapping.dateIndex, mapping.descIndex, mapping.amountIndex)) return;
            
            try {
                const dateRaw = cols[mapping.dateIndex];
                const descRaw = cols[mapping.descIndex];
                const amountRawStr = cols[mapping.amountIndex];
                
                // Basic date parsing (assume YYYY-MM-DD or DD/MM/YYYY)
                let dateISO = '';
                if (dateRaw.includes('/')) {
                    const parts = dateRaw.split('/');
                    if (parts[2].length === 4) dateISO = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD/MM/YYYY
                    else dateISO = new Date(dateRaw).toISOString().split('T')[0];
                } else {
                    dateISO = new Date(dateRaw).toISOString().split('T')[0];
                }
                
                if (dateISO === 'Invalid Date') return; // Skip header or invalid rows

                // Clean amount
                // Handle 1.000,00 vs 1,000.00
                // If contains comma and dot, assume last one is decimal separator
                let amountClean = amountRawStr.replace(/[^\d.,-]/g, '');
                if (amountClean.indexOf(',') > -1 && amountClean.indexOf('.') > -1) {
                    if (amountClean.lastIndexOf(',') > amountClean.lastIndexOf('.')) {
                        // European: 1.234,56
                         amountClean = amountClean.replace(/\./g, '').replace(',', '.');
                    }
                } else if (amountClean.indexOf(',') > -1) {
                    // Assume comma is decimal if no dots
                    amountClean = amountClean.replace(',', '.');
                }
                
                const amountFloat = parseFloat(amountClean);
                if (isNaN(amountFloat)) return;

                const amount = Math.abs(amountFloat);
                const type = amountFloat < 0 ? 'expense' : 'income';
                const description = descRaw || 'Importado';
                
                const categoryId = InsightService.suggestCategory(description, transactions) || '';

                results.push({
                    id: crypto.randomUUID(),
                    dateISO,
                    description,
                    amount,
                    type,
                    categoryId
                });

            } catch (e) {
                // Ignore parse errors for specific lines
            }
        });

        return results;
    }
};
