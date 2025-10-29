'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, Clock, Eye, Users, Wallet,
  TrendingUp, FileText, AlertCircle, Search, RefreshCw,
  Building2, DollarSign, ArrowUpRight, ArrowDownRight, User
} from 'lucide-react';

export default function ProductionAdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    approvedUsers: 0,
    pendingKyc: 0,
    pendingDeposits: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });

  const [selectedKyc, setSelectedKyc] = useState(null);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  async function checkAdminAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      alert('Access denied. Admin only.');
      router.push('/dashboard');
      return;
    }

    await fetchAllData();
    setLoading(false);
    setupRealtimeSubscriptions();
  }

  function setupRealtimeSubscriptions() {
    const kycChannel = supabase
      .channel('kyc-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'kyc_submissions' },
        () => fetchAllData()
      )
      .subscribe();

    const depositsChannel = supabase
      .channel('deposits-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deposits' },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kycChannel);
      supabase.removeChannel(depositsChannel);
    };
  }

  async function fetchAllData() {
    await Promise.all([
      fetchKycSubmissions(),
      fetchDeposits(),
      fetchWithdrawals(),
      fetchUsers(),
      fetchBankAccounts(),
      fetchStats()
    ]);
  }

  async function fetchKycSubmissions() {
    const { data } = await supabase
      .from('kyc_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    setKycSubmissions(data || []);
  }

  async function fetchDeposits() {
    const { data } = await supabase
      .from('deposits')
      .select('*, users:user_id (email, full_name)')
      .order('created_at', { ascending: false });
    setDeposits(data || []);
  }

  async function fetchWithdrawals() {
    const { data } = await supabase
      .from('withdrawals')
      .select('*, users:user_id (email, full_name)')
      .order('created_at', { ascending: false });
    setWithdrawals(data || []);
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('*, balances(available_balance)')
      .order('created_at', { ascending: false });
    setUsers(data || []);
  }

  async function fetchBankAccounts() {
    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    setBankAccounts(data || []);
  }

  async function fetchStats() {
    const { data: usersData } = await supabase.from('users').select('is_approved');
    const { data: kycData } = await supabase.from('kyc_submissions').select('status');
    const { data: depositsData } = await supabase.from('deposits').select('status, amount');

    setStats({
      totalUsers: usersData?.length || 0,
      approvedUsers: usersData?.filter(u => u.is_approved).length || 0,
      pendingKyc: kycData?.filter(k => k.status === 'pending').length || 0,
      pendingDeposits: depositsData?.filter(d => d.status === 'pending').length || 0,
      totalDeposits: depositsData?.filter(d => d.status === 'approved').reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0,
      totalWithdrawals: 0
    });
  }

  async function approveKyc(kycId, userId) {
    if (!confirm('Approve this KYC? User will be able to deposit.')) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('kyc_submissions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      })
      .eq('id', kycId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('KYC approved!');
      fetchAllData();
      setSelectedKyc(null);
    }
  }

  async function rejectKyc(kycId) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('kyc_submissions')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_by: user?.id
      })
      .eq('id', kycId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('KYC rejected.');
      fetchAllData();
      setSelectedKyc(null);
    }
  }

  async function approveDeposit(depositId) {
    if (!confirm('Approve deposit? Balance will update automatically.')) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('deposits')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      })
      .eq('id', depositId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Deposit approved! Balance updated.');
      fetchAllData();
    }
  }

  async function rejectDeposit(depositId) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('deposits')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_by: user?.id
      })
      .eq('id', depositId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Deposit rejected.');
      fetchAllData();
    }
  }

  async function viewDocument(bucket, path) {
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    
    if (data) window.open(data.signedUrl, '_blank');
    else alert('Failed to load document');
  }

  function getStatusBadge(status) {
    const styles = {
      pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
      approved: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50',
      rejected: 'bg-red-900/30 text-red-400 border-red-800/50'
    };

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle
    };

    const Icon = icons[status] || Clock;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border ${styles[status]}`}>
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-zinc-400">Manage approvals and users</p>
          </div>
          <button
            onClick={fetchAllData}
            className="p-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5 text-emerald-400" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-zinc-400 font-semibold">USERS</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <p className="text-sm text-emerald-400 mt-1">{stats.approvedUsers} verified</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-xs text-zinc-400 font-semibold">KYC</span>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats.pendingKyc}</p>
            <p className="text-sm text-zinc-400 mt-1">Pending</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-8 h-8 text-emerald-400" />
              <span className="text-xs text-zinc-400 font-semibold">DEPOSITS</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">${stats.totalDeposits.toFixed(0)}</p>
            <p className="text-sm text-zinc-400 mt-1">{stats.pendingDeposits} pending</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-zinc-400 font-semibold">WITHDRAWALS</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">${stats.totalWithdrawals.toFixed(0)}</p>
            <p className="text-sm text-zinc-400 mt-1">Total</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {['overview', 'kyc', 'deposits', 'withdrawals', 'users', 'banks'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-emerald-500 text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Pending KYC ({kycSubmissions.filter(k => k.status === 'pending').length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {kycSubmissions.filter(k => k.status === 'pending').slice(0, 5).map(kyc => (
                  <div key={kyc.id} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{kyc.full_name}</p>
                        <p className="text-sm text-zinc-400">{kyc.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedKyc(kyc)}
                          className="p-2 bg-blue-500/20 rounded"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => approveKyc(kyc.id, kyc.user_id)}
                          className="p-2 bg-emerald-500/20 rounded"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => rejectKyc(kyc.id)}
                          className="p-2 bg-red-500/20 rounded"
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {kycSubmissions.filter(k => k.status === 'pending').length === 0 && (
                  <p className="text-zinc-500 text-center py-8">No pending KYC</p>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Pending Deposits ({deposits.filter(d => d.status === 'pending').length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deposits.filter(d => d.status === 'pending').slice(0, 5).map(deposit => (
                  <div key={deposit.id} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-emerald-400">${parseFloat(deposit.amount).toFixed(2)}</p>
                        <p className="text-sm text-zinc-400">{deposit.users?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDocument('payment-proofs', deposit.payment_proof_url)}
                          className="p-2 bg-blue-500/20 rounded"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => approveDeposit(deposit.id)}
                          className="p-2 bg-emerald-500/20 rounded"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => rejectDeposit(deposit.id)}
                          className="p-2 bg-red-500/20 rounded"
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {deposits.filter(d => d.status === 'pending').length === 0 && (
                  <p className="text-zinc-500 text-center py-8">No pending deposits</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* KYC TAB */}
        {activeTab === 'kyc' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold">Name</th>
                    <th className="text-left p-4 text-sm font-semibold">Email</th>
                    <th className="text-left p-4 text-sm font-semibold">Status</th>
                    <th className="text-left p-4 text-sm font-semibold">Date</th>
                    <th className="text-left p-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycSubmissions.map(kyc => (
                    <tr key={kyc.id} className="border-t border-zinc-800">
                      <td className="p-4">{kyc.full_name}</td>
                      <td className="p-4 text-zinc-400">{kyc.email}</td>
                      <td className="p-4">{getStatusBadge(kyc.status)}</td>
                      <td className="p-4 text-zinc-400">{new Date(kyc.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedKyc(kyc)}
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEPOSITS TAB */}
        {activeTab === 'deposits' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold">User</th>
                    <th className="text-left p-4 text-sm font-semibold">Amount</th>
                    <th className="text-left p-4 text-sm font-semibold">Status</th>
                    <th className="text-left p-4 text-sm font-semibold">Date</th>
                    <th className="text-left p-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map(deposit => (
                    <tr key={deposit.id} className="border-t border-zinc-800">
                      <td className="p-4">{deposit.users?.email}</td>
                      <td className="p-4 text-emerald-400">${parseFloat(deposit.amount).toFixed(2)}</td>
                      <td className="p-4">{getStatusBadge(deposit.status)}</td>
                      <td className="p-4 text-zinc-400">{new Date(deposit.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => viewDocument('payment-proofs', deposit.payment_proof_url)}>
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                          {deposit.status === 'pending' && (
                            <>
                              <button onClick={() => approveDeposit(deposit.id)}>
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              </button>
                              <button onClick={() => rejectDeposit(deposit.id)}>
                                <XCircle className="w-4 h-4 text-red-400" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold">Email</th>
                    <th className="text-left p-4 text-sm font-semibold">Balance</th>
                    <th className="text-left p-4 text-sm font-semibold">Status</th>
                    <th className="text-left p-4 text-sm font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t border-zinc-800">
                      <td className="p-4">{user.email}</td>
                      <td className="p-4 text-emerald-400">${user.balances?.[0]?.available_balance?.toFixed(2) || '0.00'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${user.is_approved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {user.is_approved ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BANKS TAB */}
        {activeTab === 'banks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map(bank => (
              <div key={bank.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-2">{bank.bank_name}</h3>
                <p className="text-sm text-zinc-400 mb-4">{bank.account_holder_name}</p>
                <p className="text-sm"><span className="text-zinc-400">Account:</span> {bank.account_number}</p>
              </div>
            ))}
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center py-12">
            <p className="text-zinc-400">No withdrawals yet</p>
          </div>
        )}

        {/* KYC MODAL */}
        {selectedKyc && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedKyc(null)}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-zinc-800 flex justify-between">
                <h2 className="text-2xl font-bold">KYC Review</h2>
                <button onClick={() => setSelectedKyc(null)}>
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-400">Name</p>
                    <p className="font-semibold">{selectedKyc.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Email</p>
                    <p className="font-semibold">{selectedKyc.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => viewDocument('kyc-documents', selectedKyc.id_document_url)}
                    className="p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                  >
                    <FileText className="h-6 w-6 text-emerald-400 mb-2" />
                    <p className="text-sm">ID Document</p>
                  </button>
                  <button
                    onClick={() => viewDocument('kyc-documents', selectedKyc.address_proof_url)}
                    className="p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                  >
                    <FileText className="h-6 w-6 text-emerald-400 mb-2" />
                    <p className="text-sm">Address Proof</p>
                  </button>
                  <button
                    onClick={() => viewDocument('kyc-documents', selectedKyc.selfie_url)}
                    className="p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                  >
                    <User className="h-6 w-6 text-emerald-400 mb-2" />
                    <p className="text-sm">Selfie</p>
                  </button>
                </div>
                {selectedKyc.status === 'pending' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => approveKyc(selectedKyc.id, selectedKyc.user_id)}
                      className="flex-1 px-6 py-3 bg-emerald-500 text-black rounded-lg font-semibold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectKyc(selectedKyc.id)}
                      className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}