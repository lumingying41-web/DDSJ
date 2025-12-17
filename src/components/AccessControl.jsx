import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Crown, Lock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, differenceInDays, isAfter, startOfDay } from 'date-fns';

/**
 * 内容访问控制组件
 * 检查用户的试用期和订阅状态
 * 对于研报和机构内容实施每日阅读限制
 */
export default function AccessControl({ contentType, children, onAccessGranted }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [accessStatus, setAccessStatus] = useState({
    canAccess: false,
    isLoading: true,
    message: '',
    remainingReads: 0,
    daysRemaining: 0,
    inTrialPeriod: false,
  });

  useEffect(() => {
    checkAccess();
  }, [contentType]);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // 获取订阅信息
      const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email });
      const activeSub = subs.length > 0 ? subs[0] : null;
      setSubscription(activeSub);

      // 检查是否为付费会员
      const isPremium = activeSub?.plan !== 'free' && activeSub?.status === 'active';

      // 快讯内容始终免费
      if (contentType === 'news') {
        setAccessStatus({ canAccess: true, isLoading: false });
        if (onAccessGranted) onAccessGranted();
        return;
      }

      // 付费会员无限制访问
      if (isPremium) {
        setAccessStatus({ canAccess: true, isLoading: false });
        if (onAccessGranted) onAccessGranted();
        return;
      }

      // 检查试用期
      const trialEndDate = currentUser.trial_end_date 
        ? new Date(currentUser.trial_end_date)
        : new Date(new Date(currentUser.created_date).getTime() + 15 * 24 * 60 * 60 * 1000);

      const now = new Date();
      const inTrialPeriod = isAfter(trialEndDate, now);
      const daysRemaining = Math.max(0, differenceInDays(trialEndDate, now));

      // 如果在试用期内，允许访问
      if (inTrialPeriod) {
        setAccessStatus({
          canAccess: true,
          isLoading: false,
          inTrialPeriod: true,
          daysRemaining,
        });
        if (onAccessGranted) onAccessGranted();
        
        // 首次设置试用结束日期
        if (!currentUser.trial_end_date) {
          await base44.auth.updateMe({ trial_end_date: trialEndDate.toISOString() });
        }
        return;
      }

      // 试用期结束，检查每日阅读限制
      const today = format(startOfDay(now), 'yyyy-MM-dd');
      const lastReadDate = currentUser.last_read_date;

      let currentCount = 0;
      
      if (contentType === 'research') {
        currentCount = lastReadDate === today ? (currentUser.daily_research_read_count || 0) : 0;
      } else if (contentType === 'institution') {
        currentCount = lastReadDate === today ? (currentUser.daily_institution_read_count || 0) : 0;
      }

      const remainingReads = Math.max(0, 2 - currentCount);

      if (currentCount < 2) {
        setAccessStatus({
          canAccess: true,
          isLoading: false,
          remainingReads,
          inTrialPeriod: false,
        });
        if (onAccessGranted) onAccessGranted();
        
        // 更新阅读计数
        await incrementReadCount(currentUser, contentType, today);
      } else {
        setAccessStatus({
          canAccess: false,
          isLoading: false,
          message: `今日${contentType === 'research' ? '研报' : '机构内容'}阅读次数已用完`,
          remainingReads: 0,
          inTrialPeriod: false,
        });
      }
    } catch (error) {
      setAccessStatus({ 
        canAccess: false, 
        isLoading: false, 
        message: '请登录后继续'
      });
    }
  };

  const incrementReadCount = async (currentUser, type, today) => {
    const updates = { last_read_date: today };
    
    if (type === 'research') {
      const newCount = currentUser.last_read_date === today 
        ? (currentUser.daily_research_read_count || 0) + 1 
        : 1;
      updates.daily_research_read_count = newCount;
      if (currentUser.last_read_date !== today) {
        updates.daily_institution_read_count = 0;
      }
    } else if (type === 'institution') {
      const newCount = currentUser.last_read_date === today 
        ? (currentUser.daily_institution_read_count || 0) + 1 
        : 1;
      updates.daily_institution_read_count = newCount;
      if (currentUser.last_read_date !== today) {
        updates.daily_research_read_count = 0;
      }
    }

    await base44.auth.updateMe(updates);
  };

  if (accessStatus.isLoading) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!accessStatus.canAccess) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 p-8 max-w-md">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-white mb-2">内容访问受限</h2>
                <p className="text-slate-400 text-sm">
                  {accessStatus.message || '您已达到今日免费阅读上限'}
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                <p className="text-xs text-slate-500">升级会员即可</p>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>✓ 无限制阅读所有内容</li>
                  <li>✓ 深度研报分析</li>
                  <li>✓ 机构独家观点</li>
                  <li>✓ 实时市场快讯</li>
                </ul>
              </div>

              <Link to={createPageUrl('Subscription')}>
                <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black">
                  <Crown className="w-4 h-4 mr-2" />
                  立即升级会员
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // 显示试用期提示
  if (accessStatus.inTrialPeriod && accessStatus.daysRemaining <= 5) {
    return (
      <div>
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-b border-amber-500/20 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300">
                免费试用剩余 {accessStatus.daysRemaining} 天
              </span>
            </div>
            <Link to={createPageUrl('Subscription')}>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black text-xs">
                立即订阅
              </Button>
            </Link>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // 显示每日阅读限制提示
  if (!accessStatus.inTrialPeriod && accessStatus.remainingReads > 0) {
    return (
      <div>
        <div className="bg-slate-800/30 border-b border-slate-700/50 px-4 py-2">
          <div className="max-w-4xl mx-auto text-center text-xs text-slate-400">
            今日还可免费阅读 {accessStatus.remainingReads} 篇{contentType === 'research' ? '研报' : '机构内容'}
          </div>
        </div>
        {children}
      </div>
    );
  }

  return children;
}