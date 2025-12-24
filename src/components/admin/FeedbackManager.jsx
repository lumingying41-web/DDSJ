import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MessageCircle, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const typeLabels = {
  bug: 'Bug反馈',
  feature: '功能建议',
  question: '使用咨询',
  other: '其他'
};

const statusLabels = {
  pending: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭'
};

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

export default function FeedbackManager() {
  const queryClient = useQueryClient();
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [reply, setReply] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Feedback.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      setSelectedFeedback(null);
      setReply('');
      toast.success('更新成功');
    },
  });

  const handleReply = (feedback) => {
    setSelectedFeedback(feedback);
    setReply(feedback.admin_reply || '');
    setNewStatus(feedback.status);
  };

  const handleUpdate = () => {
    if (!selectedFeedback) return;

    updateMutation.mutate({
      id: selectedFeedback.id,
      data: {
        admin_reply: reply,
        status: newStatus
      }
    });
  };

  if (isLoading) {
    return <div className="text-slate-400">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-amber-400" />
          用户反馈 ({feedbacks.length})
        </h3>
      </div>

      <div className="grid gap-4">
        {feedbacks.map((feedback) => (
          <Card key={feedback.id} className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-white text-base">
                      {feedback.subject || '无主题'}
                    </CardTitle>
                    <Badge className={statusColors[feedback.status]}>
                      {statusLabels[feedback.status]}
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {typeLabels[feedback.type]}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">
                    {feedback.user_name} ({feedback.user_email}) · {format(new Date(feedback.created_date), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{feedback.content}</p>
                </div>

                {feedback.admin_reply && (
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1">管理员回复：</p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{feedback.admin_reply}</p>
                  </div>
                )}

                {selectedFeedback?.id === feedback.id ? (
                  <div className="space-y-3 pt-2 border-t border-slate-700/50">
                    <div>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="pending">待处理</SelectItem>
                          <SelectItem value="in_progress">处理中</SelectItem>
                          <SelectItem value="resolved">已解决</SelectItem>
                          <SelectItem value="closed">已关闭</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="输入回复内容..."
                      className="bg-slate-900/50 border-slate-700 text-white"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdate}
                        className="bg-amber-500 hover:bg-amber-400 text-black"
                        disabled={updateMutation.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {updateMutation.isPending ? '提交中...' : '提交回复'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedFeedback(null)}
                        className="border-slate-700 text-slate-400"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReply(feedback)}
                    className="border-slate-700 text-slate-400 hover:text-white"
                  >
                    回复
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {feedbacks.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">暂无用户反馈</p>
          </div>
        )}
      </div>
    </div>
  );
}