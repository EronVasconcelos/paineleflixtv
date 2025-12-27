
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  PlusCircle, 
  Search, 
  ChevronRight,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  DollarSign,
  Smartphone,
  Key,
  TrendingUp,
  CreditCard,
  Layers,
  Trash2,
  Send,
  X,
  Calendar,
  Activity,
  RefreshCw,
  ArrowUpDown,
  BellRing,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { Client, ClientStatus, Package, MessageTemplate, ScheduledMessage } from './types';
import { geminiService } from './services/geminiService';

const PANEL_NAME = "EFLIXTV";
const ADMIN_NUMBER = "5585992780931";

const INITIAL_PACKAGES: Package[] = [
  { id: 'p1', name: 'Básico SD/HD', price: 25.00, cost: 8.00, months: 1 },
  { id: 'p2', name: 'Completo Full HD', price: 35.00, cost: 12.00, months: 1 },
  { id: 'p3', name: 'Premium 4K', price: 50.00, cost: 15.00, months: 1 }
];

const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 't1',
    title: 'Boas-vindas',
    body: 'Olá {{nome}}! Seja bem-vindo ao {{painel}}. Seguem seus dados de acesso:\n\n👤 Usuário: {{usuario}}\n🔑 Senha: {{senha}}\n📦 Pacote: {{pacote}}\n📅 Vencimento: {{vencimento}}\n\nQualquer dúvida, estamos à disposição!'
  },
  {
    id: 't2',
    title: 'Aviso de Vencimento',
    body: 'Olá {{nome}}, passando para lembrar que sua assinatura no {{painel}} vence em {{vencimento}}. O valor para renovação é R$ {{valor}}. Vamos renovar para não ficar sem sinal?'
  }
];

