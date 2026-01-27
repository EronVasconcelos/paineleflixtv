import React from 'react';
import { 
  Crown, CheckCircle, Shield, CreditCard, Clock, AlertTriangle, Zap 
} from 'lucide-react';

/* --- FUNÇÃO AUXILIAR (Mesma do App.tsx) --- */
const checkIsExpired = (date: string | null | undefined) => {
  if (!date) return true;
  return new Date(date) < new Date();
};

interface SubscriptionProps {
  userProfile: any;
  theme: 'light' | 'dark';
  handleSubscribe: (plan: 'monthly' | 'annual') => void;
}

export default function Subscription({ userProfile, theme, handleSubscribe }: SubscriptionProps) {
  
  // Lógica para determinar status atual
  const getStatus = () => {
    const subEnd = userProfile?.subscription_ends_at;
    const trialEnd = userProfile?.trial_ends_at;
    
    // Se tem assinatura e não venceu
    if (subEnd && !checkIsExpired(subEnd)) {
      return { type: 'premium', date: subEnd, label: 'PREMIUM ATIVO' };
    }
    // Se está no trial e não venceu
    if (trialEnd && !checkIsExpired(trialEnd)) {
      return { type: 'trial', date: trialEnd, label: 'PERÍODO DE TESTES' };
    }
    // Vencido
    return { type: 'expired', date: subEnd || trialEnd, label: 'PLANO EXPIRADO' };
  };

  const status = getStatus();
  const daysLeft = status.date ? Math.ceil((new Date(status.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* --- STATUS BANNER --- */}
      <div className={`rounded-xl border shadow-lg overflow-hidden relative ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`absolute top-0 left-0 w-full h-1 ${status.type === 'expired' ? 'bg-red-500' : status.type === 'premium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                status.type === 'expired' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                status.type === 'premium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 
                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {status.label}
              </span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {status.type === 'premium' ? 'Assinante Pro' : 'Plano Gratuito'}
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              {status.type === 'expired' ? <AlertTriangle size={14} className="text-red-500"/> : <Clock size={14} className="text-blue-500"/>}
              {status.type === 'expired' 
                ? 'Seu acesso foi bloqueado. Renove agora.' 
                : `Vencimento em: ${new Date(status.date).toLocaleDateString('pt-BR')} (${daysLeft} dias restantes)`
              }
            </div>
          </div>
          
          {status.type !== 'premium' && (
             <div className="w-full sm:w-auto">
                <button onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/20 rounded-lg font-bold uppercase text-xs tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Crown size={16} /> Quero ser Premium
                </button>
             </div>
          )}
        </div>
      </div>

      {/* --- PLANOS --- */}
      <div id="plans" className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* MENSAL */}
        <div className={`p-6 rounded-xl border-2 transition-all relative flex flex-col ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-blue-100 shadow-sm'}`}>
          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Flexibilidade</span>
            <h3 className={`text-xl font-black uppercase mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Mensal</h3>
          </div>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-sm font-bold text-slate-400">R$</span>
            <span className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>29,90</span>
            <span className="text-xs font-bold text-slate-400">/mês</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {['Gestão de Clientes Ilimitada', 'Backup Automático', 'Financeiro Completo', 'Suporte Prioritário'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase">
                <CheckCircle size={14} className="text-emerald-500 shrink-0"/> {item}
              </li>
            ))}
          </ul>
          <button onClick={() => handleSubscribe('monthly')} className={`w-full py-3 rounded-lg font-bold uppercase text-xs tracking-wider transition-all border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
            Assinar Mensal
          </button>
        </div>

        {/* ANUAL (DESTAQUE) */}
        <div className={`p-6 rounded-xl border-2 relative flex flex-col transform md:-translate-y-2 ${theme === 'dark' ? 'bg-slate-900/50 border-amber-500/30' : 'bg-white border-amber-500 shadow-xl shadow-amber-500/10'}`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-md">
            Mais Popular
          </div>
          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Economia Máxima</span>
            <h3 className={`text-xl font-black uppercase mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Anual</h3>
          </div>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-sm font-bold text-slate-400">R$</span>
            <span className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>299,90</span>
            <span className="text-xs font-bold text-slate-400">/ano</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {['Tudo do Plano Mensal', '2 Meses Grátis', 'Selo de Verificado', 'Acesso Antecipado a Novidades'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase">
                <CheckCircle size={14} className="text-amber-500 shrink-0"/> {item}
              </li>
            ))}
          </ul>
          <button onClick={() => handleSubscribe('annual')} className="w-full py-3 rounded-lg font-bold uppercase text-xs tracking-wider transition-all bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2">
            <Zap size={16} className="fill-white"/> Assinar Anual
          </button>
        </div>

      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
        <Shield size={12}/> Pagamento Seguro via Pix
      </div>
    </div>
  );
}