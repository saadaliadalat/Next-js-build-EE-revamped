'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, Clock, Eye, Users, Wallet,
  TrendingUp, FileText, AlertCircle, Search, RefreshCw,
  Building2, DollarSign, ArrowUpRight, ArrowDownRight,
  Download, User, Mail
} from 'lucide-react';

interface KycSubmission {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  nationality: string;
  status: string;
  created_at: string;
  id_document_url: string;
  address_proof_url: string;
  selfie_url: string;
  rejection_reason?: string;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_proof_url: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
  users?: { email: string; full_name: string };
}

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  is_approved: boolean;
  kyc_status: string;
  created_at: string;
  balances?: { available_balance: number }[];
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  routing_number?: string;
  instructions?: string;
  is_active: boolean;
}

export default function ProductionAdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [kycSubmissions, setKycSubmissions] = useState<KycSubmission[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    approvedUsers: 0,
    pendingKyc: 0,
    pendingDeposits: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });

  // Modal states
  const [selectedKyc, setSelectedKyc] = useState<KycSubmission | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);

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

    // Set up real-time subscriptions
    setupRealtimeSubscriptions();
  }

  function setupRealtimeSubscriptions() {
    // Listen for new KYC submissions
    const kycChannel = supabase
      .channel('kyc-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'kyc_submissions' },
        () => fetchKycSubmissions()
      )
      .subscribe();

    // Listen for new deposits
    const depositsChannel = supabase
      .channel('deposits-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deposits' },
        () => fetchDeposits()
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
      .select(`
        *,
        users:user_id (email, full_name)
      `)
      .order('created_at', { ascending: false });
    setDeposits(data || []);
  }

  async function fetchWithdrawals() {
    const { data } = await supabase
      .from('withdrawals')
      .select(`
        *,
        users:user_id (email, full_name)
      `)
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

  async function approveKyc(kycId: string, userId: string) {
    if (!confirm('Approve this KYC submission? User will be able to deposit funds.')) return;
    
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
      alert('KYC approved! User can now deposit funds.');
      fetchAllData();
      setSelectedKyc(null);
    }
  }

  async function rejectKyc(kycId: string) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('kyc_submissions')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_at: new Date().toISOString(),
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

  async function approveDeposit(depositId: string) {
    if (!confirm('Approve this deposit? Balance will be updated automatically.')) return;

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
      alert('Deposit approved! User balance updated via trigger.');
      fetchAllData();
      setSelectedDeposit(null);
    }
  }

  async function rejectDeposit(depositId: string) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('deposits')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      })
      .eq('id', depositId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Deposit rejected.');
      fetchAllData();
      setSelectedDeposit(null);
    }
  }

  async function viewDocument(bucket: string, path: string) {
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    
    if (data) {
      window.open(data.signedUrl, '_blank');
    } else {
      alert('Failed to load document');
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
      approved: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50',
      rejected: 'bg-red-900/30 text-red-400 border-red-800/50',
      completed: 'bg-blue-900/30 text-blue-400 border-blue-800/50'
    };

    const icons: Record<string, any> = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      completed: CheckCircle
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
            <p className="text-zinc-400">Manage approvals, users, and platform settings</p>
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
              <span className="text-xs text-zinc-400 font-semibold">TOTAL USERS</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <p className="text-sm text-emerald-400 mt-1">{stats.approvedUsers} verified</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-xs text-zinc-400 font-semibold">PENDING KYC</span>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats.pendingKyc}</p>
            <p className="text-sm text-zinc-400 mt-1">Awaiting review</p>
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
            <p className="text-sm text-zinc-400 mt-1">Total processed</p>
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
            {/* Pending KYC */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-400" />
                Pending KYC ({kycSubmissions.filter(k => k.status === 'pending').length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {kycSubmissions.filter(k => k.status === 'pending').slice(0, 5).map(kyc => (
                  <div key={kyc.id} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{kyc.full_name}</p>
                        <p className="text-sm text-zinc-400">{kyc.email}</p>
                        <p className="text-xs text-zinc-500 mt-1">{new Date(kyc.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedKyc(kyc)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded transition"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => approveKyc(kyc.id, kyc.user_id)}
                          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded transition"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => rejectKyc(kyc.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded transition"
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {kycSubmissions.filter(k => k.status === 'pending').length === 0 && (
                  <p className="text-zinc-500 text-center py-8">No pending KYC submissions</p>
                )}
              </div>
            </div>

            {/* Pending Deposits */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Pending Deposits ({deposits.filter(d => d.status === 'pending').length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deposits.filter(d => d.status === 'pending').slice(0, 5).map(deposit => (
                  <div key={deposit.id} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-emerald-400">${parseFloat(deposit.amount).toFixed(2)}</p>
                        <p className="text-sm text-zinc-400">{deposit.users?.email}</p>
                        <p className="text-xs text-zinc-500 mt-1">{new Date(deposit.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDocument('payment-proofs', deposit.payment_proof_url)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded transition"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => approveDeposit(deposit.id)}
                          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded transition"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => rejectDeposit(deposit.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded transition"
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
            <div className="p-4 border-b border-zinc-800">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold">Name</th>
                    <th className="text-left p-4 text-sm font-semibold">Email</th>
                    <th className="text-left p-4 text-sm font-semibold">Nationality</th>
                    <th className="text-left p-4 text-sm font-semibold">Status</th>
                    <th className="text-left p-4 text-sm font-semibold">Submitted</th>
                    <th className="text-left p-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycSubmissions
                    .filter(k => 
                      k.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      k.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(kyc => (
                      <tr key={kyc.id} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                        <td className="p-4">{kyc.full_name}</td>
                        <td className="p-4 text-zinc-400">{kyc.email}</td>
                        <td className="p-4 text-zinc-400">{kyc.nationality}</td>
                        <td className="p-4">{getStatusBadge(kyc.status)}</td>
                        <td className="p-4 text-zinc-400">{new Date(kyc.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedKyc(kyc)}
                              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
                            >
                              Review
                            </button>
                          </div>
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
                    <tr key={deposit.id} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                      <td className="p-4">
                        <div>
                          <p className="font-semibold">{deposit.users?.full_name || 'N/A'}</p>
                          <p className="text-xs text-zinc-400">{deposit.users?.email}</p>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-emerald-400">${parseFloat(deposit.amount).toFixed(2)}</td>
                      <td className="p-4">{getStatusBadge(deposit.status)}</td>
                      <td className="p-4 text-zinc-400">{new Date(deposit.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewDocument('payment-proofs', deposit.payment_proof_url)}
                            className="p-2 hover:bg-zinc-700 rounded"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                          {deposit.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveDeposit(deposit.id)}
                                className="p-2 hover:bg-zinc-700 rounded"
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              </button>
                              <button
                                onClick={() => rejectDeposit(deposit.id)}
                                className="p-2 hover:bg-zinc-700 rounded"
                              >
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
                    <th className="text-left p-4 text-sm font-semibold">Name</th>
                    <th className="text-left p-4 text-sm font-semibold">Email</th>
                    <th className="text-left p-4 text-sm font-semibold">Balance</th>
                    <th className="text-left p-4 text-sm font-semibold">Status</th>
                    <th className="text-left p-4 text-sm font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                      <td className="p-4">{user.full_name || 'N/A'}</td>
                      <td className="p-4 text-zinc-400">{user.email}</td>
                      <td className="p-4 font-semibold text-emerald-400">
                        ${user.balances?.[0]?.available_balance?.toFixed(2) || '0.00'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    bank.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {bank.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-zinc-400">Account:</span> {bank.account_number}</p>
                  {bank.routing_number && (
                    <p><span className="text-zinc-400">Routing:</span> {bank.routing_number}</p>
                  )}
                  {bank.instructions && (
                    <p className="text-zinc-400 text-xs mt-2">{bank.instructions}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="text-center py-12">
              <ArrowUpRight className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
              <p className="text-blue-200 text-lg">No withdrawal requests yet</p>
              <p className="text-blue-300/70 text-sm mt-2">Withdrawal requests will appear here</p>
            </div>
          </div>
        )}

        {/* KYC DETAIL MODAL */}
        {selectedKyc && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-2xl font-bold">KYC Review</h2>
                <button
                  onClick={() => setSelectedKyc(null)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400">Full Name</p>
                    <p className="font-semibold">{selectedKyc.full_name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400">Email</p>
                    <p className="font-semibold">{selectedKyc.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400">Nationality</p>
                    <p className="font-semibold">{selectedKyc.nationality}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400">Status</p>
                    {getStatusBadge(selectedKyc.status)}
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Documents</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => viewDocument('kyc-documents', selectedKyc.id_document_url)}
                      className="p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition text-left"
                    >
                      <FileText className="h-6 w-6 text-emerald-400 mb-2" />
                      <p className="font-semibold text-sm">ID Document</p>
                      <p className="text-xs text-zinc-400 mt-1">Click to view</p>
                    </button>

                    <button
                      onClick={() => viewDocument('kyc-documents', selectedKyc.address_proof_url)}
                      className="p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition text-left"
                    >
                      <FileText className="h-6 w-6 text-emerald-400 mb-2" />
                      <p className="font-semibold text-sm">Address Proof</p>
                      <p className="text-xs text-zinc-400 mt-1">Click to view</p>
                    </button>

                    <button
                      onClick={() => viewDocument('kyc-documents', selectedKyc.selfie_url)}
                      className="p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition text-left"
                    >
                      <User className="h-6 w-6 text-emerald-400 mb-2" />
                      <p className="font-semibold text-sm">Selfie</p>
                      <p className="text-xs text-zinc-400 mt-1">Click to view</p>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                {selectedKyc.status === 'pending' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => approveKyc(selectedKyc.id, selectedKyc.user_id)}
                      className="flex-1 px-6 py-3 bg-emerald-500 text-black rounded-lg font-semibold hover:bg-emerald-600 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Approve KYC
                    </button>

                    <button
                      onClick={() => rejectKyc(selectedKyc.id)}
                      className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-5 w-5" />
                      Reject KYC
                    </button>
                  </div>
                )}

                {/* Already processed */}
                {selectedKyc.status !== 'pending' && (
                  <div className={`p-4 rounded-lg border ${
                    selectedKyc.status === 'approved' 
                      ? 'bg-emerald-900/20 border-emerald-800/50' 
                      : 'bg-red-900/20 border-red-800/50'
                  }`}>
                    <p className="font-semibold">
                      {selectedKyc.status === 'approved' ? '✓ Already Approved' : '✗ Already Rejected'}
                    </p>
                    {selectedKyc.rejection_reason && (
                      <p className="text-sm text-zinc-300 mt-2">
                        Reason: {selectedKyc.rejection_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.is_approved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-lg">{bank.bank_name}</h3>
                      <p className="text-sm text-zinc-400">{bank.account_holder_name}</p>
                    </div>
                  </div>
                  <span