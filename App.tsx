
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
  User
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Client, Package, MessageTemplate, MessageRule, ClientStatus, PaymentStatus } from './types';
import { geminiService } from './services/geminiService';
import { supabase } from './services/supabaseClient';

const PANEL_NAME = "EFLIXTV";
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/* COMPONENTES DE UI */

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md mb-0.5 transition-all group ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>
    <div className={`transition-transform ${active ? 'scale-105' : 'group-hover:scale-105'}`}>{icon}</div>
    <span className="text-[12px] font-medium tracking-wide">{label}</span>
    {active && <ChevronRight size={12} className="ml-auto opacity-70" />}
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
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
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
      case 'amber': return theme === 'dark' ? 'text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border-amber-900/30' : 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-100';
      case 'red': return theme === 'dark' ? 'text-red-400 bg-red-900/20 hover:bg-red-900/40 border-red-900/30' : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-100';
      default: return 'text-slate-500 bg-slate-100';
    }
  };
  return (
    <button onClick={onClick} className={`p-1.5 rounded-md border transition-all active:scale-95 ${getColors()}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 16 })}
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

// Componente de Tela de Autenticação
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
        else alert("Cadastro realizado! Verifique seu email se necessário ou faça login.");
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
          <div className="bg-blue-600 p-3 rounded-xl mb-4 shadow-lg shadow-blue-600/20">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">{PANEL_NAME}</h1>
          <p className="text-sm text-slate-400 font-medium">Gerenciador Premium IPTV</p>
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

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('eflixtv_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'dashboard' | 'clients' | 'history' | 'add' | 'packages' | 'messages' | 'scheduling' | 'database'>('dashboard');
  const [selectedClientForMsg, setSelectedClientForMsg] = useState<Client | null>(null);
  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState<Client | null>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'blocked'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [addFormValues, setAddFormValues] = useState({
    price: '',
    expenses: ''
  });

  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');
  const notifiedIds = useRef<Set<string>>(new Set());

  // Estado Inicial agora é vazio, carregado via Supabase
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [rules, setRules] = useState<MessageRule[]>([]);

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
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // O Supabase filtra automaticamente pelo usuário se RLS estiver ativo,
      // mas por segurança e boa prática, podemos assumir que o backend cuida disso
      // ou filtrar explicitamente se as políticas forem públicas (não recomendado).
      // Aqui, assumimos que RLS filtra ou tabela é compartilhada e filtramos manualmente.
      // NOTA: Para segurança real, ative RLS no Supabase. O código abaixo envia o user_id na criação.
      
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      
      if (!userId) return;

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
      if (templatesData) setTemplates(templatesData);
      else setTemplates([{ id: 't1', user_id: userId, title: 'BOAS-VINDAS', body: 'Olá {{nome}}! Seus dados: User: {{usuario}} / Pass: {{senha}}' }]);

      const { data: rulesData } = await supabase.from('rules').select('*').eq('user_id', userId);
      if (rulesData) setRules(rulesData);
      else setRules([{ id: 'r1', user_id: userId, type: 'before', days: 3, time: '09:00', templateId: 't1', isActive: true }]);

    } catch (error) {
      console.error("Erro ao carregar dados do Supabase:", error);
    } finally {
      setIsLoading(false);
    }
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
    const checkNotifications = () => {
      if (!notificationsEnabled) return;
      const now = new Date();
      const todayStr = now.toLocaleDateString('pt-BR');
      
      clients.forEach(client => {
        const expiryDate = new Date(client.expiresAt);
        const expiryStr = expiryDate.toLocaleDateString('pt-BR');

        if (expiryStr === todayStr) {
          const notifyId = `expiry-${client.id}-${todayStr}`;
          if (!notifiedIds.current.has(notifyId)) {
            sendNotification('🚨 Vencimento Hoje!', `O cliente ${client.name} vence hoje.`);
            notifiedIds.current.add(notifyId);
          }
        }

        rules.forEach(rule => {
          if (!rule.isActive) return;
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
                sendNotification('📩 Mensagem Próxima!', `Enviar lembrete para ${client.name} em ${Math.ceil(diffMinutes)} min.`);
                notifiedIds.current.add(notifyId);
              }
            }
          }
        });
      });
    };
    const interval = setInterval(checkNotifications, 60000);
    checkNotifications();
    return () => clearInterval(interval);
  }, [clients, rules, notificationsEnabled]);

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/5977/5977591.png' });
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const isExpired = (date: string) => new Date(date) < new Date();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
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
          alert("Erro ao salvar alterações no servidor.");
      }
  };

  const handleToggleStatus = (client: Client) => updateClientInSupabase(client.id, { status: client.status === 'active' ? 'blocked' : 'active' });
  const handleTogglePayment = (client: Client) => updateClientInSupabase(client.id, { paymentStatus: client.paymentStatus === 'paid' ? 'pending' : 'paid' });

  const handleAddClient = async (form: any) => {
    if (!session) return;
    
    const pkg = packages.find(p => p.id === form.packageId);
    const expiryDate = new Date(`${form.expiryDate}T${form.expiryTime || '00:00'}`);
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: session.user.id,
      name: form.name,
      username: form.username,
      password: form.password,
      status: 'active',
      paymentStatus: form.isPaid ? 'paid' : 'pending',
      phone: form.phone,
      packageName: pkg?.name || 'Personalizado',
      packageId: form.packageId,
      price: Number(form.price) || 0,
      expenses: Number(form.expenses) || 0,
      notes: form.notes || '',
      appName: form.appName || '',
      macKey: form.macKey || '',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      paymentHistory: form.isPaid ? [{ id: Math.random().toString(36).substr(2,5), amount: Number(form.price), date: new Date().toISOString(), monthsPaid: pkg?.months || 1, method: 'Cadastro' }] : [],
      totalPaid: form.isPaid ? Number(form.price) : 0
    };

    setClients(prev => [...prev, newClient]);
    setView('clients');
    setAddFormValues({ price: '', expenses: '' });

    try {
        const { error } = await supabase.from('clients').insert([newClient]);
        if (error) throw error;
    } catch(err) {
        console.error(err);
        alert("Erro ao criar cliente no banco de dados.");
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
  };

  const handleDeleteRule = async (id: string) => {
      setRules(prev => prev.filter(r => r.id !== id));
      await supabase.from('rules').delete().eq('id', id);
  };

  const requestPermission = async () => {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
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
  }, [clients, searchTerm, statusFilter, paymentFilter, sortOrder]);

  const sendWhatsApp = (template: MessageTemplate | string, client: Client) => {
    let body = typeof template === 'string' ? template : template.body.replace(/{{nome}}/g, client.name).replace(/{{usuario}}/g, client.username).replace(/{{senha}}/g, client.password || '***').replace(/{{vencimento}}/g, new Date(client.expiresAt).toLocaleDateString('pt-BR')).replace(/{{valor}}/g, client.price.toFixed(2));
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-blue-600"/>
            <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Carregando Sistema...</p>
        </div>
      </div>
    );
  }

  // Se não houver sessão, exibe a tela de Login
  if (!session) {
    return <AuthScreen theme={theme} />;
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden font-normal transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Desktop Sidebar */}
      <aside className="w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg"><Activity size={18} className="text-white" /></div>
          <h1 className="text-sm font-bold uppercase tracking-tight">{PANEL_NAME}</h1>
        </div>
        
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2 hide-scrollbar">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Visão Geral" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={18} />} label="Meus Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <SidebarItem icon={<UserPlus size={18} />} label="Novo Cadastro" active={view === 'add'} onClick={() => setView('add')} />
          <SidebarItem icon={<History size={18} />} label="Financeiro" active={view === 'history'} onClick={() => setView('history')} />
          <SidebarItem icon={<CalendarDays size={18} />} label="Automação Zap" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          
          <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configurações</div>
          <SidebarItem icon={<Layers size={18} />} label="Planos e Preços" active={view === 'packages'} onClick={() => setView('packages')} />
          <SidebarItem icon={<MessageSquare size={18} />} label="Modelos Texto" active={view === 'messages'} onClick={() => setView('messages')} />
          <SidebarItem icon={<Database size={18} />} label="Backup Dados" active={view === 'database'} onClick={() => setView('database')} />
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-all">
            <span className="text-[10px] font-bold uppercase">{theme === 'dark' ? 'Tema Escuro' : 'Tema Claro'}</span>
            {theme === 'dark' ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-amber-400" />}
          </button>
          
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all">
            <LogOut size={16} />
            <span className="text-[11px] font-bold uppercase">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`px-5 py-3 flex items-center justify-between pt-safe shrink-0 border-b z-20 transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
          <div className="flex items-center gap-3">
             <h2 className={`text-sm font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {view === 'dashboard' && 'Dashboard'}
              {view === 'history' && 'Matriz Financeira'}
              {view === 'clients' && 'Gestão de Clientes'}
              {view === 'scheduling' && 'Automação'}
              {view === 'add' && 'Cadastrar Cliente'}
              {view === 'packages' && 'Gerenciar Planos'}
              {view === 'messages' && 'Mensagens Padrão'}
              {view === 'database' && 'Segurança'}
            </h2>
            <button onClick={notificationsEnabled ? () => {} : requestPermission} className={`p-1.5 rounded-md transition-colors ${notificationsEnabled ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {notificationsEnabled ? <Bell size={16}/> : <BellOff size={16}/>}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-[10px] font-bold uppercase text-slate-400">
               {session.user.user_metadata.full_name || session.user.email}
            </span>
            <button onClick={() => geminiService.analyzeBusiness(clients).then(setAiAnalysis)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-all shadow-sm">
              <TrendingUp size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-32 p-4 md:p-6 hide-scrollbar bg-slate-50/50 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto space-y-5">
            
            {aiAnalysis && (
              <div className="p-4 bg-blue-600 text-white rounded-lg relative shadow-lg overflow-hidden animate-in fade-in">
                <button onClick={() => setAiAnalysis(null)} className="absolute top-2 right-2 text-white/50 hover:text-white"><X size={16}/></button>
                <h4 className="font-bold text-[10px] mb-1 uppercase tracking-widest opacity-80">Insight IA:</h4>
                <p className="text-xs leading-relaxed font-medium">{aiAnalysis}</p>
              </div>
            )}

            {view === 'dashboard' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard title="Ativos" value={stats.activeCount} icon={<CheckCircle/>} color="emerald" theme={theme} />
                  <StatCard title="A Vencer" value={stats.pendingPaymentCount} icon={<AlertCircle/>} color="amber" theme={theme} />
                  <StatCard title="Vencidos" value={stats.expiredCount} icon={<Clock/>} color="red" theme={theme} />
                  <StatCard title="Blocks" value={stats.blockedCount} icon={<UserX/>} color="blue" theme={theme} />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard title="Receita Mês" value={`R$ ${stats.monthlyRevenue.toFixed(0)}`} icon={<DollarSign/>} color="blue" theme={theme} />
                  <StatCard title="Custos Mês" value={`R$ ${stats.monthlyCosts.toFixed(0)}`} icon={<Layers/>} color="red" theme={theme} />
                  <StatCard title="Lucro Líq." value={`R$ ${(stats.monthlyRevenue - stats.monthlyCosts).toFixed(0)}`} icon={<TrendingUp/>} color="emerald" theme={theme} />
                  <StatCard title="LTV Total" value={`R$ ${stats.totalLTV.toFixed(0)}`} icon={<Activity/>} color="blue" theme={theme} />
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
                  
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    <FilterChip active={statusFilter === 'all' && paymentFilter === 'all'} label="Todos" theme={theme} onClick={() => { setStatusFilter('all'); setPaymentFilter('all'); }} />
                    <FilterChip active={statusFilter === 'active'} label="Ativos" theme={theme} onClick={() => setStatusFilter('active')} />
                    <FilterChip active={statusFilter === 'expired'} label="Vencidos" theme={theme} onClick={() => setStatusFilter('expired')} />
                    <FilterChip active={statusFilter === 'blocked'} label="Blocks" theme={theme} onClick={() => setStatusFilter('blocked')} />
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>
                    <FilterChip active={paymentFilter === 'paid'} label="Pagos" theme={theme} onClick={() => setPaymentFilter(paymentFilter === 'paid' ? 'all' : 'paid')} />
                    <FilterChip active={paymentFilter === 'pending'} label="Pendentes" theme={theme} onClick={() => setPaymentFilter(paymentFilter === 'pending' ? 'all' : 'pending')} />
                  </div>
                </div>

                <div className="md:hidden space-y-3">
                  {filteredClients.map(c => {
                    const expired = isExpired(c.expiresAt);
                    return (
                      <div key={c.id} className={`p-4 rounded-lg border shadow-sm relative overflow-hidden transition-all active:scale-[0.99] ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 pr-3">
                            <h4 className="font-bold text-[15px] truncate leading-tight text-slate-900 dark:text-white">{c.name}</h4>
                            <div className="text-[11px] opacity-60 font-medium uppercase truncate mt-0.5">{c.username}</div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                             <button onClick={() => handleToggleStatus(c)} className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>{c.status === 'blocked' ? 'Block' : expired ? 'Exp' : 'On'}</button>
                             <button onClick={() => handleTogglePayment(c)} className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30'}`}>{c.paymentStatus === 'paid' ? 'Pago' : 'Pend'}</button>
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
                          <div className="flex gap-2">
                             <ActionButton onClick={() => setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={16}/>} />
                             <ActionButton onClick={() => setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={16}/>} />
                             <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={16}/>} />
                             <ActionButton onClick={() => setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={16}/>} />
                          </div>
                          <ActionButton onClick={() => handleDeleteClient(c.id)} theme={theme} color="red" icon={<Trash2 size={16}/>} />
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
                          <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex flex-col">
                                <span className="font-bold text-[13px]">{c.name}</span>
                                <span className="text-[10px] opacity-60 font-medium uppercase">{c.username}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <div className={`text-[11px] font-bold ${expired && c.status === 'active' ? 'text-red-500' : ''}`}>{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</div>
                            </td>
                            <td className="px-4 py-2.5 text-center text-[11px] font-medium uppercase">{c.packageName}</td>
                            <td className="px-4 py-2.5 text-center">
                              <button onClick={() => handleToggleStatus(c)} className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>{c.status === 'blocked' ? 'Block' : expired ? 'Venc' : 'On'}</button>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <button onClick={() => handleTogglePayment(c)} className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20'}`}>{c.paymentStatus === 'paid' ? 'Pago' : 'Pnd'}</button>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <ActionButton onClick={() => setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={14}/>} />
                                <ActionButton onClick={() => setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={14}/>} />
                                <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={14}/>} />
                                <ActionButton onClick={() => setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={14}/>} />
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

            {view === 'add' && (
              <div className={`p-5 rounded-lg border shadow-lg max-w-lg mx-auto animate-in zoom-in-95 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-lg font-bold uppercase mb-6 flex items-center gap-2"><PlusCircle size={22}/> Novo Cadastro</h3>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={(e) => {
                  e.preventDefault();
                  handleAddClient(Object.fromEntries(new FormData(e.currentTarget)));
                }}>
                  <FormInput theme={theme} name="name" label="Nome do Cliente" placeholder="Ex: João da Silva" required />
                  <FormInput theme={theme} name="phone" label="Zap (Ex: 55119...)" required />
                  <FormInput theme={theme} name="username" label="Login Usuário" required />
                  <FormInput theme={theme} name="password" label="Senha Painel" />
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Plano Base</label>
                    <select 
                      name="packageId" 
                      onChange={(e) => {
                        const pkg = packages.find(p => p.id === e.target.value);
                        if (pkg) {
                          setAddFormValues({ price: pkg.price.toString(), expenses: pkg.cost.toString() });
                        } else {
                          setAddFormValues({ price: '', expenses: '' });
                        }
                      }}
                      className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 shadow-sm'}`}
                    >
                      <option value="">Selecione um plano...</option>
                      {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput 
                      theme={theme} 
                      name="price" 
                      label="Valor Venda" 
                      type="number" 
                      step="0.01" 
                      required 
                      value={addFormValues.price}
                      onChange={(e: any) => setAddFormValues(prev => ({...prev, price: e.target.value}))}
                    />
                    <FormInput 
                      theme={theme} 
                      name="expenses" 
                      label="Custo Painel" 
                      type="number" 
                      step="0.01" 
                      required 
                      value={addFormValues.expenses}
                      onChange={(e: any) => setAddFormValues(prev => ({...prev, expenses: e.target.value}))}
                    />
                  </div>
                  
                  {/* DATA E HORA EM GRID 2 COLUNAS LADO A LADO */}
                  <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4">
                     <FormInput theme={theme} name="expiryDate" label="Data de Vencimento" type="date" required />
                     <FormInput theme={theme} name="expiryTime" label="Hora" type="time" defaultValue="23:59" />
                  </div>
                  
                  <FormInput theme={theme} name="appName" label="App Sugerido" />
                  <FormInput theme={theme} name="macKey" label="ID / MAC / Key" />
                  <div className="sm:col-span-2">
                     <FormInput theme={theme} name="notes" label="Observações" />
                  </div>
                  <div className="sm:col-span-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-md border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3 shadow-sm">
                    <input type="checkbox" name="isPaid" id="isPaid" className="w-5 h-5 accent-emerald-600 rounded cursor-pointer" />
                    <label htmlFor="isPaid" className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400 uppercase cursor-pointer">Marcar como Pago</label>
                  </div>
                  <button type="submit" className="sm:col-span-2 bg-blue-600 text-white py-3 rounded-md font-bold uppercase text-[13px] shadow-sm hover:bg-blue-700 transition-all">Salvar Cadastro</button>
                </form>
              </div>
            )}

            {view === 'history' && (
              <div className={`rounded-lg border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                 <div className="p-3 flex items-center justify-between border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentYear(y => y-1)} className="p-2 border rounded-md dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"><ChevronLeft size={16}/></button>
                    <span className="font-bold text-base">{currentYear}</span>
                    <button onClick={() => setCurrentYear(y => y+1)} className="p-2 border rounded-md dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"><ChevronRight size={16}/></button>
                  </div>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80">
                      <tr>
                        <th className={`px-4 py-3 text-[10px] font-bold text-slate-400 uppercase sticky left-0 z-20 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>Cliente</th>
                        {MONTHS.map(m => <th key={m} className="px-1 py-3 text-[10px] font-bold text-slate-400 uppercase text-center">{m}</th>)}
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Faturado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {clients.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className={`px-4 py-2.5 text-[12px] font-medium sticky left-0 z-10 transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>{c.name}</td>
                          {MONTHS.map((_, i) => {
                             const monthEnd = new Date(currentYear, i + 1, 0);
                             const expiry = new Date(c.expiresAt);
                             const created = new Date(c.createdAt);
                             let status = 'none';
                             if (monthEnd >= created) status = expiry >= monthEnd ? 'paid' : 'overdue';
                            return (
                              <td key={i} className="px-1 py-2.5 text-center">
                                <div className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center ${status === 'paid' ? 'bg-emerald-500 text-white' : status === 'overdue' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}`}>
                                  {status === 'paid' && <Check size={14}/>}
                                  {status === 'overdue' && <X size={14}/>}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-4 py-2.5 text-right text-[11px] font-bold text-emerald-600">R$ {(c.totalPaid || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === 'packages' && (
              <div className="max-w-lg mx-auto space-y-4">
                <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[13px] uppercase mb-4 text-blue-500 tracking-wide">{editingPackage ? 'Editar Plano' : 'Novo Plano'}</h4>
                   <form className="grid grid-cols-2 gap-3" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     const pkgData = { 
                         id: editingPackage ? editingPackage.id : Math.random().toString(36).substr(2,9),
                         name: (fd.get('name') as string).toUpperCase(), 
                         price: Number(fd.get('price')), 
                         cost: Number(fd.get('cost')), 
                         months: Number(fd.get('months')) 
                     };
                     handleSavePackage(pkgData);
                     e.currentTarget.reset();
                   }}>
                     <div className="col-span-2"><FormInput theme={theme} name="name" label="Nome do Plano" placeholder="Ex: MENSAL 4K" required defaultValue={editingPackage?.name} /></div>
                     <FormInput theme={theme} name="price" label="Preço Venda" type="number" step="0.01" required defaultValue={editingPackage?.price} />
                     <FormInput theme={theme} name="cost" label="Custo Painel" type="number" step="0.01" required defaultValue={editingPackage?.cost} />
                     <FormInput theme={theme} name="months" label="Meses" type="number" required defaultValue={editingPackage?.months || 1} />
                     <div className="col-span-2 flex gap-2 mt-2">
                       {editingPackage && <button type="button" onClick={() => { setEditingPackage(null); document.querySelector('form')?.reset(); }} className="flex-1 bg-slate-100 text-slate-500 rounded-md font-bold uppercase text-[11px] py-3">Cancelar</button>}
                       <button type="submit" className="flex-[2] bg-blue-600 text-white rounded-md font-bold uppercase text-[11px] py-3 hover:bg-blue-700">{editingPackage ? 'Atualizar' : 'Salvar'}</button>
                     </div>
                   </form>
                </div>
                {packages.map(p => (
                  <div key={p.id} className={`p-3.5 rounded-lg border flex justify-between items-center shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div>
                      <div className="font-bold text-[13px]">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Venda: R$ {p.price.toFixed(2)} • Custo: R$ {p.cost.toFixed(2)}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditingPackage(p)} className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-md"><Pencil size={16}/></button>
                      <button onClick={() => handleDeletePackage(p.id)} className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {view === 'messages' && (
              <div className="max-w-lg mx-auto space-y-4">
                 <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[13px] uppercase mb-4 text-emerald-500 tracking-wide">Novo Modelo</h4>
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
                  
                  {/* Botão para forçar recarga caso necessário */}
                  <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      Sincronizar Agora
                  </button>

                </div>
              </div>
            )}

             {view === 'scheduling' && (
              <div className="max-w-lg mx-auto space-y-4">
                 <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[13px] uppercase mb-4 text-emerald-500 tracking-wide">Nova Regra de Alerta</h4>
                   <form className="space-y-3" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     handleSaveRule({ 
                       id: Math.random().toString(36).substr(2,9), 
                       type: fd.get('type') as any,
                       days: Number(fd.get('days')),
                       time: fd.get('time') as string,
                       templateId: fd.get('templateId') as string,
                       isActive: true
                     });
                     e.currentTarget.reset();
                   }}>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quando Enviar?</label>
                          <select name="type" className={`w-full p-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                            <option value="before">Antes do Vencimento</option>
                            <option value="after">Após o Vencimento</option>
                          </select>
                        </div>
                        <FormInput theme={theme} name="days" label="Quantos Dias?" type="number" defaultValue="3" required />
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
                        {r.type === 'before' ? `Antedência de ${r.days} dias` : `Atraso de ${r.days} dias`} • {r.time}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Modelo: {templates.find(t => t.id === r.templateId)?.title || 'Desconhecido'}</div>
                    </div>
                    <button onClick={() => handleDeleteRule(r.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>

        {/* Mobile Navigation Compact */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 items-center justify-items-center py-2 z-[100] pb-safe shadow-xl transition-colors ${theme === 'dark' ? 'bg-slate-900/98 border-slate-800 backdrop-blur-xl' : 'bg-white/98 border-slate-100 backdrop-blur-xl'}`}>
          <BottomNavItem icon={<LayoutDashboard size={22}/>} label="Painel" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<Users size={22}/>} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <div className="relative flex items-center justify-center w-full h-full">
            <button onClick={() => setView('add')} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-slate-50 dark:border-slate-950 transition-all active:scale-95 z-[120]">
              <Plus size={24} />
            </button>
          </div>
          <BottomNavItem icon={<History size={22}/>} label="Matriz" active={view === 'history'} onClick={() => setView('history')} />
          <div className="relative flex flex-col items-center justify-center">
             <BottomNavItem icon={<MoreHorizontal size={22}/>} label="Mais" active={['scheduling', 'packages', 'messages', 'database'].includes(view)} onClick={() => setShowMobileMenu(!showMobileMenu)} />
             {showMobileMenu && (
               <div className="absolute bottom-14 right-2 bg-slate-900 rounded-lg shadow-2xl p-1.5 w-48 flex flex-col z-[110] border border-slate-800 animate-in slide-in-from-bottom-2">
                 <MobileSubItem icon={<Database size={16} className="text-blue-500"/>} label="Banco de Dados" onClick={() => { setView('database'); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<BellRing size={16} className="text-emerald-500"/>} label="Automação Zap" onClick={() => { setView('scheduling'); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<Layers size={16} className="text-amber-500"/>} label="Config Planos" onClick={() => { setView('packages'); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<MessageSquare size={16} className="text-purple-500"/>} label="Modelos Zap" onClick={() => { setView('messages'); setShowMobileMenu(false); }} />
                 <div className="h-px bg-slate-800 my-1"></div>
                 <MobileSubItem icon={theme === 'dark' ? <Sun size={16} className="text-amber-400"/> : <Moon size={16}/>} label="Alternar Tema" onClick={() => { toggleTheme(); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<LogOut size={16} className="text-red-500"/>} label="Sair" onClick={() => { handleLogout(); setShowMobileMenu(false); }} />
               </div>
             )}
          </div>
        </nav>
      </div>
      
      {/* Modals */}
      {selectedClientForRenewal && <RenewalModal theme={theme} client={selectedClientForRenewal} packages={packages} onRenew={registerRenewal} onClose={() => setSelectedClientForRenewal(null)} />}
      {selectedClientForMsg && <MessageModal theme={theme} client={selectedClientForMsg} templates={templates} onSend={sendWhatsApp} onClose={() => setSelectedClientForMsg(null)} />}
      {selectedClientDetails && <ClientDetailsModal theme={theme} client={selectedClientDetails} onClose={() => setSelectedClientDetails(null)} />}
      {selectedClientForEdit && <EditClientModal theme={theme} client={selectedClientForEdit} packages={packages} onEdit={handleEditClient} onClose={() => setSelectedClientForEdit(null)} />}
    </div>
  );
}

// Helper Components
function BottomNavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 min-w-[50px] transition-colors active:scale-95 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
}

function MobileSubItem({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 p-2.5 text-[12px] font-medium text-white hover:bg-white/10 rounded-md uppercase transition-colors">
      {icon} {label}
    </button>
  );
}

/* Modals */
function ClientDetailsModal({ client, onClose, theme }: any) {
  const profit = client.price - client.expenses;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-tight">Ficha do Cliente</h3>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-all"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto hide-scrollbar">
          <DetailRow theme={theme} label="Nome Completo" value={client.name} icon={<Users size={16}/>}/>
          <DetailRow theme={theme} label="WhatsApp" value={client.phone} icon={<Smartphone size={16}/>}/>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow theme={theme} label="Usuário" value={client.username} icon={<Tag size={16}/>} isMono/>
            <DetailRow theme={theme} label="Senha" value={client.password || '---'} icon={<Tag size={16}/>} isMono/>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
          <div className="grid grid-cols-2 gap-3">
             <DetailRow theme={theme} label="Pacote" value={client.packageName} icon={<Layers size={16}/>} isHighlight/>
             <DetailRow theme={theme} label="App" value={client.appName || '---'} icon={<Smartphone size={16}/>}/>
          </div>
          <div className="grid grid-cols-3 gap-2">
             <DetailRow theme={theme} label="Venda" value={`R$ ${client.price.toFixed(2)}`} icon={<DollarSign size={14}/>} isHighlight/>
             <DetailRow theme={theme} label="Custo" value={`R$ ${client.expenses.toFixed(2)}`} icon={<ArrowUpRight size={14}/>}/>
             <DetailRow theme={theme} label="Lucro" value={`R$ ${profit.toFixed(2)}`} icon={<TrendingUp size={14}/>} className="text-emerald-500"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <DetailRow theme={theme} label="Início" value={new Date(client.createdAt).toLocaleDateString('pt-BR')} icon={<Calendar size={16}/>} />
             <DetailRow theme={theme} label="Vencimento" value={new Date(client.expiresAt).toLocaleDateString('pt-BR')} icon={<Clock size={16}/>} className="text-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditClientModal({ client, packages, onEdit, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-tight">Editar Registro</h3>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-all"><X size={18}/></button>
        </div>
        <form className="p-5 space-y-3 max-h-[80vh] overflow-y-auto hide-scrollbar" onSubmit={(e) => { e.preventDefault(); onEdit(Object.fromEntries(new FormData(e.currentTarget))); }}>
          <FormInput theme={theme} name="name" label="Nome do Cliente" defaultValue={client.name} required />
          <FormInput theme={theme} name="phone" label="Zap" defaultValue={client.phone} required />
          <div className="grid grid-cols-2 gap-3">
            <FormInput theme={theme} name="username" label="Login Usuário" defaultValue={client.username} required />
            <FormInput theme={theme} name="password" label="Senha Acesso" defaultValue={client.password} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano Sugerido</label>
            <select name="packageId" defaultValue={client.packageId} className={`w-full p-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
              {packages.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput theme={theme} name="price" label="Valor Cobrado" type="number" step="0.01" defaultValue={client.price} required />
            <FormInput theme={theme} name="expenses" label="Custo Painel" type="number" step="0.01" defaultValue={client.expenses} required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md font-bold uppercase text-[12px] shadow-sm mt-2 hover:bg-blue-700">Salvar Alterações</button>
        </form>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon, isMono, isHighlight, theme, className }: any) {
  return (
    <div className={`p-2.5 rounded-md border shadow-sm ${isHighlight ? 'bg-blue-500/10 border-blue-500/30' : theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
        {icon} {label}
      </span>
      <div className={`text-[13px] font-medium truncate ${isMono ? 'font-mono tracking-tight' : ''} ${isHighlight ? 'text-blue-500' : 'text-slate-800 dark:text-white'} ${className}`}>
        {value}
      </div>
    </div>
  );
}

function RenewalModal({ client, packages, onRenew, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-blue-600 px-5 py-4 text-white flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-tight">Renovar Sinal</h3>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-all"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-3">
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => onRenew(client.id, pkg.id)} className={`w-full text-left p-4 rounded-md border transition-all flex items-center justify-between group active:scale-[0.98] shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-emerald-500/5' : 'bg-slate-50 border-slate-100 hover:bg-emerald-50'}`}>
              <div>
                <div className="font-bold text-[13px] uppercase group-hover:text-emerald-500 transition-colors tracking-tight">{pkg.name}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">Investimento: R$ {pkg.price.toFixed(2)}</div>
              </div>
              <ArrowUpRight size={20} className="text-emerald-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageModal({ client, templates, onSend, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-emerald-600 px-5 py-4 text-white flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-tight">Enviar Mensagem</h3>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-all"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-3">
          {templates.map((tpl: any) => (
            <button key={tpl.id} onClick={() => onSend(tpl, client)} className={`w-full text-left p-4 rounded-md border transition-all flex justify-between items-center group active:scale-[0.98] shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-blue-500/5' : 'bg-slate-50 border-slate-100 hover:bg-blue-50'}`}>
              <span className="font-bold text-[12px] uppercase tracking-widest group-hover:text-blue-500 transition-colors">{tpl.title}</span>
              <Send size={18} className="text-blue-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
