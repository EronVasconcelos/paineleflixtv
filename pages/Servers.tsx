import React from 'react';
import { LinkIcon, Trash2, Plus } from 'lucide-react';
import { FormInput } from '../components/UiKit';

export default function Servers({ theme, servers, handleSaveServer, handleDeleteServer, setSelectedServerForCredit }: any) {
  return (
    <div className="max-w-lg mx-auto space-y-4 animate-in fade-in">
        <div className={`p-5 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h4 className="font-bold text-[13px] uppercase mb-4 text-purple-500 tracking-wide">Adicionar Servidor</h4>
          <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            handleSaveServer({ name: fd.get('name'), url: fd.get('url') });
            e.currentTarget.reset();
          }}>
            <FormInput theme={theme} name="name" label="Nome do Servidor" placeholder="Ex: Servidor Principal" required />
            <FormInput theme={theme} name="url" label="Link / DNS" placeholder="http://..." required />
            <button type="submit" className="w-full bg-purple-600 text-white rounded-md font-bold uppercase text-[11px] py-3 hover:bg-purple-700 transition-colors">Salvar Servidor</button>
          </form>
      </div>
      
      {servers.map((s: any) => (
        <div key={s.id} className={`p-4 rounded-lg border relative shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-start mb-2">
              <div>
                  <span className="text-[13px] font-bold uppercase text-slate-800 dark:text-white block">{s.name}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-1"><LinkIcon size={12}/> {s.url}</div>
              </div>
              <button onClick={() => handleDeleteServer(s.id)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between">
              <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Saldo Atual</span>
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{s.credits}</span>
              </div>
              <button onClick={() => setSelectedServerForCredit(s)} className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-md text-[10px] font-bold uppercase border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center gap-2 transition-colors">
                  <Plus size={14}/> Add / Custo
              </button>
          </div>

          {s.transactions && s.transactions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Histórico de Compras</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {s.transactions.map((t: any) => (
                          <div key={t.id} className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-500 dark:text-slate-400">
                                  {new Date(t.date).toLocaleDateString('pt-BR')}
                              </span>
                              <div className="flex gap-3">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">+{t.amount} Créditos</span>
                                  <span className="font-bold text-red-500">- R$ {Number(t.cost).toFixed(2)}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>
      ))}
    </div>
  );
}