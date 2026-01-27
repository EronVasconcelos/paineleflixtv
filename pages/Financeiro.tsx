import React, { useMemo } from 'react';
import { DollarSign, TrendingDown, Wallet, TrendingUp, Users, ArrowUp, ArrowDownLeft } from 'lucide-react';
import { StatCard } from '../components/UiKit';

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/* --- COMPONENTES GRÁFICOS INTERNOS --- */
const RevenueChart = ({ data, theme }: { data: any[], theme: 'light' | 'dark' }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 300},${100 - (d.value / maxVal) * 100}`).join(' ');
  return (
    <div className={`p-5 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
       <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500"/> Crescimento (6 Meses)
          </h3>
       </div>
       <div className="relative h-40 w-full flex items-end justify-between px-2">
          <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 100">
             <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={theme === 'dark' ? '#34d399' : '#059669'} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={theme === 'dark' ? '#34d399' : '#059669'} stopOpacity="0" />
                </linearGradient>
             </defs>
             <polyline fill="none" stroke={theme === 'dark' ? '#34d399' : '#059669'} strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
             <polygon fill="url(#gradient)" stroke="none" points={`${points} 300,100 0,100`} />
          </svg>
          {data.map((d, i) => <div key={i} className="relative flex flex-col items-center justify-end h-full w-full"><span className="text-[9px] font-bold text-slate-400 uppercase mt-2 absolute bottom-[-20px]">{d.label}</span></div>)}
       </div><div className="h-4"></div>
    </div>
  );
};

const ClientMovementChart = ({ clients, theme }: { clients: any[], theme: 'light' | 'dark' }) => {
  const data = useMemo(() => Array.from({length: 6}, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
        const monthIdx = d.getMonth(); const year = d.getFullYear();
        const gained = clients.filter((c:any) => { const d = new Date(c.createdAt); return d.getMonth() === monthIdx && d.getFullYear() === year; }).length;
        const lost = clients.filter((c:any) => { const d = new Date(c.expiresAt); return d.getMonth() === monthIdx && d.getFullYear() === year && (c.status === 'blocked' || c.paymentStatus !== 'paid'); }).length;
        return { label: MONTHS[monthIdx], gained, lost };
  }), [clients]);
  const maxVal = Math.max(...data.map(d => Math.max(d.gained, d.lost))) || 1;
  return (
    <div className={`p-5 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
       <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wide flex items-center gap-2"><Users size={16} className="text-blue-500"/> Entradas vs Saídas</h3>
          <div className="flex gap-3 text-[9px] font-bold uppercase"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Novos</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Perdidos</span></div>
       </div>
       <div className="flex items-end justify-between h-40 px-2 gap-2">
          {data.map((d, i) => (
             <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="w-full max-w-[12px] bg-emerald-500 rounded-t-sm transition-all hover:bg-emerald-400" style={{ height: `${(d.gained / maxVal) * 50}%`, minHeight: d.gained > 0 ? '4px' : '0' }}></div>
                <div className="w-full h-[1px] bg-slate-300 dark:bg-slate-600 my-0.5"></div>
                <div className="w-full max-w-[12px] bg-red-500 rounded-b-sm transition-all hover:bg-red-400" style={{ height: `${(d.lost / maxVal) * 50}%`, minHeight: d.lost > 0 ? '4px' : '0' }}></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-3">{d.label}</span>
             </div>
          ))}
       </div>
    </div>
  );
};

/* --- FILTRO FINANCEIRO --- */
const FinancialFilter = ({ month, year, setMonth, setYear, theme }: any) => (
  <div className={`flex gap-3 p-4 rounded-xl border mb-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="flex-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Mês de Referência</label>
      <select 
        value={month} 
        onChange={(e) => setMonth(parseInt(e.target.value))}
        className={`w-full p-2.5 rounded-md border text-xs font-bold outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i}>{m}</option>
        ))}
      </select>
    </div>
    <div className="w-32">
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Ano</label>
      <select 
        value={year} 
        onChange={(e) => setYear(parseInt(e.target.value))}
        className={`w-full p-2.5 rounded-md border text-xs font-bold outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
      >
        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  </div>
);

interface FinancePageProps {
    clients: any[];
    packages: any[];
    servers: any[];
    theme: 'light' | 'dark';
    month: number;
    year: number;
    setMonth: (m: number) => void;
    setYear: (y: number) => void;
}

export default function Financeiro({ clients, packages, servers, theme, month, year, setMonth, setYear }: FinancePageProps) {
  const financialSummary = useMemo(() => {
    const currentMonth = month;
    const currentYear = year;

    const monthlyRevenue = clients.reduce((sum: number, c: any) => {
        const paidInMonth = c.paymentHistory?.filter((h: any) => {
            const hDate = new Date(h.date);
            return hDate.getMonth() === currentMonth && hDate.getFullYear() === currentYear;
        }).reduce((pSum: number, h: any) => pSum + h.amount, 0) || 0;
        return sum + paidInMonth;
    }, 0);

    const clientExpenses = clients.reduce((sum: number, c: any) => {
        const hasPaymentInMonth = c.paymentHistory?.some((h: any) => {
            const hDate = new Date(h.date);
            return hDate.getMonth() === currentMonth && hDate.getFullYear() === currentYear;
        });
        return sum + (hasPaymentInMonth ? (c.expenses || 0) : 0);
    }, 0);

    const serverExpenses = servers.reduce((sum: number, s: any) => {
        const serverCostMonth = s.transactions?.filter((t: any) => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        }).reduce((tSum: number, t: any) => tSum + (t.cost || 0), 0) || 0;
        return sum + serverCostMonth;
    }, 0);

    const totalExpenses = clientExpenses + serverExpenses;

    const chartData = Array.from({length: 6}, (_, i) => {
        const d = new Date(currentYear, currentMonth, 1); 
        d.setMonth(d.getMonth() - (5 - i));
        const mIdx = d.getMonth(); const yIdx = d.getFullYear();
        const rev = clients.reduce((s: number, c: any) => s + (c.paymentHistory?.filter((h: any) => {
            const hDate = new Date(h.date);
            return hDate.getMonth() === mIdx && hDate.getFullYear() === yIdx;
        }).reduce((p: number, h: any) => p + h.amount, 0) || 0), 0);
        return { label: MONTHS[mIdx], value: rev };
    });

    return { monthlyRevenue, totalExpenses, profit: monthlyRevenue - totalExpenses, chartData };
  }, [clients, packages, servers, month, year]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <FinancialFilter month={month} year={year} setMonth={setMonth} setYear={setYear} theme={theme} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Faturamento" value={`R$ ${financialSummary.monthlyRevenue.toFixed(2)}`} icon={<DollarSign/>} color="emerald" theme={theme} trend="+ Receita"/>
        <StatCard title="Despesas Totais" value={`R$ ${financialSummary.totalExpenses.toFixed(2)}`} icon={<TrendingDown/>} color="red" theme={theme} trend="- Custos"/>
        <StatCard title="Lucro Líquido" value={`R$ ${financialSummary.profit.toFixed(2)}`} icon={<Wallet/>} color="blue" theme={theme} trend="Resultado"/>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <div>
            <h4 className="text-xs font-bold uppercase mb-3 text-slate-500 ml-1">Fluxo de Caixa (6 Meses)</h4>
            <RevenueChart data={financialSummary.chartData} theme={theme} />
         </div>
         <div>
            <h4 className="text-xs font-bold uppercase mb-3 text-slate-500 ml-1">Movimentação</h4>
            <ClientMovementChart clients={clients} theme={theme} />
         </div>
      </div>
    </div>
  );
}