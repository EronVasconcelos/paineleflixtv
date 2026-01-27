import React, { useMemo } from 'react';
import { 
  Database, Users, Activity, Crown, Star, DollarSign, Eye, UserX 
} from 'lucide-react';
import { StatCard } from '../components/UiKit';

const checkIsExpired = (date: string | null | undefined) => {
  if (!date) return true;
  return new Date(date) < new Date();
};

interface AdminProps {
  users: any[];
  theme: 'light' | 'dark';
  onSimulate: (mode: string) => void;
  onDeleteUser: (id: string) => void;
  onViewUser: (user: any) => void;
}

export default function AdminSaaS({ users, theme, onSimulate, onDeleteUser, onViewUser }: AdminProps) {
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => {
      const expiry = u.subscription_ends_at || u.trial_ends_at;
      return !checkIsExpired(expiry);
    }).length;
    const premiumUsers = users.filter(u => u.plan_type === 'premium').length;
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
        <div className="px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-bold uppercase border border-yellow-500/20 flex items-center gap-2">
          <Crown size={14} /> Modo Admin
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="MRR Estimado" value={`R$ ${stats.mrr.toFixed(2)}`} icon={<DollarSign/>} color="emerald" theme={theme}/>
        <StatCard title="Usuários Totais" value={stats.totalUsers} icon={<Users/>} color="blue" theme={theme}/>
        <StatCard title="Assinantes Premium" value={stats.premiumUsers} icon={<Star/>} color="purple" theme={theme}/>
        <StatCard title="Ativos" value={stats.activeUsers} icon={<Activity/>} color="amber" theme={theme}/>
      </div>

      <div className={`rounded-xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-xs font-bold uppercase flex items-center gap-2 tracking-wide"><Database size={16} className="text-blue-500"/> Base de Usuários Cloud</h3>
        </div>
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
              {users.map((user) => {
                const expiryDate = user.subscription_ends_at || user.trial_ends_at;
                const expired = checkIsExpired(expiryDate);
                const statusText = expired ? 'INATIVO' : 'ATIVO';
                const userName = user.full_name || user.email?.split('@')[0] || "Usuário";

                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-bold text-slate-700 dark:text-slate-200 capitalize">{userName}</div>
                      <div className="text-[10px] text-slate-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {user.plan_type === 'premium' ? 'PREMIUM' : 'TESTE'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${!expired ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className={`uppercase text-[10px] font-bold ${!expired ? 'text-emerald-500' : 'text-red-500'}`}>
                          {statusText}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center text-slate-500 font-bold">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className={`px-6 py-3 text-center font-bold ${expired ? 'text-red-400' : 'text-slate-500'}`}>
                      {expiryDate ? new Date(expiryDate).toLocaleDateString('pt-BR') : '--/--/--'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => onViewUser(user)} className="text-slate-400 hover:text-blue-500 transition-colors mr-3">
                        <Eye size={16}/>
                      </button>
                      <button 
                        onClick={() => { if(window.confirm(`Excluir o usuário ${userName}?`)) onDeleteUser(user.id) }} 
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <UserX size={16}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}