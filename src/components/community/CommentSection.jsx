import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";

export default function CommentSection({ postId, currentUser, onCommentAdded }) {
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => base44.entities.Comment.filter({ post_id: postId }, '-created_date', 50),
  });

  const commentMutation = useMutation({
    mutationFn: async (commentData) => {
      await base44.entities.Comment.create({
        ...commentData,
        post_id: postId,
        user_email: currentUser.email,
        user_name: currentUser.display_name || currentUser.full_name || '用户',
        user_avatar: currentUser.avatar_url || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
      setComment('');
      setReplyTo(null);
      if (onCommentAdded) onCommentAdded();
    },
  });

  const handleSubmit = () => {
    if (!comment.trim()) return;
    
    commentMutation.mutate({
      content: comment,
      reply_to_id: replyTo?.id,
      reply_to_name: replyTo?.user_name,
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800/50">
      {/* Comment Input */}
      <div className="mb-4">
        {replyTo && (
          <div className="text-xs text-slate-400 mb-2">
            回复 @{replyTo.user_name}
            <button 
              onClick={() => setReplyTo(null)}
              className="ml-2 text-amber-400 hover:text-amber-300"
            >
              取消
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder="写下你的评论..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-slate-800/50 border-slate-700 text-white text-sm min-h-[60px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={!comment.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-black"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {c.user_avatar ? (
                <img src={c.user_avatar} alt={c.user_name} className="w-full h-full object-cover rounded-full" />
              ) : (
                c.user_name?.[0] || 'U'
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white">{c.user_name}</span>
                <span className="text-xs text-slate-500">
                  {formatDistanceToNow(new Date(c.created_date), { addSuffix: true, locale: zhCN })}
                </span>
              </div>
              <p className="text-sm text-slate-300">
                {c.reply_to_name && (
                  <span className="text-amber-400 mr-1">@{c.reply_to_name}</span>
                )}
                {c.content}
              </p>
              <button
                onClick={() => setReplyTo(c)}
                className="text-xs text-slate-500 hover:text-amber-400 mt-1"
              >
                回复
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}