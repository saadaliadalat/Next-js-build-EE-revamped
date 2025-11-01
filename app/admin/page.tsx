// app/admin/page.tsx
"use client";
import { useState, useEffect } from 'react';
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
  X,
  Ban,
  Trash2,
  Phone
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  is_admin: boolean;
  kyc_status: string;
  phone: string | null;
  created_at: string;
  balances?: { available_balance: number }[];
  banned?: boolean;
}

interface KycSubmission {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  id_document_url: string;
  address_proof_url: string;
  selfie_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  created_at: string;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: string;
  payment_proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason?: string | null;
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason?: string | null;
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
  const [kyc, setKyc] = useState<KycSubmission[]>([]);
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
  const [selectedKyc, setSelectedKyc] = useState<KycSubmission | null>(null);
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
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToBan, setUserToBan] = useState<User | null>(null);

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
      supabase.from('users').select('*, balances(available_balance)'),
      supabase.from('kyc_submissions').select('*'),
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
      verified: (u.data ?? []).filter((x: User) => x.is_approved).length,
      pendingKyc: (k.data ?? []).filter((x: KycSubmission) => x.status === 'pending').length,
      pendingDep: (d.data ?? []).filter((x: Deposit) => x.status === 'pending').length,
      pendingWd: (w.data ?? []).filter((x: Withdrawal) => x.status === 'pending').length,
      totalDep: (d.data ?? [])
        .filter((x: Deposit) => x.status === 'approved')
        .reduce((s, x) => s + parseFloat(x.amount), 0),
      totalWd: (w.data ?? [])
        .filter((x: Withdrawal) => x.status === 'approved')
        .reduce((s, x) => s + parseFloat(x.amount), 0),
      totalVolume: (t.data ?? []).reduce(
        (s, x: Trade) => s + parseFloat(x.quantity) * parseFloat(x.entry_price),
        0
      )
    });
  }

  async function adjustBalance() {
    if (!selectedUser || !balanceForm.amount || !balanceForm.reason) {
      alert('Please fill all fields');
      return;
    }
    const amount = parseFloat(balanceForm.amount);
    if (isNaN(amount)) {
      alert('Invalid amount');
      return;
    }
    // ✅ FIXED: Call adjust_balance_admin with correct params
    const { error } = await supabase.rpc('adjust_balance_admin', {
      p_user_id: selectedUser.id,
      p_amount: balanceForm.type === 'debit' ? -amount : amount,
      p_reason: balanceForm.reason
    });
    if (error) {
      console.error('Adjust balance error:', error);
      alert('Error adjusting balance: ' + error.message);
      return;
    }
    alert('✅ Balance adjusted successfully!');
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
      // ✅ FIXED: Use adjust_balance_admin
      const { error: balanceError } = await supabase.rpc('adjust_balance_admin', {
        p_user_id: selectedUser.id,
        p_amount: pl,
        p_reason: `Trade ${tradeForm.result} - ${tradeForm.symbol}`
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
      .from('kyc_submissions')
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
      .from('kyc_submissions')
      .update({ status: 'rejected', rejection_reason: notes })
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
    // ✅ FIXED: Use adjust_balance_admin
    const { error: balanceError } = await supabase.rpc('adjust_balance_admin', {
      p_user_id: d.user_id,
      p_amount: parseFloat(d.amount),
      p_reason: 'Deposit'
    });
    if (balanceError) {
      console.error('Adjust balance after deposit error:', balanceError);
    }
    await loadAllData();
  }

  async function rejectDeposit(id: string, reason: string) {
    const { error } = await supabase
      .from('deposits')
      .update({ status: 'rejected', rejection_reason: reason })
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
    // ✅ FIXED: Use adjust_balance_admin
    const { error: balanceError } = await supabase.rpc('adjust_balance_admin', {
      p_user_id: w.user_id,
      p_amount: -parseFloat(w.amount),
      p_reason: 'Withdrawal'
    });
    if (balanceError) {
      console.error('Adjust balance after withdrawal error:', balanceError);
    }
    await loadAllData();
  }

  async function rejectWithdrawal(id: string, reason: string) {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id);
    if (error) {
      console.error('Reject withdrawal error:', error);
      return;
    }
    await loadAllData();
  }

  async function banUser(userId: string) {
    if (!confirm('⚠️ PERMANENT BAN: This user will be blocked from logging in. Continue?')) return;
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ banned: true, is_approved: false })
        .eq('id', userId);
      if (updateError) throw updateError;
      alert('✅ User permanently banned');
      await loadAllData();
    } catch (error: any) {
      console.error('Ban error:', error);
      alert('❌ Ban failed: ' + (error.message || 'Unknown error'));
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('⚠️ PERMANENT DELETE: This will delete all user data. Continue?')) return;
    await supabase.from('kyc_submissions').delete().eq('user_id', userId);
    await supabase.from('deposits').delete().eq('user_id', userId);
    await supabase.from('withdrawals').delete().eq('user_id', userId);
    await supabase.from('trades').delete().eq('user_id', userId);
    await supabase.from('transactions').delete().eq('user_id', userId);
    await supabase.from('balances').delete().eq('user_id', userId);
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      console.error('Delete user error:', error);
      alert('Failed to delete user');
    } else {
      alert('User deleted permanently');
      await loadAllData();
    }
  }

  const badge = (s: string) => {
    const c: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
      open: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      closed: 'bg-zinc-700/30 text-zinc-300 border border-zinc-600/30'
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${c[s] || c.pending}`}
      >
        {s.toUpperCase()}
      </span>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" />
      <div className="relative z-10 flex">
        <aside className="w-64 bg-zinc-900/60 backdrop-blur-xl border-r border-zinc-800/50 min-h-screen p-4">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-6 w-6 text-zinc-300" />
            <h1 className="text-lg font-semibold tracking-wide">ADMIN PANEL</h1>
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:bg-zinc-800/50 ${
                  activeTab === t.id
                    ? 'bg-zinc-800/70 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <t.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </nav>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="mt-auto flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 rounded-lg w-full transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <button
              onClick={loadAllData}
              className="p-2.5 bg-zinc-900/70 backdrop-blur-xl rounded-lg hover:bg-zinc-800/70 transition-all duration-200 transform hover:scale-105 border border-zinc-800/50"
            >
              <RefreshCw className="w-4 h-4 text-zinc-300" />
            </button>
          </div>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users, value: stats.users, label: 'Total Users' },
                { icon: Shield, value: stats.verified, label: 'Verified' },
                { icon: ArrowDownRight, value: `$${stats.totalDep.toFixed(2)}`, label: 'Deposits' },
                { icon: ArrowUpRight, value: `$${stats.totalWd.toFixed(2)}`, label: 'Withdrawals' },
                { icon: TrendingUp, value: `$${stats.totalVolume.toFixed(2)}`, label: 'Trading Volume' },
                { icon: Clock, value: stats.pendingKyc, label: 'Pending KYC' },
                { icon: CreditCard, value: stats.pendingDep, label: 'Pending Deposits' },
                { icon: DollarSign, value: stats.pendingWd, label: 'Pending Withdrawals' }
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/40 rounded-xl p-5 transition-all duration-200 hover:bg-zinc-800/40 hover:border-zinc-700/50"
                >
                  <s.icon className="w-6 h-6 text-zinc-400 mb-3" />
                  <p className="text-xl font-semibold text-white">{s.value}</p>
                  <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'users' && (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  placeholder="Search by email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 p-3 bg-zinc-900/60 backdrop-blur-xl rounded-lg border border-zinc-800/40 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 text-zinc-100 placeholder-zinc-500"
                />
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-xl rounded-xl overflow-hidden border border-zinc-800/40">
                <table className="w-full">
                  <thead className="bg-zinc-800/60">
                    <tr>
                      <th className="p-4 text-left text-zinc-400 text-sm font-medium">User</th>
                      <th className="p-4 text-left text-zinc-400 text-sm font-medium">Balance</th>
                      <th className="p-4 text-left text-zinc-400 text-sm font-medium">Status</th>
                      <th className="p-4 text-left text-zinc-400 text-sm font-medium">Actions</th>
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
                          className="border-t border-zinc-800/30 hover:bg-zinc-800/30 transition-colors duration-200"
                        >
                          <td className="p-4">
                            <p className="font-medium text-white">{u.full_name || '—'}</p>
                            <p className="text-xs text-zinc-500">{u.email}</p>
                          </td>
                          <td className="p-4 text-emerald-400 font-medium">
                            ${(u.balances?.[0]?.available_balance || 0).toFixed(2)}
                          </td>
                          <td className="p-4">
                            {u.banned ? (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                BANNED
                              </span>
                            ) : u.is_approved ? (
                              badge('approved')
                            ) : (
                              badge('pending')
                            )}
                          </td>
                          <td className="p-4 flex gap-1 flex-wrap">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowBalanceModal(true);
                              }}
                              className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700/50"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowTradeModal(true);
                              }}
                              className="px-2 py-1 text-xs bg-purple-800/60 hover:bg-purple-700 rounded border border-purple-700/50"
                            >
                              Trade
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowUserDetailsModal(true);
                              }}
                              className="px-2 py-1 text-xs bg-blue-800/60 hover:bg-blue-700 rounded border border-blue-700/50"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setUserToBan(u)}
                              className="px-2 py-1 text-xs bg-orange-800/60 hover:bg-orange-700 rounded border border-orange-700/50"
                            >
                              Ban
                            </button>
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="px-2 py-1 text-xs bg-red-800/60 hover:bg-red-700 rounded border border-red-700/50"
                            >
                              Delete
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
                  className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/40 rounded-xl p-4 transition-all duration-200 hover:bg-zinc-800/40"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">
                        {k.full_name} ({k.email})
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(k.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {badge(k.status)}
                      {k.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveKyc(k.id)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors duration-200 border border-zinc-700/50"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => {
                              const r = prompt('Rejection reason:');
                              if (r) rejectKyc(k.id, r);
                            }}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors duration-200 border border-zinc-700/50"
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
                          </button>
                          <button
                            onClick={() => setSelectedKyc(k)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors duration-200 border border-zinc-700/50"
                          >
                            <Eye className="w-4 h-4 text-zinc-400" />
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
                  className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/40 rounded-xl p-4 transition-all duration-200 hover:bg-zinc-800/40"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">
                        ${parseFloat(d.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-500">
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
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors duration-200 border border-zinc-700/50"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => {
                              const r = prompt('Rejection reason:');
                              if (r) rejectDeposit(d.id, r);
                            }}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors duration-200 border border-zinc-700/50"
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                      {d.payment_proof_url && (
                        <a
                          href={supabase.storage.from('deposit-proofs').getPublicUrl(d.payment_proof_url).data.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors duration-200 border border-zinc-700/50"
                        >
                          <Eye className="w-4 h-4 text-zinc-400" />
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
                  className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/40 rounded-xl p-4 transition-all duration-200 hover:bg-zinc-800/40"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">
                        ${parseFloat(w.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {w.bank_name} • ****{w.account_number.slice(-4)}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {badge(w.status)}
                      {w.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveWithdrawal(w.id)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors duration-200 border border-zinc-700/50"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => {
                              const r = prompt('Rejection reason:');
                              if (r) rejectWithdrawal(w.id, r);
                            }}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors duration-200 border border-zinc-700/50"
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
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
                  className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/40 rounded-xl p-4 transition-all duration-200 hover:bg-zinc-800/40"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-white">
                      {t.symbol} {t.type.toUpperCase()}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        t.status === 'open'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-zinc-700/30 text-zinc-300 border border-zinc-600/30'
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-zinc-400">
                      Qty: {t.quantity} @ ${t.entry_price}
                    </p>
                    <p
                      className={`font-medium ${
                        parseFloat(t.profit_loss) >= 0
                          ? 'text-emerald-400'
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
                  className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/40 rounded-xl p-4 transition-all duration-200 hover:bg-zinc-800/40"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-white">{tx.type}</p>
                      <p className="text-xs text-zinc-500">
                        {users.find(u => u.id === tx.user_id)?.email ||
                          'Unknown User'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
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

      {/* Balance Adjustment Modal */}
      {showBalanceModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          onClick={() => setShowBalanceModal(false)}
        >
          <div
            className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800/50 rounded-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">Adjust Balance</h2>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="p-1 hover:bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={balanceForm.amount}
              onChange={e => setBalanceForm({ ...balanceForm, amount: e.target.value })}
              className="w-full p-3 bg-zinc-800/60 backdrop-blur-xl rounded-lg mb-3 border border-zinc-800/40 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 text-zinc-100 placeholder-zinc-500"
            />
            <select
              value={balanceForm.type}
              onChange={e =>
                setBalanceForm({
                  ...balanceForm,
                  type: e.target.value as 'credit' | 'debit'
                })
              }
              className="w-full p-3 bg-zinc-800/60 backdrop-blur-xl rounded-lg mb-3 border border-zinc-800/40 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 text-zinc-100"
            >
              <option value="credit" className="bg-zinc-900 text-zinc-100">Credit (+)</option>
              <option value="debit" className="bg-zinc-900 text-zinc-100">Debit (-)</option>
            </select>
            <input
              type="text"
              placeholder="Reason (e.g., bonus, correction)"
              value={balanceForm.reason}
              onChange={e => setBalanceForm({ ...balanceForm, reason: e.target.value })}
              className="w-full p-3 bg-zinc-800/60 backdrop-blur-xl rounded-lg mb-4 border border-zinc-800/40 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 text-zinc-100 placeholder-zinc-500"
            />
            <button
              onClick={adjustBalance}
              className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors duration-200 border border-zinc-700/50 text-white"
            >
              Apply Adjustment
            </button>
          </div>
        </div>
      )}

      {/* Manual Trade Modal */}
      {showTradeModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          onClick={() => setShowTradeModal(false)}
        >
          <div
            className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800/50 rounded-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">Manual Trade</h2>
              <button
                onClick={() => setShowTradeModal(false)}
                className="p-1 hover:bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Symbol (e.g., BTC/USD)"
              value={tradeForm.symbol}
              onChange={e => setTradeForm({ ...tradeForm, symbol: e.target.value })}
              className="w-full p-3 bg-zinc-800/60 backdrop-blur-xl rounded-lg mb-3 border border-zinc-800/40 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 text-zinc-100 placeholder-zinc-500"
            />
            <select
              value={tradeForm.type}
              onChange={e =>
                setTradeForm({
                  ...tradeForm,
                  type: e.target.value as 'buy' | 'sell'
                })
              }
              className="w-full p-3 bg-zinc-800/60 backdrop-blur-xl rounded-lg mb-3 border border-zinc-800/40 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 text-zinc-100"
            >
              <option value="buy" className="bg-zinc-900 text-zinc-100">Buy</option>
              <option value="sell" className="bg-zinc-900 text-zinc-100">Sell</option>
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={tradeForm.quantity}
              onChange={e => setTradeForm({ ...tradeForm, quantity: e.target.value })}
              className="w-full p-3 bg-zinc-800/60 backdrop-blur-xl rounded-lg mb-3 border border-zinc-800/40 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 text-zinc-100 placeholder-zinc-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Entry Price"
              value={tradeForm.price}
              onChange={e => setTradeForm({ ...tradeForm, price: e.target.value })}
              className="w-full p-3 bg-zinc-800/60 backdrop-blur-xl rounded-lg mb-3 border border-zinc-800/40 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 text-zinc-100 placeholder-zinc-500"
            />
            <select
              value={tradeForm.result}
              onChange={e =>
                setTradeForm({
                  ...tradeForm,
                  result: e.target.value as 'win' | 'loss' | 'pending'
                })
              }
              className="w-full p-3 bg-zinc-800/60 backdrop-blur-xl rounded-lg mb-3 border border-zinc-800/40 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 text-zinc-100"
            >
              <option value="pending" className="bg-zinc-900 text-zinc-100">Open (Pending)</option>
              <option value="win" className="bg-zinc-900 text-zinc-100">Win</option>
              <option value="loss" className="bg-zinc-900 text-zinc-100">Loss</option>
            </select>
            {tradeForm.result !== 'pending' && (
              <input
                type="number"
                step="0.01"
                placeholder="Profit/Loss Amount"
                value={tradeForm.profit}
                onChange={e => setTradeForm({ ...tradeForm, profit: e.target.value })}
                className="w-full p-3 bg-zinc-800/60 backdrop-blur-xl rounded-lg mb-4 border border-zinc-800/40 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 text-zinc-100 placeholder-zinc-500"
              />
            )}
            <button
              onClick={createTrade}
              className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors duration-200 border border-zinc-700/50 text-white"
            >
              Execute Trade
            </button>
          </div>
        </div>
      )}

      {/* KYC Details Modal */}
      {selectedKyc && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedKyc(null)}
        >
          <div
            className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800/50 rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">KYC Submission</h2>
              <button
                onClick={() => setSelectedKyc(null)}
                className="p-2 hover:bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-zinc-500">Full Name</p>
                <p className="font-medium text-white">{selectedKyc.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="font-medium text-white">{selectedKyc.email}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Date of Birth</p>
                <p className="font-medium text-white">{selectedKyc.date_of_birth}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Nationality</p>
                <p className="font-medium text-white">{selectedKyc.nationality}</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs text-zinc-500">Address</p>
              <p className="font-medium text-white">
                {selectedKyc.address}, {selectedKyc.city}, {selectedKyc.state} {selectedKyc.zip_code}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <a
                href={supabase.storage.from('kyc-documents').getPublicUrl(selectedKyc.id_document_url).data.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-zinc-800/60 backdrop-blur-xl rounded-xl text-center border border-zinc-800/40 hover:border-zinc-600/50 transition-colors duration-200"
              >
                <Eye className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                <span className="font-medium text-zinc-200">ID Document</span>
              </a>
              <a
                href={supabase.storage.from('kyc-documents').getPublicUrl(selectedKyc.address_proof_url).data.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-zinc-800/60 backdrop-blur-xl rounded-xl text-center border border-zinc-800/40 hover:border-zinc-600/50 transition-colors duration-200"
              >
                <Eye className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                <span className="font-medium text-zinc-200">Address Proof</span>
              </a>
              <a
                href={supabase.storage.from('kyc-documents').getPublicUrl(selectedKyc.selfie_url).data.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-zinc-800/60 backdrop-blur-xl rounded-xl text-center border border-zinc-800/40 hover:border-zinc-600/50 transition-colors duration-200"
              >
                <Eye className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                <span className="font-medium text-zinc-200">Selfie</span>
              </a>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  approveKyc(selectedKyc.id);
                  setSelectedKyc(null);
                }}
                className="flex-1 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors duration-200 border border-zinc-700/50 text-white"
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
                className="flex-1 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors duration-200 border border-zinc-700/50 text-white"
              >
                Reject KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          onClick={() => setShowUserDetailsModal(false)}
        >
          <div
            className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800/50 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-zinc-800/50">
              <h2 className="text-xl font-semibold text-white">User Details</h2>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Full Name</p>
                  <p className="font-medium text-white">{selectedUser.full_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Email</p>
                  <p className="font-medium text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Phone</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{selectedUser.phone || '—'}</p>
                    {selectedUser.phone && (
                      <a
                        href={`tel:${selectedUser.phone}`}
                        className="p-1 hover:bg-zinc-800 rounded"
                      >
                        <Phone className="w-4 h-4 text-blue-400" />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Status</p>
                  <p className="font-medium text-white">
                    {selectedUser.banned ? 'Banned' : selectedUser.is_approved ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Admin</p>
                  <p className="font-medium text-white">
                    {selectedUser.is_admin ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Joined</p>
                  <p className="font-medium text-white">
                    {new Date(selectedUser.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  KYC Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {kyc
                    .filter(k => k.user_id === selectedUser.id)
                    .map(doc => (
                      <div key={doc.id} className="space-y-3">
                        <a
                          href={supabase.storage.from('kyc-documents').getPublicUrl(doc.id_document_url).data.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 bg-zinc-800/60 rounded-xl text-center border border-zinc-800/40 hover:border-blue-500/50 transition"
                        >
                          <Eye className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                          <span className="font-medium text-zinc-200">ID Document</span>
                        </a>
                        <a
                          href={supabase.storage.from('kyc-documents').getPublicUrl(doc.address_proof_url).data.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 bg-zinc-800/60 rounded-xl text-center border border-zinc-800/40 hover:border-blue-500/50 transition"
                        >
                          <Eye className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                          <span className="font-medium text-zinc-200">Address Proof</span>
                        </a>
                        <a
                          href={supabase.storage.from('kyc-documents').getPublicUrl(doc.selfie_url).data.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 bg-zinc-800/60 rounded-xl text-center border border-zinc-800/40 hover:border-blue-500/50 transition"
                        >
                          <Eye className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                          <span className="font-medium text-zinc-200">Selfie</span>
                        </a>
                        <div className="text-center pt-2">
                          {badge(doc.status)}
                          {doc.rejection_reason && (
                            <p className="text-xs text-red-400 mt-1">Reason: {doc.rejection_reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  {kyc.filter(k => k.user_id === selectedUser.id).length === 0 && (
                    <p className="text-zinc-500 col-span-3 text-center py-4">No KYC submissions</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {userToBan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800/50 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Ban User</h3>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to ban <span className="text-white font-bold">{userToBan.email}</span>?
              They will lose access immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  banUser(userToBan.id);
                  setUserToBan(null);
                }}
                className="flex-1 p-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium text-white"
              >
                Ban User
              </button>
              <button
                onClick={() => setUserToBan(null)}
                className="flex-1 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800/50 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-red-400 mb-4">⚠️ Delete User Permanently</h3>
            <p className="text-zinc-400 mb-6">
              This will delete <span className="text-white font-bold">{userToDelete.email}</span> and **all associated data** (KYC, deposits, trades, etc.). This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="flex-1 p-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-white"
              >
                Delete Forever
              </button>
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}