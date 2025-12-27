
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
  MoreHorizontal,
  Download
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
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

  // PWA Install Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install banner if not in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already in standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setShowInstallBanner(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

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
    const financial = clients.reduce((acc, c) => {
      acc.predictedRevenue += c.price;
      acc.totalExpenses += c.expenses;
      if (c.paymentStatus === 'paid') {
        acc.paidRevenue += c.price;
      } else {
        acc.toReceiveRevenue += c.price;
      }
      return acc;
    }, { predictedRevenue: 0, toReceiveRevenue: 0, paidRevenue: 0, totalExpenses: 0 });

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

  // Clients Filter
  const filteredClients = useMemo(() => {
    return clients
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.username.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesStatus = statusFilter === 'all';
        if (!matchesStatus) {
          const expired = isExpired(c.expiresAt);
          if (statusFilter === 'active') matchesStatus = c.status === 'active' && !expired;
          else if (statusFilter === 'blocked') matchesStatus = c.status === 'blocked';
          else if (statusFilter === 'pending') matchesStatus = c.status === 'pending';
          else if (statusFilter === 'expired') matchesStatus = c.status === 'active' && expired;
        }
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = new Date(a.expiresAt).getTime();
        const timeB = new Date(b.expiresAt).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
  }, [clients, searchTerm, statusFilter, sortOrder]);

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

  const sendWhatsApp = (template: MessageTemplate, client: Client) => {
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
      {/* Install Banner Custom */}
      {showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-top duration-500">
           <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 max-w-xl mx-auto">
             <div className="flex items-center gap-3">
               <div className="bg-white/20 p-2 rounded-2xl">
                 <Download size={24} />
               </div>
               <div>
                 <p className="text-sm font-bold">Instalar EFLIXTV</p>
                 <p className="text-[10px] opacity-80 uppercase font-bold tracking-wider">Acesse em tela cheia sem navegador</p>
               </div>
             </div>
             <div className="flex gap-2">
               <button onClick={() => setShowInstallBanner(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={18}/></button>
               <button onClick={handleInstallClick} className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black active:scale-95 transition-all">INSTALAR</button>
             </div>
           </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
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
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between pt-safe">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 uppercase tracking-tight truncate mr-2">
            {view === 'dashboard' && 'Visão Geral'}
            {view === 'clients' && 'Clientes'}
            {view === 'add' && 'Novo Cadastro'}
            {view === 'scheduling' && 'Programação'}
            {view === 'packages' && 'Pacotes'}
            {view === 'messages' && 'Templates'}
          </h2>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button onClick={handleAnalyze} className="p-2.5 text-blue-600 bg-blue-50/50 hover:bg-blue-100 active:scale-95 rounded-xl transition-all" title="Insights de IA">
              <TrendingUp size={20} className={isAnalyzing ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-safe p-4 md:p-6">
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
                    <SmallStatCard label="Mês Anterior" value={0} color="text-slate-600" />
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
                      <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} className="px-4 py-3 md:py-2 text-xs font-bold outline-none bg-white cursor-pointer hover:bg-slate-50 transition-colors flex-1">
                        <option value="asc">Vencimento Próximo</option>
                        <option value="desc">Vencimento Distante</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative w-full overflow-hidden">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                      <FilterChip active={statusFilter === 'all'} label="Todos" onClick={() => setStatusFilter('all')} />
                      <FilterChip active={statusFilter === 'active'} label="Ativos" onClick={() => setStatusFilter('active')} />
                      <FilterChip active={statusFilter === 'blocked'} label="Bloqueados" onClick={() => setStatusFilter('blocked')} />
                      <FilterChip active={statusFilter === 'pending'} label="Pendentes" onClick={() => setStatusFilter('pending')} />
                      <FilterChip active={statusFilter === 'expired'} label="Vencidos" onClick={() => setStatusFilter('expired')} />
                    </div>
                  </div>
                </div>

                <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Cliente</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Dados</th>
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
                    <FormInput name="phone" label="WhatsApp" placeholder="5585900000000" type="tel" required />
                    <FormInput name="username" label="Usuário IPTV" required />
                    <FormInput name="password" label="Senha IPTV" required />
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Pacote</label>
                      <select name="packageId" required onChange={(e) => handlePackageChangeInForm(e.target.value)} className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm">
                        <option value="">Selecione um Pacote</option>
                        {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <FormInput name="months" label="Meses" type="number" value={selectedPkgInfo.months} onChange={(e: any) => setSelectedPkgInfo({...selectedPkgInfo, months: Number(e.target.value)})} />
                    <FormInput name="expiryDate" label="Vencimento" type="date" required />
                    <FormInput name="expiryTime" label="Hora" type="time" defaultValue="00:00" required />
                    <FormInput name="price" label="Preço (R$)" type="number" step="0.01" value={selectedPkgInfo.price} onChange={(e: any) => setSelectedPkgInfo({...selectedPkgInfo, price: Number(e.target.value)})} required />
                    <FormInput name="expenses" label="Custo (R$)" type="number" step="0.01" value={selectedPkgInfo.cost} onChange={(e: any) => setSelectedPkgInfo({...selectedPkgInfo, cost: Number(e.target.value)})} required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-900/20">
                    Finalizar Cadastro
                  </button>
                </form>
              </div>
            )}

            {/* Outras visões omitidas por brevidade, mantendo foco na PWA e mobile */}
          </div>
        </main>

        {/* Bottom Nav - Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around py-3 px-2 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe">
          <BottomNavItem icon={<LayoutDashboard size={20}/>} label="Início" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<Users size={20}/>} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <BottomNavItem icon={<PlusCircle size={22}/>} label="Novo" active={view === 'add'} onClick={() => setView('add')} isFab />
          <BottomNavItem icon={<BellRing size={20}/>} label="Agenda" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          <div className="relative" ref={mobileMenuRef}>
             <BottomNavItem icon={<MoreHorizontal size={20}/>} label="Mais" active={view === 'packages' || view === 'messages'} onClick={() => setShowMobileMenu(!showMobileMenu)} />
             {showMobileMenu && (
               <div className="absolute bottom-20 right-2 bg-white border border-slate-200 rounded-3xl shadow-2xl p-2.5 w-48 flex flex-col gap-1 z-50 animate-in slide-in-from-bottom-5">
                 <button onClick={() => { setView('packages'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors"><Layers size={18} className="text-blue-500"/> Pacotes</button>
                 <button onClick={() => { setView('messages'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors"><MessageSquare size={18} className="text-emerald-500"/> Templates</button>
               </div>
             )}
          </div>
        </nav>
      </div>

      {/* Modais omitidos para manter o foco na otimização de instalação e mobile */}
      {selectedClientForRenewal && (
        <RenewalModal client={selectedClientForRenewal} packages={packages} onRenew={handleRenewClient} onClose={() => setSelectedClientForRenewal(null)} />
      )}
      {selectedClientForMsg && (
        <MessageModal client={selectedClientForMsg} templates={templates} onSend={sendWhatsApp} onClose={() => setSelectedClientForMsg(null)} />
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
  const colorMap: any = { emerald: 'bg-emerald-50 text-emerald-600', slate: 'bg-slate-50 text-slate-400', red: 'bg-red-50 text-red-500', blue: 'bg-blue-50 text-blue-500' };
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
          <button onClick={onRenew} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><RefreshCw size={18} /></button>
          <button onClick={onMsg} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><MessageSquare size={18} /></button>
          <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
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
          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Acesso</span>
          <span className="font-bold text-slate-700 block truncate">{client.username}</span>
          <span className="text-slate-400 text-[10px]">{client.password}</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Vence em</span>
          <span className={`font-black text-sm ${isExpired && client.status === 'active' ? 'text-red-500' : 'text-slate-800'}`}>{new Date(client.expiresAt).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={onTogglePay} className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold border active:scale-95 ${client.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {client.paymentStatus === 'paid' ? 'PAGO' : 'AGUARDANDO'}
        </button>
        <div className="flex gap-2">
          <button onClick={onRenew} className="p-3 text-blue-600 bg-blue-50 rounded-2xl"><RefreshCw size={18} /></button>
          <button onClick={onMsg} className="p-3 text-emerald-600 bg-emerald-50 rounded-2xl"><MessageSquare size={18} /></button>
          <button onClick={onDelete} className="p-3 text-red-400 bg-red-50 rounded-2xl"><Trash2 size={18} /></button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, expired }: any) {
  if (status === 'blocked') return <span className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 text-slate-500">BLOQUEADO</span>;
  if (status === 'pending') return <span className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase bg-blue-100 text-blue-700">PENDENTE</span>;
  if (expired) return <span className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase bg-red-100 text-red-600">VENCIDO</span>;
  return <span className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-600">ATIVO</span>;
}

function DashboardTable({ title, icon, items, isPayment = false }: any) {
  return (
    <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm h-full">
      <h3 className="text-sm md:text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">{icon}{title}</h3>
      <div className="space-y-3">
        {items.length === 0 ? <div className="py-10 text-center text-slate-300 text-[10px] font-bold uppercase">Sem registros</div> : items.map(c => (
            <div key={c.id} className="flex justify-between items-center p-4 rounded-2xl border border-slate-50">
              <div className="text-sm font-bold text-slate-700 truncate mr-3">{c.name}</div>
              <div className="text-right shrink-0">
                {isPayment ? <div className="text-sm font-bold text-amber-600">R$ {c.price.toFixed(2)}</div> : <div className="text-[10px] font-bold text-slate-500">{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</div>}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function FormInput({ label, name, type = "text", icon, ...rest }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 ml-1">{icon}{label}</label>
      <input name={name} type={type} className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm" {...rest} />
    </div>
  );
}

function FilterChip({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-5 py-2.5 rounded-2xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${active ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500'}`}>{label}</button>
  );
}

function RenewalModal({ client, packages, onRenew, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="bg-blue-600 p-7 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">Renovar Plano</h3>
          <button onClick={onClose} className="p-2.5 bg-blue-700/50 rounded-full"><X size={24}/></button>
        </div>
        <div className="p-5 md:p-7 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => onRenew(client.id, pkg.id)} className="w-full text-left p-5 rounded-3xl border border-slate-100 hover:border-blue-300 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">{pkg.name}</div>
                <div className="text-xs text-slate-500 mt-1">R$ {pkg.price.toFixed(2)}</div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageModal({ client, templates, onSend, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="bg-emerald-600 p-7 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">WhatsApp</h3>
          <button onClick={onClose} className="p-2.5 bg-emerald-700/50 rounded-full"><X size={24}/></button>
        </div>
        <div className="p-5 md:p-7 space-y-4 max-h-[75vh] overflow-y-auto">
          {templates.map((tpl: any) => (
            <button key={tpl.id} onClick={() => onSend(tpl, client)} className="w-full text-left p-5 rounded-3xl border border-slate-100 flex justify-between items-center">
              <div className="font-bold text-slate-700 text-sm">{tpl.title}</div>
              <Send size={18} className="text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
