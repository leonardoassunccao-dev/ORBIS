import { Transaction, SummaryStats, ChartDataPoint, Category, PatrimonyTransaction } from '../types';
import { startOfDay, subDays, isAfter, format, parseISO, subMonths, isSameMonth, startOfMonth, endOfMonth, getDaysInMonth, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PatrimonyService } from './patrimony';

export const AnalyticsService = {
  filterTransactions: (transactions: Transaction[], days: number | 'all' | 'custom', customStart?: Date, customEnd?: Date): Transaction[] => {
    if (days === 'all') return transactions;
    
    let startDate: Date;
    if (days === 'custom' && customStart) {
      startDate = startOfDay(customStart);
    } else if (typeof days === 'number') {
      startDate = subDays(new Date(), days);
    } else {
      return transactions;
    }

    return transactions.filter(t => {
      const tDate = parseISO(t.dateISO);
      return isAfter(tDate, startDate) || tDate.getTime() === startDate.getTime();
    }).sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
  },

  getAverageMonthlyExpenses: (transactions: Transaction[], monthsToAnalyze: number = 3): number => {
    const now = new Date();
    let totalExpenses = 0;
    let monthsCount = 0;

    for (let i = 1; i <= monthsToAnalyze; i++) {
      const date = subMonths(now, i);
      const monthExpenses = transactions
        .filter(t => t.type === 'expense' && isSameMonth(parseISO(t.dateISO), date))
        .reduce((acc, t) => acc + t.amount, 0);
      
      if (monthExpenses > 0) {
        totalExpenses += monthExpenses;
        monthsCount++;
      }
    }
    
    return monthsCount > 0 ? totalExpenses / monthsCount : 0;
  },

  getSummary: (transactions: Transaction[], patrimonyTransactions: PatrimonyTransaction[] = []): SummaryStats => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    // Net Worth (Total gained - Total spent)
    const balance = totalIncome - totalExpense;

    // Patrimony Calculations
    const patrimonyTotal = PatrimonyService.calculateTotal(patrimonyTransactions);
    
    // Available Cash
    const availableCash = balance - patrimonyTotal;

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // --- Fixed Base Calculation (Base Fixa) ---
    // Calculates the monthly impact of recurring transactions found in the filtered view.
    const fixedBase = transactions
      .filter(t => t.type === 'expense' && (t.recurrence === 'monthly' || t.recurrence === 'yearly'))
      .reduce((acc, t) => {
        if (t.recurrence === 'monthly') return acc + t.amount;
        if (t.recurrence === 'yearly') return acc + (t.amount / 12);
        return acc;
      }, 0);

    return {
      balance,
      availableCash,
      patrimonyTotal,
      totalIncome,
      totalExpense,
      fixedBase,
      savingsRate
    };
  },

  /**
   * Calculates a projection for the end of the current month.
   */
  getMonthForecast: (transactions: Transaction[], currentAvailableCash: number) => {
    const now = new Date();
    const daysInMonth = getDaysInMonth(now);
    const daysPassed = getDate(now);

    // 1. Calculate Historical Averages (Income & Expense) - Last 3 months
    let totalHistIncome = 0;
    let totalHistExpense = 0;
    let monthsCount = 0;

    for (let i = 1; i <= 3; i++) {
        const date = subMonths(now, i);
        const monthTx = transactions.filter(t => isSameMonth(parseISO(t.dateISO), date));
        
        if (monthTx.length > 0) {
            totalHistIncome += monthTx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            totalHistExpense += monthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
            monthsCount++;
        }
    }

    const avgIncome = monthsCount > 0 ? totalHistIncome / monthsCount : 0;
    // Base average expense logic
    const avgExpense = monthsCount > 0 ? totalHistExpense / monthsCount : 0;

    // 2. Calculate Current Month Realized
    const currentMonthTx = transactions.filter(t => isSameMonth(parseISO(t.dateISO), now));
    const realizedIncome = currentMonthTx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const realizedExpense = currentMonthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    // 3. Estimate Remaining (Projected)
    // Income Logic
    const remainingIncome = Math.max(0, avgIncome - realizedIncome);
    
    // Expense Logic (Smart Hybrid: Recurrence + Variable Avg)
    // Calculate total known recurring expenses from history (approximate)
    // We look at the last month to see what was "monthly"
    const lastMonth = subMonths(now, 1);
    const lastMonthRecurring = transactions
        .filter(t => isSameMonth(parseISO(t.dateISO), lastMonth) && t.type === 'expense' && t.recurrence === 'monthly')
        .reduce((acc, t) => acc + t.amount, 0);

    // Current month realized recurring
    const realizedRecurring = currentMonthTx
        .filter(t => t.type === 'expense' && t.recurrence === 'monthly')
        .reduce((acc, t) => acc + t.amount, 0);
    
    // Pending recurring (estimated)
    const pendingRecurring = Math.max(0, lastMonthRecurring - realizedRecurring);

    // Variable expenses projection (daily rate)
    // We strip out recurring from average to calculate variable run rate
    const estimatedVariableTotal = avgExpense - lastMonthRecurring; // Rough estimate of variable portion
    const realizedVariable = realizedExpense - realizedRecurring;
    
    let remainingVariable = 0;
    if (estimatedVariableTotal > 0) {
        remainingVariable = Math.max(0, estimatedVariableTotal - realizedVariable);
    } else {
        // Fallback if no history
        const dailyRate = daysPassed > 0 ? realizedExpense / daysPassed : 0;
        const daysLeft = daysInMonth - daysPassed;
        remainingVariable = dailyRate * daysLeft;
    }

    const remainingExpense = pendingRecurring + remainingVariable;
    const projectedBalance = currentAvailableCash + remainingIncome - remainingExpense;

    return {
        projectedBalance,
        remainingIncome,
        remainingExpense,
        avgExpense,
        isPositive: projectedBalance >= 0,
        reliability: monthsCount === 0 ? 'low' : 'high' 
    };
  },

  getMonthlyData: (transactions: Transaction[]): ChartDataPoint[] => {
    const grouped = new Map<string, ChartDataPoint>();
    
    // Sort transactions by date first
    const sorted = [...transactions].sort((a, b) => a.dateISO.localeCompare(b.dateISO));

    sorted.forEach(t => {
      // Key format: YYYY-MM
      const date = parseISO(t.dateISO);
      const key = format(date, 'MMM yy', { locale: ptBR });
      
      if (!grouped.has(key)) {
        grouped.set(key, { name: key, income: 0, expense: 0 });
      }
      
      const point = grouped.get(key)!;
      if (t.type === 'income') point.income += t.amount;
      else point.expense += t.amount;
    });

    return Array.from(grouped.values());
  },

  getBalanceHistory: (transactions: Transaction[]): { date: string, balance: number }[] => {
    const sorted = [...transactions].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    let runningBalance = 0;
    const history: { date: string, balance: number }[] = [];

    // Group by day to avoid noisy charts
    const groupedByDay = new Map<string, number>();

    sorted.forEach(t => {
      const val = t.type === 'income' ? t.amount : -t.amount;
      const day = t.dateISO.split('T')[0]; // YYYY-MM-DD
      const current = groupedByDay.get(day) || 0;
      groupedByDay.set(day, current + val);
    });

    Array.from(groupedByDay.keys()).sort().forEach(dateStr => {
      runningBalance += groupedByDay.get(dateStr)!;
      history.push({
        date: format(parseISO(dateStr), 'dd MMM', { locale: ptBR }),
        balance: runningBalance
      });
    });

    return history;
  },

  getCategoryDistribution: (transactions: Transaction[], categories: Category[]) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = new Map<string, number>();

    expenses.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const name = cat ? cat.name : 'Desconhecido';
      grouped.set(name, (grouped.get(name) || 0) + t.amount);
    });

    return Array.from(grouped.entries()).map(([name, value]) => ({
      name,
      value,
      color: categories.find(c => c.name === name)?.color || '#9AA0C3'
    })).sort((a, b) => b.value - a.value);
  }
};