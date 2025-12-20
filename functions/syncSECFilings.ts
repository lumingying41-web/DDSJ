import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // SEC要求User-Agent标识
        const headers = {
            'User-Agent': 'TopView Financial App contact@topview.com'
        };
        
        // 重点公司CIK列表
        const companies = [
            { cik: '0000320193', symbol: 'AAPL', name: '苹果' },
            { cik: '0001018724', symbol: 'AMZN', name: '亚马逊' },
            { cik: '0001652044', symbol: 'GOOGL', name: '谷歌' },
            { cik: '0001318605', symbol: 'TSLA', name: '特斯拉' },
            { cik: '0000789019', symbol: 'MSFT', name: '微软' },
            { cik: '0001326801', symbol: 'META', name: 'Meta' },
            { cik: '0001045810', symbol: 'NVDA', name: '英伟达' },
            { cik: '0000002488', symbol: 'AMD', name: '超威半导体' }
        ];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const allResearch = [];
        
        for (const company of companies) {
            try {
                // 获取公司最新申报
                const response = await fetch(
                    `https://data.sec.gov/submissions/CIK${company.cik}.json`,
                    { headers }
                );
                
                if (!response.ok) continue;
                
                const data = await response.json();
                const recentFilings = data.filings?.recent;
                
                if (!recentFilings) continue;
                
                // 获取今天的申报
                for (let i = 0; i < Math.min(recentFilings.form.length, 10); i++) {
                    const form = recentFilings.form[i];
                    const filingDate = new Date(recentFilings.filingDate[i]);
                    
                    if (filingDate < today) continue;
                    
                    // 只处理重要的申报类型
                    if (!['10-K', '10-Q', '8-K', 'DEF 14A', 'SC 13G'].includes(form)) continue;
                    
                    const accessionNumber = recentFilings.accessionNumber[i].replace(/-/g, '');
                    const docUrl = `https://www.sec.gov/Archives/edgar/data/${company.cik.replace(/^0+/, '')}/${accessionNumber}/${recentFilings.primaryDocument[i]}`;
                    
                    // 根据申报类型生成标题和摘要
                    let title, summary, category;
                    
                    if (form === '10-K') {
                        title = `${company.name}(${company.symbol}) 年度财报(10-K)`;
                        summary = `${company.name}向SEC提交年度财务报告，包含完整的财务状况、业务运营和风险因素披露。`;
                        category = 'earnings';
                    } else if (form === '10-Q') {
                        title = `${company.name}(${company.symbol}) 季度财报(10-Q)`;
                        summary = `${company.name}发布季度财务报告，披露最新财务数据和业务进展。`;
                        category = 'earnings';
                    } else if (form === '8-K') {
                        title = `${company.name}(${company.symbol}) 重大事件披露(8-K)`;
                        summary = `${company.name}向SEC报告重大事件，投资者需关注相关信息。`;
                        category = 'deep_dive';
                    } else if (form === 'DEF 14A') {
                        title = `${company.name}(${company.symbol}) 股东委托书`;
                        summary = `${company.name}发布股东大会委托书，包含高管薪酬、董事选举等重要信息。`;
                        category = 'industry';
                    } else {
                        title = `${company.name}(${company.symbol}) ${form}申报`;
                        summary = `${company.name}向SEC提交${form}文件。`;
                        category = 'deep_dive';
                    }
                    
                    allResearch.push({
                        title,
                        summary,
                        content: `# ${title}\n\n${summary}\n\n**申报类型**: ${form}\n**申报日期**: ${recentFilings.filingDate[i]}\n**报告日期**: ${recentFilings.reportDate[i] || '未指定'}\n\n## 文档链接\n[查看完整SEC文件](${docUrl})\n\n---\n\n*数据来源：美国证券交易委员会(SEC) EDGAR系统*`,
                        stock_symbol: company.symbol,
                        stock_name: company.name,
                        category,
                        rating: 'hold',
                        author: 'SEC Filing',
                        is_premium: false,
                        read_time: 10,
                        tags: [form, 'SEC', '监管申报'],
                        published_at: new Date(recentFilings.filingDate[i]).toISOString()
                    });
                }
                
                // 避免请求过快
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (e) {
                console.error(`Error fetching ${company.symbol}:`, e);
            }
        }
        
        // 检查重复
        const existingResearch = await base44.asServiceRole.entities.Research.list('-created_date', 50);
        
        const isDuplicate = (newItem, existing) => {
            if (newItem.title === existing.title) return true;
            if (newItem.stock_symbol === existing.stock_symbol && 
                newItem.published_at === existing.published_at) return true;
            return false;
        };
        
        const uniqueResearch = allResearch.filter(item => 
            !existingResearch.some(existing => isDuplicate(item, existing))
        );
        
        if (uniqueResearch.length > 0) {
            await base44.asServiceRole.entities.Research.bulkCreate(uniqueResearch);
        }
        
        return Response.json({
            success: true,
            synced: uniqueResearch.length,
            total_fetched: allResearch.length,
            source: 'SEC EDGAR',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});