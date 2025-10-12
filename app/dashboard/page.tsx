"use client";

import { useEffect, useState, Suspense, memo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Upload, Wallet, History, Download, MessageSquare, TrendingUp, TrendingDown, 
  Search, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle, 
  AlertCircle, RefreshCw, DollarSign, Activity, PieChart, BarChart3,
  FileText, Eye, EyeOff, Copy, Check, Filter, Calendar, Award
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Define types
type Trade = {
  id: string;
  user_id: string;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  entry_price: number;
  exit_price?: number;
  profit_loss?: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
};

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  proof_filename?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  bank_details: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    routingNumber: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'closed';
  created_at: string;
};

// Enhanced GlassCard with hover effects
const GlassCard = memo(({ 
  children, 
  className = "", 
  delay = 0,
  hover = true 
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
  hover?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
    className={`relative group ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-transparent rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl" />
    {hover && (
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:via-emerald-500/0 group-hover:to-transparent rounded-2xl transition-all duration-500" />
    )}
    <div className="relative p-6 rounded-2xl transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-emerald-500/10">
      {children}
    </div>
  </motion.div>
));

// Enhanced NumberAnimation with color transitions
const NumberAnimation = memo(({ 
  value, 
  format = (v: number) => v.toFixed(2),
  className = ""
}: { 
  value: number; 
  format?: (v: number) => string;
  className?: string;
}) => (
  <motion.span
    key={value}
    initial={{ opacity: 0, y: -20, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {format(value)}
  </motion.span>
));

// Stats Card Component
const StatsCard = memo(({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  delay,
  trend 
}: { 
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  delay: number;
  trend?: 'up' | 'down' | 'neutral';
}) => (
  <GlassCard delay={delay}>
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <h3 className="text-3xl font-bold text-white tracking-tight">
          <NumberAnimation 
            value={typeof value === 'number' ? value : 0} 
            format={(v) => typeof value === 'string' ? value : v.toLocaleString()}
          />
        </h3>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : 
             trend === 'down' ? <ArrowDownRight className="h-4 w-4" /> : null}
            {change}
          </div>
        )}
      </div>
      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
        <Icon className="h-6 w-6 text-emerald-400" />
      </div>
    </div>
  </GlassCard>
));

// Copy to Clipboard Component
const CopyButton = memo(({ text, className = "" }: { text: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={`h-8 w-8 p-0 hover:bg-white/5 ${className}`}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-zinc-400" />}
    </Button>
  );
});

// Enhanced Badge Component
const StatusBadge = memo(({ status, type = 'default' }: { status: string; type?: string }) => {
  const variants: { [key: string]: string } = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    closed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  const statusKey = status.toLowerCase();
  const variantClass = variants[statusKey] || variants['pending'];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${variantClass}`}>
      {status}
    </span>
  );
});

function DashboardContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [balance, setBalance] = useState<number>(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tradeSearchQuery, setTradeSearchQuery] = useState('');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  const [depositForm, setDepositForm] = useState({
    amount: '',
    proofFile: null as File | null,
  });

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    routingNumber: '',
  });

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [balanceRes, tradesRes, depositsRes, withdrawalsRes, ticketsRes] = await Promise.all([
        supabase.from('balances').select('amount').eq('user_id', user?.id).eq('currency', 'USD').maybeSingle(),
        supabase.from('trades').select('*').eq('user_id', user?.id).order('opened_at', { ascending: false }).limit(50),
        supabase.from('deposits').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('withdrawals').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('support_tickets').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
      ]);

      setBalance(balanceRes.data?.amount || 0);
      setTrades(tradesRes.data || []);
      setDeposits(depositsRes.data || []);
      setWithdrawals(withdrawalsRes.data || []);
      setTickets(ticketsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(depositForm.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid deposit amount');
      }

      let proofFilename = null;
      if (depositForm.proofFile) {
        const fileExt = depositForm.proofFile.name.split('.').pop();
        proofFilename = `${user?.id}_${Date.now()}.${fileExt}`;
      }

      const { error } = await supabase.from('deposits').insert({
        user_id: user?.id,
        amount,
        currency: 'USD',
        proof_filename: proofFilename,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: '✓ Deposit request submitted!',
        description: 'Your deposit will be verified within 24 hours.',
      });

      setDepositForm({ amount: '', proofFile: null });
      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit deposit request.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid withdrawal amount.',
        variant: 'destructive',
      });
      return;
    }
    if (amount > balance) {
      toast({
        title: 'Insufficient balance',
        description: 'You do not have enough funds to withdraw.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('withdrawals').insert({
        user_id: user?.id,
        amount,
        currency: 'USD',
        bank_details: {
          bankName: withdrawalForm.bankName,
          accountNumber: withdrawalForm.accountNumber,
          accountName: withdrawalForm.accountName,
          routingNumber: withdrawalForm.routingNumber,
        },
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: '✓ Withdrawal request submitted!',
        description: 'Your withdrawal will be processed within 1-3 business days.',
      });

      setWithdrawalForm({
        amount: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        routingNumber: '',
      });
      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit withdrawal request.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user?.id,
        subject: ticketForm.subject,
        message: ticketForm.message,
        priority: ticketForm.priority,
        status: 'open',
      });

      if (error) throw error;

      toast({
        title: '✓ Ticket submitted!',
        description: 'Our support team will respond shortly.',
      });

      setTicketForm({ subject: '', message: '', priority: 'medium' });
      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit ticket.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status === 'closed');
  const totalPL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const winningTrades = closedTrades.filter(t => (t.profit_loss || 0) > 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

  const filteredTrades = trades.filter(
    (trade) =>
      trade.symbol.toLowerCase().includes(tradeSearchQuery.toLowerCase()) ||
      trade.type.toLowerCase().includes(tradeSearchQuery.toLowerCase())
  );

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
      ticket.message.toLowerCase().includes(ticketSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_50%)]" style={{ zIndex: 0 }} />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.05),transparent_50%)]" style={{ zIndex: 0 }} />
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          zIndex: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-20">
        <Navbar />
        
        <div className="container mx-auto px-4 md:px-6 py-24 max-w-7xl">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <GlassCard hover={false}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Welcome back, {profile?.full_name || 'Trader'}
                  </h1>
                  <p className="text-zinc-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {format(new Date(), 'EEEE, MMMM do, yyyy')}
                  </p>
                </div>
                <Button
                  onClick={fetchDashboardData}
                  disabled={refreshing}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-white/5"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-1 backdrop-blur-xl">
              {[
                { value: 'overview', label: 'Overview', icon: Activity },
                { value: 'trades', label: 'Trades', icon: TrendingUp },
                { value: 'deposits', label: 'Deposits', icon: Upload },
                { value: 'withdrawals', label: 'Withdrawals', icon: Download },
                { value: 'support', label: 'Support', icon: MessageSquare },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="text-zinc-400 data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-900/20 rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Account Balance"
                  value={`$${balance.toLocaleString()}`}
                  change="+12.5% this month"
                  icon={Wallet}
                  delay={100}
                  trend="up"
                />
                <StatsCard
                  title="Open Positions"
                  value={openTrades.length}
                  change={`${openTrades.length} active`}
                  icon={Activity}
                  delay={200}
                  trend="neutral"
                />
                <StatsCard
                  title="Total P&L"
                  value={`${totalPL >= 0 ? '+' : ''}$${Math.abs(totalPL).toLocaleString()}`}
                  change={`${winRate.toFixed(1)}% win rate`}
                  icon={totalPL >= 0 ? TrendingUp : TrendingDown}
                  delay={300}
                  trend={totalPL >= 0 ? 'up' : 'down'}
                />
                <StatsCard
                  title="Win Rate"
                  value={`${winRate.toFixed(1)}%`}
                  change={`${winningTrades}/${closedTrades.length} trades`}
                  icon={Award}
                  delay={400}
                  trend={winRate >= 50 ? 'up' : 'down'}
                />
              </div>

              {/* Quick Actions */}
              <GlassCard delay={500}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setActiveTab('deposits')}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-auto py-4 flex-col gap-2"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">Deposit</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab('withdrawals')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-auto py-4 flex-col gap-2"
                  >
                    <Download className="h-5 w-5" />
                    <span className="text-sm">Withdraw</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab('trades')}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white h-auto py-4 flex-col gap-2"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-sm">View Trades</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab('support')}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-auto py-4 flex-col gap-2"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-sm">Support</span>
                  </Button>
                </div>
              </GlassCard>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard delay={600}>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Recent Trades
                  </h3>
                  {trades.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400 text-sm">No trades yet</p>
                      <p className="text-zinc-500 text-xs mt-1">Start trading to see your activity</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trades.slice(0, 5).map((trade, index) => (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl hover:bg-zinc-900/50 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${trade.type === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {trade.type === 'buy' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">
                                {trade.symbol}
                              </div>
                              <div className="text-xs text-zinc-400">
                                {trade.type.toUpperCase()} {trade.amount} @ ${trade.entry_price}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={trade.status} />
                            {trade.profit_loss !== undefined && (
                              <div className={`text-sm font-medium mt-1 ${trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trade.profit_loss >= 0 ? '+' : ''}${Math.abs(trade.profit_loss).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </GlassCard>

                <GlassCard delay={700}>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-emerald-400" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {[...deposits.slice(0, 2), ...withdrawals.slice(0, 2)].sort((a, b) => 
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    ).slice(0, 5).map((item, index) => {
                      const isDeposit = 'proof_filename' in item;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl hover:bg-zinc-900/50 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDeposit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {isDeposit ? <Upload className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm">
                                {isDeposit ? 'Deposit' : 'Withdrawal'}
                              </div>
                              <div className="text-xs text-zinc-400">
                                {format(new Date(item.created_at), 'MMM dd, HH:mm')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-white">${item.amount.toLocaleString()}</div>
                            <StatusBadge status={item.status} />
                          </div>
                        </motion.div>
                      );
                    })}
                    {deposits.length === 0 && withdrawals.length === 0 && (
                      <div className="text-center py-12">
                        <History className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400 text-sm">No recent activity</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            </TabsContent>

            {/* Trades Tab */}
            <TabsContent value="trades">
              <GlassCard>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-400" />
                      Trade History
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">{trades.length} total trades</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      placeholder="Search by symbol or type..."
                      value={tradeSearchQuery}
                      onChange={(e) => setTradeSearchQuery(e.target.value)}
                      className="pl-10 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50 rounded-xl"
                    />
                  </div>
                </div>
                
                {filteredTrades.length === 0 ? (
                  <div className="text-center py-16">
                    <TrendingUp className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400 text-lg font-medium">No trades found</p>
                    <p className="text-zinc-500 text-sm mt-2">
                      {tradeSearchQuery ? 'Try adjusting your search' : 'Start trading to see your history'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {filteredTrades.map((trade, index) => (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className="group"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl hover:bg-zinc-900/50 hover:border-emerald-500/20 transition-all duration-300">
                            <div className="flex items-start gap-4 flex-1 w-full sm:w-auto mb-3 sm:mb-0">
                              <div className={`p-3 rounded-xl ${trade.type === 'buy' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                {trade.type === 'buy' ? 
                                  <TrendingUp className="h-5 w-5 text-emerald-400" /> : 
                                  <TrendingDown className="h-5 w-5 text-red-400" />
                                }
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">
                                    {trade.symbol}
                                  </span>
                                  <StatusBadge status={trade.status} />
                                </div>
                                <div className="text-sm text-zinc-400 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${trade.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {trade.type.toUpperCase()}
                                    </span>
                                    <span>{trade.amount} units @ ${trade.entry_price.toFixed(2)}</span>
                                  </div>
                                  {trade.exit_price && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <ArrowDownRight className="h-3 w-3" />
                                      <span>Exit: ${trade.exit_price.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-xs">
                                    <Clock className="h-3 w-3" />
                                    <span>{format(new Date(trade.opened_at), 'MMM dd, yyyy HH:mm')}</span>
                                    {trade.closed_at && (
                                      <>
                                        <span>→</span>
                                        <span>{format(new Date(trade.closed_at), 'MMM dd, yyyy HH:mm')}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                              {trade.profit_loss !== undefined && (
                                <div className={`text-2xl font-bold ${trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {trade.profit_loss >= 0 ? '+' : ''}
                                  <NumberAnimation value={trade.profit_loss} format={(v) => `${v.toFixed(2)}`} />
                                </div>
                              )}
                              {trade.profit_loss !== undefined && trade.entry_price > 0 && (
                                <div className={`text-sm font-medium ${trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {((trade.profit_loss / (trade.entry_price * trade.amount)) * 100).toFixed(2)}%
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </GlassCard>
            </TabsContent>

            {/* Deposits Tab */}
            <TabsContent value="deposits">
              <div className="grid lg:grid-cols-2 gap-6">
                <GlassCard delay={100}>
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-emerald-400" />
                    Submit Deposit
                  </h3>
                  
                  <div className="mb-6 p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Bank Transfer Details
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBankDetails(!showBankDetails)}
                        className="h-8 hover:bg-white/5"
                      >
                        {showBankDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {showBankDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm space-y-2 text-zinc-300"
                      >
                        <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                          <span className="text-zinc-400">Bank Name:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">EquityEdge Bank</span>
                            <CopyButton text="EquityEdge Bank" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                          <span className="text-zinc-400">Account Name:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">EquityEdgeai Ltd.</span>
                            <CopyButton text="EquityEdgeai Ltd." />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                          <span className="text-zinc-400">Account Number:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">1234567890</span>
                            <CopyButton text="1234567890" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                          <span className="text-zinc-400">Routing Number:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">123456789</span>
                            <CopyButton text="123456789" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                          <span className="text-zinc-400">SWIFT Code:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">EQEDGEUS</span>
                            <CopyButton text="EQEDGEUS" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <form onSubmit={handleDeposit} className="space-y-5">
                    <div>
                      <Label htmlFor="depositAmount" className="text-zinc-300 mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Amount (USD)
                      </Label>
                      <Input
                        id="depositAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={depositForm.amount}
                        onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50 rounded-xl h-12 text-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="proofFile" className="text-zinc-300 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Upload Proof of Payment
                      </Label>
                      <Input
                        id="proofFile"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setDepositForm({ ...depositForm, proofFile: e.target.files?.[0] || null })}
                        className="bg-zinc-900/50 border-zinc-700/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:transition-all rounded-xl"
                      />
                      <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Upload bank receipt or transfer screenshot
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-12 rounded-xl text-base font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-5 w-5" />
                          Submit Deposit Request
                        </>
                      )}
                    </Button>
                  </form>
                </GlassCard>

                <GlassCard delay={200}>
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <History className="h-5 w-5 text-emerald-400" />
                    Deposit History
                  </h3>
                  {deposits.length === 0 ? (
                    <div className="text-center py-16">
                      <Upload className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400 text-lg font-medium">No deposits yet</p>
                      <p className="text-zinc-500 text-sm mt-2">Your deposit history will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      <AnimatePresence mode="popLayout">
                        {deposits.map((deposit, index) => (
                          <motion.div
                            key={deposit.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                            className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl hover:bg-zinc-900/50 hover:border-emerald-500/20 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                  <Upload className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div>
                                  <div className="font-bold text-white text-lg">
                                    $<NumberAnimation value={deposit.amount} format={(v) => v.toLocaleString()} />
                                  </div>
                                  <div className="text-xs text-zinc-400">{deposit.currency}</div>
                                </div>
                              </div>
                              <StatusBadge status={deposit.status} />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <Clock className="h-3 w-3" />
                              {format(new Date(deposit.created_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                            {deposit.proof_filename && (
                              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400 p-2 bg-black/20 rounded-lg">
                                <FileText className="h-3 w-3" />
                                <span className="truncate flex-1">{deposit.proof_filename}</span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </GlassCard>
              </div>
            </TabsContent>

            {/* Withdrawals Tab */}
            <TabsContent value="withdrawals">
              <div className="grid lg:grid-cols-2 gap-6">
                <GlassCard delay={100}>
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Download className="h-5 w-5 text-blue-400" />
                    Request Withdrawal
                  </h3>
                  
                  <div className="mb-6 p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">Available Balance</p>
                        <p className="text-2xl font-bold text-white mt-1">
                          $<NumberAnimation value={balance} format={(v) => v.toLocaleString()} />
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <Wallet className="h-6 w-6 text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleWithdrawal} className="space-y-5">
                    <div>
                      <Label htmlFor="withdrawAmount" className="text-zinc-300 mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Amount (USD)
                      </Label>
                      <Input
                        id="withdrawAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={balance}
                        placeholder="0.00"
                        value={withdrawalForm.amount}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-blue-500/50 rounded-xl h-12 text-lg"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bankName" className="text-zinc-300 mb-2">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="e.g., Bank of America"
                          value={withdrawalForm.bankName}
                          onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bankName: e.target.value })}
                          required
                          className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-blue-500/50 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountName" className="text-zinc-300 mb-2">Account Name</Label>
                        <Input
                          id="accountName"
                          placeholder="John Doe"
                          value={withdrawalForm.accountName}
                          onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountName: e.target.value })}
                          required
                          className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-blue-500/50 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="accountNumber" className="text-zinc-300 mb-2">Account Number</Label>
                        <Input
                          id="accountNumber"
                          placeholder="1234567890"
                          value={withdrawalForm.accountNumber}
                          onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountNumber: e.target.value })}
                          required
                          className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-blue-500/50 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="routingNumber" className="text-zinc-300 mb-2">Routing Number</Label>
                        <Input
                          id="routingNumber"
                          placeholder="123456789"
                          value={withdrawalForm.routingNumber}
                          onChange={(e) => setWithdrawalForm({ ...withdrawalForm, routingNumber: e.target.value })}
                          required
                          className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-blue-500/50 rounded-xl"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-12 rounded-xl text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-5 w-5" />
                          Request Withdrawal
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-zinc-400 text-center flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Processing time: 1-3 business days
                    </p>
                  </form>
                </GlassCard>

                <GlassCard delay={200}>
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-400" />
                    Withdrawal History
                  </h3>
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-16">
                      <Download className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400 text-lg font-medium">No withdrawals yet</p>
                      <p className="text-zinc-500 text-sm mt-2">Your withdrawal history will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      <AnimatePresence mode="popLayout">
                        {withdrawals.map((withdrawal, index) => (
                          <motion.div
                            key={withdrawal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                            className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl hover:bg-zinc-900/50 hover:border-blue-500/20 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                  <Download className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                  <div className="font-bold text-white text-lg">
                                    $<NumberAnimation value={withdrawal.amount} format={(v) => v.toLocaleString()} />
                                  </div>
                                  <div className="text-xs text-zinc-400">{withdrawal.currency}</div>
                                </div>
                              </div>
                              <StatusBadge status={withdrawal.status} />
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                <span className="text-zinc-400">Bank:</span>
                                <span className="text-white font-medium">{withdrawal.bank_details.bankName}</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                <span className="text-zinc-400">Account:</span>
                                <span className="text-white font-mono">****{withdrawal.bank_details.accountNumber.slice(-4)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-3">
                              <Clock className="h-3 w-3" />
                              {format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </GlassCard>
              </div>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support">
              <div className="grid lg:grid-cols-2 gap-6">
                <GlassCard delay={100}>
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-orange-400" />
                    Create Support Ticket
                  </h3>
                  <form onSubmit={handleTicket} className="space-y-5">
                    <div>
                      <Label htmlFor="ticketSubject" className="text-zinc-300 mb-2">Subject</Label>
                      <Input
                        id="ticketSubject"
                        placeholder="Brief description of your issue"
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-orange-500/50 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ticketPriority" className="text-zinc-300 mb-2">Priority Level</Label>
                      <Select
                        value={ticketForm.priority}
                        onValueChange={(value) => setTicketForm({ ...ticketForm, priority: value as 'low' | 'medium' | 'high' })}
                      >
                        <SelectTrigger id="ticketPriority" className="bg-zinc-900/50 border-zinc-700/50 text-white rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700/50 text-white">
                          <SelectItem value="low">🟢 Low - General inquiry</SelectItem>
                          <SelectItem value="medium">🟡 Medium - Account issue</SelectItem>
                          <SelectItem value="high">🔴 High - Urgent problem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ticketMessage" className="text-zinc-300 mb-2">Message</Label>
                      <Textarea
                        id="ticketMessage"
                        placeholder="Describe your issue in detail..."
                        rows={6}
                        value={ticketForm.message}
                        onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-orange-500/50 rounded-xl resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 rounded-xl text-base font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="mr-2 h-5 w-5" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-zinc-400 text-center flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Average response time: 2-4 hours
                    </p>
                  </form>
                </GlassCard>

                <GlassCard delay={200}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <History className="h-5 w-5 text-orange-400" />
                      Your Tickets
                    </h3>
                    <div className="relative w-48">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        placeholder="Search..."
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        className="pl-10 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-orange-500/50 rounded-xl h-9 text-sm"
                      />
                    </div>
                  </div>
                  {filteredTickets.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageSquare className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400 text-lg font-medium">
                        {ticketSearchQuery ? 'No tickets found' : 'No support tickets'}
                      </p>
                      <p className="text-zinc-500 text-sm mt-2">
                        {ticketSearchQuery ? 'Try adjusting your search' : 'Create a ticket to get help from our team'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      <AnimatePresence mode="popLayout">
                        {filteredTickets.map((ticket, index) => {
                          const priorityColors = {
                            low: 'bg-green-500/10 text-green-400 border-green-500/20',
                            medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                            high: 'bg-red-500/10 text-red-400 border-red-500/20',
                          };
                          
                          return (
                            <motion.div
                              key={ticket.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, delay: index * 0.03 }}
                              className="group"
                            >
                              <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl hover:bg-zinc-900/50 hover:border-orange-500/20 transition-all duration-300 cursor-pointer">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-bold text-white mb-1 group-hover:text-orange-400 transition-colors line-clamp-1">
                                      {ticket.subject}
                                    </h4>
                                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                                      {ticket.message}
                                    </p>
                                  </div>
                                  <StatusBadge status={ticket.status} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}
                                  </div>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[ticket.priority]}`}>
                                    {ticket.priority}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </GlassCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 10px;
          transition: background 0.2s;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .overscroll-none {
          overscroll-behavior: none;
        }
        
        /* Smooth transitions for all interactive elements */
        button, input, select, textarea {
          transition: all 0.2s ease;
        }
        
        /* Focus states */
        input:focus, textarea:focus, select:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        /* Glassmorphism enhancement */
        @supports (backdrop-filter: blur(10px)) {
          .backdrop-blur-xl {
            backdrop-filter: blur(24px);
          }
          .backdrop-blur-md {
            backdrop-filter: blur(12px);
          }
        }
        
        /* Gradient animations */
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          animation: gradient-shift 3s ease infinite;
          background-size: 200% 200%;
        }
        
        /* Loading skeleton */
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        /* Number counter animation */
        @keyframes count-up {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Hover glow effect */
        .hover-glow {
          position: relative;
          overflow: hidden;
        }
        
        .hover-glow::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .hover-glow:hover::before {
          width: 300px;
          height: 300px;
        }
        
        /* Enhanced badge styles */
        .badge-glow {
          box-shadow: 0 0 20px currentColor;
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        /* Responsive utilities */
        @media (max-width: 768px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        
        /* Performance optimization */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Improve text rendering */
        body {
          text-rendering: optimizeLegibility;
        }
        
        /* Skeleton loader */
        .skeleton {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 25%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        /* Card hover effects */
        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.1);
        }
        
        /* Status indicator pulse */
        @keyframes status-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        
        .status-indicator {
          animation: status-pulse 2s ease-in-out infinite;
        }
        
        /* Success animation */
        @keyframes success-check {
          0% {
            transform: scale(0) rotate(0deg);
          }
          50% {
            transform: scale(1.2) rotate(180deg);
          }
          100% {
            transform: scale(1) rotate(360deg);
          }
        }
        
        .success-check {
          animation: success-check 0.5s ease;
        }
        
        /* Fade slide in animation */
        @keyframes fade-slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-slide-in {
          animation: fade-slide-in 0.4s ease;
        }
        
        /* Enhanced focus ring */
        .focus-ring:focus {
          outline: none;
          box-shadow: 
            0 0 0 3px rgba(16, 185, 129, 0.2),
            0 0 0 1px rgba(16, 185, 129, 0.4);
        }
        
        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Border gradient animation */
        @keyframes border-flow {
          0%, 100% {
            border-color: rgba(16, 185, 129, 0.3);
          }
          50% {
            border-color: rgba(16, 185, 129, 0.6);
          }
        }
        
        .border-flow {
          animation: border-flow 2s ease-in-out infinite;
        }
        
        /* Enhanced button press effect */
        button:active {
          transform: scale(0.98);
        }
        
        /* Smooth color transitions */
        * {
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
        
        /* Remove transition from animations */
        *[class*="animate-"] {
          transition: none !important;
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}