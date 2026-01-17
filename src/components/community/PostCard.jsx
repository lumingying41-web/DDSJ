import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, MoreHorizontal, UserPlus, UserCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import CommentSection from './CommentSection';

export default function PostCard({ post, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  const { data: liked = false } = useQuery({
    queryKey: ['like', post.id, currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return false;
      const likes = await base44.entities.Like.filter({ 
        post_id: post.id, 
        user_email: currentUser.email 
      });
      return likes.length > 0;
    },
    enabled: !!currentUser,
  });

  const { data: following = false } = useQuery({
    queryKey: ['follow', post.user_email, currentUser?.email],
    queryFn: async () => {
      if (!currentUser || post.user_email === currentUser.email) return false;
      const follows = await base44.entities.Follow.filter({ 
        follower_email: currentUser.email,
        following_email: post.user_email
      });
      return follows.length > 0;
    },
    enabled: !!currentUser && post.user_email !== currentUser?.email,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (liked) {
        const likes = await base44.entities.Like.filter({ 
          post_id: post.id, 
          user_email: currentUser.email 
        });
        if (likes.length > 0) {
          await base44.entities.Like.delete(likes[0].id);
          await base44.entities.Post.update(post.id, { 
            likes_count: Math.max(0, post.likes_count - 1) 
          });
        }
      } else {
        await base44.entities.Like.create({ 
          post_id: post.id, 
          user_email: currentUser.email 
        });
        await base44.entities.Post.update(post.id, { 
          likes_count: post.likes_count + 1 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['like', post.id]);
      queryClient.invalidateQueries(['posts']);
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (following) {
        const follows = await base44.entities.Follow.filter({ 
          follower_email: currentUser.email,
          following_email: post.user_email
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
      } else {
        await base44.entities.Follow.create({ 
          follower_email: currentUser.email,
          following_email: post.user_email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['follow', post.user_email]);
    },
  });

  const repostMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Post.create({
        user_email: currentUser.email,
        user_name: currentUser.display_name || currentUser.full_name || '用户',
        user_avatar: currentUser.avatar_url || '',
        content: `转发了 @${post.user_name} 的帖子`,
        is_repost: true,
        original_post_id: post.id,
        likes_count: 0,
        comments_count: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  return (
    <div className="bg-[#0F1A2E]/80 rounded-xl p-4 border border-slate-800/50">
      {/* User Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-bold">
            {post.user_avatar ? (
              <img src={post.user_avatar} alt={post.user_name} className="w-full h-full object-cover rounded-full" />
            ) : (
              post.user_name?.[0] || 'U'
            )}
          </Avatar>
          <div>
            <h3 className="text-sm font-medium text-white">{post.user_name}</h3>
            <p className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: zhCN })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentUser && post.user_email !== currentUser.email && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => followMutation.mutate()}
              className={following ? 'text-amber-400' : 'text-slate-400'}
            >
              {following ? (
                <>
                  <UserCheck className="w-4 h-4 mr-1" />
                  已关注
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1" />
                  关注
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>
        
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {post.images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt="" 
                className="rounded-lg w-full h-48 object-cover"
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pt-3 border-t border-slate-800/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => currentUser && likeMutation.mutate()}
          disabled={!currentUser}
          className={`text-slate-400 hover:text-red-400 ${liked ? 'text-red-400' : ''}`}
        >
          <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
          {post.likes_count || 0}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="text-slate-400 hover:text-blue-400"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          {post.comments_count || 0}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => currentUser && repostMutation.mutate()}
          disabled={!currentUser}
          className="text-slate-400 hover:text-emerald-400"
        >
          <Share2 className="w-4 h-4 mr-1" />
          转发
        </Button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection 
          postId={post.id} 
          currentUser={currentUser}
          onCommentAdded={() => {
            base44.entities.Post.update(post.id, { 
              comments_count: post.comments_count + 1 
            });
            queryClient.invalidateQueries(['posts']);
          }}
        />
      )}
    </div>
  );
}