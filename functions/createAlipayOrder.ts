import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { plan, amount } = await req.json();
    
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
    
    // 这里返回模拟的支付宝支付链接
    // 真实场景需要调用支付宝API
    const paymentUrl = `https://openapi.alipay.com/gateway.do?method=alipay.trade.page.pay&out_trade_no=${order.order_number}&total_amount=${amount}`;
    
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