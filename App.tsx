
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
// Links de Pagamento configurados
const STRIPE_LINKS = {
  monthly: "https://buy.stripe.com/test_00waEWgqsbZWfD5azM4ZG00",
  quarterly: "https://buy.stripe.com/test_3cI28q8Y07JG0Ib8rE4ZG01",
  semiannual: "https://buy.stripe.com/test_5kQ6oG1vybZW4Yr9vI4ZG02",
  annual: "https://buy.stripe.com/test_7sYcN42zCggcgH9eQ24ZG03"
};

/* COMPONENTES DE UI */

// Componente de Toast (Pop-up de Confirmação)
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
       
       {/* Decorative Background Elements */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full -ml-16 -mb-16 blur-3xl"></div>

       <div className="relative p-8 md:p-10 flex flex-col items-center text-center">

          {/* Celebration Icon */}
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
      case 'emerald': return theme === 'dark' ? 'text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-900/30' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100';
      case 'amber': return theme === 'dark' ? 'text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border-amber-900/30' : 'text-amber-600 bg-amber-50 hover:bg-emerald-100 border-emerald-100';
      case 'red': return theme === 'dark' ? 'text-red-400 bg-red-900/20 hover:bg-red-900/40 border-red-900/30' : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-100';
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
    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">{label}</label>
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
       
       {/* Decorative Background Elements */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full -ml-16 -mb-16 blur-3xl"></div>

       <div className="relative p-8 md:p-10 flex flex-col items-center text-center">

          {/* Logo Badge */}
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

          {/* Benefits List */}
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
        
        // Auto-fill price/cost if package changes
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

// Componente de Tela de Autenticação
// Versão que suporta login e cadastro integrados.
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
          options: {
            data: {
              full_name: name
            }
          }
        });
        if (error) throw error;
        else {
            // Seta flag de novo usuário para exibir modal de boas-vindas
            localStorage.setItem('eflixtv_new_user', 'true');
        }
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
          <button 
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Nome Completo</label>
               <div className={`flex items-center px-3 py-2.5 rounded-md border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <User size={16} className="text-slate-400 mr-2"/>
                 <input 
                   type="text" 
                   required={!isLogin}
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   className="bg-transparent border-none outline-none text-[13px] font-medium w-full"
                   placeholder="Seu Nome"
                 />
               </div>
            </div>
          )}
          
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Email</label>
             <div className={`flex items-center px-3 py-2.5 rounded-md border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <Mail size={16} className="text-slate-400 mr-2"/>
               <input 
                 type="email" 
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="bg-transparent border-none outline-none text-[13px] font-medium w-full"
                 placeholder="seu@email.com"
               />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Senha</label>
             <div className={`flex items-center px-3 py-2.5 rounded-md border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <Lock size={16} className="text-slate-400 mr-2"/>
               <input 
                 type="password" 
                 required
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="bg-transparent border-none outline-none text-[13px] font-medium w-full"
                 placeholder="******"
               />
             </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold uppercase text-xs tracking-wide shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? 'Acessar Painel' : 'Criar Conta')}
          </button>
        </form>
      </div>
    </div>
  );
};

// Componente de Conteúdo de Assinatura (Reutilizável)
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
      // Salva a duração do plano escolhido no localStorage para ser recuperado após o retorno do Stripe
      localStorage.setItem('pending_plan_months', selectedPlan.months.toString());
  };

  return (
    <div className={`w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-white bg-white'}`}>
      
      {/* Coluna Esquerda: Benefícios */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-emerald-500 text-white p-8 md:p-12 flex flex-col relative overflow-hidden justify-center">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full -ml-16 -mb-16 blur-3xl"></div>

        <div className="relative z-10">
          {isBlocking ? (
             <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Message above icon */}
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight">
                  {blockReason === 'trial_expired' ? "Seu teste expirou,\nassine um plano" : "Acesso Bloqueado"}
                </h2>
                <p className="text-sm opacity-90 leading-relaxed font-medium bg-black/20 p-4 rounded-lg border border-white/10 backdrop-blur-sm mb-6">
                   {blockReason === 'trial_expired' 
                     ? "Seu período de avaliação gratuita terminou. Para continuar cadastrando e gerenciando seus clientes sem perder dados, escolha seu plano."
                     : "Identificamos uma pendência na sua assinatura. Para restabelecer seu acesso ao painel imediatamente, realize a renovação abaixo."}
                </p>

                {/* Icon + Label */}
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

      {/* Coluna Direita: Seleção de Planos e Ação */}
      <div className={`md:w-1/2 p-8 md:p-12 flex flex-col ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">Escolha seu Plano</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Selecione a melhor option para você</p>
            </div>
            {isBlocking && onLogout && (
              <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                  <LogOut size={12}/> Sair
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3 mb-8 overflow-y-auto pr-1">
             {plans.map(plan => (
                 <div 
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${selectedPlanId === plan.id 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700'}`}
                 >
                    {plan.badge && (
                        <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[9px] font-bold uppercase tracking-wide rounded-full shadow-sm">
                            {plan.badge}
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlanId === plan.id ? 'border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                            {selectedPlanId === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                        </div>
                        <div>
                            <span className={`block text-sm font-bold uppercase ${selectedPlanId === plan.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{plan.name}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`block font-bold ${selectedPlanId === plan.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}>R$ {plan.price}</span>
                        <span className="text-[9px] font-bold uppercase text-slate-400">{plan.period}</span>
                    </div>
                 </div>
             ))}
          </div>

          <div className="mt-auto">
              <a 
                  href={selectedPlan.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={handlePaymentClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold uppercase text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                  <CreditCard size={18}/> Continuar para Pagamento
              </a>
              
              <p className="text-[10px] text-slate-400 text-center mt-4 mx-auto max-w-xs leading-relaxed mb-4">
                  Pagamento seguro processado pelo Stripe. Acesso liberado imediatamente após a confirmação.
              </p>

              {/* Added Contact Support Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 text-center mb-3 font-bold uppercase tracking-widest">
                      Suporte Financeiro & Liberação
                  </p>
                  <a 
                      href="https://wa.me/5585992780931?text=Ol%C3%A1%20Eron,%20tive%20um%20problema%20com%20o%20pagamento%20do%20painel."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all"
                  >
                      <Smartphone size={16} /> Fale com Eron Vasconcelos
                  </a>
                  <p className="text-[9px] text-slate-400 text-center mt-2 font-medium">
                      (85) 99278-0931
                  </p>
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
  const [simulationMode, setSimulationMode] = useState<'none' | 'trial_expired' | 'sub_expired'>('none'); // Estado avançado de simulação
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'blocked'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull to refresh refs and state
  const mainRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  // Estado para Toast
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // ESTADO DO FORMULÁRIO DE CADASTRO (PERSISTENTE)
  // Agora mantém todos os campos, não apenas preço e custo
  const [addFormData, setAddFormData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    packageId: '',
    price: '',
    expenses: '',
    expiryDate: '',
    expiryTime: '23:59',
    isPaid: true,
    notes: '',
    appName: '',
    macKey: ''
  });

  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [selectedServerForCredit, setSelectedServerForCredit] = useState<Server | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');
  const notifiedIds = useRef<Set<string>>(new Set());

  // Estado Inicial agora é vazio, carregado via Supabase
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [rules, setRules] = useState<MessageRule[]>([]);
  const [servers, setServers] = useState<Server[]>([]);

  // RESET SCROLL AO MUDAR DE ABA
  useEffect(() => {
      if (mainRef.current) {
          mainRef.current.scrollTop = 0;
      }
  }, [view]);

  // Lógica para verificar retorno do Stripe
  useEffect(() => {
    const handlePaymentReturn = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_success') === 'true' && session) {
            // Limpa o parametro da URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Exibe modal de sucesso
            setShowSuccessModal(true);
            
            // Recupera a duração do plano escolhido
            const pendingMonths = parseInt(localStorage.getItem('pending_plan_months') || '1');
            
            // Atualiza assinatura no banco (Adiciona os meses correspondentes)
            // OBS: Em produção real, isso deve ser feito via Webhook seguro no backend
            try {
                const newExpiry = new Date();
                newExpiry.setMonth(newExpiry.getMonth() + pendingMonths);
                
                const { error } = await supabase.from('profiles').update({
                    subscription_ends_at: newExpiry.toISOString(),
                    plan_type: 'premium'
                }).eq('id', session.user.id);
                
                if (error) throw error;
                
                // Atualiza estado local
                setUserProfile(prev => prev ? ({ ...prev, subscription_ends_at: newExpiry.toISOString() }) : null);
                showToast(`Assinatura renovada por ${pendingMonths} mês(es) com sucesso!`);
                
                // Limpa o storage
                localStorage.removeItem('pending_plan_months');
                
            } catch (err) {
                console.error("Erro ao ativar assinatura:", err);
            }
        }
    };

    if (session) {
        handlePaymentReturn();
    }
  }, [session]);

  // Gestão da Sessão e Carregamento de Dados
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      else setIsLoading(false); // Stop loading if no session
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchAllData();
      } else {
        setClients([]);
        setPackages([]);
        setTemplates([]);
        setRules([]);
        setServers([]);
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Lógica para exibir modal de boas-vindas
  useEffect(() => {
      if (session && localStorage.getItem('eflixtv_new_user') === 'true') {
          setShowWelcomeModal(true);
          localStorage.removeItem('eflixtv_new_user');
      }
  }, [session]);

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      
      if (!userId) return;

      // Fetch User Profile (Subscription Status)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profileData) {
          setUserProfile(profileData);
      } else {
          // Fallback se não existir perfil (ex: usuários antigos antes da migration)
          // Cria um perfil temporário com trial ativo para não bloquear imediatamente
          const tempProfile: UserProfile = {
              id: userId,
              email: sessionData.session?.user.email || '',
              trial_ends_at: new Date(Date.now() + 86400000).toISOString(), // +1 dia de cortesia se falhar
              subscription_ends_at: null,
              plan_type: null
          };
          setUserProfile(tempProfile);
      }

      const { data: clientsData } = await supabase.from('clients').select('*').eq('user_id', userId);
      if (clientsData) setClients(clientsData);

      const { data: packagesData } = await supabase.from('packages').select('*').eq('user_id', userId);
      if (packagesData) setPackages(packagesData);
      else {
         const initialPackages = [
          { id: 'p1', user_id: userId, name: 'Básico SD/HD', price: 25, cost: 8, months: 1 },
          { id: 'p2', user_id: userId, name: 'Completo 4K', price: 35, cost: 12, months: 1 },
          { id: 'p3', user_id: userId, name: 'Trimestral Promo', price: 90, cost: 36, months: 3 }
         ];
         setPackages(initialPackages);
      }

      const { data: templatesData } = await supabase.from('templates').select('*').eq('user_id', userId);
      if (templatesData && templatesData.length > 0) setTemplates(templatesData);
      else {
          // Pre-configured messages as requested
          const initialTemplates = [
              { id: 't1', user_id: userId, title: 'BOAS-VINDAS', body: 'Olá {{nome}}! Seja bem-vindo(a)!. \n\nSeus dados de acesso:\n👤 Usuário: {{usuario}}\n🔑 Senha: {{senha}}\n\nQualquer dúvida, estou à disposição!' },
              { id: 't2', user_id: userId, title: 'COBRANÇA - PRÉ', body: 'Opa {{nome}}, tudo certo? Passando pra lembrar que seu plano vence em {{vencimento}}. O valor é R$ {{valor}}. Posso enviar o PIX para renovação?' },
              { id: 't3', user_id: userId, title: 'COBRANÇA - HOJE', body: 'Olá {{nome}}! Seu plano vence HOJE ({{vencimento}}). Para evitar bloqueio automático, segue a chave PIX para renovação no valor de R$ {{valor}}.\n\nAguardo seu comprovante!' },
              { id: 't4', user_id: userId, title: 'COBRANÇA - ATRASO', body: 'Oi {{nome}}, notei que seu pagamento não caiu. Seu acesso foi suspenso temporariamente. Para liberar agora mesmo, faça o PIX de R$ {{valor}} e me envie o comprovante.' },
              { id: 't5', user_id: userId, title: 'RENOVAÇÃO CONFIRMADA', body: 'Pagamento recebido, {{nome}}! ✅\nSeu acesso foi renovado com sucesso. Muito obrigado pela preferência!' }
          ];
          setTemplates(initialTemplates);
      }

      const { data: rulesData } = await supabase.from('rules').select('*').eq('user_id', userId);
      if (rulesData) setRules(rulesData);
      else setRules([{ id: 'r1', user_id: userId, type: 'before', days: 3, time: '09:00', templateId: 't2', isActive: true }]);

      const { data: serversData } = await supabase.from('servers').select('*').eq('user_id', userId);
      if (serversData) setServers(serversData);

    } catch (error) {
      console.error("Erro ao carregar dados do Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
      setIsRefreshing(true);
      await fetchAllData(true); // Silent fetch, but with local loading indicator
      setIsRefreshing(false);
      showToast("Dados atualizados com sucesso!");
  };

  useEffect(() => {
    localStorage.setItem('eflixtv_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Lógica de Notificações
  useEffect(() => {
    // Tenta ativar notificações no carregamento se já permitido ou pergunta (dependendo do navegador)
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => setNotificationsEnabled(p === 'granted'));
    }

    const checkNotifications = () => {
      const now = new Date();
      const todayStr = now.toLocaleDateString('pt-BR');
      
      // 1. Notificação de Vencimento do App (Trial ou Assinatura)
      if (userProfile && notificationsEnabled) {
          const trialEnd = new Date(userProfile.trial_ends_at);
          const subEnd = userProfile.subscription_ends_at ? new Date(userProfile.subscription_ends_at) : null;
          const expiryDate = subEnd && subEnd > trialEnd ? subEnd : trialEnd;
          
          const diffTime = expiryDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
             const notifyId = `app-expiry-1day-${todayStr}`;
             if (!notifiedIds.current.has(notifyId)) {
                sendNotification('⚠️ Assinatura do Painel', 'Sua licença expira em 1 dia. Renove para evitar bloqueio.');
                notifiedIds.current.add(notifyId);
             }
          }
      }

      // 2. Notificações de Clientes
      clients.forEach(client => {
        // Regras de Automação
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

            // Notifica se faltar 5 minutos ou menos para o horário da regra
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
    const interval = setInterval(checkNotifications, 30000); // Checa a cada 30s
    checkNotifications();
    return () => clearInterval(interval);
  }, [clients, rules, notificationsEnabled, userProfile]);

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/5977/5977591.png' });
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ message: msg, type });
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const isExpired = (date: string) => new Date(date) < new Date();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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

  // Função genérica de atualização de cliente no Supabase
  const updateClientInSupabase = async (clientId: string, updates: Partial<Client>) => {
      // Optimistic Update
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

  // HANDLER ATUALIZADO PARA USAR O ESTADO CONTROLADO
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
      appName: addFormData.appName || '',
      macKey: addFormData.macKey || '',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      paymentHistory: addFormData.isPaid ? [{ id: Math.random().toString(36).substr(2,5), amount: Number(addFormData.price), date: new Date().toISOString(), monthsPaid: pkg?.months || 1, method: 'Cadastro' }] : [],
      totalPaid: addFormData.isPaid ? Number(addFormData.price) : 0
    };

    setClients(prev => [...prev, newClient]);
    setView('clients');
    
    // Reset form after successful submission
    setAddFormData({
        name: '', username: '', password: '', phone: '', packageId: '', price: '', expenses: '',
        expiryDate: '', expiryTime: '23:59', isPaid: true, notes: '', appName: '', macKey: ''
    });
    
    showToast("Cliente cadastrado com sucesso!");

    try {
        const { error } = await supabase.from('clients').insert([newClient]);
        if (error) throw error;
    } catch(err) {
        console.error(err);
        showToast("Erro ao sincronizar dados.", "error");
    }
  };

  const handleDeleteClient = async (id: string) => {
      if(!confirm('Excluir cliente permanentemente?')) return;
      setClients(prev => prev.filter(c => c.id !== id));
      try {
          await supabase.from('clients').delete().eq('id', id);
      } catch(err) { console.error(err); }
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

  // Funções de CRUD para Planos, Modelos e Regras
  const handleSavePackage = async (pkg: Package) => {
      if (!session) return;
      const pkgWithUser = { ...pkg, user_id: session.user.id };
      
      if(editingPackage) {
          setPackages(prev => prev.map(p => p.id === pkg.id ? pkgWithUser : p));
          await supabase.from('packages').update(pkgWithUser).eq('id', pkg.id);
          setEditingPackage(null);
      } else {
          setPackages(prev => [...prev, pkgWithUser]);
          await supabase.from('packages').insert([pkgWithUser]);
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

  // CRUD Servidores
  const handleSaveServer = async (serverData: any) => {
    if (!session) return;
    const newServer: Server = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: session.user.id,
        name: serverData.name,
        url: serverData.url,
        credits: Number(serverData.credits),
        transactions: [{ 
            id: Math.random().toString(36).substr(2, 5), 
            date: new Date().toISOString(), 
            amount: Number(serverData.credits), 
            cost: 0 // Créditos iniciais assumem custo zero ou usuário não definiu na criação
        }]
    };
    setServers(prev => [...prev, newServer]);
    try { await supabase.from('servers').insert([newServer]); } catch(e) { console.error(e); }
  };

  const handleDeleteServer = async (id: string) => {
      if(!confirm('Excluir servidor?')) return;
      setServers(prev => prev.filter(s => s.id !== id));
      try { await supabase.from('servers').delete().eq('id', id); } catch(e) { console.error(e); }
  };

  const handleAddCredits = async (amount: number, totalCost: number) => {
    if (!session || !selectedServerForCredit) return;
    const transaction: CreditTransaction = {
        id: Math.random().toString(36).substr(2, 5),
        date: new Date().toISOString(),
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
    try { await supabase.from('servers').update(updatedServer).eq('id', updatedServer.id); } catch(e) { console.error(e); }
  };

  const requestPermission = async () => {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
  };

  const stats = useMemo(() => {
    const clientsStats = clients.reduce((acc, c) => {
      acc.totalLTV += c.totalPaid || 0;
      acc.monthlyRevenue += c.price || 0;
      acc.monthlyCosts += c.expenses || 0; // Custos por cliente (ex: custo por ativação no painel)
      const expired = isExpired(c.expiresAt);
      if (c.status === 'blocked') acc.blockedCount++;
      else if (expired) acc.expiredCount++;
      else acc.activeCount++;
      if (c.paymentStatus === 'pending') acc.pendingPaymentCount++;
      return acc;
    }, { totalLTV: 0, monthlyRevenue: 0, monthlyCosts: 0, activeCount: 0, expiredCount: 0, blockedCount: 0, pendingPaymentCount: 0 });

    // Somar custos de compra de créditos de servidor do mês atual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let serverMonthlyCosts = 0;
    servers.forEach(s => {
        if(s.transactions) {
            s.transactions.forEach(t => {
                const tDate = new Date(t.date);
                if(tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                    serverMonthlyCosts += t.cost;
                }
            });
        }
    });

    return {
        ...clientsStats,
        monthlyCosts: clientsStats.monthlyCosts + serverMonthlyCosts
    };

  }, [clients, servers]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.username.toLowerCase().includes(searchTerm.toLowerCase()) || (c.macKey || '').toLowerCase().includes(searchTerm.toLowerCase());
      const expired = isExpired(c.expiresAt);
      
      let matchesStatus = statusFilter === 'all';
      if (statusFilter === 'active') matchesStatus = c.status === 'active' && !expired;
      else if (statusFilter === 'expired') matchesStatus = c.status === 'active' && expired;
      else if (statusFilter === 'blocked') matchesStatus = c.status === 'blocked';

      let matchesPayment = paymentFilter === 'all';
      if (paymentFilter === 'paid') matchesPayment = c.paymentStatus === 'paid';
      else if (paymentFilter === 'pending') matchesPayment = c.paymentStatus === 'pending';

      return matchesSearch && matchesStatus && matchesPayment;
    }).sort((a, b) => {
      const dateA = new Date(a.expiresAt).getTime();
      const dateB = new Date(b.expiresAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [clients, searchTerm, statusFilter