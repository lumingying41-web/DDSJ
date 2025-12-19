import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// 计算文本相似度（简单版本）
function textSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const common = words1.filter(w => words2.includes(w)).length;
    return common / Math.max(words1.length, words2.length);
}

// 去重：检查新闻是否与已有新闻相似
function isDuplicate(newsItem, existingNews) {
    return existingNews.some(existing => {
        // URL 相同
        if (existing.source_url === newsItem.source_url) return true;
        // 标题高度相似（>70%）
        if (textSimilarity(existing.title, newsItem.title) > 0.7) return true;
        return false;
    });
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const finnhubKey = Deno.env.get("FINNHUB_API_KEY");
        const newsApiKey = Deno.env.get("NEWSAPI_KEY");
        const marketauxKey = Deno.env.get("MARKETAUX_API_KEY");
        
        const allNews = [];
        
        // 1. Finnhub 新闻
        if (finnhubKey) {
            try {
                const response = await fetch(
                    `https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`
                );
                const data = await response.json();
                
                allNews.push(...data.slice(0, 20).map(item => ({
                    title: item.headline,
                    summary: item.summary || item.headline.substring(0, 150) + '...',
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
                })));
            } catch (e) {
                console.error('Finnhub news error:', e);
            }
        }
        
        // 2. NewsAPI 财经新闻
        if (newsApiKey) {
            try {
                const response = await fetch(
                    `https://newsapi.org/v2/top-headlines?category=business&language=en&apiKey=${newsApiKey}`
                );
                const data = await response.json();
                
                if (data.articles) {
                    allNews.push(...data.articles.slice(0, 20).map(item => ({
                        title: item.title,
                        summary: item.description || item.title.substring(0, 150) + '...',
                        content: item.content || item.description || item.title,
                        source: item.source.name,
                        source_url: item.url,
                        published_at: item.publishedAt,
                        category: 'macro',
                        sentiment: 'neutral',
                        importance: 'medium',
                        related_stocks: [],
                        tags: ['business'],
                        is_premium: false,
                        key_points: []
                    })));
                }
            } catch (e) {
                console.error('NewsAPI error:', e);
            }
        }
        
        // 3. Marketaux 财经新闻
        if (marketauxKey) {
            try {
                const response = await fetch(
                    `https://api.marketaux.com/v1/news/all?filter_entities=true&language=en&api_token=${marketauxKey}`
                );
                const data = await response.json();
                
                if (data.data) {
                    allNews.push(...data.data.slice(0, 20).map(item => ({
                        title: item.title,
                        summary: item.description || item.title.substring(0, 150) + '...',
                        content: item.description || item.title,
                        source: item.source,
                        source_url: item.url,
                        published_at: item.published_at,
                        category: 'macro',
                        sentiment: item.sentiment || 'neutral',
                        importance: 'medium',
                        related_stocks: item.entities?.map(e => e.symbol).slice(0, 3) || [],
                        tags: item.entities?.map(e => e.name).slice(0, 3) || [],
                        is_premium: false,
                        key_points: []
                    })));
                }
            } catch (e) {
                console.error('Marketaux error:', e);
            }
        }
        
        // 获取现有新闻以去重
        const existingNews = await base44.asServiceRole.entities.NewsFlash.list('-created_date', 100);
        
        // 去重并过滤
        const uniqueNews = [];
        for (const newsItem of allNews) {
            if (!isDuplicate(newsItem, [...existingNews, ...uniqueNews])) {
                uniqueNews.push(newsItem);
            }
        }
        
        // 按发布时间排序，取最新的15条
        const sortedNews = uniqueNews
            .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
            .slice(0, 15);
        
        // 批量创建新闻
        if (sortedNews.length > 0) {
            await base44.asServiceRole.entities.NewsFlash.bulkCreate(sortedNews);
        }
        
        return Response.json({
            success: true,
            synced: sortedNews.length,
            sources: {
                finnhub: !!finnhubKey,
                newsapi: !!newsApiKey,
                marketaux: !!marketauxKey
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});