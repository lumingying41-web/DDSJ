import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
    
    // 生成支付宝支付链接 (真实环境需要正确的签名)
    // 这里先使用模拟的二维码，等你提供完整的支付宝配置后再更新
    const mockPaymentUrl = `alipays://platformapi/startapp?appId=20000067&url=https://mclient.alipay.com/h5/pay.htm?trade_no=${orderNumber}`;
    
    // 生成二维码图片URL
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockPaymentUrl)}`;
    
    return Response.json({
      success: true,
      order_id: order.id,
      order_number: orderNumber,
      qr_code: mockPaymentUrl,
      qr_image_url: qrImageUrl,
      amount: amount,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error creating alipay order:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});