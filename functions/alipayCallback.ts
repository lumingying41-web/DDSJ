import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 获取支付宝回调参数
    const formData = await req.formData();
    const params = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }
    
    // 支付宝公钥
    const ALIPAY_PUBLIC_KEY = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlswksReKwhpZSjDHnJ07GKs5gU6CR3FIqYYaHDc1LLhmqzkrL/4ZAd0fgIt5UBLctXNIv5mZA3K7G7S23Nt8btEgm4PseYPh2K3glS5zP/vp2TSckYMvpkkLcuryRp0QsK/mSTOH66JOwg5IV7I+84JXbsXPFr/B+y36mafecHVue0nT5MI1lhwEFgj89MmwBc/JLv8DVOp6RjFOZFijml5T7FWeBDsCSCUoh9tLEcljrjmfAUYoC94HrFswC4KCce31MQWDMVMUPnsmOfaqkGMGgoaNXVVwI3OAvBkPASBSYYDBPiuvULh8Ogx8EikiOSiy49n3FHXJt3/M4hCbfQIDAQAB`;
    
    const sign = params.sign;
    delete params.sign;
    delete params.sign_type;
    
    // 验证签名
    const signString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const expectedSign = createHash('sha256')
      .update(signString + ALIPAY_PUBLIC_KEY)
      .digest('base64');
    
    if (sign !== expectedSign) {
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