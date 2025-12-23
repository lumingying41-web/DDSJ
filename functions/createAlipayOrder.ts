import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { plan, amount } = await req.json();
    
    // 支付宝配置
    const ALIPAY_APP_ID = '2088612000046005'; // 商户号
    const ALIPAY_GATEWAY = 'https://openapi.alipay.com/gateway.do';
    const ALIPAY_PRIVATE_KEY = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAva7x+L1H36yXQUGDJYrPrIr5Y1hZnFcrw2BRVJzxeAAMf9gDAxh1DqQztk5krdN2f3Vf4A06/UNR/NQrL9Q4KB2s3qNfgPUdrJ+onLERiGpRVQ/sZ3zEhH19IFIVgSe024SPwjq54sjdTO04P/8thuBK/qidqUSIyUR8lW+dMx41lrJ3aH6kdO7MXPC1moEtMqHIFcQk5M1otiLyo+3GOG7q6FSktIkn/90qHcbu8EfkPdZJbhH531IA6Su/5JBHI0oVvoWOwXxwrxftHJO3yecvsBh33RCuHkcYs5AFm4Ts5NA44v6qispScvud543fGPjLTciAhpW9H2ZmBA3bhwIDAQAB`;
    
    // 创建订单记录
    const order = await base44.asServiceRole.entities.PaymentOrder.create({
      user_email: user.email,
      plan: plan,
      amount: amount,
      currency: 'CNY',
      payment_method: 'alipay',
      status: 'pending',
      order_number: `ALI${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    });
    
    // 获取当前应用的回调URL
    const APP_ID = Deno.env.get('BASE44_APP_ID');
    const callbackUrl = `https://api.base44.com/v1/apps/${APP_ID}/functions/alipayCallback`;
    
    // 构建支付宝请求参数
    const bizContent = {
      out_trade_no: order.order_number,
      total_amount: amount.toFixed(2),
      subject: `顶点视角 - ${plan === 'monthly' ? '月度会员' : plan === 'yearly' ? '年度会员' : '终身会员'}`,
      product_code: 'FAST_INSTANT_TRADE_PAY',
    };
    
    const params = {
      app_id: ALIPAY_APP_ID,
      method: 'alipay.trade.page.pay',
      charset: 'UTF-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      version: '1.0',
      notify_url: callbackUrl,
      biz_content: JSON.stringify(bizContent),
    };
    
    // 生成签名
    const signString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const sign = createHash('sha256')
      .update(signString + ALIPAY_PRIVATE_KEY)
      .digest('base64');
    
    params.sign = sign;
    
    // 构建支付URL
    const paymentUrl = `${ALIPAY_GATEWAY}?${new URLSearchParams(params).toString()}`;
    
    return Response.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      payment_url: paymentUrl,
      amount: amount,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});