import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight as ChevronRightIcon, FileDown, Plus, Trash2, Loader2 } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface SlideshowDisplayProps {
  result: any;
  currentSlide: number;
  setCurrentSlide: React.Dispatch<React.SetStateAction<number>>;
  setResult: React.Dispatch<React.SetStateAction<any>>;
  handleDownloadPDF: () => Promise<void>;
  isDownloadingPDF: boolean;
  slideshowTheme: 'light' | 'dark' | 'brand';
  setSlideshowTheme: React.Dispatch<React.SetStateAction<'light' | 'dark' | 'brand'>>;
  slideshowOverlay: number;
  setSlideshowOverlay: React.Dispatch<React.SetStateAction<number>>;
  slideshowFont: 'sans' | 'serif';
  setSlideshowFont: React.Dispatch<React.SetStateAction<'sans' | 'serif'>>;
  brandGuidelines: any;
  generateImage: (prompt: string, guidelines: any, aspectRatio?: string, model?: string, assets?: any[]) => Promise<any>;
  assets?: any[];
  cn: (...inputs: any[]) => string;
}

export const SlideshowDisplay: React.FC<SlideshowDisplayProps> = ({
  result,
  currentSlide,
  setCurrentSlide,
  setResult,
  handleDownloadPDF,
  isDownloadingPDF,
  slideshowTheme,
  setSlideshowTheme,
  slideshowOverlay,
  setSlideshowOverlay,
  slideshowFont,
  setSlideshowFont,
  brandGuidelines,
  generateImage,
  assets,
  cn
}) => {
  return (
    <div className="w-full max-w-5xl flex flex-col gap-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-30 text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Slide {currentSlide + 1} of {result.data.length}
          </span>
          <button 
            onClick={() => setCurrentSlide(prev => Math.min(result.data.length - 1, prev + 1))}
            disabled={currentSlide === result.data.length - 1}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-30 text-slate-600 dark:text-slate-300"
          >
            <ChevronRightIcon size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="btn-secondary text-[10px] py-2 flex items-center gap-2"
          >
            {isDownloadingPDF ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileDown size={14} />
            )}
            {isDownloadingPDF ? 'GENERATING PDF...' : 'DOWNLOAD PDF'}
          </button>
          <button 
            onClick={() => {
              const newSlides = [...result.data];
              newSlides.splice(currentSlide + 1, 0, { title: 'New Slide', content: ['Point 1'], imagePrompt: 'Corporate background' });
              setResult({ ...result, data: newSlides });
              setCurrentSlide(currentSlide + 1);
            }}
            className="btn-secondary text-[10px] py-2"
          >
            <Plus size={14} /> ADD SLIDE
          </button>
          <button 
            onClick={() => {
              setResult(null);
              setCurrentSlide(0);
            }}
            className="btn-secondary text-[10px] py-2 text-red-500 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 size={14} /> RESET
          </button>
          <button 
            onClick={() => {
              if (result.data.length <= 1) return;
              const newSlides = result.data.filter((_: any, i: number) => i !== currentSlide);
              setResult({ ...result, data: newSlides });
              setCurrentSlide(Math.max(0, currentSlide - 1));
            }}
            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="relative aspect-video bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {/* Slide Background Image */}
            {result.data[currentSlide].image ? (
              <div className="absolute inset-0 z-0">
                <img 
                  src={result.data[currentSlide].image} 
                  alt="Slide Background" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div 
                  className={cn(
                    "absolute inset-0 transition-colors duration-500",
                    slideshowTheme === 'dark' ? 'bg-slate-900' : 
                    slideshowTheme === 'brand' ? 'bg-brand-primary' : 'bg-white'
                  )} 
                  style={{ opacity: slideshowOverlay }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                  <Loader2 className="animate-spin" size={32} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Generating Visual...</span>
                </div>
              </div>
            )}

            {/* Slide Content */}
            <div className={cn(
              "absolute inset-0 p-16 flex flex-col justify-center space-y-8 z-10",
              slideshowFont === 'serif' ? 'font-serif' : 'font-sans',
              slideshowTheme === 'light' ? 'text-slate-900' : 'text-white'
            )}>
              <div className="space-y-4">
                <div className={cn(
                  "h-1 w-24",
                  slideshowTheme === 'brand' ? 'bg-white' : 'bg-brand-primary'
                )} />
                <div className="flex items-center justify-between gap-4">
                  <input 
                    type="text"
                    value={result.data[currentSlide].title}
                    onChange={(e) => {
                      const newSlides = [...result.data];
                      newSlides[currentSlide].title = e.target.value;
                      setResult({ ...result, data: newSlides });
                    }}
                    className={cn(
                      "text-5xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full",
                      slideshowTheme === 'light' ? 'text-slate-900' : 'text-white'
                    )}
                  />
                  <button 
                    onClick={async () => {
                      const newSlides = [...result.data];
                      newSlides[currentSlide].image = undefined;
                      setResult({ ...result, data: newSlides });
                      try {
                        const selectedAssets = assets?.filter(a => a.selected) || [];
                        const imageResult = await generateImage(newSlides[currentSlide].imagePrompt, brandGuidelines, "16:9", undefined, selectedAssets);
                        newSlides[currentSlide].image = imageResult.url;
                        newSlides[currentSlide].groundingMetadata = imageResult.groundingMetadata;
                        setResult({ ...result, data: [...newSlides] });
                      } catch (e) {
                        console.error("Failed to regenerate slide image:", e);
                      }
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/50 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Regenerate Visual"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                {result.data[currentSlide].content.map((point: string, pIdx: number) => (
                  <div key={pIdx} className="flex items-start gap-6 group/point">
                    <div className={cn(
                      "mt-3 w-3 h-3 rounded-full shrink-0",
                      slideshowTheme === 'brand' ? 'bg-white' : 'bg-brand-secondary'
                    )} />
                    <div className="flex-1 flex items-center gap-4">
                      <textarea 
                        value={point}
                        onChange={(e) => {
                          const newSlides = [...result.data];
                          newSlides[currentSlide].content[pIdx] = e.target.value;
                          setResult({ ...result, data: newSlides });
                        }}
                        className={cn(
                          "text-2xl leading-relaxed bg-transparent border-none focus:outline-none focus:ring-0 w-full resize-none h-auto",
                          slideshowTheme === 'light' ? 'text-slate-700' : 'text-white/90'
                        )}
                        rows={1}
                      />
                      <button 
                        onClick={() => {
                          const newSlides = [...result.data];
                          newSlides[currentSlide].content = newSlides[currentSlide].content.filter((_: any, i: number) => i !== pIdx);
                          setResult({ ...result, data: newSlides });
                        }}
                        className="opacity-0 group-hover/point:opacity-100 p-1 text-red-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newSlides = [...result.data];
                    newSlides[currentSlide].content.push('New point');
                    setResult({ ...result, data: newSlides });
                  }}
                  className={cn(
                    "flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity",
                    slideshowTheme === 'light' ? 'text-brand-primary' : 'text-white/60 hover:text-white'
                  )}
                >
                  <Plus size={16} /> ADD POINT
                </button>
              </div>
            </div>

            {/* Brand Elements */}
            <div className="absolute top-8 right-8 z-20 opacity-80 origin-top-right">
              <BrandLogo customLogo={brandGuidelines.logo} brandName={brandGuidelines.name} noReferrer={false} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-brand-primary via-brand-secondary to-slate-400 z-20" />
            
            {/* Background Accents */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl" />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
