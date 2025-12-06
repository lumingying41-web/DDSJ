import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  ArrowLeft, Clock, Share2, Bookmark, BookmarkCheck, 
  Building2, FileDown, ExternalLink, Lock, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from 'react-markdown';
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner';

const institutionTypeLabels = {
  investment_bank: '投行',
  hedge_fund: '对冲基金',
  asset_manager: '资管公司',
  research_firm: '研究机构'
};

const reportTypeLabels = {
  market_outlook: '市场展望',
  sector_analysis: '行业分析',
  stock_pick: '个股推荐',
  macro_research: '宏观研究',
  strategy: '策略报告'
};

export default function ReportDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email });
        if (subs.length > 0) setSubscription(subs[0]);
        
        const bookmarks = await base44.entities.Bookmark.filter({ 
          user_email: currentUser.email, 
          item_type: 'report', 
          item_id: reportId 
        });
        setIsBookmarked(bookmarks.length > 0);
      } catch (e) {}
    };
    loadUser();
  }, [reportId]);
  
  const isPremiumUser = subscription?.plan !== 'free' && subscription?.status === 'active';
  
  const { data: report, isLoading } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const items = await base44.entities.InstitutionReport.filter({ id: reportId });
      return items[0];
    },
    enabled: !!reportId,
  });
  
  const toggleBookmark = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    
    if (isBookmarked) {
      const bookmarks = await base44.entities.Bookmark.filter({
        user_email: user.email, item_type: 'report', item_id: reportId
      });
      if (bookmarks[0]) await base44.entities.Bookmark.delete(bookmarks[0].id);
    } else {
      await base44.entities.Bookmark.create({
        user_email: user.email,
        item_type: 'report',
        item_id: reportId,
        item_title: report?.title
      });
    }
    setIsBookmarked(!isBookmarked);
  };
  
  const isLocked = report?.is_premium && !isPremiumUser;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070D18] px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32 bg-slate-700" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-lg bg-slate-700" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-slate-700" />
              <Skeleton className="h-5 w-20 rounded-full bg-slate-700" />
            </div>
          </div>
          <Skeleton className="h-10 w-full bg-slate-700" />
          <Skeleton className="h-6 w-3/4 bg-slate-700" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-white mb-4">报告不存在</h2>
          <Link to={createPageUrl('Institution')}>
            <Button variant="outline">返回报告列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Institution')}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleBookmark}
              className={isBookmarked ? 'text-amber-400' : 'text-slate-400'}
            >
              {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-4 py-8"
      >
        {/* Institution Header */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          {report.institution_logo ? (
            <img 
              src={report.institution_logo} 
              alt={report.institution}
              className="w-14 h-14 rounded-xl object-cover bg-slate-800"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-slate-400" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-white">{report.institution}</h3>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 mt-1">
              {institutionTypeLabels[report.institution_type] || report.institution_type}
            </Badge>
          </div>
          <div className="ml-auto text-right text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(report.published_at || report.created_date), 'yyyy年MM月dd日', { locale: zhCN })}
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
          {report.title}
        </h1>

        {/* Report Type & Related Stocks */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-600">
            {reportTypeLabels[report.report_type] || report.report_type}
          </Badge>
          {report.related_stocks?.map((stock, idx) => (
            <Badge key={idx} className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              ${stock}
            </Badge>
          ))}
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="bg-slate-800/20 rounded-xl p-4 mb-6 border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-400 mb-2">报告摘要</h3>
            <p className="text-base text-slate-300 leading-relaxed">{report.summary}</p>
          </div>
        )}

        {/* Key Points */}
        {report.key_points && report.key_points.length > 0 && (
          <div className={`mb-6 ${isLocked ? 'relative' : ''}`}>
            <h3 className="text-sm font-medium text-slate-400 mb-3">核心要点</h3>
            <div className={`space-y-3 ${isLocked ? 'blur-md' : ''}`}>
              {report.key_points.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-slate-800/20 rounded-lg p-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-medium shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
            
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-[#0F1A2E]/95 rounded-xl p-6 text-center border border-amber-500/20">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <p className="text-white font-medium mb-2">会员专享内容</p>
                  <Link to={createPageUrl('Subscription')}>
                    <Button className="bg-amber-500 hover:bg-amber-400 text-black">
                      <Crown className="w-4 h-4 mr-2" />
                      立即解锁
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Content */}
        {!isLocked && report.content && (
          <div className="prose prose-invert prose-sm max-w-none mb-8">
            <ReactMarkdown>{report.content}</ReactMarkdown>
          </div>
        )}

        {/* Download PDF */}
        {!isLocked && report.file_url && (
          <div className="mb-8">
            <a 
              href={report.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <FileDown className="w-4 h-4" />
              下载原始报告 (PDF)
            </a>
          </div>
        )}

        {/* Subscription Banner */}
        {isLocked && (
          <div className="mt-8">
            <SubscriptionBanner />
          </div>
        )}
      </motion.div>
    </div>
  );
}