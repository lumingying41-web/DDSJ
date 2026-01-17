import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId, contentType, targetLanguage, originalData } = await req.json();
    
    // 检查是否已有翻译缓存
    const existing = await base44.asServiceRole.entities.TranslatedContent.filter({
      content_id: contentId,
      content_type: contentType,
      language: targetLanguage
    });

    if (existing.length > 0) {
      return Response.json({ translation: existing[0] });
    }

    // 语言名称映射
    const langNames = {
      'zh-CN': '简体中文', 'zh-TW': '繁体中文', 'ja-JP': '日语',
      'ko-KR': '韩语', 'en-US': '英语', 'es-ES': '西班牙语',
      'fr-FR': '法语', 'de-DE': '德语', 'it-IT': '意大利语',
      'pt-PT': '葡萄牙语', 'ru-RU': '俄语', 'ar-SA': '阿拉伯语',
      'hi-IN': '印地语', 'th-TH': '泰语', 'vi-VN': '越南语',
      'id-ID': '印尼语', 'ms-MY': '马来语', 'tr-TR': '土耳其语'
    };

    const langName = langNames[targetLanguage] || '英语';
    
    // 执行翻译
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `请将以下金融内容翻译成${langName}，保持专业性和准确性：

标题：${originalData.title}
摘要：${originalData.summary || ''}
${originalData.key_points ? `要点：\n${originalData.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

返回JSON格式的翻译结果。`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          key_points: { 
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["title"]
      }
    });

    // 保存翻译到缓存
    const translation = await base44.asServiceRole.entities.TranslatedContent.create({
      content_type: contentType,
      content_id: contentId,
      language: targetLanguage,
      title: result.title,
      summary: result.summary || originalData.summary,
      key_points: result.key_points || originalData.key_points
    });

    return Response.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});