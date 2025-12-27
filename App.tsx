
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
  ChevronDown
} from 'lucide-react';
import { Client, Package, MessageTemplate, MessageRule, ClientStatus, PaymentStatus } from './types';
import { geminiService } from './services/geminiService';

const PANEL_NAME = "EFLIXTV";
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('eflixtv_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [view, setView] = useState<'dashboard' | 'clients' | 'history' | 'add' | 'packages' | 'messages' | 'scheduling'>('dashboard');
  const [selectedClientForMsg, setSelectedClientForMsg] = useState<Client | null>(null);
  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState<Client | null>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
  
  // Inline editing state
  const [inlineEditingDate, setInlineEditingDate] = useState<string | null>(null); // clientId
  const [inlineEditingPlan, setInlineEditingPlan] = useState<string | null>(null); // clientId

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Filters and Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'blocked'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Data Persistence
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

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const isExpired = (date: string) => new Date(date) < new Date();

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
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0 shadow-2xl border-r border-slate-800">
        <div className="p-8 flex items-center gap-4">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Activity size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tighter leading-none">{PANEL_NAME}</h1>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Premium Manager</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto hide-scrollbar py-4">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={20} />} label="Lista de Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <SidebarItem icon={<History size={20} />} label="Matriz de Pagamentos" active={view === 'history'} onClick={() => setView('history')} />
          <SidebarItem icon={<CalendarDays size={20} />} label="Agenda & Automação" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          <SidebarItem icon={<PlusCircle size={20} />} label="Cadastrar Novo" active={view === 'add'} onClick={() => setView('add')} />
          
          <div className="pt-8 pb-3 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Configurações</div>
          <SidebarItem icon={<Layers size={20} />} label="Planos de Serviço" active={view === 'packages'} onClick={() => setView('packages')} />
          <SidebarItem icon={<MessageSquare size={20} />} label="Modelos WhatsApp" active={view === 'messages'} onClick={() => setView('messages')} />
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700/50">
            <span className="text-sm font-medium">{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</span>
            {theme === 'dark' ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-amber-400" />}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`px-6 py-5 flex items-center justify-between pt-safe shrink-0 border-b z-20 transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
          <div className="flex items-center gap-3">
             <button className="md:hidden p-2 text-slate-500" onClick={() => setShowMobileMenu(true)}>
               <MoreHorizontal size={24} />
             </button>
             <h2 className={`text-lg font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
               {view === 'dashboard' && 'Estatísticas'}
               {view === 'history' && 'Matriz de Fluxo'}
               {view === 'clients' && 'Meus Clientes'}
               {view === 'scheduling' && 'Automação'}
               {view === 'add' && 'Novo Cliente'}
               {view === 'packages' && 'Serviços'}
               {view === 'messages' && 'Mensagens'}
             </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-all">
              {theme === 'dark' ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-amber-500" />}
            </button>
            <button onClick={() => geminiService.analyzeBusiness(clients).then(setAiAnalysis)} className="flex items-center gap-2 px-4 py-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-all shadow-sm">
              <TrendingUp size={18} />
              <span className="text-xs font-bold uppercase hidden sm:inline">Análise IA</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-40 p-4 md:p-10 hide-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            
            {aiAnalysis && (
              <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl relative shadow-xl shadow-blue-500/20 overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                <button onClick={() => setAiAnalysis(null)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"><X size={20}/></button>
                <h4 className="font-bold text-xs mb-2 uppercase tracking-widest flex items-center gap-2 opacity-80"><Activity size={14}/> Gestor Estratégico IA:</h4>
                <p className="text-sm leading-relaxed font-medium relative z-10">{aiAnalysis}</p>
              </div>
            )}

            {view === 'dashboard' && (
              <div className="space-y-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <StatCard title="Ativos" value={stats.activeCount} icon={<CheckCircle size={22}/>} color="emerald" theme={theme} />
                  <StatCard title="A Vencer" value={stats.pendingPaymentCount} icon={<AlertCircle size={22}/>} color="amber" theme={theme} />
                  <StatCard title="Vencidos" value={stats.expiredCount} icon={<Clock size={22}/>} color="red" theme={theme} />
                  <StatCard title="Bloqueados" value={stats.blockedCount} icon={<UserX size={22}/>} color="slate" theme={theme} />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <StatCard title="Receita Bruta" value={`R$ ${stats.monthlyRevenue.toFixed(2)}`} icon={<DollarSign size={22}/>} color="blue" theme={theme} />
                  <StatCard title="Custos Painel" value={`R$ ${stats.monthlyCosts.toFixed(2)}`} icon={<Layers size={22}/>} color="red" theme={theme} />
                  <StatCard title="Lucro Estimado" value={`R$ ${(stats.monthlyRevenue - stats.monthlyCosts).toFixed(2)}`} icon={<TrendingUp size={22}/>} color="emerald" theme={theme} />
                  <StatCard title="LTV Acumulado" value={`R$ ${stats.totalLTV.toFixed(2)}`} icon={<Activity size={22}/>} color="blue" theme={theme} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className={`rounded-3xl border shadow-sm overflow-hidden transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase flex items-center gap-2 tracking-tight"><CreditCard size={20} className="text-amber-500"/> Cobrança Pendente</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {clients.filter(c => c.paymentStatus === 'pending' || isExpired(c.expiresAt)).slice(0, 5).map(c => (
                        <div key={c.id} className="p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{c.name}</span>
                            <span className="text-[10px] opacity-60 font-bold uppercase mt-0.5">Vencimento: {new Date(c.expiresAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <button onClick={() => sendWhatsApp(`Olá ${c.name}, notamos que o pagamento está pendente. Vamos renovar para manter o sinal ativo?`, c)} className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"><MessageSquare size={18}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <RecentActivityCard title="Últimos Pagamentos" theme={theme} items={clients.flatMap(c => c.paymentHistory.map(h => ({...h, clientName: c.name}))).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)} />
                </div>
              </div>
            )}

            {view === 'clients' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input type="text" placeholder="Pesquisar..." className={`w-full pl-14 pr-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm shadow-sm transition-all border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto hide-scrollbar">
                      <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className={`border rounded-2xl py-3.5 px-6 text-xs font-bold shadow-sm outline-none cursor-pointer appearance-none min-w-[180px] ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <option value="asc">Vencimento ↑ (Próximos)</option>
                        <option value="desc">Vencimento ↓ (Longe)</option>
                      </select>
                      <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} className={`border rounded-2xl py-3.5 px-6 text-xs font-bold shadow-sm outline-none cursor-pointer appearance-none min-w-[180px] ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <option value="all">Todos Pagamentos</option>
                        <option value="paid">Confirmados</option>
                        <option value="pending">Aguardando</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
                    <FilterChip active={statusFilter === 'all'} label="Todos" theme={theme} onClick={() => setStatusFilter('all')} />
                    <FilterChip active={statusFilter === 'active'} label="Ativos" theme={theme} onClick={() => setStatusFilter('active')} />
                    <FilterChip active={statusFilter === 'expired'} label="Vencidos" theme={theme} onClick={() => setStatusFilter('expired')} />
                    <FilterChip active={statusFilter === 'blocked'} label="Bloqueados" theme={theme} onClick={() => setStatusFilter('blocked')} />
                  </div>
                </div>

                {/* Desktop View Table */}
                <div className={`hidden md:block rounded-3xl border shadow-xl overflow-hidden transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className={`border-b transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                        <tr>
                          <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                          <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Data Vencimento</th>
                          <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Plano Ativo</th>
                          <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Sinal</th>
                          <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Pagamento</th>
                          <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y transition-colors ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {filteredClients.map(c => {
                          const expired = isExpired(c.expiresAt);
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="px-8 py-6">
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm tracking-tight">{c.name}</span>
                                  <span className="text-[10px] opacity-50 font-bold uppercase mt-1">{c.username}</span>
                                </div>
                              </td>
                              <td className="px-6 py-6 text-center">
                                {inlineEditingDate === c.id ? (
                                  <div className="flex items-center gap-2 justify-center animate-in fade-in duration-200">
                                    <input 
                                      type="date" 
                                      className={`p-1.5 rounded-lg text-xs font-bold border outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                                      defaultValue={new Date(c.expiresAt).toISOString().split('T')[0]}
                                      onBlur={(e) => {
                                        const date = e.target.value;
                                        if (date) {
                                          const current = new Date(c.expiresAt);
                                          const [y, m, d] = date.split('-').map(Number);
                                          current.setFullYear(y, m - 1, d);
                                          handleUpdateClient(c.id, { expiresAt: current.toISOString() });
                                        }
                                        setInlineEditingDate(null);
                                      }}
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  <button onClick={() => setInlineEditingDate(c.id)} className="group/btn text-center hover:scale-105 transition-all">
                                    <div className={`text-xs font-bold ${expired && c.status === 'active' ? 'text-red-500' : ''}`}>
                                      {new Date(c.expiresAt).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="text-[9px] opacity-40 font-bold mt-0.5 group-hover/btn:opacity-100 transition-all flex items-center justify-center gap-1">
                                      {new Date(c.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} <Pencil size={8}/>
                                    </div>
                                  </button>
                                )}
                              </td>
                              <td className="px-6 py-6 text-center">
                                {inlineEditingPlan === c.id ? (
                                  <select 
                                    className={`p-1.5 rounded-lg text-xs font-bold border outline-none animate-in fade-in duration-200 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                                    defaultValue={c.packageId}
                                    onBlur={() => setInlineEditingPlan(null)}
                                    onChange={(e) => {
                                      const pkg = packages.find(p => p.id === e.target.value);
                                      if (pkg) handleUpdateClient(c.id, { packageName: pkg.name, packageId: pkg.id, price: pkg.price });
                                      setInlineEditingPlan(null);
                                    }}
                                    autoFocus
                                  >
                                    {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  </select>
                                ) : (
                                  <button onClick={() => setInlineEditingPlan(c.id)} className="group/btn text-center hover:scale-105 transition-all">
                                    <div className="text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-1">{c.packageName} <ChevronDown size={10}/></div>
                                    <div className="text-[10px] opacity-50 font-bold group-hover/btn:opacity-100 transition-all">R$ {c.price.toFixed(2)}</div>
                                  </button>
                                )}
                              </td>
                              <td className="px-6 py-6 text-center">
                                <button 
                                  onClick={() => handleToggleStatus(c)}
                                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tighter shadow-sm border transition-all active:scale-90 ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}
                                >
                                  {c.status === 'blocked' ? 'Bloqueado' : expired ? 'Expirado' : 'Ativo'}
                                </button>
                              </td>
                              <td className="px-6 py-6 text-center">
                                <button 
                                  onClick={() => handleTogglePayment(c)}
                                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border transition-all active:scale-90 ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}
                                >
                                  {c.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}
                                </button>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex gap-2 justify-end">
                                  <ActionButton onClick={() => setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={16}/>} />
                                  <ActionButton onClick={() => setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={16}/>} />
                                  <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={16}/>} />
                                  <ActionButton onClick={() => setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={16}/>} />
                                  <ActionButton onClick={() => { if(confirm('Excluir este cliente?')) setClients(prev => prev.filter(cl => cl.id !== c.id)) }} theme={theme} color="red" icon={<Trash2 size={16}/>} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Grid View (Cards) */}
                <div className="md:hidden space-y-5">
                  {filteredClients.map(c => {
                    const expired = isExpired(c.expiresAt);
                    return (
                      <div key={c.id} className={`p-6 rounded-3xl border shadow-lg relative overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        {expired && c.status === 'active' && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>}
                        
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1 pr-4">
                            <h4 className="font-bold text-lg leading-none mb-1.5">{c.name}</h4>
                            <div className="text-[11px] opacity-50 font-bold uppercase tracking-[0.1em]">{c.username}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <button 
                               onClick={() => handleToggleStatus(c)}
                               className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter border shadow-sm transition-all active:scale-90 ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}
                             >
                               {c.status === 'blocked' ? 'Bloqueado' : expired ? 'Expirado' : 'Ativo'}
                             </button>
                             <button 
                               onClick={() => handleTogglePayment(c)}
                               className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter border transition-all active:scale-90 ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30'}`}
                             >
                               {c.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}
                             </button>
                          </div>
                        </div>

                        <div className={`grid grid-cols-2 gap-4 p-5 rounded-2xl mb-6 border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                          <button onClick={() => setInlineEditingDate(c.id)} className="text-left">
                            <div className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Vencimento</div>
                            <div className={`text-sm font-bold flex items-center gap-1 ${expired && c.status === 'active' ? 'text-red-500' : ''}`}>
                              {new Date(c.expiresAt).toLocaleDateString('pt-BR')} <Pencil size={10} className="opacity-30"/>
                            </div>
                          </button>
                          <button onClick={() => setInlineEditingPlan(c.id)} className="text-left">
                            <div className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Plano & Valor</div>
                            <div className="text-sm font-bold truncate flex items-center gap-1">{c.packageName} <ChevronDown size={10} className="opacity-30"/></div>
                          </button>
                        </div>

                        <div className="grid grid-cols-5 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <button onClick={() => setSelectedClientDetails(c)} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <Eye size={18} className="text-blue-500" />
                            <span className="text-[7px] font-bold uppercase">Ver</span>
                          </button>
                          <button onClick={() => setSelectedClientForEdit(c)} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <Pencil size={18} className="text-blue-600" />
                            <span className="text-[7px] font-bold uppercase">Edit</span>
                          </button>
                          <button onClick={() => setSelectedClientForMsg(c)} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <MessageSquare size={18} className="text-emerald-500" />
                            <span className="text-[7px] font-bold uppercase">Zap</span>
                          </button>
                          <button onClick={() => setSelectedClientForRenewal(c)} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <RefreshCw size={18} className="text-amber-500" />
                            <span className="text-[7px] font-bold uppercase">Renov</span>
                          </button>
                          <button onClick={() => { if(confirm('Excluir?')) setClients(prev => prev.filter(cl => cl.id !== c.id)) }} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <Trash2 size={18} className="text-red-400" />
                            <span className="text-[7px] font-bold uppercase text-red-400">Del</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === 'add' && (
              <div className={`p-8 md:p-12 rounded-3xl border shadow-xl max-w-4xl mx-auto animate-in zoom-in-95 duration-500 transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-4 mb-10">
                   <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20"><PlusCircle size={28}/></div>
                   <h3 className="text-2xl font-bold uppercase tracking-tight">Novo Cadastro</h3>
                </div>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={(e) => {
                  e.preventDefault();
                  handleAddClient(Object.fromEntries(new FormData(e.currentTarget)));
                }}>
                  <FormInput theme={theme} name="name" label="Nome do Cliente" required placeholder="Ex: João Silva" />
                  <FormInput theme={theme} name="phone" label="WhatsApp (DDI+DDD+NÚMERO)" required placeholder="Ex: 5585999999999" />
                  <FormInput theme={theme} name="username" label="Usuário do Painel" required placeholder="usuariovip_123" />
                  <FormInput theme={theme} name="password" label="Senha do Painel" placeholder="******" />
                  
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Plano Sugerido</label>
                    <select name="packageId" className={`w-full p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold shadow-sm transition-all border appearance-none cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
                      {packages.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {p.price})</option>)}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput theme={theme} name="price" label="Preço de Venda" type="number" step="0.01" required />
                    <FormInput theme={theme} name="expenses" label="Custo do Painel" type="number" step="0.01" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput theme={theme} name="expiryDate" label="Início/Vencimento" type="date" required />
                    <FormInput theme={theme} name="expiryTime" label="Horário" type="time" defaultValue="00:00" />
                  </div>
                  
                  <FormInput theme={theme} name="appName" label="App / Dispositivo" placeholder="Ex: Smart TV LG" />
                  <FormInput theme={theme} name="macKey" label="ID / MAC Address" placeholder="00:11:22:33:44:55" />
                  
                  <div className="md:col-span-2 space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Observações</label>
                    <textarea name="notes" className={`w-full p-5 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium shadow-sm transition-all border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} rows={3}></textarea>
                  </div>
                  
                  <div className={`md:col-span-2 p-5 rounded-2xl border flex items-center gap-4 transition-colors ${theme === 'dark' ? 'bg-emerald-900/10 border-emerald-800/30' : 'bg-emerald-50 border-emerald-100'}`}>
                    <input type="checkbox" name="isPaid" id="isPaid" className="w-6 h-6 accent-emerald-600 rounded-lg cursor-pointer" />
                    <label htmlFor="isPaid" className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase cursor-pointer tracking-wider">Registrar pagamento inicial no histórico?</label>
                  </div>
                  
                  <button type="submit" className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-3xl font-bold uppercase shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98] transition-all tracking-widest">Concluir Cadastro</button>
                </form>
              </div>
            )}

            {view === 'packages' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 rounded-3xl border shadow-xl transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-lg uppercase mb-8 flex items-center gap-3"><Layers size={24} className="text-blue-500"/> Novo Plano de Serviço</h4>
                   <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end" onSubmit={(e) => {
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
                     <div className="md:col-span-2"><FormInput theme={theme} name="name" label="Nome do Plano" required /></div>
                     <FormInput theme={theme} name="price" label="Preço" type="number" required />
                     <FormInput theme={theme} name="cost" label="Custo" type="number" required />
                     <FormInput theme={theme} name="months" label="Meses" type="number" defaultValue="1" required />
                     <button type="submit" className="md:col-span-1 bg-blue-600 text-white rounded-2xl font-bold uppercase text-[10px] p-4 shadow-lg hover:bg-blue-700 transition-all">Salvar</button>
                   </form>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map(p => (
                    <div key={p.id} className={`p-6 rounded-3xl border flex justify-between items-center shadow-md transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                      <div>
                        <span className="font-bold text-base text-blue-500">{p.name}</span><br/>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Venda: R$ {p.price.toFixed(2)} • Custo: R$ {p.cost.toFixed(2)} • {p.months} Mês(es)</span>
                      </div>
                      <button onClick={() => setPackages(packages.filter(x => x.id !== p.id))} className="p-3 text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'messages' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 rounded-3xl border shadow-xl transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-lg uppercase mb-8 flex items-center gap-3"><MessageSquare size={24} className="text-emerald-500"/> Criar Modelo de Mensagem</h4>
                   <form className="space-y-6" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     setTemplates([...templates, { 
                       id: Math.random().toString(36).substr(2,9), 
                       title: (fd.get('title') as string).toUpperCase(), 
                       body: fd.get('body') as string 
                     }]);
                     e.currentTarget.reset();
                   }}>
                     <FormInput theme={theme} name="title" label="Título (Ex: BOAS VINDAS)" required />
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Corpo da Mensagem</label>
                        <textarea name="body" className={`w-full p-5 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium shadow-sm transition-all border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} rows={5} placeholder="Variáveis dinâmicas: {{nome}}, {{usuario}}, {{senha}}, {{vencimento}}, {{valor}}"></textarea>
                     </div>
                     <button type="submit" className="w-full bg-emerald-600 text-white rounded-2xl font-bold uppercase text-xs py-5 shadow-xl hover:bg-emerald-700 transition-all tracking-widest">Registrar Modelo</button>
                   </form>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates.map(t => (
                    <div key={t.id} className={`p-8 rounded-3xl border relative shadow-lg transition-colors group ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <button onClick={() => setTemplates(templates.filter(x => x.id !== t.id))} className="absolute top-6 right-6 p-2 text-red-200 hover:text-red-500 transition-colors"><Trash2 size={22}/></button>
                      <span className="text-xs font-bold uppercase text-blue-500 tracking-widest block mb-4">{t.title}</span>
                      <p className={`text-sm italic leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>"{t.body}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matrix View (History) */}
            {view === 'history' && (
              <div className={`rounded-3xl border shadow-xl overflow-hidden transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="p-6 flex flex-col sm:flex-row items-center justify-between border-b gap-6 bg-slate-50/50 dark:bg-slate-800/30 dark:border-slate-800">
                  <div className="flex items-center gap-5">
                    <button onClick={() => setCurrentYear(y => y-1)} className={`p-3 rounded-2xl border shadow-sm active:scale-90 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}><ChevronLeft size={20}/></button>
                    <span className="font-bold text-2xl tracking-tighter">{currentYear}</span>
                    <button onClick={() => setCurrentYear(y => y+1)} className={`p-3 rounded-2xl border shadow-sm active:scale-90 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}><ChevronRight size={20}/></button>
                  </div>
                  <div className="text-[10px] font-bold flex gap-6 uppercase tracking-widest">
                    <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-lg bg-emerald-500 shadow-sm shadow-emerald-500/30"></div> Ativo</div>
                    <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-lg bg-red-500 shadow-sm shadow-red-500/30"></div> Atraso</div>
                    <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-lg bg-slate-200 dark:bg-slate-800"></div> N/A</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                      <tr>
                        <th className={`px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest sticky left-0 z-20 shadow-r transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>Cliente</th>
                        {MONTHS.map(m => <th key={m} className="px-3 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">{m}</th>)}
                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase text-right">LTV Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {clients.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className={`px-8 py-5 text-sm font-bold sticky left-0 z-10 whitespace-nowrap shadow-r transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>{c.name}</td>
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
                              <td key={i} className="px-1.5 py-5">
                                <div className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center transition-all ${status === 'paid' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : status === 'overdue' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}`}>
                                  {status === 'paid' && <CheckCircle size={16}/>}
                                  {status === 'overdue' && <XCircle size={16}/>}
                                  {status === 'none' && <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30"></div>}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-8 py-5 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">R$ {c.totalPaid.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === 'scheduling' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 rounded-3xl border shadow-xl transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold uppercase text-lg mb-8 flex items-center gap-3 text-blue-500"><BellRing size={26}/> Agendamento Automático</h4>
                   <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     setRules([...rules, {
                       id: Math.random().toString(36).substr(2,9),
                       type: fd.get('type') as any,
                       days: Number(fd.get('days')),
                       time: fd.get('time') as string,
                       templateId: fd.get('templateId') as string,
                       isActive: true
                     }]);
                     e.currentTarget.reset();
                   }}>
                     <div className="md:col-span-1 space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Evento</label>
                        <select name="type" className={`w-full p-4 rounded-2xl outline-none border text-sm font-bold appearance-none cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
                          <option value="before">Dias Antes</option>
                          <option value="on_day">No Vencimento</option>
                          <option value="after">Dias Depois</option>
                        </select>
                     </div>
                     <FormInput theme={theme} name="days" label="Quantidade Dias" type="number" defaultValue="0" />
                     <FormInput theme={theme} name="time" label="Hora de Envio" type="time" defaultValue="09:00" />
                     <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl font-bold uppercase text-xs shadow-xl hover:bg-blue-700 transition-all">Salvar Regra</button>
                   </form>
                </div>
                <div className="grid gap-4">
                   {rules.map(rule => (
                     <div key={rule.id} className={`p-6 rounded-3xl border flex flex-col sm:flex-row justify-between items-center shadow-lg transition-colors gap-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-6">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${rule.isActive ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                             <Clock3 size={28}/>
                           </div>
                           <div>
                              <div className="text-base font-bold uppercase tracking-tight">
                                {rule.days === 0 ? "No dia do vencimento" : `${rule.days} dias ${rule.type === 'before' ? 'antecipado' : 'de atraso'}`}
                              </div>
                              <div className="text-[11px] text-slate-400 font-bold uppercase mt-1 tracking-widest flex items-center gap-2">Disparo às {rule.time} <div className="w-1 h-1 rounded-full bg-slate-300"></div> Template ID: {rule.templateId}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <button onClick={() => setRules(rules.map(r => r.id === rule.id ? {...r, isActive: !r.isActive} : r))} className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm ${rule.isActive ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                             {rule.isActive ? 'Ativa' : 'Pausada'}
                           </button>
                           <button onClick={() => setRules(rules.filter(r => r.id !== rule.id))} className="p-3 text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={22}/></button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

          </div>
        </main>

        {/* Floating Action Button (FAB) */}
        <button 
          onClick={() => setView('add')}
          className="fixed bottom-24 right-6 md:right-10 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center active:scale-90 transition-all z-[60] group"
        >
          <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Bottom Navigation Mobile */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center py-4 z-[100] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.1)] transition-colors ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800 backdrop-blur-lg' : 'bg-white/90 border-slate-100 backdrop-blur-lg'}`}>
          <BottomNavItem icon={<LayoutDashboard size={22}/>} label="Painel" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<Users size={22}/>} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <BottomNavItem icon={<History size={22}/>} label="Matriz" active={view === 'history'} onClick={() => setView('history')} />
          <div className="relative" ref={mobileMenuRef}>
             <BottomNavItem icon={<MoreHorizontal size={22}/>} label="Mais" active={['scheduling', 'packages', 'messages', 'add'].includes(view)} onClick={() => setShowMobileMenu(!showMobileMenu)} />
             {showMobileMenu && (
               <div className="absolute bottom-20 right-0 bg-slate-900 rounded-[2rem] shadow-2xl p-3 w-56 flex flex-col gap-1.5 z-[110] animate-in slide-in-from-bottom-5 duration-300">
                 <MobileSubItem icon={<BellRing size={20} className="text-blue-500"/>} label="Automação" onClick={() => { setView('scheduling'); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<Layers size={20} className="text-amber-500"/>} label="Planos" onClick={() => { setView('packages'); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<MessageSquare size={20} className="text-purple-500"/>} label="Modelos" onClick={() => { setView('messages'); setShowMobileMenu(false); }} />
                 <div className="h-px bg-slate-800 mx-4 my-2"></div>
                 <MobileSubItem icon={<PlusCircle size={20} className="text-emerald-500"/>} label="Novo Cadastro" onClick={() => { setView('add'); setShowMobileMenu(false); }} />
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

// UI Subcomponents
function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${active ? 'text-blue-600 scale-105' : 'text-slate-400'}`}>
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function MobileSubItem({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 p-4 text-[11px] font-bold text-white hover:bg-white/10 rounded-2xl uppercase transition-all active:bg-white/20">
      {icon} {label}
    </button>
  );
}

function ActionButton({ onClick, color, icon, theme }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
    red: 'text-red-400 bg-red-50 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
  };
  return (
    <button onClick={onClick} className={`p-2.5 rounded-xl border transition-all hover:scale-110 active:scale-90 shadow-sm ${colors[color]}`}>
      {icon}
    </button>
  );
}

function StatCard({ title, value, icon, color, theme }: any) {
  const colorMap: any = { 
    emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50', 
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50', 
    red: 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50', 
    slate: 'text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50', 
    amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50' 
  };
  return (
    <div className={`p-6 md:p-8 rounded-[2.5rem] border shadow-sm flex flex-col items-center group transition-all hover:shadow-xl hover:-translate-y-1 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl mb-5 transition-transform group-hover:scale-110 shadow-sm border ${colorMap[color]}`}>{icon}</div>
      <div className="text-xl md:text-2xl font-bold tracking-tighter transition-colors">{value}</div>
      <div className="text-[10px] font-bold uppercase mt-2 tracking-[0.2em] text-slate-400">{title}</div>
    </div>
  );
}

function FormInput({ label, name, type = "text", theme, ...rest }: any) {
  return (
    <div className="space-y-2.5">
      <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
      <input name={name} type={type} className={`w-full p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold shadow-sm transition-all border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-300'}`} {...rest} />
    </div>
  );
}

function FilterChip({ active, label, onClick, theme }: any) {
  return (
    <button onClick={onClick} className={`px-6 py-3 rounded-2xl text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-widest border ${active ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>{label}</button>
  );
}

function ClientDetailsModal({ client, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 transition-colors border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold uppercase tracking-tight leading-none mb-1">Perfil Detalhado</h3>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">ID: {client.id.substr(0,8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all relative z-10"><X size={24}/></button>
        </div>
        <div className="p-8 space-y-5 max-h-[75vh] overflow-y-auto hide-scrollbar">
          <DetailRow theme={theme} label="Nome Completo" value={client.name} icon={<Users size={16}/>}/>
          <div className="grid grid-cols-2 gap-4">
            <DetailRow theme={theme} label="Usuário Painel" value={client.username} icon={<Tag size={16}/>} isMono/>
            <DetailRow theme={theme} label="Senha Painel" value={client.password || '---'} icon={<Tag size={16}/>} isMono/>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <DetailRow theme={theme} label="Plano" value={client.packageName} icon={<Smartphone size={16}/>} isHighlight/>
             <DetailRow theme={theme} label="Faturamento" value={`R$ ${client.price.toFixed(2)}`} icon={<DollarSign size={16}/>}/>
          </div>
          <DetailRow theme={theme} label="App / Dispositivo" value={client.appName || 'Não cadastrado'} icon={<Layers size={16}/>}/>
          <DetailRow theme={theme} label="Endereço MAC / ID" value={client.macKey || '---'} icon={<Smartphone size={16}/>} isMono/>
          <div className="grid grid-cols-2 gap-4">
             <DetailRow theme={theme} label="Cadastrado em" value={new Date(client.createdAt).toLocaleDateString('pt-BR')} icon={<Calendar size={16}/>}/>
             <DetailRow theme={theme} label="Vencimento" value={new Date(client.expiresAt).toLocaleDateString('pt-BR')} icon={<History size={16}/>}/>
          </div>
          {client.notes && (
            <div className={`p-5 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">Notas do Administrador</span>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{client.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditClientModal({ client, packages, onEdit, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden transition-colors border animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold uppercase tracking-tight leading-none mb-1">Editar Cliente</h3>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Ajuste as informações principais</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl transition-all relative z-10"><X size={24}/></button>
        </div>
        <form className="p-8 space-y-6 max-h-[75vh] overflow-y-auto hide-scrollbar" onSubmit={(e) => {
          e.preventDefault();
          onEdit(Object.fromEntries(new FormData(e.currentTarget)));
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput theme={theme} name="name" label="Nome do Cliente" defaultValue={client.name} required />
            <FormInput theme={theme} name="phone" label="WhatsApp" defaultValue={client.phone} required />
            <FormInput theme={theme} name="username" label="Usuário Painel" defaultValue={client.username} required />
            <FormInput theme={theme} name="password" label="Senha Painel" defaultValue={client.password} />
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Plano Ativo</label>
              <select name="packageId" defaultValue={client.packageId} className={`w-full p-4 rounded-2xl outline-none border text-sm font-bold appearance-none cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
                {packages.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput theme={theme} name="price" label="Preço" type="number" step="0.01" defaultValue={client.price} required />
              <FormInput theme={theme} name="expenses" label="Custo" type="number" step="0.01" defaultValue={client.expenses} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput theme={theme} name="expiryDate" label="Data Vencimento" type="date" defaultValue={new Date(client.expiresAt).toISOString().split('T')[0]} required />
              <FormInput theme={theme} name="expiryTime" label="Hora" type="time" defaultValue={new Date(client.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} />
            </div>
            <FormInput theme={theme} name="appName" label="Aplicativo" defaultValue={client.appName} />
            <FormInput theme={theme} name="macKey" label="MAC/ID" defaultValue={client.macKey} />
          </div>
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Notas</label>
            <textarea name="notes" defaultValue={client.notes} className={`w-full p-4 rounded-2xl outline-none border text-sm font-medium ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} rows={3}></textarea>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-bold uppercase shadow-xl tracking-widest active:scale-[0.98] transition-all">Salvar Alterações</button>
        </form>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon, isMono, isHighlight, theme }: any) {
  return (
    <div className={`p-4 rounded-2xl border transition-colors ${isHighlight ? 'bg-blue-500/5 border-blue-500/20' : theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
        {icon} {label}
      </span>
      <div className={`text-sm font-bold truncate ${isMono ? 'font-mono' : ''} ${isHighlight ? 'text-blue-500' : ''}`}>
        {value}
      </div>
    </div>
  );
}

function RenewalModal({ client, packages, onRenew, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden transition-colors border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-blue-600 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold uppercase tracking-tight leading-none mb-1">Renovação</h3>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{client.name}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl transition-all shadow-lg active:scale-90"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-4">
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => onRenew(client.id, pkg.id)} className={`w-full text-left p-6 rounded-3xl border transition-all flex items-center justify-between group active:scale-[0.98] ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'bg-slate-50 border-slate-100 hover:border-emerald-300 hover:bg-emerald-50'}`}>
              <div>
                <div className="font-bold text-sm uppercase group-hover:text-emerald-500 transition-colors">{pkg.name}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">R$ {pkg.price.toFixed(2)} • {pkg.months} Mes(es)</div>
              </div>
              <div className="w-12 h-12 bg-white dark:bg-slate-700 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                <ArrowUpRight size={22} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageModal({ client, templates, onSend, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-emerald-600 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold uppercase tracking-tight leading-none mb-1">WhatsApp Rápido</h3>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Destino: {client.phone}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl active:scale-90 transition-all"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto hide-scrollbar">
          {templates.map((tpl: any) => (
            <button key={tpl.id} onClick={() => onSend(tpl, client)} className={`w-full text-left p-6 rounded-3xl border transition-all flex justify-between items-center group active:scale-[0.98] ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5' : 'bg-slate-50 border-slate-100 hover:border-blue-400 hover:bg-blue-50/50'}`}>
              <span className="font-bold text-xs uppercase tracking-widest group-hover:text-blue-500 transition-colors">{tpl.title}</span>
              <div className="w-12 h-12 bg-white dark:bg-slate-700 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Send size={20} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentActivityCard({ title, items, theme }: any) {
  return (
    <div className={`rounded-3xl border shadow-sm overflow-hidden flex flex-col transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <h3 className="text-sm font-bold uppercase flex items-center gap-2 tracking-tight"><History size={20} className="text-blue-500"/> {title}</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto hide-scrollbar">
        {items.map((it: any) => (
          <div key={it.id} className="p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">{it.clientName}</span>
              <span className="text-[10px] opacity-50 font-bold uppercase mt-0.5">{new Date(it.date).toLocaleDateString('pt-BR')}</span>
            </div>
            <span className="text-xs font-bold text-emerald-500">+ R$ {it.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
