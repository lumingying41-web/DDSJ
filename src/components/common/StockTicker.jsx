import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const mockStocks = [
  { symbol: 'AAPL', name: 'Apple', price: 178.72, change: 1.24, changePercent: 0.70 },
  { symbol: 'MSFT', name: 'Microsoft', price: 378.91, change: -2.15, changePercent: -0.56 },
  { symbol: 'GOOGL', name: 'Alphabet', price: 141.80, change: 0.89, changePercent: 0.63 },
  { symbol: 'AMZN', name: 'Amazon', price: 178.25, change: 3.45, changePercent: 1.97 },
  { symbol: 'NVDA', name: 'NVIDIA', price: 875.28, change: 12.50, changePercent: 1.45 },
  { symbol: 'TSLA', name: 'Tesla', price: 248.50, change: -5.20, changePercent: -2.05 },
  { symbol: 'META', name: 'Meta', price: 505.95, change: 4.30, changePercent: 0.86 },
  { symbol: 'BRK.B', name: 'Berkshire', price: 408.50, change: 0.75, changePercent: 0.18 },
];

export default function StockTicker() {
  const stocks = [...mockStocks, ...mockStocks]; // Duplicate for seamless loop
  
  return (
    <div className="bg-[#070D18] border-b border-slate-800/50 py-2 overflow-hidden">
      <motion.div 
        className="flex gap-8"
        animate={{ x: [0, -50 * mockStocks.length] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {stocks.map((stock, idx) => (
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