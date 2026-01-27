import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { geminiService } from './services/geminiService';

// --- IMPORTAÇÃO DOS COMPONENTES ---
import Layout from './components/Layout';
import { Toast, PaymentSuccessModal, WelcomeModal } from './components/UiKit';

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

const checkIsExpired = (date: string | null | undefined) => {
  if (!date) return true;
  return new Date(date) < new Date();
};

export default function App() {
  // --- ESTADOS DE SESSÃO E PERFIL ---
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('eflixtv_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  // --- ESTADOS DE DADOS ---
  const [clients, setClients] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); // Para o SaaS

  // --- ESTADOS DE UI ---
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  // --- CONTROLE DE ACESSO E ASSINATURA ---
  const isAdmin = session?.user?.email === 'eronvasconcelos.br@gmail.com';

  // --- EFEITO DE INICIALIZAÇÃO E AUTH ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- SINCRONIZAÇÃO DE DADOS (RESTAURADA) ---
  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const userId = session?.user?.id;
      if (!userId) return;

      // 1. Perfil e Preferências
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profile) {
        setUserProfile(profile);
        if (profile.theme) setTheme(profile.theme);
      }

      // 2. Dados do SaaS (Se for Admin)
      if (isAdmin) {
        const { data: saasData } = await supabase.from('saas_customers').select('*').order('created_at', { ascending: false });
        if (saasData) setAllUsers(saasData);
      }

      // 3. Dados de IPTV
      const [cRes, pRes, sRes, tRes, rRes] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', userId),
        supabase.from('packages').select('*').eq('user_id', userId),
        supabase.from('servers').select('*').eq('user_id', userId),
        supabase.from('templates').select('*').eq('user_id', userId),
        supabase.from('rules').select('*').eq('user_id', userId)
      ]);

      if (cRes.data) setClients(cRes.data.map(d => ({ ...d, paymentStatus: d.payment_status, expiresAt: d.expires_at, createdAt: d.created_at, paymentHistory: d.payment_history || [] })));
      if (pRes.data) setPackages(pRes.data);
      if (sRes.data) setServers(sRes.data);
      if (tRes.data) setTemplates(tRes.data);
      if (rRes.data) setRules(rRes.data);

    } catch (error) {
      console.error(error);
      showToast("Erro ao sincronizar dados", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // --- HANDLERS DO SAAS (PRORROGAÇÃO E EXCLUSÃO) ---
  const handleUpdateSaaSExpiry = async (userId: string, newDate: string) => {
    try {
      const { error } = await supabase.from('saas_customers').update({ subscription_ends_at: newDate }).eq('id', userId);
      if (error) throw error;
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_ends_at: newDate } : u));
      showToast("Vencimento atualizado!");
    } catch (err) {
      showToast("Erro ao atualizar", "error");
    }
  };

  const handleDeleteSaaSUser = async (id: string) => {
    if (!window.confirm('Excluir este usuário do SaaS?')) return;
    try {
      await supabase.from('saas_customers').delete().eq('id', id);
      setAllUsers(prev => prev.filter(u => u.id !== id));
      showToast("Usuário removido");
    } catch (err) {
      showToast("Erro ao excluir", "error");
    }
  };

  // --- HANDLERS DE IPTV (CLIENTES) ---
  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('Excluir cliente permanentemente?')) return;
    try {
      await supabase.from('clients').delete().eq('id', id);
      setClients(prev => prev.filter(c => c.id !== id));
      showToast("Cliente removido");
    } catch (err) {
      showToast("Erro ao excluir", "error");
    }
  };

  const handleToggleStatus = async (client: any) => {
    const newStatus = client.status === 'active' ? 'blocked' : 'active';
    await supabase.from('clients').update({ status: newStatus }).eq('id', client.id);
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: newStatus } : c));
  };

  // --- LOGOUT E TEMA ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('eflixtv_theme', newTheme);
  };

  if (!session && !isLoading) return <Auth theme={theme} />;
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-blue-500 font-bold">CARREGANDO...</div>;

  return (
    <BrowserRouter>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showSuccessModal && <PaymentSuccessModal theme={theme} onClose={() => setShowSuccessModal(false)} />}

      <Layout 
        theme={theme} 
        toggleTheme={toggleTheme}
        session={session}
        userProfile={userProfile}
        isAdmin={isAdmin}
        notificationsEnabled={Notification.permission === 'granted'} 
        requestPermission={async () => { await Notification.requestPermission(); }}
        handleLogout={handleLogout}
        isRefreshing={isRefreshing} 
        handleRefreshData={() => { setIsRefreshing(true); fetchAllData(true); }}
        onAiAnalyze={() => geminiService.analyzeBusiness(clients).then(setAiAnalysis)} 
        onPublicSignupLink={() => window.open('?mode=signup', '_blank')}
      >
        {aiAnalysis && (
          <div className="mb-4 p-4 bg-blue-600 text-white rounded-lg relative animate-in fade-in">
            <button onClick={() => setAiAnalysis(null)} className="absolute top-2 right-2 opacity-50 hover:opacity-100">X</button>
            <p className="text-xs font-bold uppercase mb-1">Insight da IA:</p>
            <p className="text-sm">{aiAnalysis}</p>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard clients={clients} theme={theme} isExpired={checkIsExpired} />} />
          <Route path="/financeiro" element={<Financeiro clients={clients} packages={packages} servers={servers} theme={theme} />} />
          <Route path="/clientes" element={
            <ClientsList 
              clients={clients} 
              theme={theme} 
              handlers={{
                handleDeleteClient,
                handleToggleStatus,
                handleTogglePayment: async (c: any) => {
                   const s = c.paymentStatus === 'paid' ? 'pending' : 'paid';
                   await supabase.from('clients').update({ payment_status: s }).eq('id', c.id);
                   setClients(prev => prev.map(cl => cl.id === c.id ? { ...cl, paymentStatus: s } : cl));
                }
              }} 
            />
          } />
          <Route path="/clientes/novo" element={<AddClient theme={theme} packages={packages} servers={servers} onSave={() => fetchAllData(true)} />} />
          <Route path="/servidores" element={<Servers theme={theme} servers={servers} onSave={() => fetchAllData(true)} />} />
          <Route path="/historico" element={<HistoryTool theme={theme} clients={clients} />} />
          <Route path="/backup" element={<BackupTool theme={theme} clients={clients} onRefresh={() => fetchAllData(true)} />} />
          <Route path="/mensagens" element={<MessagesTool theme={theme} templates={templates} onSave={() => fetchAllData(true)} />} />
          <Route path="/planos" element={<PlansTool theme={theme} packages={packages} onSave={() => fetchAllData(true)} />} />
          <Route path="/automacao" element={<AutomationTool theme={theme} rules={rules} templates={templates} onSave={() => fetchAllData(true)} />} />
          <Route path="/assinatura" element={<Subscription userProfile={userProfile} theme={theme} />} />
          
          {isAdmin && (
            <Route path="/admin" element={
              <AdminSaaS 
                users={allUsers} 
                theme={theme} 
                onDeleteUser={handleDeleteSaaSUser}
                onUpdateExpiry={handleUpdateSaaSExpiry}
              />
            } />
          )}
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}