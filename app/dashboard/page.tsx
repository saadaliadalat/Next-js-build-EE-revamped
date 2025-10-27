import { useState } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Plus,
  Zap,
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalance, setShowBalance] = useState(true);
  
  // Mock data
  const profile = {
    full_name: 'Ahmed Hassan',
    is_approved: false,
  };
  
  const balance = 0;
  const deposits = [
    { id: 1, amount: 100, status: 'pending', created_at: new Date().toISOString() },
  ];
  const withdrawals = [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {profile?.full_name}</h1>
          <p className="text-zinc-400">Manage your trading account</p>
        </div>

        {/* KYC Banner - HIGHLIGHTED */}
        {!profile?.is_approved && (
          <div className="mb-8 rounded-xl p-6 border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 flex items-start gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl -z-0"></div>
            <AlertCircle className="h-7 w-7 text-yellow-400 flex-shrink-0 mt-1 relative z-10" />
            <div className="flex-1 relative z-10">
              <p className="font-bold text-lg text-yellow-400">⚠️ Complete KYC Verification</p>
              <p className="text-sm text-zinc-300 mt-2">
                Your account is not yet verified. Complete KYC verification to unlock deposits, withdrawals, and full trading access.
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/kyc'}
              className="flex-shrink-0 px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition transform hover:scale-105 active:scale-95 flex items-center gap-2 relative z-10"
            >
              <Zap className="h-5 w-5" />
              Start KYC
            </button>
          </div>
        )}

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
              <p className="text-xs text-zinc-500 mt-1">Live</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {['overview', 'deposits', 'withdrawals'].map((tab) => (
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
                <p className="text-2xl font-bold">$0.00</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-900/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Account Status</h3>
                </div>
                <p className={`text-lg font-bold ${profile?.is_approved ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {profile?.is_approved ? '✓ Verified' : '⏳ Pending'}
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
                {deposits.length === 0 && (
                  <p className="text-zinc-500 text-center py-8">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deposit Info */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-6">Deposit Status</h3>
                {!profile?.is_approved ? (
                  <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mb-2" />
                    <p className="text-sm text-yellow-300 font-semibold">KYC Required</p>
                    <p className="text-xs text-zinc-400 mt-2">Complete KYC verification to make deposits</p>
                  </div>
                ) : (
                  <button className="w-full px-4 py-3 bg-emerald-500 text-black rounded-lg font-semibold hover:bg-emerald-600 transition">
                    Make a Deposit
                  </button>
                )}
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
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-6">Withdraw Funds</h3>
                {!profile?.is_approved ? (
                  <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mb-2" />
                    <p className="text-sm text-yellow-300 font-semibold">KYC Required</p>
                    <p className="text-xs text-zinc-400 mt-2">Complete KYC to withdraw funds</p>
                  </div>
                ) : (
                  <button disabled className="w-full px-4 py-3 bg-zinc-700 text-zinc-400 rounded-lg font-semibold cursor-not-allowed">
                    Insufficient Balance
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-6">Withdrawal History</h3>
                <p className="text-zinc-500 text-center py-8">No withdrawals yet</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}