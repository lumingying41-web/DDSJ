import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Zap, FileText, Building2, Search, User, Crown,
  Menu, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { id: 'Home', label: '快讯', icon: Zap },
  { id: 'Research', label: '研报', icon: FileText },
  { id: 'Institution', label: '机构', icon: Building2 },
  { id: 'Search', label: '搜索', icon: Search },
  { id: 'Profile', label: '我的', icon: User },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email });
        if (subs.length > 0) setSubscription(subs[0]);
      } catch (e) {}
    };
    loadUser();
  }, []);
  
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
        
        body {
          background-color: #070D18;
          color: white;
        }
        
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
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
          </nav>
          
          <div className="flex items-center gap-3">
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-base font-bold text-white">顶点视角</span>
          </Link>
          
          {isPremiumUser && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          )}
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