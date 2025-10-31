'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, XCircle, Clock, Eye, Users, Wallet, TrendingUp, 
  FileText, Search, RefreshCw, Building2, ArrowUpRight, ArrowDownRight, 
  User, Shield, DollarSign, Plus, X
} from 'lucide-react';

// Helper to get auth token
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

// API Helpers
async function fetchAdminData(endpoint: string) {
  const token = await getAuthToken();
  const res = await fetch(`/api/admin/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function updateAdminData(endpoint: string, data: any) {
  const token = await getAuthToken();
  const res = await fetch(`/api/admin/${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function createAdminData(endpoint: string, data: any) {
  const token = await getAuthToken();
  const res = await fetch(`/api/admin/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function getDocumentUrl(bucket: string, path: string) {
  const token = await getAuthToken();
  const res = await fetch(`/api/admin/documents/${bucket}/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.url;
}

export default function CompleteAdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [kycSubmissions, setKycSubmissions] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    approvedUsers: 0,
    pendingKyc: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });

  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  
  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    type: 'credit',
    reason: ''
  });

  const [tradeForm, setTradeForm] = useState({
    tradeType: 'buy',
    symbol: '',
    quantity: '',
    entryPrice: '',
    exitPrice: '',
    profitLoss: '',
    status: 'open'
  });

  useEffect(() => {
    initializeAdmin();
  }, []);

  async function initializeAdmin() {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return;
    await fetchAllData();
    setLoading(false);
  }

  async function checkAdminAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please login first');
      router.push('/auth/login');
      return false;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      alert('Access denied. Admin only.');
      router.push('/dashboard');
      return false;
    }

    return true;
  }

  async function fetchAllData() {
    try {
      const [kycData, depositsData, withdrawalsData, usersData, tradesData] = await Promise.all([
        fetchAdminData('kyc'),
        fetchAdminData('deposits'),
        fetchAdminData('withdrawals'),
        fetchAdminData('users'),
        fetchAdminData('trades')
      ]);

      setKycSubmissions(kycData.submissions || []);
      setDeposits(depositsData.deposits || []);
      setWithdrawals(withdrawalsData.withdrawals || []);
      setUsers(usersData.users || []);
      setTrades(tradesData.trades || []);

      const { data: banks } = await supabase.from('bank_accounts').select('*');
      setBankAccounts(banks || []);

      calculateStats();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  function calculateStats() {
    setStats({
      totalUsers: users.length,
      approvedUsers: users.filter((u: any) => u.is_approved).length,
      pendingKyc: kycSubmissions.filter((k: any) => k.status === 'pending').length,
      pendingDeposits: deposits.filter((d: any) => d.status === 'pending').length,
      pendingWithdrawals: withdrawals.filter((w: any) => w.status === 'pending').length,
      totalDeposits: deposits.filter((d: any) => d.status === 'approved').reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0),
      totalWithdrawals: withdrawals.filter((w: any) => w.status === 'approved').reduce((sum: number, w: any) => sum + parseFloat(w.amount), 0)
    });
  }

  async function handleKycAction(kycId: string, status: 'approved' | 'rejected', reason?: string) {
    const result = await updateAdminData('kyc', { kycId, status, reason });
    if (result.success) {
      alert(`KYC ${status}!`);
      await fetchAllData();
      setSelectedKyc(null);
    }
  }

  async function handleDepositAction(depositId: string, status: 'approved' | 'rejected', reason?: string) {
    const result = await updateAdminData('deposits', { depositId, status, reason });
    if (result.success) {
      alert(`Deposit ${status}!`);
      await fetchAllData();
    }
  }

  async function handleWithdrawalAction(withdrawalId: string, status: 'approved' | 'rejected', reason?: string) {
    const result = await updateAdminData('withdrawals', { withdrawalId, status, reason });
    if (result.success) {
      alert(`Withdrawal ${status}!`);
      await fetchAllData();
    }
  }

  async function handleBalanceAdjustment() {
    if (!selectedUser || !balanceForm.amount || !balanceForm.reason) {
      alert('Please fill all fields');
      return;
    }

    const result = await createAdminData('balance/adjust', {
      userId: selectedUser.id,
      amount: parseFloat(balanceForm.amount),
      type: balanceForm.type,
      reason: balanceForm.reason
    });

    if (result.success) {
      alert(`Balance adjusted! New: $${result.newBalance}`);
      setShowBalanceModal(false);
      setBalanceForm({ amount: '', type: 'credit', reason: '' });
      await fetchAllData();
    }
  }

  async function handleTradeCreate() {
    if (!selectedUser || !tradeForm.symbol || !tradeForm.quantity || !tradeForm.entryPrice) {
      alert('Fill required fields');
      return;
    }

    const result = await createAdminData('trades', {
      userId: selectedUser.id,
      ...tradeForm
    });

    if (result.trade) {
      alert('Trade created!');
      setShowTradeModal(false);
      setTradeForm({ tradeType: 'buy', symbol: '', quantity: '', entryPrice: '', exitPrice: '', profitLoss: '', status: 'open' });
      await fetchAllData();
    }
  }

  async function viewDocument(bucket: string, path: string) {
    const url = await getDocumentUrl(bucket, path);
    if (url) window.open(url, '_blank');
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-900/30 text-yellow-400',
      approved: 'bg-emerald-900/30 text-emerald-400',
      rejected: 'bg-red-900/30 text-red-400',
      open: 'bg-blue-900/30 text-blue-400',
      closed: 'bg-zinc-700/30 text-zinc-400'
    };
    return <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${styles[status]}`}>{status.toUpperCase()}</span>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-zinc-400">Complete platform control</p>
            </div>
            <button onClick={fetchAllData} className="p-3 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <Users className="w-8 h-8 text-blue-400 mb-4" />
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-emerald-400">{stats.approvedUsers} verified</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <Shield className="w-8 h-8 text-yellow-400 mb-4" />
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingKyc}</p>
              <p className="text-sm text-zinc-400">Pending KYC</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <ArrowDownRight className="w-8 h-8 text-emerald-400 mb-4" />
              <p className="text-3xl font-bold text-emerald-400">${stats.totalDeposits.toLocaleString()}</p>
              <p className="text-sm text-yellow-400">{stats.pendingDeposits} pending</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <TrendingUp className="w-8 h-8 text-purple-400 mb-4" />
              <p className="text-3xl font-bold text-purple-400">{trades.length}</p>
              <p className="text-sm text-zinc-400">{trades.filter((t: any) => t.status === 'open').length} open</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['overview', 'kyc', 'deposits', 'withdrawals', 'users', 'trades', 'banks'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap ${
                activeTab === tab ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg"
            />
            <div className="bg-zinc-900 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Balance</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter((u: any) => 
                    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((user: any) => (
                    <tr key={user.id} className="border-t border-zinc-800">
                      <td className="p-4">
                        <p className="font-semibold">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-zinc-400">{user.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-emerald-400 font-semibold">
                          ${user.balances?.[0]?.available_balance?.toLocaleString() || '0.00'}
                        </p>
                      </td>
                      <td className="p-4">
                        {user.is_approved ? (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs">VERIFIED</span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs">PENDING</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBalanceModal(true);
                            }}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-1"
                          >
                            <DollarSign className="w-3 h-3" />
                            Adjust
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowTradeModal(true);
                            }}
                            className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Trade
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

        {/* KYC TAB */}
        {activeTab === 'kyc' && (
          <div className="bg-zinc-900 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycSubmissions.map((kyc: any) => (
                  <tr key={kyc.id} className="border-t border-zinc-800">
                    <td className="p-4">{kyc.full_name}</td>
                    <td className="p-4">{kyc.email}</td>
                    <td className="p-4">{getStatusBadge(kyc.status)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedKyc(kyc)}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BALANCE MODAL */}
        {showBalanceModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowBalanceModal(false)}>
            <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between mb-6">
                <h3 className="text-xl font-bold">Adjust Balance</h3>
                <button onClick={() => setShowBalanceModal(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-sm text-zinc-400">User</p>
                  <p className="font-semibold">{selectedUser.email}</p>
                  <p className="text-sm text-emerald-400">Current: ${selectedUser.balances?.[0]?.available_balance || '0.00'}</p>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount (use negative for debit)"
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceForm({...balanceForm, amount: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-800 rounded-lg"
                />
                <select
                  value={balanceForm.type}
                  onChange={(e) => setBalanceForm({...balanceForm, type: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-800 rounded-lg"
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                  <option value="correction">Correction</option>
                </select>
                <textarea
                  placeholder="Reason (required)"
                  value={balanceForm.reason}
                  onChange={(e) => setBalanceForm({...balanceForm, reason: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-800 rounded-lg h-24"
                />
                <button
                  onClick={handleBalanceAdjustment}
                  className="w-full px-6 py-3 bg-emerald-500 text-black rounded-lg font-semibold"
                >
                  Adjust Balance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TRADE MODAL */}
        {showTradeModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowTradeModal(false)}>
            <div className="bg-zinc-900 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between mb-6">
                <h3 className="text-xl font-bold">Create Trade</h3>
                <button onClick={() => setShowTradeModal(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="font-semibold">{selectedUser.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select value={tradeForm.tradeType} onChange={(e) => setTradeForm({...tradeForm, tradeType: e.target.value})} className="px-4 py-3 bg-zinc-800 rounded-lg">
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                  <input type="text" placeholder="Symbol (AAPL)" value={tradeForm.symbol} onChange={(e) => setTradeForm({...tradeForm, symbol: e.target.value.toUpperCase()})} className="px-4 py-3 bg-zinc-800 rounded-lg uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" step="0.00000001" placeholder="Quantity" value={tradeForm.quantity} onChange={(e) => setTradeForm({...tradeForm, quantity: e.target.value})} className="px-4 py-3 bg-zinc-800 rounded-lg" />
                  <input type="number" step="0.01" placeholder="Entry Price" value={tradeForm.entryPrice} onChange={(e) => setTradeForm({...tradeForm, entryPrice: e.target.value})} className="px-4 py-3 bg-zinc-800 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" step="0.01" placeholder="Exit Price (optional)" value={tradeForm.exitPrice} onChange={(e) => setTradeForm({...tradeForm, exitPrice: e.target.value})} className="px-4 py-3 bg-zinc-800 rounded-lg" />
                  <input type="number" step="0.01" placeholder="Profit/Loss" value={tradeForm.profitLoss} onChange={(e) => setTradeForm({...tradeForm, profitLoss: e.target.value})} className="px-4 py-3 bg-zinc-800 rounded-lg" />
                </div>
                <select value={tradeForm.status} onChange={(e) => setTradeForm({...tradeForm, status: e.target.value})} className="w-full px-4 py-3 bg-zinc-800 rounded-lg">
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="pending">Pending</option>
                </select>
                <button onClick={handleTradeCreate} className="w-full px-6 py-3 bg-emerald-500 text-black rounded-lg font-semibold">
                  Create Trade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KYC REVIEW MODAL */}
        {selectedKyc && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedKyc(null)}>
            <div className="bg-zinc-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-zinc-800 flex justify-between">
                <h2 className="text-2xl font-bold">KYC Review</h2>
                <button onClick={() => setSelectedKyc(null)}><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-xs text-zinc-400">Name</p>
                    <p className="font-semibold">{selectedKyc.full_name}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-xs text-zinc-400">Email</p>
                    <p className="font-semibold">{selectedKyc.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-4">Documents</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button onClick={() => viewDocument('kyc-documents', selectedKyc.id_document_url)} className="p-6 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 border-2 border-zinc-700">
                      <FileText className="h-8 w-8 text-emerald-400 mb-3 mx-auto" />
                      <p className="text-sm font-semibold">ID Document</p>
                    </button>
                    <button onClick={() => viewDocument('kyc-documents', selectedKyc.address_proof_url)} className="p-6 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 border-2 border-zinc-700">
                      <FileText className="h-8 w-8 text-blue-400 mb-3 mx-auto" />
                      <p className="text-sm font-semibold">Address Proof</p>
                    </button>
                    <button onClick={() => viewDocument('kyc-documents', selectedKyc.selfie_url)} className="p-6 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 border-2 border-zinc-700">
                      <User className="h-8 w-8 text-purple-400 mb-3 mx-auto" />
                      <p className="text-sm font-semibold">Selfie</p>
                    </button>
                  </div>
                </div>
                {selectedKyc.status === 'pending' && (
                  <div className="flex gap-4">
                    <button onClick={() => handleKycAction(selectedKyc.id, 'approved')} className="flex-1 px-6 py-4 bg-emerald-500 text-black rounded-lg font-semibold">
                      Approve
                    </button>
                    <button onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) handleKycAction(selectedKyc.id, 'rejected', reason);
                    }} className="flex-1 px-6 py-4 bg-red-500 text-white rounded-lg font-semibold">
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