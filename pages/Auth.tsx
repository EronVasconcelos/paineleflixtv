import React from 'react';
import { Tv, Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { FormInput } from '../components/UiKit';

export default function Auth({ 
  authMode, setAuthMode, authData, setAuthData, handleAuth, loading 
}: any) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/20 mb-4">
            <Tv size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white">
            Stream Manager
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Gestão Inteligente para IPTV</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex text-xs font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-4 transition-colors ${authMode === 'login' ? 'bg-white dark:bg-slate-900 text-blue-600' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-slate-600'}`}>Login</button>
            <button onClick={() => setAuthMode('signup')} className={`flex-1 py-4 transition-colors ${authMode === 'signup' ? 'bg-white dark:bg-slate-900 text-blue-600' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-slate-600'}`}>Criar Conta</button>
          </div>

          <form onSubmit={handleAuth} className="p-6 sm:p-8 space-y-4">
            {authMode === 'signup' && (
              <div className="animate-in slide-in-from-top-2 space-y-4">
                <FormInput theme="light" name="fullName" label="Nome Completo" placeholder="Seu Nome" value={authData.fullName} onChange={(e:any) => setAuthData({...authData, fullName: e.target.value})} icon={<User size={16}/>} />
                <FormInput theme="light" name="phone" label="WhatsApp" placeholder="11999999999" value={authData.phone} onChange={(e:any) => setAuthData({...authData, phone: e.target.value})} icon={<Phone size={16}/>} />
              </div>
            )}
            
            <FormInput theme="light" name="email" label="Email" type="email" placeholder="seu@email.com" value={authData.email} onChange={(e:any) => setAuthData({...authData, email: e.target.value})} icon={<Mail size={16}/>} />
            <FormInput theme="light" name="password" label="Senha" type="password" placeholder="••••••••" value={authData.password} onChange={(e:any) => setAuthData({...authData, password: e.target.value})} icon={<Lock size={16}/>} />

            <button disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase text-xs tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
              {loading ? <Loader2 size={18} className="animate-spin"/> : <>Entrar no Sistema <ArrowRight size={16}/></>}
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase mt-6 tracking-widest">© 2025 EFLIXTV • v3.0</p>
      </div>
    </div>
  );
}