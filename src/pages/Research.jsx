import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Filter, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ResearchCard from '@/components/research/ResearchCard';
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner';

const categories = [
  { id: 'all', label: '全部' },
  { id: 'earnings', label: '财报解读' },
  { id: 'valuation', label: '估值分析' },
  { id: 'industry', label: '行业分析' },
  { id: 'technical', label: '技术分析' },
  { id: 'deep_dive', label: '深度研究' },
];

const ratings = [
  { id: 'all', label: '全部评级' },
  { id: 'strong_buy', label: '强烈买入' },
  { id: 'buy', label: '买入' },
  { id: 'hold', label: '持有' },
  { id: 'sell', label: '卖出' },
];

export default function Research() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRating, setActiveRating] = useState('all');
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email });
        if (subs.length > 0) setSubscription(subs[0]);
      } catch (e) {}
    };
    loadUser();
  }, []);
  
  const isPremiumUser = subscription?.plan !== 'free' && subscription?.status === 'active';
  
  const { data: research = [], isLoading } = useQuery({
    queryKey: ['research', activeCategory, activeRating],
    queryFn: async () => {
      // 先同步SEC数据
      try {
        await base44.functions.invoke('syncSECFilings', {});
      } catch (e) {
        console.error('Failed to sync SEC data:', e);
      }
      
      // 获取今天的研报
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let allResearch = await base44.entities.Research.list('-created_date', 100);
      
      // 只保留今天的研报
      allResearch = allResearch.filter(item => {
        const itemDate = new Date(item.published_at || item.created_date);
        return itemDate >= today;
      });
      
      if (allResearch.length === 0) return [];
      
      // 应用过滤
      if (activeCategory !== 'all') {
        allResearch = allResearch.filter(item => item.category === activeCategory);
      }
      if (activeRating !== 'all') {
        allResearch = allResearch.filter(item => item.rating === activeRating);
      }
      
      return allResearch.slice(0, 50);
    },
  });

  const filteredResearch = research.filter(item => 
    searchQuery === '' || 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.stock_symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.stock_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              个股研报
            </h1>
          </div>
          
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="搜索股票代码或公司名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500/50"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Select value={activeCategory} onValueChange={setActiveCategory}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="分类" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-slate-700">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={activeRating} onValueChange={setActiveRating}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="评级" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {ratings.map((rating) => (
                    <SelectItem key={rating.id} value={rating.id} className="text-white hover:bg-slate-700">
                      {rating.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Premium Banner */}
        {!isPremiumUser && (
          <div className="mb-6">
            <SubscriptionBanner variant="compact" />
          </div>
        )}
        
        {/* Research Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, idx) => (
              <div key={idx} className="bg-[#0F1A2E]/80 rounded-xl overflow-hidden">
                <Skeleton className="h-40 bg-slate-700" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-24 bg-slate-700" />
                  <Skeleton className="h-5 w-full bg-slate-700" />
                  <Skeleton className="h-4 w-3/4 bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : research.length === 0 ? (
          <Alert className="bg-slate-800/40 border-slate-700">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-slate-300 ml-2">
              暂无当日研报数据。研报功能需要接入专业数据源（如Bloomberg Terminal），或等待机构发布免费研报。
            </AlertDescription>
          </Alert>
        ) : filteredResearch.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg text-slate-400 mb-2">暂无匹配研报</h3>
            <p className="text-sm text-slate-500">调整筛选条件试试</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredResearch.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ResearchCard research={item} isPremiumUser={isPremiumUser} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}