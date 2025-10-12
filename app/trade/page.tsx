
  "use client";
import { useEffect, useState, useMemo, memo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { TradingViewWidget } from '@/components/TradingViewWidget';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Search, TrendingUp, TrendingDown, X, Flame, Zap, Target, AlertTriangle, ChevronDown, Activity, DollarSign, Percent, BarChart3, TrendingUpIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import ccxt from 'ccxt';

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

const binance = new ccxt.binance({
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_API_SECRET,
  enableRateLimit: true,
  options: { defaultType: 'future' },
});

const FOREX_PAIRS = [
  { symbol: 'EURUSD', name: 'EUR/USD' },
  { symbol: 'GBPUSD', name: 'GBP/USD' },
  { symbol: 'USDJPY', name: 'USD/JPY' },
  { symbol: 'USDCHF', name: 'USD/CHF' },
  { symbol: 'AUDUSD', name: 'AUD/USD' },
  { symbol: 'NZDUSD', name: 'NZD/USD' },
  { symbol: 'USDCAD', name: 'USD/CAD' },
  { symbol: 'EURGBP', name: 'EUR/GBP' },
];

const STOCK_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'WIPRO.NS', name: 'Wipro' },
  { symbol: 'HDFC.NS', name: 'HDFC Bank' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
];

