import { PatrimonyTransaction } from '../types';

export const PatrimonyService = {
  calculateTotal: (transactions: PatrimonyTransaction[]): number => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'deposit') return acc + t.amount;
      if (t.type === 'withdraw') return acc - t.amount;
      return acc;
    }, 0);
  },

  // Example Goal: 6 months of an estimated 3k monthly cost (18k total)
  // In a real app, this could be user configurable
  getGoalProgress: (currentAmount: number, goalAmount: number = 20000) => {
    const percentage = Math.min((currentAmount / goalAmount) * 100, 100);
    return {
      percentage,
      goalAmount,
      remaining: Math.max(goalAmount - currentAmount, 0)
    };
  }
};