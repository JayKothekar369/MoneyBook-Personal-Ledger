import React, { useState } from 'react';
import { Landmark, Plus, Trash2, Wallet, Briefcase, CreditCard, Building, Eye, EyeOff, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from 'lucide-react';
import PDFGenerator from './PDFGenerator';

export default function AccountManager({ user, transactions, accounts, setAccounts, expandedView }) {
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccType, setNewAccType] = useState('Primary');
  const [hiddenBalances, setHiddenBalances] = useState({});

  const toggleHide = (name) => {
    setHiddenBalances(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    setAccounts([...accounts, { 
      name: newAccName.trim(), 
      balance: Number(newAccBalance) || 0,
      type: newAccType
    }]);
    setNewAccName('');
    setNewAccBalance('');
    setNewAccType('Primary');
  };

  const deleteAcc = (name) => {
    setAccounts(accounts.filter(a => a.name !== name));
  };

  const updateBalance = (name, newBalance) => {
    setAccounts(accounts.map(a => a.name === name ? { ...a, balance: Number(newBalance) } : a));
  };

  const handleTransaction = (name, type) => {
    const amountStr = prompt(`Enter amount to ${type === 'deposit' ? 'deposit to' : 'withdraw from'} ${name}:`);
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount");
      return;
    }

    setAccounts(accounts.map(a => {
      if (a.name === name) {
        return { ...a, balance: type === 'deposit' ? a.balance + amount : a.balance - amount };
      }
      return a;
    }));
  };

  const handleTransfer = (fromName) => {
    const toName = prompt(`Transfer from ${fromName} to which account? (Enter exact name)`);
    if (!toName || toName === fromName) return;
    
    const targetAcc = accounts.find(a => a.name.toLowerCase() === toName.toLowerCase());
    if (!targetAcc) {
      alert("Target account not found");
      return;
    }

    const amountStr = prompt(`Enter amount to transfer to ${targetAcc.name}:`);
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount");
      return;
    }

    const sourceAcc = accounts.find(a => a.name === fromName);
    if (sourceAcc.balance < amount) {
      alert("Insufficient balance in source account");
      return;
    }

    setAccounts(accounts.map(a => {
      if (a.name === fromName) {
        return { ...a, balance: a.balance - amount };
      }
      if (a.name === targetAcc.name) {
        return { ...a, balance: a.balance + amount };
      }
      return a;
    }));
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Primary': return <Wallet className="w-4 h-4" />;
      case 'Savings': return <Building className="w-4 h-4" />;
      case 'Salary': return <Briefcase className="w-4 h-4" />;
      case 'Credit': return <CreditCard className="w-4 h-4" />;
      default: return <Landmark className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'Primary': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Savings': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Salary': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'Credit': return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="glass-panel rounded-[2rem] p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="flex items-center gap-2 mb-6 text-indigo-400">
        <Landmark className="w-5 h-5" />
        <h2 className="text-sm font-bold tracking-wide uppercase">Bank Accounts</h2>
      </div>
      
      <div className="flex flex-col gap-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {accounts.map(acc => (
          <div key={acc.name} className="glass-panel rounded-2xl p-5 relative group transition-all hover:border-indigo-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] hover-lift">
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-slate-300 text-sm font-bold tracking-wide">{acc.name}</p>
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${getTypeColor(acc.type || 'Primary')}`}>
                  {getTypeIcon(acc.type || 'Primary')}
                  {acc.type || 'Primary'}
                </span>
              </div>
              <button 
                onClick={() => deleteAcc(acc.name)}
                className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-rose-500/10 ml-2 shrink-0"
                title="Delete Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center mt-3">
              <span className="text-xl font-bold text-slate-400 mr-1">₹</span>
              <div className="flex-1">
                {hiddenBalances[acc.name] ? (
                  <span className="text-2xl font-extrabold text-slate-500">XXXX.XX</span>
                ) : (
                  <input
                    type="number"
                    value={acc.balance}
                    onChange={(e) => updateBalance(acc.name, e.target.value)}
                    className="bg-transparent text-2xl font-extrabold text-white w-full focus:outline-none"
                  />
                )}
              </div>
              <button 
                onClick={() => toggleHide(acc.name)}
                className="ml-2 text-slate-500 hover:text-slate-300 transition-colors p-2"
                title={hiddenBalances[acc.name] ? "Show Balance" : "Hide Balance"}
              >
                {hiddenBalances[acc.name] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {expandedView && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => handleTransaction(acc.name, 'deposit')}
                  className="flex-1 min-w-[28%] flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 py-2 px-1 rounded-xl text-xs font-bold transition-all border border-emerald-500/20"
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" /> Deposit
                </button>
                <button 
                  onClick={() => handleTransaction(acc.name, 'withdraw')}
                  className="flex-1 min-w-[28%] flex items-center justify-center gap-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 py-2 px-1 rounded-xl text-xs font-bold transition-all border border-rose-500/20"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" /> Withdraw
                </button>
                <button 
                  onClick={() => handleTransfer(acc.name)}
                  className="flex-1 min-w-[28%] flex items-center justify-center gap-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 py-2 px-1 rounded-xl text-xs font-bold transition-all border border-indigo-500/20"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                </button>
              </div>
            )}
            
            {expandedView && (
              <div className="mt-3">
                <PDFGenerator 
                  user={user} 
                  transactions={(transactions || []).filter(t => t.bankName === acc.name)} 
                  currentMonthStr="all" 
                  bankMode={acc.name}
                />
              </div>
            )}
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="text-center py-8 px-4 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20">
             <p className="text-slate-500 font-medium text-sm">No accounts configured.</p>
          </div>
        )}
      </div>
      
      <form onSubmit={handleAdd} className="flex flex-col gap-3 pt-4 border-t border-slate-700/50">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Add New Account</h3>
        <input 
          type="text" 
          placeholder="Account Name (e.g. HDFC)" 
          value={newAccName}
          onChange={(e) => setNewAccName(e.target.value)}
          className="glass-input rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            value={newAccType}
            onChange={(e) => setNewAccType(e.target.value)}
            className="glass-input flex-1 rounded-xl px-3 py-3 text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="Primary" className="bg-slate-900">Primary</option>
            <option value="Savings" className="bg-slate-900">Savings</option>
            <option value="Salary" className="bg-slate-900">Salary</option>
            <option value="Credit" className="bg-slate-900">Credit</option>
          </select>
          <input 
            type="number" 
            placeholder="Balance" 
            value={newAccBalance}
            onChange={(e) => setNewAccBalance(e.target.value)}
            className="glass-input flex-1 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
          />
        </div>
        <button type="submit" disabled={!newAccName.trim()} className="mt-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-3.5 font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Plus className="w-5 h-5 mr-2" /> Create Account
        </button>
      </form>
    </div>
  );
}
