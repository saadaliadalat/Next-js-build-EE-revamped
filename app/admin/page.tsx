'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Users, Wallet, Download, MessageSquare, Check, X, TrendingUp, Shield, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
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
);

const LightCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: delay / 1000 }}
    className={`relative group ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent rounded-xl backdrop-blur-xl border border-white/20" />
    <div className="relative bg-transparent p-4 md:p-6 rounded-xl transition-all duration-300 group-hover:border-white/30 group-hover:-translate-y-0.5">
      {children}
    </div>
  </motion.div>
);

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketReplies, setTicketReplies] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');

  // Step 1: Wait for auth to load
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Step 2: Check permissions after auth loads
  useEffect(() => {
    // Still loading auth
    if (authLoading) {
      return;
    }

    // Not logged in
    if (!user) {
      toast({
        title: 'Access denied',
        description: 'You must be logged in.',
        variant: 'destructive',
      });
      router.push('/auth/login');
      return;
    }

    // Profile not loaded yet
    if (!profile) {
      return;
    }

    // Not admin
    if (!profile.is_admin) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      router.push('/dashboard');
      return;
    }

    // If we reach here: user is authenticated and IS admin
  }, [authLoading, user, profile, router, toast]);

  // Step 3: Fetch data only if user is admin
  useEffect(() => {
    if (user && profile?.is_admin) {
      fetchAdminData();
    }
  }, [user, profile]);

  const fetchAdminData = async () => {
    try {
      const [usersRes, depositsRes, withdrawalsRes, ticketsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, is_admin, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('deposits')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('withdrawals')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('support_tickets')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false }),
      ]);

      setUsers(usersRes.data || []);
      setDeposits(depositsRes.data || []);
      setWithdrawals(withdrawalsRes.data || []);
      setTickets(ticketsRes.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data.',
        variant: 'destructive',
      });
    }
  };

  const handleVerifyDeposit = async (depositId: string, status: 'approved' | 'rejected', userId: string, amount: number) => {
    setLoading(true);

    try {
      const { error: depositError } = await supabase
        .from('deposits')
        .update({
          status,
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
        })
        .eq('id', depositId);

      if (depositError) throw depositError;

      if (status === 'approved') {
        const { data: balanceData } = await supabase
          .from('balances')
          .select('amount')
          .eq('user_id', userId)
          .eq('currency', 'USD')
          .maybeSingle();

        const currentBalance = balanceData?.amount || 0;
        const newBalance = currentBalance + amount;

        const { error: balanceError } = await supabase
          .from('balances')
          .update({ amount: newBalance })
          .eq('user_id', userId)
          .eq('currency', 'USD');

        if (balanceError) throw balanceError;
      }

      toast({
        title: 'Success',
        description: `Deposit ${status}.`,
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process deposit.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (
    withdrawalId: string,
    status: 'approved' | 'rejected',
    userId: string,
    amount: number
  ) => {
    setLoading(true);

    try {
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .update({
          status,
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
        })
        .eq('id', withdrawalId);

      if (withdrawalError) throw withdrawalError;

      if (status === 'approved') {
        const { data: balanceData } = await supabase
          .from('balances')
          .select('amount')
          .eq('user_id', userId)
          .eq('currency', 'USD')
          .maybeSingle();

        const currentBalance = balanceData?.amount || 0;
        const newBalance = currentBalance - amount;

        const { error: balanceError } = await supabase
          .from('balances')
          .update({ amount: newBalance })
          .eq('user_id', userId)
          .eq('currency', 'USD');

        if (balanceError) throw balanceError;
      }

      toast({
        title: 'Success',
        description: `Withdrawal ${status}.`,
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process withdrawal.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticket: any) => {
    setSelectedTicket(ticket);

    try {
      const { data, error } = await supabase
        .from('ticket_replies')
        .select('*, profiles(full_name)')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTicketReplies(data || []);
    } catch (error) {
      console.error('Error fetching ticket replies:', error);
    }
  };

  const handleReplyTicket = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('ticket_replies').insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: replyMessage,
        is_admin: true,
      });

      if (error) throw error;

      toast({
        title: 'Reply sent',
        description: 'Your reply has been sent to the user.',
      });

      setReplyMessage('');
      handleViewTicket(selectedTicket);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reply.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: 'Ticket closed',
        description: 'The ticket has been marked as closed.',
      });

      fetchAdminData();
      setSelectedTicket(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close ticket.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 flex items-center justify-center text-zinc-400">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return null;
  }

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const openTickets = tickets.filter((t) => t.status === 'open');

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_70%)]" style={{ zIndex: 1 }} />
      <div className="fixed inset-0 opacity-10" style={{ zIndex: 1, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10">
        <Navbar />
        <div className="container mx-auto px-4 md:px-6 py-24 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="inline-block mb-4 px-4 py-1.5 bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-full">
              <span className="text-zinc-400 text-sm font-medium tracking-wide uppercase flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                Admin Dashboard
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Admin Panel</h1>
            <p className="text-zinc-400">Manage users, deposits, withdrawals, and support tickets</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <LightCard delay={0}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-400 mb-2">Total Users</div>
                  <div className="text-3xl font-bold text-white">{users.length}</div>
                </div>
                <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/40">
                  <Users className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
                </div>
              </div>
            </LightCard>

            <LightCard delay={50}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-400 mb-2">Pending Deposits</div>
                  <div className="text-3xl font-bold text-white">{pendingDeposits.length}</div>
                </div>
                <div className="p-3 bg-emerald-800/30 rounded-lg border border-emerald-700/40">
                  <Wallet className="h-6 w-6 text-emerald-400" strokeWidth={1.5} />
                </div>
              </div>
            </LightCard>

            <LightCard delay={100}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-400 mb-2">Pending Withdrawals</div>
                  <div className="text-3xl font-bold text-white">{pendingWithdrawals.length}</div>
                </div>
                <div className="p-3 bg-blue-800/30 rounded-lg border border-blue-700/40">
                  <Download className="h-6 w-6 text-blue-400" strokeWidth={1.5} />
                </div>
              </div>
            </LightCard>

            <LightCard delay={150}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-400 mb-2">Open Tickets</div>
                  <div className="text-3xl font-bold text-white">{openTickets.length}</div>
                </div>
                <div className="p-3 bg-orange-800/30 rounded-lg border border-orange-700/40">
                  <MessageSquare className="h-6 w-6 text-orange-400" strokeWidth={1.5} />
                </div>
              </div>
            </LightCard>
          </div>

          {/* Tabs */}
          <GlassCard>
            <Tabs defaultValue="deposits" className="space-y-6">
              <TabsList className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
                <TabsTrigger value="deposits" className="text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800/50">
                  Deposits
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800/50">
                  Withdrawals
                </TabsTrigger>
                <TabsTrigger value="tickets" className="text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800/50">
                  Support Tickets
                </TabsTrigger>
                <TabsTrigger value="users" className="text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800/50">
                  Users
                </TabsTrigger>
              </TabsList>

              {/* Deposits Tab */}
              <TabsContent value="deposits">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white mb-4">Deposit Requests</h3>
                  {deposits.length === 0 ? (
                    <p className="text-center py-8 text-zinc-400">No deposits yet</p>
                  ) : (
                    <AnimatePresence>
                      {deposits.map((deposit, i) => (
                        <motion.div
                          key={deposit.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 border border-white/10 rounded-lg hover:border-white/20 bg-white/[0.02] transition-all duration-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-white">{deposit.profiles?.full_name}</div>
                              <div className="text-sm text-zinc-400">
                                Amount: ${deposit.amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-zinc-500 mt-1">
                                {format(new Date(deposit.created_at), 'MMM dd, yyyy HH:mm')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
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
                              {deposit.status === 'pending' && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleVerifyDeposit(deposit.id, 'approved', deposit.user_id, deposit.amount)}
                                    disabled={loading}
                                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg border border-emerald-500/30 text-emerald-400 transition-all duration-200"
                                  >
                                    <Check className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleVerifyDeposit(deposit.id, 'rejected', deposit.user_id, deposit.amount)}
                                    disabled={loading}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 text-red-400 transition-all duration-200"
                                  >
                                    <X className="h-4 w-4" />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </TabsContent>

              {/* Withdrawals Tab */}
              <TabsContent value="withdrawals">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white mb-4">Withdrawal Requests</h3>
                  {withdrawals.length === 0 ? (
                    <p className="text-center py-8 text-zinc-400">No withdrawals yet</p>
                  ) : (
                    <AnimatePresence>
                      {withdrawals.map((withdrawal, i) => (
                        <motion.div
                          key={withdrawal.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 border border-white/10 rounded-lg hover:border-white/20 bg-white/[0.02] transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-semibold text-white">{withdrawal.profiles?.full_name}</div>
                              <div className="text-sm text-zinc-400">
                                Amount: ${withdrawal.amount.toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
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
                              {withdrawal.status === 'pending' && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      handleProcessWithdrawal(withdrawal.id, 'approved', withdrawal.user_id, withdrawal.amount)
                                    }
                                    disabled={loading}
                                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg border border-emerald-500/30 text-emerald-400 transition-all duration-200"
                                  >
                                    <Check className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      handleProcessWithdrawal(withdrawal.id, 'rejected', withdrawal.user_id, withdrawal.amount)
                                    }
                                    disabled={loading}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 text-red-400 transition-all duration-200"
                                  >
                                    <X className="h-4 w-4" />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-zinc-400 space-y-1 p-2 bg-zinc-900/30 rounded border border-zinc-800/50">
                            <div>Bank: {withdrawal.bank_details.bankName}</div>
                            <div>Account: {withdrawal.bank_details.accountNumber}</div>
                            <div>Name: {withdrawal.bank_details.accountName}</div>
                            <div>Routing: {withdrawal.bank_details.routingNumber}</div>
                          </div>
                          <div className="text-xs text-zinc-500 mt-2">
                            {format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </TabsContent>

              {/* Tickets Tab */}
              <TabsContent value="tickets">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white mb-4">Support Tickets</h3>
                  {tickets.length === 0 ? (
                    <p className="text-center py-8 text-zinc-400">No tickets yet</p>
                  ) : (
                    <AnimatePresence>
                      {tickets.map((ticket, i) => (
                        <motion.div
                          key={ticket.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                onClick={() => handleViewTicket(ticket)}
                                className="w-full text-left p-4 border border-white/10 rounded-lg hover:border-white/20 bg-white/[0.02] transition-all duration-300 group"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                      {ticket.subject}
                                    </div>
                                    <div className="text-sm text-zinc-400">{ticket.profiles?.full_name}</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                                      {ticket.status}
                                    </Badge>
                                    <Badge variant="outline" className="text-zinc-400 border-zinc-700/50">
                                      {ticket.priority}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-sm text-zinc-500 truncate">
                                  {ticket.message.substring(0, 100)}...
                                </div>
                                <div className="text-xs text-zinc-600 mt-2">
                                  {format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}
                                </div>
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-950 border border-white/10">
                              <DialogHeader>
                                <DialogTitle className="text-white">{selectedTicket?.subject}</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                  From: {selectedTicket?.profiles?.full_name} |{' '}
                                  {selectedTicket && format(new Date(selectedTicket.created_at), 'MMM dd, yyyy HH:mm')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-lg">
                                  <p className="text-sm text-zinc-300">{selectedTicket?.message}</p>
                                </div>

                                {ticketReplies.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-white text-sm">Replies</h4>
                                    {ticketReplies.map((reply) => (
                                      <motion.div
                                        key={reply.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-3 rounded-lg border ${
                                          reply.is_admin
                                            ? 'bg-emerald-900/20 ml-4 border-emerald-500/20'
                                            : 'bg-white/[0.02] mr-4 border-white/10'
                                        }`}
                                      >
                                        <div className="text-xs text-zinc-400 mb-1">
                                          {reply.profiles?.full_name} {reply.is_admin && '(Admin)'} -{' '}
                                          {format(new Date(reply.created_at), 'MMM dd, HH:mm')}
                                        </div>
                                        <p className="text-sm text-zinc-300">{reply.message}</p>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}

                                {selectedTicket?.status === 'open' && (
                                  <div className="space-y-4 border-t border-white/10 pt-4">
                                    <div>
                                      <label className="text-sm font-medium text-zinc-400 block mb-2">Reply Message</label>
                                      <Textarea
                                        placeholder="Type your reply..."
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        rows={4}
                                        className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={handleReplyTicket}
                                        disabled={loading || !replyMessage.trim()}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                      >
                                        Send Reply
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleCloseTicket(selectedTicket.id)}
                                        disabled={loading}
                                        className="border-white/20 text-zinc-300 hover:bg-white/5"
                                      >
                                        Close Ticket
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white mb-4">Platform Users</h3>
                  {users.length === 0 ? (
                    <p className="text-center py-8 text-zinc-400">No users yet</p>
                  ) : (
                    <AnimatePresence>
                      {users.map((usr, i) => (
                        <motion.div
                          key={usr.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 border border-white/10 rounded-lg hover:border-white/20 bg-white/[0.02] transition-all duration-300"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-white">{usr.full_name}</div>
                              <div className="text-sm text-zinc-400 font-mono">{usr.id}</div>
                              <div className="text-xs text-zinc-500 mt-1">
                                Joined: {format(new Date(usr.created_at), 'MMM dd, yyyy')}
                              </div>
                            </div>
                            <div>
                              {usr.is_admin && (
                                <Badge variant="default" className="bg-emerald-600">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}