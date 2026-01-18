import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Zap, FileText, Building2, MessageCircle, User, Crown, Shield,
  Menu, X
} from 'lucide-react';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { id: 'Home', label: '快讯', icon: Zap },
  { id: 'Research', label: '研报', icon: FileText },
  { id: 'Institution', label: '机构', icon: Building2 },
  { id: 'Community', label: '讨论', icon: MessageCircle },
  { id: 'Profile', label: '我的', icon: User },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Block MetaMask IMMEDIATELY before any other code runs
  if (typeof window !== 'undefined') {
    try {
      if (!Object.getOwnPropertyDescriptor(window, 'ethereum')?.configurable) {
        // Property already exists and is not configurable, skip
      } else {
        delete window.ethereum;
        Object.defineProperty(window, 'ethereum', {
          get: () => undefined,
          set: () => {},
          configurable: false
        });
      }
      window.web3 = undefined;
    } catch (e) {
      // Silently ignore errors
    }
  }
  
  useEffect(() => {
    // Immediately block all wallet/MetaMask attempts
    try {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
      if (!descriptor || descriptor.configurable !== false) {
        delete window.ethereum;
        Object.defineProperty(window, 'ethereum', {
          get: () => undefined,
          set: () => {},
          configurable: false,
          enumerable: false
        });
      }
    } catch (e) {
      // Silently ignore
    }

    // Ultra-aggressive error suppression
    const handleError = (event) => {
      try {
        const msg = String(event.message || event.error?.message || event.error || event.reason || '').toLowerCase();
        if (msg.includes('metamask') || msg.includes('ethereum') || msg.includes('wallet') || 
            msg.includes('web3') || msg.includes('crypto') || msg.includes('redefine') || msg.includes('connect')) {
          event.stopImmediatePropagation();
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      } catch (e) {}
    };

    const handleUnhandledRejection = (event) => {
      try {
        const reason = String(event.reason?.message || event.reason || '').toLowerCase();
        if (reason.includes('metamask') || reason.includes('ethereum') || reason.includes('wallet') || 
            reason.includes('web3') || reason.includes('connect')) {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        }
      } catch (e) {}
    };

    // Override console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    console.error = (...args) => {
      const msg = args.join(' ').toLowerCase();
      if (msg.includes('metamask') || msg.includes('ethereum') || msg.includes('wallet') || msg.includes('connect')) return;
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const msg = args.join(' ').toLowerCase();
      if (msg.includes('metamask') || msg.includes('ethereum') || msg.includes('wallet') || msg.includes('connect')) return;
      originalWarn.apply(console, args);
    };

    console.log = (...args) => {
      const msg = args.join(' ').toLowerCase();
      if (msg.includes('metamask') || msg.includes('ethereum') || msg.includes('wallet') || msg.includes('connect')) return;
      originalLog.apply(console, args);
    };

    // Register all error handlers with capture phase
    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    document.addEventListener('error', handleError, true);

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      document.removeEventListener('error', handleError, true);
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, []);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email });
        if (subs.length > 0) setSubscription(subs[0]);
        
        // 加载用户主题偏好
        const prefs = await base44.entities.UserPreference.filter({ user_email: currentUser.email });
        if (prefs.length > 0 && prefs[0].theme) {
          applyTheme(prefs[0].theme);
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  const applyTheme = (theme) => {
    const body = document.body;
    
    // 移除所有主题类
    body.classList.remove('theme-dark', 'theme-white');
    
    // 添加新主题类
    body.classList.add(`theme-${theme || 'dark'}`);
  };
  
  const isPremiumUser = subscription?.plan !== 'free' && subscription?.status === 'active';
  
  // Pages without bottom nav
  const hideNav = ['NewsDetail', 'ResearchDetail', 'ReportDetail', 'Subscription', 'Preferences'].includes(currentPageName);

  return (
    <div className="min-h-screen bg-[#070D18] text-white">
      <style>{`
        :root {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 47.9 95.8% 53.1%;
          --primary-foreground: 26 83.3% 14.1%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 47.9 95.8% 53.1%;
        }

        /* 深夜黑主题 (默认) */
        body, body.theme-dark {
          background-color: #070D18;
          color: white;
        }
        body.theme-dark .bg-\\[\\#070D18\\] { background-color: #070D18 !important; }
        body.theme-dark .bg-\\[\\#0F1A2E\\] { background-color: #0F1A2E !important; }

        /* 简约白主题 */
        body.theme-white {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        body.theme-white * {
          border-color: #e2e8f0 !important;
        }
        /* 主背景色 */
        body.theme-white .min-h-screen { background-color: #ffffff !important; }
        body.theme-white .bg-\\[\\#070D18\\] { background-color: #ffffff !important; }
        body.theme-white .bg-\\[\\#0F1A2E\\] { background-color: #ffffff !important; }
        body.theme-white .bg-\\[\\#070D18\\]\\/95 { background-color: rgba(255, 255, 255, 0.98) !important; }
        body.theme-white .bg-\\[\\#0F1A2E\\]\\/80 { background-color: rgba(255, 255, 255, 0.95) !important; }

        /* Slate 颜色系列 */
        body.theme-white .bg-slate-950 { background-color: #ffffff !important; }
        body.theme-white .bg-slate-900 { background-color: #ffffff !important; }
        body.theme-white .bg-slate-800 { background-color: #ffffff !important; }
        body.theme-white .bg-slate-700 { background-color: #f8f9fa !important; }
        body.theme-white .bg-slate-600 { background-color: #f1f5f9 !important; }

        /* Slate 透明度变体 */
        body.theme-white .bg-slate-950\\/95 { background-color: rgba(255, 255, 255, 0.98) !important; }
        body.theme-white .bg-slate-900\\/95 { background-color: rgba(255, 255, 255, 0.98) !important; }
        body.theme-white .bg-slate-800\\/95 { background-color: rgba(255, 255, 255, 0.98) !important; }
        body.theme-white .bg-slate-800\\/80 { background-color: rgba(255, 255, 255, 0.95) !important; }
        body.theme-white .bg-slate-800\\/50 { background-color: rgba(248, 249, 250, 1) !important; }
        body.theme-white .bg-slate-800\\/40 { background-color: rgba(248, 249, 250, 1) !important; }
        body.theme-white .bg-slate-800\\/30 { background-color: rgba(248, 249, 250, 0.9) !important; }
        body.theme-white .bg-slate-700\\/50 { background-color: rgba(248, 249, 250, 0.9) !important; }
        body.theme-white .bg-slate-700\\/30 { background-color: rgba(248, 249, 250, 0.8) !important; }

        /* Gray 颜色系列 */
        body.theme-white .bg-gray-950 { background-color: #ffffff !important; }
        body.theme-white .bg-gray-900 { background-color: #ffffff !important; }
        body.theme-white .bg-gray-800 { background-color: #f8f9fa !important; }
        body.theme-white .bg-gray-700 { background-color: #f1f5f9 !important; }

        /* 文字颜色 */
        body.theme-white .text-white { color: #000000 !important; }
        body.theme-white .text-slate-100 { color: #1e293b !important; }
        body.theme-white .text-slate-200 { color: #334155 !important; }
        body.theme-white .text-slate-300 { color: #475569 !important; }
        body.theme-white .text-slate-400 { color: #64748b !important; }
        body.theme-white .text-slate-500 { color: #64748b !important; }
        body.theme-white .text-slate-600 { color: #475569 !important; }
        body.theme-white .text-gray-100 { color: #1e293b !important; }
        body.theme-white .text-gray-200 { color: #334155 !important; }
        body.theme-white .text-gray-300 { color: #475569 !important; }
        body.theme-white .text-gray-400 { color: #64748b !important; }
        body.theme-white .text-gray-500 { color: #64748b !important; }

        /* 边框颜色 */
        body.theme-white .border-slate-900 { border-color: #e2e8f0 !important; }
        body.theme-white .border-slate-800 { border-color: #e2e8f0 !important; }
        body.theme-white .border-slate-700 { border-color: #cbd5e1 !important; }
        body.theme-white .border-slate-800\\/50 { border-color: #e2e8f0 !important; }
        body.theme-white .border-slate-700\\/50 { border-color: #cbd5e1 !important; }

        /* 修复框框黑色问题 */
        body.theme-white .border { border-color: #e2e8f0 !important; }
        body.theme-white [class*="border-"] { border-color: #e2e8f0 !important; }

        /* Hover 状态 */
        body.theme-white .hover\\:bg-slate-900:hover { background-color: #f8f9fa !important; }
        body.theme-white .hover\\:bg-slate-800:hover { background-color: #f1f5f9 !important; }
        body.theme-white .hover\\:bg-slate-700:hover { background-color: #e2e8f0 !important; }
        body.theme-white .hover\\:bg-slate-700\\/50:hover { background-color: rgba(241, 245, 249, 0.8) !important; }
        body.theme-white .hover\\:bg-slate-700\\/30:hover { background-color: rgba(241, 245, 249, 0.6) !important; }
        body.theme-white .hover\\:text-white:hover { color: #000000 !important; }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69428f76e79351c1b4084783/8a0bbd26d_427b62b42136215ca475cbd1d74c2345.jpg" 
              alt="顶点视角" 
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="text-lg font-bold text-white">顶点视角</span>
            {isPremiumUser && (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                <Crown className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            )}
          </Link>
          
          <nav className="flex items-center gap-1">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.id;
              return (
                <Link key={item.id} to={createPageUrl(item.id)}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`
                      ${isActive 
                        ? 'text-amber-400 bg-amber-500/10' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            {user?.role === 'admin' && (
              <Link to={createPageUrl('Admin')}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`
                    ${currentPageName === 'Admin' 
                      ? 'text-amber-400 bg-amber-500/10' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }
                  `}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  管理
                </Button>
              </Link>
            )}
          </nav>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link to={createPageUrl('Profile')}>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <User className="w-4 h-4 mr-2" />
                  {user.full_name || '我的'}
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-amber-500 hover:bg-amber-400 text-black"
              >
                登录
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69428f76e79351c1b4084783/8a0bbd26d_427b62b42136215ca475cbd1d74c2345.jpg" 
              alt="顶点视角" 
              className="w-7 h-7 rounded-lg object-cover"
            />
            <span className="text-base font-bold text-white">顶点视角</span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isPremiumUser && (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                <Crown className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className={`
        ${hideNav ? 'pt-0 md:pt-14' : 'pt-14 pb-20 md:pb-6 md:pt-14'}
      `}>
        {children}
      </main>
      
      {/* Mobile Bottom Nav */}
      {!hideNav && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070D18]/95 backdrop-blur-lg border-t border-slate-800/50 safe-area-inset-bottom">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.id;
              return (
                <Link 
                  key={item.id} 
                  to={createPageUrl(item.id)}
                  className="flex flex-col items-center gap-1 py-1 px-3"
                >
                  <div className={`
                    p-2 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'text-slate-500'
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}