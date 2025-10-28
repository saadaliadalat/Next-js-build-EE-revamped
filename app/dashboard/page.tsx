'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Wallet, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle, XCircle, Copy, AlertCircle,
  Upload, FileText, CreditCard, RefreshCw, Eye, Info
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  routing_number: string | null;
  instructions: string | null;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  rejection_reason?: string;
  admin_notes?: string;
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  rejection_reason?: string;
  admin_notes?: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [kycStatus, setKycStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected'>('not_submitted');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    checkUser();
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchDeposits();
      fetchWithdrawals();
      fetchKycStatus();
    }
  }, [user]);

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
      setUser(userData as User);
    }
    setLoading(false);
  }

  async function fetchBankAccounts() {
    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    setBankAccounts(data as BankAccount[] || []);
  }

  async function fetchBalance() {
    if (!user) return;

    // Try to get balance
    let { data: balanceData, error } = await supabase
      .from('balances')
      .select('amount')
      .eq('user_id', user.id)
      .eq('currency', 'USD')
      .single();

    // If balance doesn't exist, create it
    if (error && error.code === 'PGRST116') {
      const { data: newBalance } = await supabase
        .from('balances')
        .insert({ user_id: user.id, amount: 0, currency: 'USD' })
        .select()
        .single();
      
      balanceData = newBalance;
    }

    setBalance(balanceData?.amount || 0);

    // Calculate pending deposits
    const { data: pendingDeposits } = await supabase
      .from('deposits')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'pending');
    
    const pending = pendingDeposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
    setPendingBalance(pending);
  }

  async function fetchDeposits() {
    if (!user) return;

    const { data } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setDeposits(data as Deposit[] || []);
  }

  async function fetchWithdrawals() {
    if (!user) return;

    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setWithdrawals(data as Withdrawal[] || []);
  }

  async function fetchKycStatus() {
    if (!user) return;

    const { data } = await supabase
      .from('kyc_submissions')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false})
      .limit(1)
      .single();

    if (data) {
      setKycStatus(data.status as any);
    } else {
      setKycStatus('not_submitted');
    }
  }

  async function handleDepositSubmit() {
    if (!user?.is_approved) {
      alert('Complete KYC verification to make deposits');
      router.push('/kyc');
      return;
    }

    if (!proofFile) {
      alert('Please upload payment proof');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) < 10) {
      alert('Minimum deposit is $10');
      return;
    }

    if (!bankAccounts.length) {
      alert('No bank accounts available');
      return;
    }

    setSubmitting(true);

    try {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('deposit-proofs')
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      const { error: depositError } = await supabase
        .from('deposits')
        .insert({
          user_id: user.id,
          amount: parseFloat(depositAmount),
          currency: 'USD',
          proof_filename: fileName,
          status: 'pending'
        });

      if (depositError) throw depositError;

      alert('Deposit submitted successfully! Awaiting admin approval.');
      setDepositAmount('');
      setProofFile(null);
      fetchDeposits();
      fetchBalance();

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    alert(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(''), 2000);
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
      approved: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50',
      rejected: 'bg-red-900/30 text-red-400 border-red-800/50',
      completed: 'bg-blue-900/30 text-blue-400 border-blue-800/50'
    };

    const icons: Record<string, JSX.Element> = {
      pending: <Clock className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${styles[status] || ''}`}>
        {icons[status]}
        {status.toUpperCase()}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.full_name || user?.email}</h1>
          <p className="text-zinc-400">Manage your trading account</p>
        </div>

        {/* KYC Status Banners */}
        {kycStatus === 'not_submitted' && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 shadow-xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-8 h-8 text-white flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Complete KYC Verification</h3>
                  <p className="text-white/90">Verify your identity to start trading and making deposits</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/kyc')}
                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                Start KYC
              </button>
            </div>
          </div>
        )}

        {kycStatus === 'pending' && (
          <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-6 mb-6 flex items-start gap-4">
            <Clock className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-lg text-yellow-400">⏳ KYC Under Review</p>
              <p className="text-sm text-zinc-300 mt-1">
                Your KYC submission is being reviewed. This usually takes 24-48 hours.
              </p>
            </div>
          </div>
        )}

        {kycStatus === 'approved' && user?.is_approved && (
          <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-400">✓ Account Verified</p>
          </div>
        )}

        {kycStatus === 'rejected' && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6 mb-6 flex items-start gap-4">
            <XCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-lg text-red-400">❌ KYC Rejected</p>
              <p className="text-sm text-zinc-300 mt-1">
                Your KYC was rejected. Please resubmit with correct documents.
              </p>
              <button
                onClick={() => router.push('/kyc')}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
              >
                Resubmit KYC
              </button>
            </div>
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 border border-emerald-800/30 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-400" />
                <p className="text-zinc-400 text-sm font-semibold">Available Balance</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold">${balance.toFixed(2)}</h2>
            <p className="text-xs text-emerald-400 mt-2">Ready to trade</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-yellow-400" />
              <p className="text-zinc-400 text-sm font-semibold">Pending Balance</p>
            </div>
            <h2 className="text-3xl font-bold text-yellow-400">
              ${pendingBalance.toFixed(2)}
            </h2>
            <p className="text-xs text-zinc-400 mt-2">Awaiting approval</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <p className="text-zinc-400 text-sm font-semibold">Total Deposited</p>
            </div>
            <h2 className="text-3xl font-bold text-blue-400">
              ${deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + Number(d.amount), 0).toFixed(2)}
            </h2>
            <p className="text-xs text-zinc-400 mt-2">All-time</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {['overview', 'deposit', 'history'].map((tab) => (
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
              <h3 className="font-bold text-lg mb-6">Recent Deposits</h3>
              <div className="space-y-3">
                {deposits.slice(0, 5).length === 0 ? (
                  <p className="text-zinc-500 text-center py-8 text-sm">No deposits yet</p>
                ) : (
                  deposits.slice(0, 5).map((deposit) => (
                    <div key={deposit.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                        <div>
                          <p className="font-semibold">${Number(deposit.amount).toFixed(2)}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(deposit.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(deposit.status)}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-6">Recent Withdrawals</h3>
              <div className="space-y-3">
                {withdrawals.slice(0, 5).length === 0 ? (
                  <p className="text-zinc-500 text-center py-8 text-sm">No withdrawals yet</p>
                ) : (
                  withdrawals.slice(0, 5).map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ArrowDownRight className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="font-semibold">${Number(withdrawal.amount).toFixed(2)}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(withdrawal.created_at).toLocaleDateString()}
                          </p>
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-6 w-6 text-emerald-400" />
                <h2 className="text-xl font-bold">Bank Details</h2>
              </div>

              {bankAccounts.length === 0 ? (
                <p className="text-zinc-400">No active bank accounts</p>
              ) : (
                bankAccounts.map((bank) => (
                  <div key={bank.id} className="space-y-4">
                    <div className="bg-emerald-900/10 border border-emerald-800/30 rounded-lg p-4">
                      <p className="text-sm text-zinc-400 mb-1">Bank Name</p>
                      <p className="text-lg font-bold text-emerald-400">{bank.bank_name}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                        <div>
                          <p className="text-xs text-zinc-400">Account Holder</p>
                          <p className="font-semibold">{bank.account_holder}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(bank.account_holder, 'Account Holder')}
                          className="p-2 hover:bg-zinc-700 rounded transition"
                        >
                          {copiedField === 'Account Holder' ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-zinc-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                        <div>
                          <p className="text-xs text-zinc-400">Account Number</p>
                          <p className="font-mono font-semibold">{bank.account_number}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(bank.account_number, 'Account Number')}
                          className="p-2 hover:bg-zinc-700 rounded transition"
                        >
                          {copiedField === 'Account Number' ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-zinc-400" />
                          )}
                        </button>
                      </div>

                      {bank.routing_number && (
                        <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                          <div>
                            <p className="text-xs text-zinc-400">Routing Number</p>
                            <p className="font-mono font-semibold">{bank.routing_number}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(bank.routing_number!, 'Routing Number')}
                            className="p-2 hover:bg-zinc-700 rounded transition"
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
                      <div className="bg-blue-900/10 border border-blue-800/30 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-blue-400 mb-1">Instructions</p>
                            <p className="text-sm text-zinc-300">{bank.instructions}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Deposit Form */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Upload className="h-6 w-6 text-emerald-400" />
                <h2 className="text-xl font-bold">Submit Deposit</h2>
              </div>

              {!user?.is_approved ? (
                <div className="text-center py-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-yellow-200 font-medium mb-2">KYC Verification Required</p>
                  <p className="text-yellow-300/70 text-sm mb-4">Complete KYC to make deposits</p>
                  <button
                    onClick={() => router.push('/kyc')}
                    className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition"
                  >
                    Verify Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="10"
                      placeholder="Minimum $10"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Payment Proof *
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:transition-all focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      JPG, PNG, PDF - Max 5MB
                    </p>
                  </div>

                  {proofFile && (
                    <div className="text-xs text-emerald-400 p-3 bg-emerald-900/10 border border-emerald-800/30 rounded-lg">
                      ✓ Selected: {proofFile.name}
                    </div>
                  )}

                  <button
                    onClick={handleDepositSubmit}
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-emerald-500 text-black rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="h-5 w-5" />
                        Submit Deposit
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-6">Transaction History</h3>
            <div className="space-y-4">
              {[...deposits, ...withdrawals].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ).length === 0 ? (
                <p className="text-zinc-500 text-center py-12">No transactions yet</p>
              ) : (
                [...deposits.map(d => ({...d, type: 'deposit' as const})), ...withdrawals.map(w => ({...w, type: 'withdrawal' as const}))]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((transaction) => (
                    <div key={transaction.id} className="p-4 bg-zinc-800/30 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          {transaction.type === 'deposit' ? (
                            <ArrowUpRight className="h-5 w-5 text-emerald-400 mt-1" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-400 mt-1" />
                          )}
                          <div>
                            <p className="font-semibold capitalize">{transaction.type}</p>
                            <p className="text-sm text-zinc-500">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                            <p className={`text-lg font-bold mt-1 ${transaction.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {transaction.type === 'deposit' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                      {transaction.rejection_reason && (
                        <p className="text-xs text-red-400 mt-3 p-2 bg-red-900/20 rounded">
                          Reason: {transaction.rejection_reason}
                        </p>
                      )}
                      {transaction.admin_notes && (
                        <p className="text-xs text-zinc-400 mt-3 p-2 bg-zinc-900 rounded">
                          Admin Note: {transaction.admin_notes}
                        </p>
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