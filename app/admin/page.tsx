// app/admin/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Users,
  Shield,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  TrendingUp,
  Clock,
  CreditCard,
  LogOut,
  BarChart3,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  kyc_status: string;
  phone: string | null;
  created_at: string;
  balances?: { amount: number }[];
}
interface KycDoc {
  id: string;
  user_id: string;
  front_url: string;
  back_url: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}
interface Deposit {
  id: string;
  user_id: string;
  amount: string;
  screenshot_url: string | null;
  status: string;
  created_at: string;
}
interface Withdrawal {
  id: string;
  user_id: string;
  amount: string;
  bank_name: string;
  account_number: string;
  status: string;
  created_at: string;
}
interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: string;
  entry_price: string;
  result: string;
  profit_loss: string;
  status: string;
  created_at: string;
}
interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [kyc, setKyc] = useState<KycDoc[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    verified: 0,
    pendingKyc: 0,
    pendingDep: 0,
    pendingWd: 0,
    totalDep: 0,
    totalWd: 0,
    totalVolume: 0
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<KycDoc | null>(null);
  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    reason: '',
    type: 'credit' as 'credit' | 'debit'
  });
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeForm, setTradeForm] = useState({
    symbol: '',
    type: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    result: 'pending' as 'win' | 'loss' | 'pending',
    profit: ''
  });

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
    const { data, error } = await supabase.rpc('is_current_user_admin');
    if (error || !data) {
      router.push('/dashboard');
      return false;
    }
    return true;
  }

  async function loadAllData() {
    const [u, k, d, w, t, tx] = await Promise.all([
      supabase.from('users').select('*, balances(amount)'),
      supabase.from('kyc_documents').select('*'),
      supabase.from('deposits').select('*'),
      supabase.from('withdrawals').select('*'),
      supabase.from('trades').select('*'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(50)
    ]);
    setUsers(u.data ?? []);
    setKyc(k.data ?? []);
    setDeposits(d.data ?? []);
    setWithdrawals(w.data ?? []);
    setTrades(t.data ?? []);
    setTransactions(tx.data ?? []);
    setStats({
      users: (u.data ?? []).length,
      verified: (u.data ?? []).filter(x => x.is_approved).length,
      pendingKyc: (k.data ?? []).filter(x => x.status === 'pending').length,
      pendingDep: (d.data ?? []).filter(x => x.status === 'pending').length,
      pendingWd: (w.data ?? []).filter(x => x.status === 'pending').length,
      totalDep: (d.data ?? [])
        .filter(x => x.status === 'approved')
        .reduce((s, x) => s + parseFloat(x.amount), 0),
      totalWd: (w.data ?? [])
        .filter(x => x.status === 'approved')
        .reduce((s, x) => s + parseFloat(x.amount), 0),
      totalVolume: (t.data ?? []).reduce(
        (s, x) => s + parseFloat(x.quantity) * parseFloat(x.entry_price),
        0
      )
    });
  }

  async function adjustBalance() {
    if (!selectedUser || !balanceForm.amount || !balanceForm.reason) return;
    const amount = parseFloat(balanceForm.amount);
    if (isNaN(amount)) return;
    const { error } = await supabase.rpc('adjust_balance', {
      user_id: selectedUser.id,
      amount: balanceForm.type === 'debit' ? -amount : amount,
      reason: balanceForm.reason
    });
    if (error) {
      console.error('Adjust balance error:', error);
      return;
    }
    await loadAllData();
    setShowBalanceModal(false);
    setBalanceForm({ amount: '', reason: '', type: 'credit' });
  }

  async function createTrade() {
    if (
      !selectedUser ||
      !tradeForm.symbol ||
      !tradeForm.quantity ||
      !tradeForm.price
    )
      return;
    const qty = parseFloat(tradeForm.quantity);
    const price = parseFloat(tradeForm.price);
    if (isNaN(qty) || isNaN(price)) return;
    let pl = 0;
    if (tradeForm.result !== 'pending') {
      pl = parseFloat(tradeForm.profit || '0');
      if (isNaN(pl)) return;
      if (tradeForm.result === 'loss') pl = -Math.abs(pl);
    }
    const { error: tradeError } = await supabase.from('trades').insert({
      user_id: selectedUser.id,
      symbol: tradeForm.symbol,
      type: tradeForm.type,
      quantity: qty.toString(),
      entry_price: price.toString(),
      result: tradeForm.result,
      profit_loss: pl.toString(),
      status: tradeForm.result === 'pending' ? 'open' : 'closed'
    });
    if (tradeError) {
      console.error('Create trade error:', tradeError);
      return;
    }
    if (tradeForm.result !== 'pending') {
      const { error: balanceError } = await supabase.rpc('adjust_balance', {
        user_id: selectedUser.id,
        amount: pl,
        reason: `Trade ${tradeForm.result}`
      });
      if (balanceError) {
        console.error('Adjust balance after trade error:', balanceError);
      }
    }
    await loadAllData();
    setShowTradeModal(false);
    setTradeForm({
      symbol: '',
      type: 'buy',
      quantity: '',
      price: '',
      result: 'pending',
      profit: ''
    });
  }

  async function approveKyc(id: string) {
    const { error } = await supabase
      .from('kyc_documents')
      .update({ status: 'approved' })
      .eq('id', id);
    if (error) {
      console.error('Approve KYC error:', error);
      return;
    }
    const k = kyc.find(x => x.id === id);
    if (k) {
      const { error: userError } = await supabase
        .from('users')
        .update({ is_approved: true, kyc_status: 'approved' })
        .eq('id', k.user_id);
      if (userError) {
        console.error('Update user KYC status error:', userError);
      }
    }
    await loadAllData();
  }

  async function rejectKyc(id: string, notes: string) {
    const { error } = await supabase
      .from('kyc_documents')
      .update({ status: 'rejected', admin_notes: notes })
      .eq('id', id);
    if (error) {
      console.error('Reject KYC error:', error);
      return;
    }
    await loadAllData();
  }

  async function approveDeposit(id: string) {
    const d = deposits.find(x => x.id === id);
    if (!d) return;
    const { error } = await supabase
      .from('deposits')
      .update({ status: 'approved' })
      .eq('id', id);
    if (error) {
      console.error('Approve deposit error:', error);
      return;
    }
    const { error: balanceError } = await supabase.rpc('adjust_balance', {
      user_id: d.user_id,
      amount: parseFloat(d.amount),
      reason: 'Deposit'
    });
    if (balanceError) {
      console.error('Adjust balance after deposit error:', balanceError);
    }
    await loadAllData();
  }

  async function rejectDeposit(id: string, reason: string) {
    const { error } = await supabase
      .from('deposits')
      .update({ status: 'rejected', admin_notes: reason })
      .eq('id', id);
    if (error) {
      console.error('Reject deposit error:', error);
      return;
    }
    await loadAllData();
  }

  async function approveWithdrawal(id: string) {
    const w = withdrawals.find(x => x.id === id);
    if (!w) return;
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'approved' })
      .eq('id', id);
    if (error) {
      console.error('Approve withdrawal error:', error);
      return;
    }
    const { error: balanceError } = await supabase.rpc('adjust_balance', {
      user_id: w.user_id,
      amount: -parseFloat(w.amount),
      reason: 'Withdrawal'
    });
    if (balanceError) {
      console.error('Adjust balance after withdrawal error:', balanceError);
    }
    await loadAllData();
  }

  async function rejectWithdrawal(id: string, reason: string) {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'rejected', admin_notes: reason })
      .eq('id', id);
    if (error) {
      console.error('Reject withdrawal error:', error);
      return;
    }
    await loadAllData();
  }

  const badge = (s: string) => {
    const c: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
      open: 'bg-blue-500/20 text-blue-400',
      closed: 'bg-zinc-500/20 text-zinc-400'
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold ${
          c[s] || c.pending
        }`}
      >
        {s.toUpperCase()}
      </span>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-green-400" />
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" />
      <div className="relative z-10 flex">
        <aside className="w-64 bg-zinc-900/50 backdrop-blur-sm border-r border-zinc-800/50 min-h-screen p-4">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-8 w-8 text-green-400" />
            <h1 className="text-xl font-bold">Admin</h1>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'kyc', label: 'KYC', icon: FileText },
              { id: 'deposits', label: 'Deposits', icon: ArrowDownRight },
              { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
              { id: 'trades', label: 'Trades', icon: TrendingUp },
              { id: 'ledger', label: 'Ledger', icon: DollarSign }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-400/20 ${
                  activeTab === t.id
                    ? 'bg-gradient-to-r from-green-500/20 to-cyan-500/20 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/70'
                }`}
              >
                <t.icon className="h-5 w-5" />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="mt-auto flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-zinc-800/70 rounded-lg w-full transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-red-400/20"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </aside>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <button
              onClick={loadAllData}
              className="p-3 bg-zinc-900/70 backdrop-blur-sm rounded-lg hover:bg-zinc-800/70 transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-green-400/20"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Users,
                  value: stats.users,
                  label: 'Users',
                  color: 'text-blue-400'
                },
                {
                  icon: Shield,
                  value: stats.verified,
                  label: 'Verified',
                  color: 'text-green-400'
                },
                {
                  icon: ArrowDownRight,
                  value: `$${stats.totalDep.toFixed(2)}`,
                  label: 'Deposits',
                  color: 'text-green-400'
                },
                {
                  icon: ArrowUpRight,
                  value: `$${stats.totalWd.toFixed(2)}`,
                  label: 'Withdrawals',
                  color: 'text-red-400'
                },
                {
                  icon: TrendingUp,
                  value: `$${stats.totalVolume.toFixed(2)}`,
                  label: 'Volume',
                  color: 'text-purple-400'
                },
                {
                  icon: Clock,
                  value: stats.pendingKyc,
                  label: 'Pending KYC',
                  color: 'text-yellow-400'
                },
                {
                  icon: CreditCard,
                  value: stats.pendingDep,
                  label: 'Pending Deposits',
                  color: 'text-yellow-400'
                },
                {
                  icon: DollarSign,
                  value: stats.pendingWd,
                  label: 'Pending Withdrawals',
                  color: 'text-yellow-400'
                }
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-400/10"
                >
                  <s.icon className={`w-8 h-8 ${s.color} mb-2`} />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-zinc-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input
                  placeholder="Search by email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 p-3 bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                />
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-800/50">
                <table className="w-full">
                  <thead className="bg-zinc-800/70">
                    <tr>
                      <th className="p-4 text-left">User</th>
                      <th className="p-4 text-left">Balance</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u =>
                        u.email.toLowerCase().includes(search.toLowerCase())
                      )
                      .map(u => (
                        <tr
                          key={u.id}
                          className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition-colors duration-200"
                        >
                          <td className="p-4">
                            <p className="font-bold">{u.full_name || '—'}</p>
                            <p className="text-sm text-zinc-400">{u.email}</p>
                          </td>
                          <td className="p-4 text-green-400 font-bold">
                            ${(u.balances?.[0]?.amount || 0).toFixed(2)}
                          </td>
                          <td className="p-4">
                            {u.is_approved
                              ? badge('approved')
                              : badge('pending')}
                          </td>
                          <td className="p-4 flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowBalanceModal(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 rounded text-xs font-medium transition-all duration-200 transform hover:scale-105"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowTradeModal(true);
                              }}
                              className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-500 rounded text-xs font-medium transition-all duration-200 transform hover:scale-105"
                            >
                              Trade
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="space-y-3">
              {kyc.map(k => (
                <div
                  key={k.id}
                  className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-green-400/10"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">
                        {users.find(u => u.id === k.user_id)?.email ||
                          'Unknown User'}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {new Date(k.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {badge(k.status)}
                      {k.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveKyc(k.id)}
                            className="p-2 bg-green-600/80 hover:bg-green-500 rounded-full transition-all duration-200 transform hover:scale-110 hover:shadow-lg hover:shadow-green-400/30"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const r = prompt('Rejection reason:');
                              if (r) rejectKyc(k.id, r);
                            }}
                            className="p-2 bg-red-600/80 hover:bg-red-500 rounded-full transition-all duration-200 transform hover:scale-110 hover:shadow-lg hover:shadow-red-400/30"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedKyc(k)}
                            className="p-2 bg-blue-600/80 hover:bg-blue-500 rounded-full transition-all duration-200 transform hover:scale-110 hover:shadow-lg hover:shadow-blue-400/30"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'deposits' && (
            <div className="space-y-3">
              {deposits.map(d => (
                <div
                  key={d.id}
                  className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-green-400/10"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">
                        ${parseFloat(d.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {users.find(u => u.id === d.user_id)?.email ||
                          'Unknown User'}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {badge(d.status)}
                      {d.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveDeposit(d.id)}
                            className="p-2 bg-green-600/80 hover:bg-green-500 rounded-full transition-all duration-200 transform hover:scale-110 hover:shadow-lg hover:shadow-green-400/30"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const r = prompt('Rejection reason:');
                              if (r) rejectDeposit(d.id, r);
                            }}
                            className="p-2 bg-red-600/80 hover:bg-red-500 rounded-full transition-all duration-200 transform hover:scale-110 hover:shadow-lg hover:shadow-red-400/30"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {d.screenshot_url && (
                        <a
                          href={d.screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-zinc-700/80 hover:bg-zinc-600 rounded-full transition-all duration-200 transform hover:scale-110"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="space-y-3">
              {withdrawals.map(w => (
                <div
                  key={w.id}
                  className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-green-400/10"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">
                        ${parseFloat(w.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {w.bank_name} • ****{w.account_number.slice(-4)}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {badge(w.status)}
                      {w.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveWithdrawal(w.id)}
                            className="p-2 bg-green-600/80 hover:bg-green-500 rounded-full transition-all duration-200 transform hover:scale-110 hover:shadow-lg hover:shadow-green-400/30"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const r = prompt('Rejection reason:');
                              if (r) rejectWithdrawal(w.id, r);
                            }}
                            className="p-2 bg-red-600/80 hover:bg-red-500 rounded-full transition-all duration-200 transform hover:scale-110 hover:shadow-lg hover:shadow-red-400/30"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'trades' && (
            <div className="space-y-3">
              {trades.map(t => (
                <div
                  key={t.id}
                  className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-green-400/10"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold">
                      {t.symbol} {t.type.toUpperCase()}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        t.status === 'open'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-zinc-500/20 text-zinc-400'
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-zinc-400">
                      Qty: {t.quantity} @ ${t.entry_price}
                    </p>
                    <p
                      className={`font-bold ${
                        parseFloat(t.profit_loss) >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      P/L: ${parseFloat(t.profit_loss).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-3">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-green-400/10"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">{tx.type}</p>
                      <p className="text-sm text-zinc-400">
                        {users.find(u => u.id === tx.user_id)?.email ||
                          'Unknown User'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        ${Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Bal: ${tx.balance_after.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showBalanceModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowBalanceModal(false)}
        >
          <div
            className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Adjust Balance</h2>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="p-1 hover:bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={balanceForm.amount}
              onChange={e => setBalanceForm({ ...balanceForm, amount: e.target.value })}
              className="w-full p-3 bg-zinc-800/70 backdrop-blur-sm rounded-lg mb-3 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
            <select
              value={balanceForm.type}
              onChange={e =>
                setBalanceForm({
                  ...balanceForm,
                  type: e.target.value as 'credit' | 'debit'
                })
              }
              className="w-full p-3 bg-zinc-800/70 backdrop-blur-sm rounded-lg mb-3 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400/50"
            >
              <option value="credit">Credit (+)</option>
              <option value="debit">Debit (-)</option>
            </select>
            <input
              type="text"
              placeholder="Reason (e.g., bonus, correction)"
              value={balanceForm.reason}
              onChange={e => setBalanceForm({ ...balanceForm, reason: e.target.value })}
              className="w-full p-3 bg-zinc-800/70 backdrop-blur-sm rounded-lg mb-4 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
            <button
              onClick={adjustBalance}
              className="w-full p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-400/30"
            >
              Apply Adjustment
            </button>
          </div>
        </div>
      )}

      {showTradeModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowTradeModal(false)}
        >
          <div
            className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manual Trade</h2>
              <button
                onClick={() => setShowTradeModal(false)}
                className="p-1 hover:bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Symbol (e.g., BTC/USD)"
              value={tradeForm.symbol}
              onChange={e => setTradeForm({ ...tradeForm, symbol: e.target.value })}
              className="w-full p-3 bg-zinc-800/70 backdrop-blur-sm rounded-lg mb-3 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            />
            <select
              value={tradeForm.type}
              onChange={e =>
                setTradeForm({
                  ...tradeForm,
                  type: e.target.value as 'buy' | 'sell'
                })
              }
              className="w-full p-3 bg-zinc-800/70 backdrop-blur-sm rounded-lg mb-3 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={tradeForm.quantity}
              onChange={e => setTradeForm({ ...tradeForm, quantity: e.target.value })}
              className="w-full p-3 bg-zinc-800/70 backdrop-blur-sm rounded-lg mb-3 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Entry Price"
              value={tradeForm.price}
              onChange={e => setTradeForm({ ...tradeForm, price: e.target.value })}
              className="w-full p-3 bg-zinc-800/70 backdrop-blur-sm rounded-lg mb-3 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            />
            <select
              value={tradeForm.result}
              onChange={e =>
                setTradeForm({
                  ...tradeForm,
                  result: e.target.value as 'win' | 'loss' | 'pending'
                })
              }
              className="w-full p-3 bg-zinc-800/70 backdrop-blur-sm rounded-lg mb-3 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            >
              <option value="pending">Open (Pending)</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
            </select>
            {tradeForm.result !== 'pending' && (
              <input
                type="number"
                step="0.01"
                placeholder="Profit/Loss Amount"
                value={tradeForm.profit}
                onChange={e => setTradeForm({ ...tradeForm, profit: e.target.value })}
                className="w-full p-3 bg-zinc-800/70 backdrop-blur-sm rounded-lg mb-4 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
              />
            )}
            <button
              onClick={createTrade}
              className="w-full p-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-lg font-bold hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-400/30"
            >
              Execute Trade
            </button>
          </div>
        </div>
      )}

      {selectedKyc && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedKyc(null)}
        >
          <div
            className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">KYC Documents</h2>
              <button
                onClick={() => setSelectedKyc(null)}
                className="p-2 hover:bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a
                href={selectedKyc.front_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-8 bg-zinc-800/70 backdrop-blur-sm rounded-xl text-center border-2 border-dashed border-zinc-700 hover:border-green-400/50 transition-colors duration-200"
              >
                <Eye className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <span className="font-medium">Front Document</span>
              </a>
              <a
                href={selectedKyc.back_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-8 bg-zinc-800/70 backdrop-blur-sm rounded-xl text-center border-2 border-dashed border-zinc-700 hover:border-green-400/50 transition-colors duration-200"
              >
                <Eye className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <span className="font-medium">Back Document</span>
              </a>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  approveKyc(selectedKyc.id);
                  setSelectedKyc(null);
                }}
                className="flex-1 p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-400/30"
              >
                Approve KYC
              </button>
              <button
                onClick={() => {
                  const r = prompt('Rejection reason:');
                  if (r) {
                    rejectKyc(selectedKyc.id, r);
                    setSelectedKyc(null);
                  }
                }}
                className="flex-1 p-3 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg font-bold hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-red-400/30"
              >
                Reject KYC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}