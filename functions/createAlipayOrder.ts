import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import AlipaySdk from 'npm:alipay-sdk@3.4.0';
import AlipayFormData from 'npm:alipay-sdk@3.4.0/lib/form.js';

// 辅助函数：生成签名
function generateSign(params, privateKey) {
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'sign' && params[key] !== '' && params[key] !== null && params[key] !== undefined)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 使用crypto进行RSA签名
  const sign = crypto.subtle.importKey(
    'pkcs8',
    privateKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  return sign;
}

// 支付宝沙箱环境配置
const alipaySdk = new AlipaySdk({
  appId: '9021000158673541',
  privateKey: `MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQChmC3rbPi9maGicvSUSFK09+XoPRih8eoqXZDLxPX+qpgSsJQBZHKuMBd5pxd1th4B11/CGLSK8jW5gXrBl20/aDIEhY6UI3649UJ17WyUHGx1eQ52i+2xKeJ7B4Q/w8VfeFhRywN5CLBAVLojtn70HJsIfNy7Tvjf/N6ff6b0XR87YGKutHJsR/ctedOBHAt87hqiTjW7BAyRfaVDSBzcW0IHCz2sbH6q2k3bVABqfwrvg1dIhsv/6Y5caVoTU8NZ8Rn73vDXfjZq/N0XXF2+7I5WCKMtO0nbEoLEyL60AskugRXq4KyhWvWVdOcakTTkDA7pNW+w2DvIk19lp+hlAgMBAAECggEBAIBOuh9Vvkelpe68AjF/H5SrxXRalqV31WvgMSlq8bxNLkSgylQ0ss5WRz2EDB+eBEOIBHO0dB5jZX8vLQ5sMwWGsThf567+ZA9uRmAmrfEIhKHeBjrgrlHepQL1G/AZfS1p/A6t+MrwuCnMXKQgsrsXv43EvutHMFuBiC7zB9i8l9Ll2qzJPILyJK2sZEVW2/3oRPYlR3GbCwHz/YsuuTRBXcUpxTrZKYvpxpfdUzA1gG607Np5amGEEpVpftwgotnFzJveUUXHQBBcSUCkX1qjOy6u/eHL+nDCm6pqeRVe3w8RtLu1ASB7OL56OnSsczjMjc9j/h0xgroa+Zi4QH0CgYEA3o2TU0VyQMiT6PaBah3JobAC4mzBG5WfhZNNN+ZMoLLBRljrg1O0oLV46SNp6Hy0NS/w0aK0Qgc2DksJwVXCjygNiAmHdPLxcOQRwaZll9UV+Q7XWbM0NNBHJpUaOmaFjXGCzRi8CR4OtaIqOArI7B9hCLjs7VPTjwquF/aZm98CgYEAueFOPtZwbTbyrbzhgaNM5ZVEbUjR6g2HxKUj0iAITHFWARlUJOHBirlNDaxWzRRupNO4nxW8jdfxxFCUarM1hJGj8DykeD80jLKvpq4uGoUvi3G8dYSL4UyiAQlGHbNmAEGF3nPipLc98AnKAfoHSOynzcQpaPy9NBxZGOBehDsCgYEA01qCol9efPW/ukt4Ze26EiqU4rHDxs2WvIVCnSbCeQ6qDIPfzk2NSd5t4IL4Tok3nxdTTdOF+vrcNEDBF/G5Hrk7+IiMMt2Ru9NspYrACqyb/HZCv/Y3SzzNhW+ug+3fQY+eV+b4lHQOJiLGk4hyfgPi5CSzJUQpszvCUBGqmeMCgYBZJvgJaX6I02b373TVYcZ7AunL5LZRpOWuampQ2O5CA8X1Rvm1qtXSPGf5m+QR/q/GvIl7O8iw25boyqE0v/l2OQhBLETSK7Z/mSBoOHiCXcjc/9MdJlKU39V/27vWePn+O28Cr+BPklfRrlBGPG6MCn29Uk1uPnJc8Q/Gv651iwKBgQDOU3YGRBxxVWEGqiRTjEMoh0S/wze/Y8sM/h06WIrhoYZ/K0E/S0Ns8yhEpi8PF1slL/GqeD0ABO3B9BKtN0npmcQmgoIVYxPJxGralJyg04DG28GdeHgRXgU2zdJjl4b0da0YoTPmthVj09nSA9Dy+zJ9PC0Kliho7RJ+VoMAMA==`,
  alipayPublicKey: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArVRqkWA8jEmTcMdRlvSgxoHIYnqwvWXYAYYuM9dj+fOLY3dibm6gnx2I0hLXjZl8jCG3TZpW+mz38jW3OBrsZ62JBdo1RmQJO9Nov9pX1lT+bbI20dlmXuRewv2QsoIbCWO7fjBIoTrXf158eLGma3jg8eL23KH4ah0VpU4s5YvmD4hCaj2xscwO3cXM9qUWu+50Bo28ExFDuHShRZgmuyKS7VlgxLBBmEl6fTbQR5X1oFzrwMz2I/13Q91oE/aU/jAOQVB1SZ3rsPM70Ud5FJ39vAjKNyx9/CEaVbmWZPxluSSUtseXT2rOEtlgZdi3zGN993V2Oq7h0yPB0O13EQIDAQAB`,
  gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
  timeout: 5000,
  camelCase: true,
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { plan, amount } = await req.json();
    
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
    
    // 沙箱环境：手动构建支付URL（不使用SDK的exec，直接构建）
    console.log('开始构建支付宝支付链接...');
    
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const bizContent = JSON.stringify({
      out_trade_no: orderNumber,
      total_amount: amount.toString(),
      subject: `顶点视角会员-${plan === 'monthly' ? '月度' : plan === 'yearly' ? '年度' : '终身'}`,
      product_code: 'FAST_INSTANT_TRADE_PAY'
    });
    
    // 构建请求参数
    const params = {
      app_id: '9021000158673541',
      method: 'alipay.trade.page.pay',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: timestamp,
      version: '1.0',
      notify_url: `${new URL(req.url).origin}/api/functions/alipayCallback`,
      return_url: `${new URL(req.url).origin}`,
      biz_content: bizContent
    };
    
    // 使用SDK的签名功能
    const signStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // 简单方式：使用SDK exec但获取URL参数
    try {
      const formData = new AlipayFormData();
      formData.setMethod('get');
      formData.addField('notifyUrl', params.notify_url);
      formData.addField('returnUrl', params.return_url);
      formData.addField('bizContent', {
        out_trade_no: orderNumber,
        total_amount: amount.toString(),
        subject: `顶点视角会员-${plan === 'monthly' ? '月度' : plan === 'yearly' ? '年度' : '终身'}`,
        product_code: 'FAST_INSTANT_TRADE_PAY'
      });
      
      const urlParams = await alipaySdk.exec('alipay.trade.page.pay', {}, { formData });
      const payUrl = `https://openapi-sandbox.dl.alipaydev.com/gateway.do?${urlParams}`;
      
      console.log('生成的支付链接:', payUrl);
      
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payUrl)}`;
      
      return Response.json({
        success: true,
        order_id: order.id,
        order_number: orderNumber,
        qr_code: payUrl,
        qr_image_url: qrImageUrl,
        pay_url: payUrl,
        amount: amount,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('生成支付链接失败:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating alipay order:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});