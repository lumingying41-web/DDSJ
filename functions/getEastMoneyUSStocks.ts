import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 获取美股实时行情数据
    const marketUrl = 'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=50&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:105,m:106,m:107&fields=f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18';
    
    const response = await fetch(marketUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://quote.eastmoney.com/'
      }
    });
    
    const data = await response.json();
    
    if (!data.data || !data.data.diff) {
      return Response.json({ 
        stocks: [],
        timestamp: new Date().toISOString()
      });
    }
    
    // 解析股票数据
    const stocks = data.data.diff.map(item => ({
      symbol: item.f12,        // 股票代码
      name: item.f14,          // 股票名称
      price: item.f2,          // 最新价
      change: item.f3,         // 涨跌幅
      changeAmount: item.f4,   // 涨跌额
      volume: item.f5,         // 成交量
      amount: item.f6,         // 成交额
      high: item.f15,          // 最高价
      low: item.f16,           // 最低价
      open: item.f17,          // 今开
      previousClose: item.f18  // 昨收
    })).filter(stock => stock.symbol && stock.name);
    
    // 获取美股资讯
    const newsUrl = 'https://np-anotice-stock.eastmoney.com/api/content/ann?client_source=web&page_index=1&page_size=20&sr=-1&stock_list=105.AAPL,105.TSLA,105.MSFT,105.GOOGL,105.AMZN,105.META,105.NVDA&f_node=0&s_node=0';
    
    let newsItems = [];
    try {
      const newsResponse = await fetch(newsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://data.eastmoney.com/'
        }
      });
      const newsData = await newsResponse.json();
      
      if (newsData.data && newsData.data.list) {
        newsItems = newsData.data.list.slice(0, 10).map(item => ({
          title: item.title,
          summary: item.summary || '',
          stockCode: item.stock_code,
          stockName: item.stock_name,
          publishTime: item.notice_date,
          url: `https://data.eastmoney.com/notices/detail/${item.stock_code}/${item.art_code}.html`
        }));
      }
    } catch (e) {
      console.log('Failed to fetch news:', e.message);
    }
    
    return Response.json({
      stocks: stocks.slice(0, 30),
      news: newsItems,
      timestamp: new Date().toISOString(),
      source: 'eastmoney'
    });
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      stocks: [],
      news: []
    }, { status: 500 });
  }
});