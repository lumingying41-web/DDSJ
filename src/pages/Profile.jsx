import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  User, Crown, Bookmark, Bell, Settings, LogOut, 
  ChevronRight, Shield, Calendar, CreditCard, TrendingUp,
  Building2, FileText, Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email });
        if (subs.length > 0) setSubscription(subs[0]);
        
        const prefs = await base44.entities.UserPreference.filter({ user_email: currentUser.email });
        if (prefs.length > 0) setPreferences(prefs[0]);
      } catch (e) {
        base44.auth.redirectToLogin();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks', user?.email],
    queryFn: () => base44.entities.Bookmark.filter({ user_email: user.email }, '-created_date', 10),
    enabled: !!user?.email,
  });
  
  const isPremiumUser = subscription?.plan !== 'free' && subscription?.status === 'active';

  const handleLogout = () => {
    base44.auth.logout();
  };

  const togglePush = async (enabled) => {
    if (!preferences) {
      await base44.entities.UserPreference.create({
        user_email: user.email,
        push_enabled: enabled,
      });
    } else {
      await base44.entities.UserPreference.update(preferences.id, {
        push_enabled: enabled,
      });
    }
    setPreferences(prev => ({ ...prev, push_enabled: enabled }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070D18] px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full bg-slate-700" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 bg-slate-700" />
              <Skeleton className="h-4 w-48 bg-slate-700" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-xl bg-slate-700" />
          <Skeleton className="h-48 w-full rounded-xl bg-slate-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D18]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* User Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <User className="w-8 h-8 text-black" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{user?.full_name || '用户'}</h1>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
          {isPremiumUser && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1">
              <Crown className="w-3 h-3" />
              会员
            </Badge>
          )}
        </motion.div>

        {/* Subscription Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 border-amber-500/20 mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <span className="text-white font-medium">
                      {isPremiumUser ? (
                        <>
                          {subscription?.plan === 'monthly' && '月度会员'}
                          {subscription?.plan === 'yearly' && '年度会员'}
                          {subscription?.plan === 'lifetime' && '终身会员'}
                        </>
                      ) : '免费用户'}
                    </span>
                  </div>
                  {isPremiumUser && subscription?.end_date && (
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      到期日期: {format(new Date(subscription.end_date), 'yyyy年MM月dd日', { locale: zhCN })}
                    </p>
                  )}
                  {!isPremiumUser && (
                    <p className="text-sm text-slate-400">
                      升级会员解锁全部内容
                    </p>
                  )}
                </div>
                <Link to={createPageUrl('Subscription')}>
                  <Button className={isPremiumUser ? 'bg-slate-700 hover:bg-slate-600' : 'bg-amber-500 hover:bg-amber-400 text-black'}>
                    {isPremiumUser ? '管理订阅' : '立即升级'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
            <Bookmark className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <span className="text-xl font-bold text-white">{bookmarks.length}</span>
            <p className="text-xs text-slate-400">收藏</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
            <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <span className="text-xl font-bold text-white">{preferences?.followed_stocks?.length || 0}</span>
            <p className="text-xs text-slate-400">关注股票</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
            <Building2 className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <span className="text-xl font-bold text-white">{preferences?.followed_institutions?.length || 0}</span>
            <p className="text-xs text-slate-400">关注机构</p>
          </div>
        </motion.div>

        {/* Bookmarks */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/40 border-slate-700/50 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                我的收藏
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookmarks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">暂无收藏</p>
              ) : (
                <div className="space-y-2">
                  {bookmarks.slice(0, 5).map((bookmark) => (
                    <Link 
                      key={bookmark.id}
                      to={createPageUrl(
                        bookmark.item_type === 'news' ? `NewsDetail?id=${bookmark.item_id}` :
                        bookmark.item_type === 'research' ? `ResearchDetail?id=${bookmark.item_id}` :
                        `ReportDetail?id=${bookmark.item_id}`
                      )}
                    >
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                        {bookmark.item_type === 'news' && <Zap className="w-4 h-4 text-amber-400" />}
                        {bookmark.item_type === 'research' && <FileText className="w-4 h-4 text-blue-400" />}
                        {bookmark.item_type === 'report' && <Building2 className="w-4 h-4 text-purple-400" />}
                        <span className="text-sm text-slate-300 truncate flex-1">{bookmark.item_title}</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-800/40 border-slate-700/50 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">推送通知</span>
                </div>
                <Switch 
                  checked={preferences?.push_enabled ?? true}
                  onCheckedChange={togglePush}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
              
              <Link to={createPageUrl('Preferences')}>
                <div className="flex items-center justify-between py-2 hover:bg-slate-700/30 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">订阅偏好</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </Link>
              
              <Link to={createPageUrl('LanguageSelector')}>
                <div className="flex items-center justify-between py-2 hover:bg-slate-700/30 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 text-center">🌍</span>
                    <span className="text-sm text-slate-300">语言与地区</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {user?.region === 'CN' ? '中国大陆' : user?.region === 'US' ? 'International' : user?.region || 'CN'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </Link>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">隐私政策</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-800 border-slate-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">确认退出</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  确定要退出登录吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                  取消
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
                  退出
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </div>
    </div>
  );
}