import React from 'react';
import { 
  CheckCircle, AlertCircle, Clock, UserX, CreditCard, MessageSquare, Clock3, DollarSign, ArrowUp 
} from 'lucide-react';
import { StatCard } from '../components/UiKit';

// Componente Auxiliar (exclusivo desta página)
const RecentActivityCard = ({ title, theme, items }: { title: string, theme: 'light' | 'dark', items: any[] }) => (
  <div className={`rounded-xl border shadow-sm overflow-hidden flex flex-col h-full ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
      <h3 className="text-xs font-bold uppercase flex items-center gap-2 tracking-wide text-slate-600 dark:text-slate-300">
        <Clock3 size={16} className="text-blue-500"/> {title}
      </h3>
    </div>
    <div className="flex-1 overflow-y-auto max-h-[300px] p-2 space-y-1">
      {items.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center">
           Nenhuma atividade recente
        </div>
      ) : items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign size={14} strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold truncate text-slate-700 dark:text-slate-200">{item.clientName || 'Cliente'}</div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">{new Date(item.date).toLocaleDateString('pt-BR')} • {item.method}</div>
          </div>
          <div className="text-[12px] font-black text-emerald-600">+R$ {item.amount.toFixed(2)}</div>
        </div>
      ))}
    </div>
  </div>
);

interface DashboardProps {
  clients: any[];
  theme: 'light' | 'dark';
  isExpired: (date: string) => boolean;
  sendWhatsApp: (msg: string, client: any) => void;
}

export default function Dashboard({ clients, theme, isExpired, sendWhatsApp }: DashboardProps) {
  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Ativos" value={clients.filter(c => c.status === 'active').length} icon={<CheckCircle/>} color="emerald" theme={theme} />
        <StatCard title="Pagamento Pendente" value={clients.filter(c => c.paymentStatus === 'pending').length} icon={<AlertCircle/>} color="amber" theme={theme} />
        <StatCard title="Vencidos (Hoje)" value={clients.filter(c => isExpired(c.expiresAt) && c.status === 'active').length} icon={<Clock/>} color="red" theme={theme} />
        <StatCard title="Bloqueados" value={clients.filter(c => c.status === 'blocked').length} icon={<UserX/>} color="blue" theme={theme} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`rounded-lg border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="text-xs font-bold uppercase flex items-center gap-2 tracking-wide"><CreditCard size={16} className="text-amber-500"/> Prioridade de Cobrança</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {clients.filter(c => c.paymentStatus === 'pending' || isExpired(c.expiresAt)).slice(0, 5).map(c => (
              <div key={c.id} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex flex-col min-w-0 pr-3">
                  <span className="font-semibold text-xs truncate">{c.name}</span>
                  <span className="text-[10px] opacity-60 font-medium uppercase mt-0.5">{new Date(c.expiresAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <button onClick={() => sendWhatsApp(`Olá ${c.name}, renovação pendente.`, c)} className="p-2 bg-emerald-500 text-white rounded-md shrink-0 active:scale-95 shadow-sm hover:bg-emerald-600"><MessageSquare size={14}/></button>
              </div>
            ))}
            {clients.filter(c => c.paymentStatus === 'pending' || isExpired(c.expiresAt)).length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">Nenhuma pendência hoje.</div>
            )}
          </div>
        </div>
        <RecentActivityCard title="Últimas Entradas" theme={theme} items={clients.flatMap(c => c.paymentHistory?.map((h: any) => ({...h, clientName: c.name})) || []).sort((a: any,b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)} />
      </div>
    </div>
  );
}