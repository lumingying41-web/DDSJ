import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Globe, Check, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const languages = [
  { 
    code: 'zh-CN', 
    name: '简体中文', 
    nativeName: '简体中文',
    flag: '🇨🇳',
    region: 'CN',
    currency: 'CNY'
  },
  { 
    code: 'en-US', 
    name: 'English', 
    nativeName: 'English',
    flag: '🇺🇸',
    region: 'US',
    currency: 'USD'
  },
  { 
    code: 'zh-TW', 
    name: '繁體中文', 
    nativeName: '繁體中文',
    flag: '🇹🇼',
    region: 'TW',
    currency: 'TWD'
  },
  { 
    code: 'ja-JP', 
    name: 'Japanese', 
    nativeName: '日本語',
    flag: '🇯🇵',
    region: 'JP',
    currency: 'JPY'
  },
  { 
    code: 'ko-KR', 
    name: 'Korean', 
    nativeName: '한국어',
    flag: '🇰🇷',
    region: 'KR',
    currency: 'KRW'
  },
];

export default function LanguageSelector() {
  const [selectedLang, setSelectedLang] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
            Choose Your Language
          </h1>
          <p className="text-slate-400">
            选择您的语言 / Select your preferred language
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
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
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{lang.flag}</span>
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {lang.nativeName}
                      </h3>
                      <p className="text-sm text-slate-400">{lang.name}</p>
                    </div>
                  </div>
                  {selectedLang?.code === lang.code && (
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-5 h-5 text-black" />
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
          {isProcessing ? (
            'Processing...'
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-slate-500 mt-4">
          You can change this later in your profile settings
          <br />
          您可以稍后在个人设置中更改
        </p>
      </motion.div>
    </div>
  );
}