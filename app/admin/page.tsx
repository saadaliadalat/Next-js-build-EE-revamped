```tsx
import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BarChart3, Settings, Users, Wallet, TrendingUp, Shield, MessageSquare, 
  FileText, Globe, Lock, Bell, CreditCard, Activity, Zap, Edit2, Trash2, 
  Plus, Eye, EyeOff, Search, Filter, Download, Upload, CheckCircle, AlertCircle,
  DollarSign, ArrowUpRight, ArrowDownLeft, Clock, Calendar, MoreVertical,
  PieChart, LineChart, Award, Target, Sliders, Database
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminData {
  stats: { label: string; value: string; change: string; icon: any; color: string }[];
  traders: any[];
  transactions: any[];
  assets: any[];
  depositsWithdrawals: any[];
  supportTickets: any[];
  content: any[];
  settings: any;
  securityEvents: any[];
  analytics: any[];
  emailTemplates: any[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return { redirect: { destination: '/unauthorized', permanent: false } };
  }

  // Fetch initial data
  const [
    { data: userCount }, 
    { data: activeTraders }, 
    { data: totalVolume }, 
    { data: pendingRequests },
    { data: traders },
    { data: transactions },
    { data: assets },
    { data: depositsWithdrawals },
    { data: supportTickets },
    { data: content },
    { data: settings },
    { data: securityEvents },
    { data: analytics },
    { data: emailTemplates }
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('traders').select('id', { count: 'exact' }).eq('status', 'active'),
    supabase.from('transactions').select('amount').eq('status', 'completed'),
    supabase.from('deposits_withdrawals').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('traders').select('*').limit(10),
    supabase.from('transactions').select('*').limit(10),
    supabase.from('assets').select('*'),
    supabase.from('deposits_withdrawals').select('*').limit(10),
    supabase.from('support_tickets').select('*').limit(10),
    supabase.from('content').select('*').limit(10),
    supabase.from('settings').select('*').single(),
    supabase.from('security_events').select('*').limit(10),
    supabase.from('analytics').select('*').limit(10),
    supabase.from('email_templates').select('*').limit(10),
  ]);

  const stats = [
    { label: 'Total Users', value: userCount?.count?.toString() || '0', change: '+0%', icon: Users, color: 'bg-blue-500' },
    { label: 'Active Traders', value: activeTraders?.count?.toString() || '0', change: '+0%', icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Total Volume', value: `$${((totalVolume?.reduce((sum, t) => sum + t.amount, 0) || 0) / 1000).toFixed(1)}K`, change: '+0%', icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Pending Requests', value: pendingRequests?.count?.toString() || '0', change: '+0%', icon: Clock, color: 'bg-orange-500' },
  ];

  return {
    props: {
      initialData: {
        stats,
        traders: traders || [],
        transactions: transactions || [],
        assets: assets || [],
        depositsWithdrawals: depositsWithdrawals || [],
        supportTickets: supportTickets || [],
        content: content || [],
        settings: settings || {},
        securityEvents: securityEvents || [],
        analytics: analytics || [],
        emailTemplates: emailTemplates || [],
      },
    },
  };
};

export default function AdminCMS({ initialData }: { initialData: AdminData }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Real-time subscriptions
  useEffect(() => {
    const traderSub = supabase
      .channel('traders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'traders' }, (payload) => {
        setData((prev) => ({
          ...prev,
          traders: payload.eventType === 'DELETE'
            ? prev.traders.filter(t => t.id !== payload.old.id)
            : payload.eventType === 'UPDATE'
              ? prev.traders.map(t => t.id === payload.new.id ? payload.new : t)
              : [...prev.traders, payload.new],
        }));
      })
      .subscribe();

    const transactionSub = supabase
      .channel('transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        setData((prev) => ({
          ...prev,
          transactions: payload.eventType === 'DELETE'
            ? prev.transactions.filter(t => t.id !== payload.old.id)
            : payload.eventType === 'UPDATE'
              ? prev.transactions.map(t => t.id === payload.new.id ? payload.new : t)
              : [...prev.transactions, payload.new],
        }));
      })
      .subscribe();

    const depositsWithdrawalsSub = supabase
      .channel('deposits_withdrawals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits_withdrawals' }, (payload) => {
        setData((prev) => ({
          ...prev,
          depositsWithdrawals: payload.eventType === 'DELETE'
            ? prev.depositsWithdrawals.filter(d => d.id !== payload.old.id)
            : payload.eventType === 'UPDATE'
              ? prev.depositsWithdrawals.map(d => d.id === payload.new.id ? payload.new : d)
              : [...prev.depositsWithdrawals, payload.new],
        }));
      })
      .subscribe();

    const supportSub = supabase
      .channel('support_tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, (payload) => {
        setData((prev) => ({
          ...prev,
          supportTickets: payload.eventType === 'DELETE'
            ? prev.supportTickets.filter(t => t.id !== payload.old.id)
            : payload.eventType === 'UPDATE'
              ? prev.supportTickets.map(t => t.id === payload.new.id ? payload.new : t)
              : [...prev.supportTickets, payload.new],
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(traderSub);
      supabase.removeChannel(transactionSub);
      supabase.removeChannel(depositsWithdrawalsSub);
      supabase.removeChannel(supportSub);
    };
  }, []);

  // Menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users, href: '/admin/users' },
    { id: 'traders', label: 'Traders & Accounts', icon: Award },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'assets', label: 'Trading Assets', icon: TrendingUp },
    { id: 'deposits', label: 'Deposits & Withdrawals', icon: Wallet },
    { id: 'support', label: 'Support Tickets', icon: MessageSquare },
    { id: 'content', label: 'Content Management', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'security', label: 'Security & Compliance', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: Sliders },
    { id: 'email', label: 'Email Notifications', icon: Bell },
  ];

  // Render functions (from previous response, included for completeness)
  const renderDashboard = () => (
    <div className="space-y-6">
      {error && <div className="p-4 bg-red-500/20 text-red-400 rounded-lg">{error}</div>}
      {loading && <div className="p-4 text-center text-zinc-400">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-sm font-medium">{stat.label}</h3>
              <div className={`p-2 ${stat.color} rounded-lg bg-opacity-10`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
            <div className="text-xs text-emerald-400 font-semibold">{stat.change}</div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Trading Volume (7 days)
          </h3>
          <div className="h-64 bg-white/[0.02] border border-white/5 rounded flex items-center justify-center text-zinc-500">
            Chart Visualization Area
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            User Distribution
          </h3>
          <div className="h-64 bg-white/[0.02] border border-white/5 rounded flex items-center justify-center text-zinc-500">
            Chart Visualization Area
          </div>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {data.transactions.slice(0, 5).map((txn, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.05] transition">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-zinc-300">{txn.type} - ${txn.amount.toLocaleString()}</span>
              </div>
              <span className="text-xs text-zinc-500">{new Date(txn.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderTraders = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Total Traders</p>
              <p className="text-2xl font-bold text-white">{data.traders.length}</p>
            </div>
            <Award className="w-8 h-8 text-emerald-400 opacity-50" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Avg Win Rate</p>
              <p className="text-2xl font-bold text-white">
                {(data.traders.reduce((sum, t) => sum + t.win_rate, 0) / (data.traders.length || 1)).toFixed(1)}%
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Total Trades</p>
              <p className="text-2xl font-bold text-white">{data.traders.reduce((sum, t) => sum + t.total_trades, 0)}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </motion.div>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={async () => {
          setLoading(true);
          try {
            const { error } = await supabase.from('traders').insert({ name: 'New Trader', status: 'active', balance: 0, win_rate: 0, total_trades: 0 });
            if (error) throw error;
          } catch (err) {
            setError('Failed to create trader');
          } finally {
            setLoading(false);
          }
        }}
        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all flex items-center gap-2 mb-4"
      >
        <Plus className="w-4 h-4" />
        Create Trader Account
      </motion.button>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Trader ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Account Balance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Win Rate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Total Trades</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.traders.map((trader) => (
              <tr key={trader.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                <td className="px-4 py-3 text-sm text-white font-mono">{trader.id}</td>
                <td className="px-4 py-3 text-sm text-white">{trader.name}</td>
                <td className="px-4 py-3 text-sm text-emerald-400 font-semibold">${trader.balance.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-white">{trader.win_rate}%</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{trader.total_trades}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">{trader.status}</span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button className="p-1 hover:bg-white/10 rounded transition">
                    <MoreVertical className="w-4 h-4 text-zinc-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="trade">Trading</option>
        </select>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Transaction ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions
              .filter(txn => filterStatus === 'all' || txn.type === filterStatus)
              .map((txn) => (
                <tr key={txn.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 text-sm text-white font-mono">{txn.id}</td>
                  <td className="px-4 py-3 text-sm flex items-center gap-2">
                    {txn.type === 'withdrawal' ? <ArrowDownLeft className="w-4 h-4 text-red-400" /> : <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                    <span className="text-white">{txn.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{txn.user_id}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">${txn.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${txn.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{new Date(txn.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-1 hover:bg-white/10 rounded transition"
                    >
                      <Eye className="w-4 h-4 text-zinc-400" />
                    </motion.button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="space-y-4">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={async () => {
          setLoading(true);
          try {
            const { error } = await supabase.from('assets').insert({ name: 'New Asset', enabled: true, pairs: 0, volume: 0 });
            if (error) throw error;
          } catch (err) {
            setError('Failed to add asset');
          } finally {
            setLoading(false);
          }
        }}
        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all flex items-center gap-2 mb-4"
      >
        <Plus className="w-4 h-4" />
        Add Asset
      </motion.button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.assets.map((asset, i) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{asset.name}</h3>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Enabled:</span>
                <span className="text-white font-semibold">{asset.enabled ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Pairs:</span>
                <span className="text-white font-semibold">{asset.pairs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Volume:</span>
                <span className="text-white font-semibold">${(asset.volume / 1000000).toFixed(1)}M</span>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-2 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-400 text-xs font-medium transition-all"
              >
                <Edit2 className="w-3 h-3 inline mr-1" />
                Edit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('assets').update({ enabled: false }).eq('id', asset.id);
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to disable asset');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex-1 px-2 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-400 text-xs font-medium transition-all"
              >
                Disable
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderDepositsWithdrawals = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Total Deposits</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${data.depositsWithdrawals.filter(d => d.type === 'deposit').reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
              </p>
            </div>
            <ArrowDownLeft className="w-8 h-8 text-emerald-400 opacity-50" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Total Withdrawals</p>
              <p className="text-2xl font-bold text-red-400">
                ${data.depositsWithdrawals.filter(d => d.type === 'withdrawal').reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
              </p>
            </div>
            <ArrowUpRight className="w-8 h-8 text-red-400 opacity-50" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-400">
                {data.depositsWithdrawals.filter(d => d.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400 opacity-50" />
          </div>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
      >
        <h3 className="text-white font-semibold mb-4">Pending Requests</h3>
        <div className="space-y-3">
          {data.depositsWithdrawals.filter(d => d.status === 'pending').map((req) => (
            <div key={req.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.05] transition">
              <div className="flex-1">
                <p className="text-white font-semibold">{req.user_id} - ${req.amount.toLocaleString()}</p>
                <p className="text-xs text-zinc-500">{req.type} • {new Date(req.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { error } = await supabase.from('deposits_withdrawals').update({ status: 'completed' }).eq('id', req.id);
                      if (error) throw error;
                    } catch (err) {
                      setError('Failed to approve request');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-emerald-400 text-xs font-medium transition-all"
                >
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Approve
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { error } = await supabase.from('deposits_withdrawals').update({ status: 'rejected' }).eq('id', req.id);
                      if (error) throw error;
                    } catch (err) {
                      setError('Failed to reject request');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-400 text-xs font-medium transition-all"
                >
                  Reject
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      <h3 className="text-white font-semibold mb-4">All Transactions</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Transaction ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Payment Method</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.depositsWithdrawals.map((txn) => (
              <tr key={txn.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                <td className="px-4 py-3 text-sm text-white font-mono">{txn.id}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{txn.user_id}</td>
                <td className="px-4 py-3 text-sm text-emerald-400">{txn.type}</td>
                <td className="px-4 py-3 text-sm text-white font-semibold">${txn.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{txn.payment_method || 'N/A'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${txn.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {txn.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400">{new Date(txn.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50">
          <option>All Priority</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Urgent</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4"
        >
          <p className="text-zinc-400 text-xs mb-1">Open Tickets</p>
          <p className="text-2xl font-bold text-orange-400">{data.supportTickets.filter(t => t.status === 'open').length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4"
        >
          <p className="text-zinc-400 text-xs mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-400">{data.supportTickets.filter(t => t.status === 'in_progress').length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4"
        >
          <p className="text-zinc-400 text-xs mb-1">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400">{data.supportTickets.filter(t => t.status === 'resolved').length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4"
        >
          <p className="text-zinc-400 text-xs mb-1">Avg Response</p>
          <p className="text-2xl font-bold text-purple-400">2.5h</p>
        </motion.div>
      </div>
      <div className="space-y-3">
        {data.supportTickets
          .filter(t => filterStatus === 'all' || t.status === filterStatus)
          .map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ticket.id * 0.1 }}
              className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-semibold">Ticket #{ticket.id}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${{
                      open: 'bg-orange-500/20 text-orange-400',
                      in_progress: 'bg-blue-500/20 text-blue-400',
                      resolved: 'bg-emerald-500/20 text-emerald-400',
                      closed: 'bg-purple-500/20 text-purple-400',
                      urgent: 'bg-red-500/20 text-red-400'
                    }[ticket.status]}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-white mb-1">{ticket.title}</p>
                  <p className="text-sm text-zinc-400 mb-2">{ticket.user_id} • {ticket.priority} Priority</p>
                  <p className="text-xs text-zinc-500">{new Date(ticket.created_at).toLocaleDateString()} • Last reply {new Date(ticket.updated_at).toLocaleDateString()}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-2 hover:bg-white/10 rounded transition"
                >
                  <MoreVertical className="w-4 h-4 text-zinc-400" />
                </motion.button>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            setLoading(true);
            try {
              const { error } = await supabase.from('content').insert({ title: 'New Content', type: 'page', status: 'draft' });
              if (error) throw error;
            } catch (err) {
              setError('Failed to add content');
            } finally {
              setLoading(false);
            }
          }}
          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Content
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Media
        </motion.button>
      </div>
      <div className="space-y-3">
        {data.content.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: item.id * 0.1 }}
            className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <FileText className="w-6 h-6 text-blue-400" />
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{item.title}</h3>
                  <p className="text-xs text-zinc-500">Last updated: {new Date(item.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {item.status}
                </span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-1 hover:bg-white/10 rounded transition"
                >
                  <Edit2 className="w-4 h-4 text-blue-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { error } = await supabase.from('content').delete().eq('id', item.id);
                      if (error) throw error;
                    } catch (err) {
                      setError('Failed to delete content');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="p-1 hover:bg-white/10 rounded transition"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Platform Name</label>
              <input
                type="text"
                defaultValue={data.settings.platform_name || 'EquityEdge'}
                onBlur={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'platform_name', value: e.target.value });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update platform name');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Support Email</label>
              <input
                type="email"
                defaultValue={data.settings.support_email || 'support@equityedge.ai'}
                onBlur={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'support_email', value: e.target.value });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update support email');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Maintenance Mode</label>
              <select
                defaultValue={data.settings.maintenance_mode || 'off'}
                onChange={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'maintenance_mode', value: e.target.value });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update maintenance mode');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              >
                <option value="off">Off</option>
                <option value="on">On</option>
              </select>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trading Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Min Trade Amount (USD)</label>
              <input
                type="number"
                defaultValue={data.settings.min_trade_amount || 10}
                onBlur={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'min_trade_amount', value: parseInt(e.target.value) });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update min trade amount');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Max Trade Amount (USD)</label>
              <input
                type="number"
                defaultValue={data.settings.max_trade_amount || 100000}
                onBlur={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'max_trade_amount', value: parseInt(e.target.value) });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update max trade amount');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Default Leverage</label>
              <input
                type="number"
                defaultValue={data.settings.default_leverage || 50}
                onBlur={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'default_leverage', value: parseInt(e.target.value) });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update default leverage');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Commission Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Trading Commission %</label>
              <input
                type="number"
                step="0.1"
                defaultValue={data.settings.trading_commission || 0.5}
                onBlur={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'trading_commission', value: parseFloat(e.target.value) });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update trading commission');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Withdrawal Fee %</label>
              <input
                type="number"
                step="0.1"
                defaultValue={data.settings.withdrawal_fee || 1.0}
                onBlur={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'withdrawal_fee', value: parseFloat(e.target.value) });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update withdrawal fee');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Referral Bonus %</label>
              <input
                type="number"
                step="0.1"
                defaultValue={data.settings.referral_bonus || 2.0}
                onBlur={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'referral_bonus', value: parseFloat(e.target.value) });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update referral bonus');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Email Notifications</label>
              <select
                defaultValue={data.settings.email_notifications || 'enabled'}
                onChange={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'email_notifications', value: e.target.value });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update email notifications');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">SMS Notifications</label>
              <select
                defaultValue={data.settings.sms_notifications || 'enabled'}
                onChange={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'sms_notifications', value: e.target.value });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update SMS notifications');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Push Notifications</label>
              <select
                defaultValue={data.settings.push_notifications || 'enabled'}
                onChange={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'push_notifications', value: e.target.value });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update push notifications');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Two-Factor Authentication</label>
              <select
                defaultValue={data.settings.two_factor_auth || 'optional'}
                onChange={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'two_factor_auth', value: e.target.value });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update 2FA setting');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              >
                <option value="mandatory">Mandatory</option>
                <option value="optional">Optional</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                defaultValue={data.settings.session_timeout || 30}
                onBlur={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'session_timeout', value: parseInt(e.target.value) });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update session timeout');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Compliance Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">KYC Verification</label>
              <select
                defaultValue={data.settings.kyc_verification || 'mandatory'}
                onChange={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'kyc_verification', value: e.target.value });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update KYC setting');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              >
                <option value="mandatory">Mandatory</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">AML Monitoring</label>
              <select
                defaultValue={data.settings.aml_monitoring || 'enabled'}
                onChange={async (e) => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.from('settings').upsert({ key: 'aml_monitoring', value: e.target.value });
                    if (error) throw error;
                  } catch (err) {
                    setError('Failed to update AML setting');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50"
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Recent Security Events
        </h3>
        <div className="space-y-3">
          {data.securityEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.05] transition">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-zinc-300">{event.description}</span>
              </div>
              <span className="text-xs text-zinc-500">{new Date(event.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            User Activity
          </h3>
          <div className="h-64 bg-white/[0.02] border border-white/5 rounded flex items-center justify-center text-zinc-500">
            Chart Visualization Area
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Revenue Breakdown
          </h3>
          <div className="h-64 bg-white/[0.02] border border-white/5 rounded flex items-center justify-center text-zinc-500">
            Chart Visualization Area
          </div>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Key Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.analytics.map((metric) => (
            <div key={metric.id}>
              <p className="text-zinc-400 text-sm mb-1">{metric.metric}</p>
              <p className="text-xl font-bold text-white">{metric.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderEmailNotifications = () => (
    <div className="space-y-4">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={async () => {
          setLoading(true);
          try {
            const { error } = await supabase.from('email_templates').insert({ name: 'New Template', status: 'draft' });
            if (error) throw error;
          } catch (err) {
            setError('Failed to create email template');
          } finally {
            setLoading(false);
          }
        }}
        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all flex items-center gap-2 mb-4"
      >
        <Plus className="w-4 h-4" />
        Create Email Template
      </motion.button>
      <div className="space-y-3">
        {data.emailTemplates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: template.id * 0.1 }}
            className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Bell className="w-6 h-6 text-blue-400" />
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{template.name}</h3>
                  <p className="text-xs text-zinc-500">Last updated: {new Date(template.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${template.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {template.status}
                </span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-1 hover:bg-white/10 rounded transition"
                >
                  <Edit2 className="w-4 h-4 text-blue-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { error } = await supabase.from('email_templates').delete().eq('id', template.id);
                      if (error) throw error;
                    } catch (err) {
                      setError('Failed to delete template');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="p-1 hover:bg-white/10 rounded transition"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-900 text-white">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: sidebarOpen ? 256 : 64 }}
        animate={{ width: sidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-b from-zinc-900 to-zinc-800 border-r border-white/10"
      >
        <div className="flex items-center justify-between p-4">
          <motion.div
            initial={{ opacity: sidebarOpen ? 1 : 0 }}
            animate={{ opacity: sidebarOpen ? 1 : 0 }}
            className="flex items-center gap-2"
          >
            <Zap className="w-6 h-6 text-emerald-400" />
            {sidebarOpen && <span className="text-xl font-bold">EquityEdge Admin</span>}
          </motion.div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded transition"
          >
            {sidebarOpen ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              onClick={() => {
                if (item.href) {
                  router.push(item.href);
                } else {
                  setActiveTab(item.id);
                }