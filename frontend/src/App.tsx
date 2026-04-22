import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Plus, ArrowUpDown, IndianRupee, Loader2, AlertCircle, LogOut, Phone, Lock, User, UserPlus, ArrowLeft } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

// Global API instance to avoid duplicate interceptors
const api = axios.create({ baseURL: API_BASE_URL });

interface Expense {
  id: number;
  amount: string;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Others'];

export default function App() {
  // Single source of truth for auth
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [view, setView] = useState<'login' | 'register' | 'app'>(() => 
    localStorage.getItem('token') ? 'app' : 'login'
  );

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(uuidv4());

  // Form States
  const [loginData, setLoginData] = useState({ phone_number: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', phone_number: '', password: '', confirm_password: '' });
  const [expenseData, setExpenseData] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'date_desc' | null>('date_desc');

  // 1. Update API Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // 2. Sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        const newToken = e.newValue;
        if (newToken !== token) {
          setToken(newToken);
          setView(newToken ? 'app' : 'login');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  const fetchExpenses = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (sortOrder) params.append('sort', sortOrder);
      const response = await api.get(`/expenses/?${params.toString()}`);
      setExpenses(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setToken(null);
        setView('login');
      }
      setError('Session expired or network issue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'app' && token) fetchExpenses();
  }, [view, token, categoryFilter, sortOrder]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      const newToken = res.data.access_token;
      setToken(newToken);
      setView('app');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid phone number or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirm_password) {
      setError("Passwords don't match!");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, registerData);
      setView('login');
      setError('Account created! Please login.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setView('login');
    setExpenses([]);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/expenses/`, 
        { ...expenseData, idempotency_key: idempotencyKey },
        { headers: { 'X-Idempotency-Key': idempotencyKey } }
      );
      setExpenseData({ amount: '', category: 'Food', description: '', date: format(new Date(), "yyyy-MM-dd'T'HH:mm") });
      setIdempotencyKey(uuidv4());
      fetchExpenses();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2);
  }, [expenses]);

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-paytm-light flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-paytm-dark p-10 text-white text-center">
            <h1 className="text-4xl font-black flex justify-center items-center gap-2">
              <span className="bg-paytm-blue px-2 py-1 rounded-lg text-xl tracking-tighter">Pay</span> TM
            </h1>
            <p className="mt-4 font-bold opacity-70 uppercase text-xs tracking-[0.2em]">Money Tracker Login</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100"><AlertCircle size={18} /> {error}</div>}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input required type="tel" placeholder="Enter mobile number" className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-paytm-blue/10 border-2 border-transparent focus:border-paytm-blue transition-all outline-none font-bold" value={loginData.phone_number} onChange={e => setLoginData({...loginData, phone_number: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input required type="password" placeholder="••••••••" className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-paytm-blue/10 border-2 border-transparent focus:border-paytm-blue transition-all outline-none font-bold" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
              </div>
            </div>
            <button disabled={submitting} type="submit" className="w-full py-5 bg-paytm-blue hover:bg-paytm-dark text-white font-black rounded-2xl shadow-xl shadow-paytm-blue/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-lg">
              {submitting ? <Loader2 className="animate-spin" /> : 'Sign In'}
            </button>
            <div className="text-center pt-4 border-t border-gray-50">
              <button type="button" onClick={() => {setView('register'); setError(null);}} className="text-sm font-black text-paytm-blue hover:text-paytm-dark transition-colors uppercase tracking-widest">Create New Account</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="min-h-screen bg-paytm-light flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-paytm-blue p-10 text-white flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tighter">Sign Up</h2>
              <p className="font-bold opacity-80 uppercase text-[10px] tracking-widest mt-1">Start tracking for free</p>
            </div>
            <button onClick={() => setView('login')} className="p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-all"><ArrowLeft size={24} /></button>
          </div>
          <form onSubmit={handleRegister} className="p-10 space-y-5">
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input required type="text" placeholder="Enter your name" className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-paytm-blue/10 border-2 border-transparent focus:border-paytm-blue transition-all outline-none font-bold" value={registerData.name} onChange={e => setRegisterData({...registerData, name: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input required type="tel" placeholder="Enter mobile number" className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-paytm-blue/10 border-2 border-transparent focus:border-paytm-blue transition-all outline-none font-bold" value={registerData.phone_number} onChange={e => setRegisterData({...registerData, phone_number: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Passkey</label>
                <input required type="password" placeholder="••••" className="w-full px-5 py-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-paytm-blue/10 border-2 border-transparent focus:border-paytm-blue transition-all outline-none font-bold" value={registerData.password} onChange={e => setRegisterData({...registerData, password: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm</label>
                <input required type="password" placeholder="••••" className="w-full px-5 py-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-paytm-blue/10 border-2 border-transparent focus:border-paytm-blue transition-all outline-none font-bold" value={registerData.confirm_password} onChange={e => setRegisterData({...registerData, confirm_password: e.target.value})} />
              </div>
            </div>
            <button disabled={submitting} type="submit" className="w-full py-5 bg-paytm-dark hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-paytm-dark/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-lg mt-4">
              {submitting ? <Loader2 className="animate-spin" /> : <><UserPlus size={20} /> Create Account</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 bg-paytm-light">
      <header className="bg-paytm-dark text-white p-6 shadow-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="bg-paytm-blue px-2 py-1 rounded-lg text-lg tracking-tighter">Pay</span> TM Tracker
          </h1>
          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] opacity-60 uppercase tracking-[0.2em] font-black">Current Balance</p>
              <p className="text-2xl font-black tracking-tighter">₹{totalAmount}</p>
            </div>
            <button onClick={handleLogout} className="p-3 bg-white/10 hover:bg-red-500/20 rounded-2xl transition-all text-white/80 hover:text-white"><LogOut size={22} /></button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6 space-y-8 mt-6">
        <div className="grid lg:grid-cols-5 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-xl shadow-paytm-blue/5 border border-gray-100 overflow-hidden">
              <div className="bg-paytm-blue/5 px-8 py-6 border-b border-paytm-blue/10">
                <h2 className="font-black text-paytm-dark flex items-center gap-2 uppercase text-[10px] tracking-widest">New Transaction</h2>
              </div>
              <form onSubmit={handleExpenseSubmit} className="p-8 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                  <input required type="number" step="0.01" className="w-full px-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-paytm-blue focus:ring-8 focus:ring-paytm-blue/5 transition-all outline-none text-2xl font-black" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-paytm-blue transition-all outline-none font-bold text-gray-700" value={expenseData.category} onChange={e => setExpenseData({...expenseData, category: e.target.value})}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                    <input required type="datetime-local" className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-paytm-blue transition-all outline-none font-bold text-xs" value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <input required type="text" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-paytm-blue transition-all outline-none font-bold" placeholder="What was this for?" value={expenseData.description} onChange={e => setExpenseData({...expenseData, description: e.target.value})} />
                </div>
                <button disabled={submitting} type="submit" className="w-full py-5 bg-paytm-blue hover:bg-paytm-dark text-white font-black rounded-2xl shadow-xl shadow-paytm-blue/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-lg mt-2">
                  {submitting ? <Loader2 className="animate-spin" /> : <><Plus size={20} /> Add Expense</>}
                </button>
              </form>
            </div>
          </section>
          <section className="lg:col-span-3 space-y-6">
            <div className="flex gap-3 items-center overflow-x-auto pb-4 no-scrollbar">
              <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${!categoryFilter ? 'bg-paytm-dark text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`} onClick={() => setCategoryFilter('')}>All Transactions</div>
              {CATEGORIES.map(c => <div key={c} onClick={() => setCategoryFilter(c)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${categoryFilter === c ? 'bg-paytm-dark text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-100'}`}>{c}</div>)}
            </div>
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white">
                <h3 className="font-black text-paytm-dark text-xs uppercase tracking-widest">History</h3>
                <button onClick={() => setSortOrder(sortOrder === 'date_desc' ? null : 'date_desc')} className={`p-3 rounded-xl transition-all ${sortOrder === 'date_desc' ? 'bg-paytm-blue/10 text-paytm-blue' : 'text-gray-300 hover:bg-gray-50'}`}><ArrowUpDown size={18} /></button>
              </div>
              {loading ? <div className="p-20 flex flex-col items-center justify-center text-gray-300 gap-4"><Loader2 className="animate-spin text-paytm-blue" size={48} /><p className="text-[10px] font-black uppercase tracking-widest">Syncing with server</p></div> : expenses.length === 0 ? <div className="p-20 flex flex-col items-center justify-center text-gray-300 gap-6 text-center"><div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center"><IndianRupee size={48} /></div><p className="font-black text-gray-400 uppercase text-xs tracking-widest">No transactions yet</p></div> : <div className="divide-y divide-gray-50">{expenses.map(expense => <div key={expense.id} className="p-8 hover:bg-paytm-blue/5 transition-all flex justify-between items-center"><div className="flex gap-6 items-center"><div className="w-16 h-16 rounded-2xl bg-paytm-blue/10 text-paytm-blue flex items-center justify-center font-black text-xl">{expense.category[0].toUpperCase()}</div><div className="space-y-1"><p className="font-black text-gray-800 text-lg tracking-tight">{expense.description}</p><div className="flex items-center gap-3"><span className="bg-paytm-blue/5 text-paytm-blue px-2 py-0.5 rounded text-[10px] font-black uppercase">{expense.category}</span><span className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(expense.date), 'dd MMM, hh:mm a')}</span></div></div></div><div className="text-right"><p className="font-black text-2xl text-gray-900 tracking-tighter">₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p></div></div>)}</div>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
