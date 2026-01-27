import React, { useState, useMemo } from 'react';
import { 
  Database, Users, Activity, Crown, Star, DollarSign, Eye, UserX, 
  CheckCircle, AlertCircle, TrendingUp, Calendar, X
} from 'lucide-react';
import { StatCard } from '../components/UiKit';

const checkIsExpired = (date: string | null | undefined) => {
  if (!date) return true;
  return new Date(date) < new Date();
};

/* --- MODAL DE DETALHES E PRORROGAÇÃO (RESTAURADO) --- */
const SaaSDetailsModal = ({ user, theme, onClose, onUpdateExpiry }: any) => {
  const [newDate, setNewDate] = useState(user.subscription_ends_at || user.trial_ends_at || '');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Users size={20} className="text-blue-500"/></div>
            <h3 className="text-sm font-black uppercase tracking-tight dark:text-white">Perfil do Assinante SaaS</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Completo</span>
              <p className="text-sm font-bold dark:text-slate-200 capitalize">{user.full_name || 'Não informado'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${user.plan_type === 'premium' ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-500/10 text-slate-500'}`}>
                {user.plan_type === 'premium' ? 'PREMIUM' : 'FREE / TESTE'}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail de Acesso</span>
            <p className="text-sm font-medium text-blue-500 underline">{user.email}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Entrou em</span>
              <p className="text-xs font-bold dark:text-slate-300">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vencimento Atual</span>
              <p className={`text-xs font-bold ${checkIsExpired(user.subscription_ends_at || user.trial_ends_at) ? 'text-red-500' : 'text-emerald-500'}`}>
                {user.subscription_ends_at || user.trial_ends_at ? new Date(user.subscription_ends_at || user.trial_ends_at).toLocaleDateString('pt-BR') : '--/--/--'}
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-3">
            <div className="flex items-center gap-2 text-blue-500"><Calendar size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Prorrogar Acesso</span></div>
            <div className="flex items-center gap-2">
              <input type="date" value={newDate ? newDate.split('T')[0] : ''} onChange={(e) => setNewDate(e.target.value)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`} />
              <button onClick={() => onUpdateExpiry(user.id, newDate)} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-blue-700 transition-all shadow-lg active:scale-95">Atualizar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- COMPONENTE PRINCIPAL (RESTAURADO) --- */
export default function AdminSaaS({ users, theme, onSimulate, onDeleteUser, onUpdateExpiry }: any) {
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => !checkIsExpired(u.subscription_ends_at || u.trial_ends_at)).length;
    const premiumUsers = users.filter((u: any) => u.plan_type === 'premium').length;
    const mrr = premiumUsers * 29.90;
    return { totalUsers, activeUsers, premiumUsers, mrr };
  }, [users]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Painel SaaS</h2>
          <p className="text-sm text-slate-500 font-medium">Gestão de Usuários Cloud</p>
        </div>
        <div className="px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-bold uppercase border border-yellow-500/20 flex items-center gap-2"><Crown size={14} /> Modo Admin</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="MRR Estimado" value={`R$ ${stats.mrr.toFixed(2)}`} icon={<DollarSign/>} color="emerald" theme={theme}/>
        <StatCard title="Usuários Totais" value={stats.totalUsers} icon={<Users/>} color="blue" theme={theme}/>
        <StatCard title="Assinantes Premium" value={stats.premiumUsers} icon={<Star/>} color="purple" theme={theme}/>
        <StatCard title="Ativos" value={stats.activeUsers} icon={<Activity/>} color="amber" theme={theme}/>
      </div>

      <div className={`rounded-xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"><h3 className="text-xs font-bold uppercase flex items-center gap-2 tracking-wide"><Database size={16} className="text-blue-500"/> Base de Usuários Cloud</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`text-[10px] uppercase font-bold text-slate-400 tracking-widest ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <tr>
                <th className="px-6 py-3">Usuário / Email</th>
                <th className="px-6 py-3 text-center">Plano</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Entrou em</th>
                <th className="px-6 py-3 text-center">Vencimento</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className={`text-xs font-medium divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {users.map((user: any) => {
                const expiryDate = user.subscription_ends_at || user.trial_ends_at;
                const expired = checkIsExpired(expiryDate);
                const userName = user.full_name || user.email?.split('@')[0] || "Usuário";
                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-bold text-slate-700 dark:text-slate-200 capitalize">{userName}</div>
                      <div className="text-[10px] text-slate-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{user.plan_type === 'premium' ? 'PREMIUM' : 'TESTE'}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${!expired ? 'bg-emerald-500' : 'bg-red-500'}`}></div><span className={`uppercase text-[10px] font-bold ${!expired ? 'text-emerald-500' : 'text-red-500'}`}>{expired ? 'INATIVO' : 'ATIVO'}</span></div>
                    </td>
                    <td className="px-6 py-3 text-center text-slate-500 font-bold">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className={`px-6 py-3 text-center font-bold ${expired ? 'text-red-400' : 'text-slate-500'}`}>{expiryDate ? new Date(expiryDate).toLocaleDateString('pt-BR') : '--/--/--'}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => setSelectedUser(user)} className="text-slate-400 hover:text-blue-500 transition-colors mr-3"><Eye size={16}/></button>
                      <button onClick={() => onDeleteUser(user.id)} className="text-slate-400 hover:text-red-500 transition-colors"><UserX size={16}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selectedUser && <SaaSDetailsModal user={selectedUser} theme={theme} onClose={() => setSelectedUser(null)} onUpdateExpiry={onUpdateExpiry} />}
    </div>
  );
}