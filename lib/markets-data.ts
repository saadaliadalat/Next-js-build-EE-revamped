export interface Market {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: string;
  marketCap?: string;
  category: 'crypto' | 'forex' | 'stocks' | 'commodities';
  sparkline?: { time: number; close: number }[];
}

export const marketsData: Market[] = [
  // Existing Crypto
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    price: 122900,
    change24h: 2.45,
    volume24h: '$28.5B',
    marketCap: '$2.4T',
    category: 'crypto',
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    price: 4502.12,
    change24h: 3.12,
    volume24h: '$15.2B',
    marketCap: '$540B',
    category: 'crypto',
  },
  {
    symbol: 'BNB/USD',
    name: 'Binance Coin',
    price: 312.45,
    change24h: -1.25,
    volume24h: '$1.8B',
    marketCap: '$48B',
    category: 'crypto',
  },
  {
    symbol: 'SOL/USD',
    name: 'Solana',
    price: 98.32,
    change24h: 5.67,
    volume24h: '$2.1B',
    marketCap: '$42B',
    category: 'crypto',
  },
  {
    symbol: 'XRP/USD',
    name: 'Ripple',
    price: 2.96,
    change24h: -0.82,
    volume24h: '$1.2B',
    marketCap: '$165B',
    category: 'crypto',
  },
  // New Crypto (Binance-like, Oct 2025 listings)
  {
    symbol: 'DOGE/USD',
    name: 'Dogecoin',
    price: 0.264,
    change24h: 4.47,
    volume24h: '$1.2B',
    marketCap: '$39B',
    category: 'crypto',
  },
  {
    symbol: 'LINK/USD',
    name: 'Chainlink',
    price: 18.50,
    change24h: 2.10,
    volume24h: '$950M',
    marketCap: '$11B',
    category: 'crypto',
  },
  {
    symbol: 'AVAX/USD',
    name: 'Avalanche',
    price: 30.16,
    change24h: 0.56,
    volume24h: '$600M',
    marketCap: '$12B',
    category: 'crypto',
  },
  {
    symbol: 'MATIC/USD',
    name: 'Polygon',
    price: 0.75,
    change24h: -0.50,
    volume24h: '$400M',
    marketCap: '$7B',
    category: 'crypto',
  },
  {
    symbol: 'HYPER/USD',
    name: 'Bitcoin Hyper',
    price: 0.013,
    change24h: 12.30,
    volume24h: '$30M',
    marketCap: '$50M',
    category: 'crypto',
  },
  {
    symbol: 'MORPHO/USD',
    name: 'Morpho',
    price: 0.85,
    change24h: 20.00,
    volume24h: '$120M',
    marketCap: '$200M',
    category: 'crypto',
  },
  {
    symbol: 'ASTER/USD',
    name: 'Aster',
    price: 1.20,
    change24h: 4.50,
    volume24h: '$80M',
    marketCap: '$150M',
    category: 'crypto',
  },
  {
    symbol: 'FLOKI/USD',
    name: 'Floki Inu',
    price: 0.00015,
    change24h: 25.00,
    volume24h: '$200M',
    marketCap: '$1.5B',
    category: 'crypto',
  },
  {
    symbol: 'MASK/USD',
    name: 'Mask Network',
    price: 2.45,
    change24h: 8.20,
    volume24h: '$150M',
    marketCap: '$250M',
    category: 'crypto',
  },
  // Existing Forex
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    price: 1.0856,
    change24h: 0.15,
    volume24h: '$310B',
    category: 'forex',
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    price: 1.2645,
    change24h: -0.22,
    volume24h: '$180B',
    category: 'forex',
  },
  {
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    price: 148.52,
    change24h: 0.38,
    volume24h: '$290B',
    category: 'forex',
  },
  {
    symbol: 'AUD/USD',
    name: 'Australian Dollar / US Dollar',
    price: 0.6523,
    change24h: 0.45,
    volume24h: '$95B',
    category: 'forex',
  },
  {
    symbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    price: 1.3587,
    change24h: -0.18,
    volume24h: '$85B',
    category: 'forex',
  },
  {
    symbol: 'CHF/USD',
    name: 'Swiss Franc / US Dollar',
    price: 1.045,
    change24h: 0.25,
    volume24h: '$75B',
    category: 'forex',
  },
  // Existing Stocks
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 178.45,
    change24h: 1.25,
    volume24h: '$85M',
    marketCap: '$2.8T',
    category: 'stocks',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 382.75,
    change24h: 0.85,
    volume24h: '$45M',
    marketCap: '$2.9T',
    category: 'stocks',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 142.30,
    change24h: -0.45,
    volume24h: '$38M',
    marketCap: '$1.8T',
    category: 'stocks',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 152.85,
    change24h: 2.15,
    volume24h: '$72M',
    marketCap: '$1.6T',
    category: 'stocks',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 248.50,
    change24h: -1.85,
    volume24h: '$95M',
    marketCap: '$780B',
    category: 'stocks',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 120.45,
    change24h: -0.65,
    volume24h: '$150M',
    marketCap: '$1.2T',
    category: 'stocks',
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    price: 145.30,
    change24h: 0.95,
    volume24h: '$60M',
    marketCap: '$420B',
    category: 'stocks',
  },
  // Existing Commodities
  {
    symbol: 'XAU/USD',
    name: 'Gold',
    price: 2048.50,
    change24h: 0.65,
    volume24h: '$180B',
    category: 'commodities',
  },
  {
    symbol: 'XAG/USD',
    name: 'Silver',
    price: 24.32,
    change24h: 1.12,
    volume24h: '$45B',
    category: 'commodities',
  },
  {
    symbol: 'WTI',
    name: 'Crude Oil (WTI)',
    price: 78.45,
    change24h: -0.95,
    volume24h: '$120B',
    category: 'commodities',
  },
  {
    symbol: 'BRENT',
    name: 'Crude Oil (Brent)',
    price: 82.75,
    change24h: -0.75,
    volume24h: '$95B',
    category: 'commodities',
  },
  {
    symbol: 'NG',
    name: 'Natural Gas',
    price: 2.845,
    change24h: 2.35,
    volume24h: '$28B',
    category: 'commodities',
  },
  {
    symbol: 'COPPER',
    name: 'Copper',
    price: 4.15,
    change24h: -0.35,
    volume24h: '$15B',
    category: 'commodities',
  },
];

export function getMarketsByCategory(category: Market['category']) {
  return marketsData.filter((m) => m.category === category);
}

export function searchMarkets(query: string) {
  const lowerQuery = query.toLowerCase();
  return marketsData.filter(
    (m) =>
      m.symbol.toLowerCase().includes(lowerQuery) ||
      m.name.toLowerCase().includes(lowerQuery)
  );
}