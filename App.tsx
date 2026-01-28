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
// Certifique-se de que seus tipos (types.ts) suportam os campos novos.
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

// Novo componente para o Menu Grid (Parte do novo Modal)
const MenuIcon = ({ icon, label, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 p-2 active:scale-95 transition-transform group">
    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 transition-colors">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{label}</span>
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
          {/* 1. Informações de Identidade */}
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
  
  // 'finance' substitui 'reports'
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
  
  // ESTADO DO MENU MOBILE (MODAL MAIS)
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
    notes: '', appName: '', macKey: '', serverId: '', referredBy: ''
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

  // 1. Lista de nomes para o Dropdown
  const uniqueReferrers = useMemo(() => {
    return [...new Set(clients.map(c => c.referred_by).filter(Boolean))];
  }, [clients]);

  // 2. Cálculo Automático de Custos no Cadastro
  useEffect(() => {
    const pkg = packages.find(p => p.id === addFormData.packageId);
    const server = servers.find(s => s.id === addFormData.serverId);
    
    if (pkg && server) {
        const unitCost = getUnitCreditCost(server);
        const autoCost = (pkg.credits_qty || 1) * unitCost;
        if (addFormData.expenses !== autoCost.toFixed(2)) {
            setAddFormData(prev => ({ ...prev, expenses: autoCost.toFixed(2) }));
        }
    }
  }, [addFormData.packageId, addFormData.serverId, packages, servers]);

  // Lógica para verificar retorno do Stripe
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
                  .from('saas_customers')
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

        // 1. Perfil
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (profileData) setUserProfile(profileData);

        // 2. Admin SaaS
        if (userEmail === 'eronvasconcelos.br@gmail.com') {
              const { data: allSaasUsers } = await supabase.from('saas_customers').select('*').order('created_at', { ascending: false });
              if (allSaasUsers) setAllUsers(allSaasUsers);
        }

        // 3. Clientes IPTV
        const { data: clientsData } = await supabase.from('clients').select('*').eq('user_id', userId);
        if (clientsData) {
            const mappedClients = clientsData.map((d: any) => ({
                ...d,
                paymentStatus: d.payment_status,
                packageName: d.package_name,
                packageId: d.package_id,
                referred_by: d.referred_by,
                serverId: d.server_id,
                expiresAt: d.expires_at,
                createdAt: d.created_at,
                paymentHistory: d.payment_history || [],
            }));
            setClients(mappedClients);
        }

        // 4. Outros dados
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
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    const pkg = packages.find(p => p.id === addFormData.packageId);
    const creditsToDeduct = pkg ? (pkg.credits_qty || 1) : 1;

    // 1. Validação de Créditos
    let selectedServer = null;
    if (addFormData.serverId) {
        selectedServer = servers.find(s => s.id === addFormData.serverId);
        if (selectedServer && selectedServer.credits < creditsToDeduct) {
            showToast(`Saldo insuficiente! Este pacote consome ${creditsToDeduct} créditos.`, "error");
            return;
        }
    }
    
    const expiryString = `${addFormData.expiryDate}T${addFormData.expiryTime || '23:59'}:00`;
    const expiryDateObj = new Date(expiryString);
    const dateOfPayment = addFormData.paymentDate || new Date().toISOString().split('T')[0];
    const synchronizedDate = new Date(dateOfPayment).toISOString();
  
    const newClient: Client = {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      name: addFormData.name,
      username: addFormData.username, 
      password: addFormData.password,
      status: 'active',
      referred_by: addFormData.referredBy,
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
      createdAt: synchronizedDate,
      expiresAt: expiryDateObj.toISOString(),
      
      paymentHistory: addFormData.isPaid ? [{ 
          id: crypto.randomUUID(), 
          amount: Number(addFormData.price), 
          date: synchronizedDate, 
          monthsPaid: pkg?.months || 1, 
          method: 'Cadastro' 
      }] : [],
      totalPaid: addFormData.isPaid ? Number(addFormData.price) : 0
    };
  
    try {
      const { error } = await supabase.from('clients').insert([{
        user_id: newClient.user_id,
        name: newClient.name,
        username: newClient.username,
        password: newClient.password,
        status: newClient.status,
        referred_by: newClient.referred_by,
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

      if (newClient.expenses > 0) {
        await supabase.from('financial').insert([{
          user_id: session.user.id,
          type: 'expense',
          category: 'Painel',
          amount: newClient.expenses,
          description: `Custo de ativação: ${newClient.name}`,
          date: synchronizedDate,
          created_at: synchronizedDate
        }]);
      }
  
      setClients(prev => [...prev, newClient]);
      
      if (selectedServer && session.user.id) {
          const newCredits = selectedServer.credits - creditsToDeduct;
          setServers(prev => prev.map(s => s.id === selectedServer.id ? { ...s, credits: newCredits } : s));
          await supabase.from('servers').update({ credits: newCredits }).eq('id', selectedServer.id);
      }
  
      showToast(`Cliente cadastrado! ${creditsToDeduct} crédito(s) descontado(s).`, "success");
      setView('clients');
      
      setAddFormData({
          name: '', username: '', password: '', phone: '', 
          packageId: '', price: '', expenses: '', referredBy: '',
          expiryDate: '', expiryTime: '23:59', 
          isPaid: true, 
          paymentDate: new Date().toISOString().split('T')[0],
          notes: '', appName: '', macKey: '', serverId: ''
      });
  
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);
      showToast("Erro ao sincronizar dados.", "error");
    }
  };

  const getUnitCreditCost = (server: Server) => {
    if (!server.transactions || server.transactions.length === 0) return 0;
    
    const totalSpent = server.transactions.reduce((acc, t) => acc + (Number(t.cost) || 0), 0);
    const totalCreditsBought = server.transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    
    return totalCreditsBought > 0 ? (totalSpent / totalCreditsBought) : 0;
  };

  const handleUpdateSaaSExpiry = async (userId: string, newDate: string) => {
    try {
        const { error } = await supabase.from('saas_customers').update({ subscription_ends_at: newDate }).eq('id', userId);
        if (error) throw error;
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_ends_at: newDate } : u));
        setSelectedClientDetails(prev => prev && prev.id === userId ? { ...prev, subscription_ends_at: newDate } : prev);
        if (userProfile && userProfile.id === userId) setUserProfile(prev => prev ? { ...prev, subscription_ends_at: newDate } : prev);
        showToast("Vencimento atualizado e sincronizado!");
    } catch (err) {
        console.error("Erro ao atualizar data:", err);
        showToast("Erro ao processar alteração.", "error");
    }
  };

  const handleDeleteSaaSUser = async (id: string) => {
    if(!window.confirm('Tem certeza que deseja excluir este usuário do SaaS permanentemente?')) return;
    try {
        const { error } = await supabase.from('saas_customers').delete().eq('id', id);
        if (error) throw error;
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
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
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
      navigator.clipboard.writeText(text).then(() => showToast("Credenciais copiadas!")).catch(() => showToast("Erro ao copiar.", "error"));
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
      const pkgWithUser = { ...pkg, user_id: session.user.id };
      
      if(editingPackage) {
          setPackages(prev => prev.map(p => p.id === pkg.id ? pkgWithUser : p));
          await supabase.from('packages').update({
            name: pkg.name, price: pkg.price, cost: pkg.cost, months: pkg.months, credits_qty: pkg.credits_qty
          }).eq('id', pkg.id);
          setEditingPackage(null);
      } else {
          setPackages(prev => [...prev, pkgWithUser]);
          await supabase.from('packages').insert([{ ...pkgWithUser, credits_qty: pkg.credits_qty }]);
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

  const handleSaveServer = async (serverData: any) => {
    if (!session) return;
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

  const handleAddCredits = async (amount: number, totalCost: number, customDate: string) => {
    if (!session || !selectedServerForCredit) return;
    
    const dateRecord = customDate ? new Date(customDate).toISOString() : new Date().toISOString();
    const transaction: CreditTransaction = {
        id: Math.random().toString(36).substr(2, 5),
        date: dateRecord, 
        amount: amount,
        cost: totalCost
    };
    
    const updatedServer = { 
        ...selectedServerForCredit, 
        credits: selectedServerForCredit.credits + amount,
        transactions: [transaction, ...(selectedServerForCredit.transactions || [])]
    };
    
    setServers(prev => prev.map(s => s.id === updatedServer.id ? updatedServer : s));
    setSelectedServerForCredit(null);
    try { await supabase.from('servers').update({ credits: updatedServer.credits, transactions: updatedServer.transactions }).eq('id', updatedServer.id); } catch(e) { console.error(e); }
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

  // --- RENDERIZAÇÃO PRINCIPAL (APP) ---
  return (
    <div className={`flex min-h-screen font-sans text-sm transition-colors selection:bg-blue-500/30 ${theme === 'dark' ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* TOAST DE NOTIFICAÇÃO */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 ${toast.type === 'success' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-red-500 text-white border-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-xs uppercase tracking-wide">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:bg-white/20 p-1 rounded-full"><X size={14}/></button>
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className={`hidden lg:flex flex-col w-64 border-r fixed h-full z-40 transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Tv size={20} strokeWidth={3} />
          </div>
          <div>
            <h1 className="font-black text-base uppercase tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{PANEL_NAME}</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manager</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          <p className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 mt-2">Menu Principal</p>
          <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutGrid size={18} />} label="Visão Geral" theme={theme} />
          <NavButton active={view === 'clients'} onClick={() => setView('clients')} icon={<Users size={18} />} label="Meus Clientes" theme={theme} badge={clients.length} />
          <NavButton active={view === 'financial'} onClick={() => setView('financial')} icon={<Wallet size={18} />} label="Financeiro" theme={theme} />
          
          <p className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 mt-6">Gestão</p>
          <NavButton active={view === 'config'} onClick={() => setView('config')} icon={<Settings size={18} />} label="Configurações" theme={theme} />
          
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
               <p className="px-4 text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2">Administração</p>
               <NavButton active={view === 'admin'} onClick={() => setView('admin')} icon={<Crown size={18} />} label="Painel SaaS" theme={theme} />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 mb-3 border border-slate-100 dark:border-slate-800">
             <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold uppercase text-xs">
                {userProfile?.full_name?.substring(0,2) || 'EU'}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate dark:text-white capitalize">{userProfile?.full_name || 'Usuário'}</p>
                <p className="text-[10px] text-slate-400 truncate">{session.user.email}</p>
             </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-colors">
            <LogOut size={16} /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main 
        ref={mainRef}
        className="flex-1 lg:ml-64 h-screen overflow-y-auto overflow-x-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading Overlay Global */}
        {(isLoading || isRefreshing) && (
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 overflow-hidden z-50">
                <div className="w-full h-full bg-blue-500 animate-loading-bar"></div>
            </div>
        )}

        {/* Pull to Refresh Indicator */}
        <div className="flex justify-center transition-all duration-300 overflow-hidden" style={{ height: pullDistance > 0 ? `${pullDistance}px` : '0px' }}>
             <div className="flex items-end pb-4">
                 <Loader2 className={`animate-spin text-blue-500 ${pullDistance > 50 ? 'opacity-100' : 'opacity-0'}`} />
             </div>
        </div>

        {/* Header Mobile & Desktop */}
        <header className={`sticky top-0 z-30 px-6 py-4 border-b backdrop-blur-md flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
           <div className="flex items-center gap-4">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Menu size={20}/></button>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white hidden md:block">
                 {view === 'dashboard' ? 'Visão Geral' : view === 'clients' ? 'Gerenciar Clientes' : view === 'financial' ? 'Controle Financeiro' : view === 'config' ? 'Ajustes' : 'SaaS Admin'}
              </h2>
           </div>
           
           <div className="flex items-center gap-3">
              <button onClick={() => requestPermission()} className={`p-2.5 rounded-full transition-all relative ${notificationsEnabled ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                 <Bell size={18} />
                 {notificationsEnabled && <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-slate-950"></span>}
              </button>
              <button onClick={toggleTheme} className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                 {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              {/* Botão de Ação Rápida: Novo Cliente */}
              {view === 'clients' && (
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                      <UserPlus size={16}/> Novo Cliente
                  </button>
              )}
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
           
           {/* CONTEÚDO: DASHBOARD */}
           {view === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                  <DashboardStats clients={clients} financial={clients.reduce((acc, c) => acc + (c.paymentStatus === 'paid' ? c.price : 0), 0)} theme={theme} />
                  
                  {/* Atalhos Rápidos Dashboard */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button onClick={() => setView('clients')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500'}`}>
                          <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><UserPlus size={20}/></div>
                          <span className="text-xs font-bold uppercase">Novo Cliente</span>
                      </button>
                      <button onClick={() => setView('financial')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-500'}`}>
                          <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"><DollarSign size={20}/></div>
                          <span className="text-xs font-bold uppercase">Relatórios</span>
                      </button>
                      <button onClick={() => window.open('https://wa.me/5585992780931', '_blank')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-green-500' : 'bg-white border-slate-200 hover:border-green-500'}`}>
                          <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"><MessageCircle size={20}/></div>
                          <span className="text-xs font-bold uppercase">Suporte</span>
                      </button>
                      <button onClick={() => setView('config')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-purple-500' : 'bg-white border-slate-200 hover:border-purple-500'}`}>
                          <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"><Settings size={20}/></div>
                          <span className="text-xs font-bold uppercase">Configurar</span>
                      </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className={`p-5 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="text-xs font-bold uppercase tracking-wide flex items-center gap-2"><Clock size={16} className="text-amber-500"/> Próximos Vencimentos</h3>
                          </div>
                          <div className="space-y-3">
                              {filteredClients.filter(c => !isExpired(c.expiresAt)).slice(0, 5).map(client => (
                                  <div key={client.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center font-bold text-xs">
                                              {client.name.substring(0,1)}
                                          </div>
                                          <div>
                                              <p className="text-xs font-bold dark:text-slate-200">{client.name}</p>
                                              <p className="text-[10px] text-slate-400">{new Date(client.expiresAt).toLocaleDateString('pt-BR')}</p>
                                          </div>
                                      </div>
                                      <button onClick={() => setSelectedClientForMsg(client)} className="p-2 text-slate-400 hover:text-green-500 transition-colors"><MessageSquare size={16}/></button>
                                  </div>
                              ))}
                              {filteredClients.filter(c => !isExpired(c.expiresAt)).length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhum vencimento próximo.</p>}
                          </div>
                      </div>
                      
                      <div className={`p-5 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="text-xs font-bold uppercase tracking-wide flex items-center gap-2"><AlertCircle size={16} className="text-red-500"/> Vencidos Recentemente</h3>
                          </div>
                          <div className="space-y-3">
                              {filteredClients.filter(c => isExpired(c.expiresAt)).slice(0, 5).map(client => (
                                  <div key={client.id} className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center font-bold text-xs">!</div>
                                          <div>
                                              <p className="text-xs font-bold text-red-700 dark:text-red-400">{client.name}</p>
                                              <p className="text-[10px] text-red-400">{new Date(client.expiresAt).toLocaleDateString('pt-BR')}</p>
                                          </div>
                                      </div>
                                      <button onClick={() => setSelectedClientForRenewal(client)} className="px-3 py-1 bg-white dark:bg-slate-800 text-red-600 text-[10px] font-bold uppercase rounded shadow-sm hover:bg-red-50 transition-colors">Renovar</button>
                                  </div>
                              ))}
                              {filteredClients.filter(c => isExpired(c.expiresAt)).length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhum cliente vencido.</p>}
                          </div>
                      </div>
                  </div>
              </div>
           )}

           {/* CONTEÚDO: CLIENTES */}
           {view === 'clients' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Formulário de Cadastro Rápido */}
                  <div className={`p-6 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h3 className="text-xs font-bold uppercase tracking-wide mb-4 flex items-center gap-2"><UserPlus size={16} className="text-blue-500"/> Cadastrar Novo Cliente</h3>
                      <form onSubmit={handleAddClient} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <input required placeholder="Nome do Cliente" value={addFormData.name} onChange={e => setAddFormData({...addFormData, name: e.target.value})} className={`p-3 rounded-lg border text-xs font-medium outline-none focus:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                          <input required placeholder="WhatsApp" value={addFormData.phone} onChange={e => setAddFormData({...addFormData, phone: e.target.value})} className={`p-3 rounded-lg border text-xs font-medium outline-none focus:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                          <input required placeholder="Usuário" value={addFormData.username} onChange={e => setAddFormData({...addFormData, username: e.target.value})} className={`p-3 rounded-lg border text-xs font-medium outline-none focus:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                          <input placeholder="Senha" value={addFormData.password} onChange={e => setAddFormData({...addFormData, password: e.target.value})} className={`p-3 rounded-lg border text-xs font-medium outline-none focus:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                          
                          <select value={addFormData.packageId} onChange={e => {
                               const pkg = packages.find(p => p.id === e.target.value);
                               if(pkg) setAddFormData({...addFormData, packageId: e.target.value, price: pkg.price.toFixed(2)});
                          }} className={`p-3 rounded-lg border text-xs font-medium outline-none focus:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                              <option value="">Selecione o Plano...</option>
                              {packages.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>)}
                          </select>
                          
                          <select value={addFormData.serverId} onChange={e => setAddFormData({...addFormData, serverId: e.target.value})} className={`p-3 rounded-lg border text-xs font-medium outline-none focus:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                              <option value="">Selecione Servidor...</option>
                              {servers.map(s => <option key={s.id} value={s.id}>{s.name} (Créditos: {s.credits})</option>)}
                          </select>

                          <div className="flex gap-2">
                              <input type="date" required value={addFormData.expiryDate} onChange={e => setAddFormData({...addFormData, expiryDate: e.target.value})} className={`w-2/3 p-3 rounded-lg border text-xs font-medium outline-none focus:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                              <input type="time" value={addFormData.expiryTime} onChange={e => setAddFormData({...addFormData, expiryTime: e.target.value})} className={`w-1/3 p-3 rounded-lg border text-xs font-medium outline-none focus:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                          </div>

                          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs tracking-wide rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                             <Check size={16}/> Salvar Cliente
                          </button>
                      </form>
                  </div>

                  {/* Lista de Clientes */}
                  <ClientList 
                    clients={filteredClients} 
                    theme={theme} 
                    onViewDetails={setSelectedClientDetails}
                    onRenew={setSelectedClientForRenewal}
                    onEdit={setSelectedClientForEdit}
                    onMessage={setSelectedClientForMsg}
                    onToggleStatus={handleToggleStatus}
                    onTogglePayment={handleTogglePayment}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    paymentFilter={paymentFilter}
                    setPaymentFilter={setPaymentFilter}
                    onDelete={handleDeleteClient}
                    onArchive={handleArchiveClient}
                    onRestore={handleRestoreClient}
                    onCopy={handleCopyCredentials}
                    months={MONTHS}
                    currentYear={currentYear}
                    setCurrentYear={setCurrentYear}
                    getMonthStatus={getMonthStatus}
                  />
              </div>
           )}

           {/* CONTEÚDO: FINANCEIRO */}
           {view === 'financial' && (
              <>
                <FinancialFilter month={finMonth} year={finYear} setMonth={setFinMonth} setYear={setFinYear} theme={theme} />
                <FinanceView clients={clients} packages={packages} servers={servers} theme={theme} selectedMonth={finMonth} selectedYear={finYear} />
              </>
           )}

           {/* CONTEÚDO: CONFIGURAÇÕES */}
           {view === 'config' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                  <ConfigurationPanel 
                     packages={packages} 
                     templates={templates} 
                     rules={rules} 
                     theme={theme}
                     onSavePackage={handleSavePackage}
                     onDeletePackage={handleDeletePackage}
                     onSaveTemplate={handleSaveTemplate}
                     onDeleteTemplate={handleDeleteTemplate}
                     onSaveRule={handleSaveRule}
                     onDeleteRule={handleDeleteRule}
                     servers={servers}
                     onSaveServer={handleSaveServer}
                     onDeleteServer={handleDeleteServer}
                     onSelectServerForCredit={setSelectedServerForCredit}
                  />
                  <div className="pt-8 border-t dark:border-slate-800">
                      <h3 className="text-lg font-black uppercase tracking-tight mb-4 dark:text-white">Meu Plano</h3>
                      <SubscriptionContent theme={theme} />
                  </div>
              </div>
           )}

           {/* CONTEÚDO: SAAS ADMIN (APENAS ERON) */}
           {view === 'admin' && isAdmin && (
              <SaaSAdminView 
                 users={allUsers} 
                 theme={theme} 
                 onSimulate={handleSimulation} 
                 onDeleteUser={handleDeleteSaaSUser}
                 onViewUser={setSelectedClientDetails}
              />
           )}
        </div>
      </main>

      {/* MOBILE MENU OVERLAY */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden flex" onClick={() => setShowMobileMenu(false)}>
           <div className={`w-3/4 max-w-xs h-full p-6 shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8">
                  <h2 className="font-black uppercase tracking-tight text-xl dark:text-white">Menu</h2>
                  <button onClick={() => setShowMobileMenu(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X size={20}/></button>
               </div>
               <nav className="flex-1 space-y-2">
                  <NavButton active={view === 'dashboard'} onClick={() => { setView('dashboard'); setShowMobileMenu(false); }} icon={<LayoutGrid size={18} />} label="Visão Geral" theme={theme} />
                  <NavButton active={view === 'clients'} onClick={() => { setView('clients'); setShowMobileMenu(false); }} icon={<Users size={18} />} label="Clientes" theme={theme} />
                  <NavButton active={view === 'financial'} onClick={() => { setView('financial'); setShowMobileMenu(false); }} icon={<Wallet size={18} />} label="Financeiro" theme={theme} />
                  <NavButton active={view === 'config'} onClick={() => { setView('config'); setShowMobileMenu(false); }} icon={<Settings size={18} />} label="Configurações" theme={theme} />
                  {isAdmin && <NavButton active={view === 'admin'} onClick={() => { setView('admin'); setShowMobileMenu(false); }} icon={<Crown size={18} />} label="Admin SaaS" theme={theme} />}
               </nav>
               <button onClick={handleLogout} className="mt-auto w-full py-3 rounded-lg bg-red-50 text-red-600 font-bold uppercase text-xs flex items-center justify-center gap-2">
                   <LogOut size={16}/> Sair
               </button>
           </div>
        </div>
      )}

      {/* MODAIS (Renderizados Condicionalmente) */}
      {showWelcomeModal && <WelcomeModal theme={theme} onClose={() => setShowWelcomeModal(false)} />}
      
      {showSuccessModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl max-w-sm text-center shadow-2xl animate-bounce-in">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-emerald-500/40"><Check size={32} strokeWidth={4}/></div>
                <h2 className="text-2xl font-black uppercase text-slate-800 dark:text-white mb-2">Pagamento Confirmado!</h2>
                <p className="text-slate-500 font-medium mb-6">Sua assinatura foi renovada e todas as funcionalidades estão liberadas.</p>
                <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase rounded-lg">Continuar</button>
            </div>
        </div>
      )}

      {selectedClientForRenewal && (
         <RenewalModal theme={theme} client={selectedClientForRenewal} packages={packages} onRenew={registerRenewal} onClose={() => setSelectedClientForRenewal(null)} />
      )}
      
      {selectedClientForMsg && (
         <MessageModal theme={theme} client={selectedClientForMsg} templates={templates} onSend={sendWhatsApp} onClose={() => setSelectedClientForMsg(null)} />
      )}
      
      {selectedClientDetails && (
         isAdmin && view === 'admin' 
         ? <SaaSDetailsModal user={selectedClientDetails} theme={theme} onClose={() => setSelectedClientDetails(null)} onUpdateExpiry={handleUpdateSaaSExpiry} />
         : <ClientDetailsModal theme={theme} client={selectedClientDetails} onClose={() => setSelectedClientDetails(null)} />
      )}
      
      {selectedClientForEdit && (
         <EditClientModal theme={theme} client={selectedClientForEdit} packages={packages} onEdit={handleEditClient} onClose={() => setSelectedClientForEdit(null)} />
      )}

      {selectedServerForCredit && (
        <ModalOverlay theme={theme} onClose={() => setSelectedServerForCredit(null)}>
           <div className="p-4 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
             <h3 className="font-bold uppercase text-slate-700 dark:text-white">Adicionar Créditos</h3>
             <button onClick={() => setSelectedServerForCredit(null)}><X size={18} className="text-slate-400"/></button>
           </div>
           <div className="p-5">
              <p className="text-xs text-slate-500 mb-4">Adicionando ao servidor: <strong>{selectedServerForCredit.name}</strong></p>
              <form onSubmit={(e: any) => {
                  e.preventDefault();
                  const qtd = Number(e.target.qtd.value);
                  const cust = Number(e.target.cust.value);
                  const dt = e.target.dt.value;
                  handleAddCredits(qtd, cust, dt);
              }} className="space-y-4">
                  <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Quantidade</label>
                      <input name="qtd" type="number" required className={`w-full p-2.5 rounded border outline-none text-xs font-bold ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} placeholder="Ex: 10" />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Custo Total (R$)</label>
                      <input name="cust" type="number" step="0.01" required className={`w-full p-2.5 rounded border outline-none text-xs font-bold ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} placeholder="Ex: 150.00" />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Data da Compra</label>
                      <input name="dt" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className={`w-full p-2.5 rounded border outline-none text-xs font-bold ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} />
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs rounded-lg">Confirmar Créditos</button>
              </form>
           </div>
        </ModalOverlay>
      )}

    </div>
  );
}

// Helper Button Component para Sidebar
const NavButton = ({ active, onClick, icon, label, theme, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
     <div className="flex items-center gap-3">
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
     </div>
     {badge > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{badge}</span>}
  </button>
);