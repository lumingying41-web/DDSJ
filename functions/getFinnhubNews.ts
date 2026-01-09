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
                const newsFlash = await base44.asServiceRole.entities.NewsFlash.create({
                    title: article.headline,
                    summary: article.summary || article.headline,
                    content: article.summary || article.headline,
                    category: 'comprehensive',
                    sentiment: 'neutral',
                    importance: 'medium',
                    source: article.source,
                    source_url: article.url,
                    related_stocks: article.related ? [article.related] : [],
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