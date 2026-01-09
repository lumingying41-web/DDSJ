import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Clock, Zap, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const sentimentConfig = {
  bullish: { icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: '利好' },
  bearish: { icon: TrendingDown, color: 'bg-red-500/10 text-red-400 border-red-500/20', label: '利空' },
  neutral: { icon: Minus, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: '中性' }
};

const categoryLabels = {
  earnings: '财报',
  fed: '美联储',
  analyst: '分析师',
  macro: '宏观',
  ipo: 'IPO',
  merger: '并购',
  policy: '政策',
  other: '其他'
};

const importanceConfig = {
  high: { icon: Zap, color: 'text-amber-400' },
  medium: { icon: AlertTriangle, color: 'text-slate-400' },
  low: { color: 'text-slate-500' }
};

export default function NewsCard({ news, isPremiumUser = false }) {
  const sentiment = sentimentConfig[news.sentiment] || sentimentConfig.neutral;
  const SentimentIcon = sentiment.icon;
  const importance = importanceConfig[news.importance] || importanceConfig.low;
  const ImportanceIcon = importance.icon;
  
  const isLocked = news.is_premium && !isPremiumUser;
  
  return (
    <div className={`
      relative bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 
      rounded-xl p-4 transition-all duration-300
      ${isLocked ? 'opacity-75' : ''}
    `}>
        {/* Top Row - Time & Importance */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>
              {news.published_at 
                ? format(new Date(news.published_at), 'HH:mm', { locale: zhCN })
                : format(new Date(news.created_date), 'HH:mm', { locale: zhCN })
              }
            </span>
            {news.source && (
              <>
                <span className="text-slate-600">·</span>
                <span>{news.source}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {ImportanceIcon && news.importance === 'high' && (
              <ImportanceIcon className={`w-4 h-4 ${importance.color}`} />
            )}
            {isLocked && (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                会员专享
              </Badge>
            )}
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-base font-medium text-white mb-3 leading-relaxed">
          {news.title}
        </h3>
        
        {/* Full Content */}
        <div className={`text-sm text-slate-300 mb-3 leading-relaxed whitespace-pre-wrap ${isLocked ? 'blur-sm' : ''}`}>
          {news.content || news.summary}
        </div>
        
        {/* Key Points */}
        {!isLocked && news.key_points && news.key_points.length > 0 && (
          <div className="space-y-2 mb-3 bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-xs text-amber-400 font-medium mb-2">关键要点</div>
            {news.key_points.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="text-amber-500 mt-1">•</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Bottom Row - Tags & Sentiment */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-600 text-xs">
              {categoryLabels[news.category] || news.category}
            </Badge>
            {news.related_stocks?.slice(0, 2).map((stock, idx) => (
              <Badge key={idx} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                ${stock}
              </Badge>
            ))}
          </div>
          
          <Badge className={`${sentiment.color} border text-xs flex items-center gap-1`}>
            <SentimentIcon className="w-3 h-3" />
            {sentiment.label}
          </Badge>
        </div>
        
        {/* Source Link */}
        {news.source_url && (
          <a 
            href={news.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1 mt-2"
          >
            查看原文 →
          </a>
        )}
      </div>
  );
}