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

const DAILY_TIPS = [
  "A meta não é gastar menos, é gastar bem.",
  "Invista o que sobra depois de gastar? Não. Gaste o que sobra depois de investir.",
  "Pequenos progressos diários resultam em grandes resultados.",
  "Cuide dos centavos e os reais cuidarão de si mesmos.",
  "O hábito de poupar é uma educação em si mesmo.",
  "Preço é o que você paga. Valor é o que você leva.",
  "A riqueza consiste não em ter grandes posses, mas em ter poucas necessidades.",
  "Não trabalhe pelo dinheiro, faça o dinheiro trabalhar por você.",
  "O juro composto é a oitava maravilha do mundo.",
  "Nunca dependa de uma única fonte de renda.",
  "Não guarde o que sobra, guarde primeiro e gaste o resto."
];

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

  getDailyTip: (): string => {
    try {
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('orbis_insight_date');
        const savedTip = localStorage.getItem('orbis_insight_text');

        if (savedDate === today && savedTip) {
            return savedTip;
        }

        const newTip = DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)];
        localStorage.setItem('orbis_insight_date', today);
        localStorage.setItem('orbis_insight_text', newTip);
        return newTip;
    } catch (e) {
        return DAILY_TIPS[0];
    }
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

    // E. Fallback: Daily Tip (instead of generic stability message)
    return {
        text: InsightService.getDailyTip(),
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