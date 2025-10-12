'use client';

import { useState, useCallback } from 'react';
import { 
  BarChart3, Settings, Users, Wallet, TrendingUp, Shield, MessageSquare, 
  FileText, Globe, Lock, Bell, CreditCard, Activity, Zap, Edit2, Trash2, 
  Plus, Eye, EyeOff, Search, Filter, Download, Upload, CheckCircle, AlertCircle,
  DollarSign, ArrowUpRight, ArrowDownLeft, Clock, Calendar, MoreVertical,
  PieChart, LineChart, Award, Target, Sliders, Database
} from 'lucide-react';

export default function AdminCMS() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Dashboard Stats
  const stats = [
    { label: 'Total Users', value: '89', change: '+12.5%', icon: Users, color: 'bg-blue-500' },
    { label: 'Active Traders', value: '45', change: '+8.2%', icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Total Volume', value: '$4K', change: '+23.1%', icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Pending Requests', value: '4', change: '-2.1%', icon: Clock, color: 'bg-orange-500' },
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'traders', label: 'Traders & Accounts', icon: Award },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'assets', label: 'Trading Assets', icon: TrendingUp },
    { id: 'deposits', label: 'Deposits & Withdrawals', icon: Wallet },
    { id: 'support', label: 'Support Tickets', icon: MessageSquare },
    { id: 'content', label: 'Content Management', icon: FileText },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
    { id: 'security', label: 'Security & Compliance', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'email', label: 'Email Notifications', icon: Bell },
  ];

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-sm font-medium">{stat.label}</h3>
              <div className={`p-2 ${stat.color} rounded-lg bg-opacity-10`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
            <div className="text-xs text-emerald-400 font-semibold">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Trading Volume (7 days)
          </h3>
          <div className="h-64 bg-white/[0.02] border border-white/5 rounded flex items-center justify-center text-zinc-500">
            Chart Visualization Area
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            User Distribution
          </h3>
          <div className="h-64 bg-white/[0.02] border border-white/5 rounded flex items-center justify-center text-zinc-500">
            Chart Visualization Area
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.05] transition">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-zinc-300">User activity #{i}</span>
              </div>
              <span className="text-xs text-zinc-500">{i * 5} min ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render User Management
  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:border-emerald-500/50 outline-none"
          />
        </div>
        <button className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                <input type="checkbox" className="w-4 h-4" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Username</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">KYC</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                <td className="px-4 py-3"><input type="checkbox" className="w-4 h-4" /></td>
                <td className="px-4 py-3 text-sm text-white">User {i}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">user{i}@example.com</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${i % 2 === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {i % 2 === 0 ? 'Active' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${i % 3 === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {i % 3 === 0 ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-white font-semibold">${(i * 1500).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">Dec {i}, 2024</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-white/10 rounded transition" title="Edit">
                      <Edit2 className="w-4 h-4 text-blue-400" />
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded transition" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Traders
  const renderTraders = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Total Traders</p>
              <p className="text-2xl font-bold text-white">88</p>
            </div>
            <Award className="w-8 h-8 text-emerald-400 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Avg Win Rate</p>
              <p className="text-2xl font-bold text-white">58.3%</p>
            </div>
            <Target className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Total Trades</p>
              <p className="text-2xl font-bold text-white">124</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>
      </div>

      <button className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all flex items-center gap-2 mb-4">
        <Plus className="w-4 h-4" />
        Create Trader Account
      </button>

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
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                <td className="px-4 py-3 text-sm text-white font-mono">TR{String(i).padStart(5, '0')}</td>
                <td className="px-4 py-3 text-sm text-white">Trader Name {i}</td>
                <td className="px-4 py-3 text-sm text-emerald-400 font-semibold">${(i * 25000).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-white">{55 + i}%</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{i * 450}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">Active</span>
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

  // Render Transactions
  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <select className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50">
          <option>All Types</option>
          <option>Deposits</option>
          <option>Withdrawals</option>
          <option>Trading</option>
        </select>
        <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
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
            {[1, 2, 3, 4].map((i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                <td className="px-4 py-3 text-sm text-white font-mono">TXN{String(i * 10025).padStart(7, '0')}</td>
                <td className="px-4 py-3 text-sm flex items-center gap-2">
                  {i % 2 === 0 ? <ArrowDownLeft className="w-4 h-4 text-red-400" /> : <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                  <span className="text-white">{i % 2 === 0 ? 'Withdrawal' : 'Deposit'}</span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400">User {i}</td>
                <td className="px-4 py-3 text-sm font-semibold text-white">${(i * 5000).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${i % 3 === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {i % 3 === 0 ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400">Dec {i}, 2024</td>
                <td className="px-4 py-3 text-sm">
                  <button className="p-1 hover:bg-white/10 rounded transition">
                    <Eye className="w-4 h-4 text-zinc-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Trading Assets
  const renderAssets = () => (
    <div className="space-y-4">
      <button className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all flex items-center gap-2 mb-4">
        <Plus className="w-4 h-4" />
        Add Asset
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Forex', 'Crypto', 'Stocks', 'Commodities', 'Indices', 'ETFs'].map((asset, i) => (
          <div key={i} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{asset}</h3>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Enabled:</span>
                <span className="text-white font-semibold">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Pairs:</span>
                <span className="text-white font-semibold">{i * 12 + 8}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Volume:</span>
                <span className="text-white font-semibold">${(i * 2.5)}M</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-2 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-400 text-xs font-medium transition-all">
                <Edit2 className="w-3 h-3 inline mr-1" />
                Edit
              </button>
              <button className="flex-1 px-2 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-400 text-xs font-medium transition-all">
                Disable
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Deposits & Withdrawals
  const renderDepositsWithdrawals = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Total Deposits</p>
              <p className="text-2xl font-bold text-emerald-400">$2.5k</p>
            </div>
            <ArrowDownLeft className="w-8 h-8 text-emerald-400 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Total Withdrawals</p>
              <p className="text-2xl font-bold text-red-400">$1.8k</p>
            </div>
            <ArrowUpRight className="w-8 h-8 text-red-400 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-2">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-400">18</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400 opacity-50" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4 mb-6">
        <h3 className="text-white font-semibold mb-4">Pending Requests</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.05] transition">
              <div className="flex-1">
                <p className="text-white font-semibold">User {i} - ${(i * 2000).toLocaleString()}</p>
                <p className="text-xs text-zinc-500">Deposit • Dec {i}, 2024</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-emerald-400 text-xs font-medium transition-all">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Approve
                </button>
                <button className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-400 text-xs font-medium transition-all">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
            {[1, 2, 3, 4].map((i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                <td className="px-4 py-3 text-sm text-white font-mono">DEP{String(i).padStart(6, '0')}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">User {i}</td>
                <td className="px-4 py-3 text-sm text-emerald-400">{i % 2 === 0 ? 'Withdrawal' : 'Deposit'}</td>
                <td className="px-4 py-3 text-sm text-white font-semibold">${(i * 3000).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{['Bank Transfer', 'Crypto', 'Card'][i % 3]}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${i % 2 === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {i % 2 === 0 ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400">Dec {i}, 2024</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Support
  const renderSupport = () => (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <select className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50">
          <option>All Status</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
          <option>Closed</option>
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
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4">
          <p className="text-zinc-400 text-xs mb-1">Open Tickets</p>
          <p className="text-2xl font-bold text-orange-400">24</p>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4">
          <p className="text-zinc-400 text-xs mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-400">12</p>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4">
          <p className="text-zinc-400 text-xs mb-1">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400">156</p>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4">
          <p className="text-zinc-400 text-xs mb-1">Avg Response</p>
          <p className="text-2xl font-bold text-purple-400">2.5h</p>
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold">Ticket #{1000 + i}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${['bg-orange-500/20 text-orange-400', 'bg-emerald-500/20 text-emerald-400', 'bg-blue-500/20 text-blue-400', 'bg-purple-500/20 text-purple-400', 'bg-red-500/20 text-red-400'][i % 5]}`}>
                    {['Open', 'In Progress', 'Resolved', 'Pending', 'Urgent'][i % 5]}
                  </span>
                </div>
                <p className="text-white mb-1">Trading platform issue - {['Cannot withdraw', 'Login problem', 'Balance error', 'Trade execution', 'Account locked'][i % 5]}</p>
                <p className="text-sm text-zinc-400 mb-2">User {i} • {['High', 'Medium', 'Low', 'Urgent', 'Medium'][i % 5]} Priority</p>
                <p className="text-xs text-zinc-500">Dec {i}, 2024 • Last reply 2 hours ago</p>
              </div>
              <button className="p-2 hover:bg-white/10 rounded transition">
                <MoreVertical className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Content Management
  const renderContent = () => (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <button className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Content
        </button>
        <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Media
        </button>
      </div>

      <div className="space-y-3">
        {['Homepage Banner', 'Blog Post', 'FAQ Section', 'Tutorial Video', 'Terms & Conditions'].map((content, i) => (
          <div key={i} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <FileText className="w-6 h-6 text-blue-400" />
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{content}</h3>
                  <p className="text-xs text-zinc-500">Last updated: Dec {i + 1}, 2024</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${i % 2 === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {i % 2 === 0 ? 'Published' : 'Draft'}
                </span>
                <button className="p-1 hover:bg-white/10 rounded transition">
                  <Edit2 className="w-4 h-4 text-blue-400" />
                </button>
                <button className="p-1 hover:bg-white/10 rounded transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Settings
  const renderSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Platform Name</label>
              <input type="text" defaultValue="TradePro" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Support Email</label>
              <input type="email" defaultValue="support@tradepro.com" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Maintenance Mode</label>
              <select className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50">
                <option>Off</option>
                <option>On</option>
              </select>
            </div>
            <button className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all">
              Save Changes
            </button>
          </div>
        </div>

        {/* Trading Settings */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trading Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Min Trade Amount (USD)</label>
              <input type="number" defaultValue="10" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Max Trade Amount (USD)</label>
              <input type="number" defaultValue="100000" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Default Leverage</label>
              <input type="number" defaultValue="50" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <button className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all">
              Save Changes
            </button>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Commission Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Trading Commission %</label>
              <input type="number" step="0.1" defaultValue="0.5" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Withdrawal Fee %</label>
              <input type="number" step="0.1" defaultValue="1.0" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Deposit Fee %</label>
              <input type="number" step="0.1" defaultValue="0.0" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <button className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all">
              Save Changes
            </button>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            API Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">API Key</label>
              <div className="flex">
                <input type="password" defaultValue="••••••••••••••" className="flex-1 px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-l text-white outline-none" />
                <button className="px-3 py-2 bg-white/5 border border-white/10 border-l-0 rounded-r text-zinc-400 hover:text-white transition">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button className="w-full px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-400 font-medium transition-all">
              Regenerate Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Security
  const renderSecurity = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Settings */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            KYC & Verification
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Require KYC</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Require Proof of Address</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Enable 2FA</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Email Verification Required</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <button className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all">
              Save Changes
            </button>
          </div>
        </div>

        {/* Security Limits */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security Limits
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Max Daily Withdrawal (USD)</label>
              <input type="number" defaultValue="50000" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Account Lockout After Failed Attempts</label>
              <input type="number" defaultValue="5" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <button className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all">
              Save Changes
            </button>
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6 md:col-span-2">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Compliance & Regulations
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Operating License</label>
              <input type="text" defaultValue="License #12345" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400 block mb-2">Last Audit</label>
                <input type="date" defaultValue="2024-11-15" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 block mb-2">Next Audit</label>
                <input type="date" defaultValue="2025-02-15" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
              </div>
            </div>
            <button className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Analytics
  const renderAnalytics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Platform Growth</h3>
          <div className="h-64 bg-white/[0.02] border border-white/5 rounded flex items-center justify-center text-zinc-500">
            📈 Growth Chart
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Revenue Distribution</h3>
          <div className="h-64 bg-white/[0.02] border border-white/5 rounded flex items-center justify-center text-zinc-500">
             Revenue Chart
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Session Duration', value: '24m 32s' },
            { label: 'Bounce Rate', value: '3.2%' },
            { label: 'Daily Active Users', value: '1,247' },
            { label: 'Conversion Rate', value: '8.5%' },
          ].map((metric, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
              <p className="text-zinc-400 text-xs mb-2">{metric.label}</p>
              <p className="text-xl font-bold text-white">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Email Notifications
  const renderEmail = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Email Notification Templates</h3>
          <div className="space-y-2">
            {['Welcome Email', 'Password Reset', 'Trade Confirmation', 'Withdrawal Approved', 'Account Alert'].map((template, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.05] transition cursor-pointer">
                <span className="text-zinc-300">{template}</span>
                <button className="p-1 hover:bg-white/10 rounded transition">
                  <Edit2 className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Email Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">SMTP Server</label>
              <input type="text" defaultValue="smtp.example.com" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">SMTP Port</label>
              <input type="number" defaultValue="587" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">From Address</label>
              <input type="email" defaultValue="noreply@tradepro.com" className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded text-white outline-none focus:border-emerald-500/50" />
            </div>
            <button className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all">
              Test Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_70%)]" style={{ zIndex: 0 }} />

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-zinc-900/50 to-black border-r border-white/10 transition-all duration-300`}>
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                {sidebarOpen && <span className="font-bold text-lg">Equity Edge Ai Admin</span>}
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'text-zinc-400 hover:bg-white/5 border border-transparent'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="border-b border-white/10 bg-gradient-to-r from-zinc-900/50 to-black backdrop-blur-sm p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <Sliders className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500/50 w-64"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-zinc-400 hover:text-white cursor-pointer transition" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                    A
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'traders' && renderTraders()}
              {activeTab === 'transactions' && renderTransactions()}
              {activeTab === 'assets' && renderAssets()}
              {activeTab === 'deposits' && renderDepositsWithdrawals()}
              {activeTab === 'support' && renderSupport()}
              {activeTab === 'content' && renderContent()}
              {activeTab === 'settings' && renderSettings()}
              {activeTab === 'security' && renderSecurity()}
              {activeTab === 'analytics' && renderAnalytics()}
              {activeTab === 'email' && renderEmail()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}