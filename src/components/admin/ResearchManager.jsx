import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function ResearchManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    stock_symbol: '',
    stock_name: '',
    category: 'earnings',
    rating: 'hold',
    target_price: '',
    author: '',
    is_premium: true,
    published_at: new Date().toISOString()
  });

  const queryClient = useQueryClient();

  const { data: researchList = [] } = useQuery({
    queryKey: ['admin-research'],
    queryFn: () => base44.entities.Research.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Research.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-research']);
      resetForm();
      toast.success('研报创建成功');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Research.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-research']);
      resetForm();
      toast.success('研报更新成功');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Research.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-research']);
      toast.success('研报删除成功');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      stock_symbol: '',
      stock_name: '',
      category: 'earnings',
      rating: 'hold',
      target_price: '',
      author: '',
      is_premium: true,
      published_at: new Date().toISOString()
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      target_price: formData.target_price ? parseFloat(formData.target_price) : null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (research) => {
    setFormData({
      title: research.title,
      summary: research.summary || '',
      content: research.content || '',
      stock_symbol: research.stock_symbol,
      stock_name: research.stock_name || '',
      category: research.category,
      rating: research.rating || 'hold',
      target_price: research.target_price?.toString() || '',
      author: research.author || '',
      is_premium: research.is_premium,
      published_at: research.published_at
    });
    setEditingId(research.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">研报列表</h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-amber-500 hover:bg-amber-400 text-black">
          <Plus className="w-4 h-4 mr-2" />
          {isAdding ? '取消' : '添加研报'}
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
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="股票代码（如：AAPL）"
              value={formData.stock_symbol}
              onChange={(e) => setFormData({...formData, stock_symbol: e.target.value})}
              required
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Input
              placeholder="股票名称（如：苹果）"
              value={formData.stock_name}
              onChange={(e) => setFormData({...formData, stock_name: e.target.value})}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <Textarea
            placeholder="完整内容（支持 Markdown）"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white min-h-[200px]"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="earnings">财报解读</SelectItem>
                <SelectItem value="valuation">估值分析</SelectItem>
                <SelectItem value="industry">行业分析</SelectItem>
                <SelectItem value="technical">技术分析</SelectItem>
                <SelectItem value="deep_dive">深度研究</SelectItem>
              </SelectContent>
            </Select>

            <Select value={formData.rating} onValueChange={(v) => setFormData({...formData, rating: v})}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="评级" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="strong_buy">强烈买入</SelectItem>
                <SelectItem value="buy">买入</SelectItem>
                <SelectItem value="hold">持有</SelectItem>
                <SelectItem value="sell">卖出</SelectItem>
                <SelectItem value="strong_sell">强烈卖出</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="目标价"
              type="number"
              step="0.01"
              value={formData.target_price}
              onChange={(e) => setFormData({...formData, target_price: e.target.value})}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Input
              placeholder="作者"
              value={formData.author}
              onChange={(e) => setFormData({...formData, author: e.target.value})}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="research_premium"
              checked={formData.is_premium}
              onChange={(e) => setFormData({...formData, is_premium: e.target.checked})}
              className="w-4 h-4"
            />
            <label htmlFor="research_premium" className="text-sm text-slate-400">付费内容</label>
          </div>

          <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black">
            {editingId ? '更新研报' : '创建研报'}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {researchList.map((research) => (
          <div key={research.id} className="bg-slate-800/50 rounded-lg p-4 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400 font-mono text-sm">{research.stock_symbol}</span>
                <span className="text-slate-500 text-sm">{research.stock_name}</span>
              </div>
              <h3 className="text-white font-medium mb-1">{research.title}</h3>
              <p className="text-sm text-slate-400 mb-2">{research.summary}</p>
              <div className="flex gap-2 text-xs text-slate-500">
                <span>{research.category}</span>
                <span>•</span>
                <span>{research.rating}</span>
                {research.target_price && (
                  <>
                    <span>•</span>
                    <span>目标价: ${research.target_price}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(research)}
                className="text-slate-400 hover:text-white"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(research.id)}
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