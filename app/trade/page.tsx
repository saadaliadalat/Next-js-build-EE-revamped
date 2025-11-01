// app/trade/page.tsx
"use client";
import { useEffect, useState, useMemo, memo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { TradingViewWidget } from '@/components/TradingViewWidget';
import { supabase } from '@/lib/supabase';
import { Search, TrendingUp, TrendingDown, X, Flame, Zap, Target, AlertTriangle, Activity, DollarSign, Percent, BarChart3, TrendingUpIcon } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';

type Trade = {
  id: string;
  user_id: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  entry_price: number;
  current_price: number;
  status: 'open' | 'closed';
  profit_loss?: number;
  unrealized_pl?: number;
  created_at: string;
  leverage?: number;
  stop_loss?: number;
  take_profit?: number;
};

type Market = {
  symbol: string;
  name: string;
  category: 'crypto' | 'forex' | 'stocks';
  price: number;
  change24h: number;
  volume24h: string;
  sparkline?: Array<{ time: number; close: number }>;
};

const FOREX_PAIRS = [
  { symbol: 'EURUSD', name: 'EUR/USD' },
  { symbol: 'GBPUSD', name: 'GBP/USD' },
  { symbol: 'USDJPY', name: 'USD/JPY' },
];

const STOCK_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
];

type AISignal = {
  symbol: string;
  signal: 'STRONG_BUY' | 'BUY' | 'SELL' | 'STRONG_SELL' | 'NEUTRAL';
  confidence: number;
  reasons: string[];
};

const GlassCard = memo(({ children, className = "", delay = 0, glow = false }: { children: React.ReactNode; className?: string; delay?: number; glow?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: delay / 1000 }}
    className={`relative group ${className}`}
  >
    {glow && <div className="absolute inset-0 bg-white/[0.02] rounded-xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-transparent rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl" />
    <div className="relative p-4 md:p-6 rounded-xl transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-white/10">
      {children}
    </div>
  </motion.div>
));

const NumberAnimation = memo(({ value, format = (v: number) => v.toFixed(2), className = "" }: { value: number; format?: (v: number) => string; className?: string }) => (
  <motion.span
    key={value}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className={className}
  >
    {format(value)}
  </motion.span>
));

const LeverageSlider = memo(({ leverage, setLeverage }: { leverage: number; setLeverage: (l: number) => void }) => {
  const presets = [1, 5, 10, 25, 50, 100];
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm text-zinc-400 font-medium">Leverage</label>
        <div className="flex items-center gap-2 bg-white/[0.05] px-3 py-1 rounded-lg border border-white/10">
          <Zap className="h-3 w-3 text-white" />
          <span className="text-white font-bold text-lg">{leverage}x</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => setLeverage(preset)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
              leverage === preset
                ? 'bg-white text-black shadow-lg shadow-white/20'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white border border-zinc-700/50'
            }`}
          >
            {preset}x
          </button>
        ))}
      </div>
      
      {leverage > 50 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800/30 px-3 py-2 rounded-lg border border-zinc-700/50"
        >
          <AlertTriangle className="h-3 w-3" />
          <span>High leverage = High risk. Trade responsibly.</span>
        </motion.div>
      )}
    </div>
  );
});

const MarketSelector = memo(({ selectedSymbol, setSelectedSymbol, searchQuery, setSearchQuery, markets }: {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  markets: Market[];
}) => {
  const [filter, setFilter] = useState<'all' | 'crypto' | 'forex' | 'stocks'>('all');
  
  const filteredMarkets = markets.filter(m => {
    const matchesSearch = m.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || m.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <GlassCard className="h-full bg-zinc-900/80 border-zinc-800/50 min-h-[500px]" glow>
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Markets</h3>
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
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all"
          />
        </div>
        
        <div className="flex gap-1">
          {(['all', 'crypto', 'forex', 'stocks'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                filter === f
                  ? 'bg-white text-black shadow-md'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
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
                  ? 'border-white/30 bg-white/[0.05] shadow-lg shadow-white/5'
                  : 'border-zinc-800/50 hover:border-white/20 hover:bg-zinc-800/30'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{market.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400 uppercase">
                      {market.category}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 truncate mt-0.5">{market.name}</div>
                  <div className="text-sm font-mono text-white mt-1">${market.price.toFixed(2)}</div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-white' : 'text-zinc-500'}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <NumberAnimation value={market.change24h} format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`} />
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </GlassCard>
  );
});

