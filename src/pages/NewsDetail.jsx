import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  ArrowLeft, Clock, Share2, Bookmark, BookmarkCheck, 
  TrendingUp, TrendingDown, Minus, ExternalLink, Lock, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from 'react-markdown';
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner';

const sentimentConfig = {
  bullish: { icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: '利好', bgColor: 'from-emerald-500/5' },
  bearish: { icon: TrendingDown, color: 'bg-red-500/10 text-red-400 border-red-500/20', label: '利空', bgColor: 'from-red-500/5' },
  neutral: { icon: Minus, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: '中性', bgColor: 'from-slate-500/5' }
};

const categoryLabels = {
  earnings: '财报', fed: '美联储', analyst: '分析师', macro: '宏观',
  ipo: 'IPO', merger: '并购', policy: '政策', other: '其他'
};

export default function NewsDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const newsId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email });
        if (subs.length > 0) setSubscription(subs[0]);
        
        const bookmarks = await base44.entities.Bookmark.filter({ 
          user_email: currentUser.email, 
          item_type: 'news', 
          item_id: newsId 
        });
        setIsBookmarked(bookmarks.length > 0);
      } catch (e) {}
    };
    loadUser();
  }, [newsId]);
  
  const isPremiumUser = subscription?.plan !== 'free' && subscription?.status === 'active';
  
  const { data: news, isLoading } = useQuery({
    queryKey: ['news', newsId],
    queryFn: async () => {
      const items = await base44.entities.NewsFlash.filter({ id: newsId });
      return items[0];
    },
    enabled: !!newsId,
  });
  
  const toggleBookmark = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    
    if (isBookmarked) {
      const bookmarks = await base44.entities.Bookmark.filter({
        user_email: user.email, item_type: 'news', item_id: newsId
      });
      if (bookmarks[0]) await base44.entities.Bookmark.delete(bookmarks[0].id);
    } else {
      await base44.entities.Bookmark.create({
        user_email: user.email,
        item_type: 'news',
        item_id: newsId,
        item_title: news?.title
      });
    }
    setIsBookmarked(!isBookmarked);
  };
  
  const isLocked = news?.is_premium && !isPremiumUser;
  const sentiment = news ? sentimentConfig[news.sentiment] || sentimentConfig.neutral : sentimentConfig.neutral;
  const SentimentIcon = sentiment.icon;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070D18] px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32 bg-slate-700" />
          <Skeleton className="h-10 w-full bg-slate-700" />
          <Skeleton className="h-6 w-3/4 bg-slate-700" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-slate-700" />
            <Skeleton className="h-4 w-full bg-slate-700" />
            <Skeleton className="h-4 w-2/3 bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-white mb-4">快讯不存在</h2>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${sentiment.bgColor} to-[#070D18]`}>
      <div className="bg-[#070D18]">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to={createPageUrl('Home')}>
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
          {/* Meta */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Badge className={`${sentiment.color} border flex items-center gap-1`}>
              <SentimentIcon className="w-3 h-3" />
              {sentiment.label}
            </Badge>
            <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-600">
              {categoryLabels[news.category] || news.category}
            </Badge>
            {news.importance === 'high' && (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">重要</Badge>
            )}
            <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {format(new Date(news.published_at || news.created_date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
            {news.title}
          </h1>

          {/* Summary */}
          <div className="bg-slate-800/30 rounded-xl p-4 mb-6 border border-slate-700/50">
            <p className="text-base text-slate-300 leading-relaxed">{news.summary}</p>
          </div>

          {/* Key Points */}
          {news.key_points && news.key_points.length > 0 && (
            <div className={`mb-6 ${isLocked ? 'relative' : ''}`}>
              <h3 className="text-sm font-medium text-slate-400 mb-3">核心要点</h3>
              <div className={`space-y-2 ${isLocked ? 'blur-md' : ''}`}>
                {news.key_points.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-800/20 rounded-lg p-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-medium shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-300">{point}</p>
                  </div>
                ))}
              </div>
              
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-[#0F1A2E]/90 rounded-xl p-6 text-center border border-amber-500/20">
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
          {!isLocked && news.content && (
            <div className="prose prose-invert prose-sm max-w-none mb-8">
              <ReactMarkdown>{news.content}</ReactMarkdown>
            </div>
          )}

          {/* Related Stocks */}
          {news.related_stocks && news.related_stocks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-3">相关股票</h3>
              <div className="flex flex-wrap gap-2">
                {news.related_stocks.map((stock, idx) => (
                  <Badge key={idx} className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    ${stock}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Source */}
          {news.source_url && (
            <a 
              href={news.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              查看原文
            </a>
          )}

          {/* Subscription Banner */}
          {isLocked && (
            <div className="mt-8">
              <SubscriptionBanner />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}