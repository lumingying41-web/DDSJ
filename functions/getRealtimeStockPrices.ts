import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const finnhubKey = Deno.env.get("FINNHUB_API_KEY");
        const polygonKey = Deno.env.get("POLYGON_API_KEY");
        
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
            // 优先使用 Finnhub
            if (finnhubKey) {
                try {
                    const response = await fetch(
                        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`
                    );
                    const data = await response.json();
                    
                    if (data.c) {
                        return {
                            symbol,
                            name,
                            price: data.c,
                            change: data.d || 0,
                            changePercent: data.dp || 0
                        };
                    }
                } catch (e) {
                    console.error(`Finnhub error for ${symbol}:`, e);
                }
            }
            
            // 备用：使用 Polygon.io
            if (polygonKey) {
                try {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const dateStr = yesterday.toISOString().split('T')[0];
                    
                    const response = await fetch(
                        `https://api.polygon.io/v1/open-close/${symbol}/${dateStr}?adjusted=true&apiKey=${polygonKey}`
                    );
                    const data = await response.json();
                    
                    if (data.close) {
                        const change = data.close - data.open;
                        const changePercent = (change / data.open) * 100;
                        
                        return {
                            symbol,
                            name,
                            price: data.close,
                            change: change,
                            changePercent: changePercent
                        };
                    }
                } catch (e) {
                    console.error(`Polygon error for ${symbol}:`, e);
                }
            }
            
            // 默认返回0
            return { symbol, name, price: 0, change: 0, changePercent: 0 };
        });
        
        const stocks = await Promise.all(stockPromises);
        
        return Response.json({
            stocks: stocks.filter(s => s.price > 0),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});