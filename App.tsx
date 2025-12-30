import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  PlusCircle, 
  Search, 
  ChevronRight,
  CheckCircle, 
  XCircle, 
  Clock,
  MessageSquare,
  DollarSign,
  TrendingUp,
  CreditCard,
  Layers,
  Trash2,
  Send,
  X,
  Activity,
  RefreshCw,
  BellRing,
  MoreHorizontal,
  Info,
  Tag,
  ArrowUpRight,
  History,
  Smartphone,
  ChevronLeft,
  UserX,
  AlertCircle,
  Clock3,
  Eye,
  CalendarDays,
  Calendar,
  Sun,
  Moon,
  Plus,
  Pencil,
  Save,
  Check,
  ChevronDown,
  UserPlus,
  Download,
  Upload,
  Database,
  ShieldAlert,
  Bell,
  BellOff,
  FileText,
  Wallet,
  Edit3,
  Loader2,
  LogOut,
  Lock,
  Mail,
  User,
  Server as ServerIcon,
  Link as LinkIcon,
  Coins,
  Tv,
  PlayCircle,
  Crown,
  Star,
  Zap,
  ShieldCheck,
  CheckSquare,
  Circle,
  Minus,
  Rocket,
  PartyPopper,
  QrCode,
  Copy,
  TestTube,
  Wrench
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Client, Package, MessageTemplate, MessageRule, ClientStatus, PaymentStatus, Server, CreditTransaction, UserProfile } from './types';
import { geminiService } from './services/geminiService';
import { supabase } from './services/supabaseClient';

const PANEL_NAME = "STREAM MANAGER";
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// --- INTEGRAÇÃO STRIPE ---
const STRIPE_LINKS = {
  monthly: "https://buy.stripe.com/test_00waEWgqsbZWfD5azM4ZG00",
  quarterly: "https://buy.stripe.com/test_3cI28q8Y07JG0Ib8rE4ZG01",
  semiannual: "https://buy.stripe.com/test_5kQ6oG1vybZW4Yr9vI4ZG02",
  annual: "https://buy.stripe.com/test_7sYcN42zCggcgH9eQ24ZG03"
};

/* COMPONENTES DE UI */

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
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white text-blue-700 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-blue-50 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
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

