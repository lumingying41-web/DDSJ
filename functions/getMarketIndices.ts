import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const alphaVantageKey = Deno.env.get("ALPHA_VANTAGE_API_KEY");
        const iexKey = Deno.env.get("IEX_CLOUD_API_KEY");
        const twelveDataKey = Deno.env.get("TWELVE_DATA_API_KEY");
        
        const indices = [
            { symbol: 'SPY', name: '标普500', displayName: 'S&P 500' },
            { symbol: 'QQQ', name: '纳斯达克100', displayName: 'NASDAQ 100' },
            { symbol: 'DIA', name: '道琼斯', displayName: 'Dow Jones' },
            { symbol: 'IWM', name: '罗素2000', displayName: 'Russell 2000' }
        ];
        
        const indicesPromises = indices.map(async ({ symbol, name, displayName }) => {
            // 1. Alpha Vantage
            if (alphaVantageKey) {
                try {
                    const response = await fetch(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`
                    );
                    const data = await response.json();
                    const quote = data['Global Quote'];
                    
                    if (quote && quote['05. price']) {
                        return {
                            symbol,
                            name,
                            displayName,
                            price: parseFloat(quote['05. price']),
                            change: parseFloat(quote['09. change']),
                            changePercent: parseFloat(quote['10. change percent'].replace('%', ''))
                        };
                    }
                } catch (e) {
                    console.error(`Alpha Vantage error for ${symbol}:`, e);
                }
            }
            
            // 2. IEX Cloud
            if (iexKey) {
                try {
                    const response = await fetch(
                        `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${iexKey}`
                    );
                    const data = await response.json();
                    
                    if (data.latestPrice) {
                        return {
                            symbol,
                            name,
                            displayName,
                            price: data.latestPrice,
                            change: data.change || 0,
                            changePercent: data.changePercent * 100 || 0
                        };
                    }
                } catch (e) {
                    console.error(`IEX error for ${symbol}:`, e);
                }
            }
            
            // 3. Twelve Data
            if (twelveDataKey) {
                try {
                    const response = await fetch(
                        `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${twelveDataKey}`
                    );
                    const data = await response.json();
                    
                    if (data.close) {
                        const change = parseFloat(data.close) - parseFloat(data.previous_close);
                        const changePercent = (change / parseFloat(data.previous_close)) * 100;
                        
                        return {
                            symbol,
                            name,
                            displayName,
                            price: parseFloat(data.close),
                            change: change,
                            changePercent: changePercent
                        };
                    }
                } catch (e) {
                    console.error(`Twelve Data error for ${symbol}:`, e);
                }
            }
            
            // 4. Yahoo Finance (备用)
            try {
                const response = await fetch(
                    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
                );
                const data = await response.json();
                const result = data?.chart?.result?.[0];
                
                if (result?.meta?.regularMarketPrice) {
                    const price = result.meta.regularMarketPrice;
                    const prevClose = result.meta.previousClose;
                    const change = price - prevClose;
                    const changePercent = (change / prevClose) * 100;
                    
                    return {
                        symbol,
                        name,
                        displayName,
                        price: price,
                        change: change,
                        changePercent: changePercent
                    };
                }
            } catch (e) {
                console.error(`Yahoo Finance error for ${symbol}:`, e);
            }
            
            return null;
        });
        
        const results = await Promise.all(indicesPromises);
        const validIndices = results.filter(i => i && i.price > 0);
        
        return Response.json({
            indices: validIndices,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});