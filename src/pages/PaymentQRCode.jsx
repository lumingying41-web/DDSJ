import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentQRCode() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // pending, checking, success, failed
  const [countdown, setCountdown] = useState(900); // 15分钟倒计时
  
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');
  const qrUrl = urlParams.get('qr_url');
  const paymentUrl = urlParams.get('payment_url');
  const method = urlParams.get('method');
  
  // 倒计时
  useEffect(() => {
    if (status !== 'pending') return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setStatus('failed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status]);
  
  // 轮询检查支付状态
  useEffect(() => {
    if (!orderId || status !== 'pending') return;
    
    const checkStatus = async () => {
      try {
        const response = await base44.functions.invoke('checkPaymentStatus', {
          order_id: orderId
        });
        
        if (response.data.order.status === 'completed') {
          setStatus('success');
        } else if (response.data.order.status === 'failed' || response.data.order.status === 'expired') {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Check status error:', error);
      }
    };
    
    // 每3秒检查一次
    const interval = setInterval(checkStatus, 3000);
    
    return () => clearInterval(interval);
  }, [orderId, status]);
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleSimulateSuccess = async () => {
    // 模拟支付成功（测试用）
    setStatus('checking');
    await base44.functions.invoke('handlePaymentCallback', {
      order_number: orderId,
      status: 'success',
      transaction_id: `TEST_${Date.now()}`
    });
    setStatus('success');
  };

  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Subscription'))}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-white">
            {method === 'wechat' ? '微信支付' : '支付宝支付'}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardContent className="p-8 text-center">
                {/* 倒计时 */}
                <div className="mb-6 flex items-center justify-center gap-2 text-amber-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg font-medium">{formatTime(countdown)}</span>
                </div>
                
                {/* 二维码 */}
                {method === 'wechat' && qrUrl && (
                  <div className="mb-6">
                    <div className="inline-block p-4 bg-white rounded-xl">
                      <img src={qrUrl} alt="支付二维码" className="w-64 h-64" />
                    </div>
                    <p className="text-slate-400 mt-4">
                      请使用微信扫描二维码完成支付
                    </p>
                  </div>
                )}
                
                {/* 支付宝链接 */}
                {method === 'alipay' && paymentUrl && (
                  <div className="mb-6">
                    <div className="inline-block p-8 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20">
                      <div className="text-6xl mb-4">💙</div>
                      <p className="text-white font-medium mb-4">支付宝支付</p>
                      <Button 
                        className="bg-blue-500 hover:bg-blue-400 text-white"
                        onClick={() => window.open(paymentUrl, '_blank')}
                      >
                        打开支付宝支付
                      </Button>
                    </div>
                    <p className="text-slate-400 mt-4">
                      点击按钮跳转到支付宝完成支付
                    </p>
                  </div>
                )}
                
                {/* 支付状态 */}
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">等待支付...</span>
                </div>
                
                {/* 测试按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6 text-xs"
                  onClick={handleSimulateSuccess}
                >
                  模拟支付成功（测试）
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {status === 'checking' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-amber-400 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">正在确认支付...</h3>
                <p className="text-slate-400">请稍候</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-gradient-to-r from-emerald-500/10 via-emerald-600/10 to-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">支付成功！</h3>
                <p className="text-slate-400 mb-6">您的会员已激活，感谢订阅</p>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-400 text-white"
                  onClick={() => navigate(createPageUrl('Profile'))}
                >
                  查看我的会员
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-gradient-to-r from-red-500/10 via-red-600/10 to-red-500/10 border-red-500/20">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-12 h-12 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">支付超时</h3>
                <p className="text-slate-400 mb-6">订单已过期，请重新发起支付</p>
                <Button
                  className="bg-amber-500 hover:bg-amber-400 text-black"
                  onClick={() => navigate(createPageUrl('Subscription'))}
                >
                  返回订阅页面
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}