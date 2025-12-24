import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function NewsManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'macro',
    sentiment: 'neutral',
    importance: 'medium',
    source: '',
    source_url: '',
    related_stocks: '',
    is_premium: false,
    published_at: new Date().toISOString()
  });

  const queryClient = useQueryClient();

  const { data: newsList = [], isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => base44.entities.NewsFlash.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NewsFlash.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-news']);
      resetForm();
      toast.success('快讯创建成功');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NewsFlash.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-news']);
      resetForm();
      toast.success('快讯更新成功');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NewsFlash.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-news']);
      toast.success('快讯删除成功');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      category: 'macro',
      sentiment: 'neutral',
      importance: 'medium',
      source: '',
      source_url: '',
      related_stocks: '',
      is_premium: false,
      published_at: new Date().toISOString()
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      related_stocks: formData.related_stocks ? formData.related_stocks.split(',').map(s => s.trim()) : [],
      key_points: []
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (news) => {
    setFormData({
      title: news.title,
      summary: news.summary,
      content: news.content || '',
      category: news.category,
      sentiment: news.sentiment,
      importance: news.importance,
      source: news.source || '',
      source_url: news.source_url || '',
      related_stocks: news.related_stocks?.join(', ') || '',
      is_premium: news.is_premium,
      published_at: news.published_at
    });
    setEditingId(news.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">快讯列表</h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-amber-500 hover:bg-amber-400 text-black">
          <Plus className="w-4 h-4 mr-2" />
          {isAdding ? '取消' : '添加快讯'}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-xl p-6 space-y-4">
          <Input
            placeholder="标题"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            className="bg-slate-900 border-slate-700 text-white"
          />
          <Textarea
            placeholder="完整内容"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white min-h-[120px]"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="comprehensive">综合</SelectItem>
                <SelectItem value="earnings">财报</SelectItem>
                <SelectItem value="fed">美联储</SelectItem>
                <SelectItem value="analyst">分析师</SelectItem>
                <SelectItem value="macro">宏观</SelectItem>
                <SelectItem value="ipo">IPO</SelectItem>
                <SelectItem value="risk_warning">风险预警</SelectItem>
                <SelectItem value="merger">并购</SelectItem>
                <SelectItem value="policy">政策</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>

            <Select value={formData.sentiment} onValueChange={(v) => setFormData({...formData, sentiment: v})}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="情绪" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="bullish">利好</SelectItem>
                <SelectItem value="bearish">利空</SelectItem>
                <SelectItem value="neutral">中性</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="来源"
            value={formData.source}
            onChange={(e) => setFormData({...formData, source: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white"
          />
          <Input
            placeholder="来源链接"
            value={formData.source_url}
            onChange={(e) => setFormData({...formData, source_url: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white"
          />
          <Input
            placeholder="相关股票（用逗号分隔，如：AAPL, MSFT）"
            value={formData.related_stocks}
            onChange={(e) => setFormData({...formData, related_stocks: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_premium"
              checked={formData.is_premium}
              onChange={(e) => setFormData({...formData, is_premium: e.target.checked})}
              className="w-4 h-4"
            />
            <label htmlFor="is_premium" className="text-sm text-slate-400">付费内容</label>
          </div>

          <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black">
            {editingId ? '更新快讯' : '创建快讯'}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {newsList.map((news) => (
          <div key={news.id} className="bg-slate-800/50 rounded-lg p-4 flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">{news.title}</h3>
              <p className="text-sm text-slate-400 mb-2">{news.summary}</p>
              <div className="flex gap-2 text-xs text-slate-500">
                <span>{news.category}</span>
                <span>•</span>
                <span>{news.sentiment}</span>
                <span>•</span>
                <span>{new Date(news.published_at).toLocaleString('zh-CN')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(news)}
                className="text-slate-400 hover:text-white"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(news.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}