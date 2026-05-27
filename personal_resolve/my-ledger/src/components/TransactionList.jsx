import React, { useState, useEffect } from 'react';
import { Check, Trash2, Calendar, Search, SplitSquareHorizontal } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import PDFGenerator from './PDFGenerator';
import { useSettings } from '../contexts/SettingsContext';

export default function TransactionList({ user, transactions, toggleStatus, onSettleAmount, deleteTx, currentMonthStr, setCurrentMonthStr, deletedTransactions }) {
  const { t } = useSettings();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [viewMode, setViewMode] = useState('history');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    if (filter) {
      setCategoryFilter(filter);
    }
  }, [location.search]);

  const monthsSet = new Set();
  transactions.forEach(t => {
    if (t.date) {
      const parts = t.date.split('/');
      if (parts.length === 3) {
        monthsSet.add(`${parts[2]}-${parts[1].padStart(2, '0')}`);
      }
    }
  });
  if (currentMonthStr !== 'all' && !monthsSet.has(currentMonthStr)) {
    monthsSet.add(currentMonthStr);
  }
  const months = Array.from(monthsSet).sort().reverse();

  const bankNamesSet = new Set();
  transactions.forEach(t => {
    if (t.bankName) bankNamesSet.add(t.bankName);
  });
  const bankNames = Array.from(bankNamesSet).sort();

  const sourceTxs = viewMode === 'history' ? transactions : (deletedTransactions || []);

  const filteredTxs = sourceTxs.filter(t => {
    if (currentMonthStr !== 'all' && t.date) {
      const parts = t.date.split('/');
      if (parts.length === 3) {
        const monthStr = `${parts[2]}-${parts[1].padStart(2, '0')}`;
        if (monthStr !== currentMonthStr) return false;
      }
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const matchName = t.name && t.name.toLowerCase().includes(lowerSearch);
      const matchReason = t.reason && t.reason.toLowerCase().includes(lowerSearch);
      if (!matchName && !matchReason) return false;
    }

    if (categoryFilter !== 'all' && t.type !== categoryFilter) {
      return false;
    }

    if (accountFilter !== 'all' && t.bankName !== accountFilter) {
      return false;
    }

    return true;
  });

  const parseDate = (dStr) => {
    if (!dStr) return 0;
    const parts = dStr.split('/');
    if (parts.length !== 3) return 0;
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
  };

  const sortedTxs = [...filteredTxs].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return parseDate(b.date) - parseDate(a.date);
    } else if (sortBy === 'date-asc') {
      return parseDate(a.date) - parseDate(b.date);
    } else if (sortBy === 'amount-desc') {
      return Number(b.amount) - Number(a.amount);
    } else if (sortBy === 'amount-asc') {
      return Number(a.amount) - Number(b.amount);
    }
    return 0;
  });

  const getColorClasses = (type) => {
    switch(type) {
      case 'lent': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'borrowed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'investment': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'saving': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'salary': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const getLabel = (type) => {
    switch(type) {
      case 'lent': return 'Lent';
      case 'borrowed': return 'Borrowed';
      case 'investment': return 'Investment';
      case 'saving': return 'Saving';
      case 'salary': return 'Salary';
      default: return 'Spent';
    }
  };

  const getTextColor = (type, isSettled) => {
    if (isSettled) return 'text-slate-500';
    switch(type) {
      case 'lent': return 'text-emerald-400';
      case 'borrowed': return 'text-rose-400';
      case 'investment': return 'text-indigo-400';
      case 'saving': return 'text-teal-400';
      case 'salary': return 'text-purple-400';
      default: return 'text-amber-400';
    }
  };

  return (
    <div className="glass-panel rounded-[2rem] p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-lg font-bold text-slate-200">
          {viewMode === 'history' ? t('history') : t('recentlyDeleted')}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
           <PDFGenerator 
             user={user} 
             transactions={sortedTxs} 
             currentMonthStr={currentMonthStr} 
           />
           {(deletedTransactions && deletedTransactions.length > 0) && (
             <div className="flex bg-slate-900 rounded-xl overflow-hidden border border-slate-700 p-0.5">
               <button 
                 onClick={() => setViewMode('history')} 
                 className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'history' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-300'}`}
               >
                 History
               </button>
               <button 
                 onClick={() => setViewMode('deleted')} 
                 className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'deleted' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-slate-300'}`}
               >
                 Recently Deleted
               </button>
             </div>
           )}

           <div className="flex items-center gap-2 glass-input rounded-xl px-3 py-1.5">
             <Calendar className="w-4 h-4 text-slate-400" />
             <select 
               value={currentMonthStr} 
               onChange={(e) => setCurrentMonthStr(e.target.value)}
               className="bg-transparent text-sm text-slate-300 font-bold focus:outline-none appearance-none cursor-pointer pl-1 pr-3"
             >
               <option value="all" className="bg-slate-900">All Time</option>
               {months.map(m => (
                 <option key={m} value={m} className="bg-slate-900">{m}</option>
               ))}
             </select>
           </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search name or reason..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input pl-9 pr-3 py-2 rounded-xl text-sm font-medium w-full"
          />
        </div>
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="glass-input px-3 py-2 rounded-xl text-sm font-medium w-full appearance-none cursor-pointer"
        >
          <option value="all" className="bg-slate-900">All Categories</option>
          <option value="lent" className="bg-slate-900">Lent</option>
          <option value="borrowed" className="bg-slate-900">Borrowed</option>
          <option value="investment" className="bg-slate-900">Investment</option>
          <option value="saving" className="bg-slate-900">Saving</option>
          <option value="salary" className="bg-slate-900">Salary</option>
          <option value="expenditure" className="bg-slate-900">Expenditure</option>
        </select>
        <select 
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="glass-input px-3 py-2 rounded-xl text-sm font-medium w-full appearance-none cursor-pointer"
        >
          <option value="all" className="bg-slate-900">All Accounts</option>
          {bankNames.map(b => (
            <option key={b} value={b} className="bg-slate-900">{b}</option>
          ))}
        </select>
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="glass-input px-3 py-2 rounded-xl text-sm font-medium w-full appearance-none cursor-pointer"
        >
          <option value="date-desc" className="bg-slate-900">Newest First</option>
          <option value="date-asc" className="bg-slate-900">Oldest First</option>
          <option value="amount-desc" className="bg-slate-900">Amount: High to Low</option>
          <option value="amount-asc" className="bg-slate-900">Amount: Low to High</option>
        </select>
      </div>

      <div className="space-y-3">
        {sortedTxs.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-slate-700/30 rounded-[1.5rem] bg-slate-900/40">
            <p className="text-slate-400 font-medium text-sm">No transactions found for this period.</p>
          </div>
        ) : (
          sortedTxs.map((tx) => {
            const isSettled = tx.status === 'settled';
            const colorClass = getColorClasses(tx.type);
            const label = getLabel(tx.type);
            const valColor = getTextColor(tx.type, isSettled);
            const isPositive = tx.type === 'lent' || tx.type === 'salary';

            return (
              <div
                key={tx.id}
                className={`group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-2xl border transition-all duration-300 hover-lift ${
                  isSettled 
                    ? 'glass-panel opacity-60 grayscale-[10%]' 
                    : 'glass-panel hover:border-indigo-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                }`}
              >
                <div className="flex items-start md:items-center gap-4 md:gap-5 flex-1 min-w-0 mb-3 md:mb-0">
                  <button
                    onClick={() => viewMode === 'history' && toggleStatus(tx.id)}
                    disabled={viewMode === 'deleted'}
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner ${
                      isSettled
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-slate-800/80 border border-slate-600 text-slate-500 hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/30'
                    } ${viewMode === 'deleted' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Check className={`w-5 h-5 transition-transform duration-300 ${isSettled ? 'opacity-100 scale-100' : 'opacity-30 scale-75 group-hover:scale-100 group-hover:opacity-100'}`} />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${colorClass}`}>
                        {label}
                      </span>
                      {tx.partiallySettled && !isSettled && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Partially Settled
                        </span>
                      )}
                      {isSettled && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          Settled
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-600/50 shadow-inner">
                        {tx.bankName || 'Unknown A/C'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {tx.date}
                        {isSettled && tx.settledDate && (
                          <span className="ml-1.5 text-indigo-400/80 font-bold">(Settled: {tx.settledDate})</span>
                        )}
                      </span>
                    </div>
                    <p className={`font-bold text-base md:text-lg truncate transition-all duration-300 ${
                      isSettled ? 'line-through text-slate-500' : 'text-slate-100'
                    }`}>
                      {tx.name}
                    </p>
                    {tx.reason && (
                      <p className="text-xs md:text-sm text-slate-400 truncate mt-0.5 font-medium">{tx.reason}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 pl-0 md:pl-4 justify-between md:justify-end border-t border-slate-700/50 md:border-t-0 pt-3 md:pt-0">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className={`font-extrabold text-lg md:text-xl tracking-tight whitespace-nowrap ${valColor}`}>
                        {isPositive ? '+' : '-'}&#8377;{Number(tx.amount).toFixed(2)}
                      </span>
                      {tx.originalAmount && tx.originalAmount !== tx.amount && (
                        <span className="text-xs text-slate-500 line-through">
                          Orig: &#8377;{Number(tx.originalAmount).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {viewMode === 'history' && !isSettled && (tx.type === 'lent' || tx.type === 'borrowed') && (
                      <button
                        onClick={() => {
                          const amtStr = prompt(`How much amount are you settling? (Max: ${tx.amount})`);
                          if (!amtStr) return;
                          const amt = Number(amtStr);
                          if (isNaN(amt) || amt <= 0 || amt > tx.amount) {
                            alert("Invalid amount");
                            return;
                          }
                          onSettleAmount(tx.id, amt);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-xl hover:bg-indigo-500/15 transition-all font-bold text-xs border border-indigo-500/20"
                      >
                        {t('settle')}
                      </button>
                    )}
                    {viewMode === 'history' && (
                      <button
                        onClick={() => deleteTx(tx.id)}
                        className="text-slate-500 hover:text-rose-400 p-2.5 rounded-xl hover:bg-rose-500/15 transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
