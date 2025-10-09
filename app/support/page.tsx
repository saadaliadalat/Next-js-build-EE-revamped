"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, MessageSquare, Phone, Clock, Zap, Shield, Headphones, Send, CheckCircle, AlertCircle, FileText, HelpCircle, BookOpen, Video } from 'lucide-react';

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

const supportStats = [
  { icon: Clock, value: "< 2 min", label: "Avg Response Time" },
  { icon: Headphones, value: "24/7", label: "Available" },
  { icon: CheckCircle, value: "98%", label: "Satisfaction Rate" },
  { icon: Shield, value: "SOC 2", label: "Certified Support" },
];

const contactMethods = [
  {
    icon: MessageSquare,
    title: "Live Chat",
    desc: "Instant support from our expert team",
    action: "Start Chat",
    available: "Available Now",
    response: "< 2 min response",
  },
  {
    icon: Mail,
    title: "Email Support",
    desc: "Detailed assistance via email",
    action: "Send Email",
    available: "support@equityedgeai.com",
    response: "< 4 hour response",
  },
  {
    icon: Phone,
    title: "Phone Support",
    desc: "Speak with a specialist directly",
    action: "Call Now",
    available: "+1 (800) 123-4567",
    response: "Available 24/7",
  },
];

const faqCategories = [
  {
    icon: HelpCircle,
    title: "Getting Started",
    questions: [
      "How do I create an account?",
      "What documents do I need for verification?",
      "How long does account approval take?",
    ]
  },
  {
    icon: Zap,
    title: "Trading",
    questions: [
      "What are your trading fees?",
      "How do I place a trade?",
      "What's the minimum deposit?",
    ]
  },
  {
    icon: Shield,
    title: "Security",
    questions: [
      "How is my data protected?",
      "What is two-factor authentication?",
      "How do I secure my account?",
    ]
  },
  {
    icon: FileText,
    title: "Account & Billing",
    questions: [
      "How do I deposit funds?",
      "What withdrawal methods are available?",
      "How long do withdrawals take?",
    ]
  },
];

const resources = [
  { icon: BookOpen, title: "Documentation", desc: "Comprehensive guides and API docs", link: "/docs" },
  { icon: Video, title: "Video Tutorials", desc: "Step-by-step video walkthroughs", link: "/tutorials" },
  { icon: FileText, title: "Knowledge Base", desc: "Search our extensive help articles", link: "/help" },
];

