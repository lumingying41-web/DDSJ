import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiToken = Deno.env.get("ITICK_API_TOKEN");
        
        if (!apiToken) {
            return Response.json({ 
                error: '请先设置 ITICK_API_TOKEN'
            }, { status: 400 });
        }

        // iTicK News API
        const url = `https://api.itick.com/v1/news?token=${apiToken}&limit=50`;
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`iTicK API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.articles || data.articles.length === 0) {
            return Response.json({ 
                success: true,
                count: 0,
                articles: []
            });
        }

        // 转换为应用格式并保存到数据库
        const newsItems = [];
        for (const article of data.articles.slice(0, 30)) {
            try {
                // 使用LLM翻译成中文并分析
                const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: `将以下英文财经新闻翻译成中文并分析：
标题：${article.title}
内容：${article.description || article.title}

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
                    source: article.source || 'iTicK',
                    source_url: article.url,
                    related_stocks: analysis.related_stocks || [],
                    published_at: article.publishedAt || new Date().toISOString(),
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
            details: '获取iTicK新闻失败'
        }, { status: 500 });
    }
});