export default function App() {
  const [view, setView] = useState<'dashboard' | 'clients' | 'add' | 'scheduling' | 'packages' | 'messages'>('dashboard');
  const [selectedClientForMsg, setSelectedClientForMsg] = useState<Client | null>(null);
  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState<Client | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Core Data States
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('iptv_clients');
    return saved ? JSON.parse(saved) : [];
  });
  const [packages, setPackages] = useState<Package[]>(() => {
    const saved = localStorage.getItem('iptv_packages');
    return saved ? JSON.parse(saved) : INITIAL_PACKAGES;
  });
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    const saved = localStorage.getItem('iptv_templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>(() => {
    const saved = localStorage.getItem('iptv_schedules');
    return saved ? JSON.parse(saved) : [];
  });

  // UI & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPkgInfo, setSelectedPkgInfo] = useState({ price: 0, cost: 0, months: 1 });

  useEffect(() => {
    localStorage.setItem('iptv_clients', JSON.stringify(clients));
    localStorage.setItem('iptv_packages', JSON.stringify(packages));
    localStorage.setItem('iptv_templates', JSON.stringify(templates));
    localStorage.setItem('iptv_schedules', JSON.stringify(scheduledMessages));
  }, [clients, packages, templates, scheduledMessages]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isExpired = (expiryStr: string) => new Date(expiryStr) < new Date();

  // Financial Stats Logic
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const financial = clients.reduce((acc, c) => {
      acc.predictedRevenue += c.price;
      acc.totalExpenses += c.expenses;
      
      const cDate = new Date(c.lastPaymentDate || c.createdAt);
      const isPrevMonth = cDate.getMonth() === prevMonth && cDate.getFullYear() === prevMonthYear;

      if (c.paymentStatus === 'paid') {
        acc.paidRevenue += c.price;
        if (isPrevMonth) acc.prevMonthRevenue += c.price;
      } else {
        acc.toReceiveRevenue += c.price;
      }
      return acc;
    }, { prevMonthRevenue: 0, predictedRevenue: 0, toReceiveRevenue: 0, paidRevenue: 0, totalExpenses: 0 });

    return {
      activeCount: clients.filter(c => !isExpired(c.expiresAt) && c.status === 'active').length,
      blockedCount: clients.filter(c => c.status === 'blocked').length,
      expiredCount: clients.filter(c => isExpired(c.expiresAt) && c.status === 'active').length,
      expiringSoonCount: clients.filter(c => {
        const d = new Date(c.expiresAt);
        const soon = new Date(); soon.setDate(now.getDate() + 7);
        return d > now && d <= soon;
      }).length,
      financial: {
        ...financial,
        predictedProfit: financial.predictedRevenue - financial.totalExpenses,
        realProfit: financial.paidRevenue - financial.totalExpenses
      }
    };
  }, [clients]);

  // Clients with Sort & Filter
  const filteredClients = useMemo(() => {
    return clients
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.username.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesStatus = statusFilter === 'all';
        if (!matchesStatus) {
          const expired = isExpired(c.expiresAt);
          if (statusFilter === 'active') {
            matchesStatus = c.status === 'active' && !expired;
          } else if (statusFilter === 'blocked') {
            matchesStatus = c.status === 'blocked';
          } else if (statusFilter === 'pending') {
            matchesStatus = c.status === 'pending';
          } else if (statusFilter === 'expired') {
            matchesStatus = c.status === 'active' && expired;
          }
        }
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = new Date(a.expiresAt).getTime();
        const timeB = new Date(b.expiresAt).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
  }, [clients, searchTerm, statusFilter, sortOrder]);

  // Pending Scheduled Messages logic
  const pendingSchedules = useMemo(() => {
    const now = new Date();
    return scheduledMessages.filter(s => {
      if (!s.isActive) return false;
      const scheduledDate = new Date(s.startDate);
      if (s.intervalDays > 0 && s.lastSentAt) {
        const nextDate = new Date(s.lastSentAt);
        nextDate.setDate(nextDate.getDate() + s.intervalDays);
        return nextDate <= now;
      }
      return scheduledDate <= now && !s.lastSentAt;
    });
  }, [scheduledMessages]);

  const togglePaymentStatus = (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, paymentStatus: c.paymentStatus === 'paid' ? 'pending' : 'paid', lastPaymentDate: c.paymentStatus !== 'paid' ? new Date().toISOString() : c.lastPaymentDate } : c));
  };

  const deleteClient = (id: string) => {
    if (window.confirm('Excluir cliente definitivamente?')) setClients(prev => prev.filter(c => c.id !== id));
  };

  const handlePackageChangeInForm = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (pkg) setSelectedPkgInfo({ price: pkg.price, cost: pkg.cost, months: pkg.months });
    else setSelectedPkgInfo({ price: 0, cost: 0, months: 1 });
  };

  const handleRenewClient = (clientId: string, packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const baseDate = isExpired(c.expiresAt) ? new Date() : new Date(c.expiresAt);
        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + pkg.months);
        return {
          ...c,
          status: 'active',
          packageName: pkg.name,
          packageId: pkg.id,
          price: pkg.price,
          expenses: pkg.cost,
          expiresAt: newExpiry.toISOString(),
          paymentStatus: 'pending'
        };
      }
      return c;
    }));
    setSelectedClientForRenewal(null);
  };

  const handleAddClient = (formValues: any) => {
    const selectedPkg = packages.find(p => p.id === formValues.packageId);
    const months = Number(formValues.months) || selectedPkg?.months || 1;
    const expiresAt = new Date(`${formValues.expiryDate}T${formValues.expiryTime || '00:00'}:00`).toISOString();

    const client: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: formValues.name,
      username: formValues.username,
      password: formValues.password,
      status: (formValues.initialStatus as ClientStatus) || 'active',
      paymentStatus: formValues.paymentStatus || 'pending',
      phone: formValues.phone,
      packageName: selectedPkg?.name || 'Personalizado',
      packageId: formValues.packageId,
      months: months,
      price: Number(formValues.price) || 0,
      discount: Number(formValues.discount) || 0,
      expenses: Number(formValues.expenses) || 0,
      notes: formValues.notes || '',
      appName: formValues.appName,
      macKey: formValues.macKey,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
      lastPaymentDate: formValues.paymentStatus === 'paid' ? new Date().toISOString() : '',
    };
    setClients([...clients, client]);
    setView('clients');
    setSelectedPkgInfo({ price: 0, cost: 0, months: 1 });
  };

  const sendWhatsApp = (template: MessageTemplate, client: Client, scheduleId?: string) => {
    const message = template.body
      .replace(/{{nome}}/g, client.name)
      .replace(/{{painel}}/g, PANEL_NAME)
      .replace(/{{usuario}}/g, client.username)
      .replace(/{{senha}}/g, client.password || '******')
      .replace(/{{pacote}}/g, client.packageName)
      .replace(/{{vencimento}}/g, new Date(client.expiresAt).toLocaleDateString('pt-BR'))
      .replace(/{{valor}}/g, client.price.toFixed(2));

    const phone = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

    if (scheduleId) {
      setScheduledMessages(prev => prev.map(s => s.id === scheduleId ? { ...s, lastSentAt: new Date().toISOString() } : s));
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await geminiService.analyzeBusiness(clients);
      setAiAnalysis(analysis);
    } catch (err) { console.error(err); }
    finally { setIsAnalyzing(false); }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden text-slate-700 font-['Roboto'] select-none">
      {/* Sidebar - Desktop Only */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
            <Users size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{PANEL_NAME}</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={20} />} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <SidebarItem icon={<PlusCircle size={20} />} label="Novo Cliente" active={view === 'add'} onClick={() => setView('add')} />
          <SidebarItem icon={<BellRing size={20} />} label="Agendamentos" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          <SidebarItem icon={<Layers size={20} />} label="Pacotes" active={view === 'packages'} onClick={() => setView('packages')} />
          <SidebarItem icon={<MessageSquare size={20} />} label="Mensagens" active={view === 'messages'} onClick={() => setView('messages')} />
        </nav>
        <div className="p-4 bg-slate-800/50 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
          WhatsApp: {ADMIN_NUMBER}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 uppercase tracking-tight truncate mr-2">
            {view === 'dashboard' && 'Visão Geral'}
            {view === 'clients' && 'Clientes'}
            {view === 'add' && 'Novo Cadastro'}
            {view === 'scheduling' && 'Programação'}
            {view === 'packages' && 'Pacotes'}
            {view === 'messages' && 'Templates'}
          </h2>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {pendingSchedules.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200 animate-pulse">
                <BellRing size={14}/> {pendingSchedules.length} Pendentes
              </div>
            )}
            <button onClick={handleAnalyze} className="p-2.5 text-blue-600 bg-blue-50/50 hover:bg-blue-100 active:scale-95 rounded-xl transition-all" title="Insights de IA">
              <TrendingUp size={20} className={isAnalyzing ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-28 md:pb-6 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-5 md:space-y-6">
            {aiAnalysis && (
              <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl text-sm relative animate-in fade-in slide-in-from-top-4 shadow-sm">
                 <button onClick={() => setAiAnalysis(null)} className="absolute top-4 right-4 text-blue-300 hover:text-blue-500"><X size={18}/></button>
                 <h4 className="font-bold text-blue-600 uppercase text-[10px] mb-2 flex items-center gap-2"><TrendingUp size={14}/> Análise do Negócio (IA)</h4>
                 <p className="text-blue-800 whitespace-pre-line leading-relaxed text-sm">{aiAnalysis}</p>
              </div>
            )}

            {view === 'dashboard' && (
              <div className="space-y-6 md:space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <StatCard title="Ativos" value={stats.activeCount} icon={<CheckCircle className="text-emerald-500" />} color="emerald" />
                  <StatCard title="Bloqueados" value={stats.blockedCount} icon={<XCircle className="text-slate-400" />} color="slate" />
                  <StatCard title="Vencidos" value={stats.expiredCount} icon={<XCircle className="text-red-500" />} color="red" />
                  <StatCard title="Total" value={clients.length} icon={<Users className="text-blue-500" />} color="blue" />
                </div>

                <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <h3 className="text-sm md:text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <Activity className="text-blue-600" size={18} /> Financeiro Detalhado
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 md:gap-3">
                    <SmallStatCard label="Mês Anterior" value={stats.financial.prevMonthRevenue} color="text-slate-600" />
                    <SmallStatCard label="Prevista" value={stats.financial.predictedRevenue} color="text-blue-600" />
                    <SmallStatCard label="À Receber" value={stats.financial.toReceiveRevenue} color="text-amber-600" />
                    <SmallStatCard label="Receita Paga" value={stats.financial.paidRevenue} color="text-emerald-600" />
                    <SmallStatCard label="Despesas" value={stats.financial.totalExpenses} color="text-red-500" />
                    <SmallStatCard label="Lucro Prev." value={stats.financial.predictedProfit} color="text-blue-700" bold />
                    <SmallStatCard label="Lucro Real" value={stats.financial.realProfit} color="text-emerald-700" bold highlight />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <DashboardTable title="Próximos Vencimentos" icon={<Clock className="text-blue-500"/>} items={clients.sort((a,b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()).slice(0, 8)} />
                  <DashboardTable title="Pagamentos Pendentes" icon={<CreditCard className="text-amber-500"/>} items={clients.filter(c => c.paymentStatus === 'pending').slice(0, 8)} isPayment />
                </div>
              </div>
            )}

            {view === 'clients' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" placeholder="Buscar cliente..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full md:w-auto">
                      <span className="hidden sm:inline px-3 py-2 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 border-r border-slate-100 flex items-center gap-1"><ArrowUpDown size={12}/> Ordem:</span>
                      <select 
                        value={sortOrder} 
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                        className="px-4 py-3 md:py-2 text-xs font-bold outline-none bg-white cursor-pointer hover:bg-slate-50 transition-colors flex-1"
                      >
                        <option value="asc">Vencimento Próximo</option>
                        <option value="desc">Vencimento Distante</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative w-full">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar scroll-smooth">
                      <FilterChip active={statusFilter === 'all'} label="Todos" onClick={() => setStatusFilter('all')} />
                      <FilterChip active={statusFilter === 'active'} label="Ativos" onClick={() => setStatusFilter('active')} />
                      <FilterChip active={statusFilter === 'blocked'} label="Bloqueados" onClick={() => setStatusFilter('blocked')} />
                      <FilterChip active={statusFilter === 'pending'} label="Pendentes" onClick={() => setStatusFilter('pending')} />
                      <FilterChip active={statusFilter === 'expired'} label="Vencidos" onClick={() => setStatusFilter('expired')} />
                    </div>
                  </div>
                </div>

                {/* Table for Desktop / Cards for Mobile */}
                <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Cliente</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Dados Acesso</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Vencimento</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Pagamento</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Status</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredClients.map(client => (
                          <ClientRow 
                            key={client.id} 
                            client={client} 
                            isExpired={isExpired(client.expiresAt)}
                            onRenew={() => setSelectedClientForRenewal(client)}
                            onMsg={() => setSelectedClientForMsg(client)}
                            onDelete={() => deleteClient(client.id)}
                            onTogglePay={() => togglePaymentStatus(client.id)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden space-y-4">
                  {filteredClients.map(client => (
                    <ClientCard 
                      key={client.id} 
                      client={client} 
                      isExpired={isExpired(client.expiresAt)}
                      onRenew={() => setSelectedClientForRenewal(client)}
                      onMsg={() => setSelectedClientForMsg(client)}
                      onDelete={() => deleteClient(client.id)}
                      onTogglePay={() => togglePaymentStatus(client.id)}
                    />
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="bg-white rounded-3xl p-12 text-center text-slate-300 flex flex-col items-center gap-3">
                      <Search size={48} className="opacity-20" />
                      <span className="text-xs font-bold uppercase tracking-widest">Nenhum cliente encontrado</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === 'add' && (
              <div className="bg-white p-5 md:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-4xl mx-auto mb-10">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <UserPlus className="text-blue-600" size={24} />
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">Novo Cadastro</h3>
                </div>
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleAddClient(Object.fromEntries(new FormData(e.currentTarget))); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    <FormInput name="name" label="Nome Completo" required />
                    <FormInput name="phone" label="WhatsApp" placeholder="5585900000000" type="tel" inputMode="tel" required />
                    <FormInput name="username" label="Usuário IPTV" required />
                    <FormInput name="password" label="Senha IPTV" required />
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Pacote</label>
                      <select name="packageId" required onChange={(e) => handlePackageChangeInForm(e.target.value)} className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm">
                        <option value="">Selecione um Pacote</option>
                        {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <FormInput name="months" label="Meses de Plano" type="number" inputMode="numeric" value={selectedPkgInfo.months} onChange={(e: any) => setSelectedPkgInfo({...selectedPkgInfo, months: Number(e.target.value)})} />
                    <FormInput name="expiryDate" label="Data de Vencimento" type="date" required />
                    <FormInput name="expiryTime" label="Hora de Vencimento" type="time" defaultValue="00:00" required />
                    <FormInput name="price" label="Preço (R$)" type="number" step="0.01" inputMode="decimal" value={selectedPkgInfo.price} onChange={(e: any) => setSelectedPkgInfo({...selectedPkgInfo, price: Number(e.target.value)})} required />
                    <FormInput name="expenses" label="Custo (R$)" type="number" step="0.01" inputMode="decimal" value={selectedPkgInfo.cost} onChange={(e: any) => setSelectedPkgInfo({...selectedPkgInfo, cost: Number(e.target.value)})} required />
                    <FormInput name="discount" label="Desconto (R$)" type="number" step="0.01" inputMode="decimal" defaultValue="0" />
                    <FormInput name="appName" label="Aplicativo" icon={<Smartphone size={12}/>} placeholder="Ex: IPTV Smarters" />
                    <FormInput name="macKey" label="MAC / Chave" icon={<Key size={12}/>} placeholder="00:11:22:..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Status Inicial</label>
                      <select name="initialStatus" className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="active">Ativo</option>
                        <option value="blocked">Bloqueado</option>
                        <option value="pending">Pendente</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Pagamento Inicial</label>
                      <select name="paymentStatus" className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all text-lg shadow-lg shadow-blue-900/20">
                    Finalizar Cadastro
                  </button>
                </form>
              </div>
            )}

            {view === 'scheduling' && (
              <div className="space-y-6">
                <div className="bg-white p-5 md:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-4xl mx-auto">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Clock className="text-blue-600" /> Programar Envio</h3>
                  <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     const start = `${fd.get('date')}T${fd.get('time')}:00`;
                     setScheduledMessages([...scheduledMessages, {
                       id: Math.random().toString(36).substr(2, 9),
                       clientId: fd.get('clientId') as string,
                       templateId: fd.get('templateId') as string,
                       startDate: start,
                       intervalDays: Number(fd.get('interval')) || 0,
                       isActive: true
                     }]);
                     e.currentTarget.reset();
                  }}>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-400">Cliente</label>
                      <select name="clientId" required className="w-full p-3.5 border rounded-xl bg-white outline-none focus:ring-2 ring-blue-500 text-sm">
                        <option value="">Selecione...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-400">Modelo</label>
                      <select name="templateId" required className="w-full p-3.5 border rounded-xl bg-white outline-none focus:ring-2 ring-blue-500 text-sm">
                        <option value="">Selecione...</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-400">Início</label>
                      <input name="date" type="date" required className="w-full p-3.5 border rounded-xl bg-white outline-none text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-400">Hora</label>
                      <input name="time" type="time" defaultValue="09:00" required className="w-full p-3.5 border rounded-xl bg-white outline-none text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-400">Repetir (dias)</label>
                      <input name="interval" type="number" inputMode="numeric" defaultValue="0" className="w-full p-3.5 border rounded-xl outline-none text-sm" />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm">Ativar Envio</button>
                  </form>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                   <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Configuração</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Frequência</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scheduledMessages.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 text-sm">{clients.find(cl => cl.id === s.clientId)?.name || 'Removido'}</div>
                              <div className="text-xs text-slate-500">{templates.find(tl => tl.id === s.templateId)?.title || 'Removido'}</div>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-tight text-slate-400">
                              {s.intervalDays === 0 ? 'Único' : `Repete ${s.intervalDays}d`}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => setScheduledMessages(prev => prev.filter(x => x.id !== s.id))} className="text-red-400 p-2.5 hover:bg-red-50 rounded-xl active:scale-90 transition-all"><Trash2 size={18}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {(view === 'packages' || view === 'messages') && (
              <div className="space-y-6">
                {view === 'packages' && (
                  <>
                    <div className="bg-white p-5 md:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Layers size={20} className="text-blue-600"/> Novo Pacote</h3>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        setPackages([...packages, {
                          id: Math.random().toString(36).substr(2,9),
                          name: fd.get('name') as string,
                          price: Number(fd.get('price')),
                          cost: Number(fd.get('cost')),
                          months: Number(fd.get('months')) || 1
                        }]);
                        e.currentTarget.reset();
                      }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FormInput name="name" label="Nome" placeholder="Ex: Premium" required />
                        <FormInput name="price" label="Venda" type="number" step="0.01" inputMode="decimal" required />
                        <FormInput name="cost" label="Custo" type="number" step="0.01" inputMode="decimal" required />
                        <FormInput name="months" label="Meses" type="number" inputMode="numeric" defaultValue="1" required />
                        <button type="submit" className="bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 active:scale-95 transition-all sm:col-span-2 lg:col-span-1">Criar</button>
                      </form>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {packages.map(p => (
                        <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group active:scale-[0.98] transition-transform">
                          <div>
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.months} Mes(es)</div>
                            <div className="mt-1.5 text-emerald-600 font-bold">R$ {p.price.toFixed(2)}</div>
                          </div>
                          <button onClick={() => setPackages(packages.filter(x => x.id !== p.id))} className="p-2.5 text-slate-300 hover:text-red-500 active:scale-90 transition-all"><Trash2 size={20}/></button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {view === 'messages' && (
                  <>
                    <div className="bg-white p-5 md:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><MessageSquare size={20} className="text-blue-600"/> Novo Modelo</h3>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        setTemplates([...templates, {
                          id: Math.random().toString(36).substr(2,9),
                          title: fd.get('title') as string,
                          body: fd.get('body') as string
                        }]);
                        e.currentTarget.reset();
                      }} className="space-y-4">
                        <FormInput name="title" label="Título" placeholder="Ex: Aviso de Cobrança" required />
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase">Texto da Mensagem</label>
                          <textarea name="body" rows={4} className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="{{nome}}, {{usuario}}, {{senha}}, ..."></textarea>
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-blue-700 active:scale-95 transition-all w-full md:w-auto">Salvar Modelo</button>
                      </form>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templates.map(tpl => (
                        <div key={tpl.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative group">
                          <button onClick={() => setTemplates(templates.filter(t => t.id !== tpl.id))} className="absolute top-4 right-4 text-slate-200 hover:text-red-500 active:scale-90 transition-all"><Trash2 size={18}/></button>
                          <h4 className="font-bold text-slate-800 mb-2.5 pr-8">{tpl.title}</h4>
                          <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 italic leading-relaxed">"{tpl.body}"</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Bottom Nav - Mobile Only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around py-3 px-2 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <BottomNavItem icon={<LayoutDashboard size={20}/>} label="Início" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<Users size={20}/>} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <BottomNavItem icon={<PlusCircle size={22}/>} label="Novo" active={view === 'add'} onClick={() => setView('add')} isFab />
          <BottomNavItem icon={<BellRing size={20}/>} label="Agenda" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          <div className="relative" ref={mobileMenuRef}>
             <BottomNavItem icon={<MoreHorizontal size={20}/>} label="Mais" active={view === 'packages' || view === 'messages'} onClick={() => setShowMobileMenu(!showMobileMenu)} />
             {showMobileMenu && (
               <div className="absolute bottom-20 right-2 bg-white border border-slate-200 rounded-3xl shadow-2xl p-2.5 w-48 flex flex-col gap-1 z-50 animate-in slide-in-from-bottom-5 fade-in">
                 <button onClick={() => { setView('packages'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-2xl active:bg-slate-100 transition-colors"><Layers size={18} className="text-blue-500"/> Gerenciar Pacotes</button>
                 <button onClick={() => { setView('messages'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-2xl active:bg-slate-100 transition-colors"><MessageSquare size={18} className="text-emerald-500"/> Templates Zap</button>
               </div>
             )}
          </div>
        </nav>
      </div>

      {/* Renewal Modal */}
      {selectedClientForRenewal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-7 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Renovar Plano</h3>
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">{selectedClientForRenewal.name}</p>
              </div>
              <button onClick={() => setSelectedClientForRenewal(null)} className="p-2.5 bg-blue-700/50 hover:bg-blue-700 active:scale-90 rounded-full transition-all"><X size={24}/></button>
            </div>
            <div className="p-5 md:p-7 space-y-3.5 max-h-[70vh] overflow-y-auto">
              {packages.map(pkg => (
                <button 
                  key={pkg.id} 
                  onClick={() => handleRenewClient(selectedClientForRenewal.id, pkg.id)} 
                  className="w-full text-left p-5 rounded-3xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98] transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-base">{pkg.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{pkg.months} mes(es) • R$ {pkg.price.toFixed(2)}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600" />
                  </div>
                </button>
              ))}
              {packages.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">Nenhum pacote cadastrado</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Selection Modal */}
      {selectedClientForMsg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-emerald-600 p-7 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">WhatsApp</h3>
                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1">{selectedClientForMsg.name}</p>
              </div>
              <button onClick={() => setSelectedClientForMsg(null)} className="p-2.5 bg-emerald-700/50 hover:bg-emerald-700 active:scale-90 rounded-full transition-all"><X size={24}/></button>
            </div>
            <div className="p-5 md:p-7 space-y-4 max-h-[75vh] overflow-y-auto">
              <button 
                onClick={async () => {
                  setIsGeneratingAI(true);
                  const msg = await geminiService.generateRenewalMessage(selectedClientForMsg);
                  window.open(`https://wa.me/${selectedClientForMsg.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                  setIsGeneratingAI(false);
                }}
                disabled={isGeneratingAI}
                className="w-full text-left p-5 rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] transition-all flex items-center justify-between disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm">
                    <TrendingUp className={`text-emerald-600 ${isGeneratingAI ? 'animate-pulse' : ''}`} size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-800 text-base">IA Criativa</div>
                    <div className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Gerar texto único</div>
                  </div>
                </div>
                <Send size={18} className="text-emerald-400" />
              </button>

              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 border-t border-slate-100"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Modelos Salvos</span>
                <div className="flex-1 border-t border-slate-100"></div>
              </div>

              {templates.map(tpl => (
                <button key={tpl.id} onClick={() => sendWhatsApp(tpl, selectedClientForMsg)} className="w-full text-left p-5 rounded-3xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98] transition-all flex justify-between items-center group">
                  <div className="font-bold text-slate-700 truncate pr-3 text-sm">{tpl.title}</div>
                  <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                    <Send size={18} className="text-slate-400 group-hover:text-emerald-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Internal Components
function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon}
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick, isFab = false }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-95 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      <div className={`p-2 rounded-2xl ${isFab ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 -mt-8 w-14 h-14 flex items-center justify-center' : (active ? 'bg-blue-50' : '')}`}>
        {icon}
      </div>
      {!isFab && <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap: any = {
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-50 text-slate-400',
    red: 'bg-red-50 text-red-500',
    blue: 'bg-blue-50 text-blue-500'
  };
  return (
    <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-2.5">
        <div className={`p-2 md:p-3 rounded-2xl ${colorMap[color]}`}>{icon}</div>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tighter">{value}</div>
      <div className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</div>
    </div>
  );
}

function SmallStatCard({ label, value, color, bold = false, highlight = false }: any) {
  return (
    <div className={`p-3.5 md:p-4 rounded-3xl border transition-all ${highlight ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="text-[8px] md:text-[9px] font-bold uppercase text-slate-400 mb-1.5 tracking-widest leading-none">{label}</div>
      <div className={`text-xs md:text-sm ${bold ? 'font-bold' : 'font-semibold'} ${color} tracking-tight truncate`}>
        R$ {value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
      </div>
    </div>
  );
}

function ClientRow({ client, isExpired, onRenew, onMsg, onDelete, onTogglePay }: any) {
  return (
    <tr className={`hover:bg-slate-50 transition-colors ${isExpired && client.status === 'active' ? 'bg-red-50/20' : ''}`}>
      <td className="px-6 py-4">
        <div className="font-bold text-slate-800">{client.name}</div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{client.packageName}</div>
      </td>
      <td className="px-6 py-4 text-sm font-medium">
        <div className="text-slate-600">{client.username}</div>
        <div className="text-slate-400 text-xs font-normal">{client.password}</div>
      </td>
      <td className="px-6 py-4">
        <div className={`text-sm font-bold ${isExpired && client.status === 'active' ? 'text-red-500' : 'text-slate-700'}`}>
          {new Date(client.expiresAt).toLocaleDateString('pt-BR')}
        </div>
      </td>
      <td className="px-6 py-4">
        <button onClick={onTogglePay} className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all active:scale-95 ${client.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {client.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}
        </button>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={client.status} expired={isExpired} />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-1.5">
          <button onClick={onRenew} className="p-2 text-blue-600 hover:bg-blue-50 active:scale-90 rounded-xl transition-all"><RefreshCw size={18} /></button>
          <button onClick={onMsg} className="p-2 text-emerald-600 hover:bg-emerald-50 active:scale-90 rounded-xl transition-all"><MessageSquare size={18} /></button>
          <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-50 active:scale-90 rounded-xl transition-all"><Trash2 size={18} /></button>
        </div>
      </td>
    </tr>
  );
}

function ClientCard({ client, isExpired, onRenew, onMsg, onDelete, onTogglePay }: any) {
  return (
    <div className={`bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 active:scale-[0.99] transition-transform ${isExpired && client.status === 'active' ? 'border-red-200 ring-4 ring-red-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-slate-800 text-base leading-tight mb-1">{client.name}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{client.packageName}</div>
        </div>
        <StatusBadge status={client.status} expired={isExpired} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-50 py-4">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 tracking-tighter">Usuário</span>
          <span className="font-bold text-slate-700 block truncate">{client.username}</span>
          <span className="text-slate-400 font-normal text-[10px]">{client.password}</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 tracking-tighter">Vencimento</span>
          <span className={`font-black text-sm ${isExpired && client.status === 'active' ? 'text-red-500' : 'text-slate-800'}`}>
            {new Date(client.expiresAt).toLocaleDateString('pt-BR')}
          </span>
          <span className="block text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(client.expiresAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button onClick={onTogglePay} className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold border transition-all active:scale-95 ${client.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {client.paymentStatus === 'paid' ? 'PAGAMENTO OK' : 'AGUARDANDO'}
        </button>
        <div className="flex gap-2">
          <button onClick={onRenew} className="p-3 text-blue-600 bg-blue-50 active:scale-90 rounded-2xl transition-all shadow-sm" title="Renovar"><RefreshCw size={18} /></button>
          <button onClick={onMsg} className="p-3 text-emerald-600 bg-emerald-50 active:scale-90 rounded-2xl transition-all shadow-sm" title="WhatsApp"><MessageSquare size={18} /></button>
          <button onClick={onDelete} className="p-3 text-red-400 bg-red-50 active:scale-90 rounded-2xl transition-all shadow-sm" title="Excluir"><Trash2 size={18} /></button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, expired }: any) {
  if (status === 'blocked') return <span className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">BLOQUEADO</span>;
  if (status === 'pending') return <span className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">PENDENTE</span>;
  if (expired) return <span className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-600">VENCIDO</span>;
  return <span className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-600">ATIVO</span>;
}

function DashboardTable({ title, icon, items, isPayment = false }: any) {
  return (
    <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm h-full">
      <h3 className="text-sm md:text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">{icon}{title}</h3>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="py-10 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">Sem registros no momento</div>
        ) : (
          items.map(c => (
            <div key={c.id} className="flex justify-between items-center p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
              <div className="text-sm font-bold text-slate-700 truncate mr-3">{c.name}</div>
              <div className="text-right shrink-0">
                {isPayment ? (
                  <div className="text-sm font-bold text-amber-600">R$ {c.price.toFixed(2)}</div>
                ) : (
                  <div className="text-[10px] font-bold text-slate-500 uppercase">{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FormInput({ label, name, type = "text", icon, ...rest }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 ml-1">{icon}{label}</label>
      <input 
        name={name} 
        type={type} 
        className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm md:text-base placeholder:text-slate-300" 
        {...rest} 
      />
    </div>
  );
}

function FilterChip({ active, label, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`px-5 py-2.5 rounded-2xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}
    >
      {label}
    </button>
  );
}
