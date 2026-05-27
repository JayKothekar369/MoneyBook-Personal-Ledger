import React, { useState } from 'react';
import { PiggyBank, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function SavingSection({ accounts, onAdd }) {
  const [savingAmount, setSavingAmount] = useState('');
  const [savingDate, setSavingDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBalance, setShowBalance] = useState(true);

  const savingAcc = accounts.find(a => a.type === 'Savings');

  const handleAddSaving = (e) => {
    e.preventDefault();
    if (!savingAmount || !savingAcc) return;

    onAdd({
      name: 'Deposit to Savings',
      reason: 'Manual Saving Deposit',
      amount: Number(savingAmount),
      type: 'saving',
      date: savingDate,
      bankName: savingAcc.name
    });

    setSavingAmount('');
  };

  if (!savingAcc) {
    return (
      <div className="glass-panel border-emerald-500/20 rounded-[2rem] p-6 mb-6">
        <div className="flex items-center gap-3 text-emerald-400 mb-2">
          <PiggyBank className="w-5 h-5" />
          <h2 className="text-sm font-bold tracking-wide uppercase">Savings Portal</h2>
        </div>
        <p className="text-sm text-emerald-300/70">Create an account with type "Savings" in the Account Manager to unlock the savings portal.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel border-emerald-500/30 rounded-[2rem] p-6 mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-emerald-400">
          <PiggyBank className="w-5 h-5" />
          <h2 className="text-sm font-bold tracking-wide uppercase">Savings Portal</h2>
        </div>
        <button onClick={() => setShowBalance(!showBalance)} className="text-emerald-500 hover:text-emerald-400 transition-colors">
          {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">
          {savingAcc.name} Balance
        </p>
        <p className="text-2xl font-extrabold text-emerald-300 tracking-tight">
          {showBalance ? `₹${savingAcc.balance.toFixed(2)}` : '₹ XXXX.XX'}
        </p>
      </div>

      <form onSubmit={handleAddSaving} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
            <input
              type="number"
              placeholder="Deposit Amount"
              min="0"
              step="0.01"
              value={savingAmount}
              onChange={(e) => setSavingAmount(e.target.value)}
              className="glass-input w-full border-emerald-500/30 rounded-2xl pl-8 pr-4 py-3.5 focus:outline-none focus:border-emerald-500 text-white font-medium"
            />
          </div>
          <input
            type="date"
            value={savingDate}
            onChange={(e) => setSavingDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className="glass-input w-full sm:w-48 flex-shrink-0 border-emerald-500/30 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 text-white font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={!savingAmount}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl px-6 py-3.5 flex items-center justify-center transition-all disabled:opacity-50 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover-lift"
        >
          Add to Savings <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </form>
    </div>
  );
}