type AISignal = {
  symbol: string;
  signal: 'STRONG_BUY' | 'BUY' | 'SELL' | 'STRONG_SELL' | 'NEUTRAL';
  confidence: number;
  reasons: string[];
  suggestedStopLoss: number;
  suggestedTakeProfit: number;
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

const LeverageSlider = memo(({ leverage, setLeverage, maxLeverage = 400 }: { leverage: number; setLeverage: (l: number) => void; maxLeverage?: number }) => {
  const presets = [1, 5, 10, 25, 50, 100, 200, 400];
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm text-zinc-400 font-medium">Leverage</label>
        <div className="flex items-center gap-2 bg-white/[0.05] px-3 py-1 rounded-lg border border-white/10">
          <Zap className="h-3 w-3 text-white" />
          <span className="text-white font-bold text-lg">{leverage}x</span>
        </div>
      </div>
      
      <div className="relative pt-2">
        <input
          type="range"
          min="1"
          max={maxLeverage}
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #ffffff ${((leverage - 1) / (maxLeverage - 1)) * 100}%, #27272a ${((leverage - 1) / (maxLeverage - 1)) * 100}%, #27272a 100%)`
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
                ? 'bg-white text-black shadow-lg shadow-white/20'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white border border-zinc-700/50'
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
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  {market.category === 'crypto' && market.sparkline && (
                    <div className="w-20 h-8">
                      <ResponsiveContainer>
                        <AreaChart data={market.sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`gradient-${market.symbol}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="close"
                            stroke="#ffffff"
                            fill={`url(#gradient-${market.symbol})`}
                            strokeWidth={1.5}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
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

type AITradingSignalsProps = {
  signals: AISignal[];
  markets: Market[];
};

const AITradingSignals = memo(({ signals, markets }: AITradingSignalsProps) => {
  const topSignals = signals.filter(s => s.confidence > 0.7).slice(0, 3);
  
  return (
    <GlassCard glow>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            AI Trading Signals
          </h3>
          <div className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
            {topSignals.length} Active
          </div>
        </div>
        
        {topSignals.length === 0 ? (
          <p className="text-sm text-zinc-400">Analyzing markets...</p>
        ) : (
          <div className="space-y-3">
            {topSignals.map((signal) => {
              const signalColors = {
                STRONG_BUY: 'bg-emerald-900/50 border-emerald-500/50 text-emerald-300',
                BUY: 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300',
                NEUTRAL: 'bg-zinc-800/50 border-zinc-600/50 text-zinc-300',
                SELL: 'bg-orange-900/30 border-orange-500/30 text-orange-300',
                STRONG_SELL: 'bg-red-900/50 border-red-500/50 text-red-300',
              };

              return (
                <motion.div
                  key={signal.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${signalColors[signal.signal]}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{signal.symbol}</span>
                      <span className="text-xs bg-black/30 px-2 py-0.5 rounded">
                        {signal.signal.replace(/_/g, ' ')}
                      </span>
                      <div className="w-16 bg-black/30 rounded-full h-1.5">
                        <div 
                          className="bg-current h-full rounded-full" 
                          style={{ width: `${signal.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs">{(signal.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <ul className="text-xs space-y-1 mb-2">
                    {signal.reasons.map((reason, i) => (
                      <li key={i} className="flex items-center gap-1.5 opacity-80">
                        <div className="w-1 h-1 rounded-full bg-current" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex justify-between text-xs font-mono border-t border-current/20 pt-2 mt-2">
                    <span>SL: ${signal.suggestedStopLoss.toFixed(2)}</span>
                    <span>TP: ${signal.suggestedTakeProfit.toFixed(2)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
});

function TradeContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
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
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [kycVerified, setKycVerified] = useState(false);

  // AI Trading Functions
  const generateAISignals = (markets: Market[]): AISignal[] => {
    return markets.filter(m => m.price > 0).map(market => {
      const change = market.change24h;
      const volatility = Math.random() * 5;
      const momentum = change * 1.5;
      const RSI = 30 + Math.random() * 40;
      
      let signal: 'STRONG_BUY' | 'BUY' | 'SELL' | 'STRONG_SELL' | 'NEUTRAL' = 'NEUTRAL';
      let confidence = 0.5;
      const reasons: string[] = [];

      if (RSI < 30) {
        signal = 'STRONG_BUY';
        confidence = 0.85;
        reasons.push('RSI oversold (< 30)');
      } else if (RSI < 40) {
        signal = 'BUY';
        confidence = 0.72;
        reasons.push('RSI approaching oversold');
      } else if (RSI > 70) {
        signal = 'STRONG_SELL';
        confidence = 0.85;
        reasons.push('RSI overbought (> 70)');
      } else if (RSI > 60) {
        signal = 'SELL';
        confidence = 0.68;
        reasons.push('RSI approaching overbought');
      }

      if (change > 5) {
        reasons.push('Strong uptrend momentum');
        if (signal === 'NEUTRAL') signal = 'BUY';
        confidence = Math.min(0.88, confidence + 0.1);
      } else if (change < -5) {
        reasons.push('Strong downtrend detected');
        if (signal === 'NEUTRAL') signal = 'SELL';
        confidence = Math.min(0.88, confidence + 0.1);
      }

      if (volatility > 3) {
        reasons.push('High volatility detected');
      }

      const suggestedStopLoss = market.price * (signal.includes('BUY') ? 0.97 : 1.03);
      const suggestedTakeProfit = market.price * (signal.includes('BUY') ? 1.08 : 0.92);

      return {
        symbol: market.symbol,
        signal,
        confidence: Math.min(0.95, Math.max(0.55, confidence)),
        reasons: reasons.length > 0 ? reasons : ['Neutral market conditions'],
        suggestedStopLoss,
        suggestedTakeProfit,
      };
    });
  };

  const calculateAIStopLoss = (market: Market | undefined, tradeType: 'buy' | 'sell', signals: AISignal[]): number => {
    if (!market) return 0;

    const signal = signals.find(s => s.symbol === market.symbol);
    if (signal && signal.suggestedStopLoss > 0) {
      return signal.suggestedStopLoss;
    }

    const atr = market.price * 0.02;
    const riskMultiplier = tradeType === 'buy' ? 0.97 : 1.03;
    return market.price * riskMultiplier;
  };

  const [aiSignals, setAiSignals] = useState<AISignal[]>([]);

  const portfolioValue = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      const market = markets.find(m => m.symbol === trade.symbol);
      const currentPrice = market?.price || 0;
      const tradeLeverage = trade.leverage || 1;
      const value = trade.type === 'buy' 
        ? trade.amount * currentPrice * tradeLeverage
        : trade.amount * trade.entry_price * tradeLeverage;
      return acc + value;
    }, balance);
  }, [openTrades, balance, markets]);

  const todaysPL = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      const market = markets.find(m => m.symbol === trade.symbol);
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
      return acc + (trade.amount * trade.entry_price * tradeLeverage);
    }, 0);
  }, [openTrades]);

  const marginUsed = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      return acc + (trade.amount * trade.entry_price);
    }, 0);
  }, [openTrades]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      checkKYC();
      fetchBalance();
      fetchOpenTrades();
      syncRealBalance();
      initializeMarkets();
    }
  }, [user, authLoading, router]);

  const initializeMarkets = async () => {
    const allMarkets: Market[] = [];
    
    try {
      await binance.loadMarkets();
      const cryptoSymbols = Object.keys(binance.markets).filter(s => s.endsWith('/USDT')).slice(0, 20);
      cryptoSymbols.forEach(s => {
        allMarkets.push({
          symbol: s,
          name: s.replace('/USDT', ''),
          category: 'crypto',
          price: 0,
          change24h: 0,
          volume24h: '0',
        });
      });
    } catch (error) {
      console.error('Crypto markets init error:', error);
    }
    
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

  const checkKYC = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('kyc_verified').eq('id', user.id).single();
    setKycVerified(data?.kyc_verified || false);
    if (!data?.kyc_verified) toast({ title: 'KYC Required', description: 'Verify identity to trade.', variant: 'destructive' });
  };

  const syncRealBalance = async () => {
    try {
      const bal = await binance.fetchBalance();
      const usdt = bal?.USDT?.free || 0;
      setBalance(usdt);
      if (user) await supabase.from('balances').upsert({ user_id: user.id, currency: 'USD', amount: usdt });
    } catch (error) {
      console.error('Balance sync error:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      if (!user) return;
      const { data } = await supabase.from('balances').select('amount').eq('user_id', user.id).eq('currency', 'USD').single();
      setBalance(data?.amount || 10000);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(10000);
    }
  };

  const fetchOpenTrades = async () => {
    try {
      if (!user) return;
      const { data } = await supabase.from('trades').select('*').eq('user_id', user.id).eq('status', 'open').order('opened_at', { ascending: false });
      setOpenTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  useEffect(() => {
    const ws = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr');
    ws.onmessage = (event) => {
      const tickers = JSON.parse(event.data);
      if (!Array.isArray(tickers)) return;
      setMarkets(prev => prev.map(market => {
        if (market.category !== 'crypto') return market;
        const ticker = tickers.find(t => t.s === market.symbol.replace('/', ''));
        if (ticker) {
          return { ...market, price: parseFloat(ticker.c), change24h: parseFloat(ticker.P) };
        }
        return market;
      }));
    };
    ws.onerror = () => console.error('WebSocket error');
    return () => ws.close();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets(prev => prev.map(market => {
        if (market.category === 'crypto') return market;
        const priceChange = (Math.random() - 0.5) * market.price * 0.001;
        const changePercent = (priceChange / market.price) * 100;
        return {
          ...market,
          price: Math.max(market.price + priceChange, 0.01),
          change24h: market.change24h + changePercent * 0.1,
        };
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTrade = async (side: 'buy' | 'sell') => {
    if (!kycVerified) return toast({ title: 'KYC Required', variant: 'destructive' });
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) return toast({ title: 'Invalid amount', variant: 'destructive' });

    setLoading(true);
    try {
      const market = markets.find(m => m.symbol === selectedSymbol);
      if (!market) throw new Error('Market not found');

      if (market.category === 'crypto') {
        await binance.setLeverage(leverage, selectedSymbol);
        const params = orderType === 'limit' ? { price: parseFloat(limitPrice) } : {};
        await binance.createOrder(selectedSymbol, orderType, side, parseFloat(tradeAmount), orderType === 'limit' ? parseFloat(limitPrice) : undefined, params);

        if (stopLoss) {
          await binance.createOrder(selectedSymbol, 'stop_market', side === 'buy' ? 'sell' : 'buy', parseFloat(tradeAmount), undefined, { stopPrice: parseFloat(stopLoss), reduceOnly: true });
        }
        if (takeProfit) {
          await binance.createOrder(selectedSymbol, 'take_profit_market', side === 'buy' ? 'sell' : 'buy', parseFloat(tradeAmount), undefined, { stopPrice: parseFloat(takeProfit), reduceOnly: true });
        }
      }

      if (user) await supabase.from('trades').insert({
        user_id: user.id,
        symbol: selectedSymbol,
        type: side,
        amount: parseFloat(tradeAmount),
        entry_price: market.price,
        status: 'open',
        leverage,
        stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
        take_profit: takeProfit ? parseFloat(takeProfit) : undefined,
        opened_at: new Date().toISOString(),
      });

      toast({ title: 'Trade opened!', description: `${side.toUpperCase()} ${tradeAmount} ${selectedSymbol}` });
      setTradeAmount('');
      setTradePercentage(0);
      setLimitPrice('');
      setStopLoss('');
      setTakeProfit('');
      fetchOpenTrades();
    } catch (error: any) {
      toast({ title: 'Trade failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTrade = async (tradeId: string, trade: Trade) => {
    setLoading(true);
    try {
      const market = markets.find(m => m.symbol === trade.symbol);
      const currentPrice = market?.price || 0;
      const profitLoss = trade.type === 'buy'
        ? (currentPrice - trade.entry_price) * trade.amount * (trade.leverage || 1)
        : (trade.entry_price - currentPrice) * trade.amount * (trade.leverage || 1);

      if (market?.category === 'crypto') {
        await binance.createMarketOrder(trade.symbol, trade.type === 'buy' ? 'sell' : 'buy', trade.amount, undefined, { reduceOnly: true });
      }

      await supabase.from('trades').update({
        status: 'closed',
        profit_loss: profitLoss,
        closed_at: new Date().toISOString(),
      }).eq('id', tradeId);

      toast({ title: profitLoss >= 0 ? 'Trade closed with profit!' : 'Trade closed', description: `P/L: ${profitLoss.toFixed(2)}` });
      fetchOpenTrades();
    } catch (error: any) {
      toast({ title: 'Close failed', description: error.message, variant: 'destructive' });
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

  const suggestAiStopLoss = () => {
    const market = markets.find(m => m.symbol === selectedSymbol);
    if (!market) return;
    const suggested = calculateAIStopLoss(market, 'buy', aiSignals);
    setStopLoss(suggested.toFixed(4));
    toast({ title: 'AI Stop Loss', description: `Smart SL: ${suggested.toFixed(4)} (2-3% risk)`, variant: 'default' });
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-black"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;
  }

  if (!user) return null;

  const currentMarket = markets.find(m => m.symbol === selectedSymbol);
  const tradeValue = parseFloat(tradeAmount || '0') * (currentMarket?.price || 0);
  const requiredMargin = tradeValue / leverage;
  const maxTradeValue = balance * leverage;
  const change24h = currentMarket?.change24h ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_70%)]" style={{ zIndex: 0 }} />
      <div className="fixed inset-0 opacity-10" style={{ zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
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
              {(isMarketListOpen || window.innerWidth >= 1024) && (
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
                      {selectedSymbol.includes('.NS') && <span className="text-xs px-2 py-1 rounded-full bg-blue-900/30 text-blue-400 border border-blue-500/30">🇮🇳 INDIA</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-4xl font-mono font-bold">$<NumberAnimation value={currentMarket?.price || 0} format={(v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /></span>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${change24h >= 0 ? 'bg-white/[0.08] text-white border border-white/20' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50'}`}>
                        {change24h >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        <span className="text-lg font-bold"><NumberAnimation value={Math.abs(change24h)} format={(v) => `${v.toFixed(2)}%`} /></span>
                      </div>
                    </div>
                  </div>
                  
                  {aiSignals.find(s => s.symbol === selectedSymbol) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 rounded-lg border text-sm ${
                        aiSignals.find(s => s.symbol === selectedSymbol)?.signal.includes('BUY')
                          ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300'
                          : 'bg-red-900/30 border-red-500/50 text-red-300'
                      }`}
                    >
                      <div className="font-bold">
                        {aiSignals.find(s => s.symbol === selectedSymbol)?.signal.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs opacity-80 mt-1">
                        {(aiSignals.find(s => s.symbol === selectedSymbol)?.confidence || 0) * 100 | 0}% Confidence
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div className="h-[500px] sm:h-[600px] rounded-xl overflow-hidden border border-white/10">
                  <TradingViewWidget symbol={currentMarket?.category === 'crypto' ? `BINANCE:${selectedSymbol}` : `${selectedSymbol}`} />
                </div>
              </GlassCard>

              <AITradingSignals signals={aiSignals} markets={markets} />

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
                        const market = markets.find(m => m.symbol === trade.symbol);
                        const currentPrice = market?.price || 0;
                        const tradeLeverage = trade.leverage || 1;
                        const unrealizedPL = trade.type === 'buy' ? (currentPrice - trade.entry_price) * trade.amount * tradeLeverage : (trade.entry_price - currentPrice) * trade.amount * tradeLeverage;
                        const plPercentage = (unrealizedPL / (trade.amount * trade.entry_price)) * 100;

                        return (
                          <motion.div key={trade.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 rounded-xl border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.02] transition-all duration-200">
                            <div className="col-span-1 md:col-span-2">
                              <div className="font-bold text-white text-lg">{trade.symbol}</div>
                              <div className="text-xs text-zinc-500">{new Date(trade.opened_at).toLocaleDateString()}</div>
                            </div>
                            <div className="col-span-1 md:text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${trade.type === 'buy' ? 'bg-white/[0.08] text-white border border-white/20' : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50'}`}>
                                {trade.type === 'buy' ? '↑' : '↓'} {trade.type.toUpperCase()}
                              </span>
                            </div>
                            <div className="col-span-1 md:text-center">
                              <div className="flex items-center justify-start md:justify-center gap-1">
                                <Zap className="h-3 w-3 text-white" />
                                <span className="font-bold text-white">{tradeLeverage}x</span>
                              </div>
                            </div>
                            <div className="col-span-1 md:col-span-2 md:text-right">
                              <div className="text-white font-mono font-semibold">$<NumberAnimation value={trade.entry_price} format={(v) => v.toFixed(2)} /></div>
                            </div>
                            <div className="col-span-1 md:col-span-2 md:text-right">
                              <div className="text-white font-mono font-semibold">$<NumberAnimation value={currentPrice} format={(v) => v.toFixed(2)} /></div>
                            </div>
                            <div className="col-span-1 md:text-right">
                              <div className="text-zinc-300 font-mono"><NumberAnimation value={trade.amount} format={(v) => v.toFixed(4)} /></div>
                            </div>
                            <div className="col-span-1 md:col-span-2 md:text-right">
                              <div className={`inline-flex flex-col items-end px-3 py-2 rounded-lg ${unrealizedPL >= 0 ? 'bg-emerald-900/30 border border-emerald-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
                                <span className={`text-lg font-bold ${unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{unrealizedPL >= 0 ? '+' : ''}<NumberAnimation value={unrealizedPL} format={(v) => v.toFixed(2)} /></span>
                                <span className={`text-xs ${unrealizedPL >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>{plPercentage >= 0 ? '+' : ''}{plPercentage.toFixed(2)}%</span>
                              </div>
                            </div>
                            <div className="col-span-1 md:text-right">
                              <button onClick={() => handleCloseTrade(trade.id, trade)} disabled={loading} className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg shadow-red-500/20 disabled:opacity-50">Close</button>
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
                  <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-lg border border-white/10">
                    {['market', 'limit'].map(type => (
                      <button key={type} onClick={() => setOrderType(type as 'market' | 'limit')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${orderType === type ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</button>
                    ))}
                  </div>

                  <LeverageSlider leverage={leverage} setLeverage={setLeverage} />

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 font-medium">Amount</label>
                    <div className="relative">
                      <input type="number" step="0.0001" placeholder="0.00" value={tradeAmount} onChange={e => { setTradeAmount(e.target.value); setTradePercentage(0); }} className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-medium">{selectedSymbol.split('USDT')[0] || selectedSymbol}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 100].map(percent => (
                      <button key={percent} onClick={() => handlePercentageSelect(percent)} className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tradePercentage === percent ? 'bg-white text-black shadow-lg shadow-white/20' : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white border border-zinc-700/50'}`}>{percent}%</button>
                    ))}
                  </div>

                  {orderType === 'limit' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                      <label className="text-sm text-zinc-300 font-medium">Limit Price</label>
                      <input type="number" step="0.01" placeholder={currentMarket?.price.toString() || "0.00"} value={limitPrice} onChange={e => setLimitPrice(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all" />
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-zinc-300 font-medium">AI Stop Loss</label>
                      <button onClick={suggestAiStopLoss} className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        AI Suggest
                      </button>
                    </div>
                    <input type="number" step="0.01" placeholder="0.00" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 font-medium">Take Profit</label>
                    <input type="number" step="0.01" placeholder="0.00" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all" />
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
        .slider::-webkit-slider-thumb { appearance: none; width: 20px; height: 20px; border-radius: 50%; background: white; cursor: pointer; box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2); transition: all 0.2s; }
        .slider::-webkit-slider-thumb:hover { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.3); transform: scale(1.1); }
        .slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: white; cursor: pointer; border: none; box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2); transition: all 0.2s; }
        .slider::-moz-range-thumb:hover { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.3); transform: scale(1.1); }
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