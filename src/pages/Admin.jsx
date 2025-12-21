import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, FileText, Zap, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NewsManager from '@/components/admin/NewsManager';
import ResearchManager from '@/components/admin/ResearchManager';
import ReportManager from '@/components/admin/ReportManager';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  // 检查是否为管理员
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center px-4">
        <Alert className="max-w-md bg-red-500/10 border-red-500/20">
          <Shield className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400 ml-2">
            您没有权限访问管理后台
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D18] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-amber-400" />
          <h1 className="text-3xl font-bold text-white">内容管理</h1>
        </div>

        <Tabs defaultValue="news" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="news" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Zap className="w-4 h-4 mr-2" />
              快讯管理
            </TabsTrigger>
            <TabsTrigger value="research" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <FileText className="w-4 h-4 mr-2" />
              研报管理
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Building2 className="w-4 h-4 mr-2" />
              机构报告管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="news">
            <NewsManager />
          </TabsContent>

          <TabsContent value="research">
            <ResearchManager />
          </TabsContent>

          <TabsContent value="reports">
            <ReportManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}