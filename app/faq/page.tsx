"use client";

import { useState, memo } from 'react';
import { Navbar } from '@/components/Navbar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Define FAQ type
type FAQ = {
  question: string;
  answer: string;
  category: 'account' | 'trading' | 'security' | 'support';
};

// FAQ data
const faqData: FAQ[] = [
  {
    question: 'How do I create an account?',
    answer:
      'Click the "Get Started" button and fill out the registration form with your name, email, and a secure password. Once registered, you can immediately start using the platform.',
    category: 'account',
  },
  {
    question: 'How do I deposit funds?',
    answer:
      'Navigate to your dashboard and click the "Deposits" tab. You’ll see our bank account details. After making a bank transfer, upload proof of payment (screenshot or receipt), and our team will verify your deposit within 24 hours.',
    category: 'account',
  },
  {
    question: 'What markets can I trade?',
    answer:
      'EquityEdgeai offers trading in cryptocurrencies (Bitcoin, Ethereum, etc.), forex pairs (EUR/USD, GBP/USD, etc.), major stocks (AAPL, MSFT, TSLA, etc.), and commodities (Gold, Silver, Oil, etc.).',
    category: 'trading',
  },
  {
    question: 'What are the trading fees?',
    answer:
      'We offer competitive spreads: Crypto 0.1%, Forex 0.0001%, Stocks $0.01 per share, Commodities 0.05%. No hidden fees or commissions.',
    category: 'trading',
  },
  {
    question: 'How long do withdrawals take?',
    answer:
      'Withdrawal requests are processed within 1-3 business days. Funds are transferred to your bank account, with processing times varying by bank and location.',
    category: 'account',
  },
  {
    question: 'Is my money safe?',
    answer:
      'Yes. EquityEdgeai uses SSL encryption, two-factor authentication, and cold storage for crypto assets. Client funds are segregated and held in regulated financial institutions.',
    category: 'security',
  },
  {
    question: 'Do you offer leverage trading?',
    answer:
      'Yes, leverage up to 1:100 on forex pairs and 1:20 on other assets. Leverage trading carries increased risk, so trade responsibly.',
    category: 'trading',
  },
  {
    question: 'Can I use the platform on mobile?',
    answer:
      'Yes, our platform is fully responsive on smartphones and tablets. Native iOS and Android apps offer full trading functionality.',
    category: 'support',
  },
  {
    question: 'What if I need help?',
    answer:
      'Our 24/7 support team is available via live chat, email, and phone. Submit a support ticket through your dashboard for responses within minutes during business hours or a few hours otherwise.',
    category: 'support',
  },
  {
    question: 'Are there any account minimums?',
    answer:
      'No minimum balance is required to start trading. We recommend starting with at least $100 to manage risk and explore trading opportunities.',
    category: 'account',
  },
];

// GlassCard component
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

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | FAQ['category']>('all');

  // Filter FAQs by search query and category
  const filteredFAQs = faqData.filter(
    (faq) =>
      (selectedCategory === 'all' || faq.category === selectedCategory) &&
      (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_70%)]" style={{ zIndex: 0 }} />
      <div
        className="fixed inset-0 opacity-10"
        style={{
          zIndex: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-20">
        <Navbar />
        <div className="container mx-auto px-4 md:px-6 py-24 max-w-7xl">
          <GlassCard className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-white">Frequently Asked Questions</h1>
            <p className="text-zinc-400 mb-8">
              Find answers to common questions about EquityEdgeai
            </p>

            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'account', 'trading', 'security', 'support'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as 'all' | FAQ['category'])}
                    className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                      selectedCategory === cat
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-900/30 text-zinc-400 hover:bg-zinc-900/50'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <Accordion type="single" collapsible className="space-y-4">
              <AnimatePresence>
                {filteredFAQs.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-zinc-400 text-center py-8"
                  >
                    No FAQs found for your search.
                  </motion.p>
                ) : (
                  filteredFAQs.map((faq, index) => (
                    <motion.div
                      key={faq.question}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <AccordionItem value={`item-${index + 1}`}>
                        <AccordionTrigger className="text-left text-white hover:text-emerald-400">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-300">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </Accordion>
          </GlassCard>
        </div>
      </div>

      {/* Global styles */}
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
