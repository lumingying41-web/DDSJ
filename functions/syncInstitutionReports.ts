import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const newsApiKey = Deno.env.get("NEWSAPI_KEY");
        const processedReports = [];

        if (!newsApiKey) {
            return Response.json({ 
                error: 'NEWSAPI_KEY not configured' 
            }, { status: 400 });
        }

        // 定义知名金融机构关键词
        const institutions = [
            { name: 'Goldman Sachs', type: 'investment_bank', keywords: 'Goldman Sachs' },
            { name: 'Morgan Stanley', type: 'investment_bank', keywords: 'Morgan Stanley' },
            { name: 'JP Morgan', type: 'investment_bank', keywords: 'JP Morgan OR JPMorgan' },
            { name: 'Bank of America', type: 'investment_bank', keywords: 'Bank of America' },
            { name: 'Citigroup', type: 'investment_bank', keywords: 'Citigroup OR Citi' },
            { name: 'BlackRock', type: 'asset_manager', keywords: 'BlackRock' },
            { name: 'Vanguard', type: 'asset_manager', keywords: 'Vanguard' },
            { name: 'Fidelity', type: 'asset_manager', keywords: 'Fidelity' },
            { name: 'Bridgewater', type: 'hedge_fund', keywords: 'Bridgewater' },
            { name: 'Renaissance Technologies', type: 'hedge_fund', keywords: 'Renaissance Technologies' },
        ];

        for (const institution of institutions) {
            try {
                const query = `${institution.keywords} AND (outlook OR forecast OR strategy OR report)`;
                const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${newsApiKey}`;
                
                const response = await fetch(url);
                const data = await response.json();

                if (data.articles && data.articles.length > 0) {
                    for (const article of data.articles.slice(0, 2)) {
                        if (!article.content || article.content.length < 400) continue;

                        const analyzed = await base44.integrations.Core.InvokeLLM({
                            prompt: `分析以下来自${institution.name}的财经报道，判断是否为机构报告，并生成中文版本：

标题：${article.title}
描述：${article.description || ''}
内容：${article.content || ''}
来源：${article.source?.name || ''}

请判断这是否为机构发布的正式报告/观点/策略，并提供：
1. 是否为机构报告（true/false）
2. 中文标题
3. 摘要
4. 核心要点（3-5点数组）
5. 完整内容（Markdown格式，翻译并扩展）
6. 报告类型（market_outlook/sector_analysis/stock_pick/macro_research/strategy）
7. 相关股票代码（数组）`,
                            response_json_schema: {
                                type: "object",
                                properties: {
                                    is_institution_report: { type: "boolean" },
                                    title: { type: "string" },
                                    summary: { type: "string" },
                                    key_points: { 
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    content: { type: "string" },
                                    report_type: { type: "string" },
                                    related_stocks: { 
                                        type: "array",
                                        items: { type: "string" }
                                    }
                                }
                            }
                        });

                        if (analyzed.is_institution_report && analyzed.content && analyzed.content.length > 500) {
                            await base44.entities.InstitutionReport.create({
                                title: analyzed.title,
                                summary: analyzed.summary,
                                key_points: analyzed.key_points || [],
                                content: analyzed.content,
                                institution: institution.name,
                                institution_type: institution.type,
                                report_type: analyzed.report_type || 'market_outlook',
                                related_stocks: analyzed.related_stocks || [],
                                file_url: article.url,
                                is_premium: true,
                                published_at: new Date(article.publishedAt).toISOString()
                            });

                            processedReports.push({
                                institution: institution.name,
                                title: analyzed.title
                            });
                        }

                        // 避免请求过快
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } catch (e) {
                console.error(`Error processing ${institution.name}:`, e);
            }

            // 避免API限流
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return Response.json({ 
            success: true,
            count: processedReports.length,
            reports: processedReports
        });

    } catch (error) {
        console.error('Sync institution reports error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});