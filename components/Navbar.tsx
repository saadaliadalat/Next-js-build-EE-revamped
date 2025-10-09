'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  User,
  LogOut,
  LayoutDashboard,
  Settings2,
  Menu,
  X,
  House,
  Info,
  LineChart,
  Headset,
  MessageCircleQuestion,
  Zap,
} from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Mouse tracking for glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const nav = navRef.current;
    if (nav) {
      nav.addEventListener('mousemove', handleMouseMove);
      return () => nav.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);

  const navLinks = [
    { name: 'Home', href: '/', icon: House },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Markets', href: '/markets', icon: LineChart },
    { name: 'Support', href: '/support', icon: Headset },
    { name: 'FAQ', href: '/faq', icon: MessageCircleQuestion },
  ];

  const closeMobile = () => setMobileOpen(false);

  const renderAuthSection = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-20 bg-zinc-800/50 rounded-md animate-pulse" />
          <div className="h-9 w-24 bg-gradient-to-r from-zinc-100/20 to-zinc-200/20 rounded-md animate-pulse" />
        </div>
      );
    }

    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="group flex items-center gap-2 h-9 bg-zinc-900/70 border border-zinc-700/50 hover:bg-zinc-800/80 hover:border-zinc-600/60 text-zinc-100 rounded-md px-3.5 backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-white/5"
            >
              <div className="p-1 bg-zinc-800/60 rounded-sm group-hover:scale-110 transition-transform duration-300">
                <User className="h-3.5 w-3.5 text-zinc-300" strokeWidth={2.5} />
              </div>
              <span className="hidden md:inline text-sm font-medium tracking-tight max-w-[120px] truncate">
                {profile?.full_name || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-zinc-950/98 border border-zinc-800/70 backdrop-blur-2xl rounded-lg shadow-2xl shadow-black/50 p-2 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          >
            <DropdownMenuLabel className="text-zinc-100 font-semibold text-sm tracking-tight px-3 py-2">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent mx-1.5 my-1" />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 text-zinc-200 hover:bg-zinc-800/50 hover:text-white rounded-md transition-all duration-200 cursor-pointer group"
              >
                <div className="p-1.5 bg-zinc-800/40 rounded-sm group-hover:bg-zinc-700/60 group-hover:scale-110 transition-all duration-200">
                  <LayoutDashboard className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" strokeWidth={2} />
                </div>
                <span className="text-sm font-medium tracking-tight">Dashboard</span>
              </Link>
            </DropdownMenuItem>
            {profile?.is_admin && (
              <DropdownMenuItem asChild>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 text-zinc-200 hover:bg-zinc-800/50 hover:text-white rounded-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="p-1.5 bg-zinc-800/40 rounded-sm group-hover:bg-zinc-700/60 group-hover:scale-110 transition-all duration-200">
                    <Settings2 className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium tracking-tight">Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent mx-1.5 my-1" />
            <DropdownMenuItem
              onSelect={signOut}
              className="flex items-center gap-3 px-3 py-2.5 text-zinc-300 hover:bg-red-950/30 hover:text-red-400 rounded-md transition-all duration-200 cursor-pointer group"
            >
              <div className="p-1.5 bg-zinc-800/40 rounded-sm group-hover:bg-red-950/40 group-hover:scale-110 transition-all duration-200">
                <LogOut className="h-4 w-4 group-hover:text-red-400" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium tracking-tight">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <>
        <Button
          variant="ghost"
          className="hidden sm:flex h-9 bg-transparent border border-zinc-700/40 text-zinc-200 hover:bg-zinc-800/50 hover:border-zinc-600/50 hover:text-white rounded-md px-4 text-sm font-medium tracking-tight transition-all duration-300 hover:shadow-lg hover:shadow-white/5"
          asChild
        >
          <Link href="/auth/login">Sign In</Link>
        </Button>
        <Button
          className="relative h-9 bg-white hover:bg-zinc-100 text-black font-semibold rounded-md px-5 text-sm tracking-tight shadow-lg hover:shadow-xl hover:shadow-white/20 transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] overflow-hidden group"
          asChild
        >
          <Link href="/auth/signup">
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-zinc-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        </Button>
      </>
    );
  };

  return (
    <nav className={`fixed top-4 left-0 right-0 z-50 px-4 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
      <div 
        ref={navRef}
        className="relative container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between bg-black/60 backdrop-blur-2xl border border-zinc-800/40 rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-border-flow" />
        </div>

        {/* Mouse glow effect */}
        <div 
          className="absolute w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none transition-opacity duration-300 opacity-0 hover:opacity-100"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />

        {/* Logo */}
        <Link
          href="/"
          className="relative z-10 flex items-center gap-2.5 transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] group"
          aria-label="EquityEdge Home"
        >
          <div className="relative p-2 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 rounded-md group-hover:border-zinc-600/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-white/10">
            <TrendingUp className="h-5 w-5 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-all duration-300 group-hover:rotate-12" strokeWidth={2.5} />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white group-hover:text-white transition-colors duration-300">Equity</span>
            <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300">Edge</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-0.5 relative z-10">
          {navLinks.map((link, index) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className="group relative flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium text-zinc-300 hover:text-white transition-all duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`absolute inset-0 bg-zinc-800/0 group-hover:bg-zinc-800/30 rounded-md transition-all duration-300 ${isActive ? 'bg-zinc-800/20' : ''}`} />
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent" />
                )}
                <Icon className="relative h-4 w-4 text-zinc-400 group-hover:text-zinc-200 group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
                <span className="relative tracking-tight">{link.name}</span>
              </Link>
            );
          })}
          {!loading && user && (
            <Link
              href="/trade"
              className="group relative flex items-center gap-2 ml-1 px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-md text-sm font-medium text-zinc-200 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-white/10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Zap className="relative h-4 w-4 text-zinc-300 group-hover:text-white group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
              <span className="relative tracking-tight">Trade</span>
            </Link>
          )}
        </div>

        {/* Auth / Mobile Toggle */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            className="md:hidden text-zinc-300 hover:text-white transition-all duration-300 p-2 rounded-md hover:bg-zinc-800/50 active:scale-95 hover:rotate-90"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" strokeWidth={2.5} /> : <Menu className="h-5 w-5" strokeWidth={2.5} />}
          </button>

          {renderAuthSection()}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && !loading && (
        <div
          ref={mobileMenuRef}
          className="md:hidden fixed inset-x-4 top-[88px] bg-zinc-950/98 backdrop-blur-2xl border border-zinc-800/70 rounded-lg shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-top-4 fade-in-0 duration-300 z-40"
        >
          <div className="flex flex-col py-3 px-3 space-y-1">
            {navLinks.map((link, index) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-md text-zinc-200 hover:bg-zinc-800/50 hover:text-white font-medium text-sm tracking-tight transition-all duration-300 animate-in slide-in-from-left-4 fade-in-0 ${isActive ? 'bg-zinc-800/30 text-white' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={closeMobile}
                >
                  <div className="p-1.5 bg-zinc-800/40 rounded-sm group-hover:bg-zinc-700/60 group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" strokeWidth={2} />
                  </div>
                  {link.name}
                </Link>
              );
            })}
            {user && (
              <Link
                href="/trade"
                className="group flex items-center gap-3 px-3 py-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-200 hover:text-white font-medium text-sm tracking-tight transition-all duration-300 animate-in slide-in-from-left-4 fade-in-0"
                style={{ animationDelay: `${navLinks.length * 50}ms` }}
                onClick={closeMobile}
              >
                <div className="p-1.5 bg-zinc-800/40 rounded-sm group-hover:bg-zinc-700/60 group-hover:scale-110 transition-all duration-300">
                  <Zap className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" strokeWidth={2} />
                </div>
                Trade
              </Link>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes border-flow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-border-flow {
          animation: border-flow 3s linear infinite;
        }
      `}</style>
    </nav>
  );
}