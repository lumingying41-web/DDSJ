import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import AlipaySdk from 'npm:alipay-sdk@3.4.0';

const alipaySdk = new AlipaySdk({
  appId: '2021006120697145',
  alipayPublicKey: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAva7x+L1H36yXQUGDJYrPrIr5Y1hZnFcrw2BRVJzxeAAMf9gDAxh1DqQztk5krdN2f3Vf4A06/UNR/NQrL9Q4KB2s3qNfgPUdrJ+onLERiGpRVQ/sZ3zEhH19IFIVgSe024SPwjq54sjdTO04P/8thuBK/qidqUSIyUR8lW+dMx41lrJ3aH6kdO7MXPC1moEtMqHIFcQk5M1otiLyo+3GOG7q6FSktIkn/90qHcbu8EfkPdZJbhH531IA6Su/5JBHI0oVvoWOwXxwrxftHJO3yecvsBh33RCuHkcYs5AFm4Ts5NA44v6qispScvud543fGPjLTciAhpW9H2ZmBA3bhwIDAQAB`,
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