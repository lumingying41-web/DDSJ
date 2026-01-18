import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
];

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('zh-CN');
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const user = await base44.auth.me();
        if (user.language) {
          setCurrentLang(user.language);
        }
      } catch (e) {
        // Not logged in
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (langCode) => {
    if (langCode === currentLang || isChanging) return;
    
    setIsChanging(true);
    try {
      // 保存语言偏好
      await base44.auth.updateMe({ language: langCode });
      setCurrentLang(langCode);
      
      // 触发 Google Translate
      const targetLang = langCode.split('-')[0]; // zh-CN -> zh, en-US -> en
      
      // 清除现有翻译
      const existingScript = document.querySelector('.goog-te-banner-frame');
      const existingSelect = document.querySelector('.goog-te-combo');
      
      if (existingSelect) {
        existingSelect.value = targetLang;
        existingSelect.dispatchEvent(new Event('change'));
      } else {
        // 初始化 Google Translate
        if (!window.googleTranslateElementInit) {
          window.googleTranslateElementInit = function() {
            new window.google.translate.TranslateElement({
              pageLanguage: 'zh-CN',
              includedLanguages: 'zh-CN,zh-TW,en,ja,ko,es,fr,de',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false
            }, 'google_translate_element');
          };
          
          const script = document.createElement('script');
          script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
          document.body.appendChild(script);
          
          // 等待加载完成后切换语言
          script.onload = () => {
            setTimeout(() => {
              const select = document.querySelector('.goog-te-combo');
              if (select) {
                select.value = targetLang;
                select.dispatchEvent(new Event('change'));
              }
            }, 1000);
          };
        }
      }
    } catch (e) {
      console.error('Failed to change language:', e);
    } finally {
      setIsChanging(false);
    }
  };

  const currentLanguage = languages.find(l => l.code === currentLang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-slate-400 hover:text-white gap-2"
          disabled={isChanging}
        >
          <Globe className="w-4 h-4" />
          <span className="hidden md:inline">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`cursor-pointer ${
              lang.code === currentLang ? 'bg-amber-500/10 text-amber-400' : ''
            }`}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}