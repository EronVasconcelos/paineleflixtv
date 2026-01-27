import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Tv, LayoutDashboard, DollarSign, Users, UserPlus, History, Server as ServerIcon, 
  CalendarDays, Layers, MessageSquare, Database, CreditCard, Moon, Sun, LogOut, 
  Crown, Bell, BellOff, RefreshCw, Share2, TrendingUp, MoreHorizontal, ArrowUp
} from 'lucide-react';
import { SidebarItem, BottomNavItem, MobileSubItem } from './UiKit';

// Função auxiliar
const checkIsExpired = (date: string | null | undefined) => {
  if (!date) return true;
  return new Date(date) < new Date();
};

interface LayoutProps {
  children?: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  session: any;
  userProfile: any;
  isAdmin: boolean;
  notificationsEnabled: boolean;
  requestPermission: () => Promise<void>;
  handleLogout: () => void;
  isRefreshing: boolean;
  handleRefreshData: () => void;
  onAiAnalyze: () => void;
  onPublicSignupLink: () => void;
}

export default function Layout({ 
  children, theme, toggleTheme, session, userProfile, isAdmin,
  notificationsEnabled, requestPermission, handleLogout,
  isRefreshing, handleRefreshData, onAiAnalyze, onPublicSignupLink
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  const [pullDistance] = useState(0); 

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden font-normal transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-1.5 rounded-lg shadow-lg shadow-blue-500/30">
            <Tv size={20} className="text-white" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 leading-none">
              STREAM<br/>MANAGER
          </h1>
        </div>
        
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2 hide-scrollbar">
          {isAdmin && (
             <SidebarItem icon={<Crown size={18} className="text-yellow-500"/>} label="Painel SaaS" active={isActive('/admin')} onClick={() => navigate('/admin')} />
          )}
          <div className="pt-2 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestão</div>
          <SidebarItem icon={<LayoutDashboard size={18} className="text-blue-500"/>} label="Visão Geral" active={isActive('/')} onClick={() => navigate('/')} />
          <SidebarItem icon={<DollarSign size={18} className="text-emerald-500"/>} label="Financeiro" active={isActive('/financeiro')} onClick={() => navigate('/financeiro')} />
          <SidebarItem icon={<Users size={18} className="text-orange-500"/>} label="Meus Clientes" active={isActive('/clientes')} onClick={() => navigate('/clientes')} />
          <SidebarItem icon={<UserPlus size={18} className="text-cyan-500"/>} label="Novo Cadastro" active={isActive('/clientes/novo')} onClick={() => navigate('/clientes/novo')} />
          <SidebarItem icon={<History size={18} className="text-red-500"/>} label="Histórico" active={isActive('/historico')} onClick={() => navigate('/historico')} />
          <SidebarItem icon={<ServerIcon size={18} className="text-purple-500"/>} label="Servidores" active={isActive('/servidores')} onClick={() => navigate('/servidores')} />
          
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ferramentas</div>
          <SidebarItem icon={<CalendarDays size={18} className="text-emerald-500"/>} label="Automação Zap" active={isActive('/automacao')} onClick={() => navigate('/automacao')} />
          <SidebarItem icon={<Layers size={18} className="text-indigo-500"/>} label="Planos e Preços" active={isActive('/planos')} onClick={() => navigate('/planos')} />
          <SidebarItem icon={<MessageSquare size={18} className="text-emerald-500"/>} label="Mensagens" active={isActive('/mensagens')} onClick={() => navigate('/mensagens')} />
          <SidebarItem icon={<Database size={18} className="text-slate-500"/>} label="Backup Dados" active={isActive('/backup')} onClick={() => navigate('/backup')} />
          
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conta</div>
          <SidebarItem icon={<CreditCard size={18} className="text-yellow-500"/>} label="Minha Assinatura" active={isActive('/assinatura')} onClick={() => navigate('/assinatura')} />
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-all">
            <span className="text-[10px] font-bold uppercase">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
            {theme === 'dark' ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-amber-400" />}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all">
            <LogOut size={16} />
            <span className="text-[11px] font-bold uppercase">Sair</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`px-5 py-3 flex items-center justify-between pt-safe shrink-0 border-b z-20 transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
          <div className="flex items-center gap-3">
             <h2 className={`text-sm font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {isActive('/') && 'Visão Geral'}
              {isActive('/admin') && 'Painel SaaS'}
              {isActive('/financeiro') && 'Financeiro & Lucros'}
              {isActive('/historico') && 'Histórico Anual'}
              {isActive('/clientes') && 'Gestão de Clientes'}
              {isActive('/automacao') && 'Automação'}
              {isActive('/clientes/novo') && 'Cadastrar Cliente'}
              {isActive('/planos') && 'Gerenciar Planos'}
              {isActive('/mensagens') && 'Modelos de Mensagem'}
              {isActive('/backup') && 'Segurança'}
              {isActive('/servidores') && 'Meus Servidores'}
              {isActive('/assinatura') && 'Minha Assinatura'}
            </h2>
            <div className="flex items-center gap-2">
                {userProfile && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Crown size={12} />
                      <span className="text-[9px] font-bold uppercase">
                        {isAdmin 
                          ? 'Dono / Admin' 
                          : (() => {
                              const assinatura = userProfile.subscription_ends_at;
                              const teste = userProfile.trial_ends_at;
                              const isPremium = !!assinatura;
                              const finalDate = assinatura || teste;
                              
                              if (checkIsExpired(finalDate)) return 'Acesso Expirado';
                              
                              const diffInMs = new Date(finalDate).getTime() - Date.now();
                              const daysLeft = Math.max(0, Math.ceil(diffInMs / 86400000));
                              
                              return `${isPremium ? 'Acesso' : 'Teste'}: ${daysLeft} dias`;
                            })()
                        }
                      </span>
                    </div>
                  )}
                <button onClick={notificationsEnabled ? () => {} : requestPermission} className={`p-1.5 rounded-md transition-colors ${notificationsEnabled ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  {notificationsEnabled ? <Bell size={16}/> : <BellOff size={16}/>}
                </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-[10px] font-bold uppercase text-slate-400">
               {session?.user?.user_metadata?.full_name || session?.user?.email}
            </span>
            <button 
              onClick={handleRefreshData} 
              className={`md:hidden p-2 rounded-md border transition-all shadow-sm ${isRefreshing ? 'animate-spin bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
            >
              <RefreshCw size={16} />
            </button>
            <button 
              onClick={onPublicSignupLink} 
              className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-all shadow-sm" 
            >
              <Share2 size={16} />
            </button>
            <button onClick={onAiAnalyze} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-all shadow-sm">
              <TrendingUp size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-32 p-4 md:p-6 hide-scrollbar bg-slate-50/50 dark:bg-slate-950 transition-all">
          <div style={{ height: `${pullDistance}px`, opacity: pullDistance > 0 ? 1 : 0 }} className="flex items-center justify-center overflow-hidden transition-all ease-out duration-200">
             <div className={`p-2 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 ${isRefreshing ? 'animate-spin' : ''}`}>
                {isRefreshing ? <RefreshCw size={20}/> : <ArrowUp size={20} className="rotate-180"/>}
             </div>
          </div>

          <div className="max-w-6xl mx-auto space-y-5">
             {children || <Outlet />}
          </div>
        </main>

        {/* --- MOBILE MENU --- */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 items-center justify-items-center py-2 z-[100] pb-safe shadow-xl transition-colors ${theme === 'dark' ? 'bg-slate-900/98 border-slate-800 backdrop-blur-xl' : 'bg-white/98 border-slate-100 backdrop-blur-xl'}`}>
          <BottomNavItem icon={<LayoutDashboard size={22}/>} label="Painel" active={isActive('/')} onClick={() => navigate('/')} />
          <BottomNavItem icon={<DollarSign size={22}/>} label="Financ." active={isActive('/financeiro')} onClick={() => navigate('/financeiro')} />
          
          <div className="relative flex items-center justify-center w-full h-full">
            <button onClick={() => navigate('/clientes/novo')} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-slate-50 dark:border-slate-950 transition-all active:scale-95 z-[120]">
              <UserPlus size={24} />
            </button>
          </div>
          <BottomNavItem icon={<Users size={22}/>} label="Clientes" active={isActive('/clientes')} onClick={() => navigate('/clientes')} />
          <div className="relative flex flex-col items-center justify-center">
              <BottomNavItem icon={<MoreHorizontal size={22}/>} label="Mais" active={['/automacao', '/planos', '/mensagens', '/backup', '/servidores', '/assinatura', '/historico', '/admin'].includes(location.pathname)} onClick={() => setShowMobileMenu(!showMobileMenu)} />
              {showMobileMenu && (
                <div className="absolute bottom-14 right-2 bg-slate-900 rounded-lg shadow-2xl p-1.5 w-48 flex flex-col z-[110] border border-slate-800 animate-in slide-in-from-bottom-2">
                  {isAdmin && <MobileSubItem icon={<Crown size={16} className="text-yellow-500"/>} label="Painel SaaS" onClick={() => { navigate('/admin'); setShowMobileMenu(false); }} />}
                  <MobileSubItem icon={<History size={16} className="text-white"/>} label="Histórico" onClick={() => { navigate('/historico'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<CreditCard size={16} className="text-yellow-500"/>} label="Minha Assinatura" onClick={() => { navigate('/assinatura'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<ServerIcon size={16} className="text-purple-500"/>} label="Servidores" onClick={() => { navigate('/servidores'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<Database size={16} className="text-blue-500"/>} label="Banco de Dados" onClick={() => { navigate('/backup'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<Bell size={16} className="text-emerald-500"/>} label="Automação Zap" onClick={() => { navigate('/automacao'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<Layers size={16} className="text-amber-500"/>} label="Config Planos" onClick={() => { navigate('/planos'); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<MessageSquare size={16} className="text-emerald-500"/>} label="Mensagens" onClick={() => { navigate('/mensagens'); setShowMobileMenu(false); }} />
                  <div className="h-px bg-slate-800 my-1"></div>
                  <MobileSubItem icon={theme === 'dark' ? <Sun size={16} className="text-amber-400"/> : <Moon size={16}/>} label="Alternar Tema" onClick={() => { toggleTheme(); setShowMobileMenu(false); }} />
                  <MobileSubItem icon={<LogOut size={16} className="text-red-500"/>} label="Sair" onClick={() => { handleLogout(); setShowMobileMenu(false); }} />
                </div>
              )}
          </div>
        </nav>
    </div>
  );
}