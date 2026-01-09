import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { symbol } = await req.json();
        
        if (!symbol) {
            return Response.json({ error: 'Symbol is required' }, { status: 400 });
        }

        // Yahoo Finance API (免费，无需API key)
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`;
        
        const response = await fetch(yahooUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.chart.result[0];
        
        const quote = result.meta;
        const currentPrice = quote.regularMarketPrice;
        const previousClose = quote.chartPreviousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        return Response.json({
            symbol: symbol,
            name: quote.longName || quote.shortName || symbol,
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            volume: quote.regularMarketVolume,
            marketCap: quote.marketCap,
            high: quote.regularMarketDayHigh,
            low: quote.regularMarketDayLow,
            open: quote.regularMarketOpen,
            previousClose: previousClose,
            currency: quote.currency,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            details: '获取雅虎财经数据失败'
        }, { status: 500 });
    }
});