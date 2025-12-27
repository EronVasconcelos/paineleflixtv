
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
  
  const [inlineEditingDate, setInlineEditingDate] = useState<string | null>(null);
  const [inlineEditingPlan, setInlineEditingPlan] = useState<string | null>(null);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'blocked'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
      
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0 border-r border-slate-800">
        <div className="p-5 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><Activity size={20} className="text-white" /></div>
          <h1 className="text-lg font-bold uppercase tracking-tighter">{PANEL_NAME}</h1>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={18} />} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <SidebarItem icon={<History size={18} />} label="Matriz" active={view === 'history'} onClick={() => setView('history')} />
          <SidebarItem icon={<CalendarDays size={18} />} label="Agenda" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          
          <div className="pt-6 pb-1 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configurações</div>
          <SidebarItem icon={<Layers size={18} />} label="Planos" active={view === 'packages'} onClick={() => setView('packages')} />
          <SidebarItem icon={<MessageSquare size={18} />} label="Modelos Zap" active={view === 'messages'} onClick={() => setView('messages')} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all border border-slate-700/50">
            <span className="text-[10px] font-bold uppercase">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
            {theme === 'dark' ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-amber-400" />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`px-4 py-3 flex items-center justify-between pt-safe shrink-0 border-b z-20 transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
          <h2 className={`text-base font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {view === 'dashboard' && 'Estatísticas'}
            {view === 'history' && 'Matriz'}
            {view === 'clients' && 'Clientes'}
            {view === 'scheduling' && 'Agenda'}
            {view === 'add' && 'Novo Cliente'}
            {view === 'packages' && 'Serviços'}
            {view === 'messages' && 'Modelos'}
          </h2>
          
          <button onClick={() => geminiService.analyzeBusiness(clients).then(setAiAnalysis)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-all">
            <TrendingUp size={16} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 p-3 md:p-6 hide-scrollbar">
          <div className="max-w-7xl mx-auto space-y-4">
            {aiAnalysis && (
              <div className="p-3 bg-blue-600 text-white rounded-lg relative shadow-lg overflow-hidden">
                <button onClick={() => setAiAnalysis(null)} className="absolute top-2 right-2 text-white/50 hover:text-white"><X size={16}/></button>
                <h4 className="font-bold text-[9px] mb-1 uppercase tracking-widest opacity-80">Insight IA:</h4>
                <p className="text-[11px] leading-snug font-medium">{aiAnalysis}</p>
              </div>
            )}

            {view === 'dashboard' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <StatCard title="Ativos" value={stats.activeCount} icon={<CheckCircle size={16}/>} color="emerald" theme={theme} />
                  <StatCard title="A Vencer" value={stats.pendingPaymentCount} icon={<AlertCircle size={16}/>} color="amber" theme={theme} />
                  <StatCard title="Vencidos" value={stats.expiredCount} icon={<Clock size={16}/>} color="red" theme={theme} />
                  <StatCard title="Blocks" value={stats.blockedCount} icon={<UserX size={16}/>} color="slate" theme={theme} />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <StatCard title="Receita" value={`R$ ${stats.monthlyRevenue.toFixed(2)}`} icon={<DollarSign size={16}/>} color="blue" theme={theme} />
                  <StatCard title="Custos" value={`R$ ${stats.monthlyCosts.toFixed(2)}`} icon={<Layers size={16}/>} color="red" theme={theme} />
                  <StatCard title="Lucro" value={`R$ ${(stats.monthlyRevenue - stats.monthlyCosts).toFixed(2)}`} icon={<TrendingUp size={16}/>} color="emerald" theme={theme} />
                  <StatCard title="LTV" value={`R$ ${stats.totalLTV.toFixed(2)}`} icon={<Activity size={16}/>} color="blue" theme={theme} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className={`rounded-lg border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[11px] font-bold uppercase flex items-center gap-2 tracking-tight"><CreditCard size={14} className="text-amber-500"/> Cobranças</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {clients.filter(c => c.paymentStatus === 'pending' || isExpired(c.expiresAt)).slice(0, 5).map(c => (
                        <div key={c.id} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-bold text-[11px] truncate">{c.name}</span>
                            <span className="text-[9px] opacity-60 font-bold uppercase">{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <button onClick={() => sendWhatsApp(`Olá ${c.name}, seu sinal está próximo do vencimento. Vamos renovar?`, c)} className="p-2 bg-emerald-500 text-white rounded-lg shrink-0"><MessageSquare size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <RecentActivityCard title="Atividades" theme={theme} items={clients.flatMap(c => c.paymentHistory.map(h => ({...h, clientName: c.name}))).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)} />
                </div>
              </div>
            )}

            {view === 'clients' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Pesquisar..." className={`w-full pl-10 pr-4 py-2 rounded-lg outline-none text-[11px] font-medium border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  
                  {/* Filtros de Status */}
                  <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
                    <FilterChip active={statusFilter === 'all'} label="Todos" theme={theme} onClick={() => setStatusFilter('all')} />
                    <FilterChip active={statusFilter === 'active'} label="Ativos" theme={theme} onClick={() => setStatusFilter('active')} />
                    <FilterChip active={statusFilter === 'expired'} label="Vencidos" theme={theme} onClick={() => setStatusFilter('expired')} />
                    <FilterChip active={statusFilter === 'blocked'} label="Blocks" theme={theme} onClick={() => setStatusFilter('blocked')} />
                  </div>

                  {/* Restauração dos filtros de pagamento e ordenação */}
                  <div className="flex gap-1.5 items-center">
                    <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} className={`flex-1 p-2 rounded-lg border text-[9px] font-bold uppercase outline-none appearance-none text-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                      <option value="all">Pagtos: Todos</option>
                      <option value="paid">Confirmados</option>
                      <option value="pending">Pendentes</option>
                    </select>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className={`flex-1 p-2 rounded-lg border text-[9px] font-bold uppercase outline-none appearance-none text-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                      <option value="asc">Vencimento ↑</option>
                      <option value="desc">Vencimento ↓</option>
                    </select>
                  </div>
                </div>

                {/* Tabela Desktop */}
                <div className="hidden md:block rounded-lg border shadow-sm overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead className={`border-b ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <tr>
                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Vencimento</th>
                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Plano</th>
                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Sinal</th>
                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Pagamento</th>
                        <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {filteredClients.map(c => {
                        const expired = isExpired(c.expiresAt);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-[11px]">{c.name}</span>
                                <span className="text-[8px] opacity-50 font-bold uppercase">{c.username}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-center">
                              {inlineEditingDate === c.id ? (
                                <input type="date" className={`p-1 rounded-lg text-[9px] font-bold border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} defaultValue={new Date(c.expiresAt).toISOString().split('T')[0]} onBlur={(e) => { if (e.target.value) handleUpdateClient(c.id, { expiresAt: new Date(e.target.value).toISOString() }); setInlineEditingDate(null); }} autoFocus />
                              ) : (
                                <button onClick={() => setInlineEditingDate(c.id)} className="text-center">
                                  <div className={`text-[10px] font-bold ${expired && c.status === 'active' ? 'text-red-500' : ''}`}>{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</div>
                                  <div className="text-[8px] opacity-40 font-bold">{new Date(c.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                </button>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center">
                              {inlineEditingPlan === c.id ? (
                                <select className={`p-1 rounded-lg text-[9px] font-bold border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} defaultValue={c.packageId} onChange={(e) => { const pkg = packages.find(p => p.id === e.target.value); if (pkg) handleUpdateClient(c.id, { packageName: pkg.name, packageId: pkg.id, price: pkg.price }); setInlineEditingPlan(null); }} onBlur={() => setInlineEditingPlan(null)} autoFocus>
                                  {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              ) : (
                                <button onClick={() => setInlineEditingPlan(c.id)} className="text-center">
                                  <div className="text-[10px] font-bold uppercase">{c.packageName}</div>
                                  <div className="text-[8px] opacity-50 font-bold">R$ {c.price.toFixed(2)}</div>
                                </button>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <button onClick={() => handleToggleStatus(c)} className={`px-2 py-0.5 rounded-lg text-[7px] font-bold uppercase border ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>{c.status === 'blocked' ? 'Block' : expired ? 'Expirado' : 'Ativo'}</button>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <button onClick={() => handleTogglePayment(c)} className={`px-2 py-0.5 rounded-lg text-[7px] font-bold uppercase border ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20'}`}>{c.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}</button>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <ActionButton onClick={() => setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={12}/>} />
                                <ActionButton onClick={() => setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={12}/>} />
                                <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={12}/>} />
                                <ActionButton onClick={() => setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={12}/>} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Grid Mobile */}
                <div className="md:hidden space-y-2">
                  {filteredClients.map(c => {
                    const expired = isExpired(c.expiresAt);
                    return (
                      <div key={c.id} className={`p-3 rounded-lg border shadow-sm relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="font-bold text-[11px] truncate">{c.name}</h4>
                            <div className="text-[8px] opacity-50 font-bold uppercase truncate">{c.username}</div>
                          </div>
                          <div className="flex gap-1">
                             <button onClick={() => handleToggleStatus(c)} className={`px-2 py-0.5 rounded-lg text-[7px] font-bold uppercase border ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>{c.status === 'blocked' ? 'Block' : expired ? 'Exp' : 'Atv'}</button>
                             <button onClick={() => handleTogglePayment(c)} className={`px-2 py-0.5 rounded-lg text-[7px] font-bold uppercase border ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30'}`}>{c.paymentStatus === 'paid' ? 'Pago' : 'Pnd'}</button>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border dark:border-slate-800">
                             <div className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Vencimento</div>
                             <div className={`text-[9px] font-bold truncate ${expired && c.status === 'active' ? 'text-red-500' : ''}`}>{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</div>
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border dark:border-slate-800">
                             <div className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Plano</div>
                             <div className="text-[9px] font-bold truncate uppercase">{c.packageName}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-2">
                          <div className="flex gap-1.5">
                             <ActionButton onClick={() => setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={12}/>} />
                             <ActionButton onClick={() => setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={12}/>} />
                             <ActionButton onClick={() => setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={12}/>} />
                             <ActionButton onClick={() => setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={12}/>} />
                          </div>
                          <ActionButton onClick={() => { if(confirm('Excluir?')) setClients(prev => prev.filter(cl => cl.id !== c.id)) }} theme={theme} color="red" icon={<Trash2 size={12}/>} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === 'add' && (
              <div className={`p-5 rounded-lg border shadow-lg max-w-xl mx-auto ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-sm font-bold uppercase mb-5 flex items-center gap-2"><PlusCircle size={20}/> Novo Cliente</h3>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={(e) => {
                  e.preventDefault();
                  handleAddClient(Object.fromEntries(new FormData(e.currentTarget)));
                }}>
                  <FormInput theme={theme} name="name" label="Nome" required />
                  <FormInput theme={theme} name="phone" label="WhatsApp" required />
                  <FormInput theme={theme} name="username" label="Usuário" required />
                  <FormInput theme={theme} name="password" label="Senha" />
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Plano</label>
                    <select name="packageId" className={`w-full p-2 rounded-lg border text-[11px] font-bold ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormInput theme={theme} name="price" label="Preço" type="number" step="0.01" required />
                    <FormInput theme={theme} name="expenses" label="Custo" type="number" step="0.01" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormInput theme={theme} name="expiryDate" label="Início" type="date" required />
                    <FormInput theme={theme} name="expiryTime" label="Hora" type="time" defaultValue="00:00" />
                  </div>
                  <FormInput theme={theme} name="appName" label="App" />
                  <FormInput theme={theme} name="macKey" label="MAC" />
                  <div className="sm:col-span-2 p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-2">
                    <input type="checkbox" name="isPaid" id="isPaid" className="w-4 h-4 accent-emerald-600 rounded" />
                    <label htmlFor="isPaid" className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Marcar como Pago</label>
                  </div>
                  <button type="submit" className="sm:col-span-2 bg-blue-600 text-white py-2.5 rounded-lg font-bold uppercase text-[10px] shadow-lg mt-2">Salvar Cadastro</button>
                </form>
              </div>
            )}

            {view === 'history' && (
              <div className={`rounded-lg border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="p-3 flex items-center justify-between border-b dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentYear(y => y-1)} className="p-1.5 border rounded-lg dark:border-slate-800"><ChevronLeft size={14}/></button>
                    <span className="font-bold text-sm">{currentYear}</span>
                    <button onClick={() => setCurrentYear(y => y+1)} className="p-1.5 border rounded-lg dark:border-slate-800"><ChevronRight size={14}/></button>
                  </div>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                      <tr>
                        <th className={`px-4 py-2 text-[8px] font-bold text-slate-400 uppercase sticky left-0 z-20 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>Cliente</th>
                        {MONTHS.map(m => <th key={m} className="px-1 py-2 text-[8px] font-bold text-slate-400 uppercase text-center">{m}</th>)}
                        <th className="px-4 py-2 text-[8px] font-bold text-slate-400 uppercase text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {clients.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className={`px-4 py-2 text-[10px] font-bold sticky left-0 z-10 transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>{c.name}</td>
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
                              <td key={i} className="px-0.5 py-2 text-center">
                                <div className={`w-5 h-5 mx-auto rounded-md flex items-center justify-center ${status === 'paid' ? 'bg-emerald-500 text-white' : status === 'overdue' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}`}>
                                  {status === 'paid' && <Check size={10}/>}
                                  {status === 'overdue' && <X size={10}/>}
                                  {status === 'none' && <div className="w-0.5 h-0.5 rounded-full bg-current opacity-30"></div>}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-4 py-2 text-right text-[9px] font-bold text-emerald-600">R$ {c.totalPaid.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === 'packages' && (
              <div className="max-w-xl mx-auto space-y-4">
                <div className={`p-4 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[11px] uppercase mb-4 text-blue-500">Novo Plano</h4>
                   <form className="grid grid-cols-2 gap-2" onSubmit={(e) => {
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
                     <div className="col-span-2"><FormInput theme={theme} name="name" label="Nome do Plano" required /></div>
                     <FormInput theme={theme} name="price" label="Venda" type="number" required />
                     <FormInput theme={theme} name="cost" label="Custo" type="number" required />
                     <button type="submit" className="col-span-2 bg-blue-600 text-white rounded-lg font-bold uppercase text-[9px] p-2 mt-1">Salvar</button>
                   </form>
                </div>
                {packages.map(p => (
                  <div key={p.id} className={`p-3 rounded-lg border flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div>
                      <div className="font-bold text-[11px]">{p.name}</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">R$ {p.price.toFixed(2)}</div>
                    </div>
                    <button onClick={() => setPackages(packages.filter(x => x.id !== p.id))} className="p-1.5 text-red-400"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            )}

            {view === 'messages' && (
              <div className="max-w-xl mx-auto space-y-4">
                <div className={`p-4 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[11px] uppercase mb-4 text-emerald-500">Novo Modelo</h4>
                   <form className="space-y-3" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     setTemplates([...templates, { id: Math.random().toString(36).substr(2,9), title: (fd.get('title') as string).toUpperCase(), body: fd.get('body') as string }]);
                     e.currentTarget.reset();
                   }}>
                     <FormInput theme={theme} name="title" label="Título" required />
                     <textarea name="body" className={`w-full p-2.5 rounded-lg outline-none border text-[10px] font-medium ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} rows={4} placeholder="Variáveis: {{nome}}, {{usuario}}..."></textarea>
                     <button type="submit" className="w-full bg-emerald-600 text-white rounded-lg font-bold uppercase text-[9px] py-2">Registrar</button>
                   </form>
                </div>
                {templates.map(t => (
                  <div key={t.id} className={`p-4 rounded-lg border relative ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <button onClick={() => setTemplates(templates.filter(x => x.id !== t.id))} className="absolute top-3 right-3 text-red-300"><Trash2 size={16}/></button>
                    <span className="text-[9px] font-bold uppercase text-blue-500 block mb-1">{t.title}</span>
                    <p className="text-[10px] italic opacity-70 truncate">"{t.body}"</p>
                  </div>
                ))}
              </div>
            )}
            
            {view === 'scheduling' && (
              <div className="max-w-xl mx-auto space-y-4">
                <div className={`p-4 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h4 className="font-bold text-[11px] uppercase mb-4 text-blue-500">Regra de Disparo</h4>
                   <form className="grid grid-cols-2 gap-2" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     setRules([...rules, { id: Math.random().toString(36).substr(2,9), type: fd.get('type') as any, days: Number(fd.get('days')), time: fd.get('time') as string, templateId: fd.get('templateId') as string, isActive: true }]);
                     e.currentTarget.reset();
                   }}>
                     <FormInput theme={theme} name="days" label="Dias" type="number" defaultValue="0" />
                     <FormInput theme={theme} name="time" label="Hora" type="time" defaultValue="09:00" />
                     <button type="submit" className="col-span-2 bg-blue-600 text-white p-2 rounded-lg font-bold uppercase text-[9px] mt-1">Adicionar Regra</button>
                   </form>
                </div>
                {rules.map(rule => (
                  <div key={rule.id} className={`p-3 rounded-lg border flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <Clock3 size={16} className="text-slate-400"/>
                      <div className="text-[10px] font-bold uppercase">{rule.days} dias {rule.type} às {rule.time}</div>
                    </div>
                    <button onClick={() => setRules(rules.filter(r => r.id !== rule.id))} className="p-1 text-red-400"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Menu Inferior Mobile - Centralizado com Grid */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 items-center justify-items-center py-2 z-[100] pb-safe shadow-2xl transition-colors ${theme === 'dark' ? 'bg-slate-900/98 border-slate-800 backdrop-blur-lg' : 'bg-white/98 border-slate-100 backdrop-blur-lg'}`}>
          <BottomNavItem icon={<LayoutDashboard size={18}/>} label="Painel" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<Users size={18}/>} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          
          {/* Botão Adicionar Centralizado */}
          <div className="relative flex items-center justify-center w-full h-full">
            <button onClick={() => setView('add')} className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-slate-50 dark:border-slate-950 transition-transform active:scale-90 z-[120]">
              <Plus size={22} />
            </button>
          </div>

          <BottomNavItem icon={<History size={18}/>} label="Matriz" active={view === 'history'} onClick={() => setView('history')} />
          
          <div className="relative flex flex-col items-center justify-center">
             <BottomNavItem icon={<MoreHorizontal size={18}/>} label="Mais" active={['scheduling', 'packages', 'messages'].includes(view)} onClick={() => setShowMobileMenu(!showMobileMenu)} />
             {showMobileMenu && (
               <div className="absolute bottom-14 right-[-10px] bg-slate-900 rounded-lg shadow-2xl p-1 w-44 flex flex-col z-[110] border border-slate-800 animate-in slide-in-from-bottom-2">
                 <MobileSubItem icon={<BellRing size={14} className="text-blue-500"/>} label="Agenda" onClick={() => { setView('scheduling'); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<Layers size={14} className="text-amber-500"/>} label="Planos" onClick={() => { setView('packages'); setShowMobileMenu(false); }} />
                 <MobileSubItem icon={<MessageSquare size={14} className="text-purple-500"/>} label="Modelos" onClick={() => { setView('messages'); setShowMobileMenu(false); }} />
                 <div className="h-px bg-slate-800 my-1"></div>
                 <MobileSubItem icon={theme === 'dark' ? <Sun size={14} className="text-amber-400"/> : <Moon size={14}/>} label="Trocar Tema" onClick={() => { toggleTheme(); setShowMobileMenu(false); }} />
               </div>
             )}
          </div>
        </nav>
      </div>

      {selectedClientForRenewal && <RenewalModal theme={theme} client={selectedClientForRenewal} packages={packages} onRenew={registerRenewal} onClose={() => setSelectedClientForRenewal(null)} />}
      {selectedClientForMsg && <MessageModal theme={theme} client={selectedClientForMsg} templates={templates} onSend={sendWhatsApp} onClose={() => setSelectedClientForMsg(null)} />}
      {selectedClientDetails && <ClientDetailsModal theme={theme} client={selectedClientDetails} onClose={() => setSelectedClientDetails(null)} />}
      {selectedClientForEdit && <EditClientModal theme={theme} client={selectedClientForEdit} packages={packages} onEdit={handleEditClient} onClose={() => setSelectedClientForEdit(null)} />}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon}
      <span className="font-bold text-[11px]">{label}</span>
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      {icon}
      <span className="text-[7px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function MobileSubItem({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 p-2.5 text-[10px] font-bold text-white hover:bg-white/10 rounded-lg uppercase transition-colors">
      {icon} {label}
    </button>
  );
}

function ActionButton({ onClick, color, icon, theme }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'text-red-400 bg-red-50 dark:bg-red-900/30 dark:text-red-400'
  };
  return (
    <button onClick={onClick} className={`p-1.5 rounded-lg border dark:border-slate-800 transition-all active:scale-90 ${colors[color]}`}>
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
    <div className={`p-2 rounded-lg border shadow-sm flex flex-col items-center text-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className={`w-8 h-8 flex items-center justify-center rounded-lg mb-1 border ${colorMap[color]}`}>{icon}</div>
      <div className="text-[11px] font-bold tracking-tight truncate w-full">{value}</div>
      <div className="text-[7px] font-bold uppercase text-slate-400">{title}</div>
    </div>
  );
}

function FormInput({ label, name, type = "text", theme, ...rest }: any) {
  return (
    <div className="space-y-0.5">
      <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">{label}</label>
      <input name={name} type={type} className={`w-full p-2 rounded-lg outline-none text-[10px] font-bold border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-300'}`} {...rest} />
    </div>
  );
}

function FilterChip({ active, label, onClick, theme }: any) {
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-lg text-[8px] font-bold transition-all whitespace-nowrap uppercase border ${active ? 'bg-blue-600 border-blue-600 text-white shadow-md' : theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>{label}</button>
  );
}

function ClientDetailsModal({ client, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-tight">Perfil</h3>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><X size={16}/></button>
        </div>
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto hide-scrollbar">
          <DetailRow theme={theme} label="Nome" value={client.name} icon={<Users size={12}/>}/>
          <div className="grid grid-cols-2 gap-2">
            <DetailRow theme={theme} label="Usuário" value={client.username} icon={<Tag size={12}/>} isMono/>
            <DetailRow theme={theme} label="Senha" value={client.password || '---'} icon={<Tag size={12}/>} isMono/>
          </div>
          <div className="grid grid-cols-2 gap-2">
             <DetailRow theme={theme} label="Plano" value={client.packageName} icon={<Smartphone size={12}/>} isHighlight/>
             <DetailRow theme={theme} label="Valor" value={`R$ ${client.price.toFixed(2)}`} icon={<DollarSign size={12}/>}/>
          </div>
          <DetailRow theme={theme} label="MAC / ID" value={client.macKey || '---'} icon={<Smartphone size={12}/>} isMono/>
          <div className="grid grid-cols-2 gap-2">
             <DetailRow theme={theme} label="Criado" value={new Date(client.createdAt).toLocaleDateString('pt-BR')} />
             <DetailRow theme={theme} label="Expira" value={new Date(client.expiresAt).toLocaleDateString('pt-BR')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditClientModal({ client, packages, onEdit, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-tight">Editar Cliente</h3>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><X size={16}/></button>
        </div>
        <form className="p-4 space-y-3 max-h-[70vh] overflow-y-auto hide-scrollbar" onSubmit={(e) => { e.preventDefault(); onEdit(Object.fromEntries(new FormData(e.currentTarget))); }}>
          <FormInput theme={theme} name="name" label="Nome" defaultValue={client.name} required />
          <FormInput theme={theme} name="phone" label="WhatsApp" defaultValue={client.phone} required />
          <div className="grid grid-cols-2 gap-2">
            <FormInput theme={theme} name="username" label="Usuário" defaultValue={client.username} required />
            <FormInput theme={theme} name="password" label="Senha" defaultValue={client.password} />
          </div>
          <div className="space-y-0.5">
            <label className="text-[8px] font-bold text-slate-400 uppercase">Plano Ativo</label>
            <select name="packageId" defaultValue={client.packageId} className={`w-full p-2 rounded-lg border text-[10px] font-bold outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`}>
              {packages.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormInput theme={theme} name="price" label="Preço" type="number" step="0.01" defaultValue={client.price} required />
            <FormInput theme={theme} name="expenses" label="Custo" type="number" step="0.01" defaultValue={client.expenses} required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold uppercase text-[9px] shadow-lg mt-2 active:scale-95 transition-all">Salvar Alterações</button>
        </form>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon, isMono, isHighlight, theme }: any) {
  return (
    <div className={`p-2 rounded-lg border ${isHighlight ? 'bg-blue-500/5 border-blue-500/20' : theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
        {icon} {label}
      </span>
      <div className={`text-[10px] font-bold truncate ${isMono ? 'font-mono' : ''} ${isHighlight ? 'text-blue-500' : ''}`}>
        {value}
      </div>
    </div>
  );
}

function RenewalModal({ client, packages, onRenew, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-tight">Renovar</h3>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><X size={16}/></button>
        </div>
        <div className="p-4 space-y-2">
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => onRenew(client.id, pkg.id)} className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group active:scale-[0.98] ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-emerald-500/5' : 'bg-slate-50 border-slate-100 hover:bg-emerald-50'}`}>
              <div>
                <div className="font-bold text-[10px] uppercase group-hover:text-emerald-500 transition-colors">{pkg.name}</div>
                <div className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">R$ {pkg.price.toFixed(2)}</div>
              </div>
              <ArrowUpRight size={14} className="text-emerald-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageModal({ client, templates, onSend, onClose, theme }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-tight">WhatsApp</h3>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><X size={16}/></button>
        </div>
        <div className="p-4 space-y-2">
          {templates.map((tpl: any) => (
            <button key={tpl.id} onClick={() => onSend(tpl, client)} className={`w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center group active:scale-[0.98] ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-blue-500/5' : 'bg-slate-50 border-slate-100 hover:bg-blue-50'}`}>
              <span className="font-bold text-[9px] uppercase tracking-widest group-hover:text-blue-500 transition-colors">{tpl.title}</span>
              <Send size={14} className="text-blue-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentActivityCard({ title, items, theme }: any) {
  return (
    <div className={`rounded-lg border shadow-sm overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <h3 className="text-[11px] font-bold uppercase flex items-center gap-2 tracking-tight"><History size={14} className="text-blue-500"/> {title}</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto hide-scrollbar">
        {items.map((it: any) => (
          <div key={it.id} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[11px] font-bold truncate">{it.clientName}</span>
              <span className="text-[8px] opacity-50 font-bold uppercase">{new Date(it.date).toLocaleDateString('pt-BR')}</span>
            </div>
            <span className="text-[9px] font-bold text-emerald-500 shrink-0">+ R$ {it.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
