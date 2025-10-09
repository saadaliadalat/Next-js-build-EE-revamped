"use client";

import { Navbar } from '@/components/Navbar';
import { useEffect, useState } from 'react';
import { Shield, Users, Globe, Award, TrendingUp, Lock, Zap, Target, Code, BarChart3, Briefcase, CheckCircle, ArrowRight, Linkedin, Twitter, Github, Building2, Rocket, Trophy, Server } from 'lucide-react';

const Card = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <div 
    className={`relative group ${className}`}
    style={{ 
      animationDelay: `${delay}ms`,
      transform: 'translateZ(0)',
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] rounded-xl backdrop-blur-2xl" />
    
    <div className="relative bg-transparent border border-white/20 rounded-xl p-6 transition-all duration-400 group-hover:border-white/30 group-hover:shadow-2xl group-hover:shadow-white/10 group-hover:-translate-y-0.5 will-change-transform">
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
    
    <div className="relative bg-transparent border border-white/20 rounded-xl p-6 transition-all duration-300 group-hover:border-white/30 group-hover:-translate-y-0.5 will-change-transform">
      {children}
    </div>
  </div>
);

const stats = [
  { number: "$2.4B+", label: "Daily Trading Volume", icon: TrendingUp },
  { number: "150K+", label: "Active Traders", icon: Users },
  { number: "99.99%", label: "Platform Uptime", icon: Shield },
  { number: "200+", label: "Trading Pairs", icon: Globe },
];

const values = [
  { 
    icon: Shield, 
    title: "Security First", 
    desc: "Bank-level encryption with SOC 2 Type II certification. Multi-signature cold storage protects 95% of customer assets. Regular penetration testing by independent security firms ensures institutional-grade protection."
  },
  { 
    icon: Users, 
    title: "Customer Obsessed", 
    desc: "24/7 support from experienced trading professionals with an average response time under 2 minutes. Dedicated account managers for institutional clients. Our NPS score of 72 reflects our commitment to excellence."
  },
  { 
    icon: Globe, 
    title: "Global Infrastructure", 
    desc: "Co-located servers in 12 data centers across 4 continents. Multi-venue aggregation across 14 exchanges. Localized support in 15+ languages with regional compliance teams ensuring regulatory adherence."
  },
  { 
    icon: Award, 
    title: "Industry Recognition", 
    desc: "Best Trading Platform 2024 by Financial Technology Awards. Rated #1 in execution quality by independent research. Featured in WSJ, Bloomberg, and Financial Times for innovation in retail trading infrastructure."
  },
];

const timeline = [
  { year: "2020", title: "Foundation", desc: "EquityEdge AI founded by former Goldman Sachs quants and Microsoft engineers with $12M seed funding from Sequoia Capital.", icon: Rocket },
  { year: "2021", title: "Platform Launch", desc: "Platform goes live with 20 trading pairs. Onboard first 10,000 users within 90 days. Execute $100M in trading volume in first quarter.", icon: Zap },
  { year: "2022", title: "Institutional Expansion", desc: "Institutional tier launched. SOC 2 Type II certification achieved. Expand to 100+ pairs across crypto, FX, and equities. Reach $500M daily volume.", icon: Building2 },
  { year: "2023", title: "AI Innovation", desc: "Proprietary predictive AI engine deployed. Sub-10ms execution latency achieved. Partnerships with Nasdaq and CME for direct market access. Series B funding ($50M) led by a16z.", icon: Target },
  { year: "2024", title: "Market Leadership", desc: "Surpass 150,000 active traders. $2.4B+ daily volume. Launch white-label solutions for institutional clients. Recognized as Best Trading Platform by FT Awards.", icon: Trophy },
];

const team = [
  { name: "Dr. James Chen", role: "CEO & Co-Founder", bio: "Former VP of Quantitative Trading at Goldman Sachs. PhD in Computer Science from MIT. 15 years building HFT systems.", initials: "JC" },
  { name: "Sarah Mitchell", role: "CTO & Co-Founder", bio: "Ex-Principal Engineer at Microsoft Azure. Led infrastructure for high-frequency data processing. Stanford graduate.", initials: "SM" },
  { name: "Marcus Okonkwo", role: "Head of Product", bio: "Former Product Lead at Bloomberg Terminal. 12 years designing institutional trading platforms. Stanford MBA.", initials: "MO" },
  { name: "Dr. Emily Zhao", role: "Chief Data Scientist", bio: "Previously at Renaissance Technologies. PhD in Machine Learning from Carnegie Mellon. Pioneer in algorithmic trading.", initials: "EZ" },
  { name: "David Thornton", role: "Head of Compliance", bio: "Former SEC examiner with 20 years in financial regulation. Expert in multi-jurisdictional compliance frameworks.", initials: "DT" },
  { name: "Priya Malhotra", role: "VP of Engineering", bio: "Ex-Google SRE lead. Built scalable systems serving billions of requests. Carnegie Mellon Computer Science.", initials: "PM" },
];

