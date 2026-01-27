import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { geminiService } from './services/geminiService';

// --- IMPORTAÇÃO DOS COMPONENTES VISUAIS ---
import Layout from './components/Layout';
import { Toast } from './components/UiKit';

// --- IMPORTAÇÃO DAS PÁGINAS ---
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Financeiro from './pages/Financeiro';
import ClientsList from './pages/Clients';
import AddClient from './pages/AddClient';
import Servers from './pages/Servers';
import Subscription from './pages/Subscription';
import AdminSaaS from './pages/AdminSaaS';
import { HistoryTool, BackupTool, PlansTool, MessagesTool, AutomationTool } from './pages/Tools';

/* --- TIPAGEM BÁSICA --- */
const MONTHS_LIST = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

interface AppProps {
  onNotificationClick: () => void;
}

export default function App({ onNotificationClick }: AppProps) {
  // --- ESTADOS GLOBAIS ---
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // DADOS DO SISTEMA
  const [clients, setClients] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [saasUsers, setSaasUsers] = useState<any[]>([]);
  
  // ESTADOS DE UI
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [currentHistoryYear, setCurrentHistoryYear] = useState(new Date().getFullYear());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // AUTH STATE
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authData, setAuthData] = useState({ email: '', password: '', fullName: '', phone: '' });

  // ESTADOS DE FORMULÁRIOS
  const [addFormData, setAddFormData] = useState({ name: '', username: '', password: '', phone: '', price: '', expenses: '0', notes: '', packageId: '', serverId: '', expiryDate: '', expiryTime: '', isPaid: true, paymentDate: new Date().toISOString().split('T')[0], appName: '', macKey: '' });
  const [selectedClientForMsg, setSelectedClientForMsg] = useState<any>(null);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<any>(null);
  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState<any>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<any>(null);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  // --- CARREGAMENTO INICIAL E AUTH ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    if (!session?.user) return;
    setIsRefreshing(true);
    try {
      const userId = session.user.id;
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profile) {
        setUserProfile(profile);
        if (profile.theme) setTheme(profile.theme);
      }

      const [cRes, pRes, sRes, tRes, rRes] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', userId),
        supabase.from('packages').select('*').eq('user_id', userId),
        supabase.from('servers').select('*').eq('user_id', userId),
        supabase.from('message_templates').select('*').eq('user_id', userId),
        supabase.from('automation_rules').select('*').eq('user_id', userId)
      ]);

      if (cRes.data) setClients(cRes.data);
      if (pRes.data) setPackages(pRes.data);
      if (sRes.data) setServers(sRes.data);
      if (tRes.data) setTemplates(tRes.data);
      if (rRes.data) setRules(rRes.data);

      if (session.user.email === 'admin@eflixtv.com') {
        const { data: allUsers } = await supabase.from('profiles').select('*');
        if (allUsers) setSaasUsers(allUsers);
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: authData.email, password: authData.password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authData.email, 
          password: authData.password,
          options: { data: { full_name: authData.fullName, phone: authData.phone } }
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').insert([{
            id: data.user.id,
            email: authData.email,
            full_name: authData.fullName,
            phone: authData.phone,
            role: 'user',
            trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          }]);
          showToast('Conta criada com sucesso!');
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Erro na autenticação', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setClients([]);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    try {
      const newClient = {
        user_id: session.user.id,
        name: addFormData.name,
        username: addFormData.username,
        password: addFormData.password,
        phone: addFormData.phone,
        status: 'active',
        paymentStatus: addFormData.isPaid ? 'paid' : 'pending',
        expiresAt: new Date(`${addFormData.expiryDate}T${addFormData.expiryTime || '00:00'}`).toISOString(),
        notes: addFormData.notes,
        appName: addFormData.appName,
        macKey: addFormData.macKey,
        server_id: addFormData.serverId || null,
        createdAt: new Date().toISOString(),
        paymentHistory: addFormData.isPaid ? [{
            date: addFormData.paymentDate,
            amount: Number(addFormData.price),
            method: 'manual'
        }] : [],
        expenses: Number(addFormData.expenses) || 0,
        packageName: packages.find(p => p.id === addFormData.packageId)?.name || 'Personalizado'
      };

      const { data, error } = await supabase.from('clients').insert([newClient]).select().single();
      if (error) throw error;

      if (addFormData.serverId) {
         const srv = servers.find(s => s.id === addFormData.serverId);
         if (srv && srv.credits > 0) {
             const newCredits = srv.credits - 1;
             await supabase.from('servers').update({ credits: newCredits }).eq('id', srv.id);
             setServers(servers.map(s => s.id === srv.id ? {...s, credits: newCredits} : s));
         }
      }

      setClients([...clients, data]);
      showToast('Cliente cadastrado com sucesso!');
      setAddFormData({ ...addFormData, name: '', username: '', password: '', phone: '' }); 
    } catch (error) {
      showToast('Erro ao cadastrar cliente', 'error');
    }
  };

  const clientHandlers = {
    handleDeleteClient: async (id: string) => {
      if (!confirm('Excluir este cliente?')) return;
      await supabase.from('clients').delete().eq('id', id);
      setClients(clients.filter(c => c.id !== id));
      showToast('Cliente removido');
    },
    handleToggleStatus: async (client: any) => {
      const newStatus = client.status === 'active' ? 'blocked' : 'active';
      await supabase.from('clients').update({ status: newStatus }).eq('id', client.id);
      setClients(clients.map(c => c.id === client.id ? { ...c, status: newStatus } : c));
    },
    handleTogglePayment: async (client: any) => {
      const newStatus = client.paymentStatus === 'paid' ? 'pending' : 'paid';
      await supabase.from('clients').update({ paymentStatus: newStatus }).eq('id', client.id);
      setClients(clients.map(c => c.id === client.id ? { ...c, paymentStatus: newStatus } : c));
    },
    handleArchiveClient: async (c: any) => { /* ... */ },
    handleRestoreClient: async (c: any) => { /* ... */ },
    handleCopyCredentials: (c: any) => { navigator.clipboard.writeText(`User: ${c.username}\nPass: ${c.password}`); showToast('Copiado!'); },
    setSelectedClientForMsg,
    setSelectedClientForEdit,
    setSelectedClientForRenewal,
    setSelectedClientDetails
  };

  return (
    <BrowserRouter>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      {!session ? (
        <Auth 
          authMode={authMode} setAuthMode={setAuthMode}
          authData={authData} setAuthData={setAuthData}
          handleAuth={handleAuth} loading={loading}
        />
      ) : (
        <Layout 
          theme={theme} 
          toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          session={session}
          userProfile={userProfile}
          isAdmin={session.user.email === 'admin@eflixtv.com'}
          notificationsEnabled={Notification.permission === 'granted'} 
          requestPermission={async () => onNotificationClick()}
          handleLogout={handleLogout}
          isRefreshing={isRefreshing} 
          handleRefreshData={fetchData}
          onAiAnalyze={async () => {
            if (clients.length === 0) return showToast('Sem clientes para analisar', 'error');
            showToast('IA Analisando dados...');
            const analysis = await geminiService.analyzeBusiness(clients);
            alert(analysis);
          }} 
          onPublicSignupLink={() => {}}
        >
          <Routes>
            <Route path="/" element={<Dashboard 
              clients={clients} theme={theme} 
              isExpired={(d:string) => new Date(d) < new Date()}
              sendWhatsApp={(msg, c) => window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(msg)}`)} 
            />} />

            <Route path="/financeiro" element={<Financeiro 
              clients={clients} packages={packages} servers={servers}
              theme={theme} month={month} year={year} setMonth={setMonth} setYear={setYear}
            />} />

            <Route path="/clientes" element={<ClientsList 
               clients={clients} theme={theme}
               searchTerm={searchTerm} setSearchTerm={setSearchTerm}
               statusFilter={statusFilter} setStatusFilter={setStatusFilter}
               paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter}
               handlers={clientHandlers}
            />} />

            <Route path="/clientes/novo" element={<AddClient 
               theme={theme} addFormData={addFormData} setAddFormData={setAddFormData}
               handleAddClient={handleAddClient} packages={packages} servers={servers}
            />} />

            <Route path="/servidores" element={<Servers 
               theme={theme} servers={servers} 
               handleSaveServer={(s:any) => setServers([...servers, {...s, id: Math.random(), credits: 0}])}
               handleDeleteServer={(id:any) => setServers(servers.filter(s=>s.id!==id))} setSelectedServerForCredit={() => {}}
            />} />

            <Route path="/historico" element={<HistoryTool theme={theme} currentYear={currentHistoryYear} setCurrentYear={setCurrentHistoryYear} clients={clients} MONTHS={MONTHS_LIST}/>} />
            <Route path="/backup" element={<BackupTool theme={theme} handleRefreshData={fetchData} isRefreshing={isRefreshing} handleExportCSV={() => {}} />} />
            <Route path="/mensagens" element={<MessagesTool theme={theme} templates={templates} handleSaveTemplate={(t:any) => setTemplates([...templates, t])} handleDeleteTemplate={(id:any) => setTemplates(templates.filter(t=>t.id!==id))} />} />
            <Route path="/planos" element={<PlansTool theme={theme} packages={packages} editingPackage={editingPackage} setEditingPackage={setEditingPackage} handleSavePackage={(p:any)=>setPackages([...packages,p])} handleDeletePackage={(id:any)=>setPackages(packages.filter(pk=>pk.id!==id))} />} />
            <Route path="/automacao" element={<AutomationTool theme={theme} rules={rules} templates={templates} handleSaveRule={(r:any)=>setRules([...rules,r])} handleDeleteRule={(id:any)=>setRules(rules.filter(ru=>ru.id!==id))} />} />
            <Route path="/assinatura" element={<Subscription userProfile={userProfile} theme={theme} handleSubscribe={() => {}} />} />

            {session.user.email === 'admin@eflixtv.com' && (
               <Route path="/admin" element={<AdminSaaS users={saasUsers} theme={theme} onSimulate={() => {}} onDeleteUser={() => {}} onViewUser={() => {}} />} />
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}
