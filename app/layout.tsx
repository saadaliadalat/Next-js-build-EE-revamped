import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "EquityEdgeai - Advanced Trading Platform",
  description: "Professional trading platform for crypto, forex, stocks, and commodities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>

        {/* TradingView script — lazy load on client only */}
        <Script src="https://s3.tradingview.com/tv.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
