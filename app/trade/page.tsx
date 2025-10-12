"use client";
import { useEffect, useState, useMemo, memo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { TradingViewWidget } from '@/components/TradingViewWidget';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { marketsData, Market } from '@/lib/markets-data';
import {
  Search,
  TrendingUp,
  TrendingDown,
  X,
  Flame,
  Zap,
  Target,
  AlertTriangle,
  Activity,
  DollarSign,
  Percent,
  BarChart3,
  TrendingUpIcon,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
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
  leverage?: number;
};

const GlassCard = memo(
  ({
    children,
    className = '',
    delay = 0,
    glow = false,
  }: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    glow?: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.23, 1, 0.32, 1] }}
      className={`relative group ${className}`}
    >
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-zinc-300/8 to-white/5 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl" />
      <div className="relative p-4 md:p-6 rounded-xl transition-all duration-300">
        {children}
      </div>
    </motion.div>
  )
);

const NumberAnimation = memo(
  ({
    value,
    format = (v: number) => v.toFixed(2),
    className = '',
  }: {
    value: number;
    format?: (v: number) => string;
    className?: string;
  }) => (
    <motion.span
      key={value}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {format(value)}
    </motion.span>
  )
);

const LeverageSlider = memo(
  ({
    leverage,
    setLeverage,
    maxLeverage = 400,
  }: {
    leverage: number;
    setLeverage: (l: number) => void;
    maxLeverage?: number;
  }) => {
    const presets = [1, 5, 10, 25, 50, 100, 200, 400];
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm text-zinc-300 font-medium">Leverage</label>
          <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1 rounded-lg border border-zinc-600/50">
            <Zap className="h-3 w-3 text-zinc-300" />
            <span className="text-zinc-200 font-bold text-lg">{leverage}x</span>
          </div>
        </div>
        <div className="relative pt-2">
          <input
            type="range"
            min="1"
            max={maxLeverage}
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3f3f46 0%, #52525b ${((leverage - 1) / (maxLeverage - 1)) * 50}%, #a1a1aa ${((leverage - 1) / (maxLeverage - 1)) * 100}%, #27272a ${((leverage - 1) / (maxLeverage - 1)) * 100}%, #27272a 100%)`,
            }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => setLeverage(preset)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                leverage === preset
                  ? 'bg-zinc-700 text-zinc-100 shadow-lg'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 border border-zinc-700/50'
              }`}
            >
              {preset}x
            </button>
          ))}
        </div>
        {leverage > 100 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700/30"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>High leverage = High risk. Trade responsibly.</span>
          </motion.div>
        )}
      </div>
    );
  }
);

const MarketSelector = memo(
  ({
    selectedSymbol,
    setSelectedSymbol,
    searchQuery,
    setSearchQuery,
    markets,
  }: {
    selectedSymbol: string;
    setSelectedSymbol: (symbol: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    markets: Market[];
  }) => {
    const [filter, setFilter] = useState<'all' | 'crypto' | 'forex' | 'stocks'>('all');
    const filteredMarkets = markets.filter((m) => {
      const matchesSearch =
        m.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || m.category === filter;
      return matchesSearch && matchesFilter;
    });

    return (
      <GlassCard className="h-full bg-black/40 border-zinc-700/30 min-h-[500px]" glow>
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-zinc-200">Markets</h3>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Activity className="h-3 w-3" />
              <span>Live</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/30 border border-zinc-700/50 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500/50 focus:ring-2 focus:ring-zinc-500/20 transition-all"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'crypto', 'forex', 'stocks'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  filter === f
                    ? 'bg-zinc-700 text-white shadow-md'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1 max-h-[600px] overflow-y-auto hide-scrollbar p-1">
          {filteredMarkets.map((market, i) => {
            const isPositive = market.change24h >= 0;
            return (
              <motion.button
                key={market.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                onClick={() => setSelectedSymbol(market.symbol)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  selectedSymbol === market.symbol
                    ? 'border-zinc-500/50 bg-zinc-900/30 shadow-lg'
                    : 'border-zinc-800/50 hover:border-zinc-600/50 hover:bg-zinc-800/30'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{market.symbol}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                        {market.category}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 truncate mt-0.5">{market.name}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {market.category === 'crypto' && market.sparkline && (
                      <div className="w-20 h-8">
                        <ResponsiveContainer>
                          <AreaChart data={market.sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient
                                id={`gradient-${market.symbol}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop offset="0%" stopColor={isPositive ? '#a1a1aa' : '#71717a'} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={isPositive ? '#a1a1aa' : '#71717a'} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="close"
                              stroke={isPositive ? '#a1a1aa' : '#71717a'}
                              fill={`url(#gradient-${market.symbol})`}
                              strokeWidth={1.5}
                              isAnimationActive={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div
                      className={`flex items-center gap-1 text-sm font-bold ${
                        isPositive ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <NumberAnimation
                        value={market.change24h}
                        format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`}
                      />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </GlassCard>
    );
  }
);

