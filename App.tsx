
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
    title: 'BOAS-VINDAS',
    body: 'Olá {{nome}}! Seja bem-vindo ao {{painel}}. Seguem seus dados de acesso:\n\n👤 Usuário: {{usuario}}\n🔑 Senha: {{senha}}\n📦 Pacote: {{pacote}}\n📅 Vencimento: {{vencimento}}\n\nQualquer dúvida, estamos à disposição!'
  },
  {
    id: 't2',
    title: 'AVISO DE VENCIMENTO',
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

  // UI States
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

  // PWA logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone) setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isStandalone) setTimeout(() => setShowInstallBanner(true), 3000);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("No iPhone: Toque em 'Compartilhar' e 'Adicionar à Tela de Início'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') console.log('PWA Aceito');
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const isExpired = (expiryStr: string) => new Date(expiryStr) < new Date();

  // Financial Stats
  const stats = useMemo(() => {
    const financial = clients.reduce((acc, c) => {
      acc.predictedRevenue += (c.price || 0);
      acc.totalExpenses += (c.expenses || 0);
      if (c.paymentStatus === 'paid') acc.paidRevenue += (c.price || 0);
      else acc.toReceiveRevenue += (c.price || 0);
      return acc;
    }, { predictedRevenue: 0, toReceiveRevenue: 0, paidRevenue: 0, totalExpenses: 0 });

    return {
      activeCount: clients.filter(c => !isExpired(c.expiresAt) && c.status === 'active').length,
      blockedCount: clients.filter(c => c.status === 'blocked').length,
      expiredCount: clients.filter(c => isExpired(c.expiresAt) && c.status === 'active').length,
      totalCount: clients.length,
      financial: {
        ...financial,
        predictedProfit: financial.predictedRevenue - financial.totalExpenses,
        realProfit: financial.paidRevenue - financial.totalExpenses
      }
    };
  }, [clients]);

  // Filters
  const filteredClients = useMemo(() => {
    return clients
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.username.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Actions
  const togglePaymentStatus = (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, paymentStatus: c.paymentStatus === 'paid' ? 'pending' : 'paid', lastPaymentDate: c.paymentStatus !== 'paid' ? new Date().toISOString() : c.lastPaymentDate } : c));
  };

  const deleteClient = (id: string) => {
    if (window.confirm('EXCLUIR CLIENTE DEFINITIVAMENTE?')) setClients(prev => prev.filter(c => c.id !== id));
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

  // Fix: Defined handlePackageChangeInForm to handle package selection in the add client form.
  const handlePackageChangeInForm = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (pkg) {
      setSelectedPkgInfo({
        price: pkg.price,
        cost: pkg.cost,
        months: pkg.months
      });
    } else {
      setSelectedPkgInfo({ price: 0, cost: 0, months: 1 });
    }
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
      status: 'active',
      paymentStatus: formValues.paymentStatus || 'pending',
      phone: formValues.phone,
      packageName: selectedPkg?.name || 'Personalizado',
      packageId: formValues.packageId,
      months: months,
      price: Number(formValues.price) || 0,
      discount: 0,
      expenses: Number(formValues.expenses) || 0,
      notes: '',
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
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom duration-700 md:hidden">
           <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl flex flex-col gap-4 border border-white/10">
             <div className="flex items-center gap-4">
               <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg"><Download size={24} /></div>
               <div className="flex-1">
                 <p className="text-sm font-black uppercase leading-tight">INSTALE O APP</p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">EFLIXTV EM TELA CHEIA</p>
               </div>
               <button onClick={() => setShowInstallBanner(false)} className="p-2 text-slate-500"><X size={20}/></button>
             </div>
             <button onClick={handleInstallClick} className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black tracking-widest active:scale-95 transition-all">ADICIONAR À TELA DE INÍCIO</button>
           </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg"><Users size={24} /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase">{PANEL_NAME}</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="DASHBOARD" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={20} />} label="CLIENTES" active={view === 'clients'} onClick={() => setView('clients')} />
          <SidebarItem icon={<PlusCircle size={20} />} label="CADASTRAR" active={view === 'add'} onClick={() => setView('add')} />
          <SidebarItem icon={<BellRing size={20} />} label="AGENDA" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          <SidebarItem icon={<Layers size={20} />} label="PACOTES" active={view === 'packages'} onClick={() => setView('packages')} />
          <SidebarItem icon={<MessageSquare size={20} />} label="MODELOS ZAP" active={view === 'messages'} onClick={() => setView('messages')} />
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 py-4 flex items-center justify-between pt-safe">
          <h2 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-tighter truncate mr-2">
            {view === 'dashboard' && 'VISÃO GERAL'}
            {view === 'clients' && 'GESTAO DE CLIENTES'}
            {view === 'add' && 'NOVO CADASTRO'}
            {view === 'scheduling' && 'PROGRAMAÇÃO'}
            {view === 'packages' && 'PACOTES IPTV'}
            {view === 'messages' && 'MODELOS DE MENSAGENS'}
          </h2>
          <button onClick={handleAnalyze} className="p-2.5 text-blue-600 bg-blue-50/50 hover:bg-blue-100 active:scale-95 rounded-xl transition-all">
            <TrendingUp size={20} className={isAnalyzing ? 'animate-spin' : ''} />
          </button>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-32 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {aiAnalysis && (
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] text-sm relative animate-in fade-in shadow-sm">
                 <button onClick={() => setAiAnalysis(null)} className="absolute top-5 right-5 text-blue-300 hover:text-blue-500"><X size={20}/></button>
                 <h4 className="font-black text-blue-600 uppercase text-[10px] mb-3 flex items-center gap-2"><TrendingUp size={14}/> ANÁLISE IA DO SEU NEGÓCIO</h4>
                 <p className="text-blue-800 whitespace-pre-line leading-relaxed text-sm">{aiAnalysis}</p>
              </div>
            )}

            {view === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="ATIVOS" value={stats.activeCount} icon={<CheckCircle size={20}/>} color="emerald" />
                  <StatCard title="BLOQUEADOS" value={stats.blockedCount} icon={<XCircle size={20}/>} color="slate" />
                  <StatCard title="VENCIDOS" value={stats.expiredCount} icon={<XCircle size={20}/>} color="red" />
                  <StatCard title="TOTAL" value={stats.totalCount} icon={<Users size={20}/>} color="blue" />
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2"><Activity size={16}/> FINANCEIRO DETALHADO</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    <SmallStatCard label="PREVISTA" value={stats.financial.predictedRevenue} color="text-blue-600" />
                    <SmallStatCard label="PENDENTE" value={stats.financial.toReceiveRevenue} color="text-amber-600" />
                    <SmallStatCard label="RECEBIDO" value={stats.financial.paidRevenue} color="text-emerald-600" />
                    <SmallStatCard label="CUSTOS" value={stats.financial.totalExpenses} color="text-red-500" />
                    <SmallStatCard label="LUCRO PREV." value={stats.financial.predictedProfit} color="text-blue-700" bold />
                    <SmallStatCard label="LUCRO REAL" value={stats.financial.realProfit} color="text-emerald-700" bold highlight />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DashboardTable title="VENCENDO LOGO" icon={<Clock size={16}/>} items={clients.sort((a,b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()).slice(0, 5)} />
                  <DashboardTable title="PAGAMENTOS EM ATRASO" icon={<CreditCard size={16}/>} items={clients.filter(c => c.paymentStatus === 'pending').slice(0, 5)} isPayment />
                </div>
              </div>
            )}

            {view === 'clients' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" placeholder="BUSCAR CLIENTE..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} className="px-5 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none cursor-pointer">
                      <option value="asc">MAIS PRÓXIMOS</option>
                      <option value="desc">MAIS DISTANTES</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    <FilterChip active={statusFilter === 'all'} label="TODOS" onClick={() => setStatusFilter('all')} />
                    <FilterChip active={statusFilter === 'active'} label="ATIVOS" onClick={() => setStatusFilter('active')} />
                    <FilterChip active={statusFilter === 'blocked'} label="BLOQUEADOS" onClick={() => setStatusFilter('blocked')} />
                    <FilterChip active={statusFilter === 'pending'} label="PENDENTES" onClick={() => setStatusFilter('pending')} />
                    <FilterChip active={statusFilter === 'expired'} label="VENCIDOS" onClick={() => setStatusFilter('expired')} />
                  </div>
                </div>

                <div className="md:grid grid-cols-2 xl:grid-cols-3 gap-4 hidden">
                   {filteredClients.map(c => <ClientCard key={c.id} client={c} isExpired={isExpired(c.expiresAt)} onRenew={() => setSelectedClientForRenewal(c)} onMsg={() => setSelectedClientForMsg(c)} onDelete={() => deleteClient(c.id)} onTogglePay={() => togglePaymentStatus(c.id)} />)}
                </div>
                <div className="md:hidden space-y-4">
                   {filteredClients.map(c => <ClientCard key={c.id} client={c} isExpired={isExpired(c.expiresAt)} onRenew={() => setSelectedClientForRenewal(c)} onMsg={() => setSelectedClientForMsg(c)} onDelete={() => deleteClient(c.id)} onTogglePay={() => togglePaymentStatus(c.id)} />)}
                </div>
              </div>
            )}

            {view === 'add' && (
              <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-xl max-w-4xl mx-auto">
                <h3 className="text-lg font-black uppercase tracking-tighter mb-8 flex items-center gap-2"><PlusCircle className="text-blue-600"/> NOVO CLIENTE</h3>
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleAddClient(Object.fromEntries(new FormData(e.currentTarget))); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput name="name" label="NOME COMPLETO" required />
                    <FormInput name="phone" label="WHATSAPP (EX: 5585900000000)" type="tel" required />
                    <FormInput name="username" label="USUÁRIO IPTV" required />
                    <FormInput name="password" label="SENHA IPTV" required />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">PACOTE IPTV</label>
                      <select name="packageId" required onChange={(e) => handlePackageChangeInForm(e.target.value)} className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm">
                        <option value="">ESCOLHA UM PACOTE</option>
                        {packages.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <FormInput name="months" label="MESES" type="number" value={selectedPkgInfo.months} onChange={(e: any) => setSelectedPkgInfo({...selectedPkgInfo, months: Number(e.target.value)})} />
                    <FormInput name="expiryDate" label="DATA VENCIMENTO" type="date" required />
                    <FormInput name="expiryTime" label="HORÁRIO" type="time" defaultValue="00:00" required />
                    <FormInput name="price" label="PREÇO VENDA (R$)" type="number" step="0.01" value={selectedPkgInfo.price} onChange={(e: any) => setSelectedPkgInfo({...selectedPkgInfo, price: Number(e.target.value)})} required />
                    <FormInput name="expenses" label="CUSTO PAINEL (R$)" type="number" step="0.01" value={selectedPkgInfo.cost} onChange={(e: any) => setSelectedPkgInfo({...selectedPkgInfo, cost: Number(e.target.value)})} required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl active:scale-95 transition-all">SALVAR CADASTRO</button>
                </form>
              </div>
            )}

            {view === 'scheduling' && (
              <div className="space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase mb-6 flex items-center gap-2"><Clock size={16} className="text-blue-600"/> NOVO AGENDAMENTO DE AVISO</h3>
                  <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     setScheduledMessages([...scheduledMessages, {
                       id: Math.random().toString(36).substr(2, 9),
                       clientId: fd.get('clientId') as string,
                       templateId: fd.get('templateId') as string,
                       startDate: `${fd.get('date')}T${fd.get('time')}:00`,
                       intervalDays: Number(fd.get('interval')) || 0,
                       isActive: true
                     }]);
                     e.currentTarget.reset();
                  }}>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400">CLIENTE</label>
                      <select name="clientId" required className="w-full p-4 border rounded-2xl bg-white outline-none focus:ring-2 font-bold text-xs uppercase">
                        <option value="">SELECIONE...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400">MODELO</label>
                      <select name="templateId" required className="w-full p-4 border rounded-2xl bg-white outline-none focus:ring-2 font-bold text-xs uppercase">
                        <option value="">SELECIONE...</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400">DATA INÍCIO</label>
                      <input name="date" type="date" required className="w-full p-4 border rounded-2xl bg-white outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400">HORA</label>
                      <input name="time" type="time" defaultValue="09:00" required className="w-full p-4 border rounded-2xl bg-white outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400">REPETIR (DIAS)</label>
                      <input name="interval" type="number" defaultValue="0" className="w-full p-4 border rounded-2xl outline-none font-bold text-xs" />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 active:scale-95 transition-all">PROGRAMAR</button>
                  </form>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">CONFIGURAÇÃO</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">FREQUÊNCIA</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scheduledMessages.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="font-black text-slate-800 text-xs uppercase">{clients.find(cl => cl.id === s.clientId)?.name || 'REMOVIDO'}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{templates.find(tl => tl.id === s.templateId)?.title || 'REMOVIDO'}</div>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">{s.intervalDays === 0 ? 'ÚNICO' : `REPETE ${s.intervalDays} DIAS`}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => setScheduledMessages(prev => prev.filter(x => x.id !== s.id))} className="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                            </td>
                          </tr>
                        ))}
                        {scheduledMessages.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-[10px] font-black text-slate-300 uppercase">NENHUM AGENDAMENTO ATIVO</td></tr>}
                      </tbody>
                    </table>
                </div>
              </div>
            )}

            {view === 'packages' && (
              <div className="space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-2xl mx-auto">
                   <h3 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><Layers size={16} className="text-blue-600"/> ADICIONAR NOVO PACOTE</h3>
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
                   }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <FormInput name="name" label="NOME DO PACOTE" placeholder="EX: PREMIUM 4K" required />
                      <FormInput name="months" label="DURAÇÃO (MESES)" type="number" defaultValue="1" required />
                      <FormInput name="price" label="VALOR VENDA (R$)" type="number" step="0.01" required />
                      <FormInput name="cost" label="CUSTO PAINEL (R$)" type="number" step="0.01" required />
                      <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 active:scale-95 transition-all sm:col-span-2">CRIAR PACOTE</button>
                   </form>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group active:scale-[0.98] transition-all">
                      <div>
                        <div className="font-black text-slate-800 uppercase text-sm">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.months} MES(ES) • CUSTO R$ {p.cost.toFixed(2)}</div>
                        <div className="mt-2 text-emerald-600 font-black text-base">R$ {p.price.toFixed(2)}</div>
                      </div>
                      <button onClick={() => setPackages(packages.filter(x => x.id !== p.id))} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'messages' && (
              <div className="space-y-6">
                 <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-2xl mx-auto">
                   <h3 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><MessageSquare size={16} className="text-blue-600"/> CRIAR MODELO DE TEXTO</h3>
                   <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      setTemplates([...templates, {
                        id: Math.random().toString(36).substr(2,9),
                        title: (fd.get('title') as string).toUpperCase(),
                        body: fd.get('body') as string
                      }]);
                      e.currentTarget.reset();
                   }} className="space-y-4">
                      <FormInput name="title" label="TÍTULO DO MODELO" placeholder="EX: AVISO VENCIMENTO" required />
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">TEXTO DA MENSAGEM</label>
                        <textarea name="body" rows={5} className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="USE {{nome}}, {{usuario}}, {{vencimento}}, {{valor}}..."></textarea>
                      </div>
                      <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 active:scale-95 transition-all w-full">SALVAR MODELO</button>
                   </form>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group animate-in zoom-in">
                      <button onClick={() => setTemplates(templates.filter(t => t.id !== tpl.id))} className="absolute top-5 right-5 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                      <h4 className="font-black text-slate-800 text-xs uppercase mb-3 pr-10">{tpl.title}</h4>
                      <div className="bg-slate-50 p-5 rounded-2xl text-[11px] text-slate-500 italic leading-relaxed font-medium">"{tpl.body}"</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Bottom Nav - Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex justify-around py-4 px-2 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pb-safe">
          <BottomNavItem icon={<LayoutDashboard size={24}/>} label="INÍCIO" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<Users size={24}/>} label="CLIENTES" active={view === 'clients'} onClick={() => setView('clients')} />
          <BottomNavItem icon={<PlusCircle size={28}/>} label="NOVO" active={view === 'add'} onClick={() => setView('add')} isFab />
          <BottomNavItem icon={<BellRing size={24}/>} label="AGENDA" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          <div className="relative" ref={mobileMenuRef}>
             <BottomNavItem icon={<MoreHorizontal size={24}/>} label="MAIS" active={view === 'packages' || view === 'messages'} onClick={() => setShowMobileMenu(!showMobileMenu)} />
             {showMobileMenu && (
               <div className="absolute bottom-24 right-4 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-3 w-56 flex flex-col gap-2 z-50 animate-in slide-in-from-bottom-8">
                 <button onClick={() => { setView('packages'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-4 text-[10px] font-black text-white hover:bg-white/10 rounded-2xl transition-all uppercase tracking-widest"><Layers size={18} className="text-blue-500"/> PACOTES IPTV</button>
                 <button onClick={() => { setView('messages'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-4 text-[10px] font-black text-white hover:bg-white/10 rounded-2xl transition-all uppercase tracking-widest"><MessageSquare size={18} className="text-emerald-500"/> MODELOS ZAP</button>
               </div>
             )}
          </div>
        </nav>
      </div>

      {/* Modals */}
      {selectedClientForRenewal && (
        <RenewalModal client={selectedClientForRenewal} packages={packages} onRenew={handleRenewClient} onClose={() => setSelectedClientForRenewal(null)} />
      )}
      {selectedClientForMsg && (
        <MessageModal client={selectedClientForMsg} templates={templates} onSend={sendWhatsApp} onClose={() => setSelectedClientForMsg(null)} />
      )}
    </div>
  );
}

// Components
function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
      {icon}
      <span className="font-black text-[11px] tracking-widest">{label}</span>
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick, isFab = false }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-90 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      <div className={`p-2.5 rounded-2xl ${isFab ? 'bg-blue-600 text-white shadow-xl -mt-12 w-16 h-16 flex items-center justify-center border-[6px] border-slate-50' : (active ? 'bg-blue-50' : '')}`}>
        {icon}
      </div>
      {!isFab && <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap: any = { emerald: 'bg-emerald-50 text-emerald-600', slate: 'bg-slate-50 text-slate-400', red: 'bg-red-50 text-red-500', blue: 'bg-blue-50 text-blue-500' };
  return (
    <div className="bg-white p-5 md:p-7 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
      <div className={`w-12 h-12 flex items-center justify-center rounded-2xl mb-4 ${colorMap[color]}`}>{icon}</div>
      <div className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter leading-none">{value}</div>
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{title}</div>
    </div>
  );
}

function SmallStatCard({ label, value, color, bold = false, highlight = false }: any) {
  return (
    <div className={`p-4 rounded-[1.5rem] border transition-all ${highlight ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="text-[8px] font-black uppercase text-slate-400 mb-1.5 tracking-widest leading-none">{label}</div>
      <div className={`text-xs md:text-sm ${bold ? 'font-black' : 'font-bold'} ${color} tracking-tight truncate`}>
        R$ {value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
      </div>
    </div>
  );
}

function ClientCard({ client, isExpired, onRenew, onMsg, onDelete, onTogglePay }: any) {
  return (
    <div className={`bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-5 animate-in fade-in transition-all active:scale-[0.98] ${isExpired && client.status === 'active' ? 'border-red-200 ring-4 ring-red-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <div className="font-black text-slate-800 text-base uppercase leading-tight truncate">{client.name}</div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 truncate">{client.packageName}</div>
        </div>
        <StatusBadge status={client.status} expired={isExpired} />
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-50 py-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">ACESSO</span>
          <span className="font-black text-slate-700 block truncate">{client.username}</span>
          <span className="text-slate-400 text-[10px] font-bold mt-0.5">{client.password || '******'}</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">VENCIMENTO</span>
          <span className={`font-black text-base leading-none ${isExpired && client.status === 'active' ? 'text-red-500' : 'text-slate-800'}`}>{new Date(client.expiresAt).toLocaleDateString('pt-BR')}</span>
          <span className="block text-[9px] text-slate-400 font-black mt-1 uppercase">{new Date(client.expiresAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={onTogglePay} className={`px-5 py-3 rounded-2xl text-[9px] font-black tracking-widest border active:scale-95 ${client.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {client.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}
        </button>
        <div className="flex gap-2">
          <button onClick={onRenew} className="p-3.5 text-blue-600 bg-blue-50 rounded-2xl active:scale-90"><RefreshCw size={18} /></button>
          <button onClick={onMsg} className="p-3.5 text-emerald-600 bg-emerald-50 rounded-2xl active:scale-90"><MessageSquare size={18} /></button>
          <button onClick={onDelete} className="p-3.5 text-red-400 bg-red-50 rounded-2xl active:scale-90"><Trash2 size={18} /></button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, expired }: any) {
  if (status === 'blocked') return <span className="px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">BLOQUEADO</span>;
  if (status === 'pending') return <span className="px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">PENDENTE</span>;
  if (expired) return <span className="px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-red-100 text-red-600">VENCIDO</span>;
  return <span className="px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-600">ATIVO</span>;
}

function DashboardTable({ title, icon, items, isPayment = false }: any) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full">
      <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-6 uppercase tracking-tight">{icon}{title}</h3>
      <div className="space-y-4">
        {items.length === 0 ? <div className="py-10 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">TUDO EM DIA</div> : items.map(c => (
            <div key={c.id} className="flex justify-between items-center p-4 rounded-3xl border border-slate-50 hover:bg-slate-50 transition-all">
              <div className="text-xs font-black text-slate-700 truncate uppercase pr-4">{c.name}</div>
              <div className="text-right shrink-0">
                {isPayment ? <div className="text-xs font-black text-amber-600">R$ {c.price.toFixed(2)}</div> : <div className="text-[10px] font-black text-slate-500">{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</div>}
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
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">{icon}{label}</label>
      <input name={name} type={type} className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-bold transition-all" {...rest} />
    </div>
  );
}

function FilterChip({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-6 py-3 rounded-full text-[10px] font-black transition-all whitespace-nowrap active:scale-95 tracking-widest uppercase ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>{label}</button>
  );
}

function RenewalModal({ client, packages, onRenew, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
          <h3 className="text-xl font-black uppercase tracking-tighter">RENOVAR PLANO</h3>
          <button onClick={onClose} className="p-3 bg-blue-700/50 rounded-full active:scale-90"><X size={24}/></button>
        </div>
        <div className="p-6 md:p-8 space-y-4 max-h-[70vh] overflow-y-auto">
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => onRenew(client.id, pkg.id)} className="w-full text-left p-6 rounded-[2rem] border-2 border-slate-50 hover:border-blue-300 hover:bg-blue-50 flex items-center justify-between active:scale-[0.98] transition-all">
              <div>
                <div className="font-black text-slate-800 text-base uppercase leading-tight">{pkg.name}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">R$ {pkg.price.toFixed(2)} • {pkg.months} MÊS(ES)</div>
              </div>
              <div className="bg-slate-100 p-2 rounded-xl"><ChevronRight size={18} className="text-slate-400" /></div>
            </button>
          ))}
          {packages.length === 0 && <div className="text-center p-10 text-[10px] font-black text-slate-300 uppercase">NENHUM PACOTE DISPONÍVEL</div>}
        </div>
      </div>
    </div>
  );
}

function MessageModal({ client, templates, onSend, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="bg-emerald-600 p-8 text-white flex justify-between items-center">
          <h3 className="text-xl font-black uppercase tracking-tighter">ENVIAR ZAP</h3>
          <button onClick={onClose} className="p-3 bg-emerald-700/50 rounded-full active:scale-90"><X size={24}/></button>
        </div>
        <div className="p-6 md:p-8 space-y-4 max-h-[75vh] overflow-y-auto">
          {templates.map((tpl: any) => (
            <button key={tpl.id} onClick={() => onSend(tpl, client)} className="w-full text-left p-6 rounded-[2rem] border-2 border-slate-50 hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98] transition-all flex justify-between items-center">
              <div className="font-black text-slate-700 text-xs tracking-widest uppercase">{tpl.title}</div>
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><Send size={18} /></div>
            </button>
          ))}
          {templates.length === 0 && <div className="text-center p-10 text-[10px] font-black text-slate-300 uppercase">NENHUM MODELO DISPONÍVEL</div>}
        </div>
      </div>
    </div>
  );
}
