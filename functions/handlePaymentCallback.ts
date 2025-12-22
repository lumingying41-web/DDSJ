import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_number, status, transaction_id } = await req.json();
    
    if (!order_number) {
      return Response.json({ error: 'Missing order_number' }, { status: 400 });
    }
    
    // 查找订单
    const orders = await base44.asServiceRole.entities.PaymentOrder.filter({ order_number });
    
    if (orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const order = orders[0];
    
    // 更新订单状态
    await base44.asServiceRole.entities.PaymentOrder.update(order.id, {
      status: status === 'success' ? 'completed' : 'failed',
      transaction_id: transaction_id,
      paid_at: status === 'success' ? new Date().toISOString() : undefined
    });
    
    // 如果支付成功，创建或更新订阅
    if (status === 'success') {
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
        endDate.setFullYear(endDate.getFullYear() + 100); // 100年表示终身
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
          payment_method: order.payment_method
        });
      }
    }
    
    return Response.json({
      success: true,
      order_status: status === 'success' ? 'completed' : 'failed'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});