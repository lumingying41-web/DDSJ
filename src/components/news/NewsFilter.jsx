import React from 'react';
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Zap, Building2, LineChart, Globe } from 'lucide-react';

const categories = [
  { id: 'all', label: '全部', icon: null },
  { id: 'earnings', label: '财报', icon: LineChart },
  { id: 'fed', label: '美联储', icon: Building2 },
  { id: 'analyst', label: '分析师', icon: TrendingUp },
  { id: 'macro', label: '宏观', icon: Globe },
  { id: 'ipo', label: 'IPO', icon: Zap },
];

const sentiments = [
  { id: 'all', label: '全部' },
  { id: 'bullish', label: '利好', icon: TrendingUp, color: 'text-emerald-400' },
  { id: 'bearish', label: '利空', icon: TrendingDown, color: 'text-red-400' },
];

export default function NewsFilter({ 
  activeCategory, 
  setActiveCategory, 
  activeSentiment, 
  setActiveSentiment 
}) {
  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <Button
              key={cat.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={`
                shrink-0 rounded-full transition-all
                ${isActive 
                  ? 'bg-amber-500 text-black hover:bg-amber-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
              `}
            >
              {Icon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
              {cat.label}
            </Button>
          );
        })}
      </div>
      
      {/* Sentiment Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-2">情绪筛选：</span>
        {sentiments.map((sent) => {
          const Icon = sent.icon;
          const isActive = activeSentiment === sent.id;
          return (
            <button
              key={sent.id}
              onClick={() => setActiveSentiment(sent.id)}
              className={`
                flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all
                ${isActive 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-500 hover:text-slate-300'
                }
              `}
            >
              {Icon && <Icon className={`w-3 h-3 ${sent.color}`} />}
              {sent.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}