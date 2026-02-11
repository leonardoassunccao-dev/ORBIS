import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction, Category, PatrimonyTransaction } from '../types';
import { AnalyticsService } from '../services/analytics';
import { InsightService } from '../services/insights';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, Calendar, Landmark, Sparkles, ShieldCheck, Lock, TrendingUp, AlertCircle, Anchor } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  patrimonyTransactions: PatrimonyTransaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, patrimonyTransactions }) => {
  const [period, setPeriod] = useState<number | 'all'>(30);

  const hasData = transactions.length > 0 || patrimonyTransactions.length > 0;

  const filteredTransactions = useMemo(() => 
    AnalyticsService.filterTransactions(transactions, period), 
  [transactions, period]);

  const stats = useMemo(() => 
    AnalyticsService.getSummary(filteredTransactions, patrimonyTransactions), 
  [filteredTransactions, patrimonyTransactions]);

  // Forecast Logic (always based on full history for better accuracy, not filtered period)
  const forecast = useMemo(() => 
    AnalyticsService.getMonthForecast(transactions, stats.availableCash),
  [transactions, stats.availableCash]);

  const chartData = useMemo(() => 
    AnalyticsService.getBalanceHistory(filteredTransactions), 
  [filteredTransactions]);

  const monthlyData = useMemo(() => 
    AnalyticsService.getMonthlyData(transactions).slice(-6), // Last 6 months
  [transactions]);

  const categoryData = useMemo(() => 
    AnalyticsService.getCategoryDistribution(filteredTransactions, categories), 
  [filteredTransactions, categories]);

  const insight = useMemo(() => 
    InsightService.getSmartInsight(transactions, patrimonyTransactions),
  [transactions, patrimonyTransactions]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const periodDescriptions: Record<string, string> = {
    '7': 'Foco no agora',
    '30': 'Visão do mês',
    '90': 'Tendência',
    'all': 'Histórico completo'
  };

  // --- ZERO STATE (ONBOARDING) ---
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
        <div className="relative">
            <div className="absolute inset-0 bg-orbis-primary/20 blur-[40px] rounded-full" />
            <div className="relative bg-white dark:bg-orbis-surface p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl">
                <ShieldCheck size={48} className="text-orbis-accent" />
            </div>
        </div>
        
        <div className="max-w-md space-y-3 px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Bem-vindo ao Orbis
            </h2>
            <p className="text-gray-500 dark:text-orbis-textMuted leading-relaxed">
                Seu controle financeiro pessoal, <strong>100% offline e privado</strong>. 
                Seus dados nunca saem deste dispositivo.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg px-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 flex items-center gap-3 text-left">
                <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                    <ArrowUpRight size={20} />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Registre Ganhos</p>
                    <p className="text-xs text-gray-500">Salários, freelas, vendas.</p>
                </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 flex items-center gap-3 text-left">
                <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                    <ArrowDownRight size={20} />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Controle Gastos</p>
                    <p className="text-xs text-gray-500">Assinaturas, mercado, lazer.</p>
                </div>
            </div>
        </div>

        <div className="pt-8 animate-pulse text-gray-400 text-sm flex flex-col items-center gap-2">
            <span>Toque no botão abaixo para começar</span>
            <ArrowDownRight size={24} className="rotate-45" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white opacity-0 animate-slide-up-sm motion-reduce:opacity-100 motion-reduce:animate-none">
            Onde você está agora
          </h2>
          <p className="text-sm text-gray-500 dark:text-orbis-textMuted mt-1 opacity-0 animate-fade-in-delayed motion-reduce:opacity-100 motion-reduce:animate-none">
            Um retrato honesto da sua vida financeira.
          </p>
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <div className="flex overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex bg-white dark:bg-orbis-surface p-1 rounded-xl border border-gray-200 dark:border-white/5 whitespace-nowrap">
              {[7, 30, 90, 'all'].map((p) => (
                  <button
                  key={p}
                  onClick={() => setPeriod(p as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      period === p 
                      ? 'bg-orbis-primary text-orbis-bg shadow-sm' 
                      : 'text-gray-500 dark:text-orbis-textMuted hover:text-gray-900 dark:hover:text-white'
                  }`}
                  >
                  {p === 'all' ? 'Tudo' : `${p}d`}
                  </button>
              ))}
            </div>
          </div>
          
          {/* Microcopy Contextual */}
          <div className="mt-2 pl-1 h-5 flex items-center justify-between">
             <p 
                key={period} // Force re-render for animation
                className="text-xs font-medium text-orbis-textMuted animate-fade-in"
             >
                {periodDescriptions[String(period)]}
             </p>
          </div>
        </div>

        {/* Premium Insights Card */}
        <div className="animate-slide-up-fade" style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}>
           <InsightsCard 
             text={insight.text} 
             status={insight.status}
             // Pass combined length to detect any add/remove action for pulse effect
             dataVersion={transactions.length + patrimonyTransactions.length} 
           />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Main: Available Cash */}
        <SummaryCard 
          index={0}
          title="Caixa disponível" 
          value={stats.availableCash} 
          description="Dinheiro livre para o dia a dia."
          icon={Wallet} 
          isMain
        />
        
        {/* Base Fixa (New Recurrence Card) */}
        <SummaryCard 
          index={1}
          title="Base Fixa Mensal" 
          value={stats.fixedBase} 
          description="Gastos recorrentes neste período."
          icon={Anchor}
          customColor="text-pink-500"
        />

        {/* Total Balance */}
         <SummaryCard 
          index={2}
          title="Saldo total" 
          value={stats.balance} 
          description="Caixa + Patrimônio."
          icon={ArrowUpRight} 
          customColor="text-gray-500"
        />
        
        <SummaryCard 
          index={3}
          title="Gastos (Mês)" 
          value={stats.totalExpense} 
          description="Total de saídas no período."
          icon={ArrowDownRight} 
        />
      </div>

      {/* Forecast Card (New Component) */}
      <div className="animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
        <ForecastCard 
            projectedBalance={forecast.projectedBalance}
            isPositive={forecast.isPositive}
            reliability={forecast.reliability}
            formatCurrency={formatCurrency}
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '450ms', animationFillMode: 'backwards' }}>
        
        {/* Evolution Chart (Net Worth) */}
        <div className="lg:col-span-2 bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
             <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Evolução de Saldo</h3>
             <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-md text-gray-500">Fluxo de Caixa</span>
          </div>
          <div className="h-[220px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8A7BFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8A7BFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9AA0C3', fontSize: 11}} 
                    dy={10}
                    minTickGap={30}
                    interval="preserveStartEnd"
                />
                <YAxis 
                    hide 
                />
                <Tooltip 
                    cursor={{ stroke: '#8A7BFF', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ backgroundColor: '#0F1115', border: '1px solid #2D3142', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#C9C7FF' }}
                    formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                />
                <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#8A7BFF" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                    animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col">
          <h3 className="font-semibold text-lg mb-6 text-gray-900 dark:text-white">Gastos por Categoria</h3>
          <div className="flex-1 min-h-[200px] relative">
            {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    >
                    {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0F1115', border: '1px solid #2D3142', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    Sem dados no período
                </div>
            )}
          </div>
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-600 dark:text-gray-300">{cat.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {Math.round((cat.value / stats.totalExpense) * 100)}%
                    </span>
                </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl p-4 md:p-6 shadow-sm animate-fade-in" style={{ animationDelay: '550ms', animationFillMode: 'backwards' }}>
        <h3 className="font-semibold text-lg mb-6 text-gray-900 dark:text-white">Comparativo Mensal</h3>
        <div className="h-[200px] md:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={8}>
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9AA0C3', fontSize: 11}} 
                        dy={10}
                    />
                    <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ backgroundColor: '#0F1115', border: '1px solid #2D3142', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="income" name="Ganhos" fill="#8AFFC1" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1000} />
                    <Bar dataKey="expense" name="Gastos" fill="#FF8A8A" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1000} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

// --- SUBCOMPONENTS ---

interface ForecastCardProps {
    projectedBalance: number;
    isPositive: boolean;
    reliability: 'low' | 'high';
    formatCurrency: (val: number) => string;
}

const ForecastCard: React.FC<ForecastCardProps> = ({ projectedBalance, isPositive, reliability, formatCurrency }) => {
    return (
        <div className="bg-white dark:bg-orbis-surface border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-orbis-textMuted uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} />
                    Previsão do Mês
                </h3>
            </div>

            <div className="mb-4">
                <span className={`text-3xl md:text-4xl font-bold tracking-tight ${isPositive ? 'text-green-500 dark:text-[#8AFFC1]' : 'text-red-500 dark:text-[#FF8A8A]'}`}>
                    Saldo estimado: {formatCurrency(projectedBalance)}
                </span>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Com base no seu saldo atual e média de gastos.
                </p>
            </div>

            <div className="h-px w-full bg-gray-100 dark:bg-white/5 my-4" />

            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {isPositive ? <TrendingUp size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-medium ${isPositive ? 'text-gray-900 dark:text-white' : 'text-red-500 dark:text-red-400'}`}>
                        {isPositive 
                            ? (reliability === 'low' ? "Projeção inicial positiva." : "Você deve terminar o mês no azul.") 
                            : "Atenção: projeção indica possível saldo negativo."}
                    </p>
                </div>
            </div>

            {/* Optional Footer Microcopy */}
             <div className="absolute bottom-4 right-4 text-[10px] text-gray-300 dark:text-white/10 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                Previsão baseada em dados atuais
            </div>
        </div>
    );
};

interface InsightsCardProps {
    text: string;
    status: 'good' | 'neutral' | 'warning';
    dataVersion: number;
}

const InsightsCard: React.FC<InsightsCardProps> = ({ text, status, dataVersion }) => {
    const [isPulsing, setIsPulsing] = useState(false);
    const prevVersion = useRef(dataVersion);

    // Trigger pulse only when data actually changes (add/remove transactions)
    useEffect(() => {
        if (dataVersion !== prevVersion.current) {
            // Wait a tiny bit for the UI to settle then pulse
            const timer = setTimeout(() => setIsPulsing(true), 100);
            const stopTimer = setTimeout(() => setIsPulsing(false), 500); // 400ms pulse duration
            prevVersion.current = dataVersion;
            return () => { clearTimeout(timer); clearTimeout(stopTimer); };
        }
    }, [dataVersion]);

    // Parse text to highlight numbers and percentages
    const renderText = (rawText: string) => {
        // Regex to capture percentages (X%) or currency (R$ X,XX)
        const parts = rawText.split(/(R\$\s?[\d.,]+|\d+(?:[.,]\d+)?%?)/);
        return parts.map((part, i) => {
            if (/^(R\$\s?[\d.,]+|\d+(?:[.,]\d+)?%?)$/.test(part)) {
                return <span key={i} className="text-[#C9C7FF] font-semibold">{part}</span>;
            }
            return part;
        });
    };

    return (
        <div className={`
            relative w-full overflow-hidden rounded-[16px] p-[16px] md:p-[20px] transition-all duration-300
            bg-gradient-to-br dark:from-[#0F1325] dark:to-[#0B0E1A] from-[#FFFFFF] to-[#F4F5FF]
            border border-[#8A7BFF]/15
            shadow-sm dark:shadow-none
            ${isPulsing ? '!border-[#8A7BFF] !shadow-[0_0_15px_rgba(138,123,255,0.15)]' : ''}
        `}>
            <div className="flex items-start gap-3 relative z-10">
                <div className={`
                    p-1 rounded-full shrink-0 mt-0.5
                    ${status === 'warning' ? 'text-orange-400' : 'text-[#8A7BFF]'}
                `}>
                    <Sparkles size={18} />
                </div>
                
                {/* Text Container with Crossfade Key */}
                <div className="flex-1">
                    <p 
                        key={text} 
                        className="text-sm md:text-base font-medium leading-relaxed text-[#333] dark:text-[#F4F5FF] animate-fade-in"
                    >
                        {renderText(text)}
                    </p>
                </div>
            </div>
        </div>
    );
};


// Component for smooth number interpolation
const AnimatedNumber = ({ value }: { value: number }) => {
    const [displayValue, setDisplayValue] = useState(value);
    
    useEffect(() => {
        let start = displayValue;
        const end = value;
        if (start === end) return;

        const duration = 600;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);
            
            const current = start + (end - start) * ease;
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return (
        <>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayValue)}</>
    );
};

const SummaryCard = ({ title, value, description, icon: Icon, isMain = false, customColor, index = 0 }: any) => {
    const [isPulsing, setIsPulsing] = useState(false);
    const prevValueRef = useRef(value);

    // Effect to trigger pulse when value changes (update only)
    useEffect(() => {
        if (prevValueRef.current !== value) {
            setIsPulsing(true);
            const timer = setTimeout(() => setIsPulsing(false), 600);
            prevValueRef.current = value;
            return () => clearTimeout(timer);
        }
    }, [value]);

    return (
        <div 
            className={`
                relative overflow-hidden rounded-2xl p-5 border flex flex-col justify-between min-h-[120px]
                transform transition-all duration-200 
                hover:-translate-y-0.5 hover:border-orbis-primary/30 active:scale-[0.98]
                animate-enter-card motion-reduce:animate-none
                ${isMain 
                    ? 'bg-gradient-to-br from-orbis-primary to-[#A799FF] text-orbis-bg border-transparent shadow-lg shadow-orbis-primary/20' 
                    : 'bg-white dark:bg-orbis-surface border-gray-200 dark:border-white/5'}
                ${isPulsing ? 'animate-update-pulse' : ''}
            `}
            style={{ 
                animationDelay: `${index * 60}ms`,
                // Ensure staggered entrance is only visual; pointer events shouldn't wait
                animationFillMode: 'backwards'
            }}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                    ${isMain ? 'bg-white/20 text-orbis-bg' : 'bg-gray-100 dark:bg-white/5'}
                    ${!isMain && customColor ? customColor.replace('text-', 'text-').replace('text', 'bg').replace('500', '500/10') : ''}
                    ${!isMain && !customColor ? 'text-gray-500 dark:text-orbis-textMuted' : ''}
                `}>
                    <Icon size={16} className={!isMain && customColor ? customColor : ''} />
                </div>
                <span className={`text-sm font-medium truncate ${isMain ? 'text-orbis-bg/80' : 'text-gray-500 dark:text-orbis-textMuted'}`}>
                    {title}
                </span>
            </div>
            
            <div className="relative z-10">
                <span className={`text-xl md:text-2xl font-bold tracking-tight ${isMain ? 'text-orbis-bg' : 'text-gray-900 dark:text-white'}`}>
                    <AnimatedNumber value={value} />
                </span>
                {description && (
                    <p className={`text-[10px] md:text-xs mt-1 leading-tight ${isMain ? 'text-orbis-bg/70' : 'text-gray-400 dark:text-orbis-textMuted/70'}`}>
                        {description}
                    </p>
                )}
            </div>

            {/* Decorative BG for Main Card */}
            {isMain && (
                <div className="absolute -right-6 -bottom-6 text-white/10 rotate-[-15deg] pointer-events-none">
                    <Icon size={120} />
                </div>
            )}
        </div>
    );
}