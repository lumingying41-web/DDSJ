import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Plus, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from '@/components/community/PostCard';
import CreatePostDialog from '@/components/community/CreatePostDialog';

export default function Community() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['posts', activeTab],
    queryFn: async () => {
      let allPosts = await base44.entities.Post.list('-created_date', 100);
      
      if (activeTab === 'following' && user) {
        const follows = await base44.entities.Follow.filter({ follower_email: user.email });
        const followingEmails = follows.map(f => f.following_email);
        allPosts = allPosts.filter(p => followingEmails.includes(p.user_email));
      }
      
      return allPosts;
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      return await base44.entities.Post.create({
        ...postData,
        user_email: user.email,
        user_name: user.display_name || user.full_name || '用户',
        user_avatar: user.avatar_url || '',
        likes_count: 0,
        comments_count: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      setShowCreatePost(false);
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center px-4">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg text-slate-400 mb-4">登录后参与讨论</h3>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-amber-500 hover:bg-amber-400 text-black">
            立即登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-amber-400" />
              讨论区
            </h1>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => setShowCreatePost(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                发帖
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                <TrendingUp className="w-4 h-4 mr-2" />
                全部
              </TabsTrigger>
              <TabsTrigger value="following" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                <Users className="w-4 h-4 mr-2" />
                关注
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {isLoading ? (
            Array(5).fill(0).map((_, idx) => (
              <div key={idx} className="bg-[#0F1A2E]/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full bg-slate-700" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-slate-700" />
                    <Skeleton className="h-3 w-16 bg-slate-700" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full bg-slate-700" />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg text-slate-400 mb-2">暂无帖子</h3>
              <p className="text-sm text-slate-500">快来发布第一条帖子吧</p>
            </div>
          ) : (
            <AnimatePresence>
              {posts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <PostCard post={post} currentUser={user} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={(data) => createPostMutation.mutate(data)}
      />
    </div>
  );
}