const technology = [
  { icon: Server, title: "Co-Located Infrastructure", desc: "Sub-10ms execution with servers in 12 global data centers" },
  { icon: Lock, title: "Military-Grade Security", desc: "AES-256 encryption, HSM key management, SOC 2 Type II certified" },
  { icon: Zap, title: "High-Frequency Architecture", desc: "Process 1M+ orders per second with microsecond precision" },
  { icon: BarChart3, title: "AI-Powered Analytics", desc: "Proprietary ML models trained on 10+ years of market data" },
  { icon: Code, title: "Enterprise APIs", desc: "RESTful & WebSocket APIs with 99.99% uptime SLA" },
  { icon: Target, title: "Smart Order Routing", desc: "Intelligent routing across 14 venues for best execution" },
];

const certifications = [
  { name: "SOC 2 Type II", body: "Audited by Deloitte" },
  { name: "ISO 27001", body: "Information Security" },
  { name: "PCI DSS Level 1", body: "Payment Security" },
  { name: "GDPR Compliant", body: "Data Protection" },
];

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" style={{ zIndex: 1 }} />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,212,216,0.03),transparent_60%)]" style={{ zIndex: 1 }} />
      <div className="fixed inset-0 opacity-20" style={{ zIndex: 1, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      
      <div className="relative" style={{ zIndex: 10 }}>
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className={`max-w-5xl mx-auto text-center transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block mb-4 px-4 py-1.5 bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-full">
              <span className="text-zinc-400 text-sm font-medium tracking-wide uppercase">
                Est. 2020
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              <span className="inline-block">Building the</span>
              <span className="block mt-2 bg-gradient-to-r from-zinc-100 via-white to-zinc-400 bg-clip-text text-transparent">
                Future of Trading
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              EquityEdge AI combines institutional-grade infrastructure with cutting-edge AI to democratize 
              access to global financial markets. We're building the platform that professional traders demand.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 pb-24 space-y-20">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <LightCard key={i} delay={i * 50}>
                <div className="text-center">
                  <div className="inline-flex p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/40 mb-4">
                    <stat.icon className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-sm text-zinc-500">{stat.label}</div>
                </div>
              </LightCard>
            ))}
          </div>

          {/* Mission Statement */}
          <Card>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Mission</h2>
              <p className="text-lg text-zinc-300 leading-relaxed mb-6">
                EquityEdge AI was founded in 2020 with a singular vision: to democratize access to institutional-grade 
                trading infrastructure. We believe that sophisticated execution, predictive analytics, and sub-millisecond 
                latency shouldn't be reserved for hedge funds and prop desks.
              </p>
              <p className="text-lg text-zinc-300 leading-relaxed">
                Today, we serve over 150,000 active traders worldwide, processing $2.4B+ in daily volume across 200+ 
                trading pairs. Our platform combines the execution quality of tier-1 prime brokers with the accessibility 
                and transparency that modern traders demand.
              </p>
            </div>
          </Card>

          {/* Core Values */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Values</h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                The principles that guide everything we build
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, i) => (
                <LightCard key={i} delay={i * 60}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/40 flex-shrink-0">
                      <value.icon className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                      <p className="text-zinc-400 leading-relaxed">{value.desc}</p>
                    </div>
                  </div>
                </LightCard>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Journey</h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                From seed-stage startup to market leader
              </p>
            </div>

            <div className="space-y-4">
              {timeline.map((item, i) => (
                <LightCard key={i} delay={i * 50}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg bg-zinc-800/30 border border-zinc-700/40 flex flex-col items-center justify-center">
                        <item.icon className="h-6 w-6 text-zinc-400 mb-1" strokeWidth={1.5} />
                        <div className="text-sm font-bold text-white">{item.year}</div>
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </LightCard>
              ))}
            </div>
          </div>

          {/* Technology Stack */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Technology Stack</h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Institutional infrastructure built for speed, security, and scale
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {technology.map((tech, i) => (
                <LightCard key={i} delay={i * 50}>
                  <div className="text-center">
                    <div className="inline-flex p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/40 mb-4">
                      <tech.icon className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{tech.title}</h3>
                    <p className="text-sm text-zinc-400">{tech.desc}</p>
                  </div>
                </LightCard>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <Card>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Security & Compliance</h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Certified and audited by leading security firms
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {certifications.map((cert, i) => (
                <div key={i} className="text-center p-6 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                  <CheckCircle className="h-8 w-8 text-zinc-400 mx-auto mb-3" strokeWidth={1.5} />
                  <div className="font-bold text-white mb-1">{cert.name}</div>
                  <div className="text-xs text-zinc-500">{cert.body}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-zinc-900/20 rounded-lg border border-zinc-800/40">
              <h3 className="text-xl font-bold text-white mb-3">Our Commitment to Security</h3>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We are committed to providing a transparent, secure, and efficient trading environment. 
                Our platform is built on cutting-edge technology and backed by a team of financial experts 
                and technologists dedicated to your success.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                EquityEdge AI is fully licensed and regulated, ensuring compliance with the highest industry 
                standards. Your funds are segregated and protected in tier-1 banking institutions, giving you 
                peace of mind as you trade. We undergo regular third-party security audits and maintain 
                comprehensive insurance coverage.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <style jsx>{`
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
      `}</style>
    </div>
  );
}