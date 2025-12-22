import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// 美股股票代码列表
const US_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD',
  'NFLX', 'DIS', 'PYPL', 'INTC', 'CSCO', 'ADBE', 'CMCSA', 'PEP',
  'AVGO', 'COST', 'TXN', 'QCOM', 'AMGN', 'SBUX', 'INTU', 'BKNG',
  'GILD', 'MDLZ', 'ISRG', 'REGN', 'VRTX', 'ADP', 'MU', 'ADI'
];

// 计算文本相似度
function textSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const common = words1.filter(w => words2.includes(w)).length;
  return common / Math.max(words1.length, words2.length);
}

// 检查是否为美股相关新闻
function isUSStockRelated(title, summary, stocks) {
  const text = (title + ' ' + summary).toUpperCase();
  // 检查是否包含美股代码
  const hasUSStock = US_STOCKS.some(stock => text.includes(stock));
  // 检查是否包含美股关键词
  const keywords = ['US STOCK', 'NASDAQ', 'NYSE', 'S&P', 'DOW JONES', 'WALL STREET'];
  const hasKeyword = keywords.some(kw => text.includes(kw));
  // 有相关股票代码
  const hasRelatedStock = stocks && stocks.some(s => US_STOCKS.includes(s));
  
  return hasUSStock || hasKeyword || hasRelatedStock;
}

// 去重
function isDuplicate(newsItem, existingNews) {
  return existingNews.some(existing => {
    if (existing.source_url === newsItem.source_url) return true;
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
    const polygonKey = Deno.env.get("POLYGON_API_KEY");
    const benzingaKey = Deno.env.get("BENZINGA_API_KEY");
    
    const allNews = [];
    const sources = [];
    
    // 1. Finnhub - 美股公司新闻
    if (finnhubKey) {
      try {
        for (const symbol of US_STOCKS.slice(0, 10)) {
          const response = await fetch(
            `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${new Date(Date.now() - 2*86400000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${finnhubKey}`
          );
          const data = await response.json();
          
          if (Array.isArray(data)) {
            allNews.push(...data.slice(0, 2).map(item => ({
              title: item.headline,
              summary: item.summary || item.headline.substring(0, 150),
              content: item.summary || item.headline,
              source: item.source,
              source_url: item.url,
              published_at: new Date(item.datetime * 1000).toISOString(),
              category: 'other',
              sentiment: 'neutral',
              importance: 'medium',
              related_stocks: [symbol],
              is_premium: false,
              key_points: []
            })));
          }
          await new Promise(r => setTimeout(r, 100));
        }
        sources.push('Finnhub');
      } catch (e) {
        console.error('Finnhub error:', e);
      }
    }
    
    // 2. NewsAPI - 美股关键词搜索
    if (newsApiKey) {
      try {
        const query = US_STOCKS.slice(0, 15).join(' OR ');
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=(${query})&language=en&sortBy=publishedAt&apiKey=${newsApiKey}`
        );
        const data = await response.json();
        
        if (data.articles) {
          allNews.push(...data.articles.slice(0, 20).map(item => {
            const relatedStocks = US_STOCKS.filter(stock => 
              item.title?.toUpperCase().includes(stock) || 
              item.description?.toUpperCase().includes(stock)
            );
            return {
              title: item.title,
              summary: item.description || item.title.substring(0, 150),
              content: item.content || item.description || item.title,
              source: item.source.name,
              source_url: item.url,
              published_at: item.publishedAt,
              category: 'other',
              sentiment: 'neutral',
              importance: 'medium',
              related_stocks: relatedStocks,
              is_premium: false,
              key_points: []
            };
          }).filter(n => n.related_stocks.length > 0));
        }
        sources.push('NewsAPI');
      } catch (e) {
        console.error('NewsAPI error:', e);
      }
    }
    
    // 3. Marketaux - 美股新闻
    if (marketauxKey) {
      try {
        const symbols = US_STOCKS.slice(0, 20).join(',');
        const response = await fetch(
          `https://api.marketaux.com/v1/news/all?symbols=${symbols}&filter_entities=true&language=en&api_token=${marketauxKey}`
        );
        const data = await response.json();
        
        if (data.data) {
          allNews.push(...data.data.slice(0, 20).map(item => ({
            title: item.title,
            summary: item.description || item.title.substring(0, 150),
            content: item.description || item.title,
            source: item.source,
            source_url: item.url,
            published_at: item.published_at,
            category: 'other',
            sentiment: item.sentiment || 'neutral',
            importance: 'medium',
            related_stocks: item.entities?.map(e => e.symbol).filter(s => US_STOCKS.includes(s)) || [],
            is_premium: false,
            key_points: []
          })));
        }
        sources.push('Marketaux');
      } catch (e) {
        console.error('Marketaux error:', e);
      }
    }
    
    // 4. Polygon.io - 美股新闻
    if (polygonKey) {
      try {
        const response = await fetch(
          `https://api.polygon.io/v2/reference/news?limit=30&apiKey=${polygonKey}`
        );
        const data = await response.json();
        
        if (data.results) {
          allNews.push(...data.results.map(item => {
            const relatedStocks = item.tickers?.filter(t => US_STOCKS.includes(t)) || [];
            return {
              title: item.title,
              summary: item.description || item.title.substring(0, 150),
              content: item.description || item.title,
              source: item.publisher?.name || 'Polygon',
              source_url: item.article_url,
              published_at: item.published_utc,
              category: 'other',
              sentiment: 'neutral',
              importance: 'medium',
              related_stocks: relatedStocks,
              is_premium: false,
              key_points: []
            };
          }).filter(n => n.related_stocks.length > 0));
        }
        sources.push('Polygon.io');
      } catch (e) {
        console.error('Polygon error:', e);
      }
    }
    
    // 5. Benzinga - 美股新闻
    if (benzingaKey) {
      try {
        const response = await fetch(
          `https://api.benzinga.com/api/v2/news?token=${benzingaKey}&pageSize=30&displayOutput=full`
        );
        const data = await response.json();
        
        if (Array.isArray(data)) {
          allNews.push(...data.map(item => {
            const relatedStocks = item.stocks?.map(s => s.name).filter(s => US_STOCKS.includes(s)) || [];
            return {
              title: item.title,
              summary: item.teaser || item.title.substring(0, 150),
              content: item.body || item.teaser || item.title,
              source: 'Benzinga',
              source_url: item.url,
              published_at: item.created,
              category: 'other',
              sentiment: 'neutral',
              importance: 'medium',
              related_stocks: relatedStocks,
              is_premium: false,
              key_points: []
            };
          }).filter(n => n.related_stocks.length > 0));
        }
        sources.push('Benzinga');
      } catch (e) {
        console.error('Benzinga error:', e);
      }
    }
    
    // 过滤：只保留美股相关新闻
    const usStockNews = allNews.filter(news => 
      isUSStockRelated(news.title, news.summary, news.related_stocks)
    );
    
    // 获取现有新闻去重
    const existingNews = await base44.asServiceRole.entities.NewsFlash.list('-created_date', 100);
    
    const uniqueNews = [];
    for (const newsItem of usStockNews) {
      if (!isDuplicate(newsItem, [...existingNews, ...uniqueNews])) {
        uniqueNews.push(newsItem);
      }
    }
    
    // 按发布时间排序，取最新的30条
    const sortedNews = uniqueNews
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .slice(0, 30);
    
    // 批量创建
    if (sortedNews.length > 0) {
      await base44.asServiceRole.entities.NewsFlash.bulkCreate(sortedNews);
    }
    
    return Response.json({
      success: true,
      synced: sortedNews.length,
      sources: sources,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});