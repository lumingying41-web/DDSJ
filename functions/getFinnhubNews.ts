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

        const { category = 'general' } = await req.json();

        // Finnhub News API
        const url = `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`;
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        const articles = await response.json();

        // 转换为应用格式并保存到数据库
        const newsItems = [];
        for (const article of articles.slice(0, 20)) {
            try {
                // 使用LLM翻译成中文并分析
                const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: `将以下英文财经新闻翻译成中文并分析：
        标题：${article.headline}
        内容：${article.summary || article.headline}

        请返回JSON格式（所有文本必须是中文）：
        {
        "title": "中文标题",
        "summary": "中文摘要（一句话，30字内）",
        "content": "完整中文内容",
        "sentiment": "bullish/bearish/neutral",
        "category": "comprehensive/earnings/fed/analyst/macro/ipo/risk_warning/merger/policy/other",
        "importance": "high/medium/low",
        "related_stocks": ["相关股票代码"]
        }`,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            summary: { type: "string" },
                            content: { type: "string" },
                            sentiment: { type: "string" },
                            category: { type: "string" },
                            importance: { type: "string" },
                            related_stocks: { type: "array", items: { type: "string" } }
                        }
                    }
                });

                const newsFlash = await base44.asServiceRole.entities.NewsFlash.create({
                    title: analysis.title,
                    summary: analysis.summary,
                    content: analysis.content,
                    category: analysis.category,
                    sentiment: analysis.sentiment,
                    importance: analysis.importance,
                    source: article.source,
                    source_url: article.url,
                    related_stocks: analysis.related_stocks || [],
                    published_at: new Date(article.datetime * 1000).toISOString(),
                    is_premium: false
                });
                newsItems.push(newsFlash);
            } catch (e) {
                console.error('Failed to save news:', e);
            }
        }

        return Response.json({
            success: true,
            count: newsItems.length,
            articles: newsItems
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            details: '获取Finnhub新闻失败'
        }, { status: 500 });
    }
});