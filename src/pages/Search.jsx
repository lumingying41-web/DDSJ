import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, Clock, TrendingUp, Zap, FileText, Building2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import NewsCard from '@/components/news/NewsCard';
import ResearchCard from '@/components/research/ResearchCard';
import InstitutionReportCard from '@/components/institution/InstitutionReportCard';

const popularSearches = ['AAPL', 'TSLA', 'NVDA', '财报', '美联储', 'AI', '降息'];

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({ news: [], research: [], reports: [] });
  const [recentSearches, setRecentSearches] = useState([]);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  
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
    
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);
  
  const isPremiumUser = subscription?.plan !== 'free' && subscription?.status === 'active';

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setQuery(searchQuery);
    
    // Save to recent searches
    const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    
    // Search across all entities
    const [news, research, reports] = await Promise.all([
      base44.entities.NewsFlash.list('-created_date', 100),
      base44.entities.Research.list('-created_date', 100),
      base44.entities.InstitutionReport.list('-created_date', 100),
    ]);
    
    const q = searchQuery.toLowerCase();
    
    setResults({
      news: news.filter(item => 
        item.title?.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q) ||
        item.related_stocks?.some(s => s.toLowerCase().includes(q)) ||
        item.tags?.some(t => t.toLowerCase().includes(q))
      ),
      research: research.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.stock_symbol?.toLowerCase().includes(q) ||
        item.stock_name?.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q)
      ),
      reports: reports.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.institution?.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q) ||
        item.related_stocks?.some(s => s.toLowerCase().includes(q))
      ),
    });
    
    setIsSearching(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ news: [], research: [], reports: [] });
  };

  const totalResults = results.news.length + results.research.length + results.reports.length;

  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="搜索股票、快讯、研报..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performSearch(query)}
              className="pl-12 pr-12 py-6 text-lg bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500/50 rounded-xl"
              autoFocus
            />
            {query && (
              <button 
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Before Search */}
        {!query && totalResults === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  最近搜索
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      onClick={() => performSearch(search)}
                      className="bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                热门搜索
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => performSearch(search)}
                    className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {isSearching && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">搜索中...</p>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">
                找到 <span className="text-white font-medium">{totalResults}</span> 条结果
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-800/50 border border-slate-700 mb-6">
                <TabsTrigger value="all" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                  全部 ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="news" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                  <Zap className="w-3 h-3 mr-1" />
                  快讯 ({results.news.length})
                </TabsTrigger>
                <TabsTrigger value="research" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                  <FileText className="w-3 h-3 mr-1" />
                  研报 ({results.research.length})
                </TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                  <Building2 className="w-3 h-3 mr-1" />
                  机构 ({results.reports.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {/* News */}
                {results.news.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      快讯
                    </h3>
                    <div className="space-y-3">
                      {results.news.slice(0, 3).map((news) => (
                        <NewsCard key={news.id} news={news} isPremiumUser={isPremiumUser} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Research */}
                {results.research.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      研报
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {results.research.slice(0, 2).map((research) => (
                        <ResearchCard key={research.id} research={research} isPremiumUser={isPremiumUser} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Reports */}
                {results.reports.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      机构报告
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {results.reports.slice(0, 2).map((report) => (
                        <InstitutionReportCard key={report.id} report={report} isPremiumUser={isPremiumUser} />
                      ))}
                    </div>
                  </div>
                )}

                {totalResults === 0 && (
                  <div className="text-center py-20">
                    <SearchIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg text-slate-400 mb-2">未找到相关结果</h3>
                    <p className="text-sm text-slate-500">换个关键词试试</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="news" className="space-y-3">
                {results.news.map((news) => (
                  <NewsCard key={news.id} news={news} isPremiumUser={isPremiumUser} />
                ))}
                {results.news.length === 0 && (
                  <div className="text-center py-12 text-slate-500">暂无快讯结果</div>
                )}
              </TabsContent>

              <TabsContent value="research" className="grid md:grid-cols-2 gap-4">
                {results.research.map((research) => (
                  <ResearchCard key={research.id} research={research} isPremiumUser={isPremiumUser} />
                ))}
                {results.research.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-slate-500">暂无研报结果</div>
                )}
              </TabsContent>

              <TabsContent value="reports" className="grid md:grid-cols-2 gap-4">
                {results.reports.map((report) => (
                  <InstitutionReportCard key={report.id} report={report} isPremiumUser={isPremiumUser} />
                ))}
                {results.reports.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-slate-500">暂无机构报告结果</div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  );
}