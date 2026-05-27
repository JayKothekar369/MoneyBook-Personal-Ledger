import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AccountManager from './components/AccountManager';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import TransactionList from './components/TransactionList';
import SalarySection from './components/SalarySection';
import SavingSection from './components/SavingSection';
import AuthPage from './components/AuthPage';
import Toast from './components/Toast';
import AIChat from './components/AIChat';
import FloatingAIChat from './components/FloatingAIChat';
import { useSettings } from './contexts/SettingsContext';
import { User, TrendingUp, PiggyBank, Coins, Menu } from 'lucide-react';

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(''); // Always start at empty to force Welcome page!
  const [isLoaded, setIsLoaded] = useState(false);
  const isFirstRender = React.useRef(true);

  const [currentMonthStr, setCurrentMonthStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`;
  });

  // Initialize data from local backend server
  useEffect(() => {
    const initData = async () => {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        let loadedUsers = data.users || [];

        // One-time Migration: If server is empty, check localStorage
        if (loadedUsers.length === 0) {
          const savedUsers = localStorage.getItem('moneybook_v3_users');
          if (savedUsers) {
             loadedUsers = JSON.parse(savedUsers);
             // Push to server immediately
             await fetch('/api/data', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ users: loadedUsers })
             });
          }
        }
        
        setUsers(loadedUsers);
      } catch (e) {
        console.error("Failed to load backend data:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    initData();
  }, []);

  // Auto-save to backend whenever users state changes
  useEffect(() => {
    if (!isLoaded) return;
    
    // Prevent autosaving the initial state load which causes infinite loops!
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: users.filter(u => !u.isGuest) })
    }).catch(e => console.error("Failed to save data to backend:", e));

    // Optional: Keep local browser backup
    localStorage.setItem('moneybook_v3_users', JSON.stringify(users));
  }, [users, isLoaded]);

  // Force Welcome page by strictly returning null if no active user is explicitly selected
  const currentUser = users.find(u => u.id === activeUserId) || null;
  const accounts = currentUser?.accounts || [];
  const transactions = currentUser?.transactions || [];
  const deletedTransactions = currentUser?.deletedTransactions || [];

  const updateCurrentUser = (updater) => {
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === activeUserId) {
        const updates = typeof updater === 'function' ? updater(u) : updater;
        return { ...u, ...updates };
      }
      return u;
    }));
  };

  const setAccounts = (newAccs) => {
    updateCurrentUser(u => ({ accounts: typeof newAccs === 'function' ? newAccs(u.accounts) : newAccs }));
  };

  const setTransactions = (newTxs) => {
    updateCurrentUser(u => ({ transactions: typeof newTxs === 'function' ? newTxs(u.transactions) : newTxs }));
  };

  const handleAddTransaction = (entry, settleWithId) => {
    const dateObj = new Date(entry.date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

    const isAutoSettle = entry.type === 'salary' || entry.type === 'saving';

    const newTx = {
      id: Date.now(),
      ...entry,
      date: formattedDate,
      status: isAutoSettle ? 'settled' : 'pending',
      settledDate: isAutoSettle ? formattedDate : null
    };

    setTransactions(prevTxs => {
      let updatedTxs = [newTx, ...prevTxs];
      
      if (settleWithId) {
        const oldTx = prevTxs.find(x => x.id === settleWithId);
        if (oldTx) {
          updatedTxs = updatedTxs.map(t => {
            if (t.id === settleWithId) {
              const diff = t.amount - newTx.amount;
              if (diff <= 0) {
                return { ...t, status: 'settled', settledDate: formattedDate, amount: 0, originalAmount: t.originalAmount || t.amount };
              } else {
                return { ...t, amount: diff, partiallySettled: true, originalAmount: t.originalAmount || t.amount };
              }
            }
            if (t.id === newTx.id) {
              const diff = newTx.amount - oldTx.amount;
              if (diff <= 0) {
                return { ...t, status: 'settled', settledDate: formattedDate, amount: 0, originalAmount: newTx.amount };
              } else {
                return { ...t, amount: diff, partiallySettled: true, originalAmount: newTx.amount };
              }
            }
            return t;
          });
        }
      }
      return updatedTxs;
    });

    if (isAutoSettle && entry.bankName) {
      setAccounts(prevAccs => prevAccs.map(a => 
        a.name === entry.bankName ? { ...a, balance: a.balance + entry.amount } : a
      ));
    }
  };

  const toggleStatus = (id) => {
    let balanceDelta = 0;
    let targetBankName = '';

    setTransactions(prevTxs => prevTxs.map(t => {
      if (t.id === id) {
        const isSettling = t.status === 'pending';
        const multiplier = isSettling ? 1 : -1;

        const today = new Date();
        const todayFormatted = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        if (t.type === 'lent' || t.type === 'salary' || t.type === 'saving') {
          balanceDelta = t.amount * multiplier; // Money comes IN
        } else if (t.type === 'borrowed' || t.type === 'expenditure' || t.type === 'investment') {
          balanceDelta = -t.amount * multiplier; // Money leaves account
        }

        targetBankName = t.bankName || (accounts.length > 0 ? accounts[0].name : '');

        return { 
          ...t, 
          status: isSettling ? 'settled' : 'pending',
          settledDate: isSettling ? todayFormatted : null
        };
      }
      return t;
    }));

    setTimeout(() => {
      if (balanceDelta !== 0 && targetBankName) {
        setAccounts(prevAccs => prevAccs.map(a => {
          if (a.name === targetBankName) {
            return { ...a, balance: a.balance + balanceDelta };
          }
          return a;
        }));
      }
    }, 0);
  };

  const handlePartialSettle = (id, amount) => {
    let balanceDelta = 0;
    let targetBankName = '';

    setTransactions(prevTxs => prevTxs.map(t => {
      if (t.id === id) {
        const today = new Date();
        const todayFormatted = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        const diff = t.amount - amount;
        
        // Setup balance update
        const multiplier = 1; // Settling adds money if lent, removes if borrowed
        if (t.type === 'lent') {
          balanceDelta = amount * multiplier; 
        } else if (t.type === 'borrowed') {
          balanceDelta = -amount * multiplier;
        }

        targetBankName = t.bankName || (accounts.length > 0 ? accounts[0].name : '');

        if (diff <= 0) {
          // Fully settled
          return { 
            ...t, 
            status: 'settled', 
            settledDate: todayFormatted, 
            amount: 0, 
            originalAmount: t.originalAmount || t.amount 
          };
        } else {
          // Partially settled
          return { 
            ...t, 
            amount: diff, 
            partiallySettled: true, 
            originalAmount: t.originalAmount || t.amount 
          };
        }
      }
      return t;
    }));

    setTimeout(() => {
      if (balanceDelta !== 0 && targetBankName) {
        setAccounts(prevAccs => prevAccs.map(a => {
          if (a.name === targetBankName) {
            return { ...a, balance: a.balance + balanceDelta };
          }
          return a;
        }));
      }
    }, 0);
  };

  const deleteTx = (id) => {
    updateCurrentUser(u => {
      const txToDelete = u.transactions.find(t => t.id === id);
      if (!txToDelete) return u;
      const newTxs = u.transactions.filter(t => t.id !== id);
      const dt = u.deletedTransactions || [];
      const newDt = [txToDelete, ...dt].slice(0, 10);
      return { transactions: newTxs, deletedTransactions: newDt };
    });
  };

  const addUser = (name) => {
    const newUser = {
      id: 'user_' + Date.now(),
      name,
      accounts: [],
      transactions: [],
      deletedTransactions: []
    };
    setUsers(prev => [...prev, newUser]);
    setActiveUserId(newUser.id);
  };

  const startAsGuest = () => {
    const newUser = {
      id: 'guest_' + Date.now(),
      name: 'Guest Profile',
      isGuest: true,
      accounts: [],
      transactions: [],
      deletedTransactions: []
    };
    setUsers(prev => [...prev, newUser]);
    setActiveUserId(newUser.id);
  };

  const handleLoginSuccess = async (userId, msg) => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      setUsers(data.users || []);
      setActiveUserId(userId);
      if (msg) setToastMessage(msg);
      else setToastMessage("Successfully logged in!");
    } catch (e) {
      console.error("Failed to fetch updated users after login:", e);
    }
  };

  const deleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (activeUserId === id) {
      setActiveUserId('');
    }
  };

  const editUser = (id, newName) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, name: newName } : u));
  };

  const { theme, setTheme, language, setLanguage, t } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setActiveUserId('');
    navigate('/');
  };

  const handleDeleteProfile = async () => {
    // We will implement full logic in a separate component/modal, but for now just basic confirm
    const pwd = prompt("Enter password to confirm profile deletion:");
    if (!pwd) return;

    try {
      const res = await fetch('/api/auth/delete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: currentUser.name, password: pwd })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('Profile deleted successfully.');
        deleteUser(activeUserId);
      } else {
        setToastMessage(data.error || 'Deletion failed.');
      }
    } catch (e) {
      setToastMessage('Error connecting to server.');
    }
  };

  if (!activeUserId) {
    return (
      <>
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
        <AuthPage 
          onLoginSuccess={handleLoginSuccess} 
          onGuestLogin={startAsGuest} 
          showToast={setToastMessage}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] text-slate-200 font-sans flex overflow-hidden">
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      
      <Sidebar 
        user={currentUser}
        onLogout={handleLogout} 
        onDeleteProfile={handleDeleteProfile}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 h-screen overflow-y-auto relative">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              MoneyBook
            </h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-20">
          <Routes>
            <Route path="/" element={
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <Dashboard 
                    user={currentUser}
                    transactions={transactions} 
                    currentMonthStr={currentMonthStr} 
                  />
                  <EntryForm 
                    accounts={accounts}
                    transactions={transactions} 
                    onAdd={handleAddTransaction} 
                  />
                  {/* Show recent transactions on home */}
                  <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-bold text-slate-200 mb-4">Recent Transactions</h2>
                    <TransactionList 
                      user={currentUser}
                      transactions={transactions.slice(0, 5)}
                      deletedTransactions={[]}
                      toggleStatus={toggleStatus}
                      onSettleAmount={handlePartialSettle}
                      deleteTx={deleteTx}
                      currentMonthStr={currentMonthStr}
                      setCurrentMonthStr={setCurrentMonthStr}
                      hideFilters={true}
                    />
                    <div className="mt-4 text-center">
                      <button onClick={() => navigate('/history')} className="text-indigo-400 text-sm font-medium hover:text-indigo-300">View Full History &rarr;</button>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <SalarySection 
                    accounts={accounts} 
                    onAdd={handleAddTransaction} 
                  />
                  <SavingSection 
                    accounts={accounts} 
                    onAdd={handleAddTransaction} 
                  />
                  <AccountManager 
                    user={currentUser}
                    accounts={accounts} 
                    setAccounts={setAccounts} 
                    transactions={transactions}
                  />
                </div>
              </div>
            } />

            <Route path="/history" element={
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-slate-200">Transaction History</h1>
                <TransactionList 
                  user={currentUser}
                  transactions={transactions}
                  deletedTransactions={deletedTransactions}
                  toggleStatus={toggleStatus}
                  onSettleAmount={handlePartialSettle}
                  deleteTx={deleteTx}
                  currentMonthStr={currentMonthStr}
                  setCurrentMonthStr={setCurrentMonthStr}
                />
              </div>
            } />

            <Route path="/banks" element={
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-slate-200">Affiliated Banks</h1>
                <AccountManager 
                  user={currentUser}
                  accounts={accounts} 
                  setAccounts={setAccounts} 
                  transactions={transactions}
                  expandedView={true} 
                />
              </div>
            } />

            <Route path="/analytics" element={
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-slate-200">Analytics Dashboard</h1>
                <Dashboard 
                  user={currentUser}
                  transactions={transactions} 
                  currentMonthStr={currentMonthStr} 
                  expandedView={true}
                />
              </div>
            } />

            <Route path="/ai" element={
              <div className="space-y-6">
                <AIChat user={currentUser} transactions={transactions} />
              </div>
            } />

            <Route path="/settings" element={
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-slate-200">{t('settings')}</h1>
                <div className="text-slate-400 p-8 border border-slate-800 rounded-2xl">
                  {/* Settings UI goes here */}
                  <div className="mb-4">
                    <label className="block text-sm mb-2 text-slate-300">{t('theme')}</label>
                    <select 
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 w-full max-w-xs text-slate-200"
                    >
                      <option value="dark">{t('darkMode')}</option>
                      <option value="light">{t('lightMode')}</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-2 text-slate-300">{t('language')}</label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 w-full max-w-xs text-slate-200"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="mr">Marathi</option>
                      <option value="gu">Gujarati</option>
                    </select>
                  </div>
                  <div className="pt-6 border-t border-slate-800">
                    <button onClick={handleDeleteProfile} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-6 py-2 rounded-lg font-medium border border-rose-500/20">
                      {t('deleteProfile')}
                    </button>
                  </div>
                </div>
              </div>
            } />

          </Routes>
          
          <div className="mt-16 text-center pb-8 border-t border-slate-800/50 pt-8 z-10 relative">
            <p className="text-slate-600 text-xs font-bold tracking-widest uppercase">
              &copy; 2026 MoneyBook | Digipoint Pvt. LTD.
            </p>
          </div>
        </div>
        <FloatingAIChat user={currentUser} transactions={transactions} />
      </div>
    </div>
  );
}
