import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { purchaseToken, productId, plan } = await req.json();

        // TODO: Verify with Google Play API
        // const googleResponse = await fetch(
        //     `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`,
        //     { headers: { 'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}` } }
        // );

        // For now, mock verification
        const verified = true;

        if (verified) {
            const startDate = new Date().toISOString().split('T')[0];
            let endDate;
            
            if (plan === 'monthly') {
                const date = new Date();
                date.setMonth(date.getMonth() + 1);
                endDate = date.toISOString().split('T')[0];
            } else if (plan === 'yearly') {
                const date = new Date();
                date.setFullYear(date.getFullYear() + 1);
                endDate = date.toISOString().split('T')[0];
            } else if (plan === 'lifetime') {
                const date = new Date();
                date.setFullYear(date.getFullYear() + 100);
                endDate = date.toISOString().split('T')[0];
            }

            const subs = await base44.asServiceRole.entities.Subscription.filter({ 
                user_email: user.email 
            });

            if (subs.length > 0) {
                await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
                    plan,
                    status: 'active',
                    start_date: startDate,
                    end_date: endDate,
                    payment_method: 'google_play'
                });
            } else {
                await base44.asServiceRole.entities.Subscription.create({
                    user_email: user.email,
                    plan,
                    status: 'active',
                    start_date: startDate,
                    end_date: endDate,
                    payment_method: 'google_play'
                });
            }

            return Response.json({ success: true, message: 'Subscription activated' });
        }

        return Response.json({ error: 'Purchase verification failed' }, { status: 400 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});