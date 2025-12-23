import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PaymentMethod() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState(null);
  
  // 从 URL 获取订阅计划参数
  const urlParams = new URLSearchParams(window.location.search);
  const plan = urlParams.get('plan') || 'monthly';
  const amount = urlParams.get('amount') || '0';

  const paymentMethods = [
    {
      id: 'wechat',
      name: '微信支付',
      description: '使用微信扫码支付',
      icon: '💚',
      available: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: '使用 PayPal 安全支付',
      icon: '💳',
      available: true,
    },
  ];

  const handlePayment = async (method) => {
    setSelectedMethod(method.id);
    
    try {
      if (method.id === 'wechat') {
        // 创建微信支付订单
        const response = await base44.functions.invoke('createWeChatPayOrder', {
          plan: plan,
          amount: parseFloat(amount)
        });
        
        if (response.data.success) {
          // 显示二维码让用户扫码支付
          const qrUrl = response.data.qr_code_url;
          const orderId = response.data.order_id;
          
          // 跳转到支付页面显示二维码
          navigate(createPageUrl(`PaymentQRCode?order_id=${orderId}&qr_url=${encodeURIComponent(qrUrl)}&method=wechat`));
        }
      } else if (method.id === 'paypal') {
        // PayPal支付流程
        const mockOrderId = 'PAYPAL_ORDER_' + Date.now();
        
        const response = await base44.functions.invoke('verifyPayPalPayment', {
          orderId: mockOrderId,
          plan: plan
        });
        
        if (response.data.success) {
          alert('订阅成功！');
          navigate(createPageUrl('Profile'));
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('支付失败: ' + (error.response?.data?.error || error.message));
      setSelectedMethod(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-white">选择支付方式</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 border-amber-500/20 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">订阅计划</span>
                <span className="text-white font-medium">
                  {plan === 'monthly' && '月度会员'}
                  {plan === 'yearly' && '年度会员'}
                  {plan === 'lifetime' && '终身会员'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">应付金额</span>
                <span className="text-2xl font-bold text-amber-400">¥{amount}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h2 className="text-sm font-medium text-slate-400 mb-3">支付方式</h2>
          
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card 
                className={`
                  bg-slate-800/40 border-slate-700/50 cursor-pointer transition-all
                  ${selectedMethod === method.id ? 'border-amber-500/50 bg-amber-500/5' : 'hover:bg-slate-800/60'}
                  ${!method.available && 'opacity-50 cursor-not-allowed'}
                `}
                onClick={() => method.available && handlePayment(method)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{method.name}</span>
                        {method.badge && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                            {method.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{method.description}</p>
                    </div>
                    {selectedMethod === method.id && (
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50"
        >
          <p className="text-xs text-slate-400 text-center">
            🔒 您的支付信息通过 SSL 加密传输，绝对安全
          </p>
        </motion.div>

        {/* Terms */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center"
        >
          <p className="text-xs text-slate-500">
            继续即表示您同意我们的
            <span className="text-amber-400"> 服务条款 </span>
            和
            <span className="text-amber-400"> 隐私政策</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}