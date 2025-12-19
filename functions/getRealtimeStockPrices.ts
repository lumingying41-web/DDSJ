import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX'];
        
        // 使用 InvokeLLM 获取实时股价
        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `获取以下美股的实时价格、涨跌额和涨跌幅：${symbols.join(', ')}。
            
要求：
1. 返回今日最新的实时价格
2. 包含中文名称
3. 计算准确的涨跌额和涨跌幅

请返回JSON格式数据。`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    stocks: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                symbol: { type: "string" },
                                name: { type: "string" },
                                price: { type: "number" },
                                change: { type: "number" },
                                changePercent: { type: "number" }
                            }
                        }
                    }
                }
            }
        });
        
        return Response.json({ 
            stocks: response.stocks,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});