export default function SupportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
  });

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority as 'low' | 'medium' | 'high',
        status: 'open',
      });

      if (error) throw error;

      setSubmitSuccess(true);
      setFormData({ subject: '', message: '', priority: 'medium' });
      
      setTimeout(() => {
        router.push('/dashboard?tab=support');
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" style={{ zIndex: 1 }} />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,212,216,0.03),transparent_60%)]" style={{ zIndex: 1 }} />
      <div className="fixed inset-0 opacity-20" style={{ zIndex: 1, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      
      <div className="relative" style={{ zIndex: 10 }}>
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4">
          <div className={`max-w-5xl mx-auto text-center transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block mb-4 px-4 py-1.5 bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-full">
              <span className="text-zinc-400 text-sm font-medium tracking-wide uppercase flex items-center gap-2 justify-center">
                <Headphones className="h-3.5 w-3.5" />
                24/7 Expert Support
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-[1.1] tracking-tight">
              <span className="inline-block">We're Here to</span>
              <span className="block mt-2 bg-gradient-to-r from-zinc-100 via-white to-zinc-400 bg-clip-text text-transparent">
                Help You Succeed
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Get instant support from our team of trading experts. Average response time under 2 minutes.
              We're available 24/7 to help you trade with confidence.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 pb-24 space-y-12">
          {/* Support Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {supportStats.map((stat, i) => (
              <LightCard key={i} delay={i * 50}>
                <div className="text-center">
                  <div className="inline-flex p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/40 mb-3">
                    <stat.icon className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-zinc-500">{stat.label}</div>
                </div>
              </LightCard>
            ))}
          </div>

          {/* Contact Methods */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Get In Touch</h2>
              <p className="text-zinc-400 text-lg">Choose your preferred support channel</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {contactMethods.map((method, i) => (
                <LightCard key={i} delay={i * 60}>
                  <div className="text-center">
                    <div className="inline-flex p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/40 mb-4">
                      <method.icon className="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{method.title}</h3>
                    <p className="text-sm text-zinc-400 mb-4">{method.desc}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-zinc-500">{method.available}</span>
                      </div>
                      <div className="text-xs text-zinc-600">{method.response}</div>
                    </div>

                    <button className="w-full px-4 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-all duration-300 hover:scale-[1.02] active:scale-95">
                      {method.action}
                    </button>
                  </div>
                </LightCard>
              ))}
            </div>
          </div>

          {/* Submit Ticket Form */}
          <Card>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">Submit a Support Ticket</h2>
                <p className="text-zinc-400">
                  Describe your issue and our team will get back to you within 4 hours
                </p>
              </div>

              {submitSuccess ? (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-4">
                    <CheckCircle className="h-12 w-12 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Ticket Submitted!</h3>
                  <p className="text-zinc-400 mb-4">
                    Our support team will respond to you shortly.
                  </p>
                  <p className="text-sm text-zinc-500">Redirecting to dashboard...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="subject" className="block text-sm font-medium text-zinc-300">
                      Subject
                    </label>
                    <input
                      id="subject"
                      type="text"
                      placeholder="Brief description of your issue"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="w-full bg-zinc-900/50 border border-zinc-800/60 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="priority" className="block text-sm font-medium text-zinc-300">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-zinc-800/60 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-700/50 transition-all"
                    >
                      <option value="low">Low - General inquiry</option>
                      <option value="medium">Medium - Issue affecting use</option>
                      <option value="high">High - Urgent issue</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-medium text-zinc-300">
                      Message
                    </label>
                    <textarea
                      id="message"
                      placeholder="Provide detailed information about your issue..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="w-full bg-zinc-900/50 border border-zinc-800/60 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700/50 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full px-6 py-3.5 bg-white text-black font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-white/20 hover:scale-[1.02] active:scale-95 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-600" />
                    <span className="relative z-10 flex items-center gap-2 justify-center">
                      {loading ? 'Submitting...' : 'Submit Ticket'}
                      {!loading && <Send className="h-4 w-4" />}
                    </span>
                  </button>

                  {!user && (
                    <div className="flex items-start gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-400">
                        You need to be signed in to submit a support ticket.{' '}
                        <button
                          type="button"
                          onClick={() => router.push('/auth/login')}
                          className="underline hover:text-blue-300"
                        >
                          Sign in now
                        </button>
                      </p>
                    </div>
                  )}
                </form>
              )}
            </div>
          </Card>

          {/* FAQ Section */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Frequently Asked Questions</h2>
              <p className="text-zinc-400 text-lg">Quick answers to common questions</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {faqCategories.map((category, i) => (
                <LightCard key={i} delay={i * 50}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-zinc-800/30 rounded-lg border border-zinc-700/40">
                      <category.icon className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold text-white">{category.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {category.questions.map((question, j) => (
                      <li key={j}>
                        <button className="text-left text-sm text-zinc-400 hover:text-white transition-colors duration-200 flex items-start gap-2 group">
                          <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
                          {question}
                        </button>
                      </li>
                    ))}
                  </ul>
                </LightCard>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Support Resources</h2>
              <p className="text-zinc-400 text-lg">Self-service tools and guides</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {resources.map((resource, i) => (
                <LightCard key={i} delay={i * 60}>
                  <div className="text-center">
                    <div className="inline-flex p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/40 mb-4">
                      <resource.icon className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{resource.title}</h3>
                    <p className="text-sm text-zinc-400 mb-4">{resource.desc}</p>
                    <button className="text-sm text-white hover:text-zinc-300 transition-colors font-medium">
                      Learn more →
                    </button>
                  </div>
                </LightCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}