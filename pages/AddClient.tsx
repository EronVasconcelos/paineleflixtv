import React from 'react';
import { UserPlus, Check, Calendar } from 'lucide-react';
import { FormInput } from '../components/UiKit';

export default function AddClient({ theme, addFormData, setAddFormData, handleAddClient, packages, servers }: any) {
  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in fade-in">
      <div className={`p-6 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-800/50">
            <UserPlus size={20}/>
          </div>
          <h3 className="text-sm font-bold uppercase tracking-tight text-slate-800 dark:text-white">Novo Cliente</h3>
        </div>
        
        <form className="space-y-4" onSubmit={handleAddClient}>
          <FormInput theme={theme} name="name" label="Nome Completo" placeholder="Ex: João Silva" required value={addFormData.name} onChange={(e: any) => setAddFormData({...addFormData, name: e.target.value})} />
          
          <div className="grid grid-cols-2 gap-4">
            <FormInput theme={theme} name="username" label="Usuário IPTV" required value={addFormData.username} onChange={(e: any) => setAddFormData({...addFormData, username: e.target.value})} />
            <FormInput theme={theme} name="password" label="Senha IPTV" value={addFormData.password} onChange={(e: any) => setAddFormData({...addFormData, password: e.target.value})} />
          </div>

          <FormInput theme={theme} name="phone" label="WhatsApp" placeholder="Ex: 5511999999999" required value={addFormData.phone} onChange={(e: any) => setAddFormData({...addFormData, phone: e.target.value})} />

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Servidor (Saldo)</label>
            <select name="serverId" value={addFormData.serverId} onChange={(e: any) => setAddFormData({...addFormData, serverId: e.target.value})} className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none transition-all focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm focus:border-blue-500'}`}>
              <option value="">-- Selecione o Servidor (Opcional) --</option>
              {servers.map((s: any) => (
                <option key={s.id} value={s.id} disabled={s.credits <= 0}>
                  {s.name} — {s.credits} Créditos {s.credits <= 0 ? '(Esgotado)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Plano</label>
            <select name="packageId" value={addFormData.packageId} className={`w-full px-3 py-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 shadow-sm'}`} onChange={(e) => {
                const pkg = packages.find((p: any) => p.id === e.target.value);
                setAddFormData({...addFormData, packageId: e.target.value, price: pkg ? pkg.price.toString() : addFormData.price, expenses: pkg ? pkg.cost.toString() : addFormData.expenses});
              }}>
              <option value="">Personalizado</option>
              {packages.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput theme={theme} name="price" label="Preço (R$)" type="number" step="0.01" value={addFormData.price} onChange={(e: any) => setAddFormData({...addFormData, price: e.target.value})} required />
            <FormInput theme={theme} name="expenses" label="Custo Automático (R$)" type="number" value={addFormData.expenses} readOnly className="opacity-70 bg-slate-100" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput theme={theme} name="expiryDate" label="Vencimento Data" type="date" required value={addFormData.expiryDate} onChange={(e: any) => setAddFormData({...addFormData, expiryDate: e.target.value})} />
            <FormInput theme={theme} name="expiryTime" label="Hora" type="time" value={addFormData.expiryTime} onChange={(e: any) => setAddFormData({...addFormData, expiryTime: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput theme={theme} name="appName" label="Aplicativo" value={addFormData.appName} onChange={(e: any) => setAddFormData({...addFormData, appName: e.target.value})} />
            <FormInput theme={theme} name="macKey" label="Mac / Key" value={addFormData.macKey} onChange={(e: any) => setAddFormData({...addFormData, macKey: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className={`p-3 rounded-md border flex items-center gap-3 cursor-pointer select-none transition-all ${addFormData.isPaid ? 'bg-blue-600/10 border-blue-600/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`} onClick={() => setAddFormData({...addFormData, isPaid: !addFormData.isPaid})}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${addFormData.isPaid ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                {addFormData.isPaid && <Check size={14} className="text-white" strokeWidth={3} />}
              </div>
              <label className="text-[11px] font-bold uppercase cursor-pointer">Pagamento já realizado?</label>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1"><Calendar size={12}/> Data do Recebimento</label>
              <input type="date" disabled={!addFormData.isPaid} value={addFormData.paymentDate} onChange={(e) => setAddFormData({...addFormData, paymentDate: e.target.value})} className={`w-full px-3 py-2 rounded-md border text-[13px] font-medium outline-none transition-all ${!addFormData.isPaid ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-slate-50 dark:bg-slate-800 border-blue-500/50 dark:border-blue-500/50 text-slate-800 dark:text-white shadow-sm'}`} />
            </div>
          </div>

          <FormInput theme={theme} name="notes" label="Observações (Opcional)" placeholder="Ex: TV Box Sala" value={addFormData.notes} onChange={(e: any) => setAddFormData({...addFormData, notes: e.target.value})} />
          
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-md font-bold uppercase text-[12px] shadow-lg shadow-blue-600/20 mt-2 transition-all active:scale-[0.99]">Cadastrar Cliente</button>
        </form>
      </div>
    </div>
  );
}