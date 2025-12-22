import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// 美股主要股票代码列表
const US_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD',
  'NFLX', 'DIS', 'PYPL', 'INTC', 'CSCO', 'ADBE', 'CMCSA', 'PEP',
  'AVGO', 'COST', 'TXN', 'QCOM', 'AMGN', 'SBUX', 'INTU', 'BKNG',
  'GILD', 'MDLZ', 'ISRG', 'REGN', 'VRTX', 'ADP', 'MU', 'ADI',
  'SPGI', 'NOW', 'LOW', 'CAT', 'DE', 'WMT', 'JNJ', 'UNH', 'V', 'MA'
];

// 检测新闻是否与美股相关
function isUSStockRelated(title, summary, content) {
  const text = `${title} ${summary} ${content}`.toUpperCase();
  
  // 检查是否包含美股代码
  for (const stock of US_STOCKS) {
    if (text.includes(stock)) return true;
  }
  
  // 检查美股关键词
  const keywords = [
    'NASDAQ', 'NYSE', 'DOW JONES', 'S&P 500', 'WALL STREET',
    'US STOCK', 'AMERICAN', 'SILICON VALLEY', 'TECH STOCK',
    'EARNINGS', 'IPO', 'MERGER', 'ACQUISITION', 'SEC', 'FDA'
  ];
  
  for (const keyword of keywords) {
    if (text.includes(keyword)) return true;
  }
  
  return false;
}

// 文本相似度计算
function textSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const common = words1.filter(w => words2.includes(w)).length;
  return common / Math.max(words1.length, words2.length);
}

// 去重检查 - 放宽条件
function isDuplicate(newsItem, existingNews) {
  return existingNews.some(existing => {
    // 只检查URL是否完全相同
    if (existing.source_url && newsItem.source_url && existing.source_url === newsItem.source_url) return true;
    // 标题完全相同才算重复
    if (existing.title === newsItem.title) return true;
    return false;
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const alphaVantageKey = "75THXAWE1ZDRPVDY";
    
    const allNews = [];
    const sources = [];

    // Alpha Vantage - 美股新闻
    if (alphaVantageKey) {
      try {
        const topics = ['technology', 'finance', 'earnings'];
        for (const topic of topics) {
          const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${topic}&apikey=${alphaVantageKey}`;
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.feed) {
            data.feed.slice(0, 10).forEach(item => {
              const relatedStocks = item.ticker_sentiment?.map(t => t.ticker).filter(t => US_STOCKS.includes(t)) || [];
              
              if (relatedStocks.length > 0) {
                allNews.push({
                  title: item.title,
                  summary: item.summary || item.title.substring(0, 200),
                  content: item.summary || item.title,
                  source: item.source || 'Alpha Vantage',
                  source_url: item.url,
                  published_at: item.time_published,
                  category: 'other',
                  sentiment: item.overall_sentiment_label?.toLowerCase() || 'neutral',
                  importance: 'medium',
                  related_stocks: relatedStocks,
                  is_premium: false
                });
              }
            });
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        sources.push('Alpha Vantage');
        } catch (e) {
        console.error('Alpha Vantage error:', e);
        }
        }

        // Yahoo Finance RSS (免费)
        try {
        const symbols = US_STOCKS.slice(0, 10);
        for (const symbol of symbols) {
        try {
          const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=US&lang=en-US`;
          const res = await fetch(url);
          const text = await res.text();

          // 简单解析RSS
          const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
          items.slice(0, 3).forEach(item => {
            const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || '';
            const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

            if (title && link) {
              allNews.push({
                title: `【${symbol}】${title}`,
                summary: title,
                content: title,
                source: 'Yahoo Finance',
                source_url: link,
                published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                category: 'other',
                sentiment: 'neutral',
                importance: 'medium',
                related_stocks: [symbol],
                is_premium: false
              });
            }
          });
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.log(`Yahoo ${symbol}:`, e.message);
        }
        }
        sources.push('Yahoo Finance');
        } catch (e) {
        console.error('Yahoo Finance error:', e);
        }
    
    // 获取今天已有新闻进行去重
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingNews = await base44.asServiceRole.entities.NewsFlash.list('-created_date', 100);
    
    // 去重
    const uniqueNews = allNews.filter(item => !isDuplicate(item, existingNews));
    
    // 按时间排序，只取最新的50条
    const sortedNews = uniqueNews
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .slice(0, 50);
    
    // 批量创建
    if (sortedNews.length > 0) {
      await base44.asServiceRole.entities.NewsFlash.bulkCreate(sortedNews);
    }
    
    return Response.json({
      success: true,
      synced: sortedNews.length,
      total: allNews.length,
      sources: sources,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});