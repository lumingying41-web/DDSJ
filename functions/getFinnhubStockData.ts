import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = Deno.env.get("FINNHUB_API_KEY");
        
        if (!apiKey) {
            return Response.json({ 
                error: '请先设置 FINNHUB_API_KEY',
                hint: '免费注册 https://finnhub.io/register 获取API key'
            }, { status: 400 });
        }

        const { symbol } = await req.json();
        
        if (!symbol) {
            return Response.json({ error: 'Symbol is required' }, { status: 400 });
        }

        // Finnhub Stock Quote
        const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
        
        const [quoteRes, profileRes] = await Promise.all([
            fetch(quoteUrl),
            fetch(profileUrl)
        ]);

        if (!quoteRes.ok || !profileRes.ok) {
            throw new Error('Finnhub API error');
        }

        const quote = await quoteRes.json();
        const profile = await profileRes.json();

        return Response.json({
            symbol: symbol,
            name: profile.name || symbol,
            price: quote.c,
            change: quote.d,
            changePercent: quote.dp,
            high: quote.h,
            low: quote.l,
            open: quote.o,
            previousClose: quote.pc,
            timestamp: new Date(quote.t * 1000).toISOString(),
            marketCap: profile.marketCapitalization,
            industry: profile.finnhubIndustry,
            logo: profile.logo,
            weburl: profile.weburl,
            country: profile.country,
            currency: profile.currency,
            exchange: profile.exchange
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            details: '获取Finnhub股票数据失败'
        }, { status: 500 });
    }
});