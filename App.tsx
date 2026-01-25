import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, LayoutDashboard, PlusCircle, Search, ChevronRight, CheckCircle, XCircle, Clock, 
  MessageSquare, DollarSign, TrendingUp, CreditCard, Layers, Trash2, Archive, RotateCcw, 
  ClipboardCopy, Share2, Send, X, Activity, RefreshCw, BellRing, MoreHorizontal, Info, 
  Tag, ArrowUpRight, History, Smartphone, ChevronLeft, UserX, AlertCircle, Clock3, Eye, 
  CalendarDays, Calendar, Sun, Moon, Plus, Pencil, Save, Check, ChevronDown, UserPlus, 
  Download, Upload, Database, ShieldAlert, Bell, BellOff, FileText, Wallet, Edit3, 
  Loader2, LogOut, Lock, Mail, User, Server as ServerIcon, Link as LinkIcon, Coins, Tv, 
  PlayCircle, Crown, Star, Zap, ShieldCheck, CheckSquare, Circle, Minus, Rocket, 
  PartyPopper, QrCode, Copy, TestTube, Wrench, PieChart, TrendingDown, BarChart3,
  ArrowDownLeft, ArrowUpRight as ArrowUp
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
// Certifique-se de que seus tipos (types.ts) suportam os campos novos, se não, o TypeScript avisará.
import { Client, Package, MessageTemplate, MessageRule, ClientStatus, PaymentStatus, Server, CreditTransaction, UserProfile } from './types';
import { geminiService } from './services/geminiService';
import { supabase } from './services/supabaseClient';

// Função utilitária global para verificar expiração de datas
const checkIsExpired = (date: string | null | undefined) => {
  if (!date) return true;
  return new Date(date) < new Date();
};

const PANEL_NAME = "STREAM MANAGER";
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const STRIPE_LINKS = {
  monthly: "https://buy.stripe.com/test_00waEWgqsbZWfD5azM4ZG00",
  quarterly: "https://buy.stripe.com/test_3cI28q8Y07JG0Ib8rE4ZG01",
  semiannual: "https://buy.stripe.com/test_5kQ6oG1vybZW4Yr9vI4ZG02",
  annual: "https://buy.stripe.com/test_7sYcN42zCggcgH9eQ24ZG03"
};

/* --- COMPONENTES DE UI BÁSICOS --- */

const Toast = ({ message, onClose, type = 'success' }: { message: string, onClose: () => void, type?: 'success' | 'error' }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[300] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-top-2 fade-in duration-300 ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle size={20} className="stroke-[3]" /> : <AlertCircle size={20} />}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

