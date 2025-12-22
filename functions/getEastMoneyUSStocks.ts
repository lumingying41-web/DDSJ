import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 获取美股资讯
    const newsUrl = 'https://np-anotice-stock.eastmoney.com/api/content/ann?client_source=web&page_index=1&page_size=30&sr=-1&stock_list=105.AAPL,105.TSLA,105.MSFT,105.GOOGL,105.AMZN,105.META,105.NVDA,105.NFLX,105.AMD,105.INTC&f_node=0&s_node=0';
    
    const newsResponse = await fetch(newsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://data.eastmoney.com/'
      }
    });
    
    const text = await newsResponse.text();
    if (!text || text.trim() === '') {
      return Response.json({ synced: 0, source: 'eastmoney', error: 'Empty response' });
    }
    
    let newsData;
    try {
      newsData = JSON.parse(text);
    } catch (e) {
      console.error('Parse error:', e.message);
      return Response.json({ synced: 0, source: 'eastmoney', error: 'Parse error' });
    }
    
    if (!newsData.data || !newsData.data.list) {
      return Response.json({ synced: 0, source: 'eastmoney' });
    }
    
    // 获取今天的新闻
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newsItems = newsData.data.list
      .filter(item => new Date(item.notice_date) >= today)
      .map(item => ({
        title: `【${item.stock_code}】${item.title}`,
        summary: item.summary || item.title,
        content: item.content || item.summary || item.title,
        category: 'other',
        sentiment: 'neutral',
        importance: 'medium',
        related_stocks: [item.stock_code],
        source: '东方财富',
        source_url: `https://data.eastmoney.com/notices/detail/${item.stock_code}/${item.art_code}.html`,
        is_premium: false,
        published_at: item.notice_date
      }));
    
    // 检查重复
    const existingNews = await base44.asServiceRole.entities.NewsFlash.list('-created_date', 100);
    const uniqueNews = newsItems.filter(item => 
      !existingNews.some(existing => 
        existing.source_url === item.source_url || existing.title === item.title
      )
    );
    
    // 批量创建
    if (uniqueNews.length > 0) {
      await base44.asServiceRole.entities.NewsFlash.bulkCreate(uniqueNews);
    }
    
    return Response.json({
      synced: uniqueNews.length,
      total: newsItems.length,
      source: 'eastmoney',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      synced: 0
    }, { status: 500 });
  }
});