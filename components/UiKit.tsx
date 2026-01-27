import React, { useEffect } from 'react';
import { 
  ChevronRight, CheckCircle, AlertCircle, X, ArrowUp, ArrowDownLeft 
} from 'lucide-react';

/* --- TOAST DE NOTIFICAÇÃO --- */
export const Toast = ({ message, onClose, type = 'success' }: { message: string, onClose: () => void, type?: 'success' | 'error' }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[300] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-top-2 fade-in duration-300 ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle size={20} className="stroke-[3]" /> : <AlertCircle size={20} />}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

/* --- CARD DE ESTATÍSTICA (DASHBOARD) --- */
export const StatCard = ({ title, value, icon, color, theme, trend }: { title: string, value: string | number, icon: React.ReactNode, color: string, theme: 'light' | 'dark', trend?: string }) => {
  const getColors = () => {
    switch(color) {
      case 'emerald': return theme === 'dark' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'amber': return theme === 'dark' ? 'bg-amber-900/20 text-amber-400 border-amber-900/30' : 'bg-amber-50 text-amber-600 border-amber-100';
      case 'red': return theme === 'dark' ? 'bg-red-900/20 text-red-400 border-red-900/30' : 'bg-red-50 text-red-600 border-red-100';
      case 'blue': return theme === 'dark' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' : 'bg-blue-50 text-blue-600 border-blue-100';
      case 'purple': return theme === 'dark' ? 'bg-purple-900/20 text-purple-400 border-purple-900/30' : 'bg-purple-50 text-purple-600 border-purple-100';
      default: return theme === 'dark' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };
  return (
    <div className={`p-4 rounded-xl border shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:shadow-md ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex w-full justify-between items-start mb-2">
          <div className={`p-2 rounded-lg ${getColors()}`}>
            {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
          </div>
          {trend && (
             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${trend.startsWith('+') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                {trend.startsWith('+') ? <ArrowUp size={10}/> : <ArrowDownLeft size={10}/>} {trend}
             </span>
          )}
      </div>
      <div className="text-[24px] font-black tracking-tight leading-none mb-1 text-slate-800 dark:text-slate-100 mt-1">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-slate-500">{title}</div>
    </div>
  );
};

/* --- ITENS DE MENU (SIDEBAR) --- */
export const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-all group ${active ? 'bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
    <div className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className={`text-[12px] font-semibold tracking-wide ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{label}</span>
    {active && <ChevronRight size={14} className="ml-auto text-slate-400" />}
  </button>
);

export const BottomNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
    {React.cloneElement(icon as React.ReactElement<any>, { size: active ? 24 : 22, className: active ? 'mb-1' : 'mb-1 opacity-80' })}
    <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </button>
);

export const MobileSubItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-800 rounded-md transition-all text-left">
    {icon}
    <span className="text-slate-300 text-xs font-bold uppercase tracking-wide">{label}</span>
  </button>
);

/* --- INPUTS E FILTROS --- */
export const FilterChip = ({ active, label, theme, onClick }: { active: boolean, label: string, theme: 'light' | 'dark', onClick: () => void }) => (
  <button onClick={onClick} className={`px-3.5 py-1.5 rounded-md text-[11px] font-bold uppercase whitespace-nowrap transition-all border ${active ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : theme === 'dark' ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50' }`}>
    {label}
  </button>
);

export const ActionButton = ({ onClick, theme, color, icon }: { onClick: () => void, theme: 'light' | 'dark', color: string, icon: React.ReactNode }) => {
   const getColors = () => {
    switch(color) {
      case 'blue': return theme === 'dark' ? 'text-blue-400 bg-blue-900/20 hover:bg-blue-900/40 border-blue-900/30' : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100';
      case 'emerald': return theme === 'dark' ? 'text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-900/30' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100';
      case 'amber': return theme === 'dark' ? 'text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border-amber-900/30' : 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-100';
      case 'red': return theme === 'dark' ? 'text-red-400 bg-red-900/20 hover:bg-red-900/40 border-red-900/30' : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-100';
      default: return theme === 'dark' ? 'text-slate-400 bg-slate-800/40 hover:bg-slate-800/60 border-slate-800' : 'text-slate-500 bg-slate-50 hover:bg-slate-100 border-slate-200';
    }
  };
  return (
    <button onClick={onClick} className={`p-1.5 rounded-md border transition-all active:scale-95 flex items-center justify-center ${getColors()}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
    </button>
  );
};

export const FormInput = ({ theme, label, icon, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <input {...props} className={`w-full ${icon ? 'pl-10' : 'px-3'} py-2.5 rounded-md border text-[13px] font-medium outline-none transition-all focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm focus:border-blue-500 placeholder-slate-400' }`} />
    </div>
  </div>
);

/* --- MODAL BASE --- */
export const ModalOverlay = ({ onClose, children, theme }: { onClose: () => void, children?: React.ReactNode, theme: 'light' | 'dark' }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="absolute inset-0" onClick={onClose}></div>
    <div className={`w-full max-w-md rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-900 border border-slate-200'}`}>
      {children}
    </div>
  </div>
);