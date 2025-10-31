'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { RefreshCw, Users, Shield, ArrowDownRight, ArrowUpRight, FileText, X, CheckCircle, XCircle } from 'lucide-react';
// app/admin/page.tsx
import type { User, KycSubmission, Deposit, Withdrawal, BankAccount } from '@/types/admin';

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

  const [stats, setStats] = useState({
    users: 0, verified: 0, pendingKyc: 0, pendingDep: 0, pendingWd: 0, totalDep: 0, totalWd: 0
  });

  const [selectedKyc, setSelectedKyc] = useState<KycSubmission | null>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const ok = await checkAdmin();
    if (!ok) return;
    await loadData();
    setLoading(false);
  }

  async function checkAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return false; }

    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (error || !data?.is_admin) {
      alert('Admin access only');
      router.push('/dashboard');
      return false;
    }
    return true;
  }

  async function loadData() {
    const [u, k, d, w, b] = await Promise.all([
      supabase.from('users').select('*, balances(available_balance)').returns<User[]>(),
      supabase.from('kyc_submissions').select('*').returns<KycSubmission[]>(),
      supabase.from('deposits').select('*').returns<Deposit[]>(),
      supabase.from('withdrawals').select('*').returns<Withdrawal[]>(),
      supabase.from('bank_accounts').select('*').returns<BankAccount[]>()
    ]);

    const usersData = u.data ?? [];
    const kycData = k.data ?? [];
    const depData = d.data ?? [];
    const wdData = w.data ?? [];
    const bankData = b.data ?? [];

    setUsers(usersData);
    setKyc(kycData);
    setDeposits(depData);
    setWithdrawals(wdData);
    setBanks(bankData);

    setStats({
      users: usersData.length,
      verified: usersData.filter(x => x.is_approved).length,
      pendingKyc: kycData.filter(x => x.status === 'pending').length,
      pendingDep: depData.filter(x => x.status === 'pending').length,
      pendingWd: wdData.filter(x => x.status === 'pending').length,
      totalDep: depData.filter(x => x.status === 'approved').reduce((s, x) => s + parseFloat(x.amount), 0),
      totalWd: wdData.filter(x => x.status === 'approved').reduce((s, x) => s + parseFloat(x.amount), 0)
    });
  }

  async function approveKyc(id: string) {
    const kycItem = kyc.find(x => x.id === id);
    if (!kycItem) return;

    await supabase.from('kyc_submissions').update({ status: 'approved', reviewed_at: new Date() }).eq('id', id);
    await supabase.from('users').update({ is_approved: true }).eq('id', kycItem.user_id);
    loadData();
  }

  async function rejectKyc(id: string, reason: string) {
    await supabase.from('kyc_submissions').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    loadData();
  }

  async function approveDeposit(id: string) {
    const dep = deposits.find(x => x.id === id);
    if (!dep) return;
    await supabase.from('deposits').update({ status: 'approved' }).eq('id', id);
    await supabase.rpc('credit_balance', { user_id: dep.user_id, amount: parseFloat(dep.amount) });
    loadData();
  }

  async function rejectDeposit(id: string, reason: string) {
    await supabase.from('deposits').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    loadData();
  }

  async function approveWithdrawal(id: string) {
    const wd = withdrawals.find(x => x.id === id);
    if (!wd) return;
    await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', id);
    await supabase.rpc('debit_balance', { user_id: wd.user_id, amount: parseFloat(wd.amount) });
    loadData();
  }

  function badge(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-emerald-500/20 text-emerald-400',
      rejected: 'bg-red-500/20 text-red-400'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || ''}`}>{status.toUpperCase()}</span>;
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><RefreshCw className="w-12 h-12 animate-spin text-emerald-400" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Admin Center</h1>
          <button onClick={loadData} className="p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800"><RefreshCw className="w-5 h-5" /></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 p-6 rounded-xl"><Users className="w-8 h-8 text-blue-400 mb-2" /><p className="text-2xl font-bold">{stats.users}</p><p className="text-sm text-zinc-400">{stats.verified} verified</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><Shield className="w-8 h-8 text-yellow-400 mb-2" /><p className="text-2xl font-bold">{stats.pendingKyc}</p><p className="text-sm text-zinc-400">KYC pending</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><ArrowDownRight className="w-8 h-8 text-emerald-400 mb-2" /><p className="text-2xl font-bold">${stats.totalDep.toFixed(0)}</p><p className="text-sm text-zinc-400">{stats.pendingDep} pending</p></div>
          <div className="bg-zinc-900 p-6 rounded-xl"><ArrowUpRight className="w-8 h-8 text-red-400 mb-2" /><p className="text-2xl font-bold">${stats.totalWd.toFixed(0)}</p><p className="text-sm text-zinc-400">{stats.pendingWd} pending</p></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['overview', 'users', 'kyc', 'deposits', 'withdrawals', 'banks'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-3 rounded-lg font-bold ${activeTab === t ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Users */}
        {activeTab === 'users' && (
          <div>
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-3 bg-zinc-900 rounded-lg mb-4" />
            <div className="bg-zinc-900 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-800"><tr><th className="p-4 text-left">User</th><th className="p-4 text-left">Balance</th><th className="p-4 text-left">Status</th></tr></thead>
                <tbody>
                  {users.filter(u => u.email.toLowerCase().includes(search.toLowerCase())).map(u => (
                    <tr key={u.id} className="border-t border-zinc-800">
                      <td className="p-4"><p className="font-bold">{u.full_name || '—'}</p><p className="text-sm text-zinc-400">{u.email}</p></td>
                      <td className="p-4 text-emerald-400 font-bold">${u.balances?.[0]?.available_balance?.toFixed(2) || '0.00'}</td>
                      <td className="p-4">{u.is_approved ? <span className="text-emerald-400 text-xs bg-emerald-500/20 px-2 py-1 rounded">VERIFIED</span> : <span className="text-yellow-400 text-xs bg-yellow-500/20 px-2 py-1 rounded">PENDING</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KYC */}
        {activeTab === 'kyc' && (
          <div className="space-y-3">
            {kyc.map(k => (
              <div key={k.id} className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold">{k.full_name}</p>
                  <p className="text-sm text-zinc-400">{k.email}</p>
                </div>
                <div className="flex gap-3 items-center">
                  {badge(k.status)}
                  {k.status === 'pending' && <button onClick={() => setSelectedKyc(k)} className="px-4 py-2 bg-blue-600 rounded-lg text-sm">Review</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deposits */}
        {activeTab === 'deposits' && (
          <div className="space-y-3">
            {deposits.map(d => (
              <div key={d.id} className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold">${parseFloat(d.amount).toFixed(2)}</p>
                  <p className="text-sm text-zinc-400">{new Date(d.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {badge(d.status)}
                  {d.status === 'pending' && (
                    <>
                      <button onClick={() => approveDeposit(d.id)} className="p-2 bg-emerald-600 rounded"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => { const r = prompt('Reject reason:'); if (r) rejectDeposit(d.id, r); }} className="p-2 bg-red-600 rounded"><XCircle className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Withdrawals */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawals.map(w => (
              <div key={w.id} className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold">${parseFloat(w.amount).toFixed(2)}</p>
                  <p className="text-sm text-zinc-400">{w.bank_name} • {w.account_number.slice(-4)}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {badge(w.status)}
                  {w.status === 'pending' && (
                    <>
                      <button onClick={() => approveWithdrawal(w.id)} className="p-2 bg-emerald-600 rounded"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => { const r = prompt('Reject reason:'); if (r) rejectDeposit(w.id, r); }} className="p-2 bg-red-600 rounded"><XCircle className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banks */}
        {activeTab === 'banks' && (
          <div className="grid gap-4 md:grid-cols-2">
            {banks.map(b => (
              <div key={b.id} className="bg-zinc-900 p-6 rounded-xl">
                <p className="font-bold text-xl">{b.bank_name}</p>
                <p className="text-sm text-zinc-400">Holder: {b.account_holder_name}</p>
                <p className="font-mono text-sm">Acc: {b.account_number}</p>
                {b.swift_code && <p className="text-xs text-zinc-500 mt-1">SWIFT: {b.swift_code}</p>}
              </div>
            ))}
          </div>
        )}

        {/* KYC Modal */}
        {selectedKyc && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedKyc(null)}>
            <div className="bg-zinc-900 rounded-xl max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-6"><h2 className="text-2xl font-bold">KYC Review</h2><button onClick={() => setSelectedKyc(null)}><X className="w-6 h-6" /></button></div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><p className="text-sm text-zinc-400">Name</p><p className="font-bold">{selectedKyc.full_name}</p></div>
                <div><p className="text-sm text-zinc-400">Email</p><p className="font-bold">{selectedKyc.email}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <a href={`https://your-project.supabase.co/storage/v1/object/public/kyc-documents/${selectedKyc.id_document_url}`} target="_blank" className="p-4 bg-zinc-800 rounded-lg text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-emerald-400" />ID</a>
                <a href={`https://your-project.supabase.co/storage/v1/object/public/kyc-documents/${selectedKyc.address_proof_url}`} target="_blank" className="p-4 bg-zinc-800 rounded-lg text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-blue-400" />Address</a>
                <a href={`https://your-project.supabase.co/storage/v1/object/public/kyc-documents/${selectedKyc.selfie_url}`} target="_blank" className="p-4 bg-zinc-800 rounded-lg text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-purple-400" />Selfie</a>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { approveKyc(selectedKyc.id); setSelectedKyc(null); }} className="flex-1 py-3 bg-emerald-600 rounded-lg font-bold">Approve</button>
                <button onClick={() => { const r = prompt('Rejection reason:'); if (r) { rejectKyc(selectedKyc.id, r); setSelectedKyc(null); } }} className="flex-1 py-3 bg-red-600 rounded-lg font-bold">Reject</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}