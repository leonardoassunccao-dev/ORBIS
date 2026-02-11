import { Transaction, Category, PatrimonyTransaction } from '../types';
import { startOfMonth, subMonths, endOfMonth, differenceInCalendarDays, getDate, getDaysInMonth, isSameMonth, parseISO } from 'date-fns';

// Map of common keywords to default Category IDs (based on storage.ts defaults)
const KEYWORD_MAP: Record<string, string[]> = {
  'cat_4': ['mercado', 'supermercado', 'açougue', 'padaria', 'ifood', 'restaurante', 'burger', 'pizza', 'lanche', 'almoço', 'jantar', 'cafe', 'assai', 'carrefour', 'pão'], // Alimentação
  'cat_6': ['uber', '99', 'taxi', 'onibus', 'metro', 'posto', 'gasolina', 'abastecimento', 'estacionamento', 'pedagio', 'ipva', 'mechanico'], // Transporte
  'cat_11': ['netflix', 'spotify', 'prime', 'disney', 'hbo', 'globo', 'youtube', 'apple', 'google', 'aws', 'chatgpt', 'tv', 'assinatura', 'cloud'], // Assinaturas
  'cat_8': ['farmacia', 'drogaria', 'medico', 'consulta', 'exame', 'laboratorio', 'dentista', 'psicologo', 'hospital', 'remedio'], // Saúde
  'cat_5': ['aluguel', 'condominio', 'luz', 'agua', 'energia', 'enel', 'internet', 'vivo', 'claro', 'tim', 'oi', 'net', 'manutenção', 'casa'], // Moradia
  'cat_7': ['cinema', 'ingresso', 'show', 'teatro', 'bar', 'cerveja', 'steam', 'playstation', 'xbox', 'jogo', 'viagem', 'hotel'], // Lazer
  'cat_9': ['curso', 'faculdade', 'escola', 'mensalidade', 'livro', 'papelaria', 'udemy', 'alura', 'ingles'], // Educação
  'cat_3': ['investimento', 'cdb', 'fii', 'ação', 'tesouro', 'bitcoin', 'crypto', 'corretora'], // Investimentos (Income)
  'cat_1': ['salario', 'pagamento', 'remuneração', 'empresa'], // Salário (Income)
};

