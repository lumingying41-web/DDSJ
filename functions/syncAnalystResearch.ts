import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const finnhubKey = Deno.env.get("FINNHUB_API_KEY");
        const newsApiKey = Deno.env.get("NEWSAPI_KEY");

        const processedResearch = [];

        // 1. 从 Finnhub 获取公司分析报告
        if (finnhubKey) {
            try {
                const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'];
                
                for (const symbol of symbols) {
                    const resUrl = `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${finnhubKey}`;
                    const resResponse = await fetch(resUrl);
                    const recommendations = await resResponse.json();

                    if (recommendations && recommendations.length > 0) {
                        const latest = recommendations[0];
                        
                        // 用 LLM 生成研报内容
                        const researchContent = await base44.integrations.Core.InvokeLLM({
                            prompt: `作为专业金融分析师，基于以下数据生成一份深度研报：
股票代码：${symbol}
买入评级数：${latest.buy || 0}
持有评级数：${latest.hold || 0}
卖出评级数：${latest.sell || 0}
强力买入：${latest.strongBuy || 0}
强力卖出：${latest.strongSell || 0}
日期：${latest.period}

请生成：
1. 标题（专业且吸引人）
2. 摘要（100字以内）
3. 完整研报内容（使用Markdown格式，至少800字，包含：市场分析、评级解读、投资建议、风险提示）
4. 评级建议（strong_buy/buy/hold/sell/strong_sell）
5. 目标价（合理估算）`,
                            response_json_schema: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    summary: { type: "string" },
                                    content: { type: "string" },
                                    rating: { type: "string" },
                                    target_price: { type: "number" }
                                }
                            }
                        });

                        await base44.entities.Research.create({
                            title: researchContent.title,
                            summary: researchContent.summary,
                            content: researchContent.content,
                            stock_symbol: symbol,
                            stock_name: symbol,
                            category: 'valuation',
                            rating: researchContent.rating,
                            target_price: researchContent.target_price,
                            author: '顶点视角分析团队',
                            is_premium: true,
                            read_time: Math.ceil(researchContent.content.length / 500),
                            tags: ['分析师评级', symbol],
                            published_at: new Date().toISOString()
                        });

                        processedResearch.push(researchContent.title);
                    }
                }
            } catch (e) {
                console.error('Finnhub research sync error:', e);
            }
        }

        // 2. 从 NewsAPI 获取深度分析文章
        if (newsApiKey) {
            try {
                const query = 'stock analysis OR earnings report OR financial analysis';
                const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${newsApiKey}`;
                
                const response = await fetch(url);
                const data = await response.json();

                if (data.articles) {
                    for (const article of data.articles.slice(0, 5)) {
                        if (!article.content || article.content.length < 500) continue;

                        const analyzed = await base44.integrations.Core.InvokeLLM({
                            prompt: `分析以下英文财经文章，如果是深度分析或研报类型，生成中文研报：
标题：${article.title}
内容：${article.description || ''} ${article.content || ''}

如果这是一篇深度分析文章，请提供：
1. 中文标题
2. 摘要
3. 完整内容（Markdown格式，翻译并扩展原文）
4. 相关股票代码（如有）
5. 类型（earnings/valuation/industry/technical/deep_dive）
6. 评级建议
7. 是否适合作为研报（true/false）`,
                            response_json_schema: {
                                type: "object",
                                properties: {
                                    is_research: { type: "boolean" },
                                    title: { type: "string" },
                                    summary: { type: "string" },
                                    content: { type: "string" },
                                    stock_symbol: { type: "string" },
                                    category: { type: "string" },
                                    rating: { type: "string" },
                                    target_price: { type: "number" }
                                }
                            }
                        });

                        if (analyzed.is_research && analyzed.content && analyzed.content.length > 500) {
                            await base44.entities.Research.create({
                                title: analyzed.title,
                                summary: analyzed.summary,
                                content: analyzed.content,
                                stock_symbol: analyzed.stock_symbol || 'MARKET',
                                stock_name: analyzed.stock_symbol || '市场综合',
                                category: analyzed.category || 'deep_dive',
                                rating: analyzed.rating || 'hold',
                                target_price: analyzed.target_price,
                                author: '外媒编译',
                                is_premium: true,
                                read_time: Math.ceil(analyzed.content.length / 500),
                                tags: ['深度分析'],
                                published_at: new Date(article.publishedAt).toISOString()
                            });

                            processedResearch.push(analyzed.title);
                        }
                    }
                }
            } catch (e) {
                console.error('NewsAPI research sync error:', e);
            }
        }

        return Response.json({ 
            success: true,
            count: processedResearch.length,
            research: processedResearch
        });

    } catch (error) {
        console.error('Sync analyst research error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});