import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = Deno.env.get("NEWSAPI_KEY");
        
        if (!apiKey) {
            return Response.json({ 
                error: '请先设置 NEWSAPI_KEY',
                hint: '免费注册 https://newsapi.org/register 获取API key'
            }, { status: 400 });
        }

        const { query = 'stock market OR finance OR Wall Street', language = 'en' } = await req.json();

        // NewsAPI - 全球财经新闻
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=${language}&sortBy=publishedAt&pageSize=50&apiKey=${apiKey}`;
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NewsAPI error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.articles) {
            return Response.json({ error: 'No articles found' }, { status: 404 });
        }

        // 转换为应用格式并保存到数据库
        const newsItems = [];
        for (const article of data.articles.slice(0, 30)) {
            try {
                // 使用LLM翻译成中文并分析
                const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: `将以下英文财经新闻翻译成中文并分析：
                标题：${article.title}
                内容：${article.description || article.content || ''}

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
                    source: article.source.name,
                    source_url: article.url,
                    related_stocks: analysis.related_stocks || [],
                    published_at: article.publishedAt,
                    is_premium: false
                });
                newsItems.push(newsFlash);
            } catch (e) {
                console.error('Failed to process article:', e);
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
            details: '获取NewsAPI文章失败'
        }, { status: 500 });
    }
});