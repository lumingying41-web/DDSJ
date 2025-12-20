import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Search, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InstitutionReportCard from '@/components/institution/InstitutionReportCard';
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner';

const institutionTypes = [
  { id: 'all', label: '全部' },
  { id: 'investment_bank', label: '投行' },
  { id: 'hedge_fund', label: '对冲基金' },
  { id: 'asset_manager', label: '资管公司' },
  { id: 'research_firm', label: '研究机构' },
];

export default function Institution() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
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
  
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['institutionReports', activeType],
    queryFn: async () => {
      // 获取今天的报告
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let allReports = await base44.entities.InstitutionReport.list('-created_date', 100);
      
      // 只保留今天的报告
      allReports = allReports.filter(item => {
        const itemDate = new Date(item.published_at || item.created_date);
        return itemDate >= today;
      });
      
      if (allReports.length === 0) return [];
      
      // 应用过滤
      if (activeType !== 'all') {
        allReports = allReports.filter(item => item.institution_type === activeType);
      }
      
      return allReports.slice(0, 50);
    },
  });

  const filteredReports = reports.filter(report => 
    searchQuery === '' || 
    report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.institution?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              机构报告
            </h1>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="搜索机构或报告标题..."
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
          
          {/* Type Filter */}
          <Tabs value={activeType} onValueChange={setActiveType}>
            <TabsList className="bg-slate-800/50 border border-slate-700">
              {institutionTypes.map((type) => (
                <TabsTrigger 
                  key={type.id} 
                  value={type.id}
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-black"
                >
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
        
        {/* Reports Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {Array(4).fill(0).map((_, idx) => (
              <div key={idx} className="bg-[#0F1A2E]/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg bg-slate-700" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-slate-700" />
                    <Skeleton className="h-5 w-16 rounded-full bg-slate-700" />
                  </div>
                </div>
                <Skeleton className="h-5 w-full bg-slate-700" />
                <Skeleton className="h-4 w-3/4 bg-slate-700" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full bg-slate-700" />
                  <Skeleton className="h-6 w-16 rounded-full bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Alert className="bg-slate-800/40 border-slate-700">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-slate-300 ml-2">
              暂无当日机构报告。机构报告需要接入专业数据源（如高盛、摩根士丹利API），或等待机构发布公开报告。
            </AlertDescription>
          </Alert>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg text-slate-400 mb-2">暂无匹配报告</h3>
            <p className="text-sm text-slate-500">调整筛选条件试试</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredReports.map((report, idx) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <InstitutionReportCard report={report} isPremiumUser={isPremiumUser} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}