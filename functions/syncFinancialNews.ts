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

// 去重检查
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
    const alphaVantageKey = Deno.env.get("ALPHA_VANTAGE_API_KEY") || "75THXAWE1ZDRPVDY";
    
    const allNews = [];
    const sources = [];
    
    // 1. Finnhub - 按股票获取新闻
    if (finnhubKey) {
      try {
        const to = Math.floor(Date.now() / 1000);
        const from = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
        
        for (const symbol of US_STOCKS.slice(0, 20)) {
          try {
            const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${new Date(from * 1000).toISOString().split('T')[0]}&to=${new Date(to * 1000).toISOString().split('T')[0]}&token=${finnhubKey}`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (Array.isArray(data) && data.length > 0) {
              data.slice(0, 2).forEach(item => {
                allNews.push({
                  title: item.headline,
                  summary: item.summary || item.headline.substring(0, 200),
                  content: item.summary || item.headline,
                  source: item.source || 'Finnhub',
                  source_url: item.url,
                  published_at: new Date(item.datetime * 1000).toISOString(),
                  category: 'other',
                  sentiment: 'neutral',
                  importance: 'medium',
                  related_stocks: [symbol],
                  is_premium: false
                });
              });
            }
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (e) {
            console.log(`Finnhub ${symbol}:`, e.message);
          }
        }
        sources.push('Finnhub');
      } catch (e) {
        console.error('Finnhub error:', e);
      }
    }
    
    // 2. NewsAPI - 美股关键词搜索
    if (newsApiKey) {
      try {
        const keywords = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META'].join(' OR ');
        const url = `https://newsapi.org/v2/everything?q=${keywords}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${newsApiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.articles) {
          data.articles.forEach(item => {
            if (isUSStockRelated(item.title, item.description || '', item.content || '')) {
              const relatedStocks = US_STOCKS.filter(stock => 
                `${item.title} ${item.description}`.toUpperCase().includes(stock)
              );
              
              allNews.push({
                title: item.title,
                summary: item.description || item.title.substring(0, 200),
                content: item.content || item.description || item.title,
                source: item.source?.name || 'NewsAPI',
                source_url: item.url,
                published_at: item.publishedAt,
                category: 'other',
                sentiment: 'neutral',
                importance: 'medium',
                related_stocks: relatedStocks,
                is_premium: false
              });
            }
          });
          sources.push('NewsAPI');
        }
      } catch (e) {
        console.error('NewsAPI error:', e);
      }
    }
    
    // 3. Marketaux - 美股新闻
    if (marketauxKey) {
      try {
        const symbols = US_STOCKS.slice(0, 30).join(',');
        const url = `https://api.marketaux.com/v1/news/all?symbols=${symbols}&filter_entities=true&language=en&limit=30&api_token=${marketauxKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.data) {
          data.data.forEach(item => {
            const relatedStocks = item.entities?.map(e => e.symbol).filter(s => US_STOCKS.includes(s)) || [];
            
            allNews.push({
              title: item.title,
              summary: item.description || item.title.substring(0, 200),
              content: item.description || item.title,
              source: item.source || 'Marketaux',
              source_url: item.url,
              published_at: item.published_at,
              category: 'other',
              sentiment: item.sentiment || 'neutral',
              importance: 'medium',
              related_stocks: relatedStocks,
              is_premium: false
            });
          });
          sources.push('Marketaux');
        }
      } catch (e) {
        console.error('Marketaux error:', e);
      }
    }
    
    // 4. Polygon.io - 美股新闻
    if (polygonKey) {
      try {
        const url = `https://api.polygon.io/v2/reference/news?limit=30&apiKey=${polygonKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.results) {
          data.results.forEach(item => {
            const relatedStocks = item.tickers?.filter(t => US_STOCKS.includes(t)) || [];
            
            if (relatedStocks.length > 0) {
              allNews.push({
                title: item.title,
                summary: item.description || item.title.substring(0, 200),
                content: item.description || item.title,
                source: item.publisher?.name || 'Polygon',
                source_url: item.article_url,
                published_at: item.published_utc,
                category: 'other',
                sentiment: 'neutral',
                importance: 'medium',
                related_stocks: relatedStocks,
                is_premium: false
              });
            }
          });
          sources.push('Polygon.io');
        }
      } catch (e) {
        console.error('Polygon error:', e);
      }
    }
    
    // 5. Alpha Vantage - 美股新闻
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
    
    // 获取已有新闻
    const existingNews = await base44.asServiceRole.entities.NewsFlash.list('-created_date', 200);
    
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