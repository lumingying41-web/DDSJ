import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Crown, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubscriptionBanner({ variant = 'default' }) {
  if (variant === 'compact') {
    return (
      <Link to={createPageUrl('Subscription')}>
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">升级会员</h4>
              <p className="text-xs text-slate-400">解锁全部深度内容</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-400" />
        </div>
      </Link>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-amber-600/20" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      
      <div className="relative border border-amber-500/30 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Crown className="w-10 h-10 text-black" />
            </div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 border border-amber-500/30 rounded-2xl"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Premium</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              解锁全部深度内容
            </h3>
            <p className="text-sm text-slate-400 mb-4 max-w-md">
              订阅会员，获取完整快讯解读、专业研报、机构报告，掌握市场先机
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap items-center gap-3 mb-4 justify-center md:justify-start">
              {['深度快讯', '专业研报', '机构报告', '实时推送'].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-1 text-xs text-slate-300">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex flex-col items-center gap-2">
            <Link to={createPageUrl('Subscription')}>
              <Button className="bg-amber-500 hover:bg-amber-400 text-black font-medium px-8 py-6 rounded-xl shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-400/40 hover:scale-105">
                立即订阅
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <span className="text-xs text-slate-500">首月仅 ¥68</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}