'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp, Wallet, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle, XCircle, Copy, AlertCircle,
  Upload, FileText, DollarSign, CreditCard, RefreshCw, User
} from 'lucide-react';

// Type definitions
interface User {
  id: string;
  full_name: string;
  is_approved: boolean;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  routing_number: string;
  instructions: string;
}

interface Deposit {
  id: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  bank_account_id: string;
  bank_accounts: { bank_name: string; account_number: string };
}

interface Withdrawal {
  id: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
}

export default function EnhancedDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [pendingBalance, setPendingBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'kyc' | 'history'>('overview');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    checkUser();
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchDeposits();
      fetchWithdrawals();
    }
  }, [user]);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, full_name, is_approved')
      .eq('id', session.user.id)
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setUser(userData as User);
    setLoading(false);
  }

  async function fetchBankAccounts() {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('id, bank_name, account_number, routing_number, instructions')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setBankAccounts(data as BankAccount[] || []);
    if (data && data.length > 0) {
      setSelectedBank(data[0].id);
    }
  }

  async function fetchBalance() {
    if (!user) return;
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setBalance(data?.balance || 0);

    const { data: pendingDeposits, error: pendingError } = await supabase
      .from('deposits')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (pendingError) {
      toast({ title: "Error", description: pendingError.message, variant: "destructive" });
      return;
    }

    const pending = pendingDeposits?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
    setPendingBalance(pending);
  }

  async function fetchDeposits() {
    if (!user) return;
    const { data, error } = await supabase
      .from('deposits')
      .select(`
        id, amount, status, created_at, bank_account_id,
        bank_accounts(bank_name, account_number)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setDeposits((data as unknown as Deposit[]) || []);
  }

  async function fetchWithdrawals() {
    if (!user) return;
    const { data, error } = await supabase
      .from('withdrawals')
      .select('id, amount, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setWithdrawals(data as Withdrawal[] || []);
  }

  async function handleDepositSubmit() {
    if (!user) return;
    if (!user.is_approved) {
      toast({
        title: "KYC Required",
        description: "Complete KYC verification to make deposits",
        variant: "destructive",
      });
      router.push('/kyc');
      return;
    }

    if (!proofFile) {
      toast({
        title: "Upload Required",
        description: "Please upload payment proof",
        variant: "destructive",
      });
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is $10",
        variant: "destructive",
      });
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
          bank_account_id: selectedBank,
          amount: parseFloat(depositAmount),
          proof_filename: fileName,
          status: 'pending',
        });

      if (depositError) throw depositError;

      toast({
        title: "Success",
        description: "Deposit submitted. Awaiting admin approval.",
      });

      setDepositAmount('');
      setProofFile(null);
      fetchDeposits();
      fetchBalance();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  }

  function getStatusBadge(status: 'pending' | 'approved' | 'rejected' | 'completed') {
    const styles: { [key in 'pending' | 'approved' | 'rejected' | 'completed']: string } = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    const icons: { [key in 'pending' | 'approved' | 'rejected' | 'completed']: JSX.Element } = {
      pending: <Clock className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]} <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.full_name || 'User'}</h1>
        {user && !user.is_approved && (
          <div className="mt-2 p-3 bg-yellow-100 text-yellow-800 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Complete KYC verification to enable deposits and withdrawals
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {(['overview', 'deposit', 'kyc', 'history'] as const).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => tab === 'kyc' ? router.push('/kyc') : setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <Wallet className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold">Available Balance</h3>
            </div>
            <p className="text-2xl font-bold mt-2">${balance.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold">Pending Balance</h3>
            </div>
            <p className="text-2xl font-bold mt-2">${pendingBalance.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold">Total Deposits</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              ${deposits.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Make a Deposit</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Select Bank Account</label>
              {bankAccounts.length > 0 ? (
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_number.slice(-4)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-red-500">No active bank accounts found</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Deposit Amount ($)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter amount"
                min="10"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Payment Proof</label>
              <input
                type="file"
                onChange={(e) => e.target.files && setProofFile(e.target.files[0])}
                className="w-full p-2 border rounded-md"
                accept="image/*,.pdf"
              />
            </div>
            <button
              onClick={handleDepositSubmit}
              disabled={submitting}
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {submitting ? 'Submitting...' : 'Submit Deposit'}
            </button>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Bank Details</h2>
            {bankAccounts.length > 0 ? (
              bankAccounts.map((account) => (
                <div key={account.id} className="mb-4">
                  <div className="flex justify-between items-center">
                    <p><strong>Bank:</strong> {account.bank_name}</p>
                    <button onClick={() => copyToClipboard(account.bank_name, 'Bank Name')}>
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p><strong>Account:</strong> {account.account_number}</p>
                    <button onClick={() => copyToClipboard(account.account_number, 'Account Number')}>
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p><strong>Routing:</strong> {account.routing_number}</p>
                    <button onClick={() => copyToClipboard(account.routing_number, 'Routing Number')}>
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p><strong>Instructions:</strong> {account.instructions}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No bank accounts available</p>
            )}
          </div>
        </div>
      )}

      {/* KYC Tab */}
      {activeTab === 'kyc' && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">KYC Verification</h2>
          <p className="text-gray-500 mb-4">Please complete your KYC verification to enable deposits and withdrawals.</p>
          <button
            onClick={() => router.push('/kyc')}
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          >
            Go to KYC Page
          </button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Recent Deposits</h3>
            {deposits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="p-2">Date</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Bank</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((deposit) => (
                      <tr key={deposit.id}>
                        <td className="p-2">{new Date(deposit.created_at).toLocaleDateString()}</td>
                        <td className="p-2">${parseFloat(deposit.amount).toFixed(2)}</td>
                        <td className="p-2">{deposit.bank_accounts?.bank_name || 'Unknown'}</td>
                        <td className="p-2">{getStatusBadge(deposit.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No deposits found</p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Recent Withdrawals</h3>
            {withdrawals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="p-2">Date</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id}>
                        <td className="p-2">{new Date(withdrawal.created_at).toLocaleDateString()}</td>
                        <td className="p-2">${parseFloat(withdrawal.amount).toFixed(2)}</td>
                        <td className="p-2">{getStatusBadge(withdrawal.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No withdrawals found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}