const PaymentSuccessModal = ({ theme, onClose }: { theme: 'light' | 'dark', onClose: () => void }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
    <div className="relative w-full max-w-md overflow-hidden rounded-[32px] shadow-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white border border-white/10 animate-in zoom-in-95 duration-300">
       <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full -ml-16 -mb-16 blur-3xl"></div>
       <div className="relative p-8 md:p-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-md shadow-lg border border-white/20 animate-bounce">
            <PartyPopper size={40} className="text-white drop-shadow-md" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-3 drop-shadow-sm">Assinatura Confirmada!</h2>
          <p className="text-white/90 font-medium text-sm mb-8 leading-relaxed max-w-xs mx-auto">
            Muito obrigado pela confiança! <br/>
            Seu pagamento foi processado com sucesso e todos os recursos Premium já estão liberados para você usar.
          </p>
          <button onClick={onClose} className="w-full py-4 bg-white text-blue-700 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-blue-50 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 group">
            Acessar Painel Agora <ArrowUpRight size={16} className="group-hover:translate-x-1 transition-transform"/>
          </button>
       </div>
    </div>
  </div>
);

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-all group ${active ? 'bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
    <div className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className={`text-[12px] font-semibold tracking-wide ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{label}</span>
    {active && <ChevronRight size={14} className="ml-auto text-slate-400" />}
  </button>
);

const BottomNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
    {React.cloneElement(icon as React.ReactElement<any>, { size: active ? 24 : 22, className: active ? 'mb-1' : 'mb-1 opacity-80' })}
    <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </button>
);

const MobileSubItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-800 rounded-md transition-all text-left">
    {icon}
    <span className="text-slate-300 text-xs font-bold uppercase tracking-wide">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color, theme, trend }: { title: string, value: string | number, icon: React.ReactNode, color: string, theme: 'light' | 'dark', trend?: string }) => {
  const getColors = () => {
    switch(color) {
      case 'emerald': return theme === 'dark' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'amber': return theme === 'dark' ? 'bg-amber-900/20 text-amber-400 border-amber-900/30' : 'bg-amber-50 text-amber-600 border-amber-100';
      case 'red': return theme === 'dark' ? 'bg-red-900/20 text-red-400 border-red-900/30' : 'bg-red-50 text-red-600 border-red-100';
      case 'blue': return theme === 'dark' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' : 'bg-blue-50 text-blue-600 border-blue-100';
      case 'purple': return theme === 'dark' ? 'bg-purple-900/20 text-purple-400 border-purple-900/30' : 'bg-purple-50 text-purple-600 border-purple-100';
      default: return theme === 'dark' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };
  return (
    <div className={`p-4 rounded-xl border shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:shadow-md ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex w-full justify-between items-start mb-2">
          <div className={`p-2 rounded-lg ${getColors()}`}>
            {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
          </div>
          {trend && (
             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${trend.startsWith('+') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                {trend.startsWith('+') ? <ArrowUp size={10}/> : <ArrowDownLeft size={10}/>} {trend}
             </span>
          )}
      </div>
      <div className="text-[24px] font-black tracking-tight leading-none mb-1 text-slate-800 dark:text-slate-100 mt-1">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-slate-500">{title}</div>
    </div>
  );
};

const RecentActivityCard = ({ title, theme, items }: { title: string, theme: 'light' | 'dark', items: any[] }) => (
  <div className={`rounded-xl border shadow-sm overflow-hidden flex flex-col h-full ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
      <h3 className="text-xs font-bold uppercase flex items-center gap-2 tracking-wide text-slate-600 dark:text-slate-300">
        <Clock3 size={16} className="text-blue-500"/> {title}
      </h3>
    </div>
    <div className="flex-1 overflow-y-auto max-h-[300px] p-2 space-y-1">
      {items.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center">
            <InboxIcon size={24} className="mb-2 opacity-50"/>
            Nenhuma atividade recente
        </div>
      ) : items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign size={14} strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold truncate text-slate-700 dark:text-slate-200">{item.clientName || 'Cliente'}</div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">{new Date(item.date).toLocaleDateString('pt-BR')} • {item.method}</div>
          </div>
          <div className="text-[12px] font-black text-emerald-600">+R$ {item.amount.toFixed(2)}</div>
        </div>
      ))}
    </div>
  </div>
);

// Ícone Auxiliar para Empty State
const InboxIcon = ({size, className}: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
);

const FilterChip = ({ active, label, theme, onClick }: { active: boolean, label: string, theme: 'light' | 'dark', onClick: () => void }) => (
  <button onClick={onClick} className={`px-3.5 py-1.5 rounded-md text-[11px] font-bold uppercase whitespace-nowrap transition-all border ${active ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : theme === 'dark' ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50' }`}>
    {label}
  </button>
);

const ActionButton = ({ onClick, theme, color, icon }: { onClick: () => void, theme: 'light' | 'dark', color: string, icon: React.ReactNode }) => {
   const getColors = () => {
    switch(color) {
      case 'blue': return theme === 'dark' ? 'text-blue-400 bg-blue-900/20 hover:bg-blue-900/40 border-blue-900/30' : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100';
      case 'emerald': return theme === 'dark' ? 'text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-900/30' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100';
      case 'amber': return theme === 'dark' ? 'text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border-amber-900/30' : 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-100';
      case 'red': return theme === 'dark' ? 'text-red-400 bg-red-900/20 hover:bg-red-900/40 border-red-900/30' : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-100';
      default: return theme === 'dark' ? 'text-slate-400 bg-slate-800/40 hover:bg-slate-800/60 border-slate-800' : 'text-slate-500 bg-slate-50 hover:bg-slate-100 border-slate-200';
    }
  };

  return (
    <button onClick={onClick} className={`p-1.5 rounded-md border transition-all active:scale-95 flex items-center justify-center ${getColors()}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
    </button>
  );
};

const FormInput = ({ theme, label, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">{label}</label>
    <input {...props} className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none transition-all focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm focus:border-blue-500 placeholder-slate-400' }`} />
  </div>
);

const ModalOverlay = ({ onClose, children, theme }: { onClose: () => void, children?: React.ReactNode, theme: 'light' | 'dark' }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="absolute inset-0" onClick={onClose}></div>
    <div className={`w-full max-w-md rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-900 border border-slate-200'}`}>
      {children}
    </div>
  </div>
);

/* --- COMPONENTES GRÁFICOS (AGORA PARTE DA PÁGINA FINANCEIRA) --- */

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

/* --- NOVA PÁGINA: FINANCEIRO (Substitui Relatórios e expande Visão Geral Financeira) --- */

const FinancialFilter = ({ month, year, setMonth, setYear, theme }) => (
  <div className={`flex gap-3 p-4 rounded-xl border mb-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="flex-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Mês de Referência</label>
      <select 
        value={month} 
        onChange={(e) => setMonth(parseInt(e.target.value))}
        className={`w-full p-2.5 rounded-md border text-xs font-bold outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
      >
        {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map((m, i) => (
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

const FinanceView = ({ clients, packages, servers, theme, selectedMonth, selectedYear }: any) => {
  const financialSummary = useMemo(() => {
    const currentMonth = selectedMonth;
    const currentYear = selectedYear;

    // 1. Receita (Pagamentos realizados NESTE mês selecionado)
    const monthlyRevenue = clients.reduce((sum: number, c: any) => {
        const paidInMonth = c.paymentHistory?.filter((h: any) => {
            const hDate = new Date(h.date);
            return hDate.getMonth() === currentMonth && hDate.getFullYear() === currentYear;
        }).reduce((pSum: number, h: any) => pSum + h.amount, 0) || 0;
        return sum + paidInMonth;
    }, 0);

    // 2. Despesas Fixas (CORRIGIDO: Custo só entra se houver pagamento no mês)
    const clientExpenses = clients.reduce((sum: number, c: any) => {
        const hasPaymentInMonth = c.paymentHistory?.some((h: any) => {
            const hDate = new Date(h.date);
            return hDate.getMonth() === currentMonth && hDate.getFullYear() === currentYear;
        });
        return sum + (hasPaymentInMonth ? (c.expenses || 0) : 0);
    }, 0);

    // 3. Despesas de Servidor (Compra de créditos no mês selecionado)
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
        return { label: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'][mIdx], value: rev };
    });

    return { monthlyRevenue, totalExpenses, profit: monthlyRevenue - totalExpenses, chartData };
  }, [clients, packages, servers, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
};

/* --- SAAS ADMIN VIEW (PAINEL DO DONO + DEVELOPER TOOLS) --- */

const SaaSAdminView = ({ 
  users, 
  theme, 
  onSimulate, 
  onDeleteUser, 
  onViewUser 
}: { 
  users: any[], 
  theme: 'light' | 'dark', 
  onSimulate: (mode: string) => void,
  onDeleteUser: (id: string) => void,
  onViewUser: (user: any) => void 
}) => {
  // Cálculo de estatísticas usando a função global
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => {
      const expiry = u.subscription_ends_at || u.trial_ends_at;
      return !checkIsExpired(expiry); // Se não está expirado, está ativo
    }).length;
    const premiumUsers = users.filter(u => u.plan_type === 'premium').length;
    const mrr = premiumUsers * 29.90;
    
    return { totalUsers, activeUsers, premiumUsers, mrr };
  }, [users]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho e Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Painel SaaS</h2>
          <p className="text-sm text-slate-500 font-medium">Gestão de Usuários Cloud</p>
        </div>
        <div className="px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-bold uppercase border border-yellow-500/20 flex items-center gap-2">
          <Crown size={14} /> Modo Admin
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="MRR Estimado" value={`R$ ${stats.mrr.toFixed(2)}`} icon={<DollarSign/>} color="emerald" theme={theme}/>
        <StatCard title="Usuários Totais" value={stats.totalUsers} icon={<Users/>} color="blue" theme={theme}/>
        <StatCard title="Assinantes Premium" value={stats.premiumUsers} icon={<Star/>} color="purple" theme={theme}/>
        <StatCard title="Ativos" value={stats.activeUsers} icon={<Activity/>} color="amber" theme={theme}/>
      </div>

      {/* Tabela de Usuários */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-xs font-bold uppercase flex items-center gap-2 tracking-wide"><Database size={16} className="text-blue-500"/> Base de Usuários Cloud</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`text-[10px] uppercase font-bold text-slate-400 tracking-widest ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <tr>
                <th className="px-6 py-3">Usuário / Email</th>
                <th className="px-6 py-3 text-center">Plano</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Entrou em</th>
                <th className="px-6 py-3 text-center">Vencimento</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className={`text-xs font-medium divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {users.map((user) => {
                const expiryDate = user.subscription_ends_at || user.trial_ends_at;
                const expired = checkIsExpired(expiryDate);
                const statusText = expired ? 'INATIVO' : 'ATIVO';
                const userName = user.full_name || user.email?.split('@')[0] || "Usuário";

                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-bold text-slate-700 dark:text-slate-200 capitalize">{userName}</div>
                      <div className="text-[10px] text-slate-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {user.plan_type === 'premium' ? 'PREMIUM' : 'TESTE'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${!expired ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className={`uppercase text-[10px] font-bold ${!expired ? 'text-emerald-500' : 'text-red-500'}`}>
                          {statusText}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center text-slate-500 font-bold">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className={`px-6 py-3 text-center font-bold ${expired ? 'text-red-400' : 'text-slate-500'}`}>
                      {expiryDate ? new Date(expiryDate).toLocaleDateString('pt-BR') : '--/--/--'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => onViewUser(user)} className="text-slate-400 hover:text-blue-500 transition-colors mr-3">
                        <Eye size={16}/>
                      </button>
                      <button 
                        onClick={() => { if(window.confirm(`Excluir o usuário ${userName}?`)) onDeleteUser(user.id) }} 
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <UserX size={16}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* --- MODAIS INICIAIS E TELA DE LOGIN --- */

const WelcomeModal = ({ theme, onClose }: { theme: 'light' | 'dark', onClose: () => void }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
    <div className="relative w-full max-w-md overflow-hidden rounded-[32px] shadow-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white border border-white/10 animate-in zoom-in-95 duration-300">
       <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full -ml-16 -mb-16 blur-3xl"></div>
       <div className="relative p-8 md:p-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-8 bg-black/20 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-1.5 rounded-lg shadow-inner">
               <Tv size={18} className="text-white" />
            </div>
            <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-80">Painel</span>
                <span className="text-xs font-black uppercase tracking-tighter">STREAM MANAGER</span>
            </div>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-3 drop-shadow-sm">Bem-vindo(a)!</h2>
          <p className="text-white/90 font-medium text-sm mb-8 leading-relaxed max-w-xs mx-auto">
            Você desbloqueou <strong className="text-yellow-300">3 dias de acesso total</strong>. Experimente agora o poder da gestão profissional.
          </p>
          <div className="w-full space-y-3 mb-8 text-left">
             <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Check size={14} strokeWidth={4}/></div>
                <span className="font-bold text-xs tracking-wide">Gestão Completa de Clientes</span>
             </div>
             <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Check size={14} strokeWidth={4}/></div>
                <span className="font-bold text-xs tracking-wide">Clientes Ilimitados</span>
             </div>
             <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Check size={14} strokeWidth={4}/></div>
                <span className="font-bold text-xs tracking-wide">Controle Financeiro & Servidores</span>
             </div>
          </div>
          <button onClick={onClose} className="w-full py-4 bg-white text-blue-700 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-blue-50 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 group">
            Começar Agora <ArrowUpRight size={16} className="group-hover:translate-x-1 transition-transform"/>
          </button>
       </div>
    </div>
  </div>
);

const AuthScreen = ({ theme }: { theme: 'light' | 'dark' }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finMonth, setFinMonth] = useState(new Date().getMonth());
  const [finYear, setFinYear] = useState(new Date().getFullYear()); 

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        else localStorage.setItem('eflixtv_new_user', 'true');
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-4 rounded-2xl mb-4 shadow-lg shadow-blue-600/20">
            <Tv size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">{PANEL_NAME}</h1>
          <p className="text-sm text-slate-400 font-medium">Controle de Assinaturas</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6">
          <button onClick={() => { setIsLogin(true); setError(null); }} className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Entrar</button>
          <button onClick={() => { setIsLogin(false); setError(null); }} className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Cadastrar</button>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Nome Completo</label>
               <div className={`flex items-center px-3 py-2.5 rounded-md border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <User size={16} className="text-slate-400 mr-2"/>
                 <input type="text" required={!isLogin} value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent border-none outline-none text-[13px] font-medium w-full" placeholder="Seu Nome"/>
               </div>
            </div>
          )}
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Email</label>
             <div className={`flex items-center px-3 py-2.5 rounded-md border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <Mail size={16} className="text-slate-400 mr-2"/>
               <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-transparent border-none outline-none text-[13px] font-medium w-full" placeholder="seu@email.com"/>
             </div>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Senha</label>
             <div className={`flex items-center px-3 py-2.5 rounded-md border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <Lock size={16} className="text-slate-400 mr-2"/>
               <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-transparent border-none outline-none text-[13px] font-medium w-full" placeholder="******"/>
             </div>
          </div>
          {error && <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold uppercase text-xs tracking-wide shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? 'Acessar Painel' : 'Criar Conta')}
          </button>
        </form>
      </div>
    </div>
  );
};

/* --- PARTE 3: MODAIS OPERACIONAIS E TELAS DE PAGAMENTO/PUBLIC --- */

const RenewalModal = ({ theme, client, packages, onRenew, onClose }: any) => {
  const [selectedPkg, setSelectedPkg] = useState('');
  return (
    <ModalOverlay theme={theme} onClose={onClose}>
       <div className="p-4 border-b bg-amber-500/10 border-amber-500/20 flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <RefreshCw size={16}/> Renovar Assinatura
        </h3>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"><X size={16}/></button>
       </div>
       <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cliente</span>
              <div className="font-bold text-slate-700 dark:text-slate-200">{client.name}</div>
          </div>
          <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Escolha o Plano de Renovação</label>
              <select className={`w-full p-3 rounded-md border outline-none text-[13px] font-medium ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 shadow-sm'}`} value={selectedPkg} onChange={(e) => setSelectedPkg(e.target.value)}>
                  <option value="">Selecione...</option>
                  {packages.map((p: any) => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
              </select>
          </div>
          <button disabled={!selectedPkg} onClick={() => onRenew(client.id, selectedPkg)} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold uppercase text-[12px] shadow-sm transition-all">
            Confirmar Renovação
          </button>
       </div>
    </ModalOverlay>
  );
}

const MessageModal = ({ theme, client, templates, onSend, onClose }: any) => {
  const [msg, setMsg] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  
  const handleGenerateAI = async () => {
      setLoadingAI(true);
      const text = await geminiService.generateRenewalMessage(client);
      setMsg(text);
      setLoadingAI(false);
  };

  return (
    <ModalOverlay theme={theme} onClose={onClose}>
       <div className="p-4 border-b bg-emerald-500/10 border-emerald-500/20 flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <MessageSquare size={16}/> Enviar Mensagem
        </h3>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"><X size={16}/></button>
       </div>
       <div className="p-5 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              <button onClick={handleGenerateAI} className="whitespace-nowrap px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-bold uppercase border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                  {loadingAI ? <Loader2 size={12} className="animate-spin"/> : <Star size={12}/>} Gerar com IA
              </button>
              {templates.map((t: any) => (
                  <button key={t.id} onClick={() => setMsg(t.body.replace(/{{nome}}/g, client.name).replace(/{{usuario}}/g, client.username).replace(/{{senha}}/g, client.password || '***').replace(/{{vencimento}}/g, new Date(client.expiresAt).toLocaleDateString('pt-BR')).replace(/{{valor}}/g, client.price.toFixed(2)))} className="whitespace-nowrap px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      {t.title}
                  </button>
              ))}
          </div>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} className={`w-full p-3 rounded-md border outline-none text-[13px] font-medium leading-relaxed h-40 resize-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Digite sua mensagem ou escolha um modelo..."></textarea>
          <button disabled={!msg} onClick={() => onSend(msg, client)} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold uppercase text-[12px] shadow-sm flex items-center justify-center gap-2 transition-all">
            <Send size={16}/> Enviar WhatsApp
          </button>
       </div>
    </ModalOverlay>
  );
}

const ClientDetailsModal = ({ theme, client, onClose }: any) => {
    return (
        <ModalOverlay theme={theme} onClose={onClose}>
           <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-sm font-bold uppercase text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <User size={16}/> Detalhes do Cliente
            </h3>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"><X size={16}/></button>
           </div>
           <div className="p-0 overflow-y-auto max-h-[70vh]">
               <div className="p-5 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Nome</span>
                           <div className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{client.name}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                           <div className={`text-[12px] font-bold uppercase ${client.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>{client.status === 'active' ? 'Ativo' : 'Bloqueado'}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Usuário</span>
                           <div className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{client.username}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Senha</span>
                           <div className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{client.password || '---'}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Telefone</span>
                           <div className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{client.phone}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Vencimento</span>
                           <div className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{new Date(client.expiresAt).toLocaleDateString('pt-BR')}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Preço</span>
                           <div className="text-[13px] font-medium text-slate-700 dark:text-slate-200">R$ {client.price?.toFixed(2)}</div>
                       </div>
                   </div>
                   
                   {client.notes && (
                       <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-md border border-amber-100 dark:border-amber-800/30 text-amber-800 dark:text-amber-200">
                           <span className="text-[10px] font-bold uppercase block mb-1 opacity-70">Observações</span>
                           <p className="text-[12px] leading-relaxed">{client.notes}</p>
                       </div>
                   )}
                   <div className="border-t dark:border-slate-800 pt-4">
                       <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest">Histórico Financeiro</h4>
                       <div className="space-y-2 max-h-40 overflow-y-auto">
                           {client.paymentHistory?.length > 0 ? client.paymentHistory.map((h: any, i: number) => (
                               <div key={i} className="flex justify-between items-center text-[12px] p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                   <div className="flex flex-col">
                                       <span className="font-bold text-emerald-600 dark:text-emerald-400">R$ {h.amount.toFixed(2)}</span>
                                       <span className="text-[10px] text-slate-400">{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                                   </div>
                                   <span className="text-[10px] font-medium uppercase px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">{h.method}</span>
                               </div>
                           )) : (
                               <p className="text-center text-[11px] text-slate-400 py-2">Sem histórico disponível.</p>
                           )}
                       </div>
                   </div>
               </div>
           </div>
        </ModalOverlay>
    );
};

const EditClientModal = ({ theme, client, packages, onEdit, onClose }: any) => {
    const [formData, setFormData] = useState({
        name: client.name, username: client.username, password: client.password, phone: client.phone,
        packageId: client.packageId || '', price: client.price, expenses: client.expenses,
        expiryDate: new Date(client.expiresAt).toISOString().split('T')[0],
        expiryTime: new Date(client.expiresAt).toTimeString().substr(0,5),
        appName: client.appName, macKey: client.macKey, notes: client.notes
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'packageId') {
            const pkg = packages.find((p: any) => p.id === value);
            if (pkg) {
                setFormData(prev => ({ ...prev, price: pkg.price, expenses: pkg.cost, packageId: value }));
            }
        }
    };

    return (
        <ModalOverlay theme={theme} onClose={onClose}>
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                <h3 className="text-sm font-bold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <Pencil size={16}/> Editar Cliente
                </h3>
                <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"><X size={16}/></button>
            </div>
            <div className="p-0 overflow-y-auto max-h-[80vh]">
                <form className="p-5 space-y-3" onSubmit={(e) => { e.preventDefault(); onEdit(formData); }}>
                   <FormInput theme={theme} name="name" label="Nome" value={formData.name} onChange={handleChange} required />
                   <div className="grid grid-cols-2 gap-3">
                       <FormInput theme={theme} name="username" label="Usuário" value={formData.username} onChange={handleChange} required />
                       <FormInput theme={theme} name="password" label="Senha" value={formData.password} onChange={handleChange} />
                   </div>
                   <FormInput theme={theme} name="phone" label="Telefone" value={formData.phone} onChange={handleChange} required />
                   <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Plano</label>
                    <select name="packageId" value={formData.packageId} onChange={handleChange} className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                      <option value="">Personalizado</option>
                      {packages.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                       <FormInput theme={theme} name="price" label="Preço (R$)" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
                       <FormInput theme={theme} name="expenses" label="Custo (R$)" type="number" step="0.01" value={formData.expenses} onChange={handleChange} required />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                       <FormInput theme={theme} name="expiryDate" label="Vencimento Data" type="date" value={formData.expiryDate} onChange={handleChange} required />
                       <FormInput theme={theme} name="expiryTime" label="Hora" type="time" value={formData.expiryTime} onChange={handleChange} />
                   </div>
                   <FormInput theme={theme} name="notes" label="Observações" value={formData.notes} onChange={handleChange} />
                   <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-bold uppercase text-[12px] shadow-sm mt-4 transition-all">Salvar Alterações</button>
                </form>
            </div>
        </ModalOverlay>
    );
};

const SubscriptionContent = ({ theme, onLogout, isBlocking, blockReason }: { theme: 'light' | 'dark', onLogout?: () => void, isBlocking?: boolean, blockReason?: 'trial_expired' | 'sub_expired' | null }) => {
  const [selectedPlanId, setSelectedPlanId] = useState('monthly');
  const plans = [
    { id: 'monthly', name: 'Mensal', price: '29,90', period: '/mês', link: STRIPE_LINKS.monthly, badge: null, months: 1 },
    { id: 'quarterly', name: 'Trimestral', price: '69,90', period: '/3 meses', link: STRIPE_LINKS.quarterly, badge: 'Recomendado', months: 3 },
    { id: 'semiannual', name: 'Semestral', price: '119,90', period: '/6 meses', link: STRIPE_LINKS.semiannual, badge: '-30% OFF', months: 6 },
    { id: 'annual', name: 'Anual', price: '199,90', period: '/ano', link: STRIPE_LINKS.annual, badge: 'Melhor Valor', months: 12 },
  ];
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  
  const handlePaymentClick = () => {
      localStorage.setItem('pending_plan_months', selectedPlan.months.toString());
  };

  return (
    <div className={`w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-white bg-white'}`}>
      <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-emerald-500 text-white p-8 md:p-12 flex flex-col relative overflow-hidden justify-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full -ml-16 -mb-16 blur-3xl"></div>
        <div className="relative z-10">
          {isBlocking ? (
             <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight">
                  {blockReason === 'trial_expired' ? "Seu teste expirou,\nassine um plano" : "Acesso Bloqueado"}
                </h2>
                <p className="text-sm opacity-90 leading-relaxed font-medium bg-black/20 p-4 rounded-lg border border-white/10 backdrop-blur-sm mb-6">
                    {blockReason === 'trial_expired' ? "Seu período de avaliação gratuita terminou. Para continuar cadastrando e gerenciando seus clientes sem perder dados, escolha seu plano." : "Identificamos uma pendência na sua assinatura. Para restabelecer seu acesso ao painel imediatamente, realize a renovação abaixo."}
                </p>
                <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md">
                         <Tv size={32} className="text-white"/>
                      </div>
                      <div>
                         <span className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-0.5">Assinatura</span>
                         <span className="text-2xl font-black text-white uppercase tracking-tight">Plano Premium</span>
                      </div>
                </div>
             </div>
          ) : (
             <div className="mb-8">
                 <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 shadow-lg border border-white/20"><Tv size={28}/></div>
                 <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Plano Premium</h2>
                 <p className="text-sm opacity-80 leading-relaxed font-medium">Desbloqueie todo o potencial do seu negócio com ferramentas avançadas de gestão.</p>
             </div>
          )}
          <div className="space-y-5">
              <div className="flex items-center gap-4"><div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10"><Check size={16} strokeWidth={3}/></div><span className="font-bold text-sm">Gestão Completa de Clientes</span></div>
              <div className="flex items-center gap-4"><div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10"><Check size={16} strokeWidth={3}/></div><span className="font-bold text-sm">Clientes Ilimitados</span></div>
              <div className="flex items-center gap-4"><div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10"><Check size={16} strokeWidth={3}/></div><span className="font-bold text-sm">Relatórios Financeiros Detalhados</span></div>
          </div>
        </div>
      </div>
      <div className={`md:w-1/2 p-8 md:p-12 flex flex-col ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">Escolha seu Plano</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Selecione a melhor opção para você</p>
            </div>
            {isBlocking && onLogout && (
              <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                  <LogOut size={12}/> Sair
              </button>
            )}
          </div>
          <div className="flex-1 space-y-3 mb-8 overflow-y-auto pr-1">
             {plans.map(plan => (
                 <div key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${selectedPlanId === plan.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700'}`}>
                    {plan.badge && (
                        <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[9px] font-bold uppercase tracking-wide rounded-full shadow-sm">{plan.badge}</div>
                    )}
                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlanId === plan.id ? 'border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                            {selectedPlanId === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                        </div>
                        <div><span className={`block text-sm font-bold uppercase ${selectedPlanId === plan.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{plan.name}</span></div>
                    </div>
                    <div className="text-right">
                        <span className={`block font-bold ${selectedPlanId === plan.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}>R$ {plan.price}</span>
                        <span className="text-[9px] font-bold uppercase text-slate-400">{plan.period}</span>
                    </div>
                 </div>
             ))}
          </div>
          <div className="mt-auto">
              <a href={selectedPlan.link} target="_blank" rel="noopener noreferrer" onClick={handlePaymentClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold uppercase text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                  <CreditCard size={18}/> Continuar para Pagamento
              </a>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <p className="text-[10px] text-slate-400 text-center mb-3 font-bold uppercase tracking-widest">Suporte Financeiro & Liberação</p>
                  <a href="https://wa.me/5585992780931?text=Ol%C3%A1%20Eron,%20tive%20um%20problema%20com%20o%20pagamento%20do%20painel." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all">
                      <Smartphone size={16} /> Fale com Eron Vasconcelos
                  </a>
              </div>
          </div>
      </div>
    </div>
  );
};

const PublicSignupScreen = ({ onSignup }: { onSignup: (data: any) => void }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', username: '' });
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
             <UserPlus size={32} className="text-white"/>
           </div>
           <h1 className="text-2xl font-black uppercase tracking-tight">Solicitar Acesso</h1>
           <p className="text-sm opacity-80 mt-2">Preencha seus dados para liberar seu teste grátis.</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSignup(formData); }}>
           <input required className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-white/30 outline-none focus:border-blue-400 transition-colors" placeholder="Seu Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           <input required className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-white/30 outline-none focus:border-blue-400 transition-colors" placeholder="WhatsApp (00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
           <input required className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-white/30 outline-none focus:border-blue-400 transition-colors" placeholder="Usuário Preferido" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
           <button type="submit" className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold uppercase tracking-wide rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 mt-4">Solicitar Agora</button>
        </form>
      </div>
    </div>
  );
};

const SaaSDetailsModal = ({ 
  user, 
  theme, 
  onClose,
  onUpdateExpiry 
}: { 
  user: any, 
  theme: 'light' | 'dark', 
  onClose: () => void,
  onUpdateExpiry: (id: string, date: string) => void
}) => {
  // Estado para a data no input
  const [newDate, setNewDate] = useState(user.subscription_ends_at || user.trial_ends_at || '');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg"><User size={20} className="text-blue-500"/></div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight dark:text-white">Perfil do Assinante SaaS</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 1. Informações de Identidade (O que tinha sumido) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Completo</span>
              <p className="text-sm font-bold dark:text-slate-200 capitalize">{user.full_name || 'Não informado'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${user.plan_type === 'premium' ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-500/10 text-slate-500'}`}>
                {user.plan_type === 'premium' ? 'PREMIUM' : 'FREE / TESTE'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail de Acesso</span>
            <p className="text-sm font-medium text-blue-500 underline">{user.email}</p>
          </div>

          {/* 2. Datas Atuais */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Entrou em</span>
              <p className="text-xs font-bold dark:text-slate-300">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vencimento Atual</span>
              <p className={`text-xs font-bold ${checkIsExpired(user.subscription_ends_at || user.trial_ends_at) ? 'text-red-500' : 'text-emerald-500'}`}>
                {user.subscription_ends_at || user.trial_ends_at 
                  ? new Date(user.subscription_ends_at || user.trial_ends_at).toLocaleDateString('pt-BR') 
                  : '--/--/--'}
              </p>
            </div>
          </div>

          {/* 3. Área de Ajuste Manual */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-3">
            <div className="flex items-center gap-2 text-blue-500">
              <Calendar size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Prorrogar Acesso</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={newDate ? newDate.split('T')[0] : ''} 
                onChange={(e) => setNewDate(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
              />
              <button 
                onClick={() => onUpdateExpiry(user.id, newDate)}
                className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase rounded-lg hover:opacity-80 transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- INÍCIO DO COMPONENTE PRINCIPAL APP ---
export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('eflixtv_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [finMonth, setFinMonth] = React.useState(new Date().getMonth());
  const [finYear, setFinYear] = React.useState(new Date().getFullYear());
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // Estados para o Painel SaaS
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]); 
  
  // 'finance' substitui 'reports' como solicitado
  const [view, setView] = useState<any>(() => {
  const savedView = localStorage.getItem('painel_ultima_view');
  return savedView || 'dashboard';
});
  
  const [selectedClientForMsg, setSelectedClientForMsg] = useState<Client | null>(null);
  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState<Client | null>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [simulationMode, setSimulationMode] = useState<'none' | 'trial_expired' | 'sub_expired' | 'payment_success'>('none'); 
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'blocked' | 'archived'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull to refresh refs and state
  const mainRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  // Estado para Toast
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // ESTADO DO FORMULÁRIO DE CADASTRO
  const [addFormData, setAddFormData] = useState({
    name: '', username: '', password: '', phone: '',
    packageId: '', price: '', expenses: '',
    expiryDate: '', expiryTime: '23:59', 
    isPaid: true,
    paymentDate: new Date().toISOString().split('T')[0], // PADRÃO: DATA DE HOJE
    notes: '', appName: '', macKey: '', serverId: '' 
  });

  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [selectedServerForCredit, setSelectedServerForCredit] = useState<Server | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');
  const notifiedIds = useRef<Set<string>>(new Set());

  // Estado Inicial
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [rules, setRules] = useState<MessageRule[]>([]);
  const [servers, setServers] = useState<Server[]>([]);


// 2. Agora o useEffect que observa as mudanças no formulário de cadastro
useEffect(() => {
    // Busca o pacote e o servidor que estão selecionados no momento no formulário
    const pkg = packages.find(p => p.id === addFormData.packageId);
    const server = servers.find(s => s.id === addFormData.serverId);
    
    if (pkg && server) {
        const unitCost = getUnitCreditCost(server);
        // Multiplica a quantidade de créditos do pacote pelo custo médio do servidor
        const autoCost = (pkg.credits_qty || 1) * unitCost;
        
        // Se o valor calculado for diferente do que já está lá, ele atualiza
        if (addFormData.expenses !== autoCost.toFixed(2)) {
            setAddFormData(prev => ({
                ...prev,
                expenses: autoCost.toFixed(2)
            }));
        }
    }
}, [addFormData.packageId, addFormData.serverId, packages, servers]);

  // Lógica para verificar retorno do Stripe e Simulações
  useEffect(() => {
    const handlePaymentReturn = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const isSimulated = simulationMode === 'payment_success';
        
        if ((urlParams.get('payment_success') === 'true' || isSimulated) && session) {
            window.history.replaceState({}, document.title, window.location.pathname);
            setShowSuccessModal(true);
            
            const pendingMonths = parseInt(localStorage.getItem('pending_plan_months') || '1');
            try {
                const newExpiry = new Date();
                newExpiry.setMonth(newExpiry.getMonth() + pendingMonths);
                
                const { error } = await supabase
                  .from('saas_customers') // <--- ALTERADO PARA SAAS
                  .update({
                      subscription_ends_at: newExpiry.toISOString(),
                      plan_type: 'premium',
                      subscription_status: 'active'
                  })
                  .eq('id', session.user.id);
                
                if (error) throw error;
                setUserProfile(prev => prev ? ({ ...prev, subscription_ends_at: newExpiry.toISOString(), plan_type: 'premium' }) : null);
                showToast(`Assinatura renovada por ${pendingMonths} mês(es) com sucesso!`);
                localStorage.removeItem('pending_plan_months');
                if (isSimulated) setSimulationMode('none');
            } catch (err) {
                console.error("Erro ao ativar assinatura:", err);
            }
        }
    };
    if (session) handlePaymentReturn();
  }, [session, simulationMode]);

  // Gestão da Sessão e Carregamento de Dados
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
      else {
        setClients([]); setPackages([]); setTemplates([]); setRules([]); setServers([]);
        setUserProfile(null); setIsLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        const userEmail = sessionData.session?.user.email;
        if (!userId) return;

        // 1. Perfil do Usuário Logado (Auth)
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (profileData) setUserProfile(profileData);

        // -----------------------------------------------------------
        // 2. BLOCO ADMIN: BUSCA CLIENTES DO SEU SAAS (PAINEL STREAM)
        // -----------------------------------------------------------
          if (userEmail === 'eronvasconcelos.br@gmail.com') {
              const { data: allSaasUsers, error: adminError } = await supabase
                  .from('saas_customers') // Tabela que criamos via SQL
                  .select('*')
                  .order('created_at', { ascending: false });

              if (adminError) {
                  console.error("Erro ao carregar Clientes SaaS:", adminError.message);
                  // Se a tabela saas_customers falhar, tentamos o fallback para profiles
                  const { data: fallbackUsers } = await supabase.from('profiles').select('*');
                  if (fallbackUsers) setAllUsers(fallbackUsers);
              } else if (allSaasUsers) {
                  // Atualiza o estado que alimenta a tabela do Painel SaaS
                  setAllUsers(allSaasUsers);
              }
          }

        // -----------------------------------------------------------
        // 3. BLOCO IPTV: BUSCA CLIENTES DE TV DO USUÁRIO LOGADO
        // -----------------------------------------------------------
        const { data: clientsData } = await supabase
            .from('clients') // <--- TABELA DE CLIENTES IPTV
            .select('*')
            .eq('user_id', userId);

        if (clientsData) {
            const mappedClients = clientsData.map((d: any) => ({
                ...d,
                paymentStatus: d.payment_status,
                packageName: d.package_name,
                packageId: d.package_id,
                serverId: d.server_id,
                expiresAt: d.expires_at,
                createdAt: d.created_at,
                paymentHistory: d.payment_history || [],
            }));
            setClients(mappedClients);
        }

        // 4. Outros dados (Pacotes, Templates, Servidores...)
        const { data: packagesData } = await supabase.from('packages').select('*').eq('user_id', userId);
        if (packagesData) setPackages(packagesData);

        const { data: templatesData } = await supabase.from('templates').select('*').eq('user_id', userId);
        if (templatesData) setTemplates(templatesData);
        
        const { data: serversData } = await supabase.from('servers').select('*').eq('user_id', userId);
        if (serversData) setServers(serversData);

    } catch (error) {
        console.error("Erro crítico ao sincronizar:", error);
        showToast("Erro na conexão com o banco.", "error");
    } finally {
        setIsLoading(false);
    }
};

const handleRefreshData = async () => {
    setIsRefreshing(true);
    await fetchAllData(true);
    setIsRefreshing(false);
    showToast("Dados atualizados com sucesso!");
};

// 2. Função de Exportação (Backup CSV)
const handleExportCSV = () => {
  if (clients.length === 0) {
      showToast("Sem dados para exportar.", "error");
      return;
  }
  const headers = "Nome,Usuario,Senha,Telefone,Vencimento,Plano,Status,Preco,Notas\n";
  const rows = clients.map(c => 
      `"${c.name}","${c.username}","${c.password || ''}","${c.phone}","${new Date(c.expiresAt).toLocaleDateString()}","${c.packageName}","${c.status}","${c.price}","${c.notes || ''}"`
  ).join("\n");

  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `backup_painel_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Backup baixado com sucesso!");
};

  useEffect(() => {
    localStorage.setItem('eflixtv_theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Persistência da tela atual no navegador
  useEffect(() => {
  localStorage.setItem('painel_ultima_view', view);
  }, [view]);

  // Lógica de Notificações
  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission().then(p => setNotificationsEnabled(p === 'granted'));
    const checkNotifications = () => {
      const now = new Date();
      const todayStr = now.toLocaleDateString('pt-BR');
      
      // Notificação de Vencimento do App
      if (userProfile && notificationsEnabled) {
          const trialEnd = new Date(userProfile.trial_ends_at);
          const subEnd = userProfile.subscription_ends_at ? new Date(userProfile.subscription_ends_at) : null;
          const expiryDate = subEnd && subEnd > trialEnd ? subEnd : trialEnd;
          const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
             const notifyId = `app-expiry-1day-${todayStr}`;
             if (!notifiedIds.current.has(notifyId)) {
                sendNotification('⚠️ Assinatura do Painel', 'Sua licença expira em 1 dia. Renove para evitar bloqueio.');
                notifiedIds.current.add(notifyId);
             }
          }
      }
      
      // Notificações de Clientes
      clients.forEach(client => {
        rules.forEach(rule => {
          if (!rule.isActive) return;
          const expiryDate = new Date(client.expiresAt);
          let targetDate = new Date(expiryDate);
          
          if (rule.type === 'before') targetDate.setDate(targetDate.getDate() - rule.days);
          else if (rule.type === 'after') targetDate.setDate(targetDate.getDate() + rule.days);
          
          if (targetDate.toLocaleDateString('pt-BR') === todayStr) {
            const [ruleH, ruleM] = rule.time.split(':').map(Number);
            const ruleDate = new Date(now);
            ruleDate.setHours(ruleH, ruleM, 0, 0);
            const diffMinutes = (ruleDate.getTime() - now.getTime()) / (1000 * 60);

            if (diffMinutes > 0 && diffMinutes <= 5) {
              const notifyId = `rule-${rule.id}-${client.id}-${todayStr}-${rule.time}`;
              if (!notifiedIds.current.has(notifyId)) {
                sendNotification('📩 Enviar Mensagem Agora!', `Faltam 5 min para enviar lembrete a ${client.name}.`);
                notifiedIds.current.add(notifyId);
              }
            }
          }
        });
      });
    };
    const interval = setInterval(checkNotifications, 30000); 
    checkNotifications();
    return () => clearInterval(interval);
  }, [clients, rules, notificationsEnabled, userProfile]);

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/5977/5977591.png' });
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ message: msg, type });
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const isExpired = (date: string) => new Date(date) < new Date();
  const handleLogout = async () => { await supabase.auth.signOut(); };

  // PULL TO REFRESH LOGIC
  const handleTouchStart = (e: React.TouchEvent) => {
      if (mainRef.current?.scrollTop === 0) {
          touchStartRef.current = e.targetTouches[0].clientY;
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      const touchY = e.targetTouches[0].clientY;
      const diff = touchY - touchStartRef.current;
      
      if (mainRef.current?.scrollTop === 0 && diff > 0) {
          setPullDistance(Math.min(diff * 0.4, 120)); // Resistance
      }
  };

  const handleTouchEnd = () => {
      if (pullDistance > 60) {
          handleRefreshData();
      }
      setPullDistance(0);
  };

  const handlePublicSignup = (data: any) => {
      const text = `Olá! Quero me cadastrar.\nNome: ${data.name}\nUsuário: ${data.username}`;
      window.location.href = `https://wa.me/5585992780931?text=${encodeURIComponent(text)}`;
  };

  const updateClientInSupabase = async (clientId: string, updates: Partial<Client>) => {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
      try {
          const { error } = await supabase.from('clients').update(updates).eq('id', clientId);
          if(error) throw error;
      } catch (err) {
          console.error("Erro ao atualizar cliente:", err);
          showToast("Erro ao salvar alterações.", "error");
      }
  };

  const handleToggleStatus = (client: Client) => {
      const newStatus = client.status === 'active' ? 'blocked' : 'active';
      updateClientInSupabase(client.id, { status: newStatus });
      if (newStatus === 'blocked') {
          sendNotification("🚫 Cliente Bloqueado", `${client.name} foi bloqueado.`);
      }
  };

  const handleTogglePayment = (client: Client) => updateClientInSupabase(client.id, { paymentStatus: client.paymentStatus === 'paid' ? 'pending' : 'paid' });

  // HANDLER ADICIONAR CLIENTE
  // --- SUBSTITUIR A FUNÇÃO handleAddClient INTEIRA ---
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    const pkg = packages.find(p => p.id === addFormData.packageId);
    
    // CORREÇÃO AQUI:
    // Se tiver pacote, usa a "credits_qty" (Quantidade de Créditos). 
    // Se não tiver essa info definida (pacote antigo), assume 1.
    const creditsToDeduct = pkg ? (pkg.credits_qty || 1) : 1;

    // 1. Validação de Créditos do Servidor (AGORA VERIFICA O CUSTO CORRETO)
    let selectedServer = null;
    if (addFormData.serverId) {
        selectedServer = servers.find(s => s.id === addFormData.serverId);
        
        // Verifica se existe o servidor E se os créditos são suficientes
        if (selectedServer) {
            if (selectedServer.credits < creditsToDeduct) {
                showToast(`Saldo insuficiente! Este pacote consome ${creditsToDeduct} créditos.`, "error");
                return; // Para tudo se não tiver saldo
            }
        }
    }
    
    // 2. Preparação dos Dados
    const expiryString = `${addFormData.expiryDate}T${addFormData.expiryTime || '23:59'}:00`;
    const expiryDateObj = new Date(expiryString);
    const dateOfPayment = addFormData.paymentDate || new Date().toISOString().split('T')[0];
  
    const newClient: Client = {
      id: crypto.randomUUID(), // O banco pode gerar, mas enviamos por garantia local
      user_id: session.user.id,
      name: addFormData.name,
      username: addFormData.username, 
      password: addFormData.password,
      status: 'active',
      paymentStatus: addFormData.isPaid ? 'paid' : 'pending',
      phone: addFormData.phone,
      packageName: pkg?.name || 'Personalizado',
      packageId: addFormData.packageId || null, 
      
      serverId: addFormData.serverId ? addFormData.serverId : null, 
      
      price: Number(addFormData.price) || 0,
      expenses: Number(addFormData.expenses) || 0,
      notes: addFormData.notes || '',
      appName: addFormData.appName || '',
      macKey: addFormData.macKey || '',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDateObj.toISOString(),
      
      paymentHistory: addFormData.isPaid ? [{ 
          id: crypto.randomUUID(), 
          amount: Number(addFormData.price), 
          date: new Date(dateOfPayment).toISOString(), 
          monthsPaid: pkg?.months || 1, 
          method: 'Cadastro' 
      }] : [],
      totalPaid: addFormData.isPaid ? Number(addFormData.price) : 0
    };
  
    try {
      // Inserção no Banco
      const { error } = await supabase.from('clients').insert([{
        user_id: newClient.user_id,
        name: newClient.name,
        username: newClient.username,
        password: newClient.password,
        status: newClient.status,
        payment_status: newClient.paymentStatus, 
        phone: newClient.phone,
        package_name: newClient.packageName,
        package_id: newClient.packageId,
        server_id: newClient.serverId, 
        price: newClient.price,
        expenses: newClient.expenses,
        notes: newClient.notes,
        app_name: newClient.appName,
        mac_key: newClient.macKey,
        created_at: newClient.createdAt,
        expires_at: newClient.expiresAt,
        payment_history: newClient.paymentHistory,
        total_paid: newClient.totalPaid
      }]);
  
      if (error) throw error;
  
      // Atualiza lista local
      setClients(prev => [...prev, newClient]);
      
      // Lógica de Desconto de Crédito (CORRIGIDA)
      if (selectedServer && session.user.id) {
          const newCredits = selectedServer.credits - creditsToDeduct;
          
          // Atualiza servidor localmente
          setServers(prev => prev.map(s => s.id === selectedServer.id ? { ...s, credits: newCredits } : s));
          
          // Atualiza no banco
          await supabase.from('servers').update({ credits: newCredits }).eq('id', selectedServer.id);
      }
  
      showToast(`Cliente cadastrado! ${creditsToDeduct} crédito(s) descontado(s).`, "success");
      setView('clients');
      
      // Limpa o formulário
      setAddFormData({
          name: '', username: '', password: '', phone: '', 
          packageId: '', price: '', expenses: '',
          expiryDate: '', expiryTime: '23:59', 
          isPaid: true, 
          paymentDate: new Date().toISOString().split('T')[0],
          notes: '', appName: '', macKey: '', serverId: ''
      });
  
    } catch (error: any) {
      console.error("Erro detalhado:", error);
      alert("ERRO DO SUPABASE:\n" + (error.message || JSON.stringify(error)));
      showToast("Erro ao sincronizar dados.", "error");
    }
  };

  const getUnitCreditCost = (server: Server) => {
    if (!server.transactions || server.transactions.length === 0) return 0;
    
    const totalSpent = server.transactions.reduce((acc, t) => acc + (Number(t.cost) || 0), 0);
    const totalCreditsBought = server.transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    
    return totalCreditsBought > 0 ? (totalSpent / totalCreditsBought) : 0;
  };

  // Função para atualizar manualmente o vencimento de um cliente SaaS
const handleUpdateSaaSExpiry = async (userId: string, newDate: string) => {
    try {
        const { error } = await supabase
            .from('saas_customers')
            .update({ subscription_ends_at: newDate })
            .eq('id', userId);

        if (error) throw error;

        // Atualiza a lista na tela imediatamente
        setAllUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, subscription_ends_at: newDate } : u
        ));
        
        // Atualiza os dados no modal que está aberto
        setSelectedClientDetails(prev => 
            prev && prev.id === userId ? { ...prev, subscription_ends_at: newDate } : prev
        );

        showToast("Vencimento atualizado com sucesso!");
    } catch (err) {
        console.error("Erro ao atualizar data:", err);
        showToast("Erro ao processar alteração.", "error");
    }
};

  // Função exclusiva para deletar usuários do seu SaaS (Painel Admin)
const handleDeleteSaaSUser = async (id: string) => {
    if(!window.confirm('Tem certeza que deseja excluir este usuário do SaaS permanentemente?')) return;

    try {
        const { error } = await supabase
            .from('saas_customers') 
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Erro Supabase:", error.message);
            showToast("Erro ao excluir no banco de dados.", "error");
            return;
        }

        // Remove da lista do Admin (allUsers) para sumir da tela na hora
        setAllUsers(prev => prev.filter(user => user.id !== id));
        showToast("Usuário do SaaS removido!");
        
    } catch(err) { 
        console.error("Erro inesperado:", err); 
        showToast("Erro ao processar exclusão.", "error");
    }
};

  const handleDeleteClient = async (id: string) => {
    if(!window.confirm('Deseja excluir este cliente de IPTV permanentemente?')) return;

    try {
        const { error } = await supabase
            .from('clients') // Alvo: Tabela de clientes de TV
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Erro ao deletar cliente:", error.message);
            showToast("Erro ao excluir do banco.", "error");
            return;
        }

        // Atualiza a lista de clientes de IPTV na tela
        setClients(prev => prev.filter(c => c.id !== id));
        showToast("Cliente de IPTV removido!");
        
    } catch(err) {
        console.error("Erro inesperado:", err);
        showToast("Erro ao processar exclusão.", "error");
    }
};

  const handleArchiveClient = async (client: Client) => {
      if(!confirm(`Deseja arquivar ${client.name}?`)) return;
      updateClientInSupabase(client.id, { status: 'archived' });
      showToast("Cliente arquivado com sucesso!");
  };

  const handleRestoreClient = async (client: Client) => {
    if (!confirm(`Deseja restaurar ${client.name}?`)) return;
    updateClientInSupabase(client.id, { status: 'active' });
    showToast("Cliente restaurado!", "success");
  };

  const handleCopyCredentials = (client: Client) => {
      const text = `📺 *SEUS DADOS DE ACESSO*\n\n👤 Usuário: ${client.username}\n🔑 Senha: ${client.password}\n📅 Vencimento: ${new Date(client.expiresAt).toLocaleDateString('pt-BR')}\n\nBom divertimento!`;
      navigator.clipboard.writeText(text).then(() => {
          showToast("Credenciais copiadas!");
      }).catch(() => {
          showToast("Erro ao copiar.", "error");
      });
  };

  const handleEditClient = async (form: any) => {
    const pkg = packages.find(p => p.id === form.packageId);
    const expiryDate = new Date(`${form.expiryDate}T${form.expiryTime || '00:00'}`);
    const updates = {
      name: form.name, phone: form.phone, username: form.username, password: form.password,
      packageName: pkg?.name || 'Personalizado', packageId: form.packageId, price: Number(form.price),
      expenses: Number(form.expenses), expiresAt: expiryDate.toISOString(), appName: form.appName, macKey: form.macKey, notes: form.notes
    };
    updateClientInSupabase(selectedClientForEdit!.id, updates);
    setSelectedClientForEdit(null);
  };

  const registerRenewal = async (clientId: string, packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;
    const client = clients.find(c => c.id === clientId);
    if(!client) return;

    const baseDate = isExpired(client.expiresAt) ? new Date() : new Date(client.expiresAt);
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + pkg.months);
    const newRecord = { id: Math.random().toString(36).substr(2,5), amount: pkg.price, date: new Date().toISOString(), monthsPaid: pkg.months, method: 'Renovação' };
    
    const updates = { 
        expiresAt: newExpiry.toISOString(), 
        paymentStatus: 'paid' as PaymentStatus, 
        totalPaid: client.totalPaid + pkg.price, 
        paymentHistory: [newRecord, ...client.paymentHistory], 
        packageName: pkg.name, 
        price: pkg.price, 
        expenses: pkg.cost 
    };

    updateClientInSupabase(clientId, updates);
    setSelectedClientForRenewal(null);
    showToast("Renovação realizada com sucesso!");
  };

  // --- CRUD GERAL ---
  const handleSavePackage = async (pkg: Package) => {
      if (!session) return;
      // Adiciona o credits_qty no objeto
      const pkgWithUser = { ...pkg, user_id: session.user.id };
      
      // Atualiza a lista local imediatamente
      if(editingPackage) {
          setPackages(prev => prev.map(p => p.id === pkg.id ? pkgWithUser : p));
          // Atualiza no banco
          await supabase.from('packages').update({
            name: pkg.name,
            price: pkg.price,
            cost: pkg.cost,
            months: pkg.months,
            credits_qty: pkg.credits_qty // SALVA A QUANTIDADE DE CRÉDITOS
          }).eq('id', pkg.id);
          setEditingPackage(null);
      } else {
          setPackages(prev => [...prev, pkgWithUser]);
          // Insere no banco
          await supabase.from('packages').insert([{
            ...pkgWithUser,
            credits_qty: pkg.credits_qty // SALVA A QUANTIDADE DE CRÉDITOS
          }]);
      }
      showToast("Plano salvo com sucesso!");
  };

  const handleDeletePackage = async (id: string) => {
      if(!confirm('Excluir plano?')) return;
      setPackages(prev => prev.filter(p => p.id !== id));
      await supabase.from('packages').delete().eq('id', id);
  };

  const handleSaveTemplate = async (tpl: MessageTemplate) => {
      if (!session) return;
      const tplWithUser = { ...tpl, user_id: session.user.id };
      setTemplates(prev => [...prev, tplWithUser]);
      await supabase.from('templates').insert([tplWithUser]);
  };

  const handleDeleteTemplate = async (id: string) => {
      setTemplates(prev => prev.filter(t => t.id !== id));
      await supabase.from('templates').delete().eq('id', id);
  };

  const handleSaveRule = async (rule: MessageRule) => {
      if (!session) return;
      const ruleWithUser = { ...rule, user_id: session.user.id };
      setRules(prev => [...prev, ruleWithUser]);
      await supabase.from('rules').insert([ruleWithUser]);
      showToast("Regra de automação salva!");
  };

  const handleDeleteRule = async (id: string) => {
      setRules(prev => prev.filter(r => r.id !== id));
      await supabase.from('rules').delete().eq('id', id);
  };

  // --- CRUD SERVIDORES (CORRIGIDO) ---
  const handleSaveServer = async (serverData: any) => {
    if (!session) return;
    // INSTRUÇÃO DO USUÁRIO: Remover créditos iniciais. Começa com 0.
    const newServer: Server = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: session.user.id,
        name: serverData.name,
        url: serverData.url,
        credits: 0, 
        transactions: []
    };
    setServers(prev => [...prev, newServer]);
    try { await supabase.from('servers').insert([newServer]); } catch(e) { console.error(e); }
  };

  const handleDeleteServer = async (id: string) => {
      if(!confirm('Excluir servidor?')) return;
      setServers(prev => prev.filter(s => s.id !== id));
      try { await supabase.from('servers').delete().eq('id', id); } catch(e) { console.error(e); }
  };

  // INSTRUÇÃO DO USUÁRIO: Adicionar data na compra de créditos
  const handleAddCredits = async (amount: number, totalCost: number, customDate: string) => {
    if (!session || !selectedServerForCredit) return;
    
    // Usa a data escolhida ou a data atual se estiver vazio
    const dateRecord = customDate ? new Date(customDate).toISOString() : new Date().toISOString();

    const transaction: CreditTransaction = {
        id: Math.random().toString(36).substr(2, 5),
        date: dateRecord, 
        amount: amount,
        cost: totalCost
    };
    
    // Adiciona a nova transação no topo da lista
    const updatedServer = { 
        ...selectedServerForCredit, 
        credits: selectedServerForCredit.credits + amount,
        transactions: [transaction, ...(selectedServerForCredit.transactions || [])]
    };
    
    setServers(prev => prev.map(s => s.id === updatedServer.id ? updatedServer : s));
    setSelectedServerForCredit(null);
    
    try { 
        await supabase.from('servers').update({ 
            credits: updatedServer.credits,
            transactions: updatedServer.transactions 
        }).eq('id', updatedServer.id); 
    } catch(e) { console.error(e); }
    
    showToast("Créditos e Data registrados com sucesso!");
  };

  const handleSimulation = (mode: string) => {
      setSimulationMode(mode as any);
      showToast(`Modo simulação: ${mode}`);
  };

  const requestPermission = async () => {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (statusFilter === 'archived') {
        return client.status === 'archived' && 
               (client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                client.username.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      if (client.status === 'archived') return false;

      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            client.username.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'expired' 
          ? isExpired(client.expiresAt) && client.status !== 'blocked'
          : client.status === statusFilter;

      const matchesPayment = paymentFilter === 'all' ? true : client.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    }).sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
  }, [clients, searchTerm, statusFilter, paymentFilter]);

  const sendWhatsApp = (template: MessageTemplate | string, client: Client) => {
    let body = typeof template === 'string' ? template : template.body.replace(/{{nome}}/g, client.name).replace(/{{usuario}}/g, client.username).replace(/{{senha}}/g, client.password || '***').replace(/{{vencimento}}/g, new Date(client.expiresAt).toLocaleDateString('pt-BR')).replace(/{{valor}}/g, client.price.toFixed(2));
    showToast("Redirecionando para WhatsApp...");
    setSelectedClientForMsg(null);
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`, '_blank');
  };

  const getMonthStatus = (client: Client, monthIndex: number, year: number) => {
    const isPaid = client.paymentHistory.some(payment => {
        const payDate = new Date(payment.date);
        const startAbsolute = payDate.getFullYear() * 12 + payDate.getMonth();
        const endAbsolute = startAbsolute + payment.monthsPaid;
        const targetAbsolute = year * 12 + monthIndex;
        return targetAbsolute >= startAbsolute && targetAbsolute < endAbsolute;
    });

    if (isPaid) return 'paid';
    const targetDate = new Date(year, monthIndex, 1);
    const createdDate = new Date(client.createdAt);
    const createdNorm = new Date(createdDate.getFullYear(), createdDate.getMonth(), 1);
    const now = new Date();
    const nowNorm = new Date(now.getFullYear(), now.getMonth(), 1);

    if (targetDate < createdNorm) return 'none'; 
    if (targetDate < nowNorm) return 'late'; 
    return 'pending'; 
  };

  const urlParams = new URLSearchParams(window.location.search);
  const isPublicSignup = urlParams.get('mode') === 'signup';
  
  const getBlockReason = () => {
      if (simulationMode === 'trial_expired' || simulationMode === 'sub_expired') return simulationMode;
      if (!userProfile) return null;
      if (session?.user?.email === 'eronvasconcelos.br@gmail.com') return null;
      
      const now = new Date();
      const trialEnd = new Date(userProfile.trial_ends_at);
      const subEnd = userProfile.subscription_ends_at ? new Date(userProfile.subscription_ends_at) : null;
      
      if (subEnd && subEnd > now) return null;
      if (trialEnd > now) return null;
      
      if (subEnd && subEnd <= now) return 'sub_expired';
      return 'trial_expired';
  };
  const currentBlockReason = useMemo(getBlockReason, [userProfile, session, simulationMode]);
  const isAccessBlocked = !!currentBlockReason;
  const isAdmin = session?.user?.email === 'eronvasconcelos.br@gmail.com';

  if (isPublicSignup) return <PublicSignupScreen onSignup={handlePublicSignup} />;
  if (!session) return <AuthScreen theme={theme} />;
  if (isAccessBlocked) {
      return (
        <div className={`fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto`}>
           {simulationMode !== 'none' && (
               <button onClick={() => setSimulationMode('none')} className="absolute top-5 left-5 z-[600] text-white bg-white/10 px-4 py-2 rounded-full text-xs font-bold">Sair da Simulação</button>
           )}
           <SubscriptionContent theme={theme} onLogout={handleLogout} isBlocking={true} blockReason={currentBlockReason} />
        </div>
      );
  }

  /* --- PARTE 5: RENDERIZAÇÃO VISUAL E ROTEAMENTO --- */

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden font-normal transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-1.5 rounded-lg shadow-lg shadow-blue-500/30">
            <Tv size={20} className="text-white" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 leading-none">
              STREAM<br/>MANAGER
          </h1>
        </div>
        
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2 hide-scrollbar">
          
          {isAdmin && (
             <SidebarItem icon={<Crown size={18} className="text-yellow-500"/>} label="Painel SaaS" active={view === 'saas_admin'} onClick={() => setView('saas_admin')} />
          )}

          <div className="pt-2 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestão</div>
          <SidebarItem icon={<LayoutDashboard size={18} className="text-blue-500"/>} label="Visão Geral" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          
          {/* NOVA ABA FINANCEIRO (Substitui Relatórios) */}
          <SidebarItem icon={<DollarSign size={18} className="text-emerald-500"/>} label="Financeiro" active={view === 'finance'} onClick={() => setView('finance')} />
          
          <SidebarItem icon={<Users size={18} className="text-orange-500"/>} label="Meus Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <SidebarItem icon={<UserPlus size={18} className="text-cyan-500"/>} label="Novo Cadastro" active={view === 'add'} onClick={() => setView('add')} />
          <SidebarItem icon={<History size={18} className="text-red-500"/>} label="Histórico" active={view === 'history'} onClick={() => setView('history')} />
          <SidebarItem icon={<ServerIcon size={18} className="text-purple-500"/>} label="Servidores" active={view === 'servers'} onClick={() => setView('servers')} />
          
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ferramentas</div>
          <SidebarItem icon={<CalendarDays size={18} className="text-emerald-500"/>} label="Automação Zap" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          <SidebarItem icon={<Layers size={18} className="text-indigo-500"/>} label="Planos e Preços" active={view === 'packages'} onClick={() => setView('packages')} />
          <SidebarItem icon={<MessageSquare size={18} className="text-emerald-500"/>} label="Mensagens" active={view === 'messages'} onClick={() => setView('messages')} />
          <SidebarItem icon={<Database size={18} className="text-slate-500"/>} label="Backup Dados" active={view === 'database'} onClick={() => setView('database')} />
          
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conta</div>
          <SidebarItem icon={<CreditCard size={18} className="text-yellow-500"/>} label="Minha Assinatura" active={view === 'subscription'} onClick={() => setView('subscription')} />
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-all">
            <span className="text-[10px] font-bold uppercase">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
            {theme === 'dark' ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-amber-400" />}
          </button>
          
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all">
            <LogOut size={16} />
            <span className="text-[11px] font-bold uppercase">Sair</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`px-5 py-3 flex items-center justify-between pt-safe shrink-0 border-b z-20 transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
          <div className="flex items-center gap-3">
             <h2 className={`text-sm font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {view === 'dashboard' && 'Visão Geral'}
              {view === 'saas_admin' && 'Painel SaaS'}
              {view === 'finance' && 'Financeiro & Lucros'}
              {view === 'history' && 'Histórico Anual'}
              {view === 'clients' && 'Gestão de Clientes'}
              {view === 'scheduling' && 'Automação'}
              {view === 'add' && 'Cadastrar Cliente'}
              {view === 'packages' && 'Gerenciar Planos'}
              {view === 'messages' && 'Modelos de Mensagem'}
              {view === 'database' && 'Segurança'}
              {view === 'servers' && 'Meus Servidores'}
              {view === 'subscription' && 'Minha Assinatura'}
            </h2>
            <div className="flex items-center gap-2">
                {userProfile && (
                     <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                         <Crown size={12} />
                         <span className="text-[9px] font-bold uppercase">
                             {isAdmin 
                                ? 'Dono / Admin' 
                                : userProfile.subscription_ends_at 
                                  ? 'Premium' 
                                  : `Teste: ${Math.max(0, Math.ceil((new Date(userProfile.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} dias`}
                         </span>
                     </div>
                )}
                <button onClick={notificationsEnabled ? () => {} : requestPermission} className={`p-1.5 rounded-md transition-colors ${notificationsEnabled ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  {notificationsEnabled ? <Bell size={16}/> : <BellOff size={16}/>}
                </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-[10px] font-bold uppercase text-slate-400">
               {session.user.user_metadata.full_name || session.user.email}
            </span>
            <button 
              onClick={handleRefreshData} 
              className={`md:hidden p-2 rounded-md border transition-all shadow-sm ${isRefreshing ? 'animate-spin bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
            >
              <RefreshCw size={16} />
            </button>
            <button 
              onClick={() => handlePublicSignup({name: '', phone: '', username: ''})} 
              className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-all shadow-sm" 
              title="Link de Cadastro"
            >
              <Share2 size={16} />
            </button>
            <button onClick={() => geminiService.analyzeBusiness(clients).then(setAiAnalysis)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-all shadow-sm">
              <TrendingUp size={16} />
            </button>
          </div>
        </header>

        <main 
          ref={mainRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto pb-32 p-4 md:p-6 hide-scrollbar bg-slate-50/50 dark:bg-slate-950 transition-all"
        >
          {/* Refresh Indicator */}
          <div style={{ height: `${pullDistance}px`, opacity: pullDistance > 0 ? 1 : 0 }} className="flex items-center justify-center overflow-hidden transition-all ease-out duration-200">
             <div className={`p-2 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 ${isRefreshing ? 'animate-spin' : ''} ${pullDistance > 60 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                {isRefreshing ? <Loader2 size={20}/> : <ArrowUp size={20} className="rotate-180"/>}
             </div>
          </div>

          <div className="max-w-6xl mx-auto space-y-5">
            
            {aiAnalysis && (
              <div className="p-4 bg-blue-600 text-white rounded-lg relative shadow-lg overflow-hidden animate-in fade-in">
                <button onClick={() => setAiAnalysis(null)} className="absolute top-2 right-2 text-white/50 hover:text-white"><X size={16}/></button>
                <h4 className="font-bold text-[10px] mb-1 uppercase tracking-widest opacity-80">Insight IA:</h4>
                <p className="text-xs leading-relaxed font-medium">{aiAnalysis}</p>
              </div>
            )}

            {/* RENDERIZAÇÃO CONDICIONAL DAS VIEWS */}
            
            {view === 'saas_admin' && isAdmin && (
              <SaaSAdminView 
                users={allUsers} 
                theme={theme} 
                onSimulate={handleSimulation}
                onDeleteUser={handleDeleteSaaSUser} // <--- ATENÇÃO: Mudamos para a função do Passo 4
                onViewUser={(user) => setSelectedClientDetails(user)} 
              />
          )}

            {view === 'subscription' && (
               <div className="flex items-center justify-center min-h-[500px]">
                  <SubscriptionContent theme={theme} />
               </div>
            )}

            {view === 'finance' && (
              <div className="space-y-6">
              <FinancialFilter 
                  month={finMonth} 
                  year={finYear} 
                  setMonth={setFinMonth} 
                  setYear={setFinYear} 
                  theme={theme} 
                />
                <FinanceView 
                  clients={clients} 
                  packages={packages} 
                  servers={servers} 
                  theme={theme} 
                  selectedMonth={finMonth} 
                  selectedYear={finYear}
                />
                </div>
            )}

            {view === 'dashboard' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard title="Total Ativos" value={clients.filter(c => c.status === 'active').length} icon={<CheckCircle/>} color="emerald" theme={theme} />
                  <StatCard title="Pagamento Pendente" value={clients.filter(c => c.paymentStatus === 'pending').length} icon={<AlertCircle/>} color="amber" theme={theme} />
                  <StatCard title="Vencidos (Hoje)" value={clients.filter(c => isExpired(c.expiresAt) && c.status === 'active').length} icon={<Clock/>} color="red" theme={theme} />
                  <StatCard title="Bloqueados" value={clients.filter(c => c.status === 'blocked').length} icon={<UserX/>} color="blue" theme={theme} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className={`rounded-lg border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-xs font-bold uppercase flex items-center gap-2 tracking-wide"><CreditCard size={16} className="text-amber-500"/> Prioridade de Cobrança</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {clients.filter(c => c.paymentStatus === 'pending' || isExpired(c.expiresAt)).slice(0, 5).map(c => (
                        <div key={c.id} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex flex-col min-w-0 pr-3">
                            <span className="font-semibold text-xs truncate">{c.name}</span>
                            <span className="text-[10px] opacity-60 font-medium uppercase mt-0.5">{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <button onClick={() => sendWhatsApp(`Olá ${c.name}, renovação pendente.`, c)} className="p-2 bg-emerald-500 text-white rounded-md shrink-0 active:scale-95 shadow-sm hover:bg-emerald-600"><MessageSquare size={14}/></button>
                        </div>
                      ))}
                      {clients.filter(c => c.paymentStatus === 'pending' || isExpired(c.expiresAt)).length === 0 && (
                          <div className="p-6 text-center text-xs text-slate-400">Nenhuma pendência hoje.</div>
                      )}
                    </div>
                  </div>
                  <RecentActivityCard title="Últimas Entradas" theme={theme} items={clients.flatMap(c => c.paymentHistory?.map(h => ({...h, clientName: c.name})) || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)} />
                </div>
              </div>
            )}

            {view === 'clients' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Buscar cliente..." className={`w-full pl-10 pr-4 py-2.5 rounded-md outline-none text-[13px] font-medium border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex flex-wrap gap-2 pb-1">
                    <FilterChip active={statusFilter === 'all' && paymentFilter === 'all'} label="Todos" theme={theme} onClick={() => { setStatusFilter('all'); setPaymentFilter('all'); }} />
                    <FilterChip active={statusFilter === 'active'} label="Ativos" theme={theme} onClick={() => setStatusFilter('active')} />
                    <FilterChip active={statusFilter === 'expired'} label="Vencidos" theme={theme} onClick={() => setStatusFilter('expired')} />
                    <FilterChip active={statusFilter === 'blocked'} label="Blocks" theme={theme} onClick={() => setStatusFilter('blocked')} />
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>
                    <FilterChip active={paymentFilter === 'paid'} label="Pagos" theme={theme} onClick={() => setPaymentFilter(paymentFilter === 'paid' ? 'all' : 'paid')} />
                    <FilterChip active={paymentFilter === 'pending'} label="Pendentes" theme={theme} onClick={() => setPaymentFilter(paymentFilter === 'pending' ? 'all' : 'pending')} />
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>
                    <FilterChip active={statusFilter === 'archived'} label="Arquivados" theme={theme} onClick={() => setStatusFilter('archived')} />
                  </div>
                </div>

                <div className="md:hidden space-y-3">
                  {filteredClients.map(c => {
                    const expired = isExpired(c.expiresAt);
                    return (
                      <div key={c.id} className={`p-4 rounded-lg border shadow-sm relative overflow-hidden transition-all active:scale-[0.99] border-l-[6px] ${c.status === 'blocked' ? 'border-l-slate-400' : expired ? 'border-l-red-500' : 'border-l-emerald-500'} ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 pr-3">
                            <h4 className="font-bold text-[15px] truncate leading-tight text-slate-900 dark:text-white">{c.name}</h4>
                            <div className="text-[11px] opacity-60 font-medium mt-0.5">{c.username}</div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => handleToggleStatus(c)} className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800' : c.status === 'archived' ? 'bg-gray-100 text-gray-500 border-gray-200' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>
                                {c.status === 'blocked' ? 'Bloqueado' : c.status === 'archived' ? 'Arquivado' : expired ? 'Vencido' : 'Ativo'}
                              </button>
                              <button onClick={() => handleTogglePayment(c)} className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30'}`}>
                                {c.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                              </button>
                          </div>
                        </div>
                        <div className="flex gap-2.5 mb-3">
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-md border dark:border-slate-800">
                              <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Vencimento</div>
                              <div className={`text-[12px] font-bold truncate ${expired && c.status === 'active' ? 'text-red-500' : ''}`}>{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</div>
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-md border dark:border-slate-800">
                              <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Pacote</div>
                              <div className="text-[12px] font-bold truncate uppercase">{c.packageName}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                          {c.status === 'archived' ? (
                            <div className="flex gap-2 justify-end w-full">
                              <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={16}/>} />
                              <ActionButton onClick={() => handleRestoreClient(c)} theme={theme} color="blue" icon={<RotateCcw size={16}/>} />
                              <ActionButton onClick={() => handleDeleteClient(c.id)} theme={theme} color="red" icon={<Trash2 size={16}/>} />
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <ActionButton onClick={() => setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={16}/>} />
                                <ActionButton onClick={() => setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={16}/>} />
                                <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={16}/>} />
                                <ActionButton onClick={() => setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={16}/>} />
                                <ActionButton onClick={() => handleArchiveClient(c)} theme={theme} color="amber" icon={<Archive size={16}/>} />
                                <ActionButton onClick={() => handleCopyCredentials(c)} theme={theme} color="slate" icon={<ClipboardCopy size={16}/>} />
                              </div>
                              <ActionButton onClick={() => handleDeleteClient(c.id)} theme={theme} color="red" icon={<Trash2 size={16}/>} />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block rounded-lg border shadow-sm overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead className={`border-b ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <tr>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Vencimento</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Plano</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Pagto</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {filteredClients.map(c => {
                          const expired = isExpired(c.expiresAt);
                          return (
                            <tr key={c.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-l-4 ${c.status === 'blocked' ? 'border-l-slate-400' : expired ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                              <td className="px-4 py-2.5">
                                <div className="flex flex-col">
                                  <span className="font-bold text-[13px]">{c.name}</span>
                                  <span className="text-[10px] opacity-60 font-medium">{c.username}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <div className={`text-[11px] font-bold ${expired && c.status === 'active' ? 'text-red-500' : ''}`}>
                                    {new Date(c.expiresAt).toLocaleDateString('pt-BR')}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-center text-[11px] font-medium uppercase">{c.packageName}</td>
                              <td className="px-4 py-2.5 text-center">
                                <button onClick={() => handleToggleStatus(c)} className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>{c.status === 'blocked' ? 'Bloqueado' : expired ? 'Vencido' : 'Ativo'}</button>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button onClick={() => handleTogglePayment(c)} className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20'}`}>{c.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}</button>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex gap-1.5 justify-end">
                                  {c.status === 'archived' ? (
                                    <>
                                      <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={14}/>} />
                                      <ActionButton onClick={() => handleRestoreClient(c)} theme={theme} color="blue" icon={<RotateCcw size={14}/>} />
                                      <ActionButton onClick={() => handleDeleteClient(c.id)} theme={theme} color="red" icon={<Trash2 size={14}/>} />
                                    </>
                                  ) : (
                                    <>
                                      <ActionButton onClick={() => setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={14}/>} />
                                      <ActionButton onClick={() => setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={14}/>} />
                                      <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={14}/>} />
                                      <ActionButton onClick={() => setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={14}/>} />
                                      <ActionButton onClick={() => handleArchiveClient(c)} theme={theme} color="amber" icon={<Archive size={14}/>} />
                                      <ActionButton onClick={() => handleCopyCredentials(c)} theme={theme} color="slate" icon={<ClipboardCopy size={16}/>} />
                                      <ActionButton onClick={() => handleDeleteClient(c.id)} theme={theme} color="red" icon={<Trash2 size={14}/>} />
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {view === 'servers' && (
              <div className="max-w-lg mx-auto space-y-4">
                 <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[13px] uppercase mb-4 text-purple-500 tracking-wide">Adicionar Servidor</h4>
                   <form className="space-y-3" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     handleSaveServer({ name: fd.get('name'), url: fd.get('url') });
                     e.currentTarget.reset();
                   }}>
                     <FormInput theme={theme} name="name" label="Nome do Servidor" placeholder="Ex: Servidor Principal" required />
                     <FormInput theme={theme} name="url" label="Link / DNS" placeholder="http://..." required />
                     <button type="submit" className="w-full bg-purple-600 text-white rounded-md font-bold uppercase text-[11px] py-3 hover:bg-purple-700 transition-colors">Salvar Servidor</button>
                   </form>
                </div>
                
                 {servers.map(s => (
                  <div key={s.id} className={`p-4 rounded-lg border relative shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-[13px] font-bold uppercase text-slate-800 dark:text-white block">{s.name}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-1"><LinkIcon size={12}/> {s.url}</div>
                        </div>
                        <button onClick={() => handleDeleteServer(s.id)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Saldo Atual</span>
                            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{s.credits}</span>
                        </div>
                        <button onClick={() => setSelectedServerForCredit(s)} className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-md text-[10px] font-bold uppercase border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center gap-2 transition-colors">
                            <Plus size={14}/> Add / Custo
                        </button>
                    </div>

                    {/* --- NOVO: HISTÓRICO DE COMPRAS DENTRO DO CARD --- */}
                    {s.transactions && s.transactions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Histórico de Compras</p>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                {s.transactions.map((t: any) => (
                                    <div key={t.id} className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {new Date(t.date).toLocaleDateString('pt-BR')}
                                        </span>
                                        <div className="flex gap-3">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">+{t.amount} Créditos</span>
                                            <span className="font-bold text-red-500">- R$ {Number(t.cost).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {view === 'messages' && (
              <div className="max-w-lg mx-auto space-y-4">
                 <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[13px] uppercase mb-4 text-emerald-500 tracking-wide">Nova Mensagem</h4>
                   <form className="space-y-3" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     handleSaveTemplate({ id: Math.random().toString(36).substr(2,9), title: (fd.get('title') as string).toUpperCase(), body: fd.get('body') as string });
                     e.currentTarget.reset();
                   }}>
                     <FormInput theme={theme} name="title" label="Título Identificador" required />
                     <textarea name="body" className={`w-full p-3 rounded-md outline-none border text-[13px] font-medium leading-relaxed ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 placeholder-slate-400'}`} rows={5} placeholder="Variáveis: {{nome}}, {{usuario}}, {{senha}}, {{vencimento}}, {{valor}}"></textarea>
                     <button type="submit" className="w-full bg-emerald-600 text-white rounded-md font-bold uppercase text-[11px] py-3 hover:bg-emerald-700">Salvar Modelo</button>
                   </form>
                </div>
                 {templates.map(t => (
                  <div key={t.id} className={`p-4 rounded-lg border relative shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="absolute top-3 right-3 text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                    <span className="text-[11px] font-bold uppercase text-blue-500 block mb-2">{t.title}</span>
                    <p className="text-[12px] italic opacity-70 leading-relaxed pr-6 line-clamp-2">"{t.body}"</p>
                  </div>
                ))}
              </div>
            )}

            {view === 'packages' && (
              <div className="max-w-lg mx-auto space-y-4">
                 <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[13px] uppercase mb-4 text-indigo-500 tracking-wide">{editingPackage ? 'Editar Plano' : 'Novo Plano'}</h4>
                   <form className="space-y-3" onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    handleSavePackage({ 
                        id: editingPackage ? editingPackage.id : Math.random().toString(36).substr(2,9), 
                        name: fd.get('name') as string, 
                        price: Number(fd.get('price')), // Preço de Venda (R$)
                        months: Number(fd.get('months')),
                        credits_qty: Number(fd.get('credits_qty')), // Apenas a Qtd de Créditos
                        cost: 0 // O custo real será calculado pelo servidor selecionado
                    });
                    e.currentTarget.reset();
                  }}>
                    <FormInput theme={theme} name="name" label="Nome do Plano" defaultValue={editingPackage?.name} placeholder="Ex: Premium 6 Meses" required />
                    
                    <div className="grid grid-cols-3 gap-3">
                        <FormInput theme={theme} name="price" label="Venda (R$)" type="number" step="0.01" defaultValue={editingPackage?.price} required />
                        <FormInput theme={theme} name="credits_qty" label="Qtd. Créditos" type="number" defaultValue={editingPackage?.credits_qty || 1} required />
                        <FormInput theme={theme} name="months" label="Duração (Meses)" type="number" defaultValue={editingPackage?.months || 1} required />
                    </div>
                    
                    <button type="submit" className="w-full bg-indigo-600 text-white rounded-md font-bold uppercase text-[11px] py-3 hover:bg-indigo-700 transition-colors">
                      {editingPackage ? 'Atualizar Plano' : 'Criar Plano'}
                    </button>
                  </form>
                </div>
                 {packages.map(p => (
                  <div key={p.id} className={`p-4 rounded-lg border relative shadow-sm flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div>
                      <div className="text-[13px] font-bold uppercase text-slate-800 dark:text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Venda: R$ {p.price.toFixed(2)} • {p.months} Mês(es)</div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setEditingPackage(p)} className="text-blue-400 hover:text-blue-600"><Edit3 size={16}/></button>
                        <button onClick={() => handleDeletePackage(p.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

             {view === 'scheduling' && (
              <div className="max-w-lg mx-auto space-y-4">
                 <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[13px] uppercase mb-4 text-emerald-500 tracking-wide">Nova Regra de Alerta</h4>
                   <form className="space-y-3" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     const type = fd.get('type') as any;
                     handleSaveRule({ id: Math.random().toString(36).substr(2,9), type: type, days: type === 'on_day' ? 0 : Number(fd.get('days')), time: fd.get('time') as string, templateId: fd.get('templateId') as string, isActive: true });
                     e.currentTarget.reset();
                   }}>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quando Enviar?</label>
                          <select name="type" className={`w-full p-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                            <option value="before">Antes do Vencimento</option>
                            <option value="on_day">No Dia do Vencimento</option>
                            <option value="after">Após o Vencimento</option>
                          </select>
                        </div>
                        <FormInput theme={theme} name="days" label="Quantos Dias?" type="number" defaultValue="3" placeholder="Se aplicável" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <FormInput theme={theme} name="time" label="Horário do Alerta" type="time" defaultValue="09:00" required />
                         <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qual Mensagem?</label>
                          <select name="templateId" className={`w-full p-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                          </select>
                        </div>
                     </div>
                     <button type="submit" className="w-full bg-emerald-600 text-white rounded-md font-bold uppercase text-[11px] py-3 hover:bg-emerald-700">Salvar Regra</button>
                   </form>
                </div>
                 {rules.map(r => (
                  <div key={r.id} className={`p-4 rounded-lg border relative shadow-sm flex items-center justify-between ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div>
                      <div className="text-[12px] font-bold uppercase text-slate-700 dark:text-slate-200">
                        {r.type === 'on_day' ? 'Dia do Vencimento' : r.type === 'before' ? `Antedência de ${r.days} dias` : `Atraso de ${r.days} dias`} • {r.time}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Modelo: {templates.find(t => t.id === r.templateId)?.title || 'Desconhecido'}</div>
                    </div>
                    <button onClick={() => handleDeleteRule(r.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            )}

            {view === 'database' && (
              <div className="max-w-lg mx-auto space-y-6 animate-in fade-in">
                <div className={`p-6 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-600 rounded-md text-white shadow-sm"><Database size={20}/></div>
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-tight">Banco de Dados Cloud</h3>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Conectado ao Supabase</p>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md flex gap-3 mb-6">
                    <CheckCircle className="text-emerald-500 shrink-0" size={18}/>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-snug">
                      Seus dados estão sendo salvos automaticamente na nuvem. Você pode acessar de qualquer dispositivo.
                    </p>
                  </div>
                  
                  <button onClick={handleRefreshData} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                      {isRefreshing ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                      {isRefreshing ? 'Sincronizando...' : 'Sincronizar Agora'}
                  </button>
                  <button onClick={handleExportCSV} className="w-full mt-3 py-3 bg-blue-600 text-white font-bold uppercase text-[11px] rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      <Download size={16} /> Backup CSV
                  </button>
                </div>
              </div>
            )}

            {view === 'add' && (
              <div className="max-w-xl mx-auto space-y-4 animate-in fade-in">
                <div className={`p-6 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-800/50">
                      <UserPlus size={20}/>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-slate-800 dark:text-white">Novo Cliente</h3>
                  </div>
                  
                  <form className="space-y-4" onSubmit={handleAddClient}>
                    {/* 1. Nome e Usuário/Senha */}
                    <FormInput theme={theme} name="name" label="Nome Completo" placeholder="Ex: João Silva" required value={addFormData.name} onChange={(e: any) => setAddFormData({...addFormData, name: e.target.value})} />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput theme={theme} name="username" label="Usuário IPTV" required value={addFormData.username} onChange={(e: any) => setAddFormData({...addFormData, username: e.target.value})} />
                      <FormInput theme={theme} name="password" label="Senha IPTV" value={addFormData.password} onChange={(e: any) => setAddFormData({...addFormData, password: e.target.value})} />
                    </div>

                    {/* 2. WhatsApp */}
                    <FormInput 
                        theme={theme} 
                        name="phone" 
                        label="WhatsApp" 
                        placeholder="Ex: 5511999999999" 
                        required 
                        value={addFormData.phone} 
                        onChange={(e: any) => setAddFormData({...addFormData, phone: e.target.value})} 
                    />

                    {/* 3. Servidor */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Servidor (Saldo)</label>
                      <select name="serverId" value={addFormData.serverId} onChange={(e: any) => setAddFormData({...addFormData, serverId: e.target.value})} className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none transition-all focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm focus:border-blue-500'}`}>
                        <option value="">-- Selecione o Servidor (Opcional) --</option>
                        {servers.map(s => (
                          <option key={s.id} value={s.id} disabled={s.credits <= 0}>
                            {s.name} — {s.credits} Créditos {s.credits <= 0 ? '(Esgotado)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Planos */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Plano</label>
                      <select name="packageId" value={addFormData.packageId} className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 shadow-sm'}`} onChange={(e) => {
                          const pkg = packages.find(p => p.id === e.target.value);
                          setAddFormData({...addFormData, packageId: e.target.value, price: pkg ? pkg.price.toString() : addFormData.price, expenses: pkg ? pkg.cost.toString() : addFormData.expenses});
                        }}>
                        <option value="">Personalizado</option>
                        {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    {/* 5. Preço e Custo */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput theme={theme} name="price" label="Preço (R$)" type="number" step="0.01" value={addFormData.price} onChange={(e: any) => setAddFormData({...addFormData, price: e.target.value})} required />
                      <FormInput 
                          theme={theme} 
                          name="expenses" 
                          label="Custo Automático (R$)" 
                          type="number" 
                          value={addFormData.expenses} 
                          readOnly // Não deixa editar manualmente
                          className="opacity-70 bg-slate-100" // Estilo visual de campo automático
                          required 
                      />
                    </div>

                    {/* 6. Vencimento Data e Hora */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput theme={theme} name="expiryDate" label="Vencimento Data" type="date" required value={addFormData.expiryDate} onChange={(e: any) => setAddFormData({...addFormData, expiryDate: e.target.value})} />
                      <FormInput theme={theme} name="expiryTime" label="Hora" type="time" value={addFormData.expiryTime} onChange={(e: any) => setAddFormData({...addFormData, expiryTime: e.target.value})} />
                    </div>

                    {/* 7. Aplicativo e Mac/Key */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput theme={theme} name="appName" label="Aplicativo" value={addFormData.appName} onChange={(e: any) => setAddFormData({...addFormData, appName: e.target.value})} />
                      <FormInput theme={theme} name="macKey" label="Mac / Key" value={addFormData.macKey} onChange={(e: any) => setAddFormData({...addFormData, macKey: e.target.value})} />
                    </div>

                    {/* 8. Pagamento e Data de Recebimento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <div 
                        className={`p-3 rounded-md border flex items-center gap-3 cursor-pointer select-none transition-all ${addFormData.isPaid ? 'bg-blue-600/10 border-blue-600/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`} 
                        onClick={() => setAddFormData({...addFormData, isPaid: !addFormData.isPaid})}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${addFormData.isPaid ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                          {addFormData.isPaid && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                        <label className="text-[11px] font-bold uppercase cursor-pointer">Pagamento já realizado?</label>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                          <Calendar size={12}/> Data do Recebimento
                        </label>
                        <input 
                          type="date" 
                          disabled={!addFormData.isPaid}
                          value={addFormData.paymentDate} 
                          onChange={(e) => setAddFormData({...addFormData, paymentDate: e.target.value})}
                          className={`w-full px-3 py-2 rounded-md border text-[13px] font-medium outline-none transition-all ${!addFormData.isPaid ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-slate-50 dark:bg-slate-800 border-blue-500/50 dark:border-blue-500/50 text-slate-800 dark:text-white shadow-sm'}`}
                        />
                      </div>
                    </div>

                    {/* 9. Observações */}
                    <FormInput theme={theme} name="notes" label="Observações (Opcional)" placeholder="Ex: TV Box Sala" value={addFormData.notes} onChange={(e: any) => setAddFormData({...addFormData, notes: e.target.value})} />
                    
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-md font-bold uppercase text-[12px] shadow-lg shadow-blue-600/20 mt-2 transition-all active:scale-[0.99]">Cadastrar Cliente</button>
                  </form>
                </div>
              </div>
            )}

            {view === 'history' && (
              <div className="space-y-4">
                  <div className={`p-0 rounded-lg border shadow-sm overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                        <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2"><History size={18} className="text-blue-500"/> Histórico Anual</h3>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 px-1 py-1">
                            <button onClick={() => setCurrentYear(currentYear - 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><ChevronLeft size={16}/></button>
                            <span className="text-xs font-bold w-12 text-center">{currentYear}</span>
                            <button onClick={() => setCurrentYear(currentYear + 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><ChevronRight size={16}/></button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className={`${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                <tr>
                                    <th className={`sticky left-0 z-10 px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>Cliente</th>
                                    {MONTHS.map(m => (
                                        <th key={m} className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center min-w-[40px]">{m}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                {clients.map(client => (
                                    <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className={`sticky left-0 z-10 px-4 py-3 border-r ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                            <div className="font-bold text-[12px] truncate max-w-[120px]">{client.name}</div>
                                            <div className="text-[9px] text-slate-400 truncate max-w-[120px]">{client.username}</div>
                                        </td>
                                        {MONTHS.map((_, index) => {
                                            const status = getMonthStatus(client, index, currentYear);
                                            return (
                                                <td key={index} className="px-2 py-3 text-center">
                                                    <div className="flex justify-center">
                                                        {status === 'paid' && <CheckCircle size={16} className="text-emerald-500 fill-emerald-500/10"/>}
                                                        {status === 'late' && <XCircle size={16} className="text-red-500 fill-red-500/10"/>}
                                                        {status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-slate-200 dark:border-slate-700"></div>}
                                                        {status === 'none' && <Minus size={12} className="text-slate-200 dark:text-slate-800"/>}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {clients.length === 0 && (
                            <div className="text-center py-12 text-slate-400 text-xs uppercase font-medium">Nenhum cliente cadastrado</div>
                        )}
                    </div>
                  </div>
              </div>
            )}

            <footer className="text-center py-4 text-[10px] text-slate-400 font-bold tracking-widest opacity-50">
               <div className="uppercase">© {currentYear} {PANEL_NAME}. Todos os direitos reservados.</div>
               <div className="mt-1">Desenvolvido por Eron Vasconcelos</div>
            </footer>

          </div>
        </main>

        <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 items-center justify-items-center py-2 z-[100] pb-safe shadow-xl transition-colors ${theme === 'dark' ? 'bg-slate-900/98 border-slate-800 backdrop-blur-xl' : 'bg-white/98 border-slate-100 backdrop-blur-xl'}`}>
          <BottomNavItem icon={<LayoutDashboard size={22}/>} label="Painel" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<DollarSign size={22}/>} label="Financ." active={view === 'finance'} onClick={() => setView('finance')} />
          
          <div className="relative flex items-center justify-center w-full h-full">
            <button onClick={() => setView('add')} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-slate-50 dark:border-slate-950 transition-all active:scale-95 z-[120]">
              <Plus size={24} />
            </button>
          </div>
          <BottomNavItem icon={<Users size={22}/>} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <div className="relative flex flex-col items-center justify-center">
              <BottomNavItem icon={<MoreHorizontal size={22}/>} label="Mais" active={['scheduling', 'packages', 'messages', 'database', 'servers', 'subscription', 'history', 'saas_admin'].includes(view)} onClick={() => setShowMobileMenu(!showMobileMenu)} />
              {showMobileMenu && (
                <div className="absolute bottom-14 right-2 bg-slate-900 rounded-lg shadow-2xl p-1.5 w-48 flex flex-col z-[110] border border-slate-800 animate-in slide-in-from-bottom-2">
                  {isAdmin && <MobileSubItem icon={<Crown size={16} className="text-yellow-500"/>} label="Painel SaaS" onClick={() => { setView('saas_admin'); setShowMobileMenu(false); }} />}
                  <MobileSubItem icon={<History size={16} className="text-white"/>} label="Histórico" onClick={() => { setView('history'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<CreditCard size={16} className="text-yellow-500"/>} label="Minha Assinatura" onClick={() => { setView('subscription'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<ServerIcon size={16} className="text-purple-500"/>} label="Servidores" onClick={() => { setView('servers'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<Database size={16} className="text-blue-500"/>} label="Banco de Dados" onClick={() => { setView('database'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<BellRing size={16} className="text-emerald-500"/>} label="Automação Zap" onClick={() => { setView('scheduling'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<Layers size={16} className="text-amber-500"/>} label="Config Planos" onClick={() => { setView('packages'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<MessageSquare size={16} className="text-emerald-500"/>} label="Mensagens" onClick={() => { setView('messages'); setShowMobileMenu(false); }} />
                  <div className="h-px bg-slate-800 my-1"></div>
                  <MobileSubItem icon={theme === 'dark' ? <Sun size={16} className="text-amber-400"/> : <Moon size={16}/>} label="Alternar Tema" onClick={() => { toggleTheme(); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<LogOut size={16} className="text-red-500"/>} label="Sair" onClick={() => { handleLogout(); setShowMobileMenu(false); }} />
                </div>
              )}
          </div>
        </nav>
      </div>
      
      {showWelcomeModal && <WelcomeModal theme={theme} onClose={() => setShowWelcomeModal(false)} />}
      {showSuccessModal && <PaymentSuccessModal theme={theme} onClose={() => setShowSuccessModal(false)} />}
      
      {selectedServerForCredit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
             <div className="bg-purple-600 px-5 py-4 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-tight">Registrar Compra</h3>
              <button onClick={() => setSelectedServerForCredit(null)} className="p-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-all"><X size={18}/></button>
            </div>
            <form className="p-5 space-y-3" onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                // Passa a data para a função
                handleAddCredits(
                    Number(fd.get('amount')), 
                    Number(fd.get('totalCost')),
                    fd.get('purchaseDate') as string
                );
            }}>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-md mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Servidor</span>
                    <div className="font-bold text-slate-800 dark:text-white">{selectedServerForCredit.name}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <FormInput theme={theme} name="amount" label="Qtd. Créditos" type="number" required autoFocus />
                    <FormInput theme={theme} name="totalCost" label="Custo Total (R$)" type="number" step="0.01" required placeholder="0.00" />
                </div>

                {/* --- NOVO CAMPO DE DATA --- */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Data da Compra</label>
                    <input 
                        type="date" 
                        name="purchaseDate"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'}`}
                    />
                </div>

                <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-md font-bold uppercase text-[12px] shadow-sm mt-2 hover:bg-purple-700 transition-colors">
                    Salvar Registro
                </button>
            </form>
          </div>
        </div>
      )}

      {selectedClientForRenewal && <RenewalModal theme={theme} client={selectedClientForRenewal} packages={packages} onRenew={registerRenewal} onClose={() => setSelectedClientForRenewal(null)} />}
      {selectedClientForMsg && <MessageModal theme={theme} client={selectedClientForMsg} templates={templates} onSend={sendWhatsApp} onClose={() => setSelectedClientForMsg(null)} />}
      {/* Lógica para escolher o modal correto (SaaS ou IPTV) */}
      {selectedClientDetails && (
        view === 'saas_admin' ? (
          <SaaSDetailsModal 
            user={selectedClientDetails} 
            theme={theme} 
            onClose={() => setSelectedClientDetails(null)} 
            onUpdateExpiry={handleUpdateSaaSExpiry} // <--- ADICIONE ESTA LINHA PARA O BOTÃO FUNCIONAR
          />
        ) : (
          <ClientDetailsModal 
            theme={theme} 
            client={selectedClientDetails} 
            onClose={() => setSelectedClientDetails(null)} 
          />
        )
      )}
      {selectedClientForEdit && <EditClientModal theme={theme} client={selectedClientForEdit} packages={packages} onEdit={handleEditClient} onClose={() => setSelectedClientForEdit(null)} />}
    </div>
  );
}