const StatCard = ({ title, value, icon, color, theme }: { title: string, value: string | number, icon: React.ReactNode, color: string, theme: 'light' | 'dark' }) => {
  const getColors = () => {
    switch(color) {
      case 'emerald': return theme === 'dark' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'amber': return theme === 'dark' ? 'bg-amber-900/20 text-amber-400 border-amber-900/30' : 'bg-amber-50 text-amber-600 border-amber-100';
      case 'red': return theme === 'dark' ? 'bg-red-900/20 text-red-400 border-red-900/30' : 'bg-red-50 text-red-600 border-red-100';
      case 'blue': return theme === 'dark' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' : 'bg-blue-50 text-blue-600 border-blue-100';
      default: return theme === 'dark' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };
  
  return (
    <div className={`p-3.5 rounded-lg border shadow-sm flex flex-col items-center text-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className={`w-8 h-8 flex items-center justify-center rounded-md mb-2 border ${getColors()}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
      </div>
      <div className="text-[20px] font-bold tracking-tight leading-none mb-1 text-slate-800 dark:text-slate-100">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider opacity-60">{title}</div>
    </div>
  );
};

const RecentActivityCard = ({ title, theme, items }: { title: string, theme: 'light' | 'dark', items: any[] }) => (
  <div className={`rounded-lg border shadow-sm overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
      <h3 className="text-xs font-bold uppercase flex items-center gap-2 tracking-wide"><Clock3 size={16} className="text-blue-500"/> {title}</h3>
    </div>
    <div className="flex-1 overflow-y-auto max-h-[250px] p-1 space-y-0.5">
      {items.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-xs">Nenhuma atividade recente</div>
      ) : items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign size={12} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold truncate">{item.clientName || 'Cliente'}</div>
            <div className="text-[9px] text-slate-400 uppercase">{new Date(item.date).toLocaleDateString('pt-BR')} • {item.method}</div>
          </div>
          <div className="text-[12px] font-bold text-emerald-600">+R$ {item.amount.toFixed(2)}</div>
        </div>
      ))}
    </div>
  </div>
);

const FilterChip = ({ active, label, theme, onClick }: { active: boolean, label: string, theme: 'light' | 'dark', onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-md text-[11px] font-bold uppercase whitespace-nowrap transition-all border ${
      active 
        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
        : theme === 'dark' 
          ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' 
          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
);

const ActionButton = ({ onClick, theme, color, icon }: { onClick: () => void, theme: 'light' | 'dark', color: string, icon: React.ReactNode }) => {
   const getColors = () => {
    switch(color) {
      case 'blue': return theme === 'dark' ? 'text-blue-400 bg-blue-900/20 hover:bg-blue-900/40 border-blue-900/30' : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100';
      case 'emerald': return theme === 'dark' ? 'text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 border-blue-900/30' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100';
      case 'amber': return theme === 'dark' ? 'text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border-blue-900/30' : 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-100';
      case 'red': return theme === 'dark' ? 'text-red-400 bg-red-900/20 hover:bg-red-900/40 border-blue-900/30' : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-100';
      default: return 'text-slate-500 bg-slate-100';
    }
  };
  return (
    <button onClick={onClick} className={`p-1.5 rounded-md border transition-all active:scale-95 ${getColors()}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
    </button>
  );
};

const FormInput = ({ theme, label, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">{label}</label>
    <input 
      {...props}
      className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none transition-all focus:ring-1 focus:ring-blue-500 ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 placeholder-slate-600' 
          : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm focus:border-blue-500 placeholder-slate-400'
      }`}
    />
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
                <span className="font-bold text-xs tracking-wide">Relatórios Financeiros Detalhados</span>
             </div>
             <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Check size={14} strokeWidth={4}/></div>
                <span className="font-bold text-xs tracking-wide">Sem fidelidade - Cancele quando quiser</span>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white text-blue-700 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-blue-50 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            Começar Agora <ArrowUpRight size={16} className="group-hover:translate-x-1 transition-transform"/>
          </button>
       </div>
    </div>
  </div>
);

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
              <div className="font-bold">{client.name}</div>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Escolha o Plano de Renovação</label>
             <select 
               className={`w-full p-3 rounded-md border outline-none text-[13px] font-medium ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}
               value={selectedPkg}
               onChange={(e) => setSelectedPkg(e.target.value)}
             >
                 <option value="">Selecione...</option>
                 {packages.map((p: any) => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
             </select>
          </div>
          <button 
            disabled={!selectedPkg}
            onClick={() => onRenew(client.id, selectedPkg)}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold uppercase text-[12px] shadow-sm transition-all"
          >
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
          <textarea 
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className={`w-full p-3 rounded-md border outline-none text-[13px] font-medium leading-relaxed h-40 resize-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
            placeholder="Digite sua mensagem ou escolha um modelo..."
          ></textarea>
          <button 
            disabled={!msg}
            onClick={() => onSend(msg, client)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-md font-bold uppercase text-[12px] shadow-sm flex items-center justify-center gap-2 transition-all"
          >
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
           <div className="p-0 overflow-y-auto">
               <div className="p-5 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Nome</span>
                           <div className="text-[13px] font-medium">{client.name}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                           <div className={`text-[12px] font-bold uppercase ${client.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>{client.status === 'active' ? 'Ativo' : 'Bloqueado'}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Usuário</span>
                           <div className="text-[13px] font-medium">{client.username}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Senha</span>
                           <div className="text-[13px] font-medium">{client.password || '---'}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Telefone</span>
                           <div className="text-[13px] font-medium">{client.phone}</div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Vencimento</span>
                           <div className="text-[13px] font-medium">{new Date(client.expiresAt).toLocaleDateString('pt-BR')}</div>
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
                       <div className="space-y-2">
                           {client.paymentHistory?.length > 0 ? client.paymentHistory.map((h: any, i: number) => (
                               <div key={i} className="flex justify-between items-center text-[12px] p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                   <div className="flex flex-col">
                                       <span className="font-bold">R$ {h.amount.toFixed(2)}</span>
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
        name: client.name,
        username: client.username,
        password: client.password,
        phone: client.phone,
        packageId: client.packageId || '',
        price: client.price,
        expenses: client.expenses,
        expiryDate: new Date(client.expiresAt).toISOString().split('T')[0],
        expiryTime: new Date(client.expiresAt).toTimeString().substr(0,5),
        appName: client.appName,
        macKey: client.macKey,
        notes: client.notes
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
            <div className="p-0 overflow-y-auto">
                <form className="p-5 space-y-3" onSubmit={(e) => { e.preventDefault(); onEdit(formData); }}>
                   <FormInput theme={theme} name="name" label="Nome" value={formData.name} onChange={handleChange} required />
                   <div className="grid grid-cols-2 gap-3">
                       <FormInput theme={theme} name="username" label="Usuário" value={formData.username} onChange={handleChange} required />
                       <FormInput theme={theme} name="password" label="Senha" value={formData.password} onChange={handleChange} />
                   </div>
                   <FormInput theme={theme} name="phone" label="Telefone" value={formData.phone} onChange={handleChange} required />
                   <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Plano</label>
                    <select 
                      name="packageId" 
                      value={formData.packageId}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                    >
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
                   <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-bold uppercase text-[12px] shadow-sm mt-4 transition-all">
                       Salvar Alterações
                   </button>
                </form>
            </div>
        </ModalOverlay>
    );
};

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
          email, 
          password,
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
                 <input type="text" required={!isLogin} value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent border-none outline-none text-[13px] font-medium w-full" placeholder="Seu Nome" />
               </div>
            </div>
          )}
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Email</label>
             <div className={`flex items-center px-3 py-2.5 rounded-md border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <Mail size={16} className="text-slate-400 mr-2"/>
               <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-transparent border-none outline-none text-[13px] font-medium w-full" placeholder="seu@email.com" />
             </div>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Senha</label>
             <div className={`flex items-center px-3 py-2.5 rounded-md border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <Lock size={16} className="text-slate-400 mr-2"/>
               <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-transparent border-none outline-none text-[13px] font-medium w-full" placeholder="******" />
             </div>
          </div>
          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} />{error}
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold uppercase text-xs tracking-wide shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? 'Acessar Painel' : 'Criar Conta')}
          </button>
        </form>
      </div>
    </div>
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
  const handlePaymentClick = () => localStorage.setItem('pending_plan_months', selectedPlan.months.toString());

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
                   {blockReason === 'trial_expired' 
                     ? "Seu período de avaliação gratuita terminou. Para continuar cadastrando e gerenciando seus clientes sem perder dados, escolha seu plano."
                     : "Identificamos uma pendência na sua assinatura. Para restabelecer seu acesso ao painel imediatamente, realize a renovação abaixo."}
                </p>
                <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md"><Tv size={32} className="text-white"/></div>
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
              <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10"><Check size={16} strokeWidth={3}/></div>
                  <span className="font-bold text-sm">Gestão Completa de Clientes</span>
              </div>
              <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10"><Check size={16} strokeWidth={3}/></div>
                  <span className="font-bold text-sm">Clientes Ilimitados</span>
              </div>
              <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10"><Check size={16} strokeWidth={3}/></div>
                  <span className="font-bold text-sm">Relatórios Financeiros Detalhados</span>
              </div>
              <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10"><Check size={16} strokeWidth={3}/></div>
                  <span className="font-bold text-sm">Sem fidelidade - Cancele quando quiser</span>
              </div>
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
              <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"><LogOut size={12}/> Sair</button>
            )}
          </div>
          <div className="flex-1 space-y-3 mb-8 overflow-y-auto pr-1">
             {plans.map(plan => (
                 <div key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${selectedPlanId === plan.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700'}`}>
                    {plan.badge && <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[9px] font-bold uppercase tracking-wide rounded-full shadow-sm">{plan.badge}</div>}
                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlanId === plan.id ? 'border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>{selectedPlanId === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}</div>
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
              <a href={selectedPlan.link} target="_blank" rel="noopener noreferrer" onClick={handlePaymentClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold uppercase text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"><CreditCard size={18}/> Continuar para Pagamento</a>
              <p className="text-[10px] text-slate-400 text-center mt-4 mx-auto max-w-xs leading-relaxed mb-4">Pagamento seguro processado pelo Stripe. Acesso liberado imediatamente após a confirmação.</p>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 text-center mb-3 font-bold uppercase tracking-widest">Suporte Financeiro & Liberação</p>
                  <a href="https://wa.me/5585992780931?text=Ol%C3%A1%20Eron,%20tive%20um%20problema%20com%20o%20pagamento%20do%20painel." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all"><Smartphone size={16} /> Fale com Eron Vasconcelos</a>
                  <p className="text-[9px] text-slate-400 text-center mt-2 font-medium">(85) 99278-0931</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('eflixtv_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'dashboard' | 'clients' | 'history' | 'add' | 'packages' | 'messages' | 'scheduling' | 'database' | 'servers' | 'subscription'>('dashboard');
  const [selectedClientForMsg, setSelectedClientForMsg] = useState<Client | null>(null);
  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState<Client | null>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [simulationMode, setSimulationMode] = useState<'none' | 'trial_expired' | 'sub_expired'>('none');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'blocked'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [selectedServerForCredit, setSelectedServerForCredit] = useState<Server | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');
  const notifiedIds = useRef<Set<string>>(new Set());

  // Estado para persistência do formulário de cadastro
  const [addFormData, setAddFormData] = useState(() => {
      const saved = localStorage.getItem('eflixtv_draft_add');
      return saved ? JSON.parse(saved) : {
          name: '', username: '', password: '', phone: '', packageId: '', price: '', expenses: '',
          expiryDate: '', expiryTime: '23:59', notes: '', isPaid: true
      };
  });

  // Salva rascunho do formulário ao alterar
  useEffect(() => {
      localStorage.setItem('eflixtv_draft_add', JSON.stringify(addFormData));
  }, [addFormData]);

  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [rules, setRules] = useState<MessageRule[]>([]);
  const [servers, setServers] = useState<Server[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      else setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
      else { setClients([]); setPackages([]); setTemplates([]); setRules([]); setServers([]); setUserProfile(null); setIsLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profileData) setUserProfile(profileData);
      const { data: clientsData } = await supabase.from('clients').select('*').eq('user_id', userId);
      if (clientsData) setClients(clientsData);
      const { data: packagesData } = await supabase.from('packages').select('*').eq('user_id', userId);
      if (packagesData) setPackages(packagesData);
      const { data: templatesData } = await supabase.from('templates').select('*').eq('user_id', userId);
      if (templatesData) setTemplates(templatesData);
      const { data: rulesData } = await supabase.from('rules').select('*').eq('user_id', userId);
      if (rulesData) setRules(rulesData);
      const { data: serversData } = await supabase.from('servers').select('*').eq('user_id', userId);
      if (serversData) setServers(serversData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
      setIsRefreshing(true);
      await fetchAllData(true);
      setIsRefreshing(false);
      showToast("Dados atualizados!");
  };

  useEffect(() => {
    localStorage.setItem('eflixtv_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ message: msg, type });
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const isExpired = (date: string) => new Date(date) < new Date();
  const handleLogout = () => supabase.auth.signOut();

  const updateClientInSupabase = async (clientId: string, updates: Partial<Client>) => {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
      try { await supabase.from('clients').update(updates).eq('id', clientId); } catch (err) { showToast("Erro ao salvar.", "error"); }
  };

  const handleToggleStatus = (client: Client) => updateClientInSupabase(client.id, { status: client.status === 'active' ? 'blocked' : 'active' });
  const handleTogglePayment = (client: Client) => updateClientInSupabase(client.id, { paymentStatus: client.paymentStatus === 'paid' ? 'pending' : 'paid' });

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const pkg = packages.find(p => p.id === addFormData.packageId);
    const expiryDate = new Date(`${addFormData.expiryDate}T${addFormData.expiryTime || '00:00'}`);
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: session.user.id,
      name: addFormData.name,
      username: addFormData.username,
      password: addFormData.password,
      status: 'active',
      paymentStatus: addFormData.isPaid ? 'paid' : 'pending',
      phone: addFormData.phone,
      packageName: pkg?.name || 'Personalizado',
      packageId: addFormData.packageId,
      price: Number(addFormData.price) || 0,
      expenses: Number(addFormData.expenses) || 0,
      notes: addFormData.notes || '',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      paymentHistory: addFormData.isPaid ? [{ id: Math.random().toString(36).substr(2,5), amount: Number(addFormData.price), date: new Date().toISOString(), monthsPaid: pkg?.months || 1, method: 'Cadastro' }] : [],
      totalPaid: addFormData.isPaid ? Number(addFormData.price) : 0
    };
    setClients(prev => [...prev, newClient]);
    setView('clients');
    setAddFormData({ name: '', username: '', password: '', phone: '', packageId: '', price: '', expenses: '', expiryDate: '', expiryTime: '23:59', notes: '', isPaid: true });
    localStorage.removeItem('eflixtv_draft_add');
    showToast("Cadastrado com sucesso!");
    try { await supabase.from('clients').insert([newClient]); } catch(err) { showToast("Erro de sincronia.", "error"); }
  };

  const handleDeleteClient = async (id: string) => {
      if(!confirm('Excluir?')) return;
      setClients(prev => prev.filter(c => c.id !== id));
      try { await supabase.from('clients').delete().eq('id', id); } catch(err) {}
  };

  const handleEditClient = async (form: any) => {
    const pkg = packages.find(p => p.id === form.packageId);
    const expiryDate = new Date(`${form.expiryDate}T${form.expiryTime || '00:00'}`);
    updateClientInSupabase(selectedClientForEdit!.id, {
      name: form.name, phone: form.phone, username: form.username, password: form.password,
      packageName: pkg?.name || 'Personalizado', packageId: form.packageId, price: Number(form.price),
      expenses: Number(form.expenses), expiresAt: expiryDate.toISOString(), notes: form.notes
    });
    setSelectedClientForEdit(null);
  };

  const registerRenewal = async (clientId: string, packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    const client = clients.find(c => c.id === clientId);
    if(!pkg || !client) return;
    const baseDate = isExpired(client.expiresAt) ? new Date() : new Date(client.expiresAt);
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + pkg.months);
    updateClientInSupabase(clientId, { 
        expiresAt: newExpiry.toISOString(), 
        paymentStatus: 'paid', 
        totalPaid: client.totalPaid + pkg.price, 
        paymentHistory: [{ id: Math.random().toString(36).substr(2,5), amount: pkg.price, date: new Date().toISOString(), monthsPaid: pkg.months, method: 'Renovação' }, ...client.paymentHistory]
    });
    setSelectedClientForRenewal(null);
    showToast("Renovado!");
  };

  const stats = useMemo(() => {
    return clients.reduce((acc, c) => {
      acc.totalLTV += c.totalPaid || 0;
      acc.monthlyRevenue += c.price || 0;
      acc.monthlyCosts += c.expenses || 0;
      const expired = isExpired(c.expiresAt);
      if (c.status === 'blocked') acc.blockedCount++;
      else if (expired) acc.expiredCount++;
      else acc.activeCount++;
      if (c.paymentStatus === 'pending') acc.pendingPaymentCount++;
      return acc;
    }, { totalLTV: 0, monthlyRevenue: 0, monthlyCosts: 0, activeCount: 0, expiredCount: 0, blockedCount: 0, pendingPaymentCount: 0 });
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.username.toLowerCase().includes(searchTerm.toLowerCase());
      const expired = isExpired(c.expiresAt);
      let matchesStatus = statusFilter === 'all';
      if (statusFilter === 'active') matchesStatus = c.status === 'active' && !expired;
      else if (statusFilter === 'expired') matchesStatus = c.status === 'active' && expired;
      else if (statusFilter === 'blocked') matchesStatus = c.status === 'blocked';
      return matchesSearch && matchesStatus && (paymentFilter === 'all' || c.paymentStatus === paymentFilter);
    }).sort((a, b) => sortOrder === 'asc' ? new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime() : new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
  }, [clients, searchTerm, statusFilter, paymentFilter, sortOrder]);

  const sendWhatsApp = (template: MessageTemplate | string, client: Client) => {
    let body = typeof template === 'string' ? template : template.body.replace(/{{nome}}/g, client.name).replace(/{{usuario}}/g, client.username).replace(/{{senha}}/g, client.password || '***').replace(/{{vencimento}}/g, new Date(client.expiresAt).toLocaleDateString('pt-BR')).replace(/{{valor}}/g, client.price.toFixed(2));
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`, '_blank');
  };

  const isAdmin = session?.user?.email === 'eronvasconcelos.br@gmail.com';
  const getBlockReason = () => {
      if (simulationMode !== 'none') return simulationMode;
      if (!userProfile || isAdmin) return null;
      const now = new Date();
      const trialEnd = new Date(userProfile.trial_ends_at);
      const subEnd = userProfile.subscription_ends_at ? new Date(userProfile.subscription_ends_at) : null;
      if ((subEnd && subEnd > now) || (trialEnd > now)) return null;
      return subEnd && subEnd <= now ? 'sub_expired' : 'trial_expired';
  };
  const isAccessBlocked = !!getBlockReason();

  if (isLoading) return (
    <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <Loader2 size={40} className="animate-spin text-blue-600"/>
    </div>
  );
  if (!session) return <AuthScreen theme={theme} />;
  if (isAccessBlocked) return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
       <SubscriptionContent theme={theme} onLogout={handleLogout} isBlocking={true} blockReason={getBlockReason()} />
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden transition-colors ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <aside className="w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-1.5 rounded-lg"><Tv size={20} className="text-white" /></div>
          <h1 className="text-sm font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">STREAM<br/>MANAGER</h1>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2 hide-scrollbar">
          <SidebarItem icon={<LayoutDashboard size={18} className="text-blue-500"/>} label="Visão Geral" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={18} className="text-orange-500"/>} label="Meus Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <SidebarItem icon={<UserPlus size={18} className="text-cyan-500"/>} label="Novo Cadastro" active={view === 'add'} onClick={() => setView('add')} />
          <SidebarItem icon={<History size={18} className="text-red-500"/>} label="Histórico" active={view === 'history'} onClick={() => setView('history')} />
          <SidebarItem icon={<ServerIcon size={18} className="text-purple-500"/>} label="Servidores" active={view === 'servers'} onClick={() => setView('servers')} />
          <SidebarItem icon={<CreditCard size={18} className="text-yellow-500"/>} label="Assinatura" active={view === 'subscription'} onClick={() => setView('subscription')} />
          <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configurações</div>
          <SidebarItem icon={<Layers size={18} className="text-indigo-500"/>} label="Planos" active={view === 'packages'} onClick={() => setView('packages')} />
          <SidebarItem icon={<MessageSquare size={18} className="text-emerald-500"/>} label="Mensagens" active={view === 'messages'} onClick={() => setView('messages')} />
        </nav>
        <div className="p-3 border-t dark:border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"><LogOut size={16} /><span className="text-[11px] font-bold uppercase">Sair</span></button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`px-5 py-3 flex items-center justify-between border-b transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <h2 className="text-sm font-bold uppercase">{view}</h2>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={handleRefreshData} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw size={16} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-32 p-4 md:p-6 hide-scrollbar bg-slate-50/50 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto space-y-5">
            {view === 'dashboard' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard title="Ativos" value={stats.activeCount} icon={<CheckCircle/>} color="emerald" theme={theme} />
                <StatCard title="Pendentes" value={stats.pendingPaymentCount} icon={<AlertCircle/>} color="amber" theme={theme} />
                <StatCard title="Vencidos" value={stats.expiredCount} icon={<Clock/>} color="red" theme={theme} />
                <StatCard title="LTV Total" value={`R$ ${stats.totalLTV.toFixed(0)}`} icon={<Activity/>} color="blue" theme={theme} />
              </div>
            )}

            {view === 'add' && (
               <div className="max-w-xl mx-auto">
                 <div className={`p-6 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h3 className="text-sm font-bold uppercase mb-6 pb-4 border-b dark:border-slate-800">Novo Cliente</h3>
                   <form className="space-y-4" onSubmit={handleAddClient}>
                     <FormInput theme={theme} label="Nome Completo" value={addFormData.name} onChange={(e:any) => setAddFormData({...addFormData, name: e.target.value})} required />
                     <div className="grid grid-cols-2 gap-4">
                       <FormInput theme={theme} label="Usuário" value={addFormData.username} onChange={(e:any) => setAddFormData({...addFormData, username: e.target.value})} required />
                       <FormInput theme={theme} label="Senha" value={addFormData.password} onChange={(e:any) => setAddFormData({...addFormData, password: e.target.value})} />
                     </div>
                     <FormInput theme={theme} label="WhatsApp" value={addFormData.phone} onChange={(e:any) => setAddFormData({...addFormData, phone: e.target.value})} required />
                     <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Plano</label>
                      <select value={addFormData.packageId} className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} onChange={(e) => {
                           const pkg = packages.find(p => p.id === e.target.value);
                           setAddFormData({...addFormData, packageId: e.target.value, price: pkg?.price.toString() || '', expenses: pkg?.cost.toString() || '' });
                      }}>
                        <option value="">Selecione...</option>
                        {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <FormInput theme={theme} label="Preço (R$)" type="number" step="0.01" value={addFormData.price} onChange={(e:any) => setAddFormData({...addFormData, price: e.target.value})} required />
                         <FormInput theme={theme} label="Custo (R$)" type="number" step="0.01" value={addFormData.expenses} onChange={(e:any) => setAddFormData({...addFormData, expenses: e.target.value})} required />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <FormInput theme={theme} label="Data Vencimento" type="date" value={addFormData.expiryDate} onChange={(e:any) => setAddFormData({...addFormData, expiryDate: e.target.value})} required />
                         <FormInput theme={theme} label="Hora" type="time" value={addFormData.expiryTime} onChange={(e:any) => setAddFormData({...addFormData, expiryTime: e.target.value})} />
                     </div>
                     <FormInput theme={theme} label="Observações" value={addFormData.notes} onChange={(e:any) => setAddFormData({...addFormData, notes: e.target.value})} />
                     <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-md font-bold uppercase text-[12px] shadow-lg transition-all active:scale-[0.99]">Cadastrar Cliente</button>
                   </form>
                 </div>
               </div>
            )}

            {view === 'clients' && (
              <div className="space-y-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Buscar..." className={`w-full pl-10 pr-4 py-2.5 rounded-md outline-none border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                 </div>
                 <div className="space-y-3">
                  {filteredClients.map(c => (
                    <div key={c.id} className={`p-4 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 pr-3"><h4 className="font-bold text-[15px] truncate">{c.name}</h4><div className="text-[11px] opacity-60">{c.username}</div></div>
                          <div className="flex gap-1.5"><button onClick={() => handleToggleStatus(c)} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-500 text-white'}`}>{c.status === 'blocked' ? 'Blocked' : 'Ativo'}</button></div>
                        </div>
                        <div className="flex gap-2 justify-between items-center border-t dark:border-slate-800 pt-3">
                          <div className="flex gap-2">
                             <ActionButton onClick={() => setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={16}/>} />
                             <ActionButton onClick={() => setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={16}/>} />
                             <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={16}/>} />
                             <ActionButton onClick={() => setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={16}/>} />
                          </div>
                          <ActionButton onClick={() => handleDeleteClient(c.id)} theme={theme} color="red" icon={<Trash2 size={16}/>} />
                        </div>
                    </div>
                  ))}
                 </div>
              </div>
            )}

            {view === 'subscription' && <div className="flex items-center justify-center min-h-[500px]"><SubscriptionContent theme={theme} /></div>}

            <footer className="text-center py-6 text-[10px] text-slate-400 font-bold tracking-widest opacity-60">
               <div className="uppercase mb-1.5">© {currentYear} {PANEL_NAME}. Todos os direitos reservados.</div>
               <div className="text-[11px] font-medium tracking-normal">Desenvolvido por Eron Vasconcelos</div>
            </footer>
          </div>
        </main>

        <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 items-center justify-items-center py-2 z-[100] pb-safe shadow-xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <BottomNavItem icon={<LayoutDashboard size={22}/>} label="Painel" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<Users size={22}/>} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <div className="relative"><button onClick={() => setView('add')} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-slate-50 dark:border-slate-950"><Plus size={24} /></button></div>
          <BottomNavItem icon={<History size={22}/>} label="Histórico" active={view === 'history'} onClick={() => setView('history')} />
          <BottomNavItem icon={<MoreHorizontal size={22}/>} label="Mais" active={['subscription', 'packages', 'messages'].includes(view)} onClick={() => setShowMobileMenu(!showMobileMenu)} />
          {showMobileMenu && (
             <div className="absolute bottom-14 right-2 bg-slate-900 rounded-lg shadow-2xl p-1.5 w-48 flex flex-col z-[110] border border-slate-800">
               <MobileSubItem icon={<CreditCard size={16} className="text-yellow-500"/>} label="Assinatura" onClick={() => { setView('subscription'); setShowMobileMenu(false); }} />
               <MobileSubItem icon={<Layers size={16} className="text-amber-500"/>} label="Planos" onClick={() => { setView('packages'); setShowMobileMenu(false); }} />
               <MobileSubItem icon={<MessageSquare size={16} className="text-emerald-500"/>} label="Mensagens" onClick={() => { setView('messages'); setShowMobileMenu(false); }} />
               <div className="h-px bg-slate-800 my-1"></div>
               <MobileSubItem icon={<LogOut size={16} className="text-red-500"/>} label="Sair" onClick={() => { handleLogout(); setShowMobileMenu(false); }} />
             </div>
          )}
        </nav>
      </div>
      
      {showWelcomeModal && <WelcomeModal theme={theme} onClose={() => setShowWelcomeModal(false)} />}
      {selectedClientForRenewal && <RenewalModal theme={theme} client={selectedClientForRenewal} packages={packages} onRenew={registerRenewal} onClose={() => setSelectedClientForRenewal(null)} />}
      {selectedClientForMsg && <MessageModal theme={theme} client={selectedClientForMsg} templates={templates} onSend={sendWhatsApp} onClose={() => setSelectedClientForMsg(null)} />}
      {selectedClientDetails && <ClientDetailsModal theme={theme} client={selectedClientDetails} onClose={() => setSelectedClientDetails(null)} />}
      {selectedClientForEdit && <EditClientModal theme={theme} client={selectedClientForEdit} packages={packages} onEdit={handleEditClient} onClose={() => setSelectedClientForEdit(null)} />}
    </div>
  );
}