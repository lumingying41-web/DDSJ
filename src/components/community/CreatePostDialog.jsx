import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CreatePostDialog({ open, onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { data } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(data.file_url);
      }
      setImages([...images, ...uploadedUrls]);
    } catch (e) {
      toast.error('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error('请输入内容');
      return;
    }

    onSubmit({ content, images: images.length > 0 ? images : undefined });
    setContent('');
    setImages([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>发布帖子</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="分享你的想法..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-slate-900 border-slate-700 text-white min-h-[150px]"
          />

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img} alt="" className="rounded-lg w-full h-32 object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-slate-400 hover:text-white"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4 mr-2" />
                    )}
                    添加图片
                  </span>
                </Button>
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-black"
              >
                发布
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}