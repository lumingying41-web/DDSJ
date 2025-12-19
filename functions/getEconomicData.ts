import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // FRED API 不需要密钥，完全免费
        const indicators = [
            { id: 'DGS10', name: '10年期美债收益率', unit: '%' },
            { id: 'DGS2', name: '2年期美债收益率', unit: '%' },
            { id: 'DEXCHUS', name: '美元/人民币汇率', unit: 'CNY' },
            { id: 'VIXCLS', name: 'VIX恐慌指数', unit: '' },
            { id: 'DCOILWTICO', name: 'WTI原油价格', unit: 'USD' },
            { id: 'GOLDAMGBD228NLBM', name: '黄金价格', unit: 'USD' }
        ];
        
        const dataPromises = indicators.map(async ({ id, name, unit }) => {
            try {
                const response = await fetch(
                    `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=d5c632cfcba01cbcfb72be3db4f2d8bf&file_type=json&sort_order=desc&limit=1`
                );
                const data = await response.json();
                
                if (data.observations && data.observations.length > 0) {
                    const latest = data.observations[0];
                    const value = parseFloat(latest.value);
                    
                    if (!isNaN(value)) {
                        return {
                            id,
                            name,
                            value: value,
                            unit,
                            date: latest.date
                        };
                    }
                }
            } catch (e) {
                console.error(`FRED error for ${id}:`, e);
            }
            
            return null;
        });
        
        const results = await Promise.all(dataPromises);
        const validData = results.filter(d => d !== null);
        
        return Response.json({
            indicators: validData,
            timestamp: new Date().toISOString(),
            source: 'FRED (Federal Reserve Economic Data)'
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});