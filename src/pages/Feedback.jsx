import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Feedback() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('请输入反馈内容');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.Feedback.create({
        user_email: user.email,
        user_name: user.full_name || '用户',
        type: 'question',
        subject: '用户反馈',
        content,
        status: 'pending'
      });

      toast.success('反馈提交成功，我们会尽快处理！');
      navigate(createPageUrl('Profile'));
    } catch (error) {
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Profile'))}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-white">联系客服</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">反馈与建议</h2>
              <p className="text-sm text-slate-400">我们会认真处理您的每一条反馈</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300">详细内容 *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请详细描述您的问题或建议..."
                className="bg-slate-800/30 border-slate-700/50 min-h-[150px]"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-black"
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  提交反馈
                </>
              )}
            </Button>
          </form>
        </motion.div>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>工作时间：周一至周五 9:00-18:00</p>
          <p className="mt-1">我们会在24小时内回复您的反馈</p>
        </div>
      </div>
    </div>
  );
}