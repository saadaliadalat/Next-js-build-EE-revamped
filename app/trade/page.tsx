"use client";

import { useEffect, useState, useMemo, memo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { TradingViewWidget } from '@/components/TradingViewWidget';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { marketsData, Market } from '@/lib/markets-data';
import { Search, TrendingUp, TrendingDown, X } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';

type Trade = {
  id: string;
  user_id: string;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  entry_price: number;
  status: 'open' | 'closed';
  profit_loss?: number;
  opened_at: string;
};

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

const MarketSelector = memo(({ selectedSymbol, setSelectedSymbol, searchQuery, setSearchQuery }: {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) => (
  <GlassCard className="h-full bg-zinc-900/80 border-zinc-800/50 min-h-[500px]">
    <div className="flex items-center justify-between mb-4 p-2 bg-zinc-800/30 rounded-t-lg">
      <h3 className="text-lg font-semibold text-white">Markets</h3>
      <input
        type="text"
        placeholder="Search markets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-28 bg-zinc-900/50 border border-zinc-700/50 rounded-md px-3 py-1 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
      />
    </div>
    <div className="space-y-1 max-h-[600px] overflow-y-auto hide-scrollbar p-1">
      {marketsData
        .filter(m => m.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || m.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((market, i) => (
          <motion.button
            key={market.symbol}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.02 }}
            onClick={() => setSelectedSymbol(market.symbol)}
            className={`w-full text-left p-2 rounded-lg border transition-all duration-200 ${
              selectedSymbol === market.symbol
                ? 'border-emerald-500/50 bg-emerald-900/20'
                : 'border-zinc-800/50 hover:border-emerald-500/30 hover:bg-zinc-900/30'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-white">{market.symbol}</span>
                <div className="text-xs text-zinc-400 truncate">{market.name}</div>
              </div>
              <div className="flex items-center gap-2">
                {market.category === 'crypto' && market.sparkline && (
                  <div className="w-16 h-6">
                    <ResponsiveContainer>
                      <LineChart data={market.sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Line
                          type="monotone"
                          dataKey="close"
                          stroke={market.change24h >= 0 ? '#10b981' : '#ef4444'}
                          dot={false}
                          strokeWidth={1}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <span className={market.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {market.change24h >= 0 ? '+' : ''}<NumberAnimation value={market.change24h} />
                </span>
              </div>
            </div>
          </motion.button>
        ))}
    </div>
  </GlassCard>
));

function TradeContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradePercentage, setTradePercentage] = useState<number>(0);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [markets, setMarkets] = useState<Market[]>(marketsData);
  const [loading, setLoading] = useState(false);
  const [isMarketListOpen, setIsMarketListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const portfolioValue = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      const market = markets.find(m => m.symbol === trade.symbol);
      const currentPrice = market?.price || 0;
      const value = trade.type === 'buy' ? trade.amount * currentPrice : trade.amount * trade.entry_price;
      return acc + value;
    }, balance);
  }, [openTrades, balance, markets]);

  const todaysPL = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      const market = markets.find(m => m.symbol === trade.symbol);
      const currentPrice = market?.price || 0;
      const pl = trade.type === 'buy'
        ? (currentPrice - trade.entry_price) * trade.amount
        : (trade.entry_price - currentPrice) * trade.amount;
      return acc + pl;
    }, 0);
  }, [openTrades, markets]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const symbol = searchParams.get('symbol');
    if (symbol && marketsData.some(m => m.symbol === symbol)) {
      setSelectedSymbol(symbol);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchOpenTrades();
    }
  }, [user]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const klinePromises = marketsData
          .filter(market => market.category === 'crypto')
          .map(async (market) => {
            const symbol = market.symbol.replace('/', '');
            const klineRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&limit=288`);
            const klineData = await klineRes.json();
            return {
              symbol: market.symbol,
              data: klineData.map((d: any[]) => ({ time: d[0], close: parseFloat(d[4]) })),
            };
          });
        
        const klineResults = await Promise.all(klinePromises);
        setMarkets(marketsData.map(market => ({
          ...market,
          sparkline: klineResults.find(k => k.symbol === market.symbol)?.data,
        })));
      } catch (error) {
        console.error('Error fetching sparklines:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    
    ws.onopen = () => console.log('WebSocket connected');
    
    ws.onmessage = (event) => {
      const tickers = JSON.parse(event.data);
      if (!Array.isArray(tickers)) return;
      
      setMarkets((prev) =>
        prev.map((market) => {
          if (market.category !== 'crypto') return market;
          const ticker = tickers.find((t: any) => t.s === market.symbol.replace('/', ''));
          if (ticker) {
            return {
              ...market,
              price: parseFloat(ticker.c),
              change24h: parseFloat(ticker.P),
            };
          }
          return market;
        })
      );
    };
    
    ws.onclose = () => console.log('WebSocket closed');
    
    return () => ws.close();
  }, []);

  const fetchBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('currency', 'USD')
        .maybeSingle();

      if (error) throw error;
      setBalance(data?.amount || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchOpenTrades = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'open')
        .order('opened_at', { ascending: false });

      if (error) throw error;
      setOpenTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!user || !tradeAmount || parseFloat(tradeAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid trade amount.',
        variant: 'destructive',
      });
      return;
    }
    if (!marketsData.some(m => m.symbol === selectedSymbol)) {
      toast({
        title: 'Invalid market',
        description: 'Selected market is not available.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const market = markets.find((m) => m.symbol === selectedSymbol);
      if (!market) throw new Error('Market not found');

      const amount = parseFloat(tradeAmount);
      const tradeValue = amount * market.price;

      if (tradeValue > balance && type === 'buy') {
        toast({
          title: 'Insufficient balance',
          description: 'You do not have enough funds for this trade.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { error: tradeError } = await supabase.from('trades').insert({
        user_id: user.id,
        symbol: selectedSymbol,
        type,
        amount,
        entry_price: market.price,
        status: 'open',
      });

      if (tradeError) throw tradeError;

      const newBalance = type === 'buy' ? balance - tradeValue : balance + tradeValue;
      const { error: balanceError } = await supabase
        .from('balances')
        .update({ amount: newBalance })
        .eq('user_id', user.id)
        .eq('currency', 'USD');

      if (balanceError) throw balanceError;

      toast({
        title: 'Trade opened!',
        description: `Successfully ${type === 'buy' ? 'bought' : 'sold'} ${amount} ${selectedSymbol}`,
      });

      setTradeAmount('');
      setTradePercentage(0);
      fetchBalance();
      fetchOpenTrades();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to execute trade. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTrade = async (tradeId: string, trade: Trade) => {
    setLoading(true);

    try {
      const market = markets.find((m) => m.symbol === trade.symbol);
      if (!market) throw new Error('Market not found');

      const currentPrice = market.price;
      const profitLoss =
        trade.type === 'buy'
          ? (currentPrice - trade.entry_price) * trade.amount
          : (trade.entry_price - currentPrice) * trade.amount;

      const { error: tradeError } = await supabase
        .from('trades')
        .update({
          status: 'closed',
          exit_price: currentPrice,
          profit_loss: profitLoss,
          closed_at: new Date().toISOString(),
        })
        .eq('id', tradeId);

      if (tradeError) throw tradeError;

      const tradeValue = trade.amount * currentPrice;
      const newBalance =
        trade.type === 'buy'
          ? balance + tradeValue
          : balance - tradeValue;

      const { error: balanceError } = await supabase
        .from('balances')
        .update({ amount: newBalance })
        .eq('user_id', user?.id)
        .eq('currency', 'USD');

      if (balanceError) throw balanceError;

      toast({
        title: 'Trade closed!',
        description: `Profit/Loss: $${profitLoss.toFixed(2)}`,
      });

      fetchBalance();
      fetchOpenTrades();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close trade. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageSelect = (percentage: number) => {
    const market = markets.find((m) => m.symbol === selectedSymbol);
    if (!market) return;
    const amount = (balance * percentage) / market.price;
    setTradeAmount(amount.toFixed(2));
    setTradePercentage(percentage);
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-400">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const currentMarket = markets.find((m) => m.symbol === selectedSymbol);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_70%)]" style={{ zIndex: 0 }} />
      <div className="fixed inset-0 opacity-10" style={{ zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="relative z-20">
        <Navbar />
        <div className="container mx-auto px-4 md:px-6 py-24 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:hidden flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Markets</h2>
              <button
                onClick={() => setIsMarketListOpen(!isMarketListOpen)}
                className="p-2 bg-zinc-900/30 rounded-md"
              >
                {isMarketListOpen ? <X className="h-5 w-5 text-zinc-300" /> : <Search className="h-5 w-5 text-zinc-300" />}
              </button>
            </div>

            <AnimatePresence>
              {(isMarketListOpen || window.innerWidth >= 1024) && (
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="lg:w-80 fixed lg:static top-0 left-0 h-full lg:h-auto bg-black/80 backdrop-blur-md lg:bg-transparent z-30 pt-4 overscroll-none"
                >
                  <MarketSelector
                    selectedSymbol={selectedSymbol}
                    setSelectedSymbol={setSelectedSymbol}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 space-y-6">
              <GlassCard delay={100}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedSymbol}</h2>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-2xl font-mono font-bold">
                        $<NumberAnimation value={currentMarket?.price || 0} format={(v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                      </span>
                      <div className={`flex items-center gap-1 ${currentMarket?.change24h != null && currentMarket.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {currentMarket?.change24h != null && currentMarket.change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <NumberAnimation value={Math.abs(currentMarket?.change24h || 0)} />%
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <GlassCard className="p-3">
                      <div className="text-sm text-zinc-400">Today's P&L</div>
                      <div className={`text-lg font-bold ${todaysPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {todaysPL >= 0 ? '+' : ''}<NumberAnimation value={todaysPL} />
                      </div>
                    </GlassCard>
                    <GlassCard className="p-3">
                      <div className="text-sm text-zinc-400">Portfolio Value</div>
                      <div className="text-lg font-bold text-white">
                        $<NumberAnimation value={portfolioValue} format={(v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                      </div>
                    </GlassCard>
                  </div>
                </div>
                <div className="mt-6 h-[400px] sm:h-[500px]">
                  <TradingViewWidget symbol={`BINANCE:${selectedSymbol.replace('/', '')}`} />
                </div>
              </GlassCard>

              <GlassCard delay={200}>
                <h3 className="text-lg font-semibold text-white mb-4">Open Positions</h3>
                {openTrades.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No open positions</p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider p-2 border-b border-white/10">
                      <div className="col-span-3">Symbol</div>
                      <div className="col-span-2 text-right">Entry</div>
                      <div className="col-span-2 text-right">Current</div>
                      <div className="col-span-2 text-right">Amount</div>
                      <div className="col-span-2 text-right">P/L</div>
                      <div className="col-span-1 text-right"></div>
                    </div>
                    <AnimatePresence>
                      {openTrades.map((trade) => {
                        const market = markets.find((m) => m.symbol === trade.symbol);
                        const currentPrice = market?.price || 0;
                        const unrealizedPL =
                          trade.type === 'buy'
                            ? (currentPrice - trade.entry_price) * trade.amount
                            : (trade.entry_price - currentPrice) * trade.amount;

                        return (
                          <motion.div
                            key={trade.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-12 gap-2 items-center p-2 border-b border-white/10 hover:bg-white/[0.03] rounded-md"
                          >
                            <div className="col-span-3">
                              <div className="font-semibold text-white">{trade.symbol}</div>
                              <div className="text-xs text-zinc-400">{trade.type.toUpperCase()}</div>
                            </div>
                            <div className="col-span-2 text-right text-white font-mono">
                              $<NumberAnimation value={trade.entry_price} format={(v) => v.toFixed(2)} />
                            </div>
                            <div className="col-span-2 text-right text-white font-mono">
                              $<NumberAnimation value={currentPrice} format={(v) => v.toFixed(2)} />
                            </div>
                            <div className="col-span-2 text-right text-white font-mono">
                              <NumberAnimation value={trade.amount} format={(v) => v.toFixed(2)} />
                            </div>
                            <div className="col-span-2 text-right">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                unrealizedPL >= 0 ? 'bg-emerald-900/20 text-emerald-400' : 'bg-red-900/20 text-red-400'
                              }`}>
                                {unrealizedPL >= 0 ? '+' : ''}<NumberAnimation value={unrealizedPL} />
                              </span>
                            </div>
                            <div className="col-span-1 text-right">
                              <button
                                onClick={() => handleCloseTrade(trade.id, trade)}
                                disabled={loading}
                                className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-md hover:bg-red-500/30 transition-all duration-200"
                              >
                                Close
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </GlassCard>
            </div>

            <div className="lg:w-80 sticky top-24 self-start">
              <GlassCard delay={300}>
                <h3 className="text-lg font-semibold text-white mb-4">Place Order</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {['buy', 'sell'].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleTrade(type as 'buy' | 'sell')}
                        disabled={loading}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          type === 'buy'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-red-500/20'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={tradeAmount}
                      onChange={(e) => {
                        setTradeAmount(e.target.value);
                        setTradePercentage(0);
                      }}
                      className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-md px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700/50"
                    />
                    <div className="flex gap-2">
                      {[25, 50, 100].map((percent) => (
                        <button
                          key={percent}
                          onClick={() => handlePercentageSelect(percent / 100)}
                          className={`flex-1 py-1 text-xs rounded-md transition-all duration-200 ${
                            tradePercentage === percent / 100
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-900/30 text-zinc-400 hover:bg-zinc-900/50'
                          }`}
                        >
                          {percent}%
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Trade Value: $<NumberAnimation value={(parseFloat(tradeAmount || '0') * (currentMarket?.price || 0))} format={(v) => v.toFixed(2)} />
                    </div>
                    <div className="text-xs text-zinc-400">
                      Remaining Balance: $<NumberAnimation value={balance - (parseFloat(tradeAmount || '0') * (currentMarket?.price || 0))} format={(v) => v.toFixed(2)} />
                    </div>
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="mt-6" delay={400}>
                <h3 className="text-lg font-semibold text-white mb-2">Account Balance</h3>
                <div className="text-2xl font-bold text-white">
                  $<NumberAnimation value={balance} format={(v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                </div>
                <p className="text-xs text-zinc-400 mt-1">Available for trading</p>
              </GlassCard>
            </div>
          </div>
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

export default function TradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Loading...</div>}>
      <TradeContent />
    </Suspense>
  );
}