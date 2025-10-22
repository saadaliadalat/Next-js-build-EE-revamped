// ===== FULLY IMPLEMENTED ADMIN DASHBOARD =====
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Settings, Users, Wallet, TrendingUp, Shield, MessageSquare, 
  FileText, Globe, Bell, CreditCard, Activity, Zap, Edit2, Trash2, 
  Plus, Eye, EyeOff, Search, Filter, Download, Upload, CheckCircle, AlertCircle,
  DollarSign, ArrowUpRight, ArrowDownLeft, Clock, Calendar, MoreVertical,
  PieChart, LineChart, Award, Target, Sliders, ChevronLeft, ChevronRight,
  XCircle, Save, RefreshCw, Lock, Mail, Phone, MapPin, User, Loader2
} from 'lucide-react';
import { 
  LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';

// ===== TYPE DEFINITIONS (UNCHANGED) =====
interface Trader {
  id: string;
  name: string;
  email: string;
  balance: number;
  win_rate: number;
  total_trades: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}
interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade';
  user_id: string;
  user_name?: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}
interface Asset {
  id: string;
  name: string;
  symbol: string;
  enabled: boolean;
  pairs: number;
  volume: number;
  price: number;
  change_24h: number;
}
interface DepositWithdrawal {
  id: string;
  user_id: string;
  user_name: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}
interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}
interface Settings {
  platform_name: string;
  support_email: string;
  maintenance_mode: boolean;
  min_trade_amount: number;
  max_trade_amount: number;
  default_leverage: number;
  trading_commission: number;
  withdrawal_fee: number;
  referral_bonus: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  two_factor_auth: boolean;
  session_timeout: number;
  kyc_verification: boolean;
  aml_monitoring: boolean;
}
interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string;
  ip_address: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

