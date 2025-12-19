import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const apiKey = Deno.env.get("FINNHUB_API_KEY");
        
        if (!apiKey) {
            return Response.json({ error: 'FINNHUB_API_KEY not configured' }, { status: 500 });
        }
        
        const stockSymbols = [
            { symbol: 'AAPL', name: '苹果' },
            { symbol: 'TSLA', name: '特斯拉' },
            { symbol: 'MSFT', name: '微软' },
            { symbol: 'GOOGL', name: '谷歌' },
            { symbol: 'AMZN', name: '亚马逊' },
            { symbol: 'META', name: 'Meta' },
            { symbol: 'NVDA', name: '英伟达' },
            { symbol: 'AMD', name: '超威半导体' }
        ];
        
        const stockPromises = stockSymbols.map(async ({ symbol, name }) => {
            const response = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
            );
            const data = await response.json();
            
            return {
                symbol,
                name,
                price: data.c || 0,
                change: data.d || 0,
                changePercent: data.dp || 0
            };
        });
        
        const stocks = await Promise.all(stockPromises);
        
        return Response.json({
            stocks,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});