import React, { useMemo } from 'react';
import { Search, MessageSquare, RotateCcw, Trash2, Eye, Pencil, RefreshCw, Archive, ClipboardCopy } from 'lucide-react';
import { FilterChip, ActionButton } from '../components/UiKit';

export default function ClientsList({ 
  clients, theme, searchTerm, setSearchTerm, 
  statusFilter, setStatusFilter, paymentFilter, setPaymentFilter,
  handlers 
}: any) {
  
  // Lógica de filtro local (copiada para garantir funcionamento)
  const filteredClients = useMemo(() => {
    return clients.filter((client: any) => {
      if (statusFilter === 'archived') {
        return client.status === 'archived' && 
               (client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                client.username.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      if (client.status === 'archived') return false;

      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            client.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'expired' 
          ? (new Date(client.expiresAt) < new Date() && client.status !== 'blocked')
          : client.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' ? true : client.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    }).sort((a:any, b:any) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
  }, [clients, searchTerm, statusFilter, paymentFilter]);

  const isExpired = (date: string) => new Date(date) < new Date();

  return (
    <div className="space-y-3 animate-in fade-in">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Buscar cliente..." className={`w-full pl-10 pr-4 py-2.5 rounded-md outline-none text-[13px] font-medium border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 pb-1">
          <FilterChip active={statusFilter === 'all' && paymentFilter === 'all'} label="Todos" theme={theme} onClick={() => { setStatusFilter('all'); setPaymentFilter('all'); }} />
          <FilterChip active={statusFilter === 'active'} label="Ativos" theme={theme} onClick={() => setStatusFilter('active')} />
          <FilterChip active={statusFilter === 'expired'} label="Vencidos" theme={theme} onClick={() => setStatusFilter('expired')} />
          <FilterChip active={statusFilter === 'blocked'} label="Blocks" theme={theme} onClick={() => setStatusFilter('blocked')} />
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>
          <FilterChip active={paymentFilter === 'paid'} label="Pagos" theme={theme} onClick={() => setPaymentFilter(paymentFilter === 'paid' ? 'all' : 'paid')} />
          <FilterChip active={paymentFilter === 'pending'} label="Pendentes" theme={theme} onClick={() => setPaymentFilter(paymentFilter === 'pending' ? 'all' : 'pending')} />
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>
          <FilterChip active={statusFilter === 'archived'} label="Arquivados" theme={theme} onClick={() => setStatusFilter('archived')} />
        </div>
      </div>

      <div className="rounded-lg border shadow-sm overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead className={`border-b ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
            <tr>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Vencimento</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Plano</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Pagto</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredClients.map((c: any) => {
                const expired = isExpired(c.expiresAt);
                return (
                  <tr key={c.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-l-4 ${c.status === 'blocked' ? 'border-l-slate-400' : expired ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px]">{c.name}</span>
                        <span className="text-[10px] opacity-60 font-medium">{c.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className={`text-[11px] font-bold ${expired && c.status === 'active' ? 'text-red-500' : ''}`}>
                          {new Date(c.expiresAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center text-[11px] font-medium uppercase">{c.packageName}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => handlers.handleToggleStatus(c)} className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${c.status === 'blocked' ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800' : expired ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>{c.status === 'blocked' ? 'Bloqueado' : expired ? 'Vencido' : 'Ativo'}</button>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => handlers.handleTogglePayment(c)} className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20'}`}>{c.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}</button>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex gap-1.5 justify-end">
                        {c.status === 'archived' ? (
                          <>
                            <ActionButton onClick={() => handlers.setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={14}/>} />
                            <ActionButton onClick={() => handlers.handleRestoreClient(c)} theme={theme} color="blue" icon={<RotateCcw size={14}/>} />
                            <ActionButton onClick={() => handlers.handleDeleteClient(c.id)} theme={theme} color="red" icon={<Trash2 size={14}/>} />
                          </>
                        ) : (
                          <>
                            <ActionButton onClick={() => handlers.setSelectedClientDetails(c)} theme={theme} color="blue" icon={<Eye size={14}/>} />
                            <ActionButton onClick={() => handlers.setSelectedClientForEdit(c)} theme={theme} color="blue" icon={<Pencil size={14}/>} />
                            <ActionButton onClick={() => handlers.setSelectedClientForMsg(c)} theme={theme} color="emerald" icon={<MessageSquare size={14}/>} />
                            <ActionButton onClick={() => handlers.setSelectedClientForRenewal(c)} theme={theme} color="amber" icon={<RefreshCw size={14}/>} />
                            <ActionButton onClick={() => handlers.handleArchiveClient(c)} theme={theme} color="amber" icon={<Archive size={14}/>} />
                            <ActionButton onClick={() => handlers.handleCopyCredentials(c)} theme={theme} color="slate" icon={<ClipboardCopy size={16}/>} />
                            <ActionButton onClick={() => handlers.handleDeleteClient(c.id)} theme={theme} color="red" icon={<Trash2 size={14}/>} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}