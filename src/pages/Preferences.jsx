import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, TrendingUp, Building2, Layers, Plus, X, Save, Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const popularStocks = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B',
  'JPM', 'V', 'MA', 'DIS', 'NFLX', 'AMD', 'INTC', 'CRM'
];

const sectors = [
  { id: 'tech', label: '科技' },
  { id: 'finance', label: '金融' },
  { id: 'healthcare', label: '医疗' },
  { id: 'energy', label: '能源' },
  { id: 'consumer', label: '消费' },
  { id: 'industrial', label: '工业' },
  { id: 'real_estate', label: '房地产' },
  { id: 'materials', label: '原材料' },
];

const institutions = [
  'Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'BlackRock',
  'Bridgewater', 'Citadel', 'Two Sigma', 'Renaissance'
];

const pushCategories = [
  { id: 'earnings', label: '财报公告' },
  { id: 'fed', label: '美联储讲话' },
  { id: 'analyst', label: '分析师评级' },
  { id: 'macro', label: '宏观数据' },
  { id: 'ipo', label: 'IPO' },
  { id: 'merger', label: '并购' },
];

export default function Preferences() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [followedStocks, setFollowedStocks] = useState([]);
  const [followedSectors, setFollowedSectors] = useState([]);
  const [followedInstitutions, setFollowedInstitutions] = useState([]);
  const [pushCats, setPushCats] = useState([]);
  const [newStock, setNewStock] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const prefs = await base44.entities.UserPreference.filter({ user_email: currentUser.email });
        if (prefs.length > 0) {
          const pref = prefs[0];
          setPreferences(pref);
          setFollowedStocks(pref.followed_stocks || []);
          setFollowedSectors(pref.followed_sectors || []);
          setFollowedInstitutions(pref.followed_institutions || []);
          setPushCats(pref.push_categories || []);
        }
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadData();
  }, []);

  const addStock = () => {
    const stock = newStock.toUpperCase().trim();
    if (stock && !followedStocks.includes(stock)) {
      setFollowedStocks([...followedStocks, stock]);
      setNewStock('');
    }
  };

  const removeStock = (stock) => {
    setFollowedStocks(followedStocks.filter(s => s !== stock));
  };

  const toggleStock = (stock) => {
    if (followedStocks.includes(stock)) {
      removeStock(stock);
    } else {
      setFollowedStocks([...followedStocks, stock]);
    }
  };

  const toggleSector = (sectorId) => {
    if (followedSectors.includes(sectorId)) {
      setFollowedSectors(followedSectors.filter(s => s !== sectorId));
    } else {
      setFollowedSectors([...followedSectors, sectorId]);
    }
  };

  const toggleInstitution = (inst) => {
    if (followedInstitutions.includes(inst)) {
      setFollowedInstitutions(followedInstitutions.filter(i => i !== inst));
    } else {
      setFollowedInstitutions([...followedInstitutions, inst]);
    }
  };

  const togglePushCategory = (catId) => {
    if (pushCats.includes(catId)) {
      setPushCats(pushCats.filter(c => c !== catId));
    } else {
      setPushCats([...pushCats, catId]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const data = {
      user_email: user.email,
      followed_stocks: followedStocks,
      followed_sectors: followedSectors,
      followed_institutions: followedInstitutions,
      push_categories: pushCats,
    };
    
    if (preferences) {
      await base44.entities.UserPreference.update(preferences.id, data);
    } else {
      await base44.entities.UserPreference.create(data);
    }
    
    setIsSaving(false);
    toast.success('偏好设置已保存');
  };

  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </Link>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-400 text-black"
          >
            {isSaving ? (
              <>保存中...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Followed Stocks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                关注股票
              </CardTitle>
              <CardDescription className="text-slate-400">
                选择您想要关注的股票，获取相关快讯和研报推送
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Stock Input */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="输入股票代码，如 AAPL"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addStock()}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <Button onClick={addStock} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Selected Stocks */}
              {followedStocks.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {followedStocks.map((stock) => (
                    <Badge 
                      key={stock} 
                      className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1"
                    >
                      ${stock}
                      <button onClick={() => removeStock(stock)} className="ml-1 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Popular Stocks */}
              <p className="text-xs text-slate-500 mb-2">热门股票</p>
              <div className="flex flex-wrap gap-2">
                {popularStocks.map((stock) => (
                  <button
                    key={stock}
                    onClick={() => toggleStock(stock)}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      followedStocks.includes(stock)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {followedStocks.includes(stock) && <Check className="w-3 h-3 inline mr-1" />}
                    ${stock}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Followed Sectors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                关注行业
              </CardTitle>
              <CardDescription className="text-slate-400">
                选择您感兴趣的行业板块
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {sectors.map((sector) => (
                  <button
                    key={sector.id}
                    onClick={() => toggleSector(sector.id)}
                    className={`p-3 rounded-lg text-sm text-left transition-all ${
                      followedSectors.includes(sector.id)
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {followedSectors.includes(sector.id) && <Check className="w-4 h-4 inline mr-2" />}
                    {sector.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Followed Institutions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                关注机构
              </CardTitle>
              <CardDescription className="text-slate-400">
                选择您想要关注的投行和基金
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {institutions.map((inst) => (
                  <button
                    key={inst}
                    onClick={() => toggleInstitution(inst)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      followedInstitutions.includes(inst)
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {followedInstitutions.includes(inst) && <Check className="w-3 h-3 inline mr-1" />}
                    {inst}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Push Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                推送类型
              </CardTitle>
              <CardDescription className="text-slate-400">
                选择您想要接收推送的快讯类型
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pushCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={cat.id}
                      checked={pushCats.includes(cat.id)}
                      onCheckedChange={() => togglePushCategory(cat.id)}
                      className="border-slate-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                    <Label htmlFor={cat.id} className="text-sm text-slate-300 cursor-pointer">
                      {cat.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}