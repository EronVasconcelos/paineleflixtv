
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
  Calendar
} from 'lucide-react';
import { Client, ClientStatus, Package, MessageTemplate, MessageRule, PaymentStatus, PaymentRecord } from './types';
import { geminiService } from './services/geminiService';

const PANEL_NAME = "EFLIXTV";
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function App() {
  const [view, setView] = useState<'dashboard' | 'clients' | 'history' | 'add' | 'packages' | 'messages' | 'scheduling'>('dashboard');
  const [selectedClientForMsg, setSelectedClientForMsg] = useState<Client | null>(null);
  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState<Client | null>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Filtros e Ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'blocked'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Cliente Fictício
  const mockClient: Client = {
    id: 'mock-client-1',
    name: 'João Silva (Exemplo)',
    username: 'joaosilva_premium',
    password: '888',
    status: 'active',
    paymentStatus: 'paid',
    phone: '5585999999999',
    packageName: 'COMPLETO 4K',
    packageId: 'p2',
    price: 35.00,
    expenses: 12.00,
    notes: 'Cliente fiel desde 2023. Prefere canais de filmes e séries.',
    appName: 'IPTV Smarters Pro',
    macKey: '00:1A:3F:44:BC:11',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    paymentHistory: [{ 
      id: 'h1', amount: 35, date: new Date().toISOString(), monthsPaid: 1, method: 'PIX' 
    }],
    totalPaid: 35.00
  };

  // States
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('iptv_clients_v4');
    const parsed = saved ? JSON.parse(saved) : [];
    if (parsed.length === 0) return [mockClient];
    return parsed;
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
      { id: 't1', title: 'BOAS-VINDAS', body: 'Olá {{nome}}! Seus dados: User: {{usuario}} / Pass: {{senha}}' },
      { id: 't2', title: 'COBRANÇA', body: 'Olá {{nome}}, seu plano IPTV vence em {{vencimento}}. Valor R$ {{valor}}.' }
    ];
  });

  const [rules, setRules] = useState<MessageRule[]>(() => {
    const saved = localStorage.getItem('iptv_rules_v4');
    return saved ? JSON.parse(saved) : [
      { id: 'r1', type: 'before', days: 3, time: '09:00', templateId: 't2', isActive: true },
      { id: 'r2', type: 'on_day', days: 0, time: '10:00', templateId: 't2', isActive: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem('iptv_clients_v4', JSON.stringify(clients));
    localStorage.setItem('iptv_packages_v4', JSON.stringify(packages));
    localStorage.setItem('iptv_templates_v4', JSON.stringify(templates));
    localStorage.setItem('iptv_rules_v4', JSON.stringify(rules));
  }, [clients, packages, templates, rules]);

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
    <div className="flex flex-col md:flex-row h-screen bg-white overflow-hidden text-slate-800 font-normal">
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><Activity size={24} /></div>
          <h1 className="text-xl font-bold uppercase tracking-tight">{PANEL_NAME}</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={<History size={18} />} label="Histórico" active={view === 'history'} onClick={() => setView('history')} />
          <SidebarItem icon={<Users size={18} />} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <SidebarItem icon={<CalendarDays size={18} />} label="Agenda" active={view === 'scheduling'} onClick={() => setView('scheduling')} />
          <SidebarItem icon={<PlusCircle size={18} />} label="Cadastrar" active={view === 'add'} onClick={() => setView('add')} />
          <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Apoio</div>
          <SidebarItem icon={<Layers size={18} />} label="Planos" active={view === 'packages'} onClick={() => setView('packages')} />
          <SidebarItem icon={<MessageSquare size={18} />} label="Modelos Zap" active={view === 'messages'} onClick={() => setView('messages')} />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between pt-safe shrink-0">
          <h2 className="text-lg font-bold text-slate-900 uppercase">
            {view === 'dashboard' && 'Resumo Financeiro'}
            {view === 'history' && 'Matriz de Clientes'}
            {view === 'clients' && 'Lista de Clientes'}
            {view === 'scheduling' && 'Agenda de Envios'}
            {view === 'add' && 'Cadastro'}
          </h2>
          <button onClick={() => geminiService.analyzeBusiness(clients).then(setAiAnalysis)} className="p-2 text-blue-600 bg-blue-50 rounded-xl">
            <TrendingUp size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-32 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {aiAnalysis && (
              <div className="p-6 bg-blue-600 text-white rounded-2xl relative shadow-xl">
                <button onClick={() => setAiAnalysis(null)} className="absolute top-4 right-4 text-white/50"><X size={20}/></button>
                <h4 className="font-bold text-xs mb-1 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Gestor IA:</h4>
                <p className="text-sm leading-relaxed font-medium">{aiAnalysis}</p>
              </div>
            )}

            {view === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Ativos" value={stats.activeCount} icon={<CheckCircle size={20}/>} color="emerald" />
                  <StatCard title="Pendentes" value={stats.pendingPaymentCount} icon={<AlertCircle size={20}/>} color="amber" />
                  <StatCard title="Vencidos" value={stats.expiredCount} icon={<Clock size={20}/>} color="red" />
                  <StatCard title="Bloqueados" value={stats.blockedCount} icon={<UserX size={20}/>} color="slate" />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Receita/Mês" value={`R$ ${stats.monthlyRevenue.toFixed(2)}`} icon={<DollarSign size={20}/>} color="blue" />
                  <StatCard title="Custo/Mês" value={`R$ ${stats.monthlyCosts.toFixed(2)}`} icon={<Layers size={20}/>} color="red" />
                  <StatCard title="Lucro Bruto" value={`R$ ${(stats.monthlyRevenue - stats.monthlyCosts).toFixed(2)}`} icon={<TrendingUp size={20}/>} color="emerald" />
                  <StatCard title="LTV Geral" value={`R$ ${stats.totalLTV.toFixed(2)}`} icon={<Activity size={20}/>} color="blue" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="text-sm font-bold uppercase flex items-center gap-2"><CreditCard size={18} className="text-amber-500"/> Cobrança Rápida</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {clients.filter(c => c.paymentStatus === 'pending' || isExpired(c.expiresAt)).slice(0, 6).map(c => (
                        <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-800">{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">R$ {c.price.toFixed(2)} • Expira: {new Date(c.expiresAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <button onClick={() => sendWhatsApp(`Olá ${c.name}, notamos que o pagamento está pendente. Vamos renovar para manter o sinal ativo?`, c)} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md"><MessageSquare size={18}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <RecentActivityCard title="Histórico Recente" items={clients.flatMap(c => c.paymentHistory.map(h => ({...h, clientName: c.name}))).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)} />
                </div>
              </div>
            )}

            {view === 'clients' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" placeholder="Pesquisar..." className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar">
                      <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold shadow-sm outline-none cursor-pointer">
                        <option value="asc">Vencimento ↑ (Próximos)</option>
                        <option value="desc">Vencimento ↓ (Longe)</option>
                      </select>
                      <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} className="bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold shadow-sm outline-none cursor-pointer">
                        <option value="all">Todos Pagos/Pendentes</option>
                        <option value="paid">Apenas Pagos</option>
                        <option value="pending">Apenas Pendentes</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    <FilterChip active={statusFilter === 'all'} label="Todos Status" onClick={() => setStatusFilter('all')} />
                    <FilterChip active={statusFilter === 'active'} label="Ativos" onClick={() => setStatusFilter('active')} />
                    <FilterChip active={statusFilter === 'expired'} label="Vencidos" onClick={() => setStatusFilter('expired')} />
                    <FilterChip active={statusFilter === 'blocked'} label="Bloqueados" onClick={() => setStatusFilter('blocked')} />
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Vencimento</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Plano / Valor</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Pagamento</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredClients.map(c => {
                          const expired = isExpired(c.expiresAt);
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-5">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{c.username}</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <div className={`text-xs font-bold ${expired && c.status === 'active' ? 'text-red-500' : 'text-slate-700'}`}>
                                  {new Date(c.expiresAt).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold">
                                  {new Date(c.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <div className="text-xs font-bold text-slate-800 uppercase truncate max-w-[120px] mx-auto">{c.packageName}</div>
                                <div className="text-[10px] text-slate-400 font-bold">R$ {c.price.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter shadow-sm border ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>
                                  {c.status === 'blocked' ? 'Bloqueado' : expired ? 'Vencido' : 'Ativo'}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter border ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                  {c.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <div className="flex gap-1.5 justify-end">
                                  <button onClick={() => setSelectedClientDetails(c)} title="Informações" className="p-2 text-blue-600 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all"><Eye size={16}/></button>
                                  <button onClick={() => setSelectedClientForMsg(c)} title="WhatsApp" className="p-2 text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all"><MessageSquare size={16}/></button>
                                  <button onClick={() => setSelectedClientForRenewal(c)} title="Renovar" className="p-2 text-amber-600 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 transition-all"><RefreshCw size={16}/></button>
                                  <button onClick={() => { if(confirm('Excluir cliente?')) setClients(prev => prev.filter(cl => cl.id !== c.id)) }} title="Excluir" className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Grid View */}
                <div className="md:hidden space-y-4">
                  {filteredClients.map(c => {
                    const expired = isExpired(c.expiresAt);
                    return (
                      <div key={c.id} className={`bg-white p-5 rounded-2xl border-2 shadow-sm transition-all relative ${expired && c.status === 'active' ? 'border-red-100' : 'border-slate-100'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-base">{c.name}</h4>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{c.username}</div>
                          </div>
                          <div className="flex gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter border ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>
                              {c.status === 'blocked' ? 'Bloqueado' : expired ? 'Vencido' : 'Ativo'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-4">
                          <div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase mb-1">Vencimento</div>
                            <div className={`text-xs font-bold ${expired && c.status === 'active' ? 'text-red-500' : 'text-slate-700'}`}>
                              {new Date(c.expiresAt).toLocaleDateString('pt-BR')} às {new Date(c.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase mb-1">Plano / Valor</div>
                            <div className="text-xs font-bold text-slate-700 truncate">{c.packageName}</div>
                            <div className="text-[9px] font-bold text-slate-400">R$ {c.price.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase mb-1">Pagamento</div>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                              {c.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <div className="flex gap-2">
                             <button onClick={() => setSelectedClientDetails(c)} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl border border-blue-100"><Eye size={18}/></button>
                             <button onClick={() => setSelectedClientForMsg(c)} className="p-2.5 text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100"><MessageSquare size={18}/></button>
                             <button onClick={() => setSelectedClientForRenewal(c)} className="p-2.5 text-amber-600 bg-amber-50 rounded-xl border border-amber-100"><RefreshCw size={18}/></button>
                          </div>
                          <button onClick={() => { if(confirm('Excluir cliente?')) setClients(prev => prev.filter(cl => cl.id !== c.id)) }} className="p-2.5 text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === 'add' && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-4xl mx-auto shadow-sm">
                <h3 className="text-xl font-bold uppercase mb-8 text-blue-600 flex items-center gap-3"><PlusCircle size={24}/> Cadastrar Cliente</h3>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => {
                  e.preventDefault();
                  handleAddClient(Object.fromEntries(new FormData(e.currentTarget)));
                }}>
                  <FormInput name="name" label="Nome do Cliente" required />
                  <FormInput name="phone" label="WhatsApp (55...)" required />
                  <FormInput name="username" label="Usuário Painel" required />
                  <FormInput name="password" label="Senha Painel" />
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Plano Base</label>
                    <select name="packageId" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer">
                      {packages.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {p.price})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput name="price" label="Valor Cobrado (R$)" type="number" step="0.01" required />
                    <FormInput name="expenses" label="Custo Painel (R$)" type="number" step="0.01" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput name="expiryDate" label="Vencimento" type="date" required />
                    <FormInput name="expiryTime" label="Hora" type="time" defaultValue="00:00" />
                  </div>
                  <FormInput name="appName" label="Aplicativo" placeholder="Ex: Smarters Pro" />
                  <FormInput name="macKey" label="MAC / ID" placeholder="00:11:..." />
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Notas</label>
                    <textarea name="notes" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" rows={3}></textarea>
                  </div>
                  <div className="md:col-span-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                    <input type="checkbox" name="isPaid" id="isPaid" className="w-5 h-5 accent-emerald-600 rounded cursor-pointer" />
                    <label htmlFor="isPaid" className="text-xs font-bold text-emerald-800 uppercase cursor-pointer">Registrar pagamento inicial?</label>
                  </div>
                  <button type="submit" className="md:col-span-2 bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase shadow-xl hover:bg-slate-800 transition-all">Salvar Cliente</button>
                </form>
              </div>
            )}

            {view === 'scheduling' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h4 className="font-bold uppercase text-sm mb-6 flex items-center gap-2 text-blue-600"><BellRing size={20}/> Automação de Disparos</h4>
                   <form className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end" onSubmit={(e) => {
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
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Momento</label>
                        <select name="type" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer">
                          <option value="before">Antes do vencimento</option>
                          <option value="on_day">No dia exato</option>
                          <option value="after">Após o vencimento</option>
                        </select>
                     </div>
                     <FormInput name="days" label="Dias" type="number" defaultValue="0" />
                     <FormInput name="time" label="Horário" type="time" defaultValue="09:00" />
                     <button type="submit" className="bg-blue-600 text-white p-3.5 rounded-xl font-bold uppercase text-[10px] shadow-lg hover:bg-blue-700 transition-all">Salvar</button>
                   </form>
                </div>
                <div className="grid gap-3">
                   {rules.map(rule => (
                     <div key={rule.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-5">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rule.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                             <Clock3 size={24}/>
                           </div>
                           <div>
                              <div className="text-sm font-bold uppercase tracking-tight text-slate-800">
                                {rule.days === 0 ? "No dia do vencimento" : `${rule.days} dias ${rule.type === 'before' ? 'antes' : 'depois'} do prazo`}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Disparo às {rule.time}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <button onClick={() => setRules(rules.map(r => r.id === rule.id ? {...r, isActive: !r.isActive} : r))} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                             {rule.isActive ? 'Ativa' : 'Pausada'}
                           </button>
                           <button onClick={() => setRules(rules.filter(r => r.id !== rule.id))} className="p-2 text-red-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
            
            {view === 'history' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 flex items-center justify-between border-b bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentYear(y => y-1)} className="p-2 bg-white rounded-lg border border-slate-200"><ChevronLeft size={18}/></button>
                    <span className="font-bold text-xl tracking-tighter text-slate-900">{currentYear}</span>
                    <button onClick={() => setCurrentYear(y => y+1)} className="p-2 bg-white rounded-lg border border-slate-200"><ChevronRight size={18}/></button>
                  </div>
                  <div className="text-[10px] font-bold flex gap-4 uppercase text-slate-400">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500"></div> Pago</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-red-500"></div> Vencido</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase sticky left-0 bg-slate-50 z-20 shadow-r">Cliente</th>
                        {MONTHS.map(m => <th key={m} className="px-2 py-4 text-[10px] font-bold text-slate-400 uppercase text-center">{m}</th>)}
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase text-right">LTV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold sticky left-0 bg-white z-10 whitespace-nowrap shadow-r">{c.name}</td>
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
                              <td key={i} className="px-1 py-4 text-center">
                                <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center shadow-sm ${status === 'paid' ? 'bg-emerald-500 text-white' : status === 'overdue' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                  {status === 'paid' && <CheckCircle size={14}/>}
                                  {status === 'overdue' && <XCircle size={14}/>}
                                  {status === 'none' && <div className="w-1.5 h-1.5 rounded-full bg-slate-300 opacity-30"></div>}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 text-right text-xs font-bold text-emerald-600">R$ {c.totalPaid.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === 'packages' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h4 className="font-bold text-sm uppercase text-slate-400 mb-6 flex items-center gap-2"><Layers size={18}/> Novo Plano</h4>
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
                     <div className="col-span-2"><FormInput name="name" label="Nome do Plano" required /></div>
                     <FormInput name="price" label="Preço" type="number" required />
                     <FormInput name="cost" label="Custo" type="number" required />
                     <FormInput name="months" label="Meses" type="number" defaultValue="1" required />
                     <button type="submit" className="bg-blue-600 text-white rounded-xl font-bold uppercase text-[10px] p-4 shadow-lg hover:bg-blue-700 transition-all">Salvar</button>
                   </form>
                </div>
                {packages.map(p => (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div>
                      <span className="font-bold text-sm text-slate-800">{p.name}</span><br/>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">R$ {p.price} • {p.months} Mes(es)</span>
                    </div>
                    <button onClick={() => setPackages(packages.filter(x => x.id !== p.id))} className="text-red-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
            )}

            {view === 'messages' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h4 className="font-bold text-sm uppercase text-slate-400 mb-6 flex items-center gap-2"><MessageSquare size={18}/> Novo Modelo</h4>
                   <form className="space-y-4" onSubmit={(e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     setTemplates([...templates, { 
                       id: Math.random().toString(36).substr(2,9), 
                       title: (fd.get('title') as string).toUpperCase(), 
                       body: fd.get('body') as string 
                     }]);
                     e.currentTarget.reset();
                   }}>
                     <FormInput name="title" label="Título" required />
                     <textarea name="body" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" rows={4} placeholder="Variáveis: {{nome}}, {{vencimento}}, {{valor}}"></textarea>
                     <button type="submit" className="w-full bg-emerald-600 text-white rounded-xl font-bold uppercase text-[10px] p-4 shadow-lg">Criar Modelo</button>
                   </form>
                </div>
                {templates.map(t => (
                  <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-sm">
                    <button onClick={() => setTemplates(templates.filter(x => x.id !== t.id))} className="absolute top-6 right-6 text-red-200 hover:text-red-500"><Trash2 size={20}/></button>
                    <span className="text-xs font-bold uppercase text-blue-600 tracking-widest">{t.title}</span>
                    <p className="text-sm text-slate-600 italic mt-3">"{t.body}"</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center py-3 z-40 pb-safe shadow-xl">
          <BottomNavItem icon={<LayoutDashboard size={20}/>} label="Início" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <BottomNavItem icon={<History size={20}/>} label="Matriz" active={view === 'history'} onClick={() => setView('history')} />
          <BottomNavItem icon={<Users size={20}/>} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
          <div className="relative" ref={mobileMenuRef}>
             <BottomNavItem icon={<MoreHorizontal size={20}/>} label="Mais" active={['scheduling', 'packages', 'messages', 'add'].includes(view)} onClick={() => setShowMobileMenu(!showMobileMenu)} />
             {showMobileMenu && (
               <div className="absolute bottom-16 right-0 bg-slate-900 rounded-2xl shadow-2xl p-2 w-52 flex flex-col gap-1 z-50">
                 <button onClick={() => { setView('scheduling'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-4 text-[10px] font-bold text-white hover:bg-white/10 rounded-xl uppercase transition-colors"><BellRing size={18} className="text-blue-500"/> Agenda</button>
                 <button onClick={() => { setView('add'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-4 text-[10px] font-bold text-white hover:bg-white/10 rounded-xl uppercase transition-colors"><PlusCircle size={18} className="text-emerald-500"/> Cadastrar</button>
                 <button onClick={() => { setView('packages'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-4 text-[10px] font-bold text-white hover:bg-white/10 rounded-xl uppercase transition-colors"><Layers size={18} className="text-amber-500"/> Planos</button>
                 <button onClick={() => { setView('messages'); setShowMobileMenu(false); }} className="flex items-center gap-3 p-4 text-[10px] font-bold text-white hover:bg-white/10 rounded-xl uppercase transition-colors"><MessageSquare size={18} className="text-purple-500"/> Modelos</button>
               </div>
             )}
          </div>
        </nav>
      </div>

      {selectedClientForRenewal && <RenewalModal client={selectedClientForRenewal} packages={packages} onRenew={registerRenewal} onClose={() => setSelectedClientForRenewal(null)} />}
      {selectedClientForMsg && <MessageModal client={selectedClientForMsg} templates={templates} onSend={sendWhatsApp} onClose={() => setSelectedClientForMsg(null)} />}
      {selectedClientDetails && <ClientDetailsModal client={selectedClientDetails} onClose={() => setSelectedClientDetails(null)} />}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon}
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 flex-1 transition-colors duration-200 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-blue-50' : ''}`}>{icon}</div>
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap: any = { 
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100', 
    blue: 'bg-blue-50 text-blue-600 border-blue-100', 
    red: 'bg-red-50 text-red-600 border-red-100', 
    slate: 'bg-slate-50 text-slate-500 border-slate-100', 
    amber: 'bg-amber-50 text-amber-600 border-amber-100' 
  };
  return (
    <div className={`bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center group transition-all hover:shadow-md ${colorMap[color]}`}>
      <div className={`w-12 h-12 flex items-center justify-center rounded-2xl mb-4 transition-transform group-hover:scale-110 shadow-sm ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]}`}>{icon}</div>
      <div className="text-xl font-bold tracking-tighter text-slate-900">{value}</div>
      <div className="text-[10px] font-bold uppercase mt-2 tracking-widest text-slate-400">{title}</div>
    </div>
  );
}

function FormInput({ label, name, type = "text", ...rest }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">{label}</label>
      <input name={name} type={type} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold shadow-sm transition-all" {...rest} />
    </div>
  );
}

function FilterChip({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-6 py-2 rounded-full text-[10px] font-bold transition-all whitespace-nowrap uppercase tracking-widest ${active ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'}`}>{label}</button>
  );
}

function ClientDetailsModal({ client, onClose }: { client: Client, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Activity size={100}/></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold uppercase tracking-tight">Ficha do Cliente</h3>
            <p className="text-[10px] font-bold opacity-60 mt-1">ID: {client.id.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors relative z-10 shadow-lg"><X size={24}/></button>
        </div>
        <div className="p-8 space-y-5 max-h-[75vh] overflow-y-auto hide-scrollbar">
          <DetailRow label="Nome" value={client.name} icon={<Users size={16}/>}/>
          <DetailRow label="Usuário Painel" value={client.username} icon={<Tag size={16}/>} isMono/>
          <DetailRow label="Senha Painel" value={client.password || '---'} icon={<Tag size={16}/>} isMono/>
          <div className="grid grid-cols-2 gap-4">
             <DetailRow label="Plano" value={client.packageName} icon={<Smartphone size={16}/>} isHighlight/>
             <DetailRow label="Valor Mensal" value={`R$ ${client.price.toFixed(2)}`} icon={<DollarSign size={16}/>}/>
          </div>
          <DetailRow label="Aplicativo / Dispositivo" value={client.appName || 'Não cadastrado'} icon={<Layers size={16}/>}/>
          <DetailRow label="MAC / ID" value={client.macKey || '---'} icon={<Smartphone size={16}/>} isMono/>
          <div className="grid grid-cols-2 gap-4">
             <DetailRow label="Data de Criação" value={new Date(client.createdAt).toLocaleDateString('pt-BR')} icon={<Calendar size={16}/>}/>
             <DetailRow label="Vencimento" value={new Date(client.expiresAt).toLocaleDateString('pt-BR')} icon={<History size={16}/>}/>
          </div>
          <DetailRow label="Hora do Vencimento" value={new Date(client.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} icon={<Clock size={16}/>}/>
          {client.notes && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Observações</span>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{client.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon, isMono, isHighlight }: any) {
  return (
    <div className={`p-4 rounded-2xl border border-slate-100 ${isHighlight ? 'bg-blue-50 border-blue-100' : 'bg-white'}`}>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
        {icon} {label}
      </span>
      <div className={`text-sm font-bold text-slate-800 ${isMono ? 'font-mono' : ''} ${isHighlight ? 'text-blue-600' : ''}`}>
        {value}
      </div>
    </div>
  );
}

function RenewalModal({ client, packages, onRenew, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
          <div><h3 className="text-lg font-bold uppercase tracking-tight">Renovar Cliente</h3><p className="text-[10px] font-bold opacity-70">{client.name}</p></div>
          <button onClick={onClose} className="p-2.5 bg-white/10 rounded-xl shadow-lg"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-4">
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => onRenew(client.id, pkg.id)} className="w-full text-left p-5 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 flex items-center justify-between group transition-all shadow-sm bg-white">
              <div><div className="font-bold text-slate-800 text-sm uppercase group-hover:text-emerald-700">{pkg.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase mt-1">R$ {pkg.price.toFixed(2)} • {pkg.months} Mes(es)</div></div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm"><ArrowUpRight size={20} /></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageModal({ client, templates, onSend, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div><h3 className="text-lg font-bold uppercase tracking-tight">WhatsApp</h3><p className="text-[10px] font-bold opacity-60 uppercase">{client.phone}</p></div>
          <button onClick={onClose} className="p-2.5 bg-white/10 rounded-xl shadow-lg"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto hide-scrollbar">
          {templates.map((tpl: any) => (
            <button key={tpl.id} onClick={() => onSend(tpl, client)} className="w-full text-left p-6 rounded-2xl border border-slate-100 hover:border-blue-400 hover:bg-blue-50/50 flex justify-between items-center group transition-all shadow-sm bg-white">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-widest">{tpl.title}</span>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><Send size={18} /></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentActivityCard({ title, items }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase flex items-center gap-2 tracking-tight"><History size={18} className="text-blue-500"/> {title}</h3>
      </div>
      <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
        {items.map((it: any) => (
          <div key={it.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
            <div className="flex flex-col"><span className="text-xs font-bold text-slate-800">{it.clientName}</span><span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(it.date).toLocaleDateString('pt-BR')}</span></div>
            <span className="text-xs font-bold text-emerald-600">+ R$ {it.amount.toFixed(2)}</span>
          </div>
        ))}
        {items.length === 0 && <div className="p-10 text-center text-slate-300 font-bold text-xs uppercase opacity-50">Sem registros</div>}
      </div>
    </div>
  );
}
