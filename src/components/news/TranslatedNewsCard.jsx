import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import NewsCard from './NewsCard';

export default function TranslatedNewsCard({ news, isPremiumUser, targetLanguage }) {
  const [translatedNews, setTranslatedNews] = useState(news);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateNews = async () => {
      console.log('Target language:', targetLanguage); // 调试日志
      if (!targetLanguage || targetLanguage === 'zh-CN') {
        setTranslatedNews(news);
        return;
      }

      setIsTranslating(true);
      try {
        const { data } = await base44.functions.invoke('translateContent', {
          contentId: news.id,
          contentType: 'news',
          targetLanguage,
          originalData: {
            title: news.title,
            summary: news.summary,
            key_points: news.key_points
          }
        });

        if (data.translation) {
          setTranslatedNews({
            ...news,
            title: data.translation.title,
            summary: data.translation.summary,
            key_points: data.translation.key_points
          });
        }
      } catch (e) {
        console.error('Translation failed:', e);
      } finally {
        setIsTranslating(false);
      }
    };

    translateNews();
  }, [news.id, targetLanguage]);

  return <NewsCard news={translatedNews} isPremiumUser={isPremiumUser} isTranslating={isTranslating} />;
}