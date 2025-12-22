import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { order_id } = await req.json();
    
    if (!order_id) {
      return Response.json({ error: 'Missing order_id' }, { status: 400 });
    }
    
    // 查询订单状态
    const orders = await base44.asServiceRole.entities.PaymentOrder.filter({ id: order_id });
    
    if (orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const order = orders[0];
    
    // 验证订单归属
    if (order.user_email !== user.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return Response.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        payment_method: order.payment_method,
        created_at: order.created_date,
        paid_at: order.paid_at
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});