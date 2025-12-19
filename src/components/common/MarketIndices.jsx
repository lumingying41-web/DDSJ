import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MarketIndices() {
  const [indices, setIndices] = useState([]);

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const response = await base44.functions.invoke('getMarketIndices', {});
        if (response.data && response.data.indices) {
          setIndices(response.data.indices);
        }
      } catch (error) {
        console.error('Failed to fetch market indices:', error);
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 120000); // 每2分钟更新

    return () => clearInterval(interval);
  }, []);

  if (indices.length === 0) return null;

  return (
    <div className="bg-slate-900/50 border-b border-slate-800/50 py-3">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          <span className="text-xs text-slate-500 font-medium shrink-0">市场指数</span>
          {indices.map((index, idx) => (
            <motion.div 
              key={index.symbol}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3 shrink-0"
            >
              <div>
                <div className="text-xs font-medium text-white">{index.displayName}</div>
                <div className="text-xs text-slate-400">{index.price.toFixed(2)}</div>
              </div>
              <div className={`flex items-center gap-0.5 text-xs ${
                index.change >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {index.change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{index.change >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}