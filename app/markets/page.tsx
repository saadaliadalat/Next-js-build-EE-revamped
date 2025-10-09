"use client";

import { useState, useEffect, useMemo, memo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Search, TrendingUp, TrendingDown, Star, Activity, Zap, Globe, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

type SparklineData = { time: number; close: number }[];

type Market = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: string;
  high24h: number;
  low24h: number;
  category: string;
  marketCap?: string;
  sparkline?: SparklineData;
};

const Card = memo(({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <div 
    className={`relative group ${className}`}
    style={{ 
      animationDelay: `${delay}ms`,
      transform: 'translateZ(0)',
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] rounded-xl backdrop-blur-2xl" />
    <div className="relative bg-transparent border border-white/20 rounded-xl p-6 transition-all duration-400 group-hover:border-white/30 group-hover:shadow-2xl group-hover:shadow-white/10 will-change-transform">
      {children}
    </div>
  </div>
));

const LightCard = memo(({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <div 
    className={`relative group ${className}`}
    style={{ 
      animationDelay: `${delay}ms`,
      transform: 'translateZ(0)',
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent rounded-xl backdrop-blur-xl" />
    <div className="relative bg-transparent border border-white/20 rounded-xl p-4 transition-all duration-300 group-hover:border-white/30 group-hover:-translate-y-0.5 will-change-transform">
      {children}
    </div>
  </div>
));

// Static data for forex, stocks, and commodities
const staticMarkets = {
  forex: [
    { symbol: "EURUSD", name: "Euro / US Dollar", price: 1.0876, change24h: 0.15, volume: "$342B", high24h: 1.0895, low24h: 1.0852, category: "forex" },
    { symbol: "GBPUSD", name: "British Pound / US Dollar", price: 1.2634, change24h: -0.23, volume: "$287B", high24h: 1.2658, low24h: 1.2612, category: "forex" },
    { symbol: "USDJPY", name: "US Dollar / Japanese Yen", price: 149.87, change24h: 0.45, volume: "$298B", high24h: 150.12, low24h: 149.34, category: "forex" },
    { symbol: "AUDUSD", name: "Australian Dollar / US Dollar", price: 0.6523, change24h: 0.38, volume: "$156B", high24h: 0.6545, low24h: 0.6498, category: "forex" },
    { symbol: "USDCAD", name: "US Dollar / Canadian Dollar", price: 1.3645, change24h: -0.12, volume: "$134B", high24h: 1.3672, low24h: 1.3631, category: "forex" },
    { symbol: "USDCHF", name: "US Dollar / Swiss Franc", price: 0.8734, change24h: 0.28, volume: "$178B", high24h: 0.8756, low24h: 0.8712, category: "forex" },
  ],
  stocks: [
    { symbol: "AAPL", name: "Apple Inc.", price: 178.45, change24h: 1.23, volume: "$52.3B", high24h: 179.80, low24h: 176.90, marketCap: "$2.78T", category: "stocks" },
    { symbol: "MSFT", name: "Microsoft Corporation", price: 378.91, change24h: 0.89, volume: "$38.7B", high24h: 381.20, low24h: 376.50, marketCap: "$2.82T", category: "stocks" },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 141.23, change24h: -0.45, volume: "$28.4B", high24h: 142.80, low24h: 140.50, marketCap: "$1.78T", category: "stocks" },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.34, change24h: 2.15, volume: "$42.1B", high24h: 180.20, low24h: 175.60, marketCap: "$1.85T", category: "stocks" },
    { symbol: "NVDA", name: "NVIDIA Corporation", price: 875.60, change24h: 3.67, volume: "$67.8B", high24h: 889.40, low24h: 845.20, marketCap: "$2.16T", category: "stocks" },
    { symbol: "TSLA", name: "Tesla Inc.", price: 242.67, change24h: -1.89, volume: "$45.3B", high24h: 248.90, low24h: 239.80, marketCap: "$771.2B", category: "stocks" },
    { symbol: "META", name: "Meta Platforms Inc.", price: 496.78, change24h: 1.54, volume: "$31.2B", high24h: 502.30, low24h: 489.50, marketCap: "$1.26T", category: "stocks" },
    { symbol: "JPM", name: "JPMorgan Chase & Co.", price: 198.45, change24h: 0.67, volume: "$12.8B", high24h: 200.20, low24h: 196.70, marketCap: "$578.3B", category: "stocks" },
  ],
  commodities: [
    { symbol: "XAUUSD", name: "Gold", price: 2034.50, change24h: 0.78, volume: "$187B", high24h: 2045.30, low24h: 2023.10, category: "commodities" },
    { symbol: "XAGUSD", name: "Silver", price: 23.45, change24h: 1.23, volume: "$34B", high24h: 23.89, low24h: 23.12, category: "commodities" },
    { symbol: "USOIL", name: "Crude Oil WTI", price: 78.34, change24h: -0.89, volume: "$156B", high24h: 79.45, low24h: 77.80, category: "commodities" },
    { symbol: "UKOIL", name: "Brent Crude Oil", price: 82.67, change24h: -0.56, volume: "$142B", high24h: 83.78, low24h: 81.90, category: "commodities" },
    { symbol: "NATGAS", name: "Natural Gas", price: 2.87, change24h: 2.34, volume: "$45B", high24h: 2.95, low24h: 2.78, category: "commodities" },
    { symbol: "COPPER", name: "Copper", price: 3.85, change24h: 0.45, volume: "$28B", high24h: 3.92, low24h: 3.81, category: "commodities" },
  ]
};

const cryptoSymbols = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'BNBUSDT', name: 'BNB' },
  { symbol: 'SOLUSDT', name: 'Solana' },
  { symbol: 'XRPUSDT', name: 'XRP' },
  { symbol: 'ADAUSDT', name: 'Cardano' },
  { symbol: 'AVAXUSDT', name: 'Avalanche' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin' },
];

const MarketRow = memo(({ market, index }: { market: Market; index: number }) => (
  <div 
    className="grid grid-cols-12 gap-2 p-3 border-b border-white/10 hover:bg-white/[0.03] transition-colors duration-300 items-center"
    style={{ animationDelay: `${index * 50}ms`, animation: 'fadeIn 0.5s ease-out' }}
  >
    <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
      <Star className="h-4 w-4 text-zinc-600 hover:text-yellow-400 cursor-pointer transition-colors duration-200" />
      <div>
        <div className="font-semibold text-white text-sm">{market.symbol}</div>
        <div className="text-xs text-zinc-400 truncate">{market.name}</div>
      </div>
    </div>

    <div className="col-span-4 sm:col-span-2 text-right sm:text-left">
      <div className="text-white font-mono text-sm font-medium">
        ${market.price < 1 
          ? market.price.toFixed(4) 
          : market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>

    <div className="col-span-4 sm:col-span-1 text-center">
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
        market.change24h >= 0 
          ? 'bg-emerald-900/20 text-emerald-300' 
          : 'bg-red-900/20 text-red-300'
      }`}>
        {market.change24h >= 0 ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        {Math.abs(market.change24h).toFixed(2)}%
      </div>
    </div>

    <div className="hidden md:block col-span-2">
      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={market.sparkline || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke={market.change24h >= 0 ? '#10b981' : '#ef4444'} 
            dot={false} 
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div className="col-span-4 sm:col-span-1 text-right">
      <div className="text-zinc-400 text-xs">{market.volume}</div>
    </div>

    <div className="hidden lg:block col-span-2 text-right">
      <div className="text-zinc-500 text-xs">
        H: ${market.high24h < 1 
          ? market.high24h.toFixed(4) 
          : market.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="text-zinc-500 text-xs">
        L: ${market.low24h < 1 
          ? market.low24h.toFixed(4) 
          : market.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>

    <div className="col-span-12 sm:col-span-1 flex justify-end items-center">
      <Link href={`/trade?symbol=${market.symbol}`}>
        <button className="px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-md hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
          Trade
        </button>
      </Link>
    </div>
  </div>
));

export default function MarketsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isVisible, setIsVisible] = useState(false);
  const [cryptoMarkets, setCryptoMarkets] = useState<Market[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [totalVolume, setTotalVolume] = useState('$0B');
  const [marketTrend, setMarketTrend] = useState(0);

  // Debounce function to batch updates
  useEffect(() => {
    if (pendingUpdates.length === 0) return;
    const timer = setTimeout(() => {
      setCryptoMarkets(pendingUpdates);
      setPendingUpdates([]);
    }, 100);
    return () => clearTimeout(timer);
  }, [pendingUpdates]);

  // Fetch initial crypto data and klines
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      const data = await response.json();
      
      const cryptoData: Market[] = cryptoSymbols
        .map(coin => {
          const ticker = data.find((t: any) => t.symbol === coin.symbol);
          if (ticker) {
            return {
              symbol: coin.symbol,
              name: coin.name,
              price: parseFloat(ticker.lastPrice),
              change24h: parseFloat(ticker.priceChangePercent),
              volume: `$${(parseFloat(ticker.quoteVolume) / 1000000000).toFixed(2)}B`,
              high24h: parseFloat(ticker.highPrice),
              low24h: parseFloat(ticker.lowPrice),
              category: 'crypto',
            };
          }
          return null;
        })
        .filter((item): item is Market => item !== null);

      // Fetch sparklines
      const klinePromises = cryptoSymbols.map(async (coin) => {
        const klineRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=5m&limit=288`);
        const klineData = await klineRes.json();
        return {
          symbol: coin.symbol,
          data: klineData.map((d: any[]) => ({ time: d[0], close: parseFloat(d[4]) })),
        };
      });
      
      const klineResults = await Promise.all(klinePromises);
      const cryptoDataWithSparklines = cryptoData.map(market => {
        const sparkline = klineResults.find(k => k.symbol === market.symbol)?.data;
        return { ...market, sparkline };
      });

      setCryptoMarkets(cryptoDataWithSparklines);
      
      const volume = data.reduce((acc: number, t: any) => acc + parseFloat(t.quoteVolume || 0), 0);
      setTotalVolume(`$${(volume / 1000000000).toFixed(1)}B`);
      
      const avgChange = cryptoData.length > 0 ? cryptoData.reduce((acc, m) => acc + m.change24h, 0) / cryptoData.length : 0;
      setMarketTrend(avgChange);
      
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    fetchInitialData();
  }, []);

  // WebSocket for live updates
  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    
    ws.onopen = () => console.log('WebSocket connected');
    
    ws.onmessage = (event) => {
      const tickers = JSON.parse(event.data);
      if (!Array.isArray(tickers)) return;
      
      setPendingUpdates((prev) => {
        const newMarkets = [...(prev.length > 0 ? prev : cryptoMarkets)];
        cryptoSymbols.forEach((coin) => {
          const ticker = tickers.find((t: any) => t.s === coin.symbol);
          if (ticker) {
            const index = newMarkets.findIndex((m) => m.symbol === coin.symbol);
            if (index !== -1) {
              newMarkets[index] = {
                ...newMarkets[index],
                price: parseFloat(ticker.c),
                change24h: parseFloat(ticker.P),
                volume: `$${(parseFloat(ticker.q) / 1000000000).toFixed(2)}B`,
                high24h: parseFloat(ticker.h),
                low24h: parseFloat(ticker.l),
              };
            }
          }
        });
        return newMarkets;
      });
      
      const volume = tickers.reduce((acc: number, t: any) => acc + parseFloat(t.q || 0), 0);
      setTotalVolume(`$${(volume / 1000000000).toFixed(1)}B`);
      
      const ourTickers = tickers.filter((t: any) => cryptoSymbols.some((c) => c.symbol === t.s));
      const avg = ourTickers.length > 0
        ? ourTickers.reduce((acc: number, t: any) => acc + parseFloat(t.P), 0) / ourTickers.length
        : 0;
      setMarketTrend(avg);
      
      setLastUpdate(new Date());
    };
    
    ws.onclose = () => console.log('WebSocket closed');
    
    return () => ws.close();
  }, [cryptoMarkets]);

  const getAllMarkets = useMemo(() => (): Market[] => {
    return [
      ...cryptoMarkets,
      ...staticMarkets.forex,
      ...staticMarkets.stocks,
      ...staticMarkets.commodities,
    ];
  }, [cryptoMarkets]);

  const filteredMarkets = useMemo(() => {
    let markets = activeTab === 'all'
      ? getAllMarkets()
      : activeTab === 'crypto'
      ? cryptoMarkets
      : staticMarkets[activeTab as keyof typeof staticMarkets];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      markets = markets.filter(m => 
        m.symbol.toLowerCase().includes(query) || 
        m.name.toLowerCase().includes(query)
      );
    }

    return markets;
  }, [activeTab, searchQuery, cryptoMarkets, getAllMarkets]);

  const topMovers = useMemo(() => {
    const allMarkets = getAllMarkets();
    
    const gainers = allMarkets
      .filter(m => m.change24h > 0)
      .sort((a, b) => b.change24h - a.change24h)
      .slice(0, 4);
    
    const losers = allMarkets
      .filter(m => m.change24h < 0)
      .sort((a, b) => a.change24h - b.change24h)
      .slice(0, 4);
    
    return { gainers, losers };
  }, [getAllMarkets]);

  const { gainers, losers } = topMovers;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_70%)]" style={{ zIndex: 1 }} />
      <div className="fixed inset-0 opacity-10" style={{ zIndex: 1, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="relative z-10">
        <Navbar />
        
        <section className="pt-24 pb-12 px-4 md:px-6">
          <div className={`max-w-7xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="inline-flex px-4 py-1.5 bg-zinc-800/40 backdrop-blur-md border border-zinc-700/40 rounded-full shadow-sm">
                <span className="text-zinc-300 text-sm font-medium tracking-wide uppercase flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  Live Markets
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={fetchInitialData}
                  className="p-2 bg-zinc-800/40 backdrop-blur-md border border-zinc-700/40 rounded-lg hover:bg-zinc-700/40 transition-all duration-200 shadow-sm"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 text-zinc-300 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div className="text-xs text-zinc-400" suppressHydrationWarning>
                  Updated: {lastUpdate ? lastUpdate.toLocaleTimeString([], { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'Loading...'}
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight tracking-tight">
              <span className="block bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">Global Markets</span>
            </h1>
            
            <p className="text-base md:text-lg text-zinc-400 mb-8 max-w-2xl leading-relaxed">
              Real-time insights across crypto, forex, stocks, and commodities. Powered by premium data feeds.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <LightCard className="hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{totalVolume}</div>
                  <div className="text-xs text-zinc-400">24h Volume</div>
                </div>
                <BarChart3 className="h-8 w-8 text-zinc-500" strokeWidth={1.5} />
              </div>
            </LightCard>

            <LightCard className="hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl font-bold ${marketTrend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {marketTrend >= 0 ? '+' : ''}{marketTrend.toFixed(2)}%
                  </div>
                  <div className="text-xs text-zinc-400">Market Trend</div>
                </div>
                {marketTrend >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-emerald-500" strokeWidth={1.5} />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" strokeWidth={1.5} />
                )}
              </div>
            </LightCard>

            <LightCard className="hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">200+</div>
                  <div className="text-xs text-zinc-400">Trading Pairs</div>
                </div>
                <Globe className="h-8 w-8 text-zinc-500" strokeWidth={1.5} />
              </div>
            </LightCard>

            <LightCard className="hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">14</div>
                  <div className="text-xs text-zinc-400">Exchanges</div>
                </div>
                <Zap className="h-8 w-8 text-zinc-500" strokeWidth={1.5} />
              </div>
            </LightCard>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-white/5 transition-shadow duration-300">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Top Gainers
                <span className="ml-auto text-xs text-zinc-400 font-normal">Live</span>
              </h3>
              <div className="space-y-3">
                {gainers.length > 0 ? gainers.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between p-3 bg-zinc-900/20 rounded-lg border border-zinc-800/30 hover:border-zinc-700/50 transition-colors duration-200">
                    <div>
                      <span className="text-white font-medium text-sm block">{item.symbol}</span>
                      <span className="text-zinc-400 text-xs">{item.category}</span>
                    </div>
                    <span className="text-emerald-400 font-semibold text-sm">+{item.change24h.toFixed(2)}%</span>
                  </div>
                )) : (
                  <div className="text-zinc-400 text-sm text-center py-4">Loading...</div>
                )}
              </div>
            </Card>

            <Card className="hover:shadow-white/5 transition-shadow duration-300">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-400" />
                Top Losers
                <span className="ml-auto text-xs text-zinc-400 font-normal">Live</span>
              </h3>
              <div className="space-y-3">
                {losers.length > 0 ? losers.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between p-3 bg-zinc-900/20 rounded-lg border border-zinc-800/30 hover:border-zinc-700/50 transition-colors duration-200">
                    <div>
                      <span className="text-white font-medium text-sm block">{item.symbol}</span>
                      <span className="text-zinc-400 text-xs">{item.category}</span>
                    </div>
                    <span className="text-red-400 font-semibold text-sm">{item.change24h.toFixed(2)}%</span>
                  </div>
                )) : (
                  <div className="text-zinc-400 text-sm text-center py-4">Loading...</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 md:p-0">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-700/50 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 px-4 md:px-0 hide-scrollbar">
              {['all', 'crypto', 'forex', 'stocks', 'commodities'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm ${
                    activeTab === tab
                      ? 'bg-white text-black'
                      : 'bg-zinc-900/30 text-zinc-300 hover:bg-zinc-900/50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-2 p-3 border-b border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <div className="col-span-12 sm:col-span-3">Asset</div>
              <div className="hidden sm:block col-span-2">Price</div>
              <div className="hidden sm:block col-span-1 text-center">24h</div>
              <div className="hidden md:block col-span-2">Trend</div>
              <div className="hidden sm:block col-span-1 text-right">Vol</div>
              <div className="hidden lg:block col-span-2 text-right">24h Range</div>
              <div className="hidden sm:block col-span-1 text-right"></div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {loading && cryptoMarkets.length === 0 ? (
                <div className="py-12 text-center text-zinc-400">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-zinc-500" />
                  Loading live data...
                </div>
              ) : filteredMarkets.length > 0 ? (
                filteredMarkets.map((market, index) => (
                  <MarketRow key={market.symbol} market={market} index={index} />
                ))
              ) : (
                <div className="py-12 text-center text-zinc-400">
                  No assets found
                </div>
              )}
            </div>
          </Card>
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
      `}</style>
    </div>
  );
}