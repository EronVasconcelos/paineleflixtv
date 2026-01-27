import React from 'react';
import { Trash2, Edit3, Database, CheckCircle, Download, RefreshCw, History, ChevronLeft, ChevronRight, CheckCircle as CheckCircle2, XCircle, Minus } from 'lucide-react';
import { FormInput } from '../components/UiKit';

/* --- SUB-COMPONENTE: HISTÓRICO ANUAL --- */
export function HistoryTool({ theme, currentYear, setCurrentYear, clients, MONTHS }: any) {
  const getMonthStatus = (client: any, monthIndex: number, year: number) => {
    const isPaid = client.paymentHistory.some((payment: any) => {
        const payDate = new Date(payment.date);
        const startAbsolute = payDate.getFullYear() * 12 + payDate.getMonth();
        const endAbsolute = startAbsolute + payment.monthsPaid;
        const targetAbsolute = year * 12 + monthIndex;
        return targetAbsolute >= startAbsolute && targetAbsolute < endAbsolute;
    });
    if (isPaid) return 'paid';
    const targetDate = new Date(year, monthIndex, 1);
    const createdDate = new Date(client.createdAt);
    const createdNorm = new Date(createdDate.getFullYear(), createdDate.getMonth(), 1);
    const now = new Date();
    const nowNorm = new Date(now.getFullYear(), now.getMonth(), 1);
    if (targetDate < createdNorm) return 'none'; 
    if (targetDate < nowNorm) return 'late'; 
    return 'pending'; 
  };

  return (
    <div className={`rounded-lg border shadow-sm overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2"><History size={18} className="text-blue-500"/> Histórico Anual</h3>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 px-1 py-1">
              <button onClick={() => setCurrentYear(currentYear - 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><ChevronLeft size={16}/></button>
              <span className="text-xs font-bold w-12 text-center">{currentYear}</span>
              <button onClick={() => setCurrentYear(currentYear + 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><ChevronRight size={16}/></button>
          </div>
      </div>
      <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className={`${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <tr>
                      <th className={`sticky left-0 z-10 px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>Cliente</th>
                      {MONTHS.map((m: string) => <th key={m} className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center min-w-[40px]">{m}</th>)}
                  </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {clients.map((client: any) => (
                      <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className={`sticky left-0 z-10 px-4 py-3 border-r ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                              <div className="font-bold text-[12px] truncate max-w-[120px]">{client.name}</div>
                              <div className="text-[9px] text-slate-400 truncate max-w-[120px]">{client.username}</div>
                          </td>
                          {MONTHS.map((_: any, index: number) => {
                              const status = getMonthStatus(client, index, currentYear);
                              return (
                                  <td key={index} className="px-2 py-3 text-center">
                                      <div className="flex justify-center">
                                          {status === 'paid' && <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-500/10"/>}
                                          {status === 'late' && <XCircle size={16} className="text-red-500 fill-red-500/10"/>}
                                          {status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-slate-200 dark:border-slate-700"></div>}
                                          {status === 'none' && <Minus size={12} className="text-slate-200 dark:text-slate-800"/>}
                                      </div>
                                  </td>
                              );
                          })}
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
}

/* --- SUB-COMPONENTE: BACKUP --- */
export function BackupTool({ theme, handleRefreshData, isRefreshing, handleExportCSV }: any) {
  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in">
      <div className={`p-6 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-md text-white shadow-sm"><Database size={20}/></div>
          <div>
            <h3 className="text-base font-bold uppercase tracking-tight">Banco de Dados Cloud</h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Conectado ao Supabase</p>
          </div>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md flex gap-3 mb-6">
          <CheckCircle className="text-emerald-500 shrink-0" size={18}/>
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-snug">Seus dados estão sendo salvos automaticamente na nuvem.</p>
        </div>
        <button onClick={handleRefreshData} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
            {isRefreshing ? 'Sincronizando...' : <> <RefreshCw size={16}/> Sincronizar Agora </>}
        </button>
        <button onClick={handleExportCSV} className="w-full mt-3 py-3 bg-blue-600 text-white font-bold uppercase text-[11px] rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Download size={16} /> Backup CSV
        </button>
      </div>
    </div>
  );
}

/* --- SUB-COMPONENTE: PLANOS --- */
export function PlansTool({ theme, packages, editingPackage, setEditingPackage, handleSavePackage, handleDeletePackage }: any) {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h4 className="font-bold text-[13px] uppercase mb-4 text-indigo-500 tracking-wide">{editingPackage ? 'Editar Plano' : 'Novo Plano'}</h4>
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          handleSavePackage({ 
              id: editingPackage ? editingPackage.id : Math.random().toString(36).substr(2,9), 
              name: fd.get('name') as string, 
              price: Number(fd.get('price')),
              months: Number(fd.get('months')),
              credits_qty: Number(fd.get('credits_qty')),
              cost: 0 
          });
          e.currentTarget.reset();
        }}>
          <FormInput theme={theme} name="name" label="Nome do Plano" defaultValue={editingPackage?.name} placeholder="Ex: Premium 6 Meses" required />
          <div className="grid grid-cols-3 gap-3">
              <FormInput theme={theme} name="price" label="Venda (R$)" type="number" step="0.01" defaultValue={editingPackage?.price} required />
              <FormInput theme={theme} name="credits_qty" label="Qtd. Créditos" type="number" defaultValue={editingPackage?.credits_qty || 1} required />
              <FormInput theme={theme} name="months" label="Duração (Meses)" type="number" defaultValue={editingPackage?.months || 1} required />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white rounded-md font-bold uppercase text-[11px] py-3 hover:bg-indigo-700 transition-colors">
            {editingPackage ? 'Atualizar Plano' : 'Criar Plano'}
          </button>
        </form>
      </div>
      {packages.map((p: any) => (
        <div key={p.id} className={`p-4 rounded-lg border relative shadow-sm flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <div className="text-[13px] font-bold uppercase text-slate-800 dark:text-white">{p.name}</div>
            <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Venda: R$ {p.price.toFixed(2)} • {p.months} Mês(es)</div>
          </div>
          <div className="flex gap-2">
              <button onClick={() => setEditingPackage(p)} className="text-blue-400 hover:text-blue-600"><Edit3 size={16}/></button>
              <button onClick={() => handleDeletePackage(p.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- SUB-COMPONENTE: MENSAGENS --- */
export function MessagesTool({ theme, templates, handleSaveTemplate, handleDeleteTemplate }: any) {
  return (
    <div className="max-w-lg mx-auto space-y-4">
        <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h4 className="font-bold text-[13px] uppercase mb-4 text-emerald-500 tracking-wide">Nova Mensagem</h4>
          <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            handleSaveTemplate({ id: Math.random().toString(36).substr(2,9), title: (fd.get('title') as string).toUpperCase(), body: fd.get('body') as string });
            e.currentTarget.reset();
          }}>
            <FormInput theme={theme} name="title" label="Título Identificador" required />
            <textarea name="body" className={`w-full p-3 rounded-md outline-none border text-[13px] font-medium leading-relaxed ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 placeholder-slate-400'}`} rows={5} placeholder="Variáveis: {{nome}}, {{usuario}}, {{senha}}, {{vencimento}}, {{valor}}"></textarea>
            <button type="submit" className="w-full bg-emerald-600 text-white rounded-md font-bold uppercase text-[11px] py-3 hover:bg-emerald-700">Salvar Modelo</button>
          </form>
      </div>
      {templates.map((t: any) => (
        <div key={t.id} className={`p-4 rounded-lg border relative shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <button onClick={() => handleDeleteTemplate(t.id)} className="absolute top-3 right-3 text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
          <span className="text-[11px] font-bold uppercase text-blue-500 block mb-2">{t.title}</span>
          <p className="text-[12px] italic opacity-70 leading-relaxed pr-6 line-clamp-2">"{t.body}"</p>
        </div>
      ))}
    </div>
  );
}

/* --- SUB-COMPONENTE: AUTOMAÇÃO --- */
export function AutomationTool({ theme, rules, templates, handleSaveRule, handleDeleteRule }: any) {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h4 className="font-bold text-[13px] uppercase mb-4 text-emerald-500 tracking-wide">Nova Regra de Alerta</h4>
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const type = fd.get('type') as any;
          handleSaveRule({ id: Math.random().toString(36).substr(2,9), type: type, days: type === 'on_day' ? 0 : Number(fd.get('days')), time: fd.get('time') as string, templateId: fd.get('templateId') as string, isActive: true });
          e.currentTarget.reset();
        }}>
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quando Enviar?</label>
                <select name="type" className={`w-full p-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                  <option value="before">Antes do Vencimento</option>
                  <option value="on_day">No Dia do Vencimento</option>
                  <option value="after">Após o Vencimento</option>
                </select>
              </div>
              <FormInput theme={theme} name="days" label="Quantos Dias?" type="number" defaultValue="3" placeholder="Se aplicável" />
          </div>
          <div className="grid grid-cols-2 gap-3">
              <FormInput theme={theme} name="time" label="Horário do Alerta" type="time" defaultValue="09:00" required />
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qual Mensagem?</label>
                <select name="templateId" className={`w-full p-2.5 rounded-md border text-[13px] font-medium outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                  {templates.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white rounded-md font-bold uppercase text-[11px] py-3 hover:bg-emerald-700">Salvar Regra</button>
        </form>
      </div>
      {rules.map((r: any) => (
        <div key={r.id} className={`p-4 rounded-lg border relative shadow-sm flex items-center justify-between ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <div className="text-[12px] font-bold uppercase text-slate-700 dark:text-slate-200">
              {r.type === 'on_day' ? 'Dia do Vencimento' : r.type === 'before' ? `Antedência de ${r.days} dias` : `Atraso de ${r.days} dias`} • {r.time}
            </div>
            <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Modelo: {templates.find((t:any) => t.id === r.templateId)?.title || 'Desconhecido'}</div>
          </div>
          <button onClick={() => handleDeleteRule(r.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
        </div>
      ))}
    </div>
  );
}