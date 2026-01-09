import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Yahoo Finance News API (无需API key)
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'BAC', 'WMT'];
        const allArticles = [];

        for (const symbol of symbols) {
            try {
                const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${symbol}&newsCount=10`;
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.news && data.news.length > 0) {
                        allArticles.push(...data.news);
                    }
                }
            } catch (e) {
                console.error(`Failed to fetch news for ${symbol}:`, e);
            }
        }

        // 去重
        const uniqueArticles = Array.from(
            new Map(allArticles.map(item => [item.uuid, item])).values()
        );

        // 转换为应用格式并保存到数据库
        const newsItems = [];
        for (const article of uniqueArticles.slice(0, 30)) {
            try {
                // 使用LLM翻译成中文并分析
                const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: `将以下英文财经新闻翻译成中文并分析：
标题：${article.title}
内容：${article.summary || article.title}

请返回JSON格式（所有文本必须是中文）：
{
  "title": "中文标题",
  "summary": "中文摘要（一句话，30字内）",
  "content": "完整中文内容",
  "sentiment": "bullish/bearish/neutral",
  "category": "comprehensive/earnings/fed/analyst/macro/ipo/risk_warning/merger/policy/other",
  "importance": "high/medium/low",
  "related_stocks": ["相关股票代码"]
}`,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            summary: { type: "string" },
                            content: { type: "string" },
                            sentiment: { type: "string" },
                            category: { type: "string" },
                            importance: { type: "string" },
                            related_stocks: { type: "array", items: { type: "string" } }
                        }
                    }
                });

                const newsFlash = await base44.asServiceRole.entities.NewsFlash.create({
                    title: analysis.title,
                    summary: analysis.summary,
                    content: analysis.content,
                    category: analysis.category,
                    sentiment: analysis.sentiment,
                    importance: analysis.importance,
                    source: article.publisher || 'Yahoo Finance',
                    source_url: article.link,
                    related_stocks: analysis.related_stocks || [],
                    published_at: article.providerPublishTime 
                        ? new Date(article.providerPublishTime * 1000).toISOString()
                        : new Date().toISOString(),
                    is_premium: false
                });
                newsItems.push(newsFlash);
            } catch (e) {
                console.error('Failed to process article:', e);
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
            details: '获取Yahoo Finance新闻失败'
        }, { status: 500 });
    }
});