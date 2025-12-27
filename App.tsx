
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
  Download,
  Info,
  Tag
} from 'lucide-react';
import { Client, ClientStatus, Package, MessageTemplate, ScheduledMessage, PaymentStatus } from './types';
import { geminiService } from './services/geminiService';

const PANEL_NAME = "EFLIXTV";

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
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPkgInfo, setSelectedPkgInfo] = useState({ price: 0, cost: 0, months: 1 });

  useEffect(() => {
    localStorage.setItem('iptv_clients', JSON.stringify(clients));
    localStorage.setItem('iptv_packages', JSON.stringify(packages));
    localStorage.setItem('iptv_templates', JSON.stringify(templates));
    localStorage.setItem('iptv_schedules', JSON.stringify(scheduledMessages));
  }, [clients, packages, templates, scheduledMessages]);

  const isExpired = (expiryStr: string) => new Date(expiryStr) < new Date();

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
      expiredCount: clients.filter(c => isExpired(c.expiresAt) && c.status === 'active').length,
      pendingPayCount: clients.filter(c => c.paymentStatus === 'pending').length,
      totalCount: clients.length,
      financial: {
        ...financial,
        realProfit: financial.paidRevenue - financial.totalExpenses,
        predictedProfit: financial.predictedRevenue - financial.totalExpenses
      }
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.username.toLowerCase().includes(searchTerm.toLowerCase());
        
        const expired = isExpired(c.expiresAt);
        let matchesStatus = statusFilter === 'all';
        if (statusFilter === 'active') matchesStatus = c.status === 'active' && !expired;
        else if (statusFilter === 'expired') matchesStatus = c.status === 'active' && expired;
        else if (statusFilter === 'blocked') matchesStatus = c.status === 'blocked';

        let matchesPayment = paymentFilter === 'all' || c.paymentStatus === paymentFilter;

        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
  }, [clients, searchTerm, statusFilter, paymentFilter]);

  const togglePaymentStatus = (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { 
      ...c, 
      paymentStatus: c.paymentStatus === 'paid' ? 'pending' : 'paid', 
      lastPaymentDate: c.paymentStatus !== 'paid' ? new Date().toISOString() : c.lastPaymentDate 
    } : c));
  };

  const deleteClient = (id: string) => {
    if (window.confirm('Excluir este cliente permanentemente?')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
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
    const expiresAt = new Date(`${formValues.expiryDate}T${formValues.expiryTime || '00:00'}:00`).toISOString();
    
    const client: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: formValues.name,
      username: formValues.username,
      password: formValues.password,
      status: 'active',
      paymentStatus: (formValues.paymentStatus as PaymentStatus) || 'pending',
      phone: formValues.phone,
      packageName: selectedPkg?.name || 'Personalizado',
      packageId: formValues.packageId,
      months: Number(formValues.months) || 1,
      price: Number(formValues.price) || 0,
      discount: 0,
      expenses: Number(formValues.expenses) || 0,
      notes: formValues.notes || '',
      appName: formValues.appName || '',
      macKey: formValues.macKey || '',
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
      .replace(/{{senha}}/g, client.password || '***')
      .replace(/{{pacote}}/g, client.packageName)
      .replace(/{{vencimento}}/g, new Date(client.expiresAt).toLocaleDateString('pt-BR'))
      .replace(/{{valor}}/g, client.price.toFixed(2));
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
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
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden text-slate-700 font-['Inter'] select-none">
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-10 flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg"><Users size={28} /></div>
          <h1 className="text-2xl font-bold uppercase">{PANEL_NAME}</h1>
        </div>
        <nav className="flex-1 px-6 space-y-1 overflow-y-auto">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="DASHBOARD" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<Users size={20} />} label="CLIENTES" active={view === 'clients'} onClick={() => setView('clients')} />
          <SidebarItem icon={<PlusCircle size={20} />} label="CADASTRAR" active={view === 'add'} onClick={() => setView('add')} />
          <SidebarItem icon={<BellRing size={20} />} label="AGENDA" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          <SidebarItem icon={<Layers size={20} />} label="PACOTES" active={view === 'packages'} onClick={() => setView('packages')} />
          <SidebarItem icon={<MessageSquare size={20} />} label="MENSAGENS" active={view === 'messages'} onClick={() => setView('messages')} />
        </nav>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-6 flex items-center justify-between pt-safe">
          <h2 className="text-xl font-bold uppercase text-slate-800">
            {view === 'dashboard' && 'Visão Geral'}
            {view === 'clients' && 'Gestão de Clientes'}
            {view === 'add' && 'Novo Cadastro'}
            {view === 'scheduling' && 'Programação'}
            {view === 'packages' && 'Pacotes IPTV'}
            {view === 'messages' && 'Modelos de Texto'}
          </h2>
          <button onClick={handleAnalyze} className="p-3 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            <TrendingUp size={24} className={isAnalyzing ? 'animate-spin' : ''} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-32 p-6 md:p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {aiAnalysis && (
              <div className="p-8 bg-blue-50 border border-blue-100 rounded-xl shadow-sm relative animate-in fade-in">
                 <button onClick={() => setAiAnalysis(null)} className="absolute top-4 right-4 text-blue-400 hover:text-blue-600"><X size={24}/></button>
                 <h4 className="font-bold text-blue-600 text-sm mb-2 uppercase">Insights da IA</h4>
                 <p className="text-blue-900 text-lg leading-relaxed">{aiAnalysis}</p>
              </div>
            )}

            {view === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="ATIVOS" value={stats.activeCount} icon={<CheckCircle size={24}/>} color="emerald" />
                  <StatCard title="VENCIDOS" value={stats.expiredCount} icon={<XCircle size={24}/>} color="red" />
                  <StatCard title="PENDENTES" value={stats.pendingPayCount} icon={<CreditCard size={24}/>} color="amber" />
                  <StatCard title="TOTAL" value={stats.totalCount} icon={<Users size={24}/>} color="blue" />
                </div>

                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-3">
                      <Activity size={20} className="text-blue-600"/> Resumo Financeiro
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SmallStatCard label="Receita prevista" value={stats.financial.predictedRevenue} color="text-blue-600" />
                    <SmallStatCard label="Recebido hoje" value={stats.financial.paidRevenue} color="text-emerald-600" />
                    <SmallStatCard label="Custo painel" value={stats.financial.totalExpenses} color="text-red-500" />
                    <SmallStatCard label="Lucro real" value={stats.financial.realProfit} color="text-emerald-800" bold highlight />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <DashboardTable title="Próximos Vencimentos" icon={<Clock size={20}/>} items={clients.sort((a,b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()).slice(0, 5)} />
                  <DashboardTable title="Pendências de Pagamento" icon={<DollarSign size={20}/>} items={clients.filter(c => c.paymentStatus === 'pending').slice(0, 5)} isPayment />
                </div>
              </div>
            )}

            {view === 'clients' && (
              <div className="space-y-8">
                <div className="flex flex-col gap-6">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                    <input type="text" placeholder="Buscar por nome, usuário..." className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 text-lg font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar">
                      <FilterChip active={statusFilter === 'all'} label="TODOS" onClick={() => setStatusFilter('all')} />
                      <FilterChip active={statusFilter === 'active'} label="ATIVOS" onClick={() => setStatusFilter('active')} />
                      <FilterChip active={statusFilter === 'expired'} label="VENCIDOS" onClick={() => setStatusFilter('expired')} />
                      <FilterChip active={statusFilter === 'blocked'} label="BLOQUEADOS" onClick={() => setStatusFilter('blocked')} />
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar">
                      <FilterChip active={paymentFilter === 'all'} label="PAGAMENTO: TODOS" onClick={() => setPaymentFilter('all')} />
                      <FilterChip active={paymentFilter === 'paid'} label="PAGOS" onClick={() => setPaymentFilter('paid')} />
                      <FilterChip active={paymentFilter === 'pending'} label="PENDENTES" onClick={() => setPaymentFilter('pending')} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredClients.map(c => <ClientCard key={c.id} client={c} isExpired={isExpired(c.expiresAt)} onRenew={() => setSelectedClientForRenewal(c)} onMsg={() => setSelectedClientForMsg(c)} onDelete={() => deleteClient(c.id)} onTogglePay={() => togglePaymentStatus(c.id)} />)}
                   {filteredClients.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-bold uppercase text-lg">Nenhum cliente encontrado</div>}
                </div>
              </div>
            )}

            {view === 'add' && (
              <div className="bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-xl max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold uppercase mb-10 flex items-center gap-3 text-blue-600"><PlusCircle size={28}/> Novo Cliente</h3>
                <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleAddClient(Object.fromEntries(new FormData(e.currentTarget))); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormInput name="name" label="Nome Completo" required />
                    <FormInput name="phone" label="WhatsApp" type="tel" placeholder="5585..." required />
                    <FormInput name="username" label="Usuário IPTV" required />
                    <FormInput name="password" label="Senha IPTV" required />
                    
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-400 uppercase ml-1">Plano Escolhido</label>
                      <select name="packageId" required onChange={(e) => {
                        const pkg = packages.find(p => p.id === e.target.value);
                        if (pkg) setSelectedPkgInfo({ price: pkg.price, cost: pkg.cost, months: pkg.months });
                      }} className="w-full px-6 py-4 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-base">
                        <option value="">Selecione o plano...</option>
                        {packages.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <FormInput name="expiryDate" label="Data de Vencimento" type="date" required />
                    <FormInput name="expiryTime" label="Hora de Vencimento" type="time" defaultValue="00:00" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput name="price" label="Valor Venda (R$)" type="number" step="0.01" value={selectedPkgInfo.price} onChange={(e:any) => setSelectedPkgInfo({...selectedPkgInfo, price: Number(e.target.value)})} required />
                      <FormInput name="expenses" label="Custo (R$)" type="number" step="0.01" value={selectedPkgInfo.cost} onChange={(e:any) => setSelectedPkgInfo({...selectedPkgInfo, cost: Number(e.target.value)})} required />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormInput name="macKey" label="MAC Address / Key" placeholder="00:11:22:33:44:55" />
                      <FormInput name="appName" label="Nome do Aplicativo" placeholder="Ex: XCIPTV, Smarters..." />
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <label className="text-sm font-bold text-slate-400 uppercase ml-1">Observações / Notas</label>
                      <textarea name="notes" rows={3} className="w-full px-6 py-4 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-4 focus:ring-blue-500/10 text-base font-medium" placeholder="Informações adicionais sobre o cliente..."></textarea>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
                      <input type="checkbox" name="paymentStatus" value="paid" id="paidCheck" className="w-5 h-5 accent-emerald-600" />
                      <label htmlFor="paidCheck" className="text-sm font-bold uppercase cursor-pointer">Já pago?</label>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-xl font-bold uppercase hover:bg-blue-700 shadow-xl active:scale-95 transition-all text-base">Salvar Cadastro</button>
                </form>
              </div>
            )}

            {view === 'scheduling' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
                   <h3 className="text-xl font-bold uppercase text-slate-800 mb-8 flex items-center gap-3"><BellRing size={24} className="text-blue-600"/> Agendar Aviso Automático</h3>
                   <form className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end" onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      setScheduledMessages([...scheduledMessages, {
                        id: Math.random().toString(36).substr(2, 9),
                        clientId: fd.get('clientId') as string,
                        templateId: fd.get('templateId') as string,
                        startDate: `${fd.get('date')}T${fd.get('time') || '09:00'}:00`,
                        intervalDays: Number(fd.get('interval')) || 0,
                        isActive: true
                      }]);
                      e.currentTarget.reset();
                   }}>
                      <FormInput name="clientId" label="Selecione o Cliente" type="select" options={clients} />
                      <FormInput name="templateId" label="Modelo de Mensagem" type="select" options={templates} />
                      <FormInput name="date" label="Data de Início" type="date" required />
                      <button type="submit" className="bg-blue-600 text-white p-5 rounded-xl font-bold uppercase text-sm hover:bg-blue-700 active:scale-95 transition-all">Confirmar Agendamento</button>
                   </form>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-8 border-b bg-slate-50">
                        <h4 className="text-xs font-bold uppercase text-slate-400">Mensagens Programadas Ativas</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {scheduledMessages.map(s => (
                        <div key={s.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-lg">{clients.find(c => c.id === s.clientId)?.name || 'Cliente Removido'}</span>
                            <span className="text-sm text-slate-400">{new Date(s.startDate).toLocaleDateString('pt-BR')} às {new Date(s.startDate).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                          <button onClick={() => setScheduledMessages(prev => prev.filter(x => x.id !== s.id))} className="text-red-400 p-4 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={24}/></button>
                        </div>
                      ))}
                      {scheduledMessages.length === 0 && <div className="p-14 text-center text-slate-300 font-bold uppercase text-base">Nenhum aviso programado</div>}
                    </div>
                </div>
              </div>
            )}

            {view === 'packages' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
                   <h3 className="text-xl font-bold uppercase text-slate-400 mb-8 flex items-center gap-3"><Layers size={24} className="text-blue-600"/> Gestão de Pacotes</h3>
                   <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      setPackages([...packages, {
                        id: Math.random().toString(36).substr(2,9),
                        name: (fd.get('name') as string),
                        price: Number(fd.get('price')),
                        cost: Number(fd.get('cost')),
                        months: Number(fd.get('months')) || 1
                      }]);
                      e.currentTarget.reset();
                   }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormInput name="name" label="Nome do Plano" placeholder="Ex: Premium 4K" required />
                      <FormInput name="months" label="Meses de Acesso" type="number" defaultValue="1" required />
                      <FormInput name="price" label="Preço de Venda (R$)" type="number" step="0.01" required />
                      <FormInput name="cost" label="Custo Painel (R$)" type="number" step="0.01" required />
                      <button type="submit" className="bg-blue-600 text-white p-5 rounded-xl font-bold uppercase text-sm sm:col-span-2 shadow-lg">Cadastrar Novo Pacote</button>
                   </form>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.map(p => (
                    <div key={p.id} className="bg-white p-8 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xl">{p.name}</span>
                        <span className="text-emerald-600 font-bold text-lg">R$ {p.price.toFixed(2)}</span>
                        <span className="text-xs text-slate-400 uppercase font-bold mt-1">{p.months} Meses</span>
                      </div>
                      <button onClick={() => setPackages(packages.filter(x => x.id !== p.id))} className="p-4 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={24}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'messages' && (
              <div className="space-y-8">
                 <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
                   <h3 className="text-xl font-bold uppercase text-slate-400 mb-8 flex items-center gap-3"><MessageSquare size={24} className="text-blue-600"/> Modelos de WhatsApp</h3>
                   <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      setTemplates([...templates, {
                        id: Math.random().toString(36).substr(2,9),
                        title: (fd.get('title') as string).toUpperCase(),
                        body: fd.get('body') as string
                      }]);
                      e.currentTarget.reset();
                   }} className="space-y-6">
                      <FormInput name="title" label="Título do Modelo" placeholder="Ex: Cobrança Amigável" required />
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Corpo da Mensagem</label>
                        <textarea name="body" rows={5} className="w-full px-6 py-4 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-4 focus:ring-blue-500/10 text-base font-medium" placeholder="Olá {{nome}}, seu plano IPTV vence em {{vencimento}}..."></textarea>
                      </div>
                      <button type="submit" className="bg-blue-600 text-white p-5 rounded-xl font-bold uppercase text-sm w-full shadow-lg">Salvar Modelo</button>
                   </form>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative group">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-slate-800 text-base uppercase">{tpl.title}</h4>
                        <button onClick={() => setTemplates(templates.filter(t => t.id !== tpl.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={22}/></button>
                      </div>
                      <p className="text-sm text-slate-500 font-medium italic bg-slate-50 p-6 rounded-xl leading-relaxed">"{tpl.body}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Mobile Navigation - 5 items perfectly aligned */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center py-4 px-2 z-40 pb-safe shadow-lg">
          <BottomNavItem icon={<LayoutDashboard size={24}/>} label="Início" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<Users size={24}/>} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <BottomNavItem icon={<PlusCircle size={24}/>} label="Novo" active={view === 'add'} onClick={() => setView('add')} />
          <BottomNavItem icon={<BellRing size={24}/>} label="Agenda" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          <div className="relative" ref={mobileMenuRef}>
             <BottomNavItem icon={<MoreHorizontal size={24}/>} label="Mais" active={view === 'packages' || view === 'messages'} onClick={() => setShowMobileMenu(!showMobileMenu)} />
             {showMobileMenu && (
               <div className="absolute bottom-20 right-0 bg-slate-900 rounded-xl shadow-2xl p-4 w-60 flex flex-col gap-2 z-50 animate-in slide-in-from-bottom-4">
                 <button onClick={() => { setView('packages'); setShowMobileMenu(false); }} className="flex items-center gap-4 p-4 text-xs font-bold text-white hover:bg-white/10 rounded-xl uppercase"><Layers size={20} className="text-blue-500"/> Planos de IPTV</button>
                 <button onClick={() => { setView('messages'); setShowMobileMenu(false); }} className="flex items-center gap-4 p-4 text-xs font-bold text-white hover:bg-white/10 rounded-xl uppercase"><MessageSquare size={20} className="text-emerald-500"/> Modelos Zap</button>
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
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-8 py-5 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon}
      <span className="font-bold text-sm uppercase">{label}</span>
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      <div className={`p-2 rounded-xl ${active ? 'bg-blue-50' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap: any = { 
    emerald: 'bg-emerald-50 text-emerald-600', 
    red: 'bg-red-50 text-red-500', 
    blue: 'bg-blue-50 text-blue-500', 
    amber: 'bg-amber-50 text-amber-600' 
  };
  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
      <div className={`w-14 h-14 flex items-center justify-center rounded-xl mb-5 ${colorMap[color]}`}>{icon}</div>
      <div className="text-4xl font-bold text-slate-800 leading-none">{value}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase mt-4 tracking-wider">{title}</div>
    </div>
  );
}

function SmallStatCard({ label, value, color, bold = false, highlight = false }: any) {
  return (
    <div className={`p-6 rounded-xl border transition-all ${highlight ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="text-[10px] font-bold uppercase text-slate-400 mb-2 leading-none">{label}</div>
      <div className={`text-lg ${bold ? 'font-bold' : 'font-medium'} ${color} truncate`}>
        R$ {value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
      </div>
    </div>
  );
}

function ClientCard({ client, isExpired, onRenew, onMsg, onDelete, onTogglePay }: any) {
  return (
    <div className={`bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 transition-all ${isExpired && client.status === 'active' ? 'border-red-200 ring-4 ring-red-50' : 'hover:border-slate-300'}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <div className="font-bold text-slate-800 text-xl leading-tight truncate">{client.name}</div>
          <div className="text-xs text-slate-400 font-bold uppercase mt-2 truncate">{client.packageName}</div>
        </div>
        <StatusBadge status={client.status} expired={isExpired} />
      </div>
      
      <div className="grid grid-cols-2 gap-6 text-sm border-y border-slate-50 py-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Acesso</span>
          <span className="font-bold text-slate-700 truncate text-base">{client.username}</span>
          <span className="text-slate-400 text-xs font-medium">{client.password || '******'}</span>
        </div>
        <div className="text-right flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Vencimento</span>
          <span className={`font-bold text-lg ${isExpired && client.status === 'active' ? 'text-red-500' : 'text-slate-800'}`}>
            {new Date(client.expiresAt).toLocaleDateString('pt-BR')}
          </span>
          <span className="text-[10px] text-slate-400 font-bold">{new Date(client.expiresAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
      </div>

      {(client.macKey || client.appName) && (
        <div className="p-4 bg-slate-50 rounded-xl flex flex-col gap-1">
          {client.macKey && <div className="text-[10px] flex items-center gap-2"><Tag size={12} className="text-blue-500"/> <span className="font-bold">MAC:</span> {client.macKey}</div>}
          {client.appName && <div className="text-[10px] flex items-center gap-2"><Smartphone size={12} className="text-blue-500"/> <span className="font-bold">APP:</span> {client.appName}</div>}
        </div>
      )}

      {client.notes && (
        <div className="text-[10px] text-slate-500 italic flex gap-2"><Info size={14} className="shrink-0"/> <span>{client.notes}</span></div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button onClick={onTogglePay} className={`px-5 py-3 rounded-xl text-[10px] font-bold uppercase border transition-all active:scale-95 ${client.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {client.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}
        </button>
        <div className="flex gap-2">
          <button onClick={onRenew} title="Renovar" className="p-4 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"><RefreshCw size={20} /></button>
          <button onClick={onMsg} title="Enviar WhatsApp" className="p-4 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"><MessageSquare size={20} /></button>
          <button onClick={onDelete} title="Excluir" className="p-4 text-red-400 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={20} /></button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, expired }: any) {
  if (status === 'blocked') return <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500">Bloqueado</span>;
  if (expired) return <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-600">Vencido</span>;
  return <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-600">Ativo</span>;
}

function DashboardTable({ title, icon, items, isPayment = false }: any) {
  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-3 mb-8 uppercase">{icon}{title}</h3>
      <div className="space-y-4">
        {items.length === 0 ? <div className="py-10 text-center text-slate-300 font-bold uppercase text-sm">Sem pendências no momento</div> : items.map(c => (
            <div key={c.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
              <span className="text-lg font-bold text-slate-700 truncate pr-4">{c.name}</span>
              <div className="text-right shrink-0">
                {isPayment ? <span className="text-lg font-bold text-amber-600">R$ {c.price.toFixed(2)}</span> : <span className="text-sm font-bold text-slate-400">{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</span>}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function FormInput({ label, name, type = "text", options, ...rest }: any) {
  if (type === 'select') {
    return (
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">{label}</label>
        <select name={name} className="w-full px-6 py-4 border border-slate-200 rounded-xl bg-slate-50 font-bold text-base outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase">
          <option value="">Selecione...</option>
          {options?.map((opt: any) => <option key={opt.id} value={opt.id}>{opt.name || opt.title}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-slate-400 uppercase ml-1">{label}</label>
      <input name={name} type={type} className="w-full px-6 py-4 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-4 focus:ring-blue-500/10 text-base font-bold transition-all" {...rest} />
    </div>
  );
}

function FilterChip({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 uppercase ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>{label}</button>
  );
}

function RenewalModal({ client, packages, onRenew, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-10 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold uppercase">Renovação de Plano</h3>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={24}/></button>
        </div>
        <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => onRenew(client.id, pkg.id)} className="w-full text-left p-6 rounded-xl border-2 border-slate-100 hover:border-blue-300 hover:bg-blue-50 flex items-center justify-between active:scale-[0.98] transition-all group">
              <div>
                <div className="font-bold text-slate-800 text-lg mb-1">{pkg.name}</div>
                <div className="text-sm text-slate-500 font-bold uppercase">R$ {pkg.price.toFixed(2)} • {pkg.months} Mês(es)</div>
              </div>
              <ChevronRight size={24} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageModal({ client, templates, onSend, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-emerald-600 p-10 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold uppercase">Enviar WhatsApp</h3>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={24}/></button>
        </div>
        <div className="p-8 space-y-4 max-h-[75vh] overflow-y-auto">
          {templates.map((tpl: any) => (
            <button key={tpl.id} onClick={() => onSend(tpl, client)} className="w-full text-left p-6 rounded-xl border-2 border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 flex justify-between items-center group active:scale-[0.98] transition-all">
              <span className="font-bold text-slate-700 text-base uppercase">{tpl.title}</span>
              <Send size={24} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Smartphone(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
  );
}