const StatsCard = memo(
  ({
    icon: Icon,
    label,
    value,
    change,
    valueColor = 'text-white',
  }: {
    icon: any;
    label: string;
    value: string | number;
    change?: number;
    valueColor?: string;
  }) => (
    <GlassCard className="flex-1" glow>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </div>
          <div className={`text-2xl font-bold ${valueColor}`}>
            {typeof value === 'number' ? (
              <NumberAnimation
                value={value}
                format={(v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            ) : (
              value
            )}
          </div>
          {change !== undefined && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${change >= 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <NumberAnimation value={Math.abs(change)} format={(v) => `${change >= 0 ? '+' : '-'}${v.toFixed(2)}%`} />
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
);

function TradeContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradePercentage, setTradePercentage] = useState<number>(0);
  const [leverage, setLeverage] = useState<number>(1);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [markets, setMarkets] = useState<Market[]>(marketsData);
  const [loading, setLoading] = useState(false);
  const [isMarketListOpen, setIsMarketListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');

  const portfolioValue = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      const market = markets.find((m) => m.symbol === trade.symbol);
      const currentPrice = market?.price || 0;
      const tradeLeverage = trade.leverage || 1;
      const value = trade.type === 'buy' ? trade.amount * currentPrice * tradeLeverage : trade.amount * trade.entry_price * tradeLeverage;
      return acc + value;
    }, balance);
  }, [openTrades, balance, markets]);

  const todaysPL = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      const market = markets.find((m) => m.symbol === trade.symbol);
      const currentPrice = market?.price || 0;
      const tradeLeverage = trade.leverage || 1;
      const pl = trade.type === 'buy'
        ? (currentPrice - trade.entry_price) * trade.amount * tradeLeverage
        : (trade.entry_price - currentPrice) * trade.amount * tradeLeverage;
      return acc + pl;
    }, 0);
  }, [openTrades, markets]);

  const totalExposure = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      const tradeLeverage = trade.leverage || 1;
      return acc + trade.amount * trade.entry_price * tradeLeverage;
    }, 0);
  }, [openTrades]);

  const marginUsed = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      return acc + trade.amount * trade.entry_price;
    }, 0);
  }, [openTrades]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const symbol = searchParams.get('symbol');
    if (symbol && marketsData.some((m) => m.symbol === symbol)) {
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
          .filter((market) => market.category === 'crypto')
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
        setMarkets(
          marketsData.map((market) => ({
            ...market,
            sparkline: klineResults.find((k) => k.symbol === market.symbol)?.data,
          }))
        );
      } catch (error) {
        console.error('Error fetching sparklines:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
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
    setLoading(true);
    try {
      const market = markets.find((m) => m.symbol === selectedSymbol);
      if (!market) throw new Error('Market not found');
      const amount = parseFloat(tradeAmount);
      const tradeValue = amount * market.price;
      const requiredMargin = tradeValue / leverage;
      if (requiredMargin > balance) {
        toast({
          title: 'Insufficient margin',
          description: `You need $${requiredMargin.toFixed(2)} margin for this trade.`,
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
        leverage: leverage,
      });
      if (tradeError) throw tradeError;
      const newBalance = balance - requiredMargin;
      const { error: balanceError } = await supabase
        .from('balances')
        .update({ amount: newBalance })
        .eq('user_id', user.id)
        .eq('currency', 'USD');
      if (balanceError) throw balanceError;
      toast({
        title: '🚀 Trade opened!',
        description: `${type.toUpperCase()} ${amount} ${selectedSymbol} with ${leverage}x leverage`,
      });
      setTradeAmount('');
      setTradePercentage(0);
      fetchBalance();
      fetchOpenTrades();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to execute trade.',
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
      const tradeLeverage = trade.leverage || 1;
      const profitLoss = trade.type === 'buy'
        ? (currentPrice - trade.entry_price) * trade.amount * tradeLeverage
        : (trade.entry_price - currentPrice) * trade.amount * tradeLeverage;
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
      const marginReturned = trade.amount * trade.entry_price;
      const newBalance = balance + marginReturned + profitLoss;
      const { error: balanceError } = await supabase
        .from('balances')
        .update({ amount: newBalance })
        .eq('user_id', user?.id)
        .eq('currency', 'USD');
      if (balanceError) throw balanceError;
      toast({
        title: profitLoss >= 0 ? '✨ Trade closed with profit!' : '📉 Trade closed',
        description: `P/L: ${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)}`,
      });
      fetchBalance();
      fetchOpenTrades();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close trade.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageSelect = (percentage: number) => {
    const market = markets.find((m) => m.symbol === selectedSymbol);
    if (!market) return;
    const availableForTrade = balance * leverage;
    const amount = (availableForTrade * percentage) / market.price;
    setTradeAmount(amount.toFixed(4));
    setTradePercentage(percentage);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 border-4 border-zinc-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  if (!user) return null;

  const currentMarket = markets.find((m) => m.symbol === selectedSymbol);
  const maxTradeValue = balance * leverage;
  const tradeValue = parseFloat(tradeAmount || '0') * (currentMarket?.price || 0);
  const requiredMargin = tradeValue / leverage;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.01),transparent_70%)] z-0" />
      <div
        className="fixed inset-0 opacity-5 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-10">
        <Navbar />
        <div className="container mx-auto px-4 md:px-6 py-24 max-w-[1800px]">
          {/* Stats Bar */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-4 mb-6">
            <StatsCard icon={DollarSign} label="Portfolio Value" value={portfolioValue} valueColor="text-white" />
            <StatsCard
              icon={TrendingUpIcon}
              label="Today's P&L"
              value={`${todaysPL >= 0 ? '+' : ''}$${todaysPL.toFixed(2)}`}
              valueColor={todaysPL >= 0 ? 'text-zinc-200' : 'text-zinc-400'}
              change={todaysPL >= 0 ? (todaysPL / balance) * 100 : -(Math.abs(todaysPL) / balance) * 100}
            />
            <StatsCard icon={BarChart3} label="Total Exposure" value={totalExposure} valueColor="text-zinc-300" />
            <StatsCard icon={Percent} label="Margin Used" value={`$${marginUsed.toFixed(2)}`} valueColor="text-zinc-300" />
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Mobile Market Toggle */}
            <div className="lg:hidden flex justify-between items-center">
              <button
                onClick={() => setIsMarketListOpen(!isMarketListOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg border border-zinc-700/50"
              >
                <span className="font-semibold text-white">{isMarketListOpen ? 'Close' : 'Markets'}</span>
                {isMarketListOpen ? <X className="h-4 w-4 text-zinc-400" /> : <Search className="h-4 w-4 text-zinc-400" />}
              </button>
            </div>

            {/* Market Selector */}
            <AnimatePresence>
              {(isMarketListOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="lg:w-80 fixed lg:static top-0 left-0 h-full lg:h-auto bg-black/95 backdrop-blur-xl lg:bg-transparent z-40 pt-4 overflow-hidden"
                >
                  <MarketSelector
                    selectedSymbol={selectedSymbol}
                    setSelectedSymbol={(symbol) => {
                      setSelectedSymbol(symbol);
                      setIsMarketListOpen(false);
                    }}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    markets={markets}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Chart Area */}
            <div className="flex-1 space-y-6">
              <GlassCard delay={100} glow>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-white">{selectedSymbol}</h2>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                        {currentMarket?.category?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-4xl font-mono font-bold">
                        $<NumberAnimation value={currentMarket?.price || 0} format={(v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                      </span>
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                          currentMarket?.change24h != null && currentMarket.change24h >= 0
                            ? 'bg-zinc-800 text-zinc-200'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {currentMarket?.change24h != null && currentMarket.change24h >= 0 ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                        <span className="text-lg font-bold">
                          <NumberAnimation
                            value={Math.abs(currentMarket?.change24h || 0)}
                            format={(v) => `${v.toFixed(2)}%`}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-[500px] sm:h-[600px] rounded-xl overflow-hidden border border-white/10">
                  <TradingViewWidget symbol={`BINANCE:${selectedSymbol.replace('/', '')}`} />
                </div>
              </GlassCard>

              {/* Open Positions */}
              <GlassCard delay={200} glow>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Open Positions</h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Target className="h-4 w-4" />
                    <span>{openTrades.length} Active</span>
                  </div>
                </div>
                {openTrades.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 mb-4">
                      <BarChart3 className="h-8 w-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-400 text-lg">No open positions</p>
                    <p className="text-zinc-600 text-sm mt-2">Start trading to see your positions here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3 border-b border-white/10">
                      <div className="col-span-2">Symbol</div>
                      <div className="col-span-1 text-center">Type</div>
                      <div className="col-span-1 text-center">Leverage</div>
                      <div className="col-span-2 text-right">Entry</div>
                      <div className="col-span-2 text-right">Current</div>
                      <div className="col-span-1 text-right">Amount</div>
                      <div className="col-span-2 text-right">P/L</div>
                      <div className="col-span-1 text-right"></div>
                    </div>
                    <AnimatePresence>
                      {openTrades.map((trade, idx) => {
                        const market = markets.find((m) => m.symbol === trade.symbol);
                        const currentPrice = market?.price || 0;
                        const tradeLeverage = trade.leverage || 1;
                        const unrealizedPL = trade.type === 'buy'
                          ? (currentPrice - trade.entry_price) * trade.amount * tradeLeverage
                          : (trade.entry_price - currentPrice) * trade.amount * tradeLeverage;
                        const plPercentage = (unrealizedPL / (trade.amount * trade.entry_price)) * 100;
                        return (
                          <motion.div
                            key={trade.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 rounded-xl border border-white/10 hover:border-zinc-500/30 hover:bg-white/[0.02] transition-all duration-200"
                          >
                            <div className="col-span-1 md:col-span-2">
                              <div className="font-bold text-white text-lg">{trade.symbol}</div>
                              <div className="text-xs text-zinc-500">{new Date(trade.opened_at).toLocaleDateString()}</div>
                            </div>
                            <div className="col-span-1 md:text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${
                                  trade.type === 'buy' ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {trade.type === 'buy' ? '↑' : '↓'} {trade.type.toUpperCase()}
                              </span>
                            </div>
                            <div className="col-span-1 md:text-center">
                              <div className="flex items-center justify-start md:justify-center gap-1">
                                <Zap className="h-3 w-3 text-zinc-300" />
                                <span className="font-bold text-zinc-300">{tradeLeverage}x</span>
                              </div>
                            </div>
                            <div className="col-span-1 md:col-span-2 md:text-right">
                              <div className="text-white font-mono font-semibold">
                                $<NumberAnimation value={trade.entry_price} format={(v) => v.toFixed(2)} />
                              </div>
                            </div>
                            <div className="col-span-1 md:col-span-2 md:text-right">
                              <div className="text-white font-mono font-semibold">
                                $<NumberAnimation value={currentPrice} format={(v) => v.toFixed(2)} />
                              </div>
                            </div>
                            <div className="col-span-1 md:text-right">
                              <div className="text-zinc-300 font-mono">
                                <NumberAnimation value={trade.amount} format={(v) => v.toFixed(4)} />
                              </div>
                            </div>
                            <div className="col-span-1 md:col-span-2 md:text-right">
                              <div
                                className={`inline-flex flex-col items-end px-3 py-2 rounded-lg ${
                                  unrealizedPL >= 0 ? 'bg-zinc-900/30 border border-zinc-600/30' : 'bg-zinc-900/30 border border-zinc-700/30'
                                }`}
                              >
                                <span className={`text-lg font-bold ${unrealizedPL >= 0 ? 'text-zinc-200' : 'text-zinc-400'}`}>
                                  {unrealizedPL >= 0 ? '+' : ''}
                                  <NumberAnimation value={unrealizedPL} format={(v) => `${v.toFixed(2)}`} />
                                </span>
                                <span className={`text-xs ${unrealizedPL >= 0 ? 'text-zinc-300/70' : 'text-zinc-500/70'}`}>
                                  {plPercentage >= 0 ? '+' : ''}{plPercentage.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            <div className="col-span-1 md:text-right">
                              <button
                                onClick={() => handleCloseTrade(trade.id, trade)}
                                disabled={loading}
                                className="w-full md:w-auto px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50"
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

            {/* Trading Panel */}
            <div className="lg:w-96 sticky top-24 self-start space-y-4">
              <GlassCard delay={300} glow>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Place Order</h3>
                  <Flame className="h-5 w-5 text-zinc-500" />
                </div>
                <div className="space-y-5">
                  {/* Order Type Tabs */}
                  <div className="flex gap-2 p-1 bg-black/30 rounded-lg">
                    {(['market', 'limit'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
                          orderType === type
                            ? 'bg-zinc-700 text-white shadow-lg'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>

                  <LeverageSlider leverage={leverage} setLeverage={setLeverage} />

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 font-medium">Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="0.00"
                        value={tradeAmount}
                        onChange={(e) => {
                          setTradeAmount(e.target.value);
                          setTradePercentage(0);
                        }}
                        className="w-full bg-black/30 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500/50 focus:ring-2 focus:ring-zinc-500/20 transition-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-medium">
                        {selectedSymbol.split('/')[0]}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 100].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => handlePercentageSelect(percent / 100)}
                        className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          tradePercentage === percent / 100
                            ? 'bg-zinc-700 text-white shadow-lg'
                            : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 border border-zinc-700/50'
                        }`}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>

                  {orderType === 'limit' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-sm text-zinc-300 font-medium">Limit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={currentMarket?.price.toString() || '0.00'}
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="w-full bg-black/30 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500/50 focus:ring-2 focus:ring-zinc-500/20 transition-all"
                      />
                    </motion.div>
                  )}

                  <div className="space-y-2 p-4 bg-black/20 rounded-lg border border-zinc-800/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Trade Value</span>
                      <span className="text-white font-mono font-semibold">
                        $<NumberAnimation value={tradeValue} format={(v) => v.toFixed(2)} />
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Required Margin</span>
                      <span className="text-zinc-200 font-mono font-semibold">
                        $<NumberAnimation value={requiredMargin} format={(v) => v.toFixed(2)} />
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Max Trade Value</span>
                      <span className="text-zinc-300 font-mono font-semibold">
                        $<NumberAnimation value={maxTradeValue} format={(v) => v.toFixed(2)} />
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-zinc-800">
                      <span className="text-zinc-400">Remaining Balance</span>
                      <span className="text-white font-mono font-semibold">
                        $<NumberAnimation value={balance - requiredMargin} format={(v) => v.toFixed(2)} />
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleTrade('buy')}
                      disabled={loading || !tradeAmount || parseFloat(tradeAmount) <= 0}
                      className="relative py-4 rounded-xl text-base font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        BUY
                      </span>
                    </button>
                    <button
                      onClick={() => handleTrade('sell')}
                      disabled={loading || !tradeAmount || parseFloat(tradeAmount) <= 0}
                      className="relative py-4 rounded-xl text-base font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        SELL
                      </span>
                    </button>
                  </div>
                </div>
              </GlassCard>

              <GlassCard delay={400} glow>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-zinc-300">Account Balance</h3>
                  <DollarSign className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  $<NumberAnimation value={balance} format={(v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                </div>
                <p className="text-xs text-zinc-500">Available for trading</p>
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Free Margin</span>
                    <span className="text-zinc-200 font-semibold">${(balance - marginUsed).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Used Margin</span>
                    <span className="text-zinc-400 font-semibold">${marginUsed.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(marginUsed / balance) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-full"
                    />
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #52525b, #a1a1aa);
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(82, 82, 91, 0.3);
          transition: all 0.2s;
        }
        .slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 6px rgba(82, 82, 91, 0.4);
          transform: scale(1.1);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #52525b, #a1a1aa);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 4px rgba(82, 82, 91, 0.3);
          transition: all 0.2s;
        }
        .slider::-moz-range-thumb:hover {
          box-shadow: 0 0 0 6px rgba(82, 82, 91, 0.4);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-12 w-12 border-4 border-zinc-500 border-t-transparent rounded-full"
          />
        </div>
      }
    >
      <TradeContent />
    </Suspense>
  );
}