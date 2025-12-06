import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Crown, Zap, Check, Sparkles, Shield, Clock, 
  CreditCard, ChevronRight, ArrowLeft, AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const plans = [
  {
    id: 'monthly',
    name: '月度会员',
    price: 68,
    originalPrice: 98,
    period: '月',
    features: [
      '完整快讯深度解读',
      '全部个股研报',
      '机构报告全文',
      '实时推送提醒',
      '个性化订阅',
    ],
    popular: false,
  },
  {
    id: 'yearly',
    name: '年度会员',
    price: 588,
    originalPrice: 816,
    period: '年',
    monthlyPrice: 49,
    features: [
      '月度会员全部权益',
      '优先获取独家研报',
      '专属客服支持',
      '投资课程免费看',
      '线下活动邀请',
    ],
    popular: true,
    savings: '省 228 元',
  },
  {
    id: 'lifetime',
    name: '终身会员',
    price: 1888,
    originalPrice: 2888,
    period: '永久',
    features: [
      '年度会员全部权益',
      '终身免费升级',
      '一对一投资咨询',
      '私密投研社群',
      '专属定制报告',
    ],
    popular: false,
    savings: '省 1000 元',
  },
];

const features = [
  {
    icon: Zap,
    title: '深度快讯解读',
    description: '每条快讯附带三点要点、利好利空分析'
  },
  {
    icon: Crown,
    title: '专业研报',
    description: '覆盖主流美股，财报分析、估值模型'
  },
  {
    icon: Shield,
    title: '机构报告',
    description: '顶级投行、对冲基金研究报告精华'
  },
  {
    icon: Clock,
    title: '实时推送',
    description: '重大消息第一时间推送到您手机'
  },
];

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [autoRenew, setAutoRenew] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email });
        if (subs.length > 0) setSubscription(subs[0]);
      } catch (e) {}
    };
    loadUser();
  }, []);
  
  const isPremiumUser = subscription?.plan !== 'free' && subscription?.status === 'active';

  const handleSubscribe = async (planId) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    
    setIsProcessing(true);
    
    // Create or update subscription
    const planData = plans.find(p => p.id === planId);
    const endDate = new Date();
    if (planId === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
    else if (planId === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
    else if (planId === 'lifetime') endDate.setFullYear(endDate.getFullYear() + 100);
    
    if (subscription) {
      await base44.entities.Subscription.update(subscription.id, {
        plan: planId,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        auto_renew: autoRenew,
      });
    } else {
      await base44.entities.Subscription.create({
        user_email: user.email,
        plan: planId,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        auto_renew: autoRenew,
      });
    }
    
    setIsProcessing(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Header */}
      <div className="bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            解锁专业投资洞察
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            升级 <span className="text-amber-400">Premium</span> 会员
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            获取完整快讯解读、专业研报、机构报告，让您在投资决策中快人一步
          </p>
        </motion.div>

        {/* Current Status */}
        {isPremiumUser && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">您已是会员</p>
                <p className="text-sm text-slate-400">
                  {subscription?.plan === 'monthly' && '月度会员'}
                  {subscription?.plan === 'yearly' && '年度会员'}
                  {subscription?.plan === 'lifetime' && '终身会员'}
                  {subscription?.end_date && ` · 到期日期: ${subscription.end_date}`}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              有效
            </Badge>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectedPlan === plan.id 
                    ? 'bg-slate-800/80 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-medium px-3 py-1 rounded-bl-lg">
                    最受欢迎
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
                  <CardDescription className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">¥{plan.price}</span>
                    <span className="text-slate-500">/{plan.period}</span>
                    {plan.originalPrice && (
                      <span className="text-sm text-slate-500 line-through">¥{plan.originalPrice}</span>
                    )}
                  </CardDescription>
                  {plan.monthlyPrice && (
                    <p className="text-sm text-amber-400">约 ¥{plan.monthlyPrice}/月</p>
                  )}
                  {plan.savings && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 w-fit mt-2">
                      {plan.savings}
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full mt-6 ${
                      selectedPlan === plan.id 
                        ? 'bg-amber-500 hover:bg-amber-400 text-black' 
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(plan.id);
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '处理中...' : '立即订阅'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Auto Renew Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12 p-4 bg-slate-800/30 rounded-xl">
          <div className="flex items-center gap-3">
            <Switch 
              checked={autoRenew} 
              onCheckedChange={setAutoRenew}
              className="data-[state=checked]:bg-amber-500"
            />
            <span className="text-sm text-slate-300">自动续费</span>
          </div>
          <p className="text-xs text-slate-500">
            开启后到期自动续费，可随时在个人中心取消
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50"
            >
              <feature.icon className="w-8 h-8 text-amber-400 mb-3" />
              <h3 className="text-white font-medium mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="text-center mb-8">
          <p className="text-sm text-slate-500 mb-4">支持的支付方式</p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm">信用卡</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-5 h-5 bg-green-500 rounded text-xs flex items-center justify-center text-white font-bold">微</div>
              <span className="text-sm">微信支付</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-5 h-5 bg-blue-500 rounded text-xs flex items-center justify-center text-white font-bold">支</div>
              <span className="text-sm">支付宝</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="text-center text-xs text-slate-500 max-w-2xl mx-auto">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          订阅即表示您同意我们的服务条款和隐私政策。自动续费将在到期前24小时内自动扣款，您可以随时在个人中心取消自动续费。
        </div>
      </div>
    </div>
  );
}