import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Activity, TrendingUp, Briefcase } from 'lucide-react';
import PDFGenerator from './PDFGenerator';
import { useSettings } from '../contexts/SettingsContext';

export default function Dashboard({ user, transactions, currentMonthStr, expandedView }) {
  const { t } = useSettings();
  const navigate = useNavigate();

  const calcTotal = (txs, condition) => txs.filter(condition).reduce((acc, t) => acc + Number(t.amount), 0);

  const isThisMonth = (t) => {
    if (!t.date) return false;
    const parts = t.date.split('/');
    if (parts.length !== 3) return false;
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}` === currentMonthStr;
  };

  const monthlyTxs = transactions.filter(isThisMonth);

  const totalSpentAll = calcTotal(transactions, t => t.type === 'expenditure');
  const totalInvAll = calcTotal(transactions, t => t.type === 'investment' || t.type === 'saving');
  const totalSalaryAll = calcTotal(transactions, t => t.type === 'salary');

  const totalSpentMonth = calcTotal(monthlyTxs, t => t.type === 'expenditure');
  const totalInvMonth = calcTotal(monthlyTxs, t => t.type === 'investment' || t.type === 'saving');
  const totalSalaryMonth = calcTotal(monthlyTxs, t => t.type === 'salary');

  const metrics = [
    { id: 'lent', label: t('toReceive'), color: 'emerald', icon: ArrowDownLeft, allTime: calcTotal(transactions, t => t.type === 'lent' && t.status === 'pending'), monthly: calcTotal(monthlyTxs, t => t.type === 'lent' && t.status === 'pending') },
    { id: 'borrowed', label: t('toPay'), color: 'rose', icon: ArrowUpRight, allTime: calcTotal(transactions, t => t.type === 'borrowed' && t.status === 'pending'), monthly: calcTotal(monthlyTxs, t => t.type === 'borrowed' && t.status === 'pending') },
    { id: 'expenditure', label: t('totalSpent'), color: 'amber', icon: Activity, allTime: totalSpentAll, monthly: totalSpentMonth },
    { id: 'investment', label: t('savedInvested'), color: 'indigo', icon: TrendingUp, allTime: totalInvAll, monthly: totalInvMonth },
  ];

  const getColorClasses = (color) => {
    const classes = {
      emerald: 'glass-panel text-emerald-400 text-emerald-300 shadow-emerald-500/5 glow-text-emerald border-emerald-500/30',
      rose: 'glass-panel text-rose-400 text-rose-300 shadow-rose-500/5 glow-text-rose border-rose-500/30',
      amber: 'glass-panel text-amber-400 text-amber-300 shadow-amber-500/5 border-amber-500/30',
      indigo: 'glass-panel text-indigo-400 text-indigo-300 shadow-indigo-500/5 glow-text border-indigo-500/30',
    };
    return classes[color];
  };

  // Salary comparison
  const expensesRatioAll = totalSalaryAll > 0 ? ((totalSpentAll + totalInvAll) / totalSalaryAll) * 100 : 0;
  const expensesRatioMonth = totalSalaryMonth > 0 ? ((totalSpentMonth + totalInvMonth) / totalSalaryMonth) * 100 : 0;

  return (
    <div className="mb-6 space-y-6">
      {/* Salary Overview Card */}
      <div className="glass-panel rounded-[2rem] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2 text-purple-400">
            <Briefcase className="w-5 h-5" />
            <h2 className="text-sm font-bold tracking-wide uppercase">{t('salaryOverview')}</h2>
          </div>
          <PDFGenerator user={user} transactions={transactions} currentMonthStr={currentMonthStr} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">{t('allTime')} Salary</p>
            <p className="text-3xl font-extrabold text-white mb-2 tracking-tight">₹{totalSalaryAll.toFixed(2)}</p>
            <div className="w-full bg-slate-900 rounded-full h-2.5 mb-1 overflow-hidden border border-slate-700/50">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full" style={{ width: `${Math.min(expensesRatioAll, 100)}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium text-right">
              {expensesRatioAll.toFixed(1)}% Utilized
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">{t('thisMonth')} Salary</p>
            <p className="text-3xl font-extrabold text-white mb-2 tracking-tight">₹{totalSalaryMonth.toFixed(2)}</p>
            <div className="w-full bg-slate-900 rounded-full h-2.5 mb-1 overflow-hidden border border-slate-700/50">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full" style={{ width: `${Math.min(expensesRatioMonth, 100)}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium text-right">
              {expensesRatioMonth.toFixed(1)}% Utilized
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => {
          const c = getColorClasses(m.color);
          const parts = c.split(' ');
          const bgColor = parts[0];
          const borderColor = parts[1];
          const iconColor = parts[2];
          const valColor = parts[3];
          const shadowColor = parts[4];

          return (
            <div 
              key={m.label} 
              onClick={() => navigate(`/history?filter=${m.id}`)}
              className={`group cursor-pointer relative overflow-hidden ${bgColor} border ${borderColor} rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${shadowColor}`}
            >
               <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
               <div className="flex items-center gap-2 mb-4">
                 <m.icon className={`w-4 h-4 ${iconColor}`} />
                 <h2 className={`text-[11px] font-bold tracking-wider uppercase ${iconColor}`}>{m.label}</h2>
               </div>
               <div>
                 <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-widest font-semibold">{t('allTime')}</p>
                 <p className={`text-2xl font-extrabold tracking-tight drop-shadow-md ${valColor}`}>
                   ₹{m.allTime.toFixed(2)}
                 </p>
               </div>
               <div className="mt-4 pt-3 border-t border-slate-700/50">
                 <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-widest font-semibold">{t('thisMonth')}</p>
                 <p className={`text-sm font-bold tracking-tight opacity-90 ${valColor}`}>
                   ₹{m.monthly.toFixed(2)}
                 </p>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
