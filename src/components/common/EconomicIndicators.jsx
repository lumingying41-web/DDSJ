import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EconomicIndicators() {
  const [indicators, setIndicators] = useState([
    { id: 'GDP', name: 'GDP增长率', value: 2.9, unit: '%', date: '2024-Q3' },
    { id: 'CPI', name: 'CPI通胀率', value: 3.2, unit: '%', date: '2024-11' },
    { id: 'UNRATE', name: '失业率', value: 3.7, unit: '%', date: '2024-11' },
    { id: 'DFF', name: '联邦基金利率', value: 5.33, unit: '%', date: '2024-12' },
    { id: 'T10Y', name: '10年期国债', value: 4.25, unit: '%', date: '2024-12' },
    { id: 'UMCSENT', name: '消费者信心', value: 69.4, unit: '指数', date: '2024-11' },
  ]);

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const response = await base44.functions.invoke('getEconomicData', {});
        if (response.data && response.data.indicators && response.data.indicators.length > 0) {
          setIndicators(response.data.indicators);
        }
      } catch (error) {
        console.error('Failed to fetch economic indicators:', error);
      }
    };

    fetchIndicators();
    const interval = setInterval(fetchIndicators, 300000); // 每5分钟更新

    return () => clearInterval(interval);
  }, []);

  if (indicators.length === 0) return null;

  return (
    <Card className="bg-slate-800/40 border-slate-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          宏观经济指标
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {indicators.map((indicator, idx) => (
            <motion.div
              key={indicator.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-900/50 rounded-lg p-3"
            >
              <div className="text-xs text-slate-400 mb-1">{indicator.name}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">
                  {indicator.value.toFixed(2)}
                </span>
                {indicator.unit && (
                  <span className="text-xs text-slate-500">{indicator.unit}</span>
                )}
              </div>
              <div className="text-[10px] text-slate-600 mt-1">
                {indicator.date}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-[10px] text-slate-600 mt-3 text-center">
          数据来源：FRED (美联储经济数据)
        </div>
      </CardContent>
    </Card>
  );
}