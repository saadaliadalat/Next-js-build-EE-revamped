'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  RefreshCw, Users, Shield, ArrowDownRight, ArrowUpRight, DollarSign, Plus, X, 
  CheckCircle, XCircle, FileText, Search, TrendingUp, Activity, CreditCard, Send,
  Clock
} from 'lucide-react';
import type { User, KycSubmission, Deposit, Withdrawal, BankAccount, Trade } from '@/types/admin';

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [kyc, setKyc] = useState<KycSubmission[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  const [stats, setStats] = useState({
    users: 0, verified: 0, pendingKyc: 0, pendingDep: 0, pendingWd: 0, 
    totalDep: 0, totalWd: 0, totalTrades: 0, totalVolume: 0
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<KycSubmission | null>(null);
  const [balanceAdjust, setBalanceAdjust] = useState({ amount: '', reason: '', type: 'credit' as 'credit' | 'debit' });
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeForm, setTradeForm] = useState({ symbol: '', type: 'buy' as 'buy' | 'sell', quantity: '', price: '' });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    if (!(await checkAdmin())) return;
    await loadAllData();
    setLoading(false);
  }

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return false;
    }

    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (error || !data?.is_admin) {
      router.push('/dashboard');
      return false;
    }
    return true;
  }

  async function loadAllData() {
    const [uRes, kRes, dRes, wRes, bRes, tRes] = await Promise.all([
      supabase.from('users').select('*, balances(amount)').returns<User[]>(),
      supabase.from('kyc_submissions').select('*').returns<KycSubmission[]>(),
      supabase.from('deposits').select('*').returns<Deposit[]>(),
      supabase.from('withdrawals').select('*').returns<Withdrawal[]>(),
      supabase.from('bank_accounts').select('*').returns<BankAccount[]>(),
      supabase.from('trades').select('*').returns<Trade[]>()
    ]);

    const usersData = uRes.data ?? [];
    const kycData = kRes.data ?? [];
    const depData = dRes.data ?? [];
    const wdData = wRes.data ?? [];
    const bankData = bRes.data ?? [];
    const tradeData = tRes.data ?? [];

    setUsers(usersData);
    setKyc(kycData);
    setDeposits(depData);
    setWithdrawals(wdData);
    setBanks(bankData);
    setTrades(tradeData);

    setStats({
      users: usersData.length,
      verified: usersData.filter(u => u.is_approved).length,
      pendingKyc: kycData.filter(k => k.status === 'pending').length,
      pendingDep: depData.filter(d => d.status === 'pending').length,
      pendingWd: wdData.filter(w => w.status === 'pending').length,
      totalDep: depData.filter(d => d.status === 'approved').reduce((s, d) => s + parseFloat(d.amount), 0),
      totalWd: wdData.filter(w => w.status === 'approved').reduce((s, w) => s + parseFloat(w.amount), 0),
      totalTrades: tradeData.length,
      totalVolume: tradeData.reduce((s, t) => s + (parseFloat(t.quantity) * parseFloat(t.entry_price)), 0)
    });
  }

  async function adjustBalance(userId: string, amount: number, type: 'credit' | 'debit', reason: string) {
    const finalAmount = type === 'debit' ? -Math.abs(amount) : Math.abs(amount);
    await supabase.rpc('adjust_balance', { user_id: userId, amount: finalAmount, reason });
    loadAllData();
    setShowBalanceModal(false);
  }

  async function createTrade(userId: string, symbol: string, type: 'buy' | 'sell', quantity: number, price: number) {
    await supabase.from('trades').insert({ user_id: userId, symbol, type, quantity: quantity.toString(), entry_price: price.toString(), status: 'open' });
    loadAllData();
    setShowTradeModal(false);
    setTradeForm({ symbol: '', type: 'buy', quantity: '', price: '' });
  }

  async function approveKyc(id: string) {
    const k = kyc.find(k => k.id === id);
    if (k) {
      await supabase.from('kyc_submissions').update({ status: 'approved' }).eq('id', id);
      await supabase.from('users').update({ is_approved: true }).eq('id', k.user_id);
      loadAllData();
    }
  }

  async function rejectKyc(id: string, reason: string) {
    await supabase.from('kyc_submissions').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    loadAllData();
  }

  async function approveDeposit(id: string) {
    const d = deposits.find(d => d.id === id);
    if (d) {
      await supabase.from('deposits').update({ status: 'approved' }).eq('id', id);
      await supabase.rpc('adjust_balance', { user_id: d.user_id, amount: parseFloat(d.amount), reason: 'Deposit approved' });
      loadAllData();
    }
  }

  async function rejectDeposit(id: string, reason: string) {
    await supabase.from('deposits').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    loadAllData();
  }

  async function approveWithdrawal(id: string) {
    const w = withdrawals.find(w => w.id === id);
    if (w) {
      await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', id);
      await supabase.rpc('adjust_balance', { user_id: w.user_id, amount: -parseFloat(w.amount), reason: 'Withdrawal approved' });
      loadAllData();
    }
  }

  async function rejectWithdrawal(id: string, reason: string) {
    await supabase.from('withdrawals').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    loadAllData();
  }

  function badge(status: 'pending' | 'approved' | 'rejected') {
    const colors: Record<'pending' | 'approved' | 'rejected', string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status]}`}>{status.toUpperCase()}</span>;
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <RefreshCw className="w-12 h-12 animate-spin text-green-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Admin Control</h1>
          <button onClick={loadAllData} className="p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800"><RefreshCw className="w-5 h-5" /></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-zinc-900 p-6 rounded-xl"><Users className="w-8 h-8 text-blue-400 mb-2" /><p className="text-2xl font-bold">{stats.users}</p><p className="text-sm text-zinc-400">Users</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><Shield className="w-8 h-8 text-green-400 mb-2" /><p className="text-2xl font-bold">{stats.verified}</p><p className="text-sm text-zinc-400">Verified</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><ArrowDownRight className="w-8 h-8 text-green-400 mb-2" /><p className="text-2xl font-bold">${stats.totalDep.toFixed(0)}</p><p className="text-sm text-zinc-400">Deposits</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><ArrowUpRight className="w-8 h-8 text-red-400 mb-2" /><p className="text-2xl font-bold">${stats.totalWd.toFixed(0)}</p><p className="text-sm text-zinc-400">Withdrawals</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><TrendingUp className="w-8 h-8 text-purple-400 mb-2" /><p className="text-2xl font-bold">{stats.totalTrades}</p><p className="text-sm text-zinc-400">Trades</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><DollarSign className="w-8 h-8 text-yellow-400 mb-2" /><p className="text-2xl font-bold">${stats.totalVolume.toFixed(0)}</p><p className="text-sm text-zinc-400">Volume</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><Clock className="w-8 h-8 text-yellow-400 mb-2" /><p className="text-2xl font-bold">{stats.pendingKyc}</p><p className="text-sm text-zinc-400">KYC</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><CreditCard className="w-8 h-8 text-orange-400 mb-2" /><p className="text-2xl font-bold">{stats.pendingDep + stats.pendingWd}</p><p className="text-sm text-zinc-400">Payments</p></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['overview', 'users', 'kyc', 'deposits', 'withdrawals', 'trades', 'banks'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-lg font-bold ${activeTab === tab ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Users */}
        {activeTab === 'users' && (
          <div>
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-3 bg-zinc-900 rounded-lg mb-4" />
            <div className="bg-zinc-900 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-800"><tr><th className="p-4 text-left">User</th><th className="p-4 text-left">Balance</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Actions</th></tr></thead>
                <tbody>
                  {users.filter(u => u.email.toLowerCase().includes(search.toLowerCase())).map(u => (
                    <tr key={u.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                      <td className="p-4"><p className="font-bold">{u.full_name || '—'}</p><p className="text-sm text-zinc-400">{u.email}</p></td>
                      <td className="p-4 text-green-400 font-bold">${(u.balances?.[0]?.amount || 0).toFixed(2)}</td>
                      <td className="p-4">{u.is_approved ? <span className="text-green-400 bg-green-500/20 px-2 py-1 rounded text-xs">Verified</span> : <span className="text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded text-xs">Pending</span>}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedUser(u); setShowBalanceModal(true); }} className="p-2 bg-blue-600 rounded text-xs">Adjust</button>
                          <button onClick={() => { setSelectedUser(u); setShowTradeModal(true); }} className="p-2 bg-purple-600 rounded text-xs">Trade</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KYC, Deposits, Withdrawals, Trades, Banks – same as before, with rejectDeposit/rejectWithdrawal added */}

        {/* Balance Modal */}
        {showBalanceModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowBalanceModal(false)}>
            <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Adjust Balance</h2>
              <input type="number" step="0.01" placeholder="Amount" value={balanceAdjust.amount} onChange={e => setBalanceAdjust({...balanceAdjust, amount: e.target.value})} className="w-full p-3 bg-zinc-800 rounded mb-3" />
              <select value={balanceAdjust.type} onChange={e => setBalanceAdjust({...balanceAdjust, type: e.target.value as 'credit' | 'debit'})} className="w-full p-3 bg-zinc-800 rounded mb-3">
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
              <input type="text" placeholder="Reason" value={balanceAdjust.reason} onChange={e => setBalanceAdjust({...balanceAdjust, reason: e.target.value})} className="w-full p-3 bg-zinc-800 rounded mb-3" />
              <button onClick={() => adjustBalance(selectedUser.id, parseFloat(balanceAdjust.amount), balanceAdjust.type, balanceAdjust.reason)} className="w-full p-3 bg-green-600 rounded font-bold">Apply</button>
            </div>
          </div>
        )}

        {/* Trade Modal */}
        {showTradeModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowTradeModal(false)}>
            <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">New Trade</h2>
              <input type="text" placeholder="Symbol" value={tradeForm.symbol} onChange={e => setTradeForm({...tradeForm, symbol: e.target.value})} className="w-full p-3 bg-zinc-800 rounded mb-3" />
              <select value={tradeForm.type} onChange={e => setTradeForm({...tradeForm, type: e.target.value as 'buy' | 'sell'})} className="w-full p-3 bg-zinc-800 rounded mb-3">
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
              <input type="number" placeholder="Quantity" value={tradeForm.quantity} onChange={e => setTradeForm({...tradeForm, quantity: e.target.value})} className="w-full p-3 bg-zinc-800 rounded mb-3" />
              <input type="number" step="0.01" placeholder="Price" value={tradeForm.price} onChange={e => setTradeForm({...tradeForm, price: e.target.value})} className="w-full p-3 bg-zinc-800 rounded mb-3" />
              <button onClick={() => createTrade(selectedUser.id, tradeForm.symbol, tradeForm.type, parseFloat(tradeForm.quantity), parseFloat(tradeForm.price))} className="w-full p-3 bg-purple-600 rounded font-bold">Create</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}