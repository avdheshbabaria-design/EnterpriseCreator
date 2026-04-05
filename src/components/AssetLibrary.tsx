import React, { useRef, useState } from 'react';
import { Upload, Trash2, CheckCircle2, Image as ImageIcon, Download, Loader2, Sparkles } from 'lucide-react';
import { analyzeAsset, type AssetAnalysis } from '../services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Asset {
  id: string;
  name: string;
  data: string; // base64
  type: 'image';
  selected: boolean;
  analysis?: AssetAnalysis;
}

interface AssetLibraryProps {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  onClose: () => void;
}

export const AssetLibrary = ({ assets, setAssets, onClose }: AssetLibraryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const tempId = Math.random().toString(36).substring(7);
        
        const newAsset: Asset = {
          id: tempId,
          name: file.name,
          data: base64Data,
          type: 'image',
          selected: true
        };
        setAssets(prev => [...prev, newAsset]);

        try {
          const analysis = await analyzeAsset(base64Data);
          setAssets(prev => prev.map(a => a.id === tempId ? { ...a, analysis } : a));
        } catch (error) {
          console.error("Failed to analyze asset:", error);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleSelect = (id: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const downloadAsset = (asset: Asset) => {
    const link = document.createElement('a');
    link.href = asset.data;
    link.download = asset.name;
    link.click();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Asset Library</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Upload and manage brand assets. Selected assets will influence the generation of creatives.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <Upload size={18} />
              Upload
            </button>
            <button 
              onClick={onClose}
              className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-sm font-medium hover:opacity-90 transition-all"
            >
              Done
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
            <ImageIcon size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No assets uploaded yet</p>
            <p className="text-sm mt-1">Upload images to use them as context for your generations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {assets.map(asset => (
              <div 
                key={asset.id} 
                className={cn(
                  "group relative rounded-xl overflow-hidden border-2 transition-all duration-200 bg-white dark:bg-slate-900",
                  asset.selected 
                    ? "border-slate-900 dark:border-white shadow-md" 
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div 
                  className="aspect-square w-full cursor-pointer relative"
                  onClick={() => toggleSelect(asset.id)}
                >
                  <img 
                    src={asset.data} 
                    alt={asset.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className={cn(
                    "absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-center p-4 text-center",
                    asset.selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    {asset.selected ? (
                      <CheckCircle2 
                        size={32} 
                        className="text-white scale-100 transition-transform mb-2" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-white/50 mb-2" />
                    )}
                    
                    {asset.analysis ? (
                      <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">{asset.analysis.theme}</p>
                        <p className="text-[9px] text-white/70 italic">{asset.analysis.mood}</p>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          {asset.analysis.colors.slice(0, 3).map((c, i) => (
                            <div key={i} className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={16} className="text-white/50 animate-spin" />
                        <span className="text-[8px] font-bold text-white/50 uppercase tracking-tighter">Analyzing Style...</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate pr-2" title={asset.name}>
                    {asset.name}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => downloadAsset(asset)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    <button 
                      onClick={() => deleteAsset(asset.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
