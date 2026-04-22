import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Filter, ArrowUpDown, IndianRupee, Trash2, Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(uuidv4());

  // Filters & Sorting
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'date_desc' | null>('date_desc');

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (sortOrder) params.append('sort', sortOrder);

      const response = await axios.get(`${API_BASE_URL}/expenses/?${params.toString()}`);
      setExpenses(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch expenses. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, sortOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      await axios.post(`${API_BASE_URL}/expenses/`, 
        { ...formData, idempotency_key: idempotencyKey },
        { headers: { 'X-Idempotency-Key': idempotencyKey } }
      );
      
      // Reset form and key after successful submission
      setFormData({
        amount: '',
        category: 'Food',
        description: '',
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
      });
      setIdempotencyKey(uuidv4());
      fetchExpenses();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2);
  }, [expenses]);

  return (
    <div className="min-h-screen pb-10">
      {/* Header - Paytm Style */}
      <header className="bg-paytm-dark text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-paytm-blue px-2 py-1 rounded text-white text-sm">Pay</span>
            Money Tracker
          </h1>
          <div className="text-right">
            <p className="text-xs opacity-75 uppercase tracking-wider">Total Expense</p>
            <p className="text-xl font-black">₹{totalAmount}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 text-red-700 rounded shadow-sm">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-5 gap-6">
          {/* Add Expense Form - Mobile first cards */}
          <section className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-paytm-blue/10 px-6 py-4 border-b border-paytm-blue/10">
                <h2 className="font-bold text-paytm-dark flex items-center gap-2">
                  <Plus size={18} /> Add New Expense
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-paytm-blue focus:ring-4 focus:ring-paytm-blue/10 transition-all outline-none text-lg font-semibold"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-paytm-blue focus:ring-4 focus:ring-paytm-blue/10 transition-all outline-none"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                  <input
                    required
                    type="text"
                    placeholder="What was this for?"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-paytm-blue focus:ring-4 focus:ring-paytm-blue/10 transition-all outline-none"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-paytm-blue focus:ring-4 focus:ring-paytm-blue/10 transition-all outline-none"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <button
                  disabled={submitting}
                  type="submit"
                  className="w-full py-4 bg-paytm-blue hover:bg-paytm-blue/90 text-white font-bold rounded-xl shadow-md shadow-paytm-blue/20 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2 mt-2"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                  Add Expense
                </button>
              </form>
            </div>
          </section>

          {/* Expense List */}
          <section className="md:col-span-3 space-y-4">
            <div className="flex gap-2 items-center overflow-x-auto pb-2 no-scrollbar">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${!categoryFilter ? 'bg-paytm-dark text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`} onClick={() => setCategoryFilter('')}>All</div>
              {CATEGORIES.map(c => (
                <div 
                  key={c} 
                  onClick={() => setCategoryFilter(c)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${categoryFilter === c ? 'bg-paytm-dark text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-100'}`}
                >
                  {c}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0">
                <h3 className="font-bold text-gray-800">Recent Transactions</h3>
                <button 
                  onClick={() => setSortOrder(sortOrder === 'date_desc' ? null : 'date_desc')}
                  className={`p-2 rounded-lg transition-colors ${sortOrder === 'date_desc' ? 'bg-paytm-blue/10 text-paytm-blue' : 'text-gray-400 hover:bg-gray-50'}`}
                  title="Sort by newest"
                >
                  <ArrowUpDown size={18} />
                </button>
              </div>

              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-4">
                  <Loader2 className="animate-spin text-paytm-blue" size={32} />
                  <p className="text-sm font-medium">Fetching transactions...</p>
                </div>
              ) : expenses.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-4 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <IndianRupee size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">No expenses found</p>
                    <p className="text-sm">Start by adding your first transaction!</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {expenses.map(expense => (
                    <div key={expense.id} className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-xl bg-paytm-blue/10 text-paytm-blue flex items-center justify-center font-bold">
                          {expense.category[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{expense.description}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="bg-gray-100 px-2 py-0.5 rounded uppercase">{expense.category}</span>
                            • {format(new Date(expense.date), 'dd MMM yyyy, hh:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-gray-900 leading-none">
                          ₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
