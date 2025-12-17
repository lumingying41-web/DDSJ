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
  TrendingUp, TrendingDown, Target, User, BookOpen, Lock, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from 'react-markdown';
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner';
import AccessControl from '@/components/AccessControl';

const ratingConfig = {
  strong_buy: { label: '强烈买入', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: TrendingUp },
  buy: { label: '买入', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: TrendingUp },
  hold: { label: '持有', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  sell: { label: '卖出', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: TrendingDown },
  strong_sell: { label: '强烈卖出', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: TrendingDown }
};

const categoryLabels = {
  earnings: '财报解读',
  valuation: '估值分析',
  industry: '行业分析',
  technical: '技术分析',
  deep_dive: '深度研究'
};

export default function ResearchDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const researchId = urlParams.get('id');
  
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
          item_type: 'research', 
          item_id: researchId 
        });
        setIsBookmarked(bookmarks.length > 0);
      } catch (e) {}
    };
    loadUser();
  }, [researchId]);
  
  const isPremiumUser = subscription?.plan !== 'free' && subscription?.status === 'active';
  
  const { data: research, isLoading } = useQuery({
    queryKey: ['research', researchId],
    queryFn: async () => {
      const items = await base44.entities.Research.filter({ id: researchId });
      return items[0];
    },
    enabled: !!researchId,
  });
  
  const toggleBookmark = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    
    if (isBookmarked) {
      const bookmarks = await base44.entities.Bookmark.filter({
        user_email: user.email, item_type: 'research', item_id: researchId
      });
      if (bookmarks[0]) await base44.entities.Bookmark.delete(bookmarks[0].id);
    } else {
      await base44.entities.Bookmark.create({
        user_email: user.email,
        item_type: 'research',
        item_id: researchId,
        item_title: research?.title
      });
    }
    setIsBookmarked(!isBookmarked);
  };
  
  const isLocked = research?.is_premium && !isPremiumUser;
  const rating = research ? ratingConfig[research.rating] || ratingConfig.hold : ratingConfig.hold;
  const RatingIcon = rating.icon;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070D18] px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32 bg-slate-700" />
          <Skeleton className="h-48 w-full rounded-xl bg-slate-700" />
          <Skeleton className="h-10 w-full bg-slate-700" />
          <Skeleton className="h-6 w-3/4 bg-slate-700" />
        </div>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-white mb-4">研报不存在</h2>
          <Link to={createPageUrl('Research')}>
            <Button variant="outline">返回研报列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AccessControl contentType="research">
      <div className="min-h-screen bg-[#070D18]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Research')}>
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
        {/* Cover Image */}
        {research.cover_image && (
          <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden mb-6">
            <img 
              src={research.cover_image} 
              alt={research.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070D18] via-transparent to-transparent" />
          </div>
        )}

        {/* Stock & Meta */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-base px-3 py-1">
            ${research.stock_symbol}
          </Badge>
          {research.stock_name && (
            <span className="text-slate-400">{research.stock_name}</span>
          )}
          <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-600">
            {categoryLabels[research.category] || research.category}
          </Badge>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
          {research.title}
        </h1>

        {/* Author & Read Time */}
        <div className="flex items-center gap-6 mb-6 text-sm text-slate-400">
          {research.author && (
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {research.author}
            </span>
          )}
          {research.read_time && (
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {research.read_time} 分钟阅读
            </span>
          )}
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {format(new Date(research.published_at || research.created_date), 'yyyy年MM月dd日', { locale: zhCN })}
          </span>
        </div>

        {/* Rating & Target */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">评级</span>
            <Badge className={`${rating.color} border flex items-center gap-1`}>
              {RatingIcon && <RatingIcon className="w-3 h-3" />}
              {rating.label}
            </Badge>
          </div>
          {research.target_price && (
            <div className="flex items-center gap-2 ml-auto">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-400">目标价</span>
              <span className="text-lg font-bold text-emerald-400">${research.target_price}</span>
            </div>
          )}
        </div>

        {/* Summary */}
        {research.summary && (
          <div className="bg-slate-800/20 rounded-xl p-4 mb-6 border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-400 mb-2">摘要</h3>
            <p className="text-base text-slate-300 leading-relaxed">{research.summary}</p>
          </div>
        )}

        {/* Full Content */}
        {isLocked ? (
          <div className="relative">
            <div className="prose prose-invert prose-sm max-w-none blur-md">
              <p className="text-slate-300">
                {research.summary?.slice(0, 200)}... 本文深入分析了该公司的财务状况、市场竞争力、行业趋势以及未来发展前景。通过详细的财务模型和估值分析，我们得出了对该股票的投资建议...
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-[#0F1A2E]/95 rounded-xl p-8 text-center border border-amber-500/20 max-w-md">
                <Lock className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">会员专享研报</h3>
                <p className="text-sm text-slate-400 mb-4">订阅会员解锁完整研报内容，获取专业投资分析</p>
                <Link to={createPageUrl('Subscription')}>
                  <Button className="bg-amber-500 hover:bg-amber-400 text-black">
                    <Crown className="w-4 h-4 mr-2" />
                    立即解锁
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : research.content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{research.content}</ReactMarkdown>
          </div>
        ) : null}

        {/* Tags */}
        {research.tags && research.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-700/50">
            {research.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-slate-400 border-slate-600">
                #{tag}
              </Badge>
            ))}
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
    </AccessControl>
  );
}