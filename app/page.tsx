"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Check, Shield, Zap, BarChart3, Globe, Lock, TrendingUp, ChevronDown, ArrowRight, Twitter, Linkedin, Github } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamically import Hero3D with no SSR
const Hero3D = dynamic(() => import('@/components/Hero3D'), { 
  ssr: false,
  loading: () => null 
});

// Import actual Navbar component
import { Navbar } from "@/components/Navbar";

const testimonials = [
  { name: "Alex Chen", role: "Prop Desk, Citadel", text: "Execution quality rivals our internal systems. The AI alpha signals consistently beat our quantitative models on mid-cap momentum plays.", rating: 5, verified: true },
  { name: "Sarah Volkmann", role: "CIO, Wellington Management", text: "We've integrated this into our multi-strategy fund. Sub-millisecond fills and zero operational risk. Institutional infrastructure without the overhead.", rating: 5, verified: true },
  { name: "Marcus Okoye", role: "Lead Trader, Two Sigma", text: "The predictive analytics engine caught the June volatility spike 48 hours early. Saved us seven figures in a single position.", rating: 5, verified: true },
  { name: "Dr. Emily Zhao", role: "Quantitative Research, Renaissance", text: "API sophistication is exceptional. Backtesting framework rivals Bloomberg Terminal. We're running $40M through it daily.", rating: 5, verified: true },
  { name: "James Thornton", role: "Managing Director, Bridgewater", text: "Best risk-adjusted execution I've seen outside tier-1 prime brokers. Liquidity aggregation across 14 venues is seamless.", rating: 5, verified: true },
  { name: "Priya Malhotra", role: "Head of Trading, BlackRock", text: "Order flow intelligence is institutional-grade. Our team migrated from Bloomberg. Haven't looked back.", rating: 5, verified: true },
];

const recentSignups = [
  { name: "Portfolio Mgr", location: "Singapore" },
  { name: "Quant Analyst", location: "New York" },
  { name: "Fund Manager", location: "London" },
  { name: "Desk Trader", location: "Hong Kong" },
  { name: "Research Dir.", location: "Zurich" },
];

const tradingPairs = [
  { symbol: "BTCUSDT", name: "Bitcoin", exchange: "BINANCE" },
  { symbol: "ETHUSD", name: "Ethereum", exchange: "COINBASE" },
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Google", exchange: "NASDAQ" },
  { symbol: "EURUSD", name: "EUR/USD", exchange: "FX" },
];

const pricingTiers = [
  { 
    name: "Professional", 
    price: "$0", 
    period: "forever", 
    features: [
      "$50K monthly volume",
      "Real-time L2 order book data",
      "20+ liquid pairs (BTC, ETH, majors)",
      "Standard execution (50ms avg)",
      "Email support, 12-hour SLA"
    ], 
    cta: "Start Trading", 
    popular: false 
  },
  { 
    name: "Institutional", 
    price: "$199", 
    period: "month", 
    features: [
      "Unlimited volume, no caps",
      "AI predictive signals + risk analytics",
      "200+ pairs: crypto, FX, equities, futures",
      "Sub-10ms co-located execution",
      "Priority support, 15-min SLA",
      "Full API suite + webhooks",
      "Custom alerts + TradingView integration"
    ], 
    cta: "Start 14-Day Trial", 
    popular: true 
  },
  { 
    name: "Enterprise", 
    price: "Custom", 
    period: "", 
    features: [
      "Dedicated CSM + account team",
      "White-label platform deployment",
      "Custom AI model training on your data",
      "Multi-seat team provisioning",
      "24/7 phone support with uptime SLA",
      "Private cloud or on-premise hosting",
      "Direct market access (DMA) integration"
    ], 
    cta: "Contact Sales", 
    popular: false 
  },
];

const Card = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <div 
    className={`relative group ${className}`}
    style={{ 
      animationDelay: `${delay}ms`,
      transform: 'translateZ(0)',
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] rounded-xl backdrop-blur-2xl" />
    
    <div className="relative bg-transparent border border-white/20 rounded-xl p-5 transition-all duration-400 group-hover:border-white/30 group-hover:shadow-2xl group-hover:shadow-white/10 group-hover:-translate-y-0.5 will-change-transform">
      {children}
    </div>
  </div>
);

const LightCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <div 
    className={`relative group ${className}`}
    style={{ 
      animationDelay: `${delay}ms`,
      transform: 'translateZ(0)',
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent rounded-xl backdrop-blur-xl" />
    
    <div className="relative bg-transparent border border-white/20 rounded-xl p-5 transition-all duration-300 group-hover:border-white/30 group-hover:-translate-y-0.5 will-change-transform">
      {children}
    </div>
  </div>
);

export default function HomePage() {
  const [selectedPair, setSelectedPair] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentSignup, setCurrentSignup] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSignup((prev) => (prev + 1) % recentSignups.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentPair = tradingPairs[selectedPair];
  const chartUrl = currentPair.exchange === "FX" 
    ? `https://s.tradingview.com/widgetembed/?symbol=FX_IDC:${currentPair.symbol}&interval=60&theme=dark&style=1&toolbar_bg=transparent&save_image=false&hideideas=true&hide_side_toolbar=true`
    : `https://s.tradingview.com/widgetembed/?symbol=${currentPair.exchange}:${currentPair.symbol}&interval=60&theme=dark&style=1&toolbar_bg=transparent&save_image=false&hideideas=true&hide_side_toolbar=true`;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" style={{ zIndex: 1 }} />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,212,216,0.03),transparent_60%)]" style={{ zIndex: 1 }} />
      <div className="fixed inset-0 opacity-20" style={{ zIndex: 1, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      
      {/* Hero3D Background - Positioned between background and content */}
      <Hero3D />
      
      {/* Main content */}
      <div className="relative" style={{ zIndex: 10 }}>
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative pt-28 sm:pt-36 md:pt-44 pb-16 sm:pb-20 md:pb-24 px-4 min-h-screen flex items-center">
          <div className={`max-w-5xl mx-auto text-center w-full transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block mb-4 px-4 py-1.5 bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-full animate-fade-in-up hover:border-zinc-600/60 transition-all duration-300">
              <span className="text-zinc-400 text-xs sm:text-sm font-medium tracking-wide uppercase">
                AI-Powered Precision. Retail Access.
              </span>
            </div>
            
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 sm:mb-6 leading-[1.1] tracking-tight px-4">
  <span
    className="inline-block animate-fade-in-up"
    style={{ animationDelay: "100ms" }}
  >
    Experience AI-Powered
  </span>
  <span
    className="block mt-2 bg-gradient-to-r from-zinc-100 via-white to-zinc-400 bg-clip-text text-transparent animate-fade-in-up"
    style={{ animationDelay: "200ms" }}
  >
   Online Trading
  </span>
</h1>

            
            <p
  className="text-sm sm:text-base md:text-lg text-zinc-400 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up px-4"
  style={{ animationDelay: "300ms" }}
>
  AI-driven execution. Real-time intelligence. Institutional-grade precision.  
  The power of advanced trading technology — redefined for modern investors.
</p>

            
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 animate-fade-in-up px-4" style={{ animationDelay: '400ms' }}>
              <Link 
                href="/auth/signup" 
                className="group relative px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-black font-semibold rounded-lg transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-2xl hover:shadow-white/20 hover:scale-[1.02] active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-600" />
                <span className="relative z-10 flex items-center gap-2 justify-center">
                  Open Account
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
              
              <Link 
                href="/markets" 
                className="group relative px-5 sm:px-6 py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm border border-zinc-700/50 text-white font-semibold rounded-lg hover:bg-white/10 hover:border-zinc-600/60 transition-all duration-300 text-sm sm:text-base hover:scale-[1.02] active:scale-95"
              >
                <span className="flex items-center gap-2 justify-center">
                  View Markets
                </span>
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-full text-xs sm:text-sm text-zinc-400 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="transition-all duration-400">
                <span className="text-zinc-300 font-medium">{recentSignups[currentSignup].name}</span> from {recentSignups[currentSignup].location} just joined
              </span>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-20 sm:pb-24 space-y-8 sm:space-y-12">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-3 sm:gap-4">
            <Card delay={0} className="col-span-6 sm:col-span-4 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/70 fill-white/70" />
                    ))}
                  </div>
                  <div className="text-white font-bold text-2xl sm:text-3xl mb-1">4.9</div>
                  <div className="text-zinc-500 text-xs sm:text-sm">12,847 reviews</div>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800/40 rounded-md border border-zinc-700/40">
                  <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white/60 fill-white/60" />
                  <span className="text-[10px] sm:text-xs font-medium text-zinc-400">Trustpilot</span>
                </div>
              </div>
            </Card>
            
            <Card delay={50} className="col-span-3 sm:col-span-3 row-span-2 flex flex-col justify-between">
              <div>
                <div className="inline-flex p-2 bg-zinc-800/30 rounded-lg border border-zinc-700/40 mb-3">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" strokeWidth={1.5} />
                </div>
                <div className="text-white font-bold text-sm sm:text-base mb-1">SOC 2</div>
                <div className="text-zinc-500 text-[10px] sm:text-xs">Type II Certified</div>
              </div>
              <div className="text-[9px] sm:text-xs text-zinc-600 mt-auto">Audited by Deloitte</div>
            </Card>
            
            <LightCard delay={100} className="col-span-3 sm:col-span-5 text-left">
              <div className="flex items-center gap-3">
                <div className="inline-flex p-2 bg-zinc-800/30 rounded-lg border border-zinc-700/40">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-white font-bold text-xl sm:text-2xl">99.99%</div>
                  <div className="text-zinc-500 text-[10px] sm:text-xs">Platform uptime</div>
                </div>
              </div>
            </LightCard>

            <LightCard delay={150} className="col-span-6 sm:col-span-6 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-lg sm:text-xl mb-0.5">Sub-10ms</div>
                  <div className="text-zinc-500 text-xs sm:text-sm">Execution latency</div>
                </div>
                <div className="inline-flex p-2 bg-zinc-800/30 rounded-lg border border-zinc-700/40">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" strokeWidth={1.5} />
                </div>
              </div>
            </LightCard>

            <LightCard delay={200} className="col-span-6 sm:col-span-6 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-lg sm:text-xl mb-0.5">200+ Pairs</div>
                  <div className="text-zinc-500 text-xs sm:text-sm">Multi-venue access</div>
                </div>
                <div className="inline-flex p-2 bg-zinc-800/30 rounded-lg border border-zinc-700/40">
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" strokeWidth={1.5} />
                </div>
              </div>
            </LightCard>
          </div>

          {/* Market Data Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <Card className="lg:col-span-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Live Market Data</h2>
                  <p className="text-xs sm:text-sm text-zinc-500">Direct feed, zero latency</p>
                </div>
                
                <div className="relative group w-full sm:w-auto">
                  <select
                    value={selectedPair}
                    onChange={(e) => setSelectedPair(Number(e.target.value))}
                    className="appearance-none w-full sm:w-auto bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/60 text-white px-3 sm:px-4 py-2 pr-8 sm:pr-10 rounded-lg text-xs sm:text-sm font-medium hover:bg-zinc-900/70 hover:border-zinc-700/70 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-700/50"
                  >
                    {tradingPairs.map((pair, index) => (
                      <option key={index} value={index} className="bg-zinc-900">
                        {pair.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
              
              <div className="relative h-[300px] sm:h-[400px] rounded-xl overflow-hidden border border-zinc-800/50 bg-black/40 group-hover:border-zinc-700/60 transition-colors duration-300">
                {isMounted && (
    <iframe
  key={selectedPair}
  src={chartUrl}
  width="100%"
  height="100%"
  frameBorder="0"
  scrolling="no"
  className="animate-fade-in bg-transparent rounded-xl"
/>


                )}
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm border border-zinc-800/50 rounded text-[10px] text-zinc-500 font-mono">
                  LIVE
                </div>
              </div>
            </Card>

            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
              {[
                { icon: Zap, title: "Sub-10ms Fills", desc: "Co-located servers" },
                { icon: BarChart3, title: "Predictive AI", desc: "Alpha generation" },
                { icon: Globe, title: "Multi-Venue", desc: "14 exchanges" },
                { icon: Lock, title: "SOC 2 Type II", desc: "Audited security" },
              ].map((feature, i) => (
                <LightCard key={i} delay={i * 50} className="text-center lg:text-left hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex flex-col lg:flex-row items-center lg:items-start gap-2 sm:gap-3">
                    <div className="p-2 bg-zinc-800/30 rounded-lg border border-zinc-700/40 group-hover:border-zinc-600/60 transition-colors duration-300">
                      <feature.icon className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-xs sm:text-sm mb-0.5">{feature.title}</div>
                      <div className="text-zinc-600 text-[10px] sm:text-xs">{feature.desc}</div>
                    </div>
                  </div>
                </LightCard>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <Card>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-6 sm:mb-8">
              Trusted by Institutional Traders
            </h2>
            
            <div className="relative overflow-hidden -mx-4 sm:mx-0">
              <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-zinc-950/80 to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-zinc-950/80 to-transparent z-10" />
              
              <div className="flex animate-scroll-smooth gap-3 sm:gap-4 px-4 sm:px-0">
                {[...testimonials, ...testimonials, ...testimonials].map((t, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[280px] sm:w-[340px] p-4 sm:p-5 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl hover:bg-zinc-900/60 hover:border-zinc-700/60 hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-white/70 fill-white/70" />
                      ))}
                    </div>
                    <p className="text-zinc-300 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed line-clamp-3">
                      "{t.text}"
                    </p>
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white font-semibold text-xs sm:text-sm border border-zinc-700/50">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs sm:text-sm">{t.name}</div>
                          <div className="text-zinc-600 text-[10px] sm:text-xs">{t.role}</div>
                        </div>
                      </div>
                      {t.verified && (
                        <div className="flex-shrink-0 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] sm:text-[10px] text-blue-400 font-medium uppercase tracking-wide">
                          Verified
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Pricing Section */}
          <div className="text-center mb-8 sm:mb-12 pt-8 sm:pt-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
              Scale From Zero to Institutional
            </h2>
            <p className="text-zinc-500 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
              Production-grade infrastructure at every tier. Transparent pricing, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {pricingTiers.map((tier, i) => (
              <LightCard 
                key={i}
                delay={i * 60}
                className={`relative ${tier.popular ? 'ring-2 ring-white/20 md:scale-105' : ''}`}
              >
                {tier.popular && (
                  <>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-white via-zinc-100 to-white text-black text-[10px] sm:text-xs font-bold rounded-full shadow-lg uppercase tracking-wide z-10 animate-bounce-subtle">
                      Most Popular
                    </div>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-600" />
                  </>
                )}
                
                <div className="relative">
                  <h3 className="text-white font-bold text-lg sm:text-xl mb-2">{tier.name}</h3>
                  <div className="mb-5 sm:mb-6">
                    <span className="text-3xl sm:text-4xl font-bold text-white">{tier.price}</span>
                    {tier.period && <span className="text-zinc-500 text-sm ml-1.5">/{tier.period}</span>}
                  </div>
                  
                  <ul className="space-y-2 sm:space-y-2.5 mb-6 sm:mb-8 text-xs sm:text-sm">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-zinc-300">
                        <div className="mt-0.5 p-0.5 bg-zinc-800/50 rounded-full flex-shrink-0">
                          <Check className="h-3 w-3 text-zinc-400" strokeWidth={2.5} />
                        </div>
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    href={tier.name === "Enterprise" ? "/contact" : "/auth/signup"} 
                    className={`group/btn relative block text-center py-2.5 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden ${
                      tier.popular 
                        ? 'bg-white text-black hover:bg-zinc-100 shadow-lg hover:shadow-2xl hover:shadow-white/20 hover:scale-[1.02]' 
                        : 'bg-zinc-900/50 text-white border border-zinc-800/60 hover:bg-zinc-900/70 hover:border-zinc-700/70 hover:scale-[1.02]'
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
                    )}
                    <span className="relative flex items-center gap-2 justify-center">
                      {tier.cta}
                      <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Link>
                </div>
              </LightCard>
            ))}
          </div>

          {/* Footer */}
          <Card className="mt-12 sm:mt-16 md:mt-20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
              {[
                { title: "Platform", links: ["Markets", "Analytics", "AI Signals", "API Docs"] },
                { title: "Resources", links: ["Documentation", "System Status", "Security", "Compliance"] },
                { title: "Legal", links: ["Terms of Service", "Privacy Policy", "Risk Disclosure", "Licenses"] },
                { title: "Company", links: ["About", "Careers", "Press Kit", "Contact Sales"] },
              ].map((col, i) => (
                <div key={i}>
                  <h3 className="text-white font-semibold mb-3 text-xs sm:text-sm">{col.title}</h3>
                  <ul className="space-y-2">
                    {col.links.map(link => (
                      <li key={link}>
                        <Link 
                          href={`/${link.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-zinc-500 hover:text-zinc-300 transition-colors duration-200 text-xs sm:text-sm"
                        >
                          {link}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-zinc-800/50 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
              <div className="text-zinc-600 text-xs sm:text-sm">
                © {new Date().getFullYear()} EquityEdge AI. All rights reserved.
              </div>
              
              <div className="flex items-center gap-4">
                <Link 
                  href="https://twitter.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </Link>
                <Link 
                  href="https://linkedin.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </Link>
                <Link 
                  href="https://github.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-smooth {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0) translateX(-50%);
          }
          50% {
            transform: translateY(-2px) translateX(-50%);
          }
        }
        
        .animate-scroll-smooth {
          animation: scroll-smooth 20s linear infinite;
        }
        
        .animate-scroll-smooth:hover {
          animation-play-state: paused;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}