const StatsCard = memo(({ icon: Icon, label, value, change, valueColor = "text-white" }: {
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
          {typeof value === 'number' ? <NumberAnimation value={value} format={(v) => `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} /> : value}
        </div>
        {change !== undefined && (
          <div className={`text-xs mt-1 flex items-center gap-1 ${change >= 0 ? 'text-white' : 'text-zinc-500'}`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <NumberAnimation value={Math.abs(change)} format={(v) => `${change >= 0 ? '+' : '-'}${v.toFixed(2)}%`} />
          </div>
        )}
      </div>
    </div>
  </GlassCard>
));

function TradeContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradePercentage, setTradePercentage] = useState<number>(0);
  const [leverage, setLeverage] = useState<number>(1);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMarketListOpen, setIsMarketListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const portfolioValue = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      return acc + (trade.unrealized_pl || 0);
    }, balance);
  }, [openTrades, balance]);

  const todaysPL = useMemo(() => {
    return openTrades.reduce((acc, trade) => acc + (trade.unrealized_pl || 0), 0);
  }, [openTrades]);

  const totalExposure = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      return acc + (trade.quantity * trade.entry_price * (trade.leverage || 1));
    }, 0);
  }, [openTrades]);

  const marginUsed = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      return acc + (trade.quantity * trade.entry_price);
    }, 0);
  }, [openTrades]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/auth/login');
      return;
    }
    setUser(authUser);
    fetchBalance(authUser.id);
    fetchOpenTrades(authUser.id);
    initializeMarkets();
  };

  const initializeMarkets = async () => {
    const allMarkets: Market[] = [];
    
    const cryptos = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT'];
    cryptos.forEach(symbol => {
      allMarkets.push({
        symbol,
        name: symbol.replace('USDT', ''),
        category: 'crypto',
        price: Math.random() * 50000 + 10000,
        change24h: (Math.random() - 0.5) * 5,
        volume24h: '0',
      });
    });
    
    FOREX_PAIRS.forEach(pair => {
      allMarkets.push({
        symbol: pair.symbol,
        name: pair.name,
        category: 'forex',
        price: 1.08 + Math.random() * 0.02,
        change24h: (Math.random() - 0.5) * 1.5,
        volume24h: '0',
      });
    });
    
    STOCK_SYMBOLS.forEach(stock => {
      allMarkets.push({
        symbol: stock.symbol,
        name: stock.name,
        category: 'stocks',
        price: 50 + Math.random() * 300,
        change24h: (Math.random() - 0.5) * 3,
        volume24h: '0',
      });
    });
    
    setMarkets(allMarkets);
  };

  const fetchBalance = async (userId: string) => {
    const { data } = await supabase
      .from('balances')
      .select('available_balance')
      .eq('user_id', userId)
      .single();
    setBalance(data?.available_balance || 0);
  };

  const fetchOpenTrades = async (userId: string) => {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setOpenTrades(data || []);
  };

  // Update market prices and trade prices in real-time
  useEffect(() => {
    const interval = setInterval(async () => {
      // Update market prices
      setMarkets(prev => prev.map(market => {
        const priceChange = (Math.random() - 0.5) * market.price * 0.002;
        const newPrice = Math.max(market.price + priceChange, 0.01);
        return {
          ...market,
          price: newPrice,
          change24h: market.change24h + ((priceChange / market.price) * 100) * 0.1,
        };
      }));

      // Update trade current prices in database (triggers SL/TP check)
      if (user && openTrades.length > 0) {
        for (const trade of openTrades) {
          const market = markets.find(m => m.symbol === trade.symbol);
          if (market) {
            await supabase.rpc('update_trade_price', {
              trade_id: trade.id,
              new_price: market.price
            });
          }
        }
        // Refresh trades to see if any were closed by SL/TP
        fetchOpenTrades(user.id);
        fetchBalance(user.id);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [user, openTrades, markets]);

  const handleTrade = async (side: 'buy' | 'sell') => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      alert('❌ Invalid amount');
      return;
    }
    if (!user) return;

    const market = markets.find(m => m.symbol === selectedSymbol);
    if (!market) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('open_trade', {
        p_user_id: user.id,
        p_symbol: selectedSymbol,
        p_type: side,
        p_quantity: parseFloat(tradeAmount),
        p_entry_price: market.price,
        p_leverage: leverage,
        p_stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        p_take_profit: takeProfit ? parseFloat(takeProfit) : null,
      });

      if (error) throw error;

      if (!data.success) {
        alert(`❌ ${data.error}\nRequired: $${data.required.toFixed(2)}\nAvailable: $${data.available.toFixed(2)}`);
        return;
      }

      alert(`✅ Trade opened!\n${side.toUpperCase()} ${tradeAmount} ${selectedSymbol}\nMargin used: $${data.margin_used.toFixed(2)}`);
      setTradeAmount('');
      setTradePercentage(0);
      setStopLoss('');
      setTakeProfit('');
      fetchBalance(user.id);
      fetchOpenTrades(user.id);
    } catch (error: any) {
      alert('❌ Trade failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTrade = async (tradeId: string, trade: Trade) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const market = markets.find(m => m.symbol === trade.symbol);
      const currentPrice = market?.price || trade.current_price;

      const { data, error } = await supabase.rpc('close_trade', {
        p_trade_id: tradeId,
        p_current_price: currentPrice
      });

      if (error) throw error;

      if (!data.success) {
        alert(`❌ ${data.error}`);
        return;
      }

      const pl = data.profit_loss;
      alert(`✅ Trade closed!\nP/L: ${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}\nMargin returned: $${data.margin_returned.toFixed(2)}\nTotal: $${data.total_returned.toFixed(2)}`);
      
      fetchBalance(user.id);
      fetchOpenTrades(user.id);
    } catch (error: any) {
      alert('❌ Close failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageSelect = (percentage: number) => {
    const market = markets.find(m => m.symbol === selectedSymbol);
    if (!market || !balance) return;
    const maxAmount = (balance * leverage) / market.price;
    const amount = maxAmount * (percentage / 100);
    setTradeAmount(amount.toFixed(4));
    setTradePercentage(percentage);
  };

  const suggestStopLoss = () => {
    const market = markets.find(m => m.symbol === selectedSymbol);
    if (!market) return;
    const sl = market.price * 0.97; // 3% below current price
    setStopLoss(sl.toFixed(2));
    alert(`✅ Stop Loss set to $${sl.toFixed(2)} (3% protection)`);
  };

  const suggestTakeProfit = () => {
    const market = markets.find(m => m.symbol === selectedSymbol);
    if (!market) return;
    const tp = market.price * 1.05; // 5% above current price
    setTakeProfit(tp.toFixed(2));
    alert(`✅ Take Profit set to $${tp.toFixed(2)} (5% target)`);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-black"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;
  }

  const currentMarket = markets.find(m => m.symbol === selectedSymbol);
  const tradeValue = parseFloat(tradeAmount || '0') * (currentMarket?.price || 0);
  const requiredMargin = tradeValue / leverage;
  const maxTradeValue = balance * leverage;
  const change24h = currentMarket?.change24h ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_70%)]" style={{ zIndex: 0 }} />
      
      <div className="relative z-20">
        <Navbar />
        
        <div className="container mx-auto px-4 md:px-6 py-24 max-w-[1800px]">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-4 mb-6">
            <StatsCard icon={DollarSign} label="Portfolio Value" value={portfolioValue} valueColor="text-white" />
            <StatsCard icon={TrendingUpIcon} label="Today's P&L" value={`${todaysPL >= 0 ? '+' : ''}${todaysPL.toFixed(2)}`} valueColor={todaysPL >= 0 ? 'text-white' : 'text-zinc-500'} change={todaysPL >= 0 ? (todaysPL / balance) * 100 : -(Math.abs(todaysPL) / balance) * 100} />
            <StatsCard icon={BarChart3} label="Total Exposure" value={totalExposure} valueColor="text-zinc-300" />
            <StatsCard icon={Percent} label="Margin Used" value={`${marginUsed.toFixed(2)}`} valueColor="text-zinc-400" />
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:hidden flex justify-between items-center">
              <button onClick={() => setIsMarketListOpen(!isMarketListOpen)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-lg border border-zinc-700/50">
                <span className="font-semibold">{isMarketListOpen ? 'Close' : 'Markets'}</span>
                {isMarketListOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>
            </div>

            <AnimatePresence>
              {(isMarketListOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="lg:w-80 fixed lg:static top-0 left-0 h-full lg:h-auto bg-black/95 backdrop-blur-xl lg:bg-transparent z-40 pt-4 overflow-hidden">
                  <MarketSelector selectedSymbol={selectedSymbol} setSelectedSymbol={(symbol) => { setSelectedSymbol(symbol); setIsMarketListOpen(false); }} searchQuery={searchQuery} setSearchQuery={setSearchQuery} markets={markets} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 space-y-6">
              <GlassCard delay={100} glow>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-white">{selectedSymbol}</h2>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/[0.05] text-zinc-400 border border-white/10">{currentMarket?.category?.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-4xl font-mono font-bold">$<NumberAnimation value={currentMarket?.price || 0} format={(v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /></span>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${change24h >= 0 ? 'bg-white/[0.08] text-white border border-white/20' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50'}`}>
                        {change24h >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        <span className="text-lg font-bold"><NumberAnimation value={Math.abs(change24h)} format={(v) => `${v.toFixed(2)}%`} /></span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="h-[500px] sm:h-[600px] rounded-xl overflow-hidden border border-white/10">
                  <TradingViewWidget symbol={currentMarket?.category === 'crypto' ? `BINANCE:${selectedSymbol}` : `${selectedSymbol}`} />
                </div>
              </GlassCard>

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
                    <AnimatePresence>
                      {openTrades.map((trade, idx) => {
                        const unrealizedPL = trade.unrealized_pl || 0;
                        const plPercentage = (unrealizedPL / (trade.quantity * trade.entry_price)) * 100;

                        return (
                          <motion.div key={trade.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="p-4 rounded-xl border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.02] transition-all duration-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-bold text-white text-xl">{trade.symbol}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${trade.type === 'buy' ? 'bg-white/10 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}>
                                    {trade.type.toUpperCase()}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Zap className="h-3 w-3 text-white" />
                                    <span className="text-sm font-bold text-white">{trade.leverage || 1}x</span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <p className="text-zinc-500 text-xs">Entry</p>
                                    <p className="font-mono font-bold text-white">${trade.entry_price.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-zinc-500 text-xs">Current</p>
                                    <p className="font-mono font-bold text-white">${trade.current_price.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-zinc-500 text-xs">Quantity</p>
                                    <p className="font-mono text-zinc-300">{trade.quantity.toFixed(4)}</p>
                                  </div>
                                  <div>
                                    <p className="text-zinc-500 text-xs">Margin</p>
                                    <p className="font-mono text-zinc-300">${(trade.quantity * trade.entry_price).toFixed(2)}</p>
                                  </div>
                                </div>

                                {(trade.stop_loss || trade.take_profit) && (
                                  <div className="flex gap-3 mt-3 text-xs">
                                    {trade.stop_loss && (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-400">
                                        <span>SL: ${trade.stop_loss.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {trade.take_profit && (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400">
                                        <span>TP: ${trade.take_profit.toFixed(2)}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className={`px-4 py-3 rounded-lg ${unrealizedPL >= 0 ? 'bg-emerald-900/30 border border-emerald-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
                                  <p className="text-xs text-zinc-400 mb-1">Unrealized P/L</p>
                                  <p className={`text-2xl font-bold ${unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {unrealizedPL >= 0 ? '+' : ''}${unrealizedPL.toFixed(2)}
                                  </p>
                                  <p className={`text-xs ${unrealizedPL >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                                    {plPercentage >= 0 ? '+' : ''}{plPercentage.toFixed(2)}%
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleCloseTrade(trade.id, trade)} 
                                  disabled={loading} 
                                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-red-500/20 disabled:opacity-50"
                                >
                                  Close
                                </button>
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

            <div className="lg:w-96 sticky top-24 self-start space-y-4">
              <GlassCard delay={300} glow>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Place Order</h3>
                  <Flame className="h-5 w-5 text-white" />
                </div>
                
                <div className="space-y-5">
                  <LeverageSlider leverage={leverage} setLeverage={setLeverage} />

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 font-medium">Quantity</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.0001" 
                        placeholder="0.00" 
                        value={tradeAmount} 
                        onChange={e => { setTradeAmount(e.target.value); setTradePercentage(0); }} 
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-medium">{selectedSymbol.split('USDT')[0] || selectedSymbol}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 100].map(percent => (
                      <button key={percent} onClick={() => handlePercentageSelect(percent)} className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tradePercentage === percent ? 'bg-white text-black shadow-lg shadow-white/20' : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white border border-zinc-700/50'}`}>{percent}%</button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-zinc-300 font-medium">Stop Loss</label>
                      <button onClick={suggestStopLoss} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Suggest (3%)
                      </button>
                    </div>
                    <input type="number" step="0.01" placeholder="0.00" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all" />
                    <p className="text-xs text-zinc-500">Auto-closes to limit losses</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-zinc-300 font-medium">Take Profit</label>
                      <button onClick={suggestTakeProfit} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Suggest (5%)
                      </button>
                    </div>
                    <input type="number" step="0.01" placeholder="0.00" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                    <p className="text-xs text-zinc-500">Auto-closes to secure profits</p>
                  </div>

                  <div className="space-y-2 p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                    <div className="flex justify-between text-sm"><span className="text-zinc-400">Trade Value</span><span className="text-white font-mono font-semibold">$<NumberAnimation value={tradeValue} format={v => v.toFixed(2)} /></span></div>
                    <div className="flex justify-between text-sm"><span className="text-zinc-400">Required Margin</span><span className="text-white font-mono font-semibold">$<NumberAnimation value={requiredMargin} format={v => v.toFixed(2)} /></span></div>
                    <div className="flex justify-between text-sm"><span className="text-zinc-400">Max Trade Value</span><span className="text-zinc-300 font-mono font-semibold">$<NumberAnimation value={maxTradeValue} format={v => v.toFixed(2)} /></span></div>
                    <div className="flex justify-between text-sm pt-2 border-t border-zinc-800"><span className="text-zinc-400">Remaining Balance</span><span className="text-white font-mono font-semibold">$<NumberAnimation value={Math.max(balance - requiredMargin, 0)} format={v => v.toFixed(2)} /></span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => handleTrade('buy')} disabled={loading || !tradeAmount || parseFloat(tradeAmount) <= 0 || requiredMargin > balance} className="relative py-4 rounded-xl text-base font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group bg-white text-black hover:shadow-2xl hover:shadow-white/20">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <span className="relative flex items-center justify-center gap-2"><TrendingUp className="h-5 w-5" /> BUY</span>
                    </button>
                    <button onClick={() => handleTrade('sell')} disabled={loading || !tradeAmount || parseFloat(tradeAmount) <= 0 || requiredMargin > balance} className="relative py-4 rounded-xl text-base font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group bg-zinc-800 text-white hover:bg-zinc-700 hover:shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <span className="relative flex items-center justify-center gap-2"><TrendingDown className="h-5 w-5" /> SELL</span>
                    </button>
                  </div>
                </div>
              </GlassCard>

              <GlassCard delay={400} glow>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-zinc-300">Account Balance</h3>
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">$<NumberAnimation value={balance} format={v => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /></div>
                <p className="text-xs text-zinc-500">Available for trading</p>
                
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-zinc-400">Free Margin</span><span className="text-white font-semibold">${(balance - marginUsed).toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-zinc-400">Used Margin</span><span className="text-zinc-400 font-semibold">${marginUsed.toFixed(2)}</span></div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((marginUsed / balance) * 100, 100)}%` }} transition={{ duration: 0.5 }} className="h-full bg-white rounded-full" />
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <footer className="text-center text-xs text-zinc-500 py-4">Trading involves risk. Use at your own discretion. Not financial advice.</footer>
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>}>
      <TradeContent />
    </Suspense>
  );
}