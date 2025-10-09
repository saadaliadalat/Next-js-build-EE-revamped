'use client';

import { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
}

export function TradingViewWidget({ symbol = 'BINANCE:BTCUSDT' }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined') {
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0a0e1a',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: 'tradingview_chart',
          backgroundColor: '#0a0e1a',
          gridColor: '#1e293b',
        });
      }
    };

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container w-full h-full">
      <div id="tradingview_chart" ref={container} className="w-full h-full" />
    </div>
  );
}

declare global {
  interface Window {
    TradingView: any;
  }
}
