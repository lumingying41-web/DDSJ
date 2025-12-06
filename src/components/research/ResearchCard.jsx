import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Clock, Lock, TrendingUp, TrendingDown, Minus, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const ratingConfig = {
  strong_buy: { label: '强烈买入', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  buy: { label: '买入', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  hold: { label: '持有', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  sell: { label: '卖出', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  strong_sell: { label: '强烈卖出', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
};

const categoryLabels = {
  earnings: '财报解读',
  valuation: '估值分析',
  industry: '行业分析',
  technical: '技术分析',
  deep_dive: '深度研究'
};

export default function ResearchCard({ research, isPremiumUser = false, variant = 'default' }) {
  const rating = ratingConfig[research.rating] || ratingConfig.hold;
  const isLocked = research.is_premium && !isPremiumUser;
  
  if (variant === 'compact') {
    return (
      <Link 
        to={createPageUrl(`ResearchDetail?id=${research.id}`)}
        className="block"
      >
        <div className="group flex items-center gap-4 p-3 bg-[#0F1A2E]/60 rounded-lg border border-slate-700/30 hover:border-amber-500/30 transition-all">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                ${research.stock_symbol}
              </Badge>
              {isLocked && <Lock className="w-3 h-3 text-amber-400" />}
            </div>
            <h4 className="text-sm font-medium text-white truncate group-hover:text-amber-50">
              {research.title}
            </h4>
          </div>
          <Badge className={`${rating.color} border text-xs shrink-0`}>
            {rating.label}
          </Badge>
        </div>
      </Link>
    );
  }
  
  return (
    <Link 
      to={createPageUrl(`ResearchDetail?id=${research.id}`)}
      className="block"
    >
      <div className={`
        group relative bg-[#0F1A2E]/80 backdrop-blur-sm border border-slate-700/50 
        rounded-xl overflow-hidden hover:border-amber-500/30 transition-all duration-300
        hover:shadow-lg hover:shadow-amber-500/5
      `}>
        {/* Cover Image */}
        {research.cover_image && (
          <div className="relative h-40 overflow-hidden">
            <img 
              src={research.cover_image} 
              alt={research.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A2E] to-transparent" />
            {isLocked && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-amber-500/90 text-black text-xs flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  会员专享
                </Badge>
              </div>
            )}
          </div>
        )}
        
        <div className="p-4">
          {/* Stock & Category */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              ${research.stock_symbol}
            </Badge>
            {research.stock_name && (
              <span className="text-xs text-slate-500">{research.stock_name}</span>
            )}
            <Badge variant="outline" className="bg-slate-800/50 text-slate-400 border-slate-600 text-xs ml-auto">
              {categoryLabels[research.category] || research.category}
            </Badge>
          </div>
          
          {/* Title */}
          <h3 className="text-base font-medium text-white mb-2 line-clamp-2 group-hover:text-amber-50 transition-colors">
            {research.title}
          </h3>
          
          {/* Summary */}
          <p className={`text-sm text-slate-400 mb-4 line-clamp-2 ${isLocked ? 'blur-sm' : ''}`}>
            {research.summary}
          </p>
          
          {/* Bottom Row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {research.author && <span>{research.author}</span>}
              {research.read_time && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {research.read_time} min
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {research.target_price && (
                <span className="text-xs text-emerald-400">
                  目标价 ${research.target_price}
                </span>
              )}
              <Badge className={`${rating.color} border text-xs`}>
                {rating.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}