import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newsItems = [];
        const institutionReports = [];
        
        // 1. 获取纳斯达克IPO日历
        try {
            const ipoResponse = await fetch(
                'https://api.nasdaq.com/api/ipo/calendar?date=current',
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (ipoResponse.ok) {
                const ipoData = await ipoResponse.json();
                const upcomingIPOs = ipoData.data?.upcoming?.rows || [];
                
                for (const ipo of upcomingIPOs.slice(0, 5)) {
                    newsItems.push({
                        title: `${ipo.companyName || ipo.proposedSymbol} 即将IPO上市`,
                        summary: `${ipo.companyName || ipo.proposedSymbol}计划在纳斯达克上市，股票代码：${ipo.proposedSymbol}`,
                        content: `# ${ipo.companyName || ipo.proposedSymbol} IPO详情\n\n**股票代码**: ${ipo.proposedSymbol}\n**预期日期**: ${ipo.expectedPriceDate || '待定'}\n**价格区间**: ${ipo.proposedSharePrice || '待定'}\n**股数**: ${ipo.sharesOffered || '待定'}\n\n---\n\n*数据来源：纳斯达克交易所*`,
                        sentiment: 'neutral',
                        category: 'ipo',
                        importance: 'high',
                        related_stocks: [ipo.proposedSymbol],
                        source: 'NASDAQ',
                        source_url: `https://www.nasdaq.com/market-activity/ipos`,
                        tags: ['IPO', '纳斯达克', '新股'],
                        published_at: new Date().toISOString(),
                        is_premium: false
                    });
                }
            }
        } catch (e) {
            console.error('IPO calendar error:', e);
        }
        
        // 2. 获取纳斯达克市场新闻
        try {
            const newsResponse = await fetch(
                'https://api.nasdaq.com/api/news/topic/markets?limit=20',
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (newsResponse.ok) {
                const newsData = await newsResponse.json();
                const articles = newsData.data?.rows || [];
                
                for (const article of articles.slice(0, 10)) {
                    const publishedDate = new Date(article.published_at || article.date);
                    if (publishedDate < today) continue;
                    
                    newsItems.push({
                        title: article.title,
                        summary: article.description?.substring(0, 200) || article.title,
                        content: article.description || article.title,
                        sentiment: 'neutral',
                        category: 'macro',
                        importance: 'medium',
                        related_stocks: [],
                        source: 'NASDAQ',
                        source_url: article.url || `https://www.nasdaq.com`,
                        tags: ['纳斯达克', '市场'],
                        published_at: publishedDate.toISOString(),
                        is_premium: false
                    });
                }
            }
        } catch (e) {
            console.error('News error:', e);
        }
        
        // 3. 获取纳斯达克活跃股票
        try {
            const activeResponse = await fetch(
                'https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10&exchange=NASDAQ&marketcap=large',
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (activeResponse.ok) {
                const activeData = await activeResponse.json();
                const stocks = activeData.data?.rows || [];
                
                if (stocks.length > 0) {
                    const topStocks = stocks.slice(0, 5).map(s => s.symbol).join(', ');
                    
                    institutionReports.push({
                        title: '纳斯达克每日市场概览',
                        summary: `纳斯达克交易所今日活跃股票分析，重点关注大盘股表现。`,
                        content: `# 纳斯达克市场日报\n\n## 今日活跃股票\n\n${stocks.slice(0, 5).map(s => 
                            `**${s.symbol}** - ${s.name}\n- 最新价格: $${s.lastsale}\n- 涨跌幅: ${s.netchange} (${s.pctchange})\n- 成交量: ${s.volume}\n`
                        ).join('\n')}\n\n---\n\n*数据来源：纳斯达克交易所*`,
                        institution: '纳斯达克交易所',
                        institution_type: 'research_firm',
                        institution_logo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
                        report_type: 'market_outlook',
                        related_stocks: stocks.slice(0, 5).map(s => s.symbol),
                        is_premium: false,
                        published_at: new Date().toISOString()
                    });
                }
            }
        } catch (e) {
            console.error('Active stocks error:', e);
        }
        
        // 去重并保存快讯
        let syncedNews = 0;
        if (newsItems.length > 0) {
            const existingNews = await base44.asServiceRole.entities.NewsFlash.list('-created_date', 100);
            
            const isDuplicate = (newItem, existing) => {
                if (newItem.source_url && existing.source_url === newItem.source_url) return true;
                return newItem.title === existing.title;
            };
            
            const uniqueNews = newsItems.filter(item => 
                !existingNews.some(existing => isDuplicate(item, existing))
            );
            
            if (uniqueNews.length > 0) {
                await base44.asServiceRole.entities.NewsFlash.bulkCreate(uniqueNews);
                syncedNews = uniqueNews.length;
            }
        }
        
        // 去重并保存机构报告
        let syncedReports = 0;
        if (institutionReports.length > 0) {
            const existingReports = await base44.asServiceRole.entities.InstitutionReport.list('-created_date', 50);
            
            const isDuplicate = (newItem, existing) => {
                return newItem.title === existing.title && 
                       newItem.institution === existing.institution;
            };
            
            const uniqueReports = institutionReports.filter(item => 
                !existingReports.some(existing => isDuplicate(item, existing))
            );
            
            if (uniqueReports.length > 0) {
                await base44.asServiceRole.entities.InstitutionReport.bulkCreate(uniqueReports);
                syncedReports = uniqueReports.length;
            }
        }
        
        return Response.json({
            success: true,
            synced_news: syncedNews,
            synced_reports: syncedReports,
            total_fetched: newsItems.length + institutionReports.length,
            source: 'NASDAQ',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});