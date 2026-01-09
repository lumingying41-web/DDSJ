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
                // 使用LLM提取关键信息
                const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: `分析这条财经新闻，提取关键信息：
标题：${article.title}
内容：${article.description || article.content || ''}

请返回JSON格式：
{
  "summary": "一句话概括（中文，30字内）",
  "sentiment": "bullish/bearish/neutral",
  "category": "comprehensive/earnings/fed/analyst/macro/ipo/risk_warning/merger/policy/other",
  "importance": "high/medium/low",
  "related_stocks": ["股票代码数组，如果有的话"]
}`,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            summary: { type: "string" },
                            sentiment: { type: "string" },
                            category: { type: "string" },
                            importance: { type: "string" },
                            related_stocks: { type: "array", items: { type: "string" } }
                        }
                    }
                });

                const newsFlash = await base44.asServiceRole.entities.NewsFlash.create({
                    title: article.title,
                    summary: analysis.summary,
                    content: article.description || article.content || article.title,
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