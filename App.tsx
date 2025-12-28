
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
  BellOff
} from 'lucide-react';
import { Client, Package, MessageTemplate, MessageRule, ClientStatus, PaymentStatus } from './types';
import { geminiService } from './services/geminiService';

const PANEL_NAME = "EFLIXTV";
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('eflixtv_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

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

  // Sistema de Notificações
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');
  const notifiedIds = useRef<Set<string>>(new Set());

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('iptv_clients_v4');
    return saved ? JSON.parse(saved) : [];
  });

  const [packages, setPackages] = useState<Package[]>(() => {
    const saved = localStorage.getItem('iptv_packages_v4');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', name: 'Básico SD/HD', price: 25, cost: 8, months: 1 },
      { id: 'p2', name: 'Completo 4K', price: 35, cost: 12, months: 1 },
      { id: 'p3', name: 'Trimestral Promo', price: 90, cost: 36, months: 3 }
    ];
  });

  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    const saved = localStorage.getItem('iptv_templates_v4');
    return saved ? JSON.parse(saved) : [
      { id: 't1', title: 'BOAS-VINDAS', body: 'Olá {{nome}}! Seus dados: User: {{usuario}} / Pass: {{senha}}' }
    ];
  });

  const [rules, setRules] = useState<MessageRule[]>(() => {
    const saved = localStorage.getItem('iptv_rules_v4');
    return saved ? JSON.parse(saved) : [
      { id: 'r1', type: 'before', days: 3, time: '09:00', templateId: 't1', isActive: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem('iptv_clients_v4', JSON.stringify(clients));
    localStorage.setItem('iptv_packages_v4', JSON.stringify(packages));
    localStorage.setItem('iptv_templates_v4', JSON.stringify(templates));
    localStorage.setItem('iptv_rules_v4', JSON.stringify(rules));
  }, [clients, packages, templates, rules]);

  useEffect(() => {
    localStorage.setItem('eflixtv_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Lógica de Notificações Ativas
  useEffect(() => {
    const checkNotifications = () => {
      if (!notificationsEnabled) return;

      const now = new Date();
      const todayStr = now.toLocaleDateString('pt-BR');
      const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:mm"

      clients.forEach(client => {
        const expiryDate = new Date(client.expiresAt);
        const expiryStr = expiryDate.toLocaleDateString('pt-BR');

        // 1. Alerta de Vencimento no Dia
        if (expiryStr === todayStr) {
          const notifyId = `expiry-${client.id}-${todayStr}`;
          if (!notifiedIds.current.has(notifyId)) {
            sendNotification('🚨 Vencimento Hoje!', `O cliente ${client.name} vence hoje.`);
            notifiedIds.current.add(notifyId);
          }
        }

        // 2. Alerta de Mensagens Agendadas (Próximos 5 minutos)
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

    const interval = setInterval(checkNotifications, 60000); // Checa a cada minuto
    checkNotifications(); // Checa ao montar
    return () => clearInterval(interval);
  }, [clients, rules, notificationsEnabled]);

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    if (permission === 'granted') {
      sendNotification('🔔 Notificações Ativas!', 'Você receberá alertas de vencimento e agendamentos.');
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/5977/5977591.png'
      });
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const isExpired = (date: string) => new Date(date) < new Date();

  const handleExportData = () => {
    const data = {
      clients,
      packages,
      templates,
      rules,
      exportedAt: new Date().toISOString(),
      version: "4.0"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_eflixtv_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.clients && Array.isArray(data.clients)) {
          if (confirm('Atenção: Isso irá substituir todos os dados atuais. Deseja continuar?')) {
            setClients(data.clients);
            if (data.packages) setPackages(data.packages);
            if (data.templates) setTemplates(data.templates);
            if (data.rules) setRules(data.rules);
            alert('Dados restaurados com sucesso!');
            setView('dashboard');
          }
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const stats = useMemo(() => {
    return clients.reduce((acc, c) => {
      acc.totalLTV += c.totalPaid;
      acc.monthlyRevenue += c.price;
      acc.monthlyCosts += c.expenses;
      const expired = isExpired(c.expiresAt);
      if (c.status === 'blocked') acc.blockedCount++;
      else if (expired) acc.expiredCount++;
      else acc.activeCount++;
      if (c.paymentStatus === 'pending') acc.pendingPaymentCount++;
      return acc;
    }, { 
      totalLTV: 0, monthlyRevenue: 0, monthlyCosts: 0, 
      activeCount: 0, expiredCount: 0, blockedCount: 0, 
      pendingPaymentCount: 0 
    });
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (c.macKey || '').toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleUpdateClient = (clientId: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
  };

  const handleToggleStatus = (client: Client) => {
    const newStatus: ClientStatus = client.status === 'active' ? 'blocked' : 'active';
    handleUpdateClient(client.id, { status: newStatus });
  };

  const handleTogglePayment = (client: Client) => {
    const newStatus: PaymentStatus = client.paymentStatus === 'paid' ? 'pending' : 'paid';
    handleUpdateClient(client.id, { paymentStatus: newStatus });
  };

  const handleAddClient = (form: any) => {
    const pkg = packages.find(p => p.id === form.packageId);
    const expiryDate = new Date(`${form.expiryDate}T${form.expiryTime || '00:00'}`);
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
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
      paymentHistory: form.isPaid ? [{ 
        id: Math.random().toString(36).substr(2,5), 
        amount: Number(form.price), 
        date: new Date().toISOString(), 
        monthsPaid: pkg?.months || 1, 
        method: 'Cadastro' 
      }] : [],
      totalPaid: form.isPaid ? Number(form.price) : 0
    };
    setClients([...clients, newClient]);
    setView('clients');
  };

  const handleEditClient = (form: any) => {
    const pkg = packages.find(p => p.id === form.packageId);
    const expiryDate = new Date(`${form.expiryDate}T${form.expiryTime || '00:00'}`);
    handleUpdateClient(selectedClientForEdit!.id, {
      name: form.name,
      phone: form.phone,
      username: form.username,
      password: form.password,
      packageName: pkg?.name || 'Personalizado',
      packageId: form.packageId,
      price: Number(form.price),
      expenses: Number(form.expenses),
      expiresAt: expiryDate.toISOString(),
      appName: form.appName,
      macKey: form.macKey,
      notes: form.notes
    });
    setSelectedClientForEdit(null);
  };

  const registerRenewal = (clientId: string, packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const baseDate = isExpired(c.expiresAt) ? new Date() : new Date(c.expiresAt);
        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + pkg.months);
        const newRecord = { 
          id: Math.random().toString(36).substr(2,5), amount: pkg.price, date: new Date().toISOString(), 
          monthsPaid: pkg.months, method: 'Renovação' 
        };
        return { 
          ...c, expiresAt: newExpiry.toISOString(), paymentStatus: 'paid', 
          totalPaid: c.totalPaid + pkg.price, paymentHistory: [newRecord, ...c.paymentHistory], 
          packageName: pkg.name, price: pkg.price, expenses: pkg.cost 
        };
      }
      return c;
    }));
    setSelectedClientForRenewal(null);
  };

  const sendWhatsApp = (template: MessageTemplate | string, client: Client) => {
    let body = "";
    if (typeof template === 'string') body = template;
    else {
      body = template.body
        .replace(/{{nome}}/g, client.name)
        .replace(/{{usuario}}/g, client.username)
        .replace(/{{senha}}/g, client.password || '***')
        .replace(/{{vencimento}}/g, new Date(client.expiresAt).toLocaleDateString('pt-BR'))
        .replace(/{{valor}}/g, client.price.toFixed(2));
    }
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden font-normal transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><Activity size={22} className="text-white" /></div>
          <h1 className="text-lg font-bold uppercase tracking-tighter">{PANEL_NAME}</h1>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2 hide-scrollbar">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={20} />} label="Meus Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <SidebarItem icon={<UserPlus size={20} />} label="Novo Cliente" active={view === 'add'} onClick={() => setView('add')} />
          <SidebarItem icon={<History size={20} />} label="Faturamento" active={view === 'history'} onClick={() => setView('history')} />
          <SidebarItem icon={<CalendarDays size={20} />} label="Agenda Zap" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          
          <div className="pt-6 pb-2 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ajustes & Config</div>
          <SidebarItem icon={<Layers size={20} />} label="Planos & Preços" active={view === 'packages'} onClick={() => setView('packages')} />
          <SidebarItem icon={<MessageSquare size={20} />} label="Modelos Mensagem" active={view === 'messages'} onClick={() => setView('messages')} />
          <SidebarItem icon={<Database size={20} />} label="Banco de Dados" active={view === 'database'} onClick={() => setView('database')} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all border border-slate-700/50">
            <span className="text-[11px] font-bold uppercase">{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</span>
            {theme === 'dark' ? <Moon size={16} className="text-blue-400" /> : <Sun size={16} className="text-amber-400" />}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`px-4 py-4 flex items-center justify-between pt-safe shrink-0 border-b z-20 transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
          <div className="flex items-center gap-3">
             <h2 className={`text-base font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {view === 'dashboard' && 'Visão Geral'}
              {view === 'history' && 'Matriz Mensal'}
              {view === 'clients' && 'Lista de Clientes'}
              {view === 'scheduling' && 'Alertas Automáticos'}
              {view === 'add' && 'Adicionar Cliente'}
              {view === 'packages' && 'Meus Planos'}
              {view === 'messages' && 'Modelos WhatsApp'}
              {view === 'database' && 'Gestão de Dados'}
            </h2>
            <button onClick={notificationsEnabled ? () => {} : requestPermission} className={`p-1.5 rounded-md transition-colors ${notificationsEnabled ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {notificationsEnabled ? <Bell size={18}/> : <BellOff size={18}/>}
            </button>
          </div>
          
          <button onClick={() => geminiService.analyzeBusiness(clients).then(setAiAnalysis)} className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-all shadow-sm">
            <TrendingUp size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-32 p-4 md:p-8 hide-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {aiAnalysis && (
              <div className="p-5 bg-blue-600 text-white rounded-lg relative shadow-lg overflow-hidden animate-in fade-in">
                <button onClick={() => setAiAnalysis(null)} className="absolute top-3 right-3 text-white/50 hover:text-white"><X size={20}/></button>
                <h4 className="font-bold text-[10px] mb-2 uppercase tracking-widest opacity-80">Insight Inteligência Artificial:</h4>
                <p className="text-[13px] leading-relaxed font-medium">{aiAnalysis}</p>
              </div>
            )}

            {view === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard title="Ativos" value={stats.activeCount} icon={<CheckCircle size={22}/>} color="emerald" theme={theme} />
                  <StatCard title="A Vencer" value={stats.pendingPaymentCount} icon={<AlertCircle size={22}/>} color="amber" theme={theme} />
                  <StatCard title="Vencidos" value={stats.expiredCount} icon={<Clock size={22}/>} color="red" theme={theme} />
                  <StatCard title="Blocks" value={stats.blockedCount} icon={<UserX size={22}/>} color="slate" theme={theme} />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard title="Receita" value={`R$ ${stats.monthlyRevenue.toFixed(2)}`} icon={<DollarSign size={22}/>} color="blue" theme={theme} />
                  <StatCard title="Custos" value={`R$ ${stats.monthlyCosts.toFixed(2)}`} icon={<Layers size={22}/>} color="red" theme={theme} />
                  <StatCard title="Lucro" value={`R$ ${(stats.monthlyRevenue - stats.monthlyCosts).toFixed(2)}`} icon={<TrendingUp size={22}/>} color="emerald" theme={theme} />
                  <StatCard title="LTV" value={`R$ ${stats.totalLTV.toFixed(2)}`} icon={<Activity size={22}/>} color="blue" theme={theme} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`rounded-lg border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-sm font-bold uppercase flex items-center gap-2 tracking-tight"><CreditCard size={18} className="text-amber-500"/> Cobranças Prioritárias</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {clients.filter(c => c.paymentStatus === 'pending' || isExpired(c.expiresAt)).slice(0, 5).map(c => (
                        <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex flex-col min-w-0 pr-4">
                            <span className="font-bold text-[15px] truncate">{c.name}</span>
                            <span className="text-[11px] opacity-60 font-bold uppercase mt-1">{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <button onClick={() => sendWhatsApp(`Olá ${c.name}, seu acesso está próximo do vencimento (${new Date(c.expiresAt).toLocaleDateString('pt-BR')}). Deseja renovar agora?`, c)} className="p-3.5 bg-emerald-500 text-white rounded-lg shrink-0 active:scale-95 shadow-md"><MessageSquare size={20}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <RecentActivityCard title="Últimos Pagamentos" theme={theme} items={clients.flatMap(c => c.paymentHistory.map(h => ({...h, clientName: c.name}))).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)} />
                </div>
              </div>
            )}

            {view === 'clients' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input type="text" placeholder="Nome, Login ou MAC..." className={`w-full pl-12 pr-4 py-3.5 rounded-lg outline-none text-[15px] font-medium border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    <FilterChip active={statusFilter === 'all'} label="Todos" theme={theme} onClick={() => setStatusFilter('all')} />
                    <FilterChip active={statusFilter === 'active'} label="Ativos" theme={theme} onClick={() => setStatusFilter('active')} />
                    <FilterChip active={statusFilter === 'expired'} label="Vencidos" theme={theme} onClick={() => setStatusFilter('expired')} />
                    <FilterChip active={statusFilter === 'blocked'} label="Blocks" theme={theme} onClick={() => setStatusFilter('blocked')} />
                  </div>

                  <div className="flex gap-3 items-center">
                    <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} className={`flex-1 p-3.5 rounded-lg border text-[12px] font-bold uppercase outline-none appearance-none text-center shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <option value="all">Pagam: Todos</option>
                      <option value="paid">Confirmados</option>
                      <option value="pending">Pendentes</option>
                    </select>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className={`flex-1 p-3.5 rounded-lg border text-[12px] font-bold uppercase outline-none appearance-none text-center shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <option value="asc">Vencimento ↑</option>
                      <option value="desc">Vencimento ↓</option>
                    </select>
                  </div>
                </div>

                <div className="md:hidden space-y-4">
                  {filteredClients.map(c => {
                    const expired = isExpired(c.expiresAt);
                    return (
                      <div key={c.id} className={`p-5 rounded-lg border shadow-lg relative overflow-hidden transition-all active:scale-[0.98] ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0 pr-3">
                            <h4 className="font-bold text-[18px] truncate leading-tight text-slate-900 dark:text-white">{c.name}</h4>
                            <div className="text-[13px] opacity-60 font-bold uppercase truncate mt-1">{c.username}</div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                             <button onClick={() => handleToggleStatus(c)} className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border shadow-sm ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>{c.status === 'blocked' ? 'Block' : expired ? 'Exp' : 'On'}</button>
                             <button onClick={() => handleTogglePayment(c)} className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border shadow-sm ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30'}`}>{c.paymentStatus === 'paid' ? 'Pago' : 'Pend'}</button>
                          </div>
                        </div>
                        <div className="flex gap-3 mb-4">
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border dark:border-slate-800">
                             <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Vencimento</div>
                             <div className={`text-[14px] font-bold truncate ${expired && c.status === 'active' ? 'text-red-500' : ''}`}>{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</div>
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border dark:border-slate-800">
                             <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Pacote</div>
                             <div className="text-[14px] font-bold truncate uppercase">{c.packageName}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
                          <div className="flex gap-2.5">
                             <ActionButton onClick={() => setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={24}/>} />
                             <ActionButton onClick={() => setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={24}/>} />
                             <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={24}/>} />
                             <ActionButton onClick={() => setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={24}/>} />
                          </div>
                          <ActionButton onClick={() => { if(confirm('Excluir cliente?')) setClients(prev => prev.filter(cl => cl.id !== c.id)) }} theme={theme} color="red" icon={<Trash2 size={24}/>} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block rounded-lg border shadow-md overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead className={`border-b ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <tr>
                        <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Vencimento</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Plano</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Sinal</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Pagto</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {filteredClients.map(c => {
                        const expired = isExpired(c.expiresAt);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-[14px]">{c.name}</span>
                                <span className="text-[10px] opacity-50 font-bold uppercase">{c.username}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className={`text-[12px] font-bold ${expired && c.status === 'active' ? 'text-red-500' : ''}`}>{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</div>
                            </td>
                            <td className="px-5 py-4 text-center text-[12px] font-bold uppercase">{c.packageName}</td>
                            <td className="px-5 py-4 text-center">
                              <button onClick={() => handleToggleStatus(c)} className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase border shadow-sm ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>{c.status === 'blocked' ? 'Block' : expired ? 'Venc' : 'On'}</button>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button onClick={() => handleTogglePayment(c)} className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase border shadow-sm ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20'}`}>{c.paymentStatus === 'paid' ? 'Pago' : 'Pnd'}</button>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <ActionButton onClick={() => setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={18}/>} />
                                <ActionButton onClick={() => setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={18}/>} />
                                <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={18}/>} />
                                <ActionButton onClick={() => setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={18}/>} />
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
              <div className={`p-6 rounded-lg border shadow-xl max-w-xl mx-auto animate-in zoom-in-95 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-xl font-bold uppercase mb-8 flex items-center gap-3"><PlusCircle size={28}/> Novo Cadastro</h3>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-5" onSubmit={(e) => {
                  e.preventDefault();
                  handleAddClient(Object.fromEntries(new FormData(e.currentTarget)));
                }}>
                  <FormInput theme={theme} name="name" label="Nome do Cliente" placeholder="Ex: João da Silva" required />
                  <FormInput theme={theme} name="phone" label="Zap (Ex: 55119...)" required />
                  <FormInput theme={theme} name="username" label="Login Usuário" required />
                  <FormInput theme={theme} name="password" label="Senha Painel" />
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Plano Base</label>
                    <select name="packageId" className={`w-full p-4 rounded-lg border text-[15px] font-bold outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                      {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput theme={theme} name="price" label="Valor Venda" type="number" step="0.01" required />
                    <FormInput theme={theme} name="expenses" label="Custo Painel" type="number" step="0.01" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput theme={theme} name="expiryDate" label="Início" type="date" required />
                    <FormInput theme={theme} name="expiryTime" label="Hora" type="time" defaultValue="00:00" />
                  </div>
                  <FormInput theme={theme} name="appName" label="App Sugerido" />
                  <FormInput theme={theme} name="macKey" label="ID / MAC / Key" />
                  <div className="sm:col-span-2 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3 shadow-sm">
                    <input type="checkbox" name="isPaid" id="isPaid" className="w-6 h-6 accent-emerald-600 rounded cursor-pointer" />
                    <label htmlFor="isPaid" className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400 uppercase cursor-pointer">Marcar como Pago</label>
                  </div>
                  <button type="submit" className="sm:col-span-2 bg-blue-600 text-white py-4 rounded-lg font-bold uppercase text-[14px] shadow-lg mt-4 active:scale-95 transition-all">Salvar Cadastro</button>
                </form>
              </div>
            )}

            {view === 'history' && (
              <div className={`rounded-lg border shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="p-4 flex items-center justify-between border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentYear(y => y-1)} className="p-2.5 border rounded-lg dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"><ChevronLeft size={20}/></button>
                    <span className="font-bold text-lg">{currentYear}</span>
                    <button onClick={() => setCurrentYear(y => y+1)} className="p-2.5 border rounded-lg dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"><ChevronRight size={20}/></button>
                  </div>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80">
                      <tr>
                        <th className={`px-6 py-4 text-[11px] font-bold text-slate-400 uppercase sticky left-0 z-20 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>Cliente</th>
                        {MONTHS.map(m => <th key={m} className="px-2 py-4 text-[11px] font-bold text-slate-400 uppercase text-center">{m}</th>)}
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase text-right">Faturado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {clients.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className={`px-6 py-4 text-[14px] font-bold sticky left-0 z-10 transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>{c.name}</td>
                          {MONTHS.map((_, i) => {
                            const status = getMonthStatus(c, i, currentYear);
                            function getMonthStatus(client: Client, monthIndex: number, year: number) {
                              const monthEnd = new Date(year, monthIndex + 1, 0);
                              const expiry = new Date(client.expiresAt);
                              const created = new Date(client.createdAt);
                              if (monthEnd < created) return 'none';
                              if (expiry >= monthEnd) return 'paid';
                              return 'overdue';
                            }
                            return (
                              <td key={i} className="px-1.5 py-4 text-center">
                                <div className={`w-8 h-8 mx-auto rounded-md flex items-center justify-center shadow-sm ${status === 'paid' ? 'bg-emerald-500 text-white' : status === 'overdue' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}`}>
                                  {status === 'paid' && <Check size={18}/>}
                                  {status === 'overdue' && <X size={18}/>}
                                  {status === 'none' && <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30"></div>}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 text-right text-[12px] font-bold text-emerald-600">R$ {c.totalPaid.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === 'database' && (
              <div className="max-w-xl mx-auto space-y-6 animate-in fade-in">
                <div className={`p-8 rounded-lg border shadow-xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-600 rounded-lg text-white shadow-lg"><Database size={32}/></div>
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-tight">Gestão de Dados</h3>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Segurança e Portabilidade</p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-4 mb-8">
                    <ShieldAlert className="text-amber-500 shrink-0" size={24}/>
                    <p className="text-[13px] text-amber-800 dark:text-amber-300 font-medium">
                      O Painel EFLIXTV armazena seus dados localmente no navegador. Ative as notificações para receber alertas críticos em tempo real.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={notificationsEnabled ? () => {} : requestPermission} className={`flex items-center justify-between p-5 rounded-lg border-2 transition-all group active:scale-[0.98] ${notificationsEnabled ? 'border-emerald-600/20 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/10'}`}>
                       <div className="flex items-center gap-4">
                        <Bell className={notificationsEnabled ? 'text-emerald-600' : 'text-slate-400'} size={24}/>
                        <div className="text-left">
                          <div className={`font-bold text-[14px] uppercase ${notificationsEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>{notificationsEnabled ? 'Notificações Ativas' : 'Ativar Notificações'}</div>
                          <div className="text-[11px] opacity-60 font-bold uppercase">{notificationsEnabled ? 'Você receberá alertas' : 'Permitir alertas no navegador'}</div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="opacity-50"/>
                    </button>

                    <button onClick={handleExportData} className="flex items-center justify-between p-5 rounded-lg border-2 border-blue-600/20 hover:border-blue-600 bg-blue-50 dark:bg-blue-900/10 transition-all group active:scale-[0.98]">
                      <div className="flex items-center gap-4">
                        <Download className="text-blue-600" size={24}/>
                        <div className="text-left">
                          <div className="font-bold text-[14px] uppercase text-blue-600">Exportar Backup</div>
                          <div className="text-[11px] opacity-60 font-bold uppercase">Baixar arquivo .json</div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-blue-600 opacity-50 group-hover:opacity-100"/>
                    </button>

                    <label className="flex items-center justify-between p-5 rounded-lg border-2 border-emerald-600/20 hover:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 transition-all group cursor-pointer active:scale-[0.98]">
                      <div className="flex items-center gap-4">
                        <Upload className="text-emerald-600" size={24}/>
                        <div className="text-left">
                          <div className="font-bold text-[14px] uppercase text-emerald-600">Restaurar Backup</div>
                          <div className="text-[11px] opacity-60 font-bold uppercase">Carregar arquivo .json</div>
                        </div>
                      </div>
                      <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                      <ChevronRight size={20} className="text-emerald-600 opacity-50 group-hover:opacity-100"/>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {view === 'packages' && (
              <div className="max-w-xl mx-auto space-y-6">
                <div className={`p-6 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[14px] uppercase mb-6 text-blue-500 tracking-wide">Novo Plano de Serviço</h4>
                   <form className="grid grid-cols-2 gap-4" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     setPackages([...packages, { 
                       id: Math.random().toString(36).substr(2,9), 
                       name: (fd.get('name') as string).toUpperCase(), 
                       price: Number(fd.get('price')), 
                       cost: Number(fd.get('cost')), 
                       months: Number(fd.get('months')) 
                     }]);
                     e.currentTarget.reset();
                   }}>
                     <div className="col-span-2"><FormInput theme={theme} name="name" label="Nome do Plano" placeholder="Ex: MENSAL 4K" required /></div>
                     <FormInput theme={theme} name="price" label="Preço Venda" type="number" step="0.01" required />
                     <FormInput theme={theme} name="cost" label="Custo Painel" type="number" step="0.01" required />
                     <button type="submit" className="col-span-2 bg-blue-600 text-white rounded-lg font-bold uppercase text-[12px] py-4 mt-2 active:scale-95 transition-all shadow-md">Salvar Plano</button>
                   </form>
                </div>
                {packages.map(p => (
                  <div key={p.id} className={`p-5 rounded-lg border flex justify-between items-center shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div>
                      <div className="font-bold text-[15px]">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-bold uppercase mt-1">Venda: R$ {p.price.toFixed(2)} • Custo: R$ {p.cost.toFixed(2)}</div>
                    </div>
                    <button onClick={() => setPackages(packages.filter(x => x.id !== p.id))} className="p-2.5 text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg active:scale-90"><Trash2 size={24}/></button>
                  </div>
                ))}
              </div>
            )}

            {view === 'messages' && (
              <div className="max-w-xl mx-auto space-y-6">
                <div className={`p-6 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[14px] uppercase mb-6 text-emerald-500 tracking-wide">Nova Mensagem Zap</h4>
                   <form className="space-y-5" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     setTemplates([...templates, { id: Math.random().toString(36).substr(2,9), title: (fd.get('title') as string).toUpperCase(), body: fd.get('body') as string }]);
                     e.currentTarget.reset();
                   }}>
                     <FormInput theme={theme} name="title" label="Identificador" placeholder="Ex: COBRANÇA MENSAL" required />
                     <textarea name="body" className={`w-full p-4 rounded-lg outline-none border text-[14px] font-medium leading-relaxed ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 placeholder-slate-400 shadow-sm'}`} rows={6} placeholder="Variáveis: {{nome}}, {{usuario}}, {{senha}}, {{vencimento}}, {{valor}}"></textarea>
                     <button type="submit" className="w-full bg-emerald-600 text-white rounded-lg font-bold uppercase text-[12px] py-4 active:scale-95 transition-all shadow-md">Salvar Modelo</button>
                   </form>
                </div>
                {templates.map(t => (
                  <div key={t.id} className={`p-6 rounded-lg border relative shadow-md ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <button onClick={() => setTemplates(templates.filter(x => x.id !== t.id))} className="absolute top-4 right-4 text-red-300 hover:text-red-500 active:scale-90"><Trash2 size={24}/></button>
                    <span className="text-[12px] font-bold uppercase text-blue-500 block mb-3 tracking-wider">{t.title}</span>
                    <p className="text-[14px] italic opacity-70 leading-relaxed">"{t.body}"</p>
                  </div>
                ))}
              </div>
            )}

            {view === 'scheduling' && (
              <div className="max-w-xl mx-auto space-y-6">
                <div className={`p-6 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[14px] uppercase mb-6 text-blue-500 tracking-wide">Programar Notificações</h4>
                   <form className="grid grid-cols-2 gap-5 items-end" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     setRules([...rules, { id: Math.random().toString(36).substr(2,9), type: fd.get('type') as any, days: Number(fd.get('days')), time: fd.get('time') as string, templateId: fd.get('templateId') as string, isActive: true }]);
                     e.currentTarget.reset();
                   }}>
                     <FormInput theme={theme} name="days" label="Dias antes/depois" type="number" defaultValue="0" />
                     <FormInput theme={theme} name="time" label="Hora Alerta" type="time" defaultValue="09:00" />
                     <button type="submit" className="col-span-2 bg-blue-600 text-white p-4 rounded-lg font-bold uppercase text-[12px] mt-3 active:scale-95 transition-all shadow-md">Ativar Regra</button>
                   </form>
                </div>
                {rules.map(rule => (
                  <div key={rule.id} className={`p-5 rounded-lg border flex justify-between items-center shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-5">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500"><Clock3 size={24}/></div>
                      <div className="text-[14px] font-bold uppercase">{rule.days} dias {rule.type === 'before' ? 'antes' : 'depois'} às {rule.time}</div>
                    </div>
                    <button onClick={() => setRules(rules.filter(r => r.id !== rule.id))} className="p-2 text-red-400 active:scale-90"><Trash2 size={24}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Menu Inferior Mobile - CENTRALIZAÇÃO FIXA POR GRID */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 items-center justify-items-center py-4 z-[100] pb-safe shadow-2xl transition-colors ${theme === 'dark' ? 'bg-slate-900/98 border-slate-800 backdrop-blur-xl' : 'bg-white/98 border-slate-100 backdrop-blur-xl'}`}>
          <BottomNavItem icon={<LayoutDashboard size={26}/>} label="Painel" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<Users size={26}/>} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          
          <div className="relative flex items-center justify-center w-full h-full">
            <button onClick={() => setView('add')} className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl -mt-12 border-4 border-slate-50 dark:border-slate-950 transition-all active:scale-90 z-[120]">
              <Plus size={32} />
            </button>
          </div>

          <BottomNavItem icon={<History size={26}/>} label="Matriz" active={view === 'history'} onClick={() => setView('history')} />
          
          <div className="relative flex flex-col items-center justify-center">
             <BottomNavItem icon={<MoreHorizontal size={26}/>} label="Mais" active={['scheduling', 'packages', 'messages', 'database'].includes(view)} onClick={() => setShowMobileMenu(!showMobileMenu)} />
             {showMobileMenu && (
               <div className="absolute bottom-16 right-2 bg-slate-900 rounded-lg shadow-2xl p-2 w-52 flex flex-col z-[110] border border-slate-800 animate-in slide-in-from-bottom-2">
                 <MobileSubItem icon={<Database size={20} className="text-blue-500"/>} label="Banco de Dados" onClick={() => { setView('database'); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<BellRing size={20} className="text-emerald-500"/>} label="Agenda Zap" onClick={() => { setView('scheduling'); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<Layers size={20} className="text-amber-500"/>} label="Config Planos" onClick={() => { setView('packages'); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<MessageSquare size={20} className="text-purple-500"/>} label="Modelos Zap" onClick={() => { setView('messages'); setShowMobileMenu(false); }} />
                 <div className="h-px bg-slate-800 my-2"></div>
                 <MobileSubItem icon={theme === 'dark' ? <Sun size={20} className="text-amber-400"/> : <Moon size={20}/>} label="Alternar Tema" onClick={() => { toggleTheme(); setShowMobileMenu(false); }} />
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

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon}
      <span className="font-bold text-[13px]">{label}</span>
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1.5 min-w-[60px] transition-colors active:scale-95 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function MobileSubItem({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-3.5 p-3.5 text-[13px] font-bold text-white hover:bg-white/10 rounded-lg uppercase transition-colors">
      {icon} {label}
    </button>
  );
}

function ActionButton({ onClick, color, icon, theme }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800',
    red: 'text-red-400 bg-red-50 dark:bg-red-900/30 dark:text-red-400 border-red-100 dark:border-red-800'
  };
  return (
    <button onClick={onClick} className={`p-2.5 rounded-lg border transition-all active:scale-90 flex items-center justify-center shadow-sm ${colors[color]}`}>
      {icon}
    </button>
  );
}

function StatCard({ title, value, icon, color, theme }: any) {
  const colorMap: any = { 
    emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30', 
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30', 
    red: 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30', 
    slate: 'text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/30', 
    amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30' 
  };
  return (
    <div className={`p-4 rounded-lg border shadow-md flex flex-col items-center text-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className={`w-11 h-11 flex items-center justify-center rounded-lg mb-3 border ${colorMap[color]}`}>{icon}</div>
      <div className="text-[17px] font-bold tracking-tight truncate w-full text-slate-800 dark:text-white">{value}</div>
      <div className="text-[10px] font-bold uppercase mt-1 text-slate-400 tracking-wider">{title}</div>
    </div>
  );
}

function FormInput({ label, name, type = "text", theme, ...rest }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
      <input name={name} type={type} className={`w-full p-4 rounded-lg outline-none text-[15px] font-bold border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 shadow-sm'}`} {...rest} />
    </div>
  );
}

function FilterChip({ active, label, onClick, theme }: any) {
  return (
    <button onClick={onClick} className={`px-5 py-3 rounded-lg text-[12px] font-bold transition-all whitespace-nowrap uppercase border shadow-sm ${active ? 'bg-blue-600 border-blue-600 text-white shadow-md' : theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>{label}</button>
  );
}

function ClientDetailsModal({ client, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <h3 className="text-base font-bold uppercase tracking-tight">Ficha do Cliente</h3>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><X size={24}/></button>
        </div>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto hide-scrollbar">
          <DetailRow theme={theme} label="Nome Completo" value={client.name} icon={<Users size={18}/>}/>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow theme={theme} label="Usuário" value={client.username} icon={<Tag size={18}/>} isMono/>
            <DetailRow theme={theme} label="Senha" value={client.password || '---'} icon={<Tag size={18}/>} isMono/>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <DetailRow theme={theme} label="Pacote" value={client.packageName} icon={<Smartphone size={18}/>} isHighlight/>
             <DetailRow theme={theme} label="Valor Cobrado" value={`R$ ${client.price.toFixed(2)}`} icon={<DollarSign size={18}/>}/>
          </div>
          <DetailRow theme={theme} label="ID / MAC / Key" value={client.macKey || 'Não informado'} icon={<Smartphone size={18}/>} isMono/>
          <div className="grid grid-cols-2 gap-3">
             <DetailRow theme={theme} label="Data Início" value={new Date(client.createdAt).toLocaleDateString('pt-BR')} />
             <DetailRow theme={theme} label="Vencimento" value={new Date(client.expiresAt).toLocaleDateString('pt-BR')} />
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
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <h3 className="text-base font-bold uppercase tracking-tight">Editar Registro</h3>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><X size={24}/></button>
        </div>
        <form className="p-6 space-y-5 max-h-[80vh] overflow-y-auto hide-scrollbar" onSubmit={(e) => { e.preventDefault(); onEdit(Object.fromEntries(new FormData(e.currentTarget))); }}>
          <FormInput theme={theme} name="name" label="Nome do Cliente" defaultValue={client.name} required />
          <FormInput theme={theme} name="phone" label="Zap" defaultValue={client.phone} required />
          <div className="grid grid-cols-2 gap-4">
            <FormInput theme={theme} name="username" label="Login Usuário" defaultValue={client.username} required />
            <FormInput theme={theme} name="password" label="Senha Acesso" defaultValue={client.password} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Plano Sugerido</label>
            <select name="packageId" defaultValue={client.packageId} className={`w-full p-4 rounded-lg border text-[15px] font-bold outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
              {packages.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput theme={theme} name="price" label="Valor Cobrado" type="number" step="0.01" defaultValue={client.price} required />
            <FormInput theme={theme} name="expenses" label="Custo Painel" type="number" step="0.01" defaultValue={client.expenses} required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold uppercase text-[13px] shadow-lg mt-4 active:scale-95 transition-all">Salvar Alterações</button>
        </form>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon, isMono, isHighlight, theme }: any) {
  return (
    <div className={`p-4 rounded-lg border shadow-sm ${isHighlight ? 'bg-blue-500/10 border-blue-500/30' : theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
        {icon} {label}
      </span>
      <div className={`text-[15px] font-bold truncate ${isMono ? 'font-mono tracking-tight' : ''} ${isHighlight ? 'text-blue-500' : 'text-slate-800 dark:text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function RenewalModal({ client, packages, onRenew, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <h3 className="text-base font-bold uppercase tracking-tight">Renovar Sinal</h3>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><X size={24}/></button>
        </div>
        <div className="p-6 space-y-4">
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => onRenew(client.id, pkg.id)} className={`w-full text-left p-5 rounded-lg border transition-all flex items-center justify-between group active:scale-[0.98] shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-emerald-500/5' : 'bg-slate-50 border-slate-100 hover:bg-emerald-50'}`}>
              <div>
                <div className="font-bold text-[15px] uppercase group-hover:text-emerald-500 transition-colors tracking-tight">{pkg.name}</div>
                <div className="text-[12px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Investimento: R$ {pkg.price.toFixed(2)}</div>
              </div>
              <ArrowUpRight size={26} className="text-emerald-500" />
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
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <h3 className="text-base font-bold uppercase tracking-tight">Enviar Mensagem</h3>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><X size={24}/></button>
        </div>
        <div className="p-6 space-y-4">
          {templates.map((tpl: any) => (
            <button key={tpl.id} onClick={() => onSend(tpl, client)} className={`w-full text-left p-5 rounded-lg border transition-all flex justify-between items-center group active:scale-[0.98] shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-blue-500/5' : 'bg-slate-50 border-slate-100 hover:bg-blue-50'}`}>
              <span className="font-bold text-[14px] uppercase tracking-widest group-hover:text-blue-500 transition-colors">{tpl.title}</span>
              <Send size={24} className="text-blue-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentActivityCard({ title, items, theme }: any) {
  return (
    <div className={`rounded-lg border shadow-lg overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <h3 className="text-sm font-bold uppercase flex items-center gap-2 tracking-tight"><History size={18} className="text-blue-500"/> {title}</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto hide-scrollbar">
        {items.map((it: any) => (
          <div key={it.id} className="p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex flex-col min-w-0 pr-4">
              <span className="text-[16px] font-bold truncate leading-tight text-slate-800 dark:text-white">{it.clientName}</span>
              <span className="text-[11px] opacity-50 font-bold uppercase mt-1.5 tracking-wider">{new Date(it.date).toLocaleDateString('pt-BR')}</span>
            </div>
            <span className="text-[14px] font-bold text-emerald-500 shrink-0 font-mono">+ R$ {it.amount.toFixed(2)}</span>
          </div>
        ))}
        {items.length === 0 && <div className="p-10 text-center text-slate-400 italic">Nenhum dado recente.</div>}
      </div>
    </div>
  );
}
