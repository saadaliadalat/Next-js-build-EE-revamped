'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  Eye,
  EyeOff,
  Plus,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalance, setShowBalance] = useState(true);
  
  // Dashboard Data
  const [balance, setBalance] = useState(0);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [trades, setTrades] = useState([]);
  
  // Form States
  const [depositForm, setDepositForm] = useState({ 
    amount: '', 
    proofFile: null as File | null 
  });
  const [withdrawForm, setWithdrawForm] = useState({ 
    amount: '', 
    bankDetails: '' 
  });
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user balance
      const { data: balanceData } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('currency', 'USD')
        .single();

      setBalance(balanceData?.amount || 0);

      // Fetch deposits
      const { data: depositsData } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setDeposits(depositsData || []);

      // Fetch withdrawals
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setWithdrawals(withdrawalsData || []);

      // Fetch trades
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('opened_at', { ascending: false })
        .limit(10);

      setTrades(tradesData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== DEPOSIT HANDLER ==========
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);

    try {
      const amount = parseFloat(depositForm.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid deposit amount');
      }

      let proofFilename = null;

      // Upload file to Supabase Storage if provided
      if (depositForm.proofFile) {
        console.log('📤 Uploading file...', depositForm.proofFile.name);
        
        // Validate file size (max 5MB)
        if (depositForm.proofFile.size > 5 * 1024 * 1024) {
          throw new Error('File size must be less than 5MB');
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(depositForm.proofFile.type)) {
          throw new Error('Only JPG, PNG, and PDF files are allowed');
        }

        const fileExt = depositForm.proofFile.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('deposit-proofs')
          .upload(fileName, depositForm.proofFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log('✅ File uploaded:', uploadData);
        proofFilename = fileName;
      } else {
        console.log('⚠️ No file selected - deposit without proof');
      }

      // Create deposit record
      const { error: insertError } = await supabase.from('deposits').insert({
        user_id: user?.id,
        amount,
        currency: 'USD',
        proof_filename: proofFilename,
        status: 'pending',
      });

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Deposit record created');

      toast({
        title: '✓ Deposit request submitted!',
        description: proofFilename 
          ? 'Your payment proof has been uploaded. Admin will verify within 24 hours.' 
          : 'Your deposit request is pending. Please upload payment proof.',
      });

      setDepositForm({ amount: '', proofFile: null });
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchDashboardData();
    } catch (error: any) {
      console.error('❌ Deposit error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit deposit request.',
        variant: 'destructive',
      });
    } finally {
      setDepositLoading(false);
    }
  };

  // ========== WITHDRAW HANDLER ==========
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);

    try {
      const amount = parseFloat(withdrawForm.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid withdrawal amount');
      }

      if (amount > balance) {
        throw new Error('Insufficient balance');
      }

      const { error } = await supabase.from('withdrawals').insert({
        user_id: user?.id,
        amount,
        currency: 'USD',
        bank_details: withdrawForm.bankDetails,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: '✓ Withdrawal request submitted!',
        description: 'Your withdrawal will be processed within 2-3 business days.',
      });

      setWithdrawForm({ amount: '', bankDetails: '' });
      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit withdrawal request.',
        variant: 'destructive',
      });
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-400" />
            <p>Loading your dashboard...</p>
          </div>
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

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-emerald-900/20 to-emerald-900/10 border border-emerald-800/30 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 mb-2">Total Balance</p>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold">
                  {showBalance ? `$${balance.toFixed(2)}` : '••••••'}
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-emerald-900/20 rounded-lg transition"
                >
                  {showBalance ? (
                    <Eye className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-emerald-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-400">USD</p>
              <p className="text-xs text-zinc-500 mt-1">Last updated: now</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {['overview', 'deposits', 'withdrawals', 'trades'].map((tab) => (
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-900/20 rounded-lg">
                    <Plus className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Total Deposits</h3>
                </div>
                <p className="text-2xl font-bold">
                  ${deposits.reduce((sum, d) => d.status === 'approved' ? sum + d.amount : sum, 0).toFixed(2)}
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-900/20 rounded-lg">
                    <ArrowDownLeft className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="font-semibold">Total Withdrawals</h3>
                </div>
                <p className="text-2xl font-bold">
                  ${withdrawals.reduce((sum, w) => w.status === 'approved' ? sum + w.amount : sum, 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {deposits.slice(0, 5).map((deposit) => (
                  <div key={deposit.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Plus className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="font-semibold">Deposit</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(deposit.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">+${deposit.amount.toFixed(2)}</p>
                      <p className={`text-xs ${
                        deposit.status === 'approved' ? 'text-emerald-400' :
                        deposit.status === 'pending' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {deposit.status.toUpperCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deposit Form */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-6">Make a Deposit</h3>
                <form onSubmit={handleDeposit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Amount (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="Enter amount"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Upload Proof of Payment
                    </label>
                    <input
                      id="proofFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setDepositForm({ 
                        ...depositForm, 
                        proofFile: e.target.files?.[0] || null 
                      })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:transition-all focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      JPG, PNG, PDF - Max 5MB
                    </p>
                  </div>

                  {depositForm.proofFile && (
                    <div className="text-xs text-emerald-400 p-2 bg-emerald-900/10 rounded">
                      Selected: {depositForm.proofFile.name}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={depositLoading}
                    className="w-full px-4 py-2 bg-emerald-500 text-black rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50 transition"
                  >
                    {depositLoading ? 'Processing...' : 'Submit Deposit'}
                  </button>
                </form>
              </div>
            </div>

            {/* Deposit History */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-6">Deposit History</h3>
                <div className="space-y-4">
                  {deposits.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">No deposits yet</p>
                  ) : (
                    deposits.map((deposit) => (
                      <div key={deposit.id} className="p-4 bg-zinc-800/30 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">${deposit.amount.toFixed(2)}</p>
                            <p className="text-xs text-zinc-500">
                              {new Date(deposit.created_at).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${
                            deposit.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400' :
                            deposit.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-red-900/30 text-red-400'
                          }`}>
                            {deposit.status.toUpperCase()}
                          </span>
                        </div>
                        {deposit.proof_filename && (
                          <p className="text-xs text-zinc-400">📎 Proof attached</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Withdraw Form */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-6">Withdraw Funds</h3>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Amount (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={balance}
                      placeholder="Enter amount"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <p className="text-xs text-zinc-500 mt-1">Available: ${balance.toFixed(2)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Bank Details</label>
                    <textarea
                      placeholder="Account number, routing number, etc."
                      value={withdrawForm.bankDetails}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, bankDetails: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 h-20 resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="w-full px-4 py-2 bg-emerald-500 text-black rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50 transition"
                  >
                    {withdrawLoading ? 'Processing...' : 'Submit Withdrawal'}
                  </button>
                </form>
              </div>
            </div>

            {/* Withdrawal History */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-6">Withdrawal History</h3>
                <div className="space-y-4">
                  {withdrawals.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">No withdrawals yet</p>
                  ) : (
                    withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="p-4 bg-zinc-800/30 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">${withdrawal.amount.toFixed(2)}</p>
                            <p className="text-xs text-zinc-500">
                              {new Date(withdrawal.created_at).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${
                            withdrawal.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400' :
                            withdrawal.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-red-900/30 text-red-400'
                          }`}>
                            {withdrawal.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === 'trades' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-6">Trading History</h3>
            {trades.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No trades yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-700">
                    <tr>
                      <th className="text-left p-3">Symbol</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Entry Price</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                        <td className="p-3 font-semibold">{trade.symbol}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            trade.type === 'buy' 
                              ? 'bg-emerald-900/30 text-emerald-400' 
                              : 'bg-red-900/30 text-red-400'
                          }`}>
                            {trade.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">{trade.amount}</td>
                        <td className="p-3">${trade.entry_price.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            trade.status === 'open' 
                              ? 'bg-blue-900/30 text-blue-400' 
                              : 'bg-gray-900/30 text-gray-400'
                          }`}>
                            {trade.status.toUpperCase()}
                          </span>
                        </td>
                        <td className={`p-3 font-semibold ${
                          (trade.profit_loss || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          ${(trade.profit_loss || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}