// ===== MOCK DATA GENERATOR (UNCHANGED) =====
const generateMockData = () => {
  const traders: Trader[] = Array.from({ length: 50 }, (_, i) => ({
    id: `trader_${i + 1}`,
    name: `Trader ${i + 1}`,
    email: `trader${i + 1}@example.com`,
    balance: Math.floor(Math.random() * 100000) + 1000,
    win_rate: Math.floor(Math.random() * 100),
    total_trades: Math.floor(Math.random() * 1000),
    status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)] as any,
    created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
  }));
  const transactions: Transaction[] = Array.from({ length: 100 }, (_, i) => ({
    id: `txn_${i + 1}`,
    type: ['deposit', 'withdrawal', 'trade'][Math.floor(Math.random() * 3)] as any,
    user_id: `user_${Math.floor(Math.random() * 50) + 1}`,
    user_name: `User ${Math.floor(Math.random() * 50) + 1}`,
    amount: Math.floor(Math.random() * 10000) + 100,
    status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)] as any,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
  const assets: Asset[] = [
    { id: '1', name: 'Bitcoin', symbol: 'BTC', enabled: true, pairs: 15, volume: 2500000, price: 45230, change_24h: 2.5 },
    { id: '2', name: 'Ethereum', symbol: 'ETH', enabled: true, pairs: 12, volume: 1800000, price: 2850, change_24h: -1.2 },
    { id: '3', name: 'Cardano', symbol: 'ADA', enabled: true, pairs: 8, volume: 950000, price: 0.52, change_24h: 5.8 },
    { id: '4', name: 'Solana', symbol: 'SOL', enabled: false, pairs: 6, volume: 680000, price: 98.5, change_24h: -3.4 },
    { id: '5', name: 'Ripple', symbol: 'XRP', enabled: true, pairs: 10, volume: 1200000, price: 0.68, change_24h: 1.9 },
  ];
  const depositsWithdrawals: DepositWithdrawal[] = Array.from({ length: 30 }, (_, i) => ({
    id: `dw_${i + 1}`,
    user_id: `user_${Math.floor(Math.random() * 50) + 1}`,
    user_name: `User ${Math.floor(Math.random() * 50) + 1}`,
    type: Math.random() > 0.5 ? 'deposit' : 'withdrawal',
    amount: Math.floor(Math.random() * 5000) + 100,
    payment_method: ['Bank Transfer', 'Credit Card', 'PayPal', 'Crypto'][Math.floor(Math.random() * 4)],
    status: ['pending', 'completed', 'rejected'][Math.floor(Math.random() * 3)] as any,
    created_at: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
  const supportTickets: SupportTicket[] = Array.from({ length: 25 }, (_, i) => ({
    id: `ticket_${i + 1}`,
    user_id: `user_${Math.floor(Math.random() * 50) + 1}`,
    user_name: `User ${Math.floor(Math.random() * 50) + 1}`,
    title: `Support Issue ${i + 1}`,
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
    status: ['open', 'in_progress', 'resolved', 'closed'][Math.floor(Math.random() * 4)] as any,
    created_at: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
  }));
  const securityEvents: SecurityEvent[] = Array.from({ length: 15 }, (_, i) => ({
    id: `event_${i + 1}`,
    event_type: ['Login Attempt', 'Password Change', 'Withdrawal Request', 'API Access'][Math.floor(Math.random() * 4)],
    user_id: `user_${Math.floor(Math.random() * 50) + 1}`,
    ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    description: 'Security event detected',
    severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
  const settings: Settings = {
    platform_name: 'EquityEdge',
    support_email: 'support@equityedge.ai',
    maintenance_mode: false,
    min_trade_amount: 10,
    max_trade_amount: 100000,
    default_leverage: 50,
    trading_commission: 0.5,
    withdrawal_fee: 1.0,
    referral_bonus: 2.0,
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    two_factor_auth: true,
    session_timeout: 30,
    kyc_verification: true,
    aml_monitoring: true,
  };
  return { traders, transactions, assets, depositsWithdrawals, supportTickets, securityEvents, settings };
};

// ===== MAIN COMPONENT =====
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState(() => generateMockData());
  const [settings, setSettings] = useState(data.settings);
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingSecurityEvent, setEditingSecurityEvent] = useState<SecurityEvent | null>(null);
  const itemsPerPage = 10;

  // Refs for scrollable tables
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ===== NOTIFICATION SYSTEM =====
  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);
  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  // ===== COMPUTED STATS =====
  const stats = useMemo(() => {
    const totalUsers = data.traders.length;
    const activeTraders = data.traders.filter(t => t.status === 'active').length;
    const totalVolume = data.transactions.reduce((sum, t) => sum + t.amount, 0);
    const pendingRequests = data.depositsWithdrawals.filter(d => d.status === 'pending').length;
    return [
      { label: 'Total Users', value: totalUsers.toString(), change: '+12.5%', icon: Users, color: 'bg-blue-500' },
      { label: 'Active Traders', value: activeTraders.toString(), change: '+8.2%', icon: TrendingUp, color: 'bg-emerald-500' },
      { label: 'Total Volume', value: `$${(totalVolume / 1000).toFixed(1)}K`, change: '+23.1%', icon: DollarSign, color: 'bg-purple-500' },
      { label: 'Pending Requests', value: pendingRequests.toString(), change: '-5.4%', icon: Clock, color: 'bg-orange-500' },
    ];
  }, [data]);

  // ===== CHART DATA =====
  const tradingVolumeData = useMemo(() => [
    { date: 'Mon', volume: 45000, trades: 320 },
    { date: 'Tue', volume: 52000, trades: 380 },
    { date: 'Wed', volume: 48000, trades: 350 },
    { date: 'Thu', volume: 61000, trades: 420 },
    { date: 'Fri', volume: 58000, trades: 400 },
    { date: 'Sat', volume: 42000, trades: 290 },
    { date: 'Sun', volume: 38000, trades: 260 },
  ], []);
  const userDistributionData = useMemo(() => {
    const active = data.traders.filter(t => t.status === 'active').length;
    const inactive = data.traders.filter(t => t.status === 'inactive').length;
    const suspended = data.traders.filter(t => t.status === 'suspended').length;
    const total = data.traders.length;
    return [
      { name: 'Active', value: Math.round((active / total) * 100), count: active, color: '#10B981' },
      { name: 'Inactive', value: Math.round((inactive / total) * 100), count: inactive, color: '#F59E0B' },
      { name: 'Suspended', value: Math.round((suspended / total) * 100), count: suspended, color: '#EF4444' },
    ];
  }, [data.traders]);
  const transactionTypeData = useMemo(() => {
    const deposits = data.transactions.filter(t => t.type === 'deposit').length;
    const withdrawals = data.transactions.filter(t => t.type === 'withdrawal').length;
    const trades = data.transactions.filter(t => t.type === 'trade').length;
    return [
      { name: 'Deposits', value: deposits, color: '#10B981' },
      { name: 'Withdrawals', value: withdrawals, color: '#EF4444' },
      { name: 'Trades', value: trades, color: '#3B82F6' },
    ];
  }, [data.transactions]);

  // ===== FILTERS & SEARCH =====
  const filteredTraders = useMemo(() => 
    data.traders.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchesSearch && matchesStatus;
    }),
    [data.traders, searchQuery, filterStatus]
  );

  const filteredTransactions = useMemo(() => 
    data.transactions.filter(t => {
      const matchesSearch = t.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || t.type === filterStatus;
      return matchesSearch && matchesStatus;
    }),
    [data.transactions, searchQuery, filterStatus]
  );

  const filteredDeposits = useMemo(() =>
    data.depositsWithdrawals.filter(d => {
      const matchesSearch = d.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.payment_method.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
      return matchesSearch && matchesStatus;
    }),
    [data.depositsWithdrawals, searchQuery, filterStatus]
  );

  const filteredTickets = useMemo(() =>
    data.supportTickets.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchesSearch && matchesStatus;
    }),
    [data.supportTickets, searchQuery, filterStatus]
  );

  const filteredSecurityEvents = useMemo(() =>
    data.securityEvents.filter(e => {
      const matchesSearch = e.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || e.severity === filterStatus;
      return matchesSearch && matchesStatus;
    }),
    [data.securityEvents, searchQuery, filterStatus]
  );

  // ===== PAGINATION =====
  const paginatedTraders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTraders.slice(start, start + itemsPerPage);
  }, [filteredTraders, currentPage]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const paginatedDeposits = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDeposits.slice(start, start + itemsPerPage);
  }, [filteredDeposits, currentPage]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(start, start + itemsPerPage);
  }, [filteredTickets, currentPage]);

  const paginatedSecurityEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSecurityEvents.slice(start, start + itemsPerPage);
  }, [filteredSecurityEvents, currentPage]);

  const totalPages = useMemo(() => {
    switch (activeTab) {
      case 'traders': return Math.ceil(filteredTraders.length / itemsPerPage);
      case 'transactions': return Math.ceil(filteredTransactions.length / itemsPerPage);
      case 'deposits': return Math.ceil(filteredDeposits.length / itemsPerPage);
      case 'support': return Math.ceil(filteredTickets.length / itemsPerPage);
      case 'security': return Math.ceil(filteredSecurityEvents.length / itemsPerPage);
      default: return 1;
    }
  }, [activeTab, filteredTraders.length, filteredTransactions.length, filteredDeposits.length, filteredTickets.length, filteredSecurityEvents.length]);

  // ===== API OPERATIONS =====
  const createTrader = useCallback(async () => {
    setLoading(true);
    try {
      const newTrader: Trader = {
        id: `trader_${Date.now()}`,
        name: 'New Trader',
        email: `trader${Date.now()}@example.com`,
        balance: 0,
        win_rate: 0,
        total_trades: 0,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      setData(prev => ({ ...prev, traders: [newTrader, ...prev.traders] }));
      showSuccess('Trader created successfully!');
    } catch (err) {
      showError('Failed to create trader. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const updateTrader = useCallback(async (updatedTrader: Trader) => {
    setLoading(true);
    try {
      setData(prev => ({
        ...prev,
        traders: prev.traders.map(t => t.id === updatedTrader.id ? updatedTrader : t)
      }));
      setEditingTrader(null);
      showSuccess('Trader updated successfully!');
    } catch (err) {
      showError('Failed to update trader. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const deleteTrader = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this trader?')) return;
    setLoading(true);
    try {
      setData(prev => ({ ...prev, traders: prev.traders.filter(t => t.id !== id) }));
      showSuccess('Trader deleted successfully!');
    } catch (err) {
      showError('Failed to delete trader. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const updateDepositStatus = useCallback(async (id: string, status: 'completed' | 'rejected') => {
    setLoading(true);
    try {
      setData(prev => ({
        ...prev,
        depositsWithdrawals: prev.depositsWithdrawals.map(d =>
          d.id === id ? { ...d, status, updated_at: new Date().toISOString() } : d
        )
      }));
      showSuccess(`Request ${status} successfully!`);
    } catch (err) {
      showError(`Failed to ${status} request. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const updateTicketStatus = useCallback(async (id: string, status: SupportTicket['status']) => {
    setLoading(true);
    try {
      setData(prev => ({
        ...prev,
        supportTickets: prev.supportTickets.map(t =>
          t.id === id ? { ...t, status, updated_at: new Date().toISOString() } : t
        )
      }));
      showSuccess('Ticket status updated successfully!');
    } catch (err) {
      showError('Failed to update ticket status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const toggleAsset = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setData(prev => ({
        ...prev,
        assets: prev.assets.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
      }));
      showSuccess('Asset status updated successfully!');
    } catch (err) {
      showError('Failed to update asset status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const updateAsset = useCallback(async (updatedAsset: Asset) => {
    setLoading(true);
    try {
      setData(prev => ({
        ...prev,
        assets: prev.assets.map(a => a.id === updatedAsset.id ? updatedAsset : a)
      }));
      setEditingAsset(null);
      showSuccess('Asset updated successfully!');
    } catch (err) {
      showError('Failed to update asset. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const saveSettings = useCallback(async () => {
    setLoading(true);
    try {
      setData(prev => ({ ...prev, settings }));
      showSuccess('Settings saved successfully!');
    } catch (err) {
      showError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [settings, showSuccess, showError]);

  const exportData = useCallback((type: string) => {
    try {
      let csvContent = '';
      let filename = '';
      switch (type) {
        case 'traders':
          csvContent = 'ID,Name,Email,Balance,Win Rate,Total Trades,Status,Created At\n' +
            data.traders.map(t => `${t.id},${t.name},${t.email},${t.balance},${t.win_rate},${t.total_trades},${t.status},${t.created_at}`).join('\n');
          filename = 'traders.csv';
          break;
        case 'transactions':
          csvContent = 'ID,Type,User ID,User Name,Amount,Status,Created At\n' +
            data.transactions.map(t => `${t.id},${t.type},${t.user_id},${t.user_name},${t.amount},${t.status},${t.created_at}`).join('\n');
          filename = 'transactions.csv';
          break;
        case 'deposits':
          csvContent = 'ID,User Name,Type,Amount,Payment Method,Status,Created At\n' +
            data.depositsWithdrawals.map(d => `${d.id},${d.user_name},${d.type},${d.amount},${d.payment_method},${d.status},${d.created_at}`).join('\n');
          filename = 'deposits_withdrawals.csv';
          break;
        case 'tickets':
          csvContent = 'ID,User Name,Title,Description,Priority,Status,Created At\n' +
            data.supportTickets.map(t => `${t.id},${t.user_name},"${t.description}",${t.priority},${t.status},${t.created_at}`).join('\n');
          filename = 'support_tickets.csv';
          break;
        case 'security':
          csvContent = 'ID,Event Type,IP Address,Description,Severity,Created At\n' +
            data.securityEvents.map(e => `${e.id},${e.event_type},${e.ip_address},"${e.description}",${e.severity},${e.created_at}`).join('\n');
          filename = 'security_events.csv';
          break;
      }
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      showSuccess(`${type} exported successfully!`);
    } catch (err) {
      showError('Failed to export data. Please try again.');
    }
  }, [data, showSuccess, showError]);

  // ===== MENU ITEMS =====
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'traders', label: 'Traders & Accounts', icon: Award },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'assets', label: 'Trading Assets', icon: TrendingUp },
    { id: 'deposits', label: 'Deposits & Withdrawals', icon: Wallet },
    { id: 'support', label: 'Support Tickets', icon: MessageSquare },
    { id: 'security', label: 'Security & Compliance', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // ===== HELPER FUNCTIONS =====
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'resolved':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'inactive':
      case 'pending':
      case 'open':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'suspended':
      case 'rejected':
      case 'failed':
      case 'closed':
        return 'bg-red-500/20 text-red-400';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  // ===== RENDER FUNCTIONS =====
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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
            <div className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              {stat.change} from last week
            </div>
          </motion.div>
        ))}
      </div>
      {/* Charts */}
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
          <ResponsiveContainer width="100%" height={250}>
            <RechartsLine data={tradingVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff20', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="volume" stroke="#10B981" strokeWidth={2} name="Volume ($)" />
              <Line type="monotone" dataKey="trades" stroke="#3B82F6" strokeWidth={2} name="Trades" />
            </RechartsLine>
          </ResponsiveContainer>
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
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie
                data={userDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}% (${entry.count})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff20', borderRadius: '8px' }}
              />
            </RechartsPie>
          </ResponsiveContainer>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Transaction Types
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={transactionTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff20', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                {transactionTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {data.transactions.slice(0, 5).map((txn, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.05] transition">
                <div className="flex items-center gap-3">
                  {txn.type === 'withdrawal' ? (
                    <ArrowDownLeft className="w-4 h-4 text-red-400" />
                  ) : txn.type === 'deposit' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Activity className="w-4 h-4 text-blue-400" />
                  )}
                  <div>
                    <span className="text-sm text-zinc-300 capitalize">{txn.type} - ${txn.amount.toLocaleString()}</span>
                    <p className="text-xs text-zinc-500">{txn.user_name}</p>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">{new Date(txn.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderTraders = () => (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
          transition={{ delay: 0.1 }}
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
          transition={{ delay: 0.2 }}
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
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50 transition"
            aria-label="Search traders"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={createTrader}
          disabled={loading}
          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          aria-label="Create new trader"
        >
          <Plus className="w-4 h-4" />
          Create Trader
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => exportData('traders')}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2"
          aria-label="Export traders data"
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>
      </div>
      {/* Table */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto" ref={tableContainerRef}>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Win Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Trades</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTraders.map((trader) => (
                <tr key={trader.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 text-sm text-white font-mono">{trader.id.substring(0, 12)}</td>
                  <td className="px-4 py-3 text-sm text-white">{trader.name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{trader.email}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400 font-semibold">${trader.balance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-white">{trader.win_rate}%</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{trader.total_trades}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(trader.status)}`}>
                      {trader.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingTrader(trader)}
                        className="p-1 hover:bg-white/10 rounded transition"
                        aria-label={`Edit trader ${trader.name}`}
                      >
                        <Edit2 className="w-4 h-4 text-blue-400" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteTrader(trader.id)}
                        className="p-1 hover:bg-white/10 rounded transition"
                        aria-label={`Delete trader ${trader.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-zinc-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTraders.length)} of {filteredTraders.length} traders
            </p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded transition ${
                      currentPage === page 
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                    aria-label={`Go to page ${page}`}
                  >
                    {page}
                  </motion.button>
                );
              })}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Trader Modal */}
      <AnimatePresence>
        {editingTrader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setEditingTrader(null)}
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Edit Trader</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingTrader.name}
                    onChange={(e) => setEditingTrader({ ...editingTrader, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingTrader.email}
                    onChange={(e) => setEditingTrader({ ...editingTrader, email: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Balance</label>
                  <input
                    type="number"
                    value={editingTrader.balance}
                    onChange={(e) => setEditingTrader({ ...editingTrader, balance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Status</label>
                  <select
                    value={editingTrader.status}
                    onChange={(e) => setEditingTrader({ ...editingTrader, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateTrader(editingTrader)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded text-white font-medium disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditingTrader(null)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by user ID, transaction ID, or name..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50 transition"
            aria-label="Search transactions"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50"
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="trade">Trading</option>
        </select>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => exportData('transactions')}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2"
          aria-label="Export transactions"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </motion.button>
      </div>
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto" ref={tableContainerRef}>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((txn) => (
                <tr key={txn.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 text-sm text-white font-mono">{txn.id.substring(0, 12)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {txn.type === 'withdrawal' ? (
                        <ArrowDownLeft className="w-4 h-4 text-red-400" />
                      ) : txn.type === 'deposit' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Activity className="w-4 h-4 text-blue-400" />
                      )}
                      <span className="text-white capitalize">{txn.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="text-white">{txn.user_name}</p>
                      <p className="text-xs text-zinc-500 font-mono">{txn.user_id.substring(0, 12)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">${txn.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {new Date(txn.created_at).toLocaleDateString()} {new Date(txn.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-zinc-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded transition ${
                      currentPage === page 
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                    aria-label={`Go to page ${page}`}
                  >
                    {page}
                  </motion.button>
                );
              })}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => exportData('assets')}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2"
          aria-label="Export assets data"
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.assets.map((asset, i) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">{asset.name}</h3>
                <p className="text-zinc-400 text-sm">{asset.symbol}</p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setEditingAsset(asset)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                  aria-label={`Edit ${asset.name}`}
                >
                  <Edit2 className="w-5 h-5 text-blue-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleAsset(asset.id)}
                  className={`p-2 rounded-lg transition ${
                    asset.enabled 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}
                  aria-label={`Toggle ${asset.name} ${asset.enabled ? 'off' : 'on'}`}
                >
                  {asset.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </motion.button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Price</span>
                <span className="text-white font-semibold">${asset.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">24h Change</span>
                <span className={`font-semibold ${asset.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {asset.change_24h >= 0 ? '+' : ''}{asset.change_24h}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Volume</span>
                <span className="text-white">${(asset.volume / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Pairs</span>
                <span className="text-white">{asset.pairs}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className={`text-xs font-semibold ${asset.enabled ? 'text-emerald-400' : 'text-red-400'}`}>
                {asset.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Asset Modal */}
      <AnimatePresence>
        {editingAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setEditingAsset(null)}
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Edit Asset</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingAsset.name}
                    onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Symbol</label>
                  <input
                    type="text"
                    value={editingAsset.symbol}
                    onChange={(e) => setEditingAsset({ ...editingAsset, symbol: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingAsset.price}
                    onChange={(e) => setEditingAsset({ ...editingAsset, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">24h Change (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingAsset.change_24h}
                    onChange={(e) => setEditingAsset({ ...editingAsset, change_24h: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Volume</label>
                  <input
                    type="number"
                    value={editingAsset.volume}
                    onChange={(e) => setEditingAsset({ ...editingAsset, volume: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Pairs</label>
                  <input
                    type="number"
                    value={editingAsset.pairs}
                    onChange={(e) => setEditingAsset({ ...editingAsset, pairs: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateAsset(editingAsset)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded text-white font-medium disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderDepositsWithdrawals = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
          transition={{ delay: 0.1 }}
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
          transition={{ delay: 0.2 }}
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
      
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by user name, ID, or payment method..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50 transition"
            aria-label="Search deposits and withdrawals"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => exportData('deposits')}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2"
          aria-label="Export deposits and withdrawals"
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>
      </div>

      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto" ref={tableContainerRef}>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Payment Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDeposits.map((req) => (
                <tr key={req.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 text-sm text-white font-mono">{req.id.substring(0, 12)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="text-white">{req.user_name}</p>
                      <p className="text-xs text-zinc-500 font-mono">{req.user_id.substring(0, 12)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {req.type === 'withdrawal' ? (
                        <ArrowUpRight className="w-4 h-4 text-red-400" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                      )}
                      <span className="text-white capitalize">{req.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">${req.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{req.payment_method}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateDepositStatus(req.id, 'completed')}
                          disabled={loading}
                          className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded transition"
                          aria-label={`Approve ${req.type} request`}
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateDepositStatus(req.id, 'rejected')}
                          disabled={loading}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded transition"
                          aria-label={`Reject ${req.type} request`}
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                        </motion.button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-zinc-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDeposits.length)} of {filteredDeposits.length} requests
            </p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded transition ${
                      currentPage === page 
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                    aria-label={`Go to page ${page}`}
                  >
                    {page}
                  </motion.button>
                );
              })}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search tickets by title, user, or description..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50 transition"
            aria-label="Search support tickets"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50"
          aria-label="Filter by priority"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => exportData('tickets')}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2"
          aria-label="Export support tickets"
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>
      </div>
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto" ref={tableContainerRef}>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/[0.02] transition cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                  <td className="px-4 py-3 text-sm text-white font-mono">{ticket.id.substring(0, 12)}</td>
                  <td className="px-4 py-3 text-sm text-white">{ticket.user_name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{ticket.title}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicket(ticket);
                      }}
                      className="p-1 hover:bg-white/10 rounded transition"
                      aria-label={`View details for ticket ${ticket.id}`}
                    >
                      <MoreVertical className="w-4 h-4 text-zinc-400" />
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-zinc-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTickets.length)} of {filteredTickets.length} tickets
            </p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded transition ${
                      currentPage === page 
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                    aria-label={`Go to page ${page}`}
                  >
                    {page}
                  </motion.button>
                );
              })}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTicket(null)}
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white">Support Ticket Details</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 hover:bg-white/10 rounded"
                  aria-label="Close ticket details"
                >
                  <XCircle className="w-5 h-5 text-zinc-400" />
                </motion.button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">User</label>
                    <p className="text-white">{selectedTicket.user_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">ID</label>
                    <p className="text-white font-mono">{selectedTicket.id}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Title</label>
                  <p className="text-white">{selectedTicket.title}</p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Description</label>
                  <p className="text-zinc-300 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Priority</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as any)}
                        className="px-3 py-1 bg-zinc-800 border border-white/10 rounded text-white text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Created</label>
                    <p className="text-zinc-300">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Last Updated</label>
                    <p className="text-zinc-300">{new Date(selectedTicket.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by event type, IP, or description..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50 transition"
            aria-label="Search security events"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50"
          aria-label="Filter by severity"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => exportData('security')}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2"
          aria-label="Export security events"
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>
      </div>
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto" ref={tableContainerRef}>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Event Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">User ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSecurityEvents.map((event) => (
                <tr key={event.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 text-sm text-white font-mono">{event.id.substring(0, 12)}</td>
                  <td className="px-4 py-3 text-sm text-white">{event.event_type}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 font-mono">{event.user_id.substring(0, 12)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{event.ip_address}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {new Date(event.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setEditingSecurityEvent(event)}
                      className="p-1 hover:bg-white/10 rounded transition"
                      aria-label={`View details for event ${event.id}`}
                    >
                      <Eye className="w-4 h-4 text-blue-400" />
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-zinc-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSecurityEvents.length)} of {filteredSecurityEvents.length} events
            </p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded transition ${
                      currentPage === page 
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                    aria-label={`Go to page ${page}`}
                  >
                    {page}
                  </motion.button>
                );
              })}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Security Event Detail Modal */}
      <AnimatePresence>
        {editingSecurityEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setEditingSecurityEvent(null)}
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-lg p-6 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white">Security Event Details</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setEditingSecurityEvent(null)}
                  className="p-1 hover:bg-white/10 rounded"
                  aria-label="Close event details"
                >
                  <XCircle className="w-5 h-5 text-zinc-400" />
                </motion.button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Event ID</label>
                    <p className="text-white font-mono">{editingSecurityEvent.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Event Type</label>
                    <p className="text-white">{editingSecurityEvent.event_type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">User ID</label>
                    <p className="text-zinc-300 font-mono">{editingSecurityEvent.user_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">IP Address</label>
                    <p className="text-zinc-300">{editingSecurityEvent.ip_address}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Description</label>
                  <p className="text-zinc-300">{editingSecurityEvent.description}</p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Severity</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(editingSecurityEvent.severity)}`}>
                    {editingSecurityEvent.severity}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Date</label>
                  <p className="text-zinc-300">{new Date(editingSecurityEvent.created_at).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={saveSettings}
          disabled={loading}
          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          aria-label="Save settings"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </motion.button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Platform Name</label>
              <input
                type="text"
                value={settings.platform_name}
                onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Support Email</label>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Maintenance Mode</label>
                <p className="text-xs text-zinc-500">Enable to restrict user access</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.maintenance_mode ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
                aria-label="Toggle maintenance mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Trading Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trading Settings
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Min Trade Amount</label>
                <input
                  type="number"
                  value={settings.min_trade_amount}
                  onChange={(e) => setSettings({ ...settings, min_trade_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Max Trade Amount</label>
                <input
                  type="number"
                  value={settings.max_trade_amount}
                  onChange={(e) => setSettings({ ...settings, max_trade_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Default Leverage</label>
                <input
                  type="number"
                  value={settings.default_leverage}
                  onChange={(e) => setSettings({ ...settings, default_leverage: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Trading Commission (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.trading_commission}
                  onChange={(e) => setSettings({ ...settings, trading_commission: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fees & Bonuses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Fees & Bonuses
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Withdrawal Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.withdrawal_fee}
                  onChange={(e) => setSettings({ ...settings, withdrawal_fee: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Referral Bonus (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.referral_bonus}
                  onChange={(e) => setSettings({ ...settings, referral_bonus: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email Notifications</label>
                <p className="text-xs text-zinc-500">Send email alerts</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({ ...settings, email_notifications: !settings.email_notifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.email_notifications ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
                aria-label="Toggle email notifications"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">SMS Notifications</label>
                <p className="text-xs text-zinc-500">Send SMS alerts</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({ ...settings, sms_notifications: !settings.sms_notifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.sms_notifications ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
                aria-label="Toggle SMS notifications"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.sms_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Push Notifications</label>
                <p className="text-xs text-zinc-500">Send browser push alerts</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({ ...settings, push_notifications: !settings.push_notifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.push_notifications ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
                aria-label="Toggle push notifications"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.push_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Two-Factor Authentication</label>
                <p className="text-xs text-zinc-500">Require 2FA for all users</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({ ...settings, two_factor_auth: !settings.two_factor_auth })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.two_factor_auth ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
                aria-label="Toggle two-factor authentication"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.two_factor_auth ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => setSettings({ ...settings, session_timeout: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">KYC Verification</label>
                <p className="text-xs text-zinc-500">Require identity verification</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({ ...settings, kyc_verification: !settings.kyc_verification })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.kyc_verification ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
                aria-label="Toggle KYC verification"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.kyc_verification ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">AML Monitoring</label>
                <p className="text-xs text-zinc-500">Enable anti-money laundering checks</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({ ...settings, aml_monitoring: !settings.aml_monitoring })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.aml_monitoring ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
                aria-label="Toggle AML monitoring"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.aml_monitoring ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // ===== NOTIFICATION TOASTS =====
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Global Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-red-500/90 backdrop-blur border border-red-400/30 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-emerald-500/90 backdrop-blur border border-emerald-400/30 rounded-lg p-4 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 240 : 64 }}
          className="bg-zinc-900/80 backdrop-blur border-r border-white/10 h-screen flex flex-col"
        >
          <div className="p-4 flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                EquityEdge
              </h1>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </motion.button>
          </div>
          <nav className="flex-1 mt-6">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <motion.li key={item.id} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setSearchQuery('');
                      setFilterStatus('all');
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                      activeTab === item.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                    aria-current={activeTab === item.id ? 'page' : undefined}
                    aria-label={item.label}
                  >
                    <item.icon className="w-5 h-5" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                </motion.li>
              ))}
            </ul>
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white capitalize">
              {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="text-zinc-400 mt-1">
              Manage your platform efficiently
            </p>
          </header>

          {/* Tab Content */}
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'traders' && renderTraders()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'assets' && renderAssets()}
          {activeTab === 'deposits' && renderDepositsWithdrawals()}
          {activeTab === 'support' && renderSupport()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
}