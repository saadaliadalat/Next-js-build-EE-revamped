'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  RefreshCw, Users, Shield, ArrowDownRight, ArrowUpRight, DollarSign, Plus, X, 
  CheckCircle, XCircle, FileText, Search, TrendingUp, Activity, CreditCard, Send 
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
    if (!user) { router.push('/auth/login'); return false; }

    const { data, error } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
    if (error || !data?.is_admin) { alert('Admin only'); router.push('/dashboard'); return false; }
    return true;
  }

  async function loadAllData() {
    const [uRes, kRes, dRes, wRes, bRes, tRes] = await Promise.all([
      supabase.from('users').select('*, balances(available_balance, pending_balance)').returns<User[]>(),
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
    await supabase.from('trades').insert({ user_id: userId, symbol, type, quantity, entry_price: price, status: 'open' });
    loadAllData();
    setShowTradeModal(false);
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
      await supabase.rpc('credit_balance', { uid: d.user_id, amt: parseFloat(d.amount) });
      loadAllData();
    }
  }

  async function approveWithdrawal(id: string) {
    const w = withdrawals.find(w => w.id === id);
    if (w) {
      await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', id);
      await supabase.rpc('debit_balance', { uid: w.user_id, amt: parseFloat(w.amount) });
      loadAllData();
    }
  }

  function badge(status: string) {
    const colors = { pending: 'bg-yellow-500/20 text-yellow-400', approved: 'bg-green-500/20 text-green-400', rejected: 'bg-red-500/20 text-red-400' };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || ''}`}>{status.toUpperCase()}</span>;
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><RefreshCw className="w-12 h-12 animate-spin text-green-400" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Admin Control Center</h1>
          <button onClick={loadAllData} className="p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800"><RefreshCw className="w-5 h-5" /></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-zinc-900 p-6 rounded-xl"><Users className="w-8 h-8 text-blue-400 mb-2" /><p className="text-2xl font-bold">{stats.users}</p><p className="text-sm text-zinc-400">Total</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><Shield className="w-8 h-8 text-green-400 mb-2" /><p className="text-2xl font-bold">{stats.verified}</p><p className="text-sm text-zinc-400">Verified</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><ArrowDownRight className="w-8 h-8 text-green-400 mb-2" /><p className="text-2xl font-bold">${stats.totalDep.toFixed(0)}</p><p className="text-sm text-zinc-400">Deposits</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><ArrowUpRight className="w-8 h-8 text-red-400 mb-2" /><p className="text-2xl font-bold">${stats.totalWd.toFixed(0)}</p><p className="text-sm text-zinc-400">Withdrawals</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><TrendingUp className="w-8 h-8 text-purple-400 mb-2" /><p className="text-2xl font-bold">{stats.totalTrades}</p><p className="text-sm text-zinc-400">Trades</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><DollarSign className="w-8 h-8 text-yellow-400 mb-2" /><p className="text-2xl font-bold">${stats.totalVolume.toFixed(0)}</p><p className="text-sm text-zinc-400">Volume</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><Clock className="w-8 h-8 text-yellow-400 mb-2" /><p className="text-2xl font-bold">{stats.pendingKyc}</p><p className="text-sm text-zinc-400">KYC Pending</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><CreditCard className="w-8 h-8 text-orange-400 mb-2" /><p className="text-2xl font-bold">{stats.pendingDep + stats.pendingWd}</p><p className="text-sm text-zinc-400">Payments Pending</p></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['overview', 'users', 'kyc', 'deposits', 'withdrawals', 'trades', 'banks'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap ${activeTab === tab ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-3 bg-zinc-900 rounded-lg mb-4" />
            <div className="bg-zinc-900 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-800">
                  <tr><th className="p-4 text-left">User</th><th className="p-4 text-left">Balance</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Actions</th></tr>
                </thead>
                <tbody>
                  {users.filter(u => u.email.toLowerCase().includes(search.toLowerCase())).map(u => (
                    <tr key={u.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                      <td className="p-4"><p className="font-bold">{u.full_name || '—'}</p><p className="text-sm text-zinc-400">{u.email}</p></td>
                      <td className="p-4 text-green-400 font-bold">${(u.balances?.[0]?.available_balance || 0).toFixed(2)}</td>
                      <td className="p-4">{u.is_approved ? <span className="text-green-400 bg-green-500/20 px-2 py-1 rounded text-xs">Verified</span> : <span className="text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded text-xs">Pending</span>}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedUser(u); setShowBalanceModal(true); }} className="p-2 bg-blue-600 rounded text-xs">Adjust Balance</button>
                          <button onClick={() => { setSelectedUser(u); setShowTradeModal(true); }} className="p-2 bg-purple-600 rounded text-xs">New Trade</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KYC Tab */}
        {activeTab === 'kyc' && (
          <div className="space-y-3">
            {kyc.map(k => (
              <div key={k.id} className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center">
                <div><p className="font-bold">{k.full_name}</p><p className="text-sm text-zinc-400">{k.email}</p></div>
                <div className="flex gap-3 items-center">
                  {badge(k.status)}
                  {k.status === 'pending' && (
                    <>
                      <button onClick={() => approveKyc(k.id)} className="p-2 bg-green-600 rounded"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => { const r = prompt('Reject reason:'); if (r) rejectKyc(k.id, r); }} className="p-2 bg-red-600 rounded"><XCircle className="w-4 h-4" /></button>
                      <button onClick={() => setSelectedKyc(k)} className="p-2 bg-blue-600 rounded"><FileText className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
          <div className="space-y-3">
            {deposits.map(d => (
              <div key={d.id} className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center">
                <div><p className="font-bold">${parseFloat(d.amount).toFixed(2)}</p><p className="text-sm text-zinc-400">{new Date(d.created_at).toLocaleDateString()}</p></div>
                <div className="flex gap-2 items-center">
                  {badge(d.status)}
                  {d.status === 'pending' && (
                    <>
                      <button onClick={() => approveDeposit(d.id)} className="p-2 bg-green-600 rounded"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => { const r = prompt('Reject reason:'); if (r) rejectDeposit(d.id, r); }} className="p-2 bg-red-600 rounded"><XCircle className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawals.map(w => (
              <div key={w.id} className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center">
                <div><p className="font-bold">${parseFloat(w.amount).toFixed(2)}</p><p className="text-sm text-zinc-400">{w.bank_name} • ****{w.account_number.slice(-4)}</p></div>
                <div className="flex gap-2 items-center">
                  {badge(w.status)}
                  {w.status === 'pending' && (
                    <>
                      <button onClick={() => approveWithdrawal(w.id)} className="p-2 bg-green-600 rounded"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => { const r = prompt('Reject reason:'); if (r) rejectWithdrawal(w.id, r); }} className="p-2 bg-red-600 rounded"><XCircle className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === 'trades' && (
          <div className="space-y-3">
            {trades.map(t => (
              <div key={t.id} className="bg-zinc-900 p-4 rounded-xl">
                <div className="flex justify-between">
                  <div><p className="font-bold">{t.symbol} {t.type.toUpperCase()}</p><p className="text-sm text-zinc-400">Qty: {t.quantity} @ ${t.entry_price}</p></div>
                  <div className="text-right"><span className="text-purple-400">{t.status.toUpperCase()}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banks Tab */}
        {activeTab === 'banks' && (
          <div className="grid gap-4 md:grid-cols-2">
            {banks.map(b => (
              <div key={b.id} className="bg-zinc-900 p-6 rounded-xl">
                <p className="font-bold text-xl">{b.bank_name}</p>
                <p className="text-sm text-zinc-400">Holder: {b.account_holder_name}</p>
                <p className="font-mono text-sm">Acc: {b.account_number}</p>
                {b.swift_code && <p className="text-xs text-zinc-500">SWIFT: {b.swift_code}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Balance Adjust Modal */}
        {showBalanceModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowBalanceModal(false)}>
            <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Adjust {selectedUser.email} Balance</h2>
              <input type="number" step="0.01" placeholder="Amount" value={balanceAdjust.amount} onChange={e => setBalanceAdjust({...balanceAdjust, amount: e.target.value})} className="w-full p-3 bg-zinc-800 rounded mb-3" />
              <select value={balanceAdjust.type} onChange={e => setBalanceAdjust({...balanceAdjust, type: e.target.value as 'credit' | 'debit'})} className="w-full p-3 bg-zinc-800 rounded mb-3">
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
              <input type="text" placeholder="Reason" value={balanceAdjust.reason} onChange={e => setBalanceAdjust({...balanceAdjust, reason: e.target.value})} className="w-full p-3 bg-zinc-800 rounded mb-3" />
              <button onClick={() => adjustBalance(selectedUser.id, parseFloat(balanceAdjust.amount), balanceAdjust.type, balanceAdjust.reason)} className="w-full p-3 bg-green-600 rounded">Adjust</button>
            </div>
          </div>
        )}

        {/* New Trade Modal */}
        {showTradeModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowTradeModal(false)}>
            <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">New Trade for {selectedUser.email}</h2>
              <input type="text" placeholder="Symbol (e.g. AAPL)" className="w-full p-3 bg-zinc-800 rounded mb-3" />
              <select className="w-full p-3 bg-zinc-800 rounded mb-3"><option>Buy</option><option>Sell</option></select>
              <input type="number" placeholder="Quantity" className="w-full p-3 bg-zinc-800 rounded mb-3" />
              <input type="number" step="0.01" placeholder="Price" className="w-full p-3 bg-zinc-800 rounded mb-3" />
              <button onClick={() => { /* implement createTrade */ }} className="w-full p-3 bg-purple-600 rounded">Create Trade</button>
            </div>
          </div>
        )}

        {/* KYC Review Modal */}
        {selectedKyc && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedKyc(null)}>
            <div className="bg-zinc-900 rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">KYC Review: {selectedKyc.full_name}</h2><button onClick={() => setSelectedKyc(null)}><X className="w-6 h-6" /></button></div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <a href={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('://')[1]}/storage/v1/object/public/kyc-documents/${selectedKyc.id_document_url}`} target="_blank" className="p-4 bg-zinc-800 rounded text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-green-400" />ID</a>
                <a href={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('://')[1]}/storage/v1/object/public/kyc-documents/${selectedKyc.address_proof_url}`} target="_blank" className="p-4 bg-zinc-800 rounded text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-blue-400" />Address</a>
                <a href={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('://')[1]}/storage/v1/object/public/kyc-documents/${selectedKyc.selfie_url}`} target="_blank" className="p-4 bg-zinc-800 rounded text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-purple-400" />Selfie</a>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { approveKyc(selectedKyc.id); setSelectedKyc(null); }} className="flex-1 p-3 bg-green-600 rounded font-bold">Approve</button>
                <button onClick={() => { const r = prompt('Reject reason:'); if (r) { rejectKyc(selectedKyc.id, r); setSelectedKyc(null); } }} className="flex-1 p-3 bg-red-600 rounded font-bold">Reject</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}