import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, DollarSign, Newspaper } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from 'framer-motion';

export default function USStockWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks' or 'news'

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await base44.functions.invoke('getEastMoneyUSStocks', {});
      setData(response.data);
    } catch (e) {
      console.error('Failed to fetch US stocks:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/40 border-slate-700/50 p-4">
        <Skeleton className="h-6 w-32 mb-4 bg-slate-700" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-slate-700" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/40 border-slate-700/50 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('stocks')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'stocks'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-1" />
          美股行情
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'news'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Newspaper className="w-4 h-4 inline mr-1" />
          个股资讯
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'stocks' && (
          <div className="space-y-2">
            {data?.stocks?.slice(0, 8).map((stock, idx) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{stock.symbol}</span>
                    <span className="text-slate-400 text-xs">{stock.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono text-sm">
                    ${stock.price?.toFixed(2) || '--'}
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${
                    stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {stock.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-3">
            {data?.news?.length > 0 ? (
              data.news.map((item, idx) => (
                <motion.a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="block p-3 rounded-lg hover:bg-slate-700/30 transition-colors border border-slate-700/50"
                >
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-amber-400 font-mono text-xs font-medium">
                      {item.stockCode}
                    </span>
                    <span className="text-slate-500 text-xs">{item.stockName}</span>
                  </div>
                  <h4 className="text-white text-sm font-medium mb-1 line-clamp-2">
                    {item.title}
                  </h4>
                  {item.summary && (
                    <p className="text-slate-400 text-xs line-clamp-2">{item.summary}</p>
                  )}
                  <span className="text-slate-500 text-xs mt-1 block">
                    {new Date(item.publishTime).toLocaleString('zh-CN')}
                  </span>
                </motion.a>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                暂无资讯数据
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-3 text-xs text-slate-500 text-right">
        数据来源: 东方财富
      </div>
    </Card>
  );
}