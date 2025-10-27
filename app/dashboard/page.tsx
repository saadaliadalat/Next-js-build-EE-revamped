'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  Upload,
  Eye,
  EyeOff,
  Info,
  XCircle,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  routing_number: string;
  iban: string;
  swift_code: string;
  instructions: string;
}

export default function ProductionDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalance, setShowBalance] = useState(true);
  const [copiedField, setCopiedField] = useState('');
  
  // Data
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected'>('not_submitted');
  
  // Forms
  const [depositForm, setDepositForm] = useState({
    amount: '',
    proofFile: null as File | null,
  });
  const [depositLoading, setDepositLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch balance
      const { data: balanceData } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('currency', 'USD')
        .single();

      setBalance(balanceData?.amount || 0);

      // Fetch pending deposits for pending balance
      const { data: pendingDeposits } = await supabase
        .from('deposits')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('status', 'pending');

      const pending = pendingDeposits?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
      setPendingBalance(pending);

      // Fetch bank accounts
      const { data: bankData } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true);

      setBankAccounts(bankData || []);

      // Fetch deposits
      const { data: depositsData } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setDeposits(depositsData || []);

      // Fetch withdrawals
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setWithdrawals(withdrawalsData || []);

      // Check KYC status
      const { data: kycData } = await supabase
        .from('kyc_submissions')
        .select('status')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (kycData) {
        setKycStatus(kycData.status);
      } else {
        setKycStatus('not_submitted');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check KYC
    if (!profile?.is_approved) {
      toast.error('Please complete KYC verification to deposit funds');
      router.push('/kyc');
      return;
    }

    if (!depositForm.proofFile) {
      toast.error('Please upload payment proof');
      return;
    }

    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount < 10) {
      toast.error('Minimum deposit is $10');
      return;
    }

    setDepositLoading(true);

    try {
      // Upload proof
      const fileExt = depositForm.proofFile.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('deposit-proofs')
        .upload(fileName, depositForm.proofFile);

      if (uploadError) throw uploadError;

      // Create deposit
      const { error: depositError } = await supabase
        .from('deposits')
        .insert({
          user_id: user?.id,
          amount,
          currency: 'USD',
          proof_filename: fileName,
          status: 'pending',
        });

      if (depositError) throw depositError;

      toast.success('Deposit request submitted! Awaiting admin approval.');
      setDepositForm({ amount: '', proofFile: null });
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit deposit');
    } finally {
      setDepositLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
      approved: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50',
      rejected: 'bg-red-900/30 text-red-400 border-red-800/50',
      completed: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
    };

    const icons: Record<string, any> = {
      pending: Clock,
      approved: CheckCircle2,
      rejected: XCircle,
      completed: CheckCircle2,
    };

    const Icon = icons[status] || AlertCircle;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border ${styles[status] || 'bg-zinc-800 text-zinc-400'}`}>
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <TrendingUp className="h-12 w-12 animate-spin text-emerald-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {profile?.full_name}</h1>
          <p className="text-zinc-400">Manage your trading account</p>
        </div>

        {/* KYC Status Banner */}
        {kycStatus === 'not_submitted' && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6 mb-8 flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-lg text-red-400">⚠️ KYC Required</p>
              <p className="text-sm text-zinc-300 mt-1">
                Complete KYC verification to deposit funds and start trading.
              </p>
              <button
                onClick={() => router.push('/kyc')}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
              >
                Complete KYC Now
              </button>
            </div>
          </div>
        )}

        {kycStatus === 'pending' && (
          <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-6 mb-8 flex items-start gap-4">
            <Clock className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-lg text-yellow-400">⏳ KYC Under Review</p>
              <p className="text-sm text-zinc-300 mt-1">
                Your KYC submission is being reviewed. This usually takes 24-48 hours.
              </p>
            </div>
          </div>
        )}

        {kycStatus === 'approved' && profile?.is_approved && (
          <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-4 mb-8 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-400">✓ Account Verified</p>
          </div>
        )}

        {kycStatus === 'rejected' && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6 mb-8 flex items-start gap-4">
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
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-emerald-900/20 rounded-lg transition"
              >
                {showBalance ? (
                  <Eye className="h-4 w-4 text-emerald-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-emerald-400" />
                )}
              </button>
            </div>
            <h2 className="text-3xl font-bold">
              {showBalance ? `$${balance.toFixed(2)}` : '••••••'}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-yellow-400" />
              <p className="text-zinc-400 text-sm font-semibold">Pending Balance</p>
            </div>
            <h2 className="text-3xl font-bold text-yellow-400">
              ${pendingBalance.toFixed(2)}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <p className="text-zinc-400 text-sm font-semibold">Total Deposits</p>
            </div>
            <h2 className="text-3xl font-bold text-blue-400">
              ${deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}
            </h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {['overview', 'deposit', 'withdraw', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-emerald-500 text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
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
                          <p className="font-semibold">${parseFloat(deposit.amount).toFixed(2)}</p>
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
                        <ArrowDownLeft className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="font-semibold">${parseFloat(withdrawal.amount).toFixed(2)}</p>
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

        {/* Deposit Tab */}
        {activeTab === 'deposit' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bank Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-6 w-6 text-emerald-400" />
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
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
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
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
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
                            onClick={() => copyToClipboard(bank.routing_number, 'Routing Number')}
                            className="p-2 hover:bg-zinc-700 rounded transition"
                          >
                            {copiedField === 'Routing Number' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
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

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    placeholder="Minimum $10"
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                    required
                    disabled={!profile?.is_approved}
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
                    onChange={(e) => setDepositForm({ 
                      ...depositForm, 
                      proofFile: e.target.files?.[0] || null 
                    })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:transition-all focus:outline-none focus:border-emerald-500"
                    required
                    disabled={!profile?.is_approved}
                  />
                  <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    JPG, PNG, PDF - Max 5MB
                  </p>
                </div>

                {depositForm.proofFile && (
                  <div className="text-xs text-emerald-400 p-3 bg-emerald-900/10 border border-emerald-800/30 rounded-lg">
                    ✓ Selected: {depositForm.proofFile.name}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={depositLoading || !profile?.is_approved}
                  className="w-full px-4 py-3 bg-emerald-500 text-black rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {depositLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-5 w-5" />
                      Submit Deposit
                    </>
                  )}
                </button>

                {!profile?.is_approved && (
                  <p className="text-xs text-red-400 text-center">
                    Complete KYC verification to enable deposits
                  </p>
                )}
              </form>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-6">Transaction History</h3>
            <div className="space-y-4">
              {[...deposits, ...withdrawals].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ).length === 0 ? (
                <p className="text-zinc-500 text-center py-12">No transactions yet</p>
              ) : (
                [...deposits.map(d => ({...d, type: 'deposit'})), ...withdrawals.map(w => ({...w, type: 'withdrawal'}))]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((transaction) => (
                    <div key={transaction.id} className="p-4 bg-zinc-800/30 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          {transaction.type === 'deposit' ? (
                            <ArrowUpRight className="h-5 w-5 text-emerald-400 mt-1" />
                          ) : (
                            <ArrowDownLeft className="h-5 w-5 text-red-400 mt-1" />
                          )}
                          <div>
                            <p className="font-semibold capitalize">{transaction.type}</p>
                            <p className="text-sm text-zinc-500">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                            <p className={`text-lg font-bold mt-1 ${transaction.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {transaction.type === 'deposit' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
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