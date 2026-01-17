import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newsItems, targetLanguage } = await req.json();
    
    // 语言映射
    const languageMap = {
      'zh-CN': '简体中文',
      'zh-TW': '繁体中文',
      'ja-JP': '日语',
      'ko-KR': '韩语',
      'en-US': '英语',
      'es-ES': '西班牙语',
      'fr-FR': '法语',
      'de-DE': '德语',
      'it-IT': '意大利语',
      'pt-PT': '葡萄牙语',
      'ru-RU': '俄语',
      'ar-SA': '阿拉伯语',
      'hi-IN': '印地语',
      'th-TH': '泰语',
      'vi-VN': '越南语',
      'id-ID': '印尼语',
      'ms-MY': '马来语',
      'tr-TR': '土耳其语',
      'pl-PL': '波兰语',
      'nl-NL': '荷兰语',
      'sv-SE': '瑞典语',
      'no-NO': '挪威语',
      'da-DK': '丹麦语',
      'fi-FI': '芬兰语',
      'el-GR': '希腊语',
      'he-IL': '希伯来语',
      'cs-CZ': '捷克语',
      'ro-RO': '罗马尼亚语',
      'hu-HU': '匈牙利语',
      'uk-UA': '乌克兰语',
      'pt-BR': '巴西葡萄牙语',
      'es-MX': '墨西哥西班牙语',
      'en-GB': '英式英语',
      'fr-CA': '加拿大法语',
      'zh-HK': '香港中文'
    };

    const targetLangName = languageMap[targetLanguage] || '英语';
    
    // 批量翻译
    const translatedNews = await Promise.all(
      newsItems.map(async (news) => {
        try {
          const translationResult = await base44.integrations.Core.InvokeLLM({
            prompt: `请将以下金融快讯翻译成${targetLangName}，保持专业术语的准确性：

标题：${news.title}
摘要：${news.summary}
${news.key_points ? `要点：${news.key_points.join(', ')}` : ''}

请以JSON格式返回翻译结果`,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string" },
                key_points: { 
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          });

          return {
            id: news.id,
            ...news,
            title: translationResult.title || news.title,
            summary: translationResult.summary || news.summary,
            key_points: translationResult.key_points || news.key_points
          };
        } catch (e) {
          console.error('Translation failed for news:', news.id, e);
          return news;
        }
      })
    );

    return Response.json({ translatedNews });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});