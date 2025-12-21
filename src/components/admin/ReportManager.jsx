import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    institution: '',
    institution_type: 'investment_bank',
    report_type: 'market_outlook',
    related_stocks: '',
    file_url: '',
    is_premium: true,
    published_at: new Date().toISOString()
  });

  const queryClient = useQueryClient();

  const { data: reportsList = [] } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => base44.entities.InstitutionReport.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InstitutionReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reports']);
      resetForm();
      toast.success('报告创建成功');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InstitutionReport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reports']);
      resetForm();
      toast.success('报告更新成功');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InstitutionReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reports']);
      toast.success('报告删除成功');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      institution: '',
      institution_type: 'investment_bank',
      report_type: 'market_outlook',
      related_stocks: '',
      file_url: '',
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
      related_stocks: formData.related_stocks ? formData.related_stocks.split(',').map(s => s.trim()) : [],
      key_points: []
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (report) => {
    setFormData({
      title: report.title,
      summary: report.summary || '',
      content: report.content || '',
      institution: report.institution,
      institution_type: report.institution_type,
      report_type: report.report_type || 'market_outlook',
      related_stocks: report.related_stocks?.join(', ') || '',
      file_url: report.file_url || '',
      is_premium: report.is_premium,
      published_at: report.published_at
    });
    setEditingId(report.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">机构报告列表</h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-amber-500 hover:bg-amber-400 text-black">
          <Plus className="w-4 h-4 mr-2" />
          {isAdding ? '取消' : '添加报告'}
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
              placeholder="机构名称"
              value={formData.institution}
              onChange={(e) => setFormData({...formData, institution: e.target.value})}
              required
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Select value={formData.institution_type} onValueChange={(v) => setFormData({...formData, institution_type: v})}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="机构类型" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="investment_bank">投资银行</SelectItem>
                <SelectItem value="hedge_fund">对冲基金</SelectItem>
                <SelectItem value="asset_manager">资管公司</SelectItem>
                <SelectItem value="research_firm">研究机构</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="摘要"
            value={formData.summary}
            onChange={(e) => setFormData({...formData, summary: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white"
          />
          <Textarea
            placeholder="完整内容"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white min-h-[200px]"
          />
          
          <Select value={formData.report_type} onValueChange={(v) => setFormData({...formData, report_type: v})}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="报告类型" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="market_outlook">市场展望</SelectItem>
              <SelectItem value="sector_analysis">行业分析</SelectItem>
              <SelectItem value="stock_pick">选股建议</SelectItem>
              <SelectItem value="macro_research">宏观研究</SelectItem>
              <SelectItem value="strategy">投资策略</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="相关股票（用逗号分隔，如：AAPL, MSFT）"
            value={formData.related_stocks}
            onChange={(e) => setFormData({...formData, related_stocks: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white"
          />
          
          <Input
            placeholder="PDF 文件链接（可选）"
            value={formData.file_url}
            onChange={(e) => setFormData({...formData, file_url: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="report_premium"
              checked={formData.is_premium}
              onChange={(e) => setFormData({...formData, is_premium: e.target.checked})}
              className="w-4 h-4"
            />
            <label htmlFor="report_premium" className="text-sm text-slate-400">付费内容</label>
          </div>

          <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black">
            {editingId ? '更新报告' : '创建报告'}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {reportsList.map((report) => (
          <div key={report.id} className="bg-slate-800/50 rounded-lg p-4 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400 font-medium text-sm">{report.institution}</span>
                <span className="text-slate-500 text-xs">{report.institution_type}</span>
              </div>
              <h3 className="text-white font-medium mb-1">{report.title}</h3>
              <p className="text-sm text-slate-400 mb-2">{report.summary}</p>
              <div className="flex gap-2 text-xs text-slate-500">
                <span>{report.report_type}</span>
                {report.related_stocks?.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{report.related_stocks.join(', ')}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(report)}
                className="text-slate-400 hover:text-white"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(report.id)}
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