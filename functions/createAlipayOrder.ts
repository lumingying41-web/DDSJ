import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { plan, amount } = await req.json();
    
    // 支付宝配置
    const ALIPAY_APP_ID = '2088612000046005';
    const ALIPAY_GATEWAY = 'https://openapi.alipay.com/gateway.do';
    
    // 创建订单记录
    const orderNumber = `ALI${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const order = await base44.asServiceRole.entities.PaymentOrder.create({
      user_email: user.email,
      plan: plan,
      amount: amount,
      currency: 'CNY',
      payment_method: 'alipay',
      status: 'pending',
      order_number: orderNumber
    });
    
    // 获取当前应用的回调URL
    const APP_ID = Deno.env.get('BASE44_APP_ID');
    const callbackUrl = `https://api.base44.com/v1/apps/${APP_ID}/functions/alipayCallback`;
    
    // 使用扫码支付 API (alipay.trade.precreate)
    const bizContent = {
      out_trade_no: orderNumber,
      total_amount: amount.toFixed(2),
      subject: `顶点视角 - ${plan === 'monthly' ? '月度会员' : plan === 'yearly' ? '年度会员' : '终身会员'}`,
    };
    
    const params = {
      app_id: ALIPAY_APP_ID,
      method: 'alipay.trade.precreate',
      charset: 'UTF-8',
      sign_type: 'RSA2',
      timestamp: new Date().toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-').replace(',', ''),
      version: '1.0',
      notify_url: callbackUrl,
      biz_content: JSON.stringify(bizContent),
    };
    
    // 生成签名字符串
    const signString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // 使用私钥进行RSA2签名
    const ALIPAY_PRIVATE_KEY = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAva7x+L1H36yXQUGDJYrPrIr5Y1hZnFcrw2BRVJzxeAAMf9gDAxh1DqQztk5krdN2f3Vf4A06/UNR/NQrL9Q4KB2s3qNfgPUdrJ+onLERiGpRVQ/sZ3zEhH19IFIVgSe024SPwjq54sjdTO04P/8thuBK/qidqUSIyUR8lW+dMx41lrJ3aH6kdO7MXPC1moEtMqHIFcQk5M1otiLyo+3GOG7q6FSktIkn/90qHcbu8EfkPdZJbhH531IA6Su/5JBHI0oVvoWOwXxwrxftHJO3yecvsBh33RCuHkcYs5AFm4Ts5NA44v6qispScvud543fGPjLTciAhpW9H2ZmBA3bhwIDAQAB`;
    
    const keyData = Uint8Array.from(atob(ALIPAY_PRIVATE_KEY), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
    
    const encoder = new TextEncoder();
    const data = encoder.encode(signString);
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data);
    const sign = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    params.sign = sign;
    
    // 调用支付宝API
    const response = await fetch(`${ALIPAY_GATEWAY}?${new URLSearchParams(params).toString()}`);
    const responseText = await response.text();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { error: responseText };
    }
    
    // 检查响应
    if (result.alipay_trade_precreate_response?.code === '10000') {
      const qrCode = result.alipay_trade_precreate_response.qr_code;
      
      // 生成二维码图片URL
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`;
      
      return Response.json({
        success: true,
        order_id: order.id,
        order_number: orderNumber,
        qr_code: qrCode,
        qr_image_url: qrImageUrl,
        amount: amount,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
    } else {
      console.error('Alipay API Error:', result);
      return Response.json({ 
        error: result.alipay_trade_precreate_response?.msg || result.error || '创建支付订单失败',
        details: result
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});