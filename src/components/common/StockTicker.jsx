import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StockTicker() {
  const [stocks, setStocks] = useState([
    { symbol: 'AAPL', name: '苹果', price: 245.12, change: 2.85, changePercent: 1.18 },
    { symbol: 'MSFT', name: '微软', price: 445.67, change: -3.21, changePercent: -0.71 },
    { symbol: 'GOOGL', name: '谷歌', price: 185.90, change: 1.45, changePercent: 0.79 },
    { symbol: 'AMZN', name: '亚马逊', price: 215.33, change: 4.67, changePercent: 2.22 },
    { symbol: 'NVDA', name: '英伟达', price: 1050.25, change: 18.90, changePercent: 1.83 },
    { symbol: 'TSLA', name: '特斯拉', price: 385.60, change: -7.40, changePercent: -1.88 },
    { symbol: 'META', name: 'Meta', price: 625.80, change: 6.55, changePercent: 1.06 },
    { symbol: 'NFLX', name: '奈飞', price: 715.30, change: 9.20, changePercent: 1.30 },
  ]);

  useEffect(() => {
    const fetchStockPrices = async () => {
      try {
        const response = await base44.functions.invoke('getRealtimeStockPrices', {});
        if (response.data.stocks) {
          setStocks(response.data.stocks);
        }
      } catch (error) {
        console.error('Failed to fetch stock prices:', error);
      }
    };

    fetchStockPrices();
    const interval = setInterval(fetchStockPrices, 60000); // 每分钟更新

    return () => clearInterval(interval);
  }, []);

  const displayStocks = [...stocks, ...stocks]; // Duplicate for seamless loop
  
  return (
    <div className="bg-[#070D18] border-b border-slate-800/50 py-2 overflow-hidden">
      <motion.div 
        className="flex gap-8"
        animate={{ x: [0, -50 * stocks.length] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {displayStocks.map((stock, idx) => (
          <div key={idx} className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-medium text-white">{stock.symbol}</span>
            <span className="text-xs text-slate-400">${stock.price}</span>
            <div className={`flex items-center gap-0.5 text-xs ${
              stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {stock.change >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}