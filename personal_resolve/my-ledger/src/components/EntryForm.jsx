import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function EntryForm({ accounts, transactions, onAdd }) {
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expenditure');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankName, setBankName] = useState('');

  // Auto-select account based on type
  useEffect(() => {
    if (type === 'saving') {
      const savAcc = accounts.find(a => a.type === 'Savings');
      if (savAcc) setBankName(savAcc.name);
    } else if (type === 'expenditure' || type === 'lent') {
      const priAcc = accounts.find(a => a.type === 'Primary');
      if (priAcc) setBankName(priAcc.name);
    } else if (!bankName && accounts.length > 0) {
      setBankName(accounts[0].name);
    }
  }, [type, accounts]); // Intentionally omitting bankName from dependency to allow manual override later

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || !entryDate || !bankName) return;
    
    let settleWithId = null;

    if (type === 'lent' || type === 'borrowed') {
      const oppositeType = type === 'lent' ? 'borrowed' : 'lent';
      const existingMatch = transactions?.find(t => 
        t.name.toLowerCase() === name.trim().toLowerCase() && 
        t.type === oppositeType && 
        t.status === 'pending'
      );

      if (existingMatch) {
        const confirmMsg = `We found a pending '${existingMatch.type}' entry for "${existingMatch.name}" of ₹${existingMatch.amount}.\n\nIs this the same person? Do you want to settle the amount automatically?`;
        if (window.confirm(confirmMsg)) {
          settleWithId = existingMatch.id;
        }
      }
    }

    onAdd({
      name: name.trim(),
      reason: reason.trim(),
      amount: Number(amount),
      type,
      date: entryDate,
      bankName
    }, settleWithId);

    setName('');
    setReason('');
    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-[2rem] mb-6 space-y-4 relative overflow-hidden">
      {/* subtle glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <h2 className="text-sm font-bold tracking-wide uppercase text-indigo-400 mb-2">New Transaction</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Title (e.g. Dinner, Rent)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="glass-input w-full rounded-2xl px-5 py-3.5 focus:outline-none text-white shadow-inner placeholder:text-slate-500 text-sm"
        />
        <input
          type="text"
          placeholder="Reason (Optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="glass-input w-full rounded-2xl px-5 py-3.5 focus:outline-none text-white shadow-inner placeholder:text-slate-500 text-sm"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="glass-input w-full rounded-2xl pl-8 pr-4 py-3.5 focus:outline-none text-white shadow-inner placeholder:text-slate-500 text-sm font-bold"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="glass-input flex-1 rounded-2xl px-5 py-3.5 focus:outline-none text-white appearance-none cursor-pointer shadow-inner text-sm font-bold"
        >
          <option value="expenditure" className="bg-slate-900">Spent / Expenditure</option>
          <option value="investment" className="bg-slate-900">Investment</option>
          <option value="saving" className="bg-slate-900">Saving</option>
          <option value="lent" className="bg-slate-900">To Receive (Lent)</option>
          <option value="borrowed" className="bg-slate-900">To Pay (Borrowed)</option>
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          style={{ colorScheme: 'dark' }}
          className="glass-input flex-1 md:flex-none md:w-48 rounded-2xl px-5 py-3.5 focus:outline-none text-white shadow-inner text-sm font-bold"
        />
        <select
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="glass-input flex-1 rounded-2xl px-5 py-3.5 focus:outline-none text-white appearance-none cursor-pointer shadow-inner text-sm font-bold"
        >
          {accounts.length === 0 && <option value="" className="bg-slate-900">No Account</option>}
          {accounts.map(acc => (
            <option key={acc.name} value={acc.name} className="bg-slate-900">{acc.name} ({acc.type} - ₹{acc.balance.toFixed(2)})</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!name.trim() || !amount || !entryDate || !bankName}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl px-8 py-3.5 flex items-center justify-center transition-all disabled:opacity-50 font-bold shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.4)] active:scale-95 hover-lift relative z-10"
        >
          <Plus className="w-5 h-5 mr-2 stroke-[3]" /> Add Entry
        </button>
      </div>
    </form>
  );
}
