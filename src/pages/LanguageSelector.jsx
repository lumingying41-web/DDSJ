import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Globe, Check, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const languages = [
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文', flag: '🇨🇳', region: 'CN', currency: 'CNY' },
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸', region: 'US', currency: 'USD' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文', flag: '🇹🇼', region: 'TW', currency: 'TWD' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', region: 'JP', currency: 'JPY' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', region: 'KR', currency: 'KRW' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'ES', currency: 'EUR' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'FR', currency: 'EUR' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'DE', currency: 'EUR' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'IT', currency: 'EUR' },
  { code: 'pt-PT', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', region: 'PT', currency: 'EUR' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', region: 'RU', currency: 'RUB' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', region: 'SA', currency: 'SAR' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'IN', currency: 'INR' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', region: 'TH', currency: 'THB' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', region: 'VN', currency: 'VND' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', region: 'ID', currency: 'IDR' },
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', region: 'MY', currency: 'MYR' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', region: 'TR', currency: 'TRY' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', region: 'PL', currency: 'PLN' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', region: 'NL', currency: 'EUR' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', region: 'SE', currency: 'SEK' },
  { code: 'no-NO', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', region: 'NO', currency: 'NOK' },
  { code: 'da-DK', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', region: 'DK', currency: 'DKK' },
  { code: 'fi-FI', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', region: 'FI', currency: 'EUR' },
  { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', region: 'GR', currency: 'EUR' },
  { code: 'he-IL', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', region: 'IL', currency: 'ILS' },
  { code: 'cs-CZ', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', region: 'CZ', currency: 'CZK' },
  { code: 'ro-RO', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', region: 'RO', currency: 'RON' },
  { code: 'hu-HU', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', region: 'HU', currency: 'HUF' },
  { code: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', region: 'UA', currency: 'UAH' },
  { code: 'pt-BR', name: 'Portuguese (BR)', nativeName: 'Português (Brasil)', flag: '🇧🇷', region: 'BR', currency: 'BRL' },
  { code: 'es-MX', name: 'Spanish (MX)', nativeName: 'Español (México)', flag: '🇲🇽', region: 'MX', currency: 'MXN' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)', flag: '🇬🇧', region: 'GB', currency: 'GBP' },
  { code: 'fr-CA', name: 'French (CA)', nativeName: 'Français (Canada)', flag: '🇨🇦', region: 'CA', currency: 'CAD' },
  { code: 'zh-HK', name: 'Chinese (HK)', nativeName: '中文（香港）', flag: '🇭🇰', region: 'HK', currency: 'HKD' },
];

export default function LanguageSelector() {
  const [selectedLang, setSelectedLang] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 界面文字根据选择的语言动态显示
  const getUIText = () => {
    const lang = selectedLang?.code || 'zh-CN';
    
    const translations = {
      'zh-CN': {
        title: '选择您的语言',
        subtitle: '选择您的首选语言',
        continue: '继续',
        processing: '处理中...',
        changeLater: '您可以稍后在个人设置中更改'
      },
      'ja-JP': {
        title: '言語を選択',
        subtitle: '優先言語を選択してください',
        continue: '続ける',
        processing: '処理中...',
        changeLater: '後でプロフィール設定で変更できます'
      },
      'ko-KR': {
        title: '언어 선택',
        subtitle: '원하는 언어를 선택하세요',
        continue: '계속',
        processing: '처리 중...',
        changeLater: '나중에 프로필 설정에서 변경할 수 있습니다'
      }
    };
    
    return translations[lang] || {
      title: 'Choose Your Language',
      subtitle: 'Select your preferred language',
      continue: 'Continue',
      processing: 'Processing...',
      changeLater: 'You can change this later in your profile settings'
    };
  };

  const uiText = getUIText();

  const handleContinue = async () => {
    if (!selectedLang) return;
    
    setIsProcessing(true);
    
    try {
      // Check if user is logged in
      const user = await base44.auth.me();
      
      // Update user preferences
      await base44.auth.updateMe({
        language: selectedLang.code,
        region: selectedLang.region,
        currency: selectedLang.currency
      });
      
      // Redirect to home
      window.location.href = createPageUrl('Home');
    } catch (e) {
      // Not logged in, save preference to localStorage and redirect to login
      localStorage.setItem('preferredLanguage', selectedLang.code);
      localStorage.setItem('preferredRegion', selectedLang.region);
      localStorage.setItem('preferredCurrency', selectedLang.currency);
      
      base44.auth.redirectToLogin(createPageUrl('Home'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {uiText.title}
          </h1>
          <p className="text-slate-400">
            {uiText.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {languages.map((lang) => (
            <motion.div
              key={lang.code}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                onClick={() => setSelectedLang(lang)}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedLang?.code === lang.code
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{lang.flag}</span>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        {lang.nativeName}
                      </h3>
                      <p className="text-xs text-slate-400">{lang.name}</p>
                    </div>
                  </div>
                  {selectedLang?.code === lang.code && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedLang || isProcessing}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-medium py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? uiText.processing : (
            <>
              {uiText.continue}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-slate-500 mt-4">
          {uiText.changeLater}
        </p>
      </motion.div>
    </div>
  );
}