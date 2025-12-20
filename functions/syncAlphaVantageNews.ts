import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Alpha Vantage 新闻API（免费，无需密钥）
        const response = await fetch(
            'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=demo'
        );
        const data = await response.json();
        
        if (!data.feed) {
            return Response.json({ 
                success: false, 
                error: 'No news data available',
                synced: 0 
            });
        }
        
        // 获取今天的新闻
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newsItems = data.feed
            .filter(item => {
                const publishedDate = new Date(item.time_published.replace(
                    /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
                    '$1-$2-$3T$4:$5:$6'
                ));
                return publishedDate >= today;
            })
            .slice(0, 20)
            .map(item => {
                const sentiment = item.overall_sentiment_score > 0.15 ? 'bullish' 
                    : item.overall_sentiment_score < -0.15 ? 'bearish' 
                    : 'neutral';
                
                const category = item.topics?.includes('earnings') ? 'earnings'
                    : item.topics?.includes('ipo') ? 'ipo'
                    : item.topics?.includes('mergers_and_acquisitions') ? 'merger'
                    : item.topics?.includes('financial_markets') ? 'macro'
                    : 'other';
                
                const publishedAt = item.time_published.replace(
                    /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
                    '$1-$2-$3T$4:$5:$6'
                );
                
                return {
                    title: item.title,
                    summary: item.summary.substring(0, 200),
                    content: item.summary,
                    sentiment,
                    category,
                    importance: item.overall_sentiment_score > 0.3 || item.overall_sentiment_score < -0.3 ? 'high' : 'medium',
                    related_stocks: item.ticker_sentiment?.slice(0, 5).map(t => t.ticker) || [],
                    source: item.source,
                    source_url: item.url,
                    tags: item.topics || [],
                    published_at: publishedAt,
                    is_premium: false
                };
            });
        
        // 检查重复
        const existingNews = await base44.asServiceRole.entities.NewsFlash.list('-created_date', 100);
        
        const isDuplicate = (newItem, existing) => {
            if (newItem.source_url && existing.source_url === newItem.source_url) return true;
            
            const title1 = newItem.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const title2 = existing.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const words1 = title1.split(' ').filter(w => w.length > 3);
            const words2 = title2.split(' ').filter(w => w.length > 3);
            const common = words1.filter(w => words2.includes(w)).length;
            const similarity = common / Math.max(words1.length, words2.length);
            
            return similarity > 0.6;
        };
        
        const uniqueNews = newsItems.filter(news => 
            !existingNews.some(existing => isDuplicate(news, existing))
        );
        
        if (uniqueNews.length > 0) {
            await base44.asServiceRole.entities.NewsFlash.bulkCreate(uniqueNews);
        }
        
        return Response.json({
            success: true,
            synced: uniqueNews.length,
            total_fetched: newsItems.length,
            source: 'Alpha Vantage',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});