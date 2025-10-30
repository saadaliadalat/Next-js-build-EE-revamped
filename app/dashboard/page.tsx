'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Wallet, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle, XCircle, Copy, AlertCircle,
  Upload, FileText, CreditCard, RefreshCw, Eye, Info,
  Shield, DollarSign, Activity, Send, Download
} from 'lucide-react';

export default function ProductionUserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [kycStatus, setKycStatus] = useState('not_submitted');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Deposit Form
  const [depositAmount, setDepositAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  // Withdrawal Form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState('');

  useEffect(() => {
    initializeDashboard();
  }, []);

  async function initializeDashboard() {
    await checkUser();
    setLoading(false);
  }

  useEffect(() => {
    if (user) {
      fetchAllData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  function setupRealtimeSubscriptions() {
    const depositsChannel = supabase
      .channel('user-deposits')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'deposits', filter: `user_id=eq.${user.id}` },
        () => fetchAllData()
      )
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('user-withdrawals')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${user.id}` },
        () => fetchAllData()
      )
      .subscribe();

    const balancesChannel = supabase
      .channel('user-balance')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'balances', filter: `user_id=eq.${user.id}` },
        () => fetchBalance()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(depositsChannel);
      supabase.removeChannel(withdrawalsChannel);
      supabase.removeChannel(balancesChannel);
    };
  }

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/auth/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userData) {
      setUser(userData);
    }
  }

  async function fetchAllData() {
    await Promise.all([
      fetchBalance(),
      fetchBankAccounts(),
      fetchDeposits(),
      fetchWithdrawals(),
      fetchKycStatus()
    ]);
  }

  async function fetchBankAccounts() {
    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    setBankAccounts(data || []);
  }

  async function fetchBalance() {
    if (!user) return;

    let { data: balanceData, error } = await supabase
      .from('balances')
      .select('available_balance, pending_balance')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newBalance } = await supabase
        .from('balances')
        .insert({ 
          user_id: user.id, 
          available_balance: 0,
          pending_balance: 0 
        })
        .select()
        .single();
      
      balanceData = newBalance;
    }

    setBalance(balanceData?.available_balance || 0);
    setPendingBalance(balanceData?.pending_balance || 0);
  }

  async function fetchDeposits() {
    if (!user) return;

    const { data } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    setDeposits(data || []);
  }

  async function fetchWithdrawals() {
    if (!user) return;

    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    setWithdrawals(data || []);
  }

  async function fetchKycStatus() {
    if (!user) return;

    const { data } = await supabase
      .from('kyc_submissions')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setKycStatus(data.status);
    } else {
      setKycStatus('not_submitted');
    }
  }

  async function handleDepositSubmit() {
    if (!user?.is_approved) {
      alert('⚠️ Complete KYC verification to make deposits');
      router.push('/kyc');
      return;
    }

    if (!proofFile) {
      alert('⚠️ Please upload payment proof');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) < 10) {
      alert('⚠️ Minimum deposit is $10');
      return;
    }

    setSubmitting(true);

    try {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}/deposit-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      const { error: depositError } = await supabase
        .from('deposits')
        .insert({
          user_id: user.id,
          amount: parseFloat(depositAmount),
          payment_proof_url: fileName,
          status: 'pending'
        });

      if (depositError) throw depositError;

      alert('✅ Deposit submitted! Awaiting admin approval.');
      setDepositAmount('');
      setProofFile(null);
      await fetchAllData();

    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdrawalSubmit() {
    if (!user?.is_approved) {
      alert('⚠️ Complete KYC verification first');
      router.push('/kyc');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) < 50) {
      alert('⚠️ Minimum withdrawal is $50');
      return;
    }

    if (parseFloat(withdrawAmount) > balance) {
      alert('⚠️ Insufficient balance');
      return;
    }

    if (!withdrawBankName || !withdrawAccountNumber || !withdrawAccountHolder) {
      alert('⚠️ Please fill all bank details');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: parseFloat(withdrawAmount),
          bank_name: withdrawBankName,
          account_number: withdrawAccountNumber,
          account_holder_name: withdrawAccountHolder,
          status: 'pending'
        });

      if (error) throw error;

      alert('✅ Withdrawal request submitted! Awaiting admin approval.');
      setWithdrawAmount('');
      setWithdrawBankName('');
      setWithdrawAccountNumber('');
      setWithdrawAccountHolder('');
      await fetchAllData();

    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(''), 2000);
  }

  function getStatusBadge(status) {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
      completed: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    };

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      completed: CheckCircle
    };

    const Icon = icons[status] || Clock;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${styles[status]}`}>
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </span>
    );
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const totalDeposited = deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + Number(d.amount), 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + Number(w.amount), 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, <span className="text-white">{user?.full_name || user?.email}</span>
              </h1>
              <p className="text-zinc-500">Manage your trading account</p>
            </div>
            <button
              onClick={fetchAllData}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KYC Status Banners */}
        {kycStatus === 'not_submitted' && (
          <div className="relative bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 border-2 border-yellow-500/50 rounded-2xl p-6 shadow-2xl mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Shield className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Complete KYC Verification</h3>
                  <p className="text-zinc-400">Verify your identity to start trading and making deposits</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/kyc')}
                className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all hover:scale-105 shadow-lg"
              >
                Start KYC →
              </button>
            </div>
          </div>
        )}

        {kycStatus === 'pending' && (
          <div className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-lg text-yellow-400 mb-1">KYC Under Review</p>
                <p className="text-zinc-400">Your submission is being reviewed. Usually takes 24-48 hours.</p>
              </div>
            </div>
          </div>
        )}

        {kycStatus === 'approved' && user?.is_approved && (
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-bold text-emerald-400">✓ Account Verified - Ready to Trade</p>
            </div>
          </div>
        )}

        {kycStatus === 'rejected' && (
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <XCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-bold text-lg text-red-400 mb-1">KYC Rejected</p>
                <p className="text-zinc-400 mb-3">Please resubmit with correct documents.</p>
                <button
                  onClick={() => router.push('/kyc')}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition"
                >
                  Resubmit KYC
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-zinc-100 border-2 border-white rounded-2xl p-6 text-black shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-black" />
              <p className="text-zinc-700 text-sm font-bold">Available Balance</p>
            </div>
            <h2 className="text-4xl font-black mb-2">${balance.toFixed(2)}</h2>
            <p className="text-xs text-zinc-600 font-semibold">Ready to trade</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-yellow-400" />
              <p className="text-zinc-400 text-sm font-bold">Pending</p>
            </div>
            <h2 className="text-4xl font-black text-yellow-400 mb-2">${pendingBalance.toFixed(2)}</h2>
            <p className="text-xs text-zinc-500 font-semibold">Awaiting approval</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownRight className="h-5 w-5 text-emerald-400" />
              <p className="text-zinc-400 text-sm font-bold">Total Deposited</p>
            </div>
            <h2 className="text-4xl font-black text-emerald-400 mb-2">${totalDeposited.toFixed(2)}</h2>
            <p className="text-xs text-zinc-500 font-semibold">All-time</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight className="h-5 w-5 text-purple-400" />
              <p className="text-zinc-400 text-sm font-bold">Total Withdrawn</p>
            </div>
            <h2 className="text-4xl font-black text-purple-400 mb-2">${totalWithdrawn.toFixed(2)}</h2>
            <p className="text-xs text-zinc-500 font-semibold">All-time</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'deposit', label: 'Deposit', icon: Download },
            { id: 'withdraw', label: 'Withdraw', icon: Send },
            { id: 'history', label: 'History', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                Recent Deposits
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deposits.slice(0, 5).length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No deposits yet</p>
                  </div>
                ) : (
                  deposits.slice(0, 5).map((deposit) => (
                    <div key={deposit.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <ArrowDownRight className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">${Number(deposit.amount).toFixed(2)}</p>
                          <p className="text-xs text-zinc-500">{formatDate(deposit.created_at)}</p>
                        </div>
                      </div>
                      {getStatusBadge(deposit.status)}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-purple-400" />
                Recent Withdrawals
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {withdrawals.slice(0, 5).length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No withdrawals yet</p>
                  </div>
                ) : (
                  withdrawals.slice(0, 5).map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <ArrowUpRight className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">${Number(withdrawal.amount).toFixed(2)}</p>
                          <p className="text-xs text-zinc-500">{formatDate(withdrawal.created_at)}</p>
                        </div>
                      </div>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* DEPOSIT TAB */}
        {activeTab === 'deposit' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bank Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CreditCard className="h-6 w-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold">Company Bank Details</h2>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No active bank accounts</p>
                </div>
              ) : (
                bankAccounts.map((bank) => (
                  <div key={bank.id} className="space-y-4">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                      <p className="text-xs text-zinc-500 mb-2 font-bold">BANK NAME</p>
                      <p className="text-2xl font-black text-emerald-400">{bank.bank_name}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                        <div>
                          <p className="text-xs text-zinc-500 font-bold mb-1">ACCOUNT HOLDER</p>
                          <p className="font-bold">{bank.account_holder_name}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(bank.account_holder_name, 'Account Holder')}
                          className="p-2 hover:bg-zinc-700 rounded-lg transition"
                        >
                          {copiedField === 'Account Holder' ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-zinc-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                        <div>
                          <p className="text-xs text-zinc-500 font-bold mb-1">ACCOUNT NUMBER</p>
                          <p className="font-mono font-bold">{bank.account_number}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(bank.account_number, 'Account Number')}
                          className="p-2 hover:bg-zinc-700 rounded-lg transition"
                        >
                          {copiedField === 'Account Number' ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-zinc-400" />
                          )}
                        </button>
                      </div>

                      {bank.routing_number && (
                        <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                          <div>
                            <p className="text-xs text-zinc-500 font-bold mb-1">ROUTING NUMBER</p>
                            <p className="font-mono font-bold">{bank.routing_number}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(bank.routing_number, 'Routing Number')}
                            className="p-2 hover:bg-zinc-700 rounded-lg transition"
                          >
                            {copiedField === 'Routing Number' ? (
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4 text-zinc-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {bank.instructions && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-blue-400 mb-1">Important Instructions</p>
                            <p className="text-sm text-zinc-400">{bank.instructions}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Deposit Form */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Upload className="h-6 w-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold">Submit Deposit</h2>
              </div>

              {!user?.is_approved ? (
                <div className="text-center py-12 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <Shield className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <p className="text-yellow-400 font-bold mb-2">KYC Required</p>
                  <p className="text-zinc-400 text-sm mb-4">Complete verification to deposit</p>
                  <button
                    onClick={() => router.push('/kyc')}
                    className="px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-600 transition"
                  >
                    Verify Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2">
                      Amount (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="number"
                        step="0.01"
                        min="10"
                        placeholder="Minimum $10"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-white transition font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Payment Proof (Receipt/Screenshot)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-black file:font-bold hover:file:bg-zinc-200 file:transition focus:outline-none focus:border-white transition"
                      required
                    />
                    <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      JPG, PNG, PDF - Max 5MB
                    </p>
                  </div>

                  {proofFile && (
                    <div className="text-xs text-emerald-400 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl font-bold">
                      ✓ Selected: {proofFile.name}
                    </div>
                  )}

                  <button
                    onClick={handleDepositSubmit}
                    disabled={submitting}
                    className="w-full px-6 py-4 bg-white text-black rounded-xl font-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-lg"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Submit Deposit
                      </>
                    )}
                  </button>

                  <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      <Info className="h-3 w-3 inline mr-1" />
                      After transferring funds to our bank account, upload your payment receipt here. Your balance will be updated within 24 hours after admin approval.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WITHDRAW TAB */}
        {activeTab === 'withdraw' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Send className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Request Withdrawal</h2>
                  <p className="text-sm text-zinc-500">Minimum $50 withdrawal</p>
                </div>
              </div>

              {!user?.is_approved ? (
                <div className="text-center py-12 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <Shield className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <p className="text-yellow-400 font-bold mb-2">KYC Required</p>
                  <p className="text-zinc-400 text-sm mb-4">Complete verification to withdraw</p>
                  <button
                    onClick={() => router.push('/kyc')}
                    className="px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-600 transition"
                  >
                    Verify Now
                  </button>
                </div>
              ) : balance < 50 ? (
                <div className="text-center py-12 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 font-bold mb-2">Insufficient Balance</p>
                  <p className="text-zinc-400 text-sm">Minimum withdrawal is $50. Your balance: ${balance.toFixed(2)}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-sm text-zinc-400 mb-1">Available Balance</p>
                    <p className="text-3xl font-black">${balance.toFixed(2)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2">
                      Withdrawal Amount (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="number"
                        step="0.01"
                        min="50"
                        max={balance}
                        placeholder="Minimum $50"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-white transition font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-5">
                    <p className="text-sm font-bold text-zinc-400 mb-4">Your Bank Details</p>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Bank Name"
                        value={withdrawBankName}
                        onChange={(e) => setWithdrawBankName(e.target.value)}
                        className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-white transition font-bold"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Account Holder Name"
                        value={withdrawAccountHolder}
                        onChange={(e) => setWithdrawAccountHolder(e.target.value)}
                        className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-white transition font-bold"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Account Number"
                        value={withdrawAccountNumber}
                        onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                        className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-white transition font-bold"
                        required
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleWithdrawalSubmit}
                    disabled={submitting}
                    className="w-full px-6 py-4 bg-white text-black rounded-xl font-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-lg"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Request Withdrawal
                      </>
                    )}
                  </button>

                  <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      <Info className="h-3 w-3 inline mr-1" />
                      Withdrawals are processed within 1-3 business days. Ensure your bank details are correct to avoid delays.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transaction History
              </h3>
              <p className="text-sm text-zinc-500">
                {deposits.length + withdrawals.length} total transactions
              </p>
            </div>

            <div className="space-y-3">
              {[...deposits.map(d => ({...d, type: 'deposit'})), ...withdrawals.map(w => ({...w, type: 'withdrawal'}))]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .length === 0 ? (
                <div className="text-center py-16">
                  <Activity className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-500 text-lg font-bold mb-2">No transactions yet</p>
                  <p className="text-zinc-600 text-sm">Your deposits and withdrawals will appear here</p>
                </div>
              ) : (
                [...deposits.map(d => ({...d, type: 'deposit'})), ...withdrawals.map(w => ({...w, type: 'withdrawal'}))]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((transaction) => (
                    <div key={transaction.id} className="p-5 bg-zinc-800/30 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${
                            transaction.type === 'deposit' 
                              ? 'bg-emerald-500/10' 
                              : 'bg-purple-500/10'
                          }`}>
                            {transaction.type === 'deposit' ? (
                              <ArrowDownRight className="h-6 w-6 text-emerald-400" />
                            ) : (
                              <ArrowUpRight className="h-6 w-6 text-purple-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold capitalize text-lg mb-1">
                              {transaction.type}
                            </p>
                            <p className="text-sm text-zinc-500 mb-2">
                              {formatDate(transaction.created_at)}
                            </p>
                            <p className={`text-2xl font-black ${
                              transaction.type === 'deposit' ? 'text-emerald-400' : 'text-purple-400'
                            }`}>
                              {transaction.type === 'deposit' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>

                      {transaction.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-xs text-red-400 font-bold mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-300">{transaction.rejection_reason}</p>
                        </div>
                      )}

                      {transaction.admin_notes && (
                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <p className="text-xs text-blue-400 font-bold mb-1">Admin Note:</p>
                          <p className="text-sm text-blue-300">{transaction.admin_notes}</p>
                        </div>
                      )}

                      {transaction.type === 'withdrawal' && transaction.bank_name && (
                        <div className="mt-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
                          <p className="text-xs text-zinc-500 font-bold mb-2">Bank Details:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-zinc-500">Bank:</p>
                              <p className="text-white font-bold">{transaction.bank_name}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500">Account Holder:</p>
                              <p className="text-white font-bold">{transaction.account_holder_name}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}