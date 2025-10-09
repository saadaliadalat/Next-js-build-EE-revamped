"use client";

import { useEffect, useState, Suspense, memo } from 'react';
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
import { Upload, Wallet, History, Download, MessageSquare, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';



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

// GlassCard component
const GlassCard = memo(({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: delay / 1000 }}
    className={`relative group ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent rounded-xl backdrop-blur-md border border-white/10" />
    <div className="relative p-4 md:p-6 rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-white/5">
      {children}
    </div>
  </motion.div>
));

// NumberAnimation component
const NumberAnimation = memo(({ value, format = (v: number) => v.toFixed(2) }: { value: number; format?: (v: number) => string }) => (
  <motion.span
    key={value}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {format(value)}
  </motion.span>
));

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
  const [tradeSearchQuery, setTradeSearchQuery] = useState('');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');

  const defaultTab = searchParams.get('tab') || 'overview';

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
      const [balanceRes, tradesRes, depositsRes, withdrawalsRes, ticketsRes] = await Promise.all([
        supabase.from('balances').select('amount').eq('user_id', user?.id).eq('currency', 'USD').maybeSingle(),
        supabase.from('trades').select('*').eq('user_id', user?.id).order('opened_at', { ascending: false }).limit(10),
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
        // Note: Actual file upload to Supabase Storage would go here
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
        title: 'Deposit request submitted!',
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
        title: 'Withdrawal request submitted!',
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
        title: 'Ticket submitted!',
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
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status === 'closed');
  const totalPL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

  // Filter trades and tickets
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
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_70%)]" style={{ zIndex: 0 }} />
      <div
        className="fixed inset-0 opacity-10"
        style={{
          zIndex: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-20">
        <Navbar />
        <div className="container mx-auto px-4 md:px-6 py-24 max-w-7xl">
          <GlassCard className="mb-8">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400">Welcome back, {profile?.full_name || 'User'}</p>
          </GlassCard>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
              {['overview', 'trades', 'deposits', 'withdrawals', 'support'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="text-zinc-400 data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-900/20"
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-3 gap-6">
                <GlassCard delay={100}>
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium text-zinc-400">Account Balance</h3>
                    <Wallet className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    $<NumberAnimation value={balance} format={(v) => v.toLocaleString()} />
                  </div>
                  <p className="text-xs text-zinc-400">Available for trading</p>
                </GlassCard>

                <GlassCard delay={200}>
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium text-zinc-400">Open Positions</h3>
                    <TrendingUp className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    <NumberAnimation value={openTrades.length} format={(v) => v.toString()} />
                  </div>
                  <p className="text-xs text-zinc-400">Active trades</p>
                </GlassCard>

                <GlassCard delay={300}>
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium text-zinc-400">Total P&L</h3>
                    <TrendingDown className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalPL >= 0 ? '+' : ''}<NumberAnimation value={totalPL} />
                  </div>
                  <p className="text-xs text-zinc-400">All time</p>
                </GlassCard>
              </div>

              <GlassCard className="mt-6" delay={400}>
                <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>
                {trades.length === 0 ? (
                  <p className="text-center py-8 text-zinc-400">No trades yet</p>
                ) : (
                  <div className="space-y-2">
                    {trades.slice(0, 5).map((trade, index) => (
                      <motion.div
                        key={trade.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border border-zinc-800/50 rounded-lg hover:bg-zinc-900/30"
                      >
                        <div>
                          <div className="font-semibold text-white">{trade.symbol}</div>
                          <div className="text-sm text-zinc-400">
                            {trade.type.toUpperCase()} {trade.amount} @ ${trade.entry_price}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                            {trade.status}
                          </Badge>
                          {trade.profit_loss !== undefined && (
                            <div className={`text-sm ${trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {trade.profit_loss >= 0 ? '+' : ''}<NumberAnimation value={trade.profit_loss ?? 0} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </TabsContent>

            <TabsContent value="trades">
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Trade History</h3>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                    <Input
                      placeholder="Search trades..."
                      value={tradeSearchQuery}
                      onChange={(e) => setTradeSearchQuery(e.target.value)}
                      className="pl-10 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50"
                    />
                  </div>
                </div>
                {filteredTrades.length === 0 ? (
                  <p className="text-center py-8 text-zinc-400">No trades found</p>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredTrades.map((trade, index) => (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border border-zinc-800/50 rounded-lg hover:bg-zinc-900/30"
                        >
                          <div>
                            <div className="font-semibold text-white">{trade.symbol}</div>
                            <div className="text-sm text-zinc-400">
                              {trade.type.toUpperCase()} {trade.amount} @ ${trade.entry_price}
                              {trade.exit_price && ` → $${trade.exit_price}`}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {format(new Date(trade.opened_at), 'MMM dd, yyyy HH:mm')}
                              {trade.closed_at && ` - ${format(new Date(trade.closed_at), 'MMM dd, yyyy HH:mm')}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                              {trade.status}
                            </Badge>
                            {trade.profit_loss !== undefined && (
                              <div className={`text-lg font-bold ${trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trade.profit_loss >= 0 ? '+' : ''}<NumberAnimation value={trade.profit_loss ?? 0} />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </GlassCard>
            </TabsContent>

            <TabsContent value="deposits">
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard delay={100}>
                  <h3 className="text-lg font-semibold text-white mb-4">Submit Deposit</h3>
                  <div className="mb-6 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg space-y-2">
                    <h4 className="font-semibold text-white">Bank Transfer Details</h4>
                    <div className="text-sm space-y-1 text-zinc-400">
                      <p><strong>Bank Name:</strong> EquityEdge Bank</p>
                      <p><strong>Account Name:</strong> EquityEdgeai Ltd.</p>
                      <p><strong>Account Number:</strong> 1234567890</p>
                      <p><strong>Routing Number:</strong> 123456789</p>
                      <p><strong>SWIFT:</strong> EQEDGEUS</p>
                    </div>
                  </div>
                  <form onSubmit={handleDeposit} className="space-y-4">
                    <div>
                      <Label htmlFor="depositAmount" className="text-zinc-400">Amount (USD)</Label>
                      <Input
                        id="depositAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={depositForm.amount}
                        onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="proofFile" className="text-zinc-400">Upload Proof of Payment</Label>
                      <Input
                        id="proofFile"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setDepositForm({ ...depositForm, proofFile: e.target.files?.[0] || null })}
                        className="bg-zinc-900/50 border-zinc-700/50 text-white"
                      />
                      <p className="text-xs text-zinc-400 mt-1">Upload receipt or screenshot</p>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {loading ? 'Submitting...' : 'Submit Deposit'}
                    </Button>
                  </form>
                </GlassCard>

                <GlassCard delay={200}>
                  <h3 className="text-lg font-semibold text-white mb-4">Deposit History</h3>
                  {deposits.length === 0 ? (
                    <p className="text-center py-8 text-zinc-400">No deposits yet</p>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {deposits.map((deposit, index) => (
                          <motion.div
                            key={deposit.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="p-4 border border-zinc-800/50 rounded-lg hover:bg-zinc-900/30"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-semibold text-white">
                                $<NumberAnimation value={deposit.amount} format={(v) => v.toLocaleString()} />
                              </div>
                              <Badge
                                variant={
                                  deposit.status === 'approved'
                                    ? 'default'
                                    : deposit.status === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {deposit.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-zinc-400">
                              {format(new Date(deposit.created_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </GlassCard>
              </div>
            </TabsContent>

            <TabsContent value="withdrawals">
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard delay={100}>
                  <h3 className="text-lg font-semibold text-white mb-4">Request Withdrawal</h3>
                  <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                    <p className="text-sm text-zinc-400">
                      Available Balance: <strong>$<NumberAnimation value={balance} format={(v) => v.toLocaleString()} /></strong>
                    </p>
                  </div>
                  <form onSubmit={handleWithdrawal} className="space-y-4">
                    <div>
                      <Label htmlFor="withdrawAmount" className="text-zinc-400">Amount (USD)</Label>
                      <Input
                        id="withdrawAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={withdrawalForm.amount}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankName" className="text-zinc-400">Bank Name</Label>
                      <Input
                        id="bankName"
                        placeholder="Bank of America"
                        value={withdrawalForm.bankName}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bankName: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountName" className="text-zinc-400">Account Name</Label>
                      <Input
                        id="accountName"
                        placeholder="John Doe"
                        value={withdrawalForm.accountName}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountName: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber" className="text-zinc-400">Account Number</Label>
                      <Input
                        id="accountNumber"
                        placeholder="1234567890"
                        value={withdrawalForm.accountNumber}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountNumber: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="routingNumber" className="text-zinc-400">Routing Number</Label>
                      <Input
                        id="routingNumber"
                        placeholder="123456789"
                        value={withdrawalForm.routingNumber}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, routingNumber: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {loading ? 'Submitting...' : 'Request Withdrawal'}
                    </Button>
                  </form>
                </GlassCard>

                <GlassCard delay={200}>
                  <h3 className="text-lg font-semibold text-white mb-4">Withdrawal History</h3>
                  {withdrawals.length === 0 ? (
                    <p className="text-center py-8 text-zinc-400">No withdrawals yet</p>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {withdrawals.map((withdrawal, index) => (
                          <motion.div
                            key={withdrawal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="p-4 border border-zinc-800/50 rounded-lg hover:bg-zinc-900/30"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-semibold text-white">
                                $<NumberAnimation value={withdrawal.amount} format={(v) => v.toLocaleString()} />
                              </div>
                              <Badge
                                variant={
                                  withdrawal.status === 'approved'
                                    ? 'default'
                                    : withdrawal.status === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {withdrawal.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-zinc-400">
                              {withdrawal.bank_details.bankName} - {withdrawal.bank_details.accountNumber}
                            </div>
                            <div className="text-xs text-zinc-400">
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

            <TabsContent value="support">
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard delay={100}>
                  <h3 className="text-lg font-semibold text-white mb-4">Create Support Ticket</h3>
                  <form onSubmit={handleTicket} className="space-y-4">
                    <div>
                      <Label htmlFor="ticketSubject" className="text-zinc-400">Subject</Label>
                      <Input
                        id="ticketSubject"
                        placeholder="Brief description"
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ticketPriority" className="text-zinc-400">Priority</Label>
                      <Select
                        value={ticketForm.priority}
                        onValueChange={(value) => setTicketForm({ ...ticketForm, priority: value as 'low' | 'medium' | 'high' })}
                      >
                        <SelectTrigger id="ticketPriority" className="bg-zinc-900/50 border-zinc-700/50 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700/50 text-white">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ticketMessage" className="text-zinc-400">Message</Label>
                      <Textarea
                        id="ticketMessage"
                        placeholder="Describe your issue..."
                        rows={6}
                        value={ticketForm.message}
                        onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                        required
                        className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {loading ? 'Submitting...' : 'Submit Ticket'}
                    </Button>
                  </form>
                </GlassCard>

                <GlassCard delay={200}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Your Tickets</h3>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                      <Input
                        placeholder="Search tickets..."
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        className="pl-10 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                  {filteredTickets.length === 0 ? (
                    <p className="text-center py-8 text-zinc-400">No tickets found</p>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {filteredTickets.map((ticket, index) => (
                          <motion.div
                            key={ticket.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="p-4 border border-zinc-800/50 rounded-lg hover:bg-zinc-900/30"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-semibold text-white">{ticket.subject}</div>
                              <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                                {ticket.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-zinc-400 mb-2">
                              {ticket.message.substring(0, 100)}...
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-zinc-400">
                                {format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}
                              </div>
                              <Badge variant="outline" className="text-zinc-400 border-zinc-700/50">
                                {ticket.priority}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
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
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}