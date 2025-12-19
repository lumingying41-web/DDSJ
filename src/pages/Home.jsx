import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, Bell, BellOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import NewsCard from '@/components/news/NewsCard';
import NewsFilter from '@/components/news/NewsFilter';
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner';
import StockTicker from '@/components/common/StockTicker';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSentiment, setActiveSentiment] = useState('all');
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLive, setIsLive] = useState(true);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email });
        if (subs.length > 0) {
          setSubscription(subs[0]);
        }
      } catch (e) {
        // Not logged in
      }
    };
    loadUser();
  }, []);
  
  const isPremiumUser = subscription?.plan !== 'free' && subscription?.status === 'active';
  
  const { data: newsFlash = [], isLoading, refetch } = useQuery({
    queryKey: ['newsFlash', activeCategory, activeSentiment],
    queryFn: async () => {
      let filter = {};
      if (activeCategory !== 'all') filter.category = activeCategory;
      if (activeSentiment !== 'all') filter.sentiment = activeSentiment;
      
      if (Object.keys(filter).length > 0) {
        return base44.entities.NewsFlash.filter(filter, '-created_date', 50);
      }
      return base44.entities.NewsFlash.list('-created_date', 50);
      },
      });

      useEffect(() => {
      // 自动刷新快讯
      if (isLive) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // 每30秒自动刷新
      return () => clearInterval(interval);
      }
      }, [isLive, refetch]);

  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Stock Ticker */}
      <StockTicker />
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-xs text-slate-400">{isLive ? '实时' : '已暂停'}</span>
              </div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                快讯
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLive(!isLive)}
                className="text-slate-400 hover:text-white"
              >
                {isLive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          <NewsFilter 
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            activeSentiment={activeSentiment}
            setActiveSentiment={setActiveSentiment}
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">

        
        {/* News List */}
        <div className="space-y-4">
          {isLoading ? (
            Array(5).fill(0).map((_, idx) => (
              <div key={idx} className="bg-[#0F1A2E]/80 rounded-xl p-4 space-y-3">
                <Skeleton className="h-4 w-24 bg-slate-700" />
                <Skeleton className="h-5 w-full bg-slate-700" />
                <Skeleton className="h-4 w-3/4 bg-slate-700" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full bg-slate-700" />
                  <Skeleton className="h-6 w-16 rounded-full bg-slate-700" />
                </div>
              </div>
            ))
          ) : newsFlash.length === 0 ? (
            <div className="text-center py-20">
              <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg text-slate-400 mb-2">暂无快讯</h3>
              <p className="text-sm text-slate-500">稍后刷新查看最新消息</p>
            </div>
          ) : (
            <AnimatePresence>
              {newsFlash.map((news, idx) => (
                <motion.div
                  key={news.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <NewsCard news={news} isPremiumUser={isPremiumUser} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}