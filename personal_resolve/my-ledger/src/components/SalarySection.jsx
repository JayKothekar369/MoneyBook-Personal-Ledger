import React, { useState } from 'react';
import { Briefcase, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function SalarySection({ accounts, onAdd }) {
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryDate, setSalaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBalance, setShowBalance] = useState(true);

  const salaryAcc = accounts.find(a => a.type === 'Salary');

  const handleAddSalary = (e) => {
    e.preventDefault();
    if (!salaryAmount || !salaryAcc) return;

    onAdd({
      name: 'Monthly Salary',
      reason: 'Automated Salary Credit',
      amount: Number(salaryAmount),
      type: 'salary',
      date: salaryDate,
      bankName: salaryAcc.name
    });

    setSalaryAmount('');
  };

  if (!salaryAcc) {
    return (
      <div className="glass-panel border-purple-500/20 rounded-[2rem] p-6 mb-6">
        <div className="flex items-center gap-3 text-purple-400 mb-2">
          <Briefcase className="w-5 h-5" />
          <h2 className="text-sm font-bold tracking-wide uppercase">Salary Portal</h2>
        </div>
        <p className="text-sm text-purple-300/70">Create an account with type "Salary" in the Account Manager to unlock direct salary crediting.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel border-purple-500/30 rounded-[2rem] p-6 mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-purple-400">
          <Briefcase className="w-5 h-5" />
          <h2 className="text-sm font-bold tracking-wide uppercase">Salary Portal</h2>
        </div>
        <button onClick={() => setShowBalance(!showBalance)} className="text-purple-500 hover:text-purple-400 transition-colors">
          {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">
          {salaryAcc.name} Balance
        </p>
        <p className="text-2xl font-extrabold text-purple-300 tracking-tight">
          {showBalance ? `₹${salaryAcc.balance.toFixed(2)}` : '₹ XXXX.XX'}
        </p>
      </div>

      <form onSubmit={handleAddSalary} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
            <input
              type="number"
              placeholder="Enter Salary Amount"
              min="0"
              step="0.01"
              value={salaryAmount}
              onChange={(e) => setSalaryAmount(e.target.value)}
              className="glass-input w-full border-purple-500/30 rounded-2xl pl-8 pr-4 py-3.5 focus:outline-none focus:border-purple-500 text-white font-medium"
            />
          </div>
          <input
            type="date"
            value={salaryDate}
            onChange={(e) => setSalaryDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className="glass-input w-full sm:w-48 flex-shrink-0 border-purple-500/30 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-purple-500 text-white font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={!salaryAmount}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-2xl px-6 py-3.5 flex items-center justify-center transition-all disabled:opacity-50 font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] hover-lift"
        >
          Credit Salary <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </form>
    </div>
  );
}