export const InsightService = {
  /**
   * Suggest a category based on description.
   * Priority:
   * 1. User History (Most recent transaction with similar name)
   * 2. Intelligent Keyword Matching (Dictionary)
   */
  suggestCategory: (description: string, transactions: Transaction[]): string | null => {
    const term = description.trim().toLowerCase();
    if (term.length < 3) return null;
    
    // 1. History Search
    // Sort by most recent first to capture latest habits
    const historyMatch = transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .find(t => {
        const tDesc = t.description.toLowerCase();
        return tDesc.includes(term) || term.includes(tDesc);
      });

    if (historyMatch) {
        return historyMatch.categoryId;
    }

    // 2. Keyword Dictionary Fallback (Cold Start)
    for (const [catId, keywords] of Object.entries(KEYWORD_MAP)) {
      if (keywords.some(k => term.includes(k))) {
        return catId;
      }
    }

    return null;
  },

  /**
   * Generates the most important insight for the current context.
   * Rules: 1 insight only, neutral tone, short text.
   */
  getSmartInsight: (transactions: Transaction[], patrimonyTransactions: PatrimonyTransaction[]): { text: string; status: 'good' | 'neutral' | 'warning' } => {
    const now = new Date();
    
    // --- 1. SPENDING ANALYSIS ---
    const currentMonthExpenses = transactions
      .filter(t => t.type === 'expense' && isSameMonth(parseISO(t.dateISO), now))
      .reduce((acc, t) => acc + t.amount, 0);

    let historicalTotal = 0;
    let monthsCount = 0;
    
    // Analyze last 3 months
    for (let i = 1; i <= 3; i++) {
      const date = subMonths(now, i);
      const monthExpenses = transactions
        .filter(t => t.type === 'expense' && isSameMonth(parseISO(t.dateISO), date))
        .reduce((acc, t) => acc + t.amount, 0);
      
      if (monthExpenses > 0) {
        historicalTotal += monthExpenses;
        monthsCount++;
      }
    }

    const averageMonthly = monthsCount > 0 ? historicalTotal / monthsCount : 0;
    const daysPassed = getDate(now);
    const daysInCurrentMonth = getDaysInMonth(now);
    
    // Projection logic
    const projection = daysPassed > 2 
        ? (currentMonthExpenses / daysPassed) * daysInCurrentMonth 
        : currentMonthExpenses;

    const stableDailyAvg = averageMonthly > 0 ? averageMonthly / 30 : (projection / 30 || 1);
    
    // --- 2. PATRIMONY ANALYSIS ---
    const patrimonyDeposits = patrimonyTransactions
      .filter(t => t.type === 'deposit' && isSameMonth(parseISO(t.dateISO), now))
      .reduce((acc, t) => acc + t.amount, 0);

    // --- PRIORITY LOGIC (Single Output) ---

    // A. Spending High Warning
    // "Seus gastos estão X% acima da média dos últimos 30 dias."
    if (averageMonthly > 0 && projection > averageMonthly * 1.20) {
         const pct = Math.round((projection / averageMonthly - 1) * 100);
         return {
            text: `Seus gastos estão ${pct}% acima da média habitual.`,
            status: 'warning'
         };
    }

    // B. Invisible Cost (Pequenos gastos recorrentes)
    // Rule: Unit value <= ~12% of daily avg AND frequency >= 4 in current month
    if (stableDailyAvg > 5) { // Minimum daily avg to trigger this logic
        const smallTxnThreshold = stableDailyAvg * 0.12; // 12% to be inclusive
        const invisibleGroups: Record<string, { count: number, total: number }> = {};
        
        transactions
            .filter(t => t.type === 'expense' && isSameMonth(parseISO(t.dateISO), now))
            .forEach(t => {
                if (t.amount <= smallTxnThreshold) {
                    if (!invisibleGroups[t.categoryId]) invisibleGroups[t.categoryId] = { count: 0, total: 0 };
                    invisibleGroups[t.categoryId].count++;
                    invisibleGroups[t.categoryId].total += t.amount;
                }
            });

        // Sum total of qualifying recurrent small costs
        let invisibleTotal = 0;
        let hasRecurrence = false;

        for (const data of Object.values(invisibleGroups)) {
            if (data.count >= 4) {
                 invisibleTotal += data.total;
                 hasRecurrence = true;
            }
        }
        
        // Show if impact is relevant (> 50% of a daily avg accumulated)
        if (hasRecurrence && invisibleTotal > stableDailyAvg * 0.5) {
             const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invisibleTotal);
             return {
                text: `Pequenos gastos recorrentes somam ${formatted}/mês.`,
                status: 'neutral'
             };
        }
    }

    // C. Patrimony Growth
    // "Seu patrimônio cresceu. A constância é o segredo."
    if (patrimonyDeposits > 0 && (averageMonthly === 0 || projection <= averageMonthly * 1.1)) {
        return {
            text: "Seu patrimônio cresceu neste período. A constância é o segredo.",
            status: 'good'
        };
    }

    // D. Spending Low
    // "Controle exemplar. Gastos X% menores que a média histórica."
    if (averageMonthly > 0 && projection < averageMonthly * 0.85 && daysPassed > 5) {
        const pct = Math.round((1 - projection / averageMonthly) * 100);
        return {
            text: `Controle exemplar. Gastos ${pct}% menores que a média histórica.`,
            status: 'good'
        };
    }

    // E. Stability (Default with history)
    // "Você manteve seus gastos estáveis neste período."
    if (monthsCount > 0) {
        return {
            text: "Você manteve seus gastos estáveis neste período.",
            status: 'neutral'
        };
    }

    // F. New User / No History
    return {
        text: "À medida que você usa o Orbis, insights vão aparecer aqui.",
        status: 'neutral'
    };
  },

  isOutlier: (amount: number, categoryId: string, transactions: Transaction[]): boolean => {
    const catTransactions = transactions.filter(t => t.categoryId === categoryId && t.type === 'expense');
    if (catTransactions.length < 5) return false;

    const total = catTransactions.reduce((acc, t) => acc + t.amount, 0);
    const avg = total / catTransactions.length;

    return amount > avg * 2.5;
  }
};