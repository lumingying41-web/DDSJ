import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Building2, FileText, Lock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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

const institutionColors = {
  investment_bank: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  hedge_fund: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  asset_manager: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  research_firm: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

export default function InstitutionReportCard({ report, isPremiumUser = false }) {
  const isLocked = report.is_premium && !isPremiumUser;
  const institutionColor = institutionColors[report.institution_type] || institutionColors.research_firm;
  
  return (
    <Link 
      to={createPageUrl(`ReportDetail?id=${report.id}`)}
      className="block"
    >
      <div className={`
        group relative bg-[#0F1A2E]/80 backdrop-blur-sm border border-slate-700/50 
        rounded-xl p-5 hover:border-amber-500/30 transition-all duration-300
        hover:shadow-lg hover:shadow-amber-500/5
      `}>
        {/* Header with Institution */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {report.institution_logo ? (
              <img 
                src={report.institution_logo} 
                alt={report.institution}
                className="w-10 h-10 rounded-lg object-cover bg-slate-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-white">{report.institution}</h4>
              <Badge className={`${institutionColor} border text-xs mt-1`}>
                {institutionTypeLabels[report.institution_type] || report.institution_type}
              </Badge>
            </div>
          </div>
          
          {isLocked && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs flex items-center gap-1">
              <Lock className="w-3 h-3" />
              会员
            </Badge>
          )}
        </div>
        
        {/* Title */}
        <h3 className="text-base font-medium text-white mb-2 line-clamp-2 group-hover:text-amber-50 transition-colors">
          {report.title}
        </h3>
        
        {/* Summary */}
        <p className={`text-sm text-slate-400 mb-3 line-clamp-2 ${isLocked ? 'blur-sm' : ''}`}>
          {report.summary}
        </p>
        
        {/* Key Points */}
        {!isLocked && report.key_points && report.key_points.length > 0 && (
          <div className="space-y-1.5 mb-4 p-3 bg-slate-800/30 rounded-lg">
            {report.key_points.slice(0, 3).map((point, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                <span className="line-clamp-1">{point}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Bottom Row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-slate-800/50 text-slate-400 border-slate-600 text-xs">
              {reportTypeLabels[report.report_type] || report.report_type}
            </Badge>
            {report.related_stocks?.slice(0, 2).map((stock, idx) => (
              <Badge key={idx} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                ${stock}
              </Badge>
            ))}
          </div>
          
          <span className="text-xs text-slate-500">
            {report.published_at 
              ? format(new Date(report.published_at), 'MM/dd', { locale: zhCN })
              : format(new Date(report.created_date), 'MM/dd', { locale: zhCN })
            }
          </span>
        </div>
      </div>
    </Link>
  );
}