'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, XCircle, Clock, Eye, Users, Wallet, TrendingUp, 
  FileText, AlertCircle, Search, RefreshCw, Building2, DollarSign, 
  ArrowUpRight, ArrowDownRight, User, Settings, Shield
} from 'lucide-react';

interface KycSubmission {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  id_document_url: string;
  address_proof_url: string;
  selfie_url: string;
  status: string;
  created_at: string;
  rejection_reason?: string | null;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: string;
  payment_proof_url: string;
  status: string;
  created_at: string;
  users?: { email: string; full_name: string | null };
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: string;
  status: string;
  created_at: string;
  users?: { email: string; full_name: string | null };
}

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  is_admin: boolean;
  created_at: string;
  balances?: Array<{ available_balance: number }>;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  routing_number: string | null;
  swift_code: string | null;
  is_active: boolean;
  created_at: string;
}

export default function CompleteAdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [kycSubmissions, setKycSubmissions] = useState<KycSubmission[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    approvedUsers: 0,
    pendingKyc: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });

  const [selectedKyc, setSelectedKyc] = useState<KycSubmission | null>(null);

  useEffect(() => {
    initializeAdmin();
  }, []);

  async function initializeAdmin() {
    await checkAdminAuth();
    await fetchAllData();
    setLoading(false);
    setupRealtimeSubscriptions();
  }

  async function checkAdminAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please login first');
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
  }

  function setupRealtimeSubscriptions() {
    const kycChannel = supabase
      .channel('kyc-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'kyc_submissions' },
        () => fetchAllData()
      )
      .subscribe();

    const depositsChannel = supabase
      .channel('deposits-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deposits' },
        () => fetchAllData()
      )
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('withdrawals-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kycChannel);
      supabase.removeChannel(depositsChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }

  async function fetchAllData() {
    await Promise.all([
      fetchKycSubmissions(),
      fetchDeposits(),
      fetchWithdrawals(),
      fetchUsers(),
      fetchBankAccounts()
    ]);
    calculateStats();
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

  function calculateStats() {
    setStats({
      totalUsers: users.length,
      approvedUsers: users.filter(u => u.is_approved).length,
      pendingKyc: kycSubmissions.filter(k => k.status === 'pending').length,
      pendingDeposits: deposits.filter(d => d.status === 'pending').length,
      pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
      totalDeposits: deposits
        .filter(d => d.status === 'approved')
        .reduce((sum, d) => sum + parseFloat(d.amount), 0),
      totalWithdrawals: withdrawals
        .filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + parseFloat(w.amount), 0)
    });
  }

  async function approveKyc(kycId: string, userId: string) {
    if (!confirm('Approve this KYC? User will be verified and can deposit.')) return;
    
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
      alert('KYC Approved! User can now deposit.');
      await fetchAllData();
      setSelectedKyc(null);
    }
  }

  async function rejectKyc(kycId: string) {
    const reason = prompt('Reason for rejection (will be shown to user):');
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
      alert('KYC Rejected.');
      await fetchAllData();
      setSelectedKyc(null);
    }
  }

  async function approveDeposit(depositId: string) {
    if (!confirm('Approve deposit? User balance will update automatically via trigger.')) return;

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
      alert('Deposit Approved! Balance updated automatically.');
      await fetchAllData();
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
        approved_by: user?.id
      })
      .eq('id', depositId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Deposit Rejected.');
      await fetchAllData();
    }
  }

  async function approveWithdrawal(withdrawalId: string) {
    if (!confirm('Approve withdrawal? Confirm payment has been sent.')) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      })
      .eq('id', withdrawalId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Withdrawal Approved!');
      await fetchAllData();
    }
  }

  async function rejectWithdrawal(withdrawalId: string) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_by: user?.id
      })
      .eq('id', withdrawalId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Withdrawal Rejected.');
      await fetchAllData();
    }
  }

  async function viewDocument(bucket: string, path: string) {
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      alert('Failed to load document');
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
      approved: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50',
      rejected: 'bg-red-900/30 text-red-400 border-red-800/50'
    };

    const icons: Record<string, any> = {
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  const filteredKyc = kycSubmissions.filter(k => 
    (filterStatus === 'all' || k.status === filterStatus) &&
    (k.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     k.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDeposits = deposits.filter(d =>
    (filterStatus === 'all' || d.status === filterStatus) &&
    (d.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     d.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-zinc-400">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-zinc-400">Manage KYC, deposits, withdrawals & users</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAllData}
                className="p-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-all hover:scale-105"
              >
                <RefreshCw className="w-5 h-5 text-emerald-400" />
              </button>
              <button className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-emerald-500/30 transition">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-400" />
                <span className="text-xs text-zinc-400 font-semibold">USERS</span>
              </div>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-emerald-400 mt-1">
                {stats.approvedUsers} verified
              </p>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-yellow-500/30 transition">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-8 h-8 text-yellow-400" />
                <span className="text-xs text-zinc-400 font-semibold">KYC</span>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingKyc}</p>
              <p className="text-sm text-zinc-400 mt-1">Pending approval</p>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-emerald-500/30 transition">
              <div className="flex items-center justify-between mb-4">
                <ArrowDownRight className="w-8 h-8 text-emerald-400" />
                <span className="text-xs text-zinc-400 font-semibold">DEPOSITS</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400">
                ${stats.totalDeposits.toLocaleString()}
              </p>
              <p className="text-sm text-yellow-400 mt-1">
                {stats.pendingDeposits} pending
              </p>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/30 transition">
              <div className="flex items-center justify-between mb-4">
                <ArrowUpRight className="w-8 h-8 text-purple-400" />
                <span className="text-xs text-zinc-400 font-semibold">WITHDRAWALS</span>
              </div>
              <p className="text-3xl font-bold text-purple-400">
                ${stats.totalWithdrawals.toLocaleString()}
              </p>
              <p className="text-sm text-yellow-400 mt-1">
                {stats.pendingWithdrawals} pending
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'kyc', label: 'KYC Approvals', icon: Shield, badge: stats.pendingKyc },
            { id: 'deposits', label: 'Deposits', icon: Wallet, badge: stats.pendingDeposits },
            { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight, badge: stats.pendingWithdrawals },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'banks', label: 'Bank Accounts', icon: Building2 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Filter */}
        {(activeTab === 'kyc' || activeTab === 'deposits' || activeTab === 'users') && (
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            {(activeTab === 'kyc' || activeTab === 'deposits') && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Pending KYC */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Pending KYC</h3>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-semibold">
                  {kycSubmissions.filter(k => k.status === 'pending').length}
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {kycSubmissions.filter(k => k.status === 'pending').slice(0, 5).map(kyc => (
                  <div key={kyc.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 hover:border-emerald-500/30 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-white">{kyc.full_name}</p>
                        <p className="text-sm text-zinc-400">{kyc.email}</p>
                        <p className="text-xs text-zinc-500 mt-1">{formatDate(kyc.created_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedKyc(kyc)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition"
                          title="Review"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => approveKyc(kyc.id, kyc.user_id)}
                          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => rejectKyc(kyc.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {kycSubmissions.filter(k => k.status === 'pending').length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
                    <p className="text-zinc-500">No pending KYC submissions</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Deposits */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Pending Deposits</h3>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-semibold">
                  {deposits.filter(d => d.status === 'pending').length}
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deposits.filter(d => d.status === 'pending').slice(0, 5).map(deposit => (
                  <div key={deposit.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 hover:border-emerald-500/30 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-emerald-400 text-lg">
                          ${parseFloat(deposit.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-zinc-400">{deposit.users?.email}</p>
                        <p className="text-xs text-zinc-500 mt-1">{formatDate(deposit.created_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDocument('payment-proofs', deposit.payment_proof_url)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition"
                          title="View Proof"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => approveDeposit(deposit.id)}
                          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => rejectDeposit(deposit.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {deposits.filter(d => d.status === 'pending').length === 0 && (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
                    <p className="text-zinc-500">No pending deposits</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Withdrawals */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Pending Withdrawals</h3>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-semibold">
                  {withdrawals.filter(w => w.status === 'pending').length}
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {withdrawals.filter(w => w.status === 'pending').slice(0, 5).map(withdrawal => (
                  <div key={withdrawal.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 hover:border-purple-500/30 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-purple-400 text-lg">
                          ${parseFloat(withdrawal.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-zinc-400">{withdrawal.users?.email}</p>
                        <p className="text-xs text-zinc-500 mt-1">{formatDate(withdrawal.created_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveWithdrawal(withdrawal.id)}
                          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => rejectWithdrawal(withdrawal.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                  <div className="text-center py-12">
                    <ArrowUpRight className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
                    <p className="text-zinc-500">No pending withdrawals</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {[...deposits, ...withdrawals]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 8)
                  .map((item, idx) => {
                    const isDeposit = 'payment_proof_url' in item;
                    return (
                      <div key={idx} className="flex items-center gap-3 py-2">
                        <div className={`p-2 rounded-lg ${isDeposit ? 'bg-emerald-500/20' : 'bg-purple-500/20'}`}>
                          {isDeposit ? (
                            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">
                            {isDeposit ? 'Deposit' : 'Withdrawal'}
                          </p>
                          <p className="text-xs text-zinc-400">{item.users?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${isDeposit ? 'text-emerald-400' : 'text-purple-400'}`}>
                            ${parseFloat(item.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-zinc-500">{formatDate(item.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
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
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Name</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Phone</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Submitted</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKyc.map(kyc => (
                    <tr key={kyc.id} className="border-t border-zinc-800 hover:bg-zinc-800/30 transition">
                      <td className="p-4">
                        <p className="font-semibold">{kyc.full_name}</p>
                      </td>
                      <td className="p-4 text-zinc-400">{kyc.email}</td>
                      <td className="p-4 text-zinc-400">{kyc.phone || 'N/A'}</td>
                      <td className="p-4">{getStatusBadge(kyc.status)}</td>
                      <td className="p-4 text-zinc-400">{formatDate(kyc.created_at)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedKyc(kyc)}
                            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition text-sm font-semibold"
                          >
                            Review
                          </button>
                          {kyc.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveKyc(kyc.id, kyc.user_id)}
                                className="p-2 bg-emerald-500/20 rounded-lg hover:bg-emerald-500/30 transition"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              </button>
                              <button
                                onClick={() => rejectKyc(kyc.id)}
                                className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition"
                                title="Reject"
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
              {filteredKyc.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No KYC submissions found</p>
                </div>
              )}
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
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">User</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Amount</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Date</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeposits.map(deposit => (
                    <tr key={deposit.id} className="border-t border-zinc-800 hover:bg-zinc-800/30 transition">
                      <td className="p-4">
                        <p className="font-semibold">{deposit.users?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-zinc-400">{deposit.users?.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-emerald-400 font-semibold text-lg">
                          ${parseFloat(deposit.amount).toLocaleString()}
                        </p>
                      </td>
                      <td className="p-4">{getStatusBadge(deposit.status)}</td>
                      <td className="p-4 text-zinc-400">{formatDate(deposit.created_at)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewDocument('payment-proofs', deposit.payment_proof_url)}
                            className="p-2 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition"
                            title="View Proof"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                          {deposit.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveDeposit(deposit.id)}
                                className="p-2 bg-emerald-500/20 rounded-lg hover:bg-emerald-500/30 transition"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              </button>
                              <button
                                onClick={() => rejectDeposit(deposit.id)}
                                className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition"
                                title="Reject"
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
              {filteredDeposits.length === 0 && (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No deposits found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">User</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Amount</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Date</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(withdrawal => (
                    <tr key={withdrawal.id} className="border-t border-zinc-800 hover:bg-zinc-800/30 transition">
                      <td className="p-4">
                        <p className="font-semibold">{withdrawal.users?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-zinc-400">{withdrawal.users?.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-purple-400 font-semibold text-lg">
                          ${parseFloat(withdrawal.amount).toLocaleString()}
                        </p>
                      </td>
                      <td className="p-4">{getStatusBadge(withdrawal.status)}</td>
                      <td className="p-4 text-zinc-400">{formatDate(withdrawal.created_at)}</td>
                      <td className="p-4">
                        {withdrawal.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => approveWithdrawal(withdrawal.id)}
                              className="p-2 bg-emerald-500/20 rounded-lg hover:bg-emerald-500/30 transition"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => rejectWithdrawal(withdrawal.id)}
                              className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {withdrawals.length === 0 && (
                <div className="text-center py-12">
                  <ArrowUpRight className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No withdrawals yet</p>
                </div>
              )}
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
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">User</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Balance</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Joined</th>
                    <th className="text-left p-4 text-sm font-semibold text-zinc-300">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => 
                    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(user => (
                    <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-800/30 transition">
                      <td className="p-4">
                        <p className="font-semibold">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-zinc-400">{user.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-emerald-400 font-semibold text-lg">
                          ${user.balances?.[0]?.available_balance?.toLocaleString() || '0.00'}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          user.is_approved 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {user.is_approved ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400">{formatDate(user.created_at)}</td>
                      <td className="p-4">
                        {user.is_admin && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                            ADMIN
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BANKS TAB */}
        {activeTab === 'banks' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bankAccounts.map(bank => (
                <div key={bank.id} className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-emerald-500/30 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl mb-1">{bank.bank_name}</h3>
                      <p className="text-sm text-zinc-400">{bank.account_holder_name}</p>
                    </div>
                    {bank.is_active && (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-zinc-500">Account Number</p>
                      <p className="font-mono text-sm">{bank.account_number}</p>
                    </div>
                    {bank.routing_number && (
                      <div>
                        <p className="text-xs text-zinc-500">Routing Number</p>
                        <p className="font-mono text-sm">{bank.routing_number}</p>
                      </div>
                    )}
                    {bank.swift_code && (
                      <div>
                        <p className="text-xs text-zinc-500">SWIFT Code</p>
                        <p className="font-mono text-sm">{bank.swift_code}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {bankAccounts.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No bank accounts configured</p>
              </div>
            )}
          </div>
        )}

        {/* KYC REVIEW MODAL */}
        {selectedKyc && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" 
            onClick={() => setSelectedKyc(null)}
          >
            <div 
              className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-10">
                <div>
                  <h2 className="text-2xl font-bold">KYC Review</h2>
                  <p className="text-sm text-zinc-400 mt-1">Review documents and approve/reject</p>
                </div>
                <button 
                  onClick={() => setSelectedKyc(null)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition"
                >
                  <XCircle className="h-6 w-6 text-zinc-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-xs text-zinc-400 mb-1">Full Name</p>
                    <p className="font-semibold text-lg">{selectedKyc.full_name}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-xs text-zinc-400 mb-1">Email</p>
                    <p className="font-semibold">{selectedKyc.email}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-xs text-zinc-400 mb-1">Phone</p>
                    <p className="font-semibold">{selectedKyc.phone || 'Not provided'}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-xs text-zinc-400 mb-1">Address</p>
                    <p className="font-semibold text-sm">{selectedKyc.address || 'Not provided'}</p>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Submitted Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => viewDocument('kyc-documents', selectedKyc.id_document_url)}
                      className="p-6 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-500/50 transition group"
                    >
                      <FileText className="h-8 w-8 text-emerald-400 mb-3 mx-auto group-hover:scale-110 transition" />
                      <p className="text-sm font-semibold">ID Document</p>
                      <p className="text-xs text-zinc-400 mt-1">Click to view</p>
                    </button>
                    <button
                      onClick={() => viewDocument('kyc-documents', selectedKyc.address_proof_url)}
                      className="p-6 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-500/50 transition group"
                    >
                      <FileText className="h-8 w-8 text-blue-400 mb-3 mx-auto group-hover:scale-110 transition" />
                      <p className="text-sm font-semibold">Address Proof</p>
                      <p className="text-xs text-zinc-400 mt-1">Click to view</p>
                    </button>
                    <button
                      onClick={() => viewDocument('kyc-documents', selectedKyc.selfie_url)}
                      className="p-6 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-500/50 transition group"
                    >
                      <User className="h-8 w-8 text-purple-400 mb-3 mx-auto group-hover:scale-110 transition" />
                      <p className="text-sm font-semibold">Selfie</p>
                      <p className="text-xs text-zinc-400 mt-1">Click to view</p>
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-xs text-zinc-400 mb-2">Current Status</p>
                  {getStatusBadge(selectedKyc.status)}
                  {selectedKyc.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded">
                      <p className="text-xs text-zinc-400 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-400">{selectedKyc.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedKyc.status === 'pending' && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => approveKyc(selectedKyc.id, selectedKyc.user_id)}
                      className="flex-1 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
                    >
                      Approve KYC
                    </button>
                    <button
                      onClick={() => rejectKyc(selectedKyc.id)}
                      className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-red-500/20"
                    >
                      Reject KYC
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