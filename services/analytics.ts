import { Transaction, SummaryStats, ChartDataPoint, Category, PatrimonyTransaction } from '../types';
import { startOfDay, subDays, isAfter, format, parseISO, subMonths, isSameMonth } from 'date-fns';
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
    
    // Available Cash = (Net Worth) - (Money locked in Patrimony)
    // Note: If patrimonyTotal is negative (impossible logic but good for safety), we handle it.
    const availableCash = balance - patrimonyTotal;

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    return {
      balance,
      availableCash,
      patrimonyTotal,
      totalIncome,
      totalExpense,
      savingsRate
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
    // Note: This history currently shows "Net Worth" evolution, not "Available Cash".
    // This is usually correct for a general financial overview.
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