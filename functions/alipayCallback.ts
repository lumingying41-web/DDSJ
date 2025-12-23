import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import AlipaySdk from 'npm:alipay-sdk@3.4.0';

const alipaySdk = new AlipaySdk({
  appId: '9021000158673541',
  alipayPublicKey: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArVRqkWA8jEmTcMdRlvSgxoHIYnqwvWXYAYYuM9dj+fOLY3dibm6gnx2I0hLXjZl8jCG3TZpW+mz38jW3OBrsZ62JBdo1RmQJO9Nov9pX1lT+bbI20dlmXuRewv2QsoIbCWO7fjBIoTrXf158eLGma3jg8eL23KH4ah0VpU4s5YvmD4hCaj2xscwO3cXM9qUWu+50Bo28ExFDuHShRZgmuyKS7VlgxLBBmEl6fTbQR5X1oFzrwMz2I/13Q91oE/aU/jAOQVB1SZ3rsPM70Ud5FJ39vAjKNyx9/CEaVbmWZPxluSSUtseXT2rOEtlgZdi3zGN993V2Oq7h0yPB0O13EQIDAQAB`,
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 获取支付宝回调参数
    const formData = await req.formData();
    const params = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }
    
    console.log('Alipay callback params:', params);
    
    // 使用 SDK 验证签名
    const isValid = alipaySdk.checkNotifySign(params);
    
    if (!isValid) {
      console.error('Invalid signature');
      return new Response('fail');
    }
    
    // 验证成功，更新订单状态
    const outTradeNo = params.out_trade_no;
    const tradeStatus = params.trade_status;
    
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      const orders = await base44.asServiceRole.entities.PaymentOrder.filter({ 
        order_number: outTradeNo 
      });
      
      if (orders.length > 0) {
        const order = orders[0];
        
        // 更新订单
        await base44.asServiceRole.entities.PaymentOrder.update(order.id, {
          status: 'completed',
          transaction_id: params.trade_no,
          paid_at: new Date().toISOString()
        });
        
        // 创建或更新订阅
        const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ 
          user_email: order.user_email 
        });
        
        const now = new Date();
        let endDate = new Date();
        
        if (order.plan === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (order.plan === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else if (order.plan === 'lifetime') {
          endDate.setFullYear(endDate.getFullYear() + 100);
        }
        
        if (existingSubs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            plan: order.plan,
            status: 'active',
            start_date: now.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            auto_renew: true
          });
        } else {
          await base44.asServiceRole.entities.Subscription.create({
            user_email: order.user_email,
            plan: order.plan,
            status: 'active',
            start_date: now.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            auto_renew: true,
            payment_method: 'alipay'
          });
        }
      }
    }
    
    // 返回成功响应给支付宝
    return new Response('success');
  } catch (error) {
    console.error('Error:', error);
    return new Response('fail');
  }
});