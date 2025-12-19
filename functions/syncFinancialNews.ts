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
        
        // 获取现有新闻ID以避免重复
        const existingNews = await base44.asServiceRole.entities.NewsFlash.list('-created_date', 50);
        const existingUrls = new Set(existingNews.map(n => n.source_url));
        
        // 转换并过滤新闻
        const newNewsItems = newsData
            .filter(item => !existingUrls.has(item.url))
            .slice(0, 10)
            .map(item => ({
                title: item.headline,
                summary: item.summary || item.headline.substring(0, 100) + '...',
                content: item.summary || item.headline,
                source: item.source,
                source_url: item.url,
                published_at: new Date(item.datetime * 1000).toISOString(),
                category: 'macro',
                sentiment: 'neutral',
                importance: 'medium',
                related_stocks: item.related ? item.related.split(',').slice(0, 3) : [],
                tags: [item.category || 'general'],
                is_premium: false,
                key_points: []
            }));
        
        // 批量创建新闻
        if (newNewsItems.length > 0) {
            await base44.asServiceRole.entities.NewsFlash.bulkCreate(newNewsItems);
        }
        
        return Response.json({
            success: true,
            synced: newNewsItems.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});