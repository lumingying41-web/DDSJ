import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const apiKey = Deno.env.get("FINNHUB_API_KEY");
        
        if (!apiKey) {
            return Response.json({ error: 'FINNHUB_API_KEY not configured' }, { status: 500 });
        }
        
        // 获取通用财经新闻
        const response = await fetch(
            `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`
        );
        const newsData = await response.json();
        
        // 转换为应用所需格式
        const formattedNews = newsData.slice(0, 20).map(item => ({
            title: item.headline,
            summary: item.summary || item.headline,
            content: item.summary || item.headline,
            source: item.source,
            source_url: item.url,
            published_at: new Date(item.datetime * 1000).toISOString(),
            category: 'macro',
            sentiment: 'neutral',
            importance: 'medium',
            related_stocks: item.related ? item.related.split(',').slice(0, 3) : [],
            tags: [item.category || 'general'],
            is_premium: false
        }));
        
        return Response.json({
            news: formattedNews,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});