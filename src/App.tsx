import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileText, 
  Send, 
  Download, 
  Loader2, 
  ChevronRight,
  Sparkles,
  History,
  Settings,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Presentation,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Globe,
  Plus,
  Trash2,
  Edit2,
  FileDown,
  Eye,
  EyeOff,
  Key,
  Music,
  Camera,
  Target,
  Settings2,
  SlidersHorizontal,
  Moon,
  Sun
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from './components/BrandLogo';
import { GroundingSources } from './components/GroundingSources';
import { SlideshowDisplay } from './components/SlideshowDisplay';
import { AssetLibrary, type Asset } from './components/AssetLibrary';
import { GENERIC_GEMS, Gem, generateCreative, pollVideo, BrandGuidelines, generateImage, generateTTS, setCustomApiKey, IMAGE_MODELS, VIDEO_MODELS, getQuotaErrorMessage, generateBrandIdentity } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HistoryItem {
  id: string;
  gemId: string;
  prompt: string;
  result: any;
  timestamp: number;
}

interface BrandSetupProps {
  onComplete: (guidelines: BrandGuidelines) => void;
}

const BrandSetup = ({ onComplete }: BrandSetupProps) => {
  const [description, setDescription] = useState('');
  const [initLogo, setInitLogo] = useState('');
  const [initColors, setInitColors] = useState('');
  const [initTone, setInitTone] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInitLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const guidelines = await generateBrandIdentity(description, {
        logo: initLogo || undefined,
        colors: initColors || undefined,
        tone: initTone || undefined
      });
      onComplete(guidelines);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate brand identity. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex bg-white dark:bg-slate-950 overflow-hidden">
      {/* Left Side - Premium Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-end p-16">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
            alt="Abstract premium background" 
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-lg">
          <div className="w-12 h-12 bg-white text-slate-900 flex items-center justify-center mb-8 rounded-sm">
            <div className="w-4 h-4 bg-slate-900 rounded-full" />
          </div>
          <h1 className="text-4xl font-light text-white tracking-tight mb-4 leading-tight">
            Enterprise <br/><span className="font-bold">Creative Suite</span>
          </h1>
          <p className="text-base text-slate-400 font-light leading-relaxed">
            Powered by Gemini. Define your brand's strategic parameters to unlock tailored, high-impact campaigns and visual assets.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white dark:bg-slate-950 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Brand Initialization</h2>
            <p className="text-slate-500 dark:text-slate-400">Enter your brand's core description to generate a complete identity system.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-widest">Strategic Brief</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., A sustainable luxury skincare brand focused on organic ingredients and minimalist packaging for urban professionals."
                className="w-full h-24 bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-white p-0 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors resize-none text-base font-light"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-sm flex items-center gap-3 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Optional Context</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-900 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={12} /> Logo
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full text-[10px] text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300 dark:hover:file:bg-slate-700 transition-colors"
                  />
                  {initLogo && <p className="text-[10px] text-green-600 dark:text-green-400">Logo uploaded.</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-900 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <SlidersHorizontal size={12} /> Colors
                  </label>
                  <input 
                    type="text"
                    value={initColors}
                    onChange={(e) => setInitColors(e.target.value)}
                    placeholder="e.g., Navy, Gold"
                    className="w-full bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-white p-0 py-1 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-900 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={12} /> Tone
                  </label>
                  <input 
                    type="text"
                    value={initTone}
                    onChange={(e) => setInitTone(e.target.value)}
                    placeholder="e.g., Professional"
                    className="w-full bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-white p-0 py-1 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-colors text-xs"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim()}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-sm font-bold tracking-widest uppercase text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  PROCESSING...
                </>
              ) : (
                <>
                  GENERATE IDENTITY
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function App() {
  const [brandSetupComplete, setBrandSetupComplete] = useState(false);
  const [selectedGem, setSelectedGem] = useState<Gem>(GENERIC_GEMS[0]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [view, setView] = useState<'tools' | 'assets'>('tools');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);

  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuidelines>({
    name: 'Studio AI',
    industry: 'Creative Technology',
    tone: 'Professional & Innovative',
    pillars: ['Innovation', 'Creativity', 'Efficiency'],
    colors: ['#0f172a', '#334155'],
    typography: { primary: 'Outfit', secondary: 'Inter' },
    logo: ''
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Dynamic CSS variables for brand colors.
  useEffect(() => {
    const root = document.documentElement;
    if (brandGuidelines.colors && brandGuidelines.colors.length > 0) {
      root.style.setProperty('--brand-primary', brandGuidelines.colors[0]);
      if (brandGuidelines.colors.length > 1) {
        root.style.setProperty('--brand-secondary', brandGuidelines.colors[1]);
      } else {
        root.style.setProperty('--brand-secondary', brandGuidelines.colors[0]);
      }
    }
  }, [brandGuidelines.colors]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedGemIdRef = useRef(selectedGem.id);

  useEffect(() => {
    selectedGemIdRef.current = selectedGem.id;
  }, [selectedGem.id]);

  // Slideshow Controls
  const [slideshowOverlay, setSlideshowOverlay] = useState(0.6);
  const [slideshowTheme, setSlideshowTheme] = useState<'light' | 'dark' | 'brand'>('dark');
  const [slideshowFont, setSlideshowFont] = useState<'sans' | 'serif'>('sans');

  // New Generation Controls
  const [videoDuration, setVideoDuration] = useState<'5s' | '7s'>('5s');
  const [videoShotType, setVideoShotType] = useState<'Single Shot' | 'Multi-Shot Sequence' | 'Cinematic Storytelling'>('Cinematic Storytelling');
  const [imageStyle, setImageStyle] = useState<'Photorealistic' | '3D Render' | 'Minimalist' | 'Vibrant'>('Photorealistic');
  const [voiceEmotion, setVoiceEmotion] = useState<'Neutral' | 'Cheerful' | 'Energetic' | 'Professional' | 'Calming'>('Professional');

  useEffect(() => {
    const loadDefaultLogo = async () => {
      try {
        const response = await fetch('/logo.svg');
        if (response.ok) {
          const svgText = await response.text();
          
          // Use SVG directly as data URL
          const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            setBrandGuidelines(prev => ({ ...prev, logo: result }));
          };
          reader.readAsDataURL(svgBlob);
        }
      } catch (error) {
        console.error("Failed to load default logo:", error);
      }
    };
    
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setCustomApiKeyInput(savedKey);
      setCustomApiKey(savedKey);
    }
    
    loadDefaultLogo();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(true); // Fallback for environments without the helper
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    } else {
      setShowSettings(true);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', customApiKey);
    setCustomApiKey(customApiKey);
    setShowSettings(false);
    if (customApiKey) setHasApiKey(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
  }, [result]);

  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Refresh suggestions when gem changes
  useEffect(() => {
    if (selectedGem.type === 'image') {
      setSelectedModel(IMAGE_MODELS[0].id);
    } else if (selectedGem.type === 'video') {
      setSelectedModel(VIDEO_MODELS[0].id);
      if (aspectRatio === '1:1' || aspectRatio === '4:3') {
        setAspectRatio('16:9');
      }
    } else {
      setSelectedModel('');
    }
  }, [selectedGem.id, aspectRatio]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // For slideshows, we might want to keep existing slides if we're building it up
    const isSlideshow = selectedGem.id === 'slideshow-maker';
    const existingSlideshow = result?.type === 'slideshow' ? result : null;
    
    if (!isSlideshow) {
      setResult(null);
    }
    
    setVideoStatus('');
    // If it's a new slideshow (no existing slides), reset currentSlide
    if (!existingSlideshow) {
      setCurrentSlide(0);
    }

    const fullPrompt = selectedGem.id === 'brand-copy' 
      ? `Language: ${selectedLanguage}\n\n${prompt}`
      : prompt;

    try {
      const selectedAssets = assets.filter(a => a.selected);
      const res = await generateCreative(selectedGem, fullPrompt, { 
        aspectRatio,
        guidelines: brandGuidelines,
        model: selectedModel,
        videoDuration,
        videoShotType,
        imageStyle,
        assets: selectedAssets
      });
      
      if (res?.type === 'video_op') {
        setResult(null);
        setVideoStatus('Generating video... This may take a few minutes.');
        startPolling(res.operation, res.concept, selectedGem.id, fullPrompt);
      } else if (res?.type === 'slideshow') {
        const newSlide = res.data[0];
        const updatedSlides = existingSlideshow 
          ? [...existingSlideshow.data, newSlide]
          : [newSlide];
        
        const updatedRes = {
          ...res,
          data: updatedSlides
        };
        
        setResult(updatedRes);
        setIsGenerating(false);
        
        // If we added a slide, move to it
        if (existingSlideshow) {
          setCurrentSlide(updatedSlides.length - 1);
        }
        
        // Generate image for the new slide
        const slideIndex = updatedSlides.length - 1;
        const originalGemId = selectedGem.id;
        const originalPrompt = fullPrompt;
        
        try {
          const imageResult = await generateImage(newSlide.imagePrompt, brandGuidelines);
          const finalSlides = [...updatedSlides];
          finalSlides[slideIndex].image = imageResult.url;
          finalSlides[slideIndex].groundingMetadata = imageResult.groundingMetadata;
          
          if (selectedGemIdRef.current === originalGemId) {
            setResult({ ...updatedRes, data: finalSlides });
          }
          addToHistory({ ...updatedRes, data: finalSlides }, originalGemId, originalPrompt);
        } catch (e) {
          console.error(`Failed to generate image for slide ${slideIndex}:`, e);
          addToHistory(updatedRes, originalGemId, originalPrompt);
        }
      } else {
        setResult(res);
        addToHistory(res, selectedGem.id, fullPrompt);
        setIsGenerating(false);
      }
    } catch (error: any) {
      console.error(error);
      const quotaMsg = getQuotaErrorMessage(error);
      const message = quotaMsg || "Failed to generate creative. Please try again.";
      setResult({ type: 'error', message });
      setIsGenerating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTTS = async (text: string) => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    // If audio exists and is paused, just play it
    if (audioRef.current && !audioRef.current.ended && audioRef.current.readyState >= 2) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    if (isTTSLoading) return;
    setIsTTSLoading(true);
    try {
      const url = await generateTTS(text, selectedVoice, voiceEmotion);
      setAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
      } else {
        audioRef.current = new Audio(url);
      }
      
      audioRef.current.onloadedmetadata = () => {
        setAudioDuration(audioRef.current?.duration || 0);
      };

      audioRef.current.ontimeupdate = () => {
        setAudioProgress(audioRef.current?.currentTime || 0);
      };

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
      };

      audioRef.current.volume = audioVolume;
      audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("TTS Error:", error);
    } finally {
      setIsTTSLoading(false);
    }
  };

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handleDownloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${brandGuidelines.name.toLowerCase().replace(/\s+/g, '-')}-narrative-${Date.now()}.wav`;
      link.click();
    }
  };

  const handleDownloadPDF = async () => {
    if (!result || result.type !== 'slideshow') return;
    setIsDownloadingPDF(true);
    
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvasModule = await import('html2canvas');
      const html2canvas = (html2canvasModule.default || html2canvasModule) as any;
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720]
      });

      // We'll capture the slides from the hidden container
      const slidesContainer = document.getElementById('slides-to-pdf');
      if (!slidesContainer) throw new Error("Slides container not found");

      const slideElements = slidesContainer.querySelectorAll('.slide-capture-container');
      
      for (let i = 0; i < slideElements.length; i++) {
        const canvas = await html2canvas(slideElements[i] as HTMLElement, {
          scale: 3, // Higher resolution for PDF
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 1280,
          height: 720,
          windowWidth: 1280,
          windowHeight: 720
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage([1280, 720], 'landscape');
        pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
      }

      pdf.save(`${brandGuidelines.name.replace(/\s+/g, '_')}_Slideshow_${Date.now()}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBrandGuidelines(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadAsset = (asset: any) => {
    if (asset.isLogo) {
      const link = document.createElement('a');
      link.href = brandGuidelines.logo || "/logo.svg";
      link.download = `${brandGuidelines.name.toLowerCase().replace(/\s+/g, '-')}-logo.svg`;
      link.target = "_blank";
      link.click();
      return;
    }

    if (asset.url) {
      const link = document.createElement('a');
      link.href = asset.url;
      link.download = asset.name.toLowerCase().replace(/\s+/g, '-');
      link.target = "_blank";
      link.click();
    }
  };

  const handleRasterizeSVG = async (svgElement: HTMLElement) => {
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = (html2canvasModule.default || html2canvasModule) as any;
      
      const canvas = await html2canvas(svgElement, {
        backgroundColor: null,
        scale: 4, // Ultra-high quality for rasterization
        useCORS: true,
        logging: false
      });
      
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${brandGuidelines.name.toLowerCase().replace(/\s+/g, '-')}-concept-raster-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error("Failed to rasterize SVG:", error);
    }
  };

  const startPolling = (operation: any, concept?: any, originalGemId?: string, originalPrompt?: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    
    let currentOp = operation;
    pollInterval.current = setInterval(async () => {
      try {
        const updatedOp = await pollVideo(currentOp);
        currentOp = updatedOp;
        
        if (updatedOp.done) {
          if (pollInterval.current) clearInterval(pollInterval.current);
          const videoUri = updatedOp.response?.generatedVideos?.[0]?.video?.uri;
          
          if (!videoUri) {
            throw new Error("Video generation completed but no URI was returned.");
          }
          
          // Fetch video with API key
          const response = await fetch(videoUri, {
            method: 'GET',
            headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
          });
          const blob = await response.blob();
          const videoUrl = URL.createObjectURL(blob);
          
          const res = { type: 'video', data: videoUrl, concept };
          addToHistory(res, originalGemId, originalPrompt);
          
          if (selectedGemIdRef.current === originalGemId) {
            setResult(res);
            setVideoStatus('');
          }
          setIsGenerating(false);
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (pollInterval.current) clearInterval(pollInterval.current);
        setIsGenerating(false);
        if (selectedGemIdRef.current === originalGemId) {
          setResult({ type: 'error', message: 'Video generation failed.' });
        }
      }
    }, 10000);
  };

  const addToHistory = (res: any, specificGemId?: string, specificPrompt?: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      gemId: specificGemId || selectedGem.id,
      prompt: specificPrompt || prompt,
      result: res,
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, 10));
  };

  const handleSelectGem = (gem: Gem) => {
    setSelectedGem(gem);
    setVideoStatus('');
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentSlide(0);
    
    const lastHistoryItem = history.find(item => item.gemId === gem.id);
    if (lastHistoryItem) {
      setResult(lastHistoryItem.result);
      setPrompt(lastHistoryItem.prompt);
    } else {
      setResult(null);
      setPrompt('');
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    const gem = GENERIC_GEMS.find(g => g.id === item.gemId);
    if (gem) setSelectedGem(gem);
    setResult(item.result);
    setPrompt(item.prompt);
    setVideoStatus('');
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentSlide(0);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Image': return <ImageIcon size={20} />;
      case 'Video': return <VideoIcon size={20} />;
      case 'FileText': return <FileText size={20} />;
      case 'LayoutDashboard': return <LayoutDashboard size={20} />;
      case 'Presentation': return <Presentation size={20} />;
      case 'Target': return <Target size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-panel p-8 rounded-sm text-center space-y-6"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-sm flex items-center justify-center mx-auto">
            <Key className="w-8 h-8 text-slate-900" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-light tracking-tight text-slate-900">Welcome to Studio AI</h1>
            <p className="text-slate-600 font-light">
              To use advanced features like video generation and high-quality imagery, please select your Gemini API key.
            </p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm text-sm text-slate-600 text-left">
            <p className="font-bold mb-1">Note:</p>
            <p>You must select an API key from a paid Google Cloud project. See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold">billing documentation</a> for details.</p>
          </div>
          <button 
            onClick={handleSelectKey}
            className="w-full bg-slate-900 text-white py-3 text-sm font-bold tracking-widest uppercase rounded-sm hover:bg-slate-800 transition-colors"
          >
            Select API Key
          </button>
        </motion.div>
      </div>
    );
  }

  if (!brandSetupComplete) {
    return (
      <BrandSetup 
        onComplete={(guidelines) => {
          setBrandGuidelines(guidelines);
          setBrandSetupComplete(true);
        }} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-72" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 h-16 shrink-0">
          {/* Empty space to align with header */}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className={cn("text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2", !sidebarOpen && "hidden")}>
            Creative Gems
          </div>
          {GENERIC_GEMS.map((gem) => (
            <button
              key={gem.id}
              onClick={() => handleSelectGem(gem)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-sm transition-all group border",
                selectedGem.id === gem.id 
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md" 
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <div className={cn("shrink-0", selectedGem.id === gem.id ? "text-white dark:text-slate-900" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")}>
                {getIcon(gem.icon)}
              </div>
              {sidebarOpen && (
                <div className="text-left overflow-hidden">
                  <p className="font-medium text-sm whitespace-nowrap">{gem.name}</p>
                  <p className={cn("text-[10px] truncate uppercase tracking-wider", selectedGem.id === gem.id ? "text-slate-400 dark:text-slate-500" : "text-slate-400")}>
                    {gem.type}
                  </p>
                </div>
              )}
            </button>
          ))}

          <div className="pt-8">
            <div className={cn("text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2", !sidebarOpen && "hidden")}>
              Library
            </div>
            <button
              onClick={() => setView('assets')}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-sm transition-all group border",
                view === 'assets'
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md" 
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <div className={cn("shrink-0", view === 'assets' ? "text-white dark:text-slate-900" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")}>
                <ImageIcon size={20} />
              </div>
              {sidebarOpen && (
                <div className="text-left overflow-hidden">
                  <p className="font-medium text-sm whitespace-nowrap">Asset Library</p>
                  <p className={cn("text-[10px] truncate uppercase tracking-wider", view === 'assets' ? "text-slate-400 dark:text-slate-500" : "text-slate-400")}>
                    Manage Assets
                  </p>
                </div>
              )}
            </button>
          </div>

          <div className="pt-8">
            <div className={cn("text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2", !sidebarOpen && "hidden")}>
              Recent History
            </div>
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectHistoryItem(item)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left",
                  !sidebarOpen && "justify-center"
                )}
              >
                <History size={16} className="shrink-0" />
                {sidebarOpen && <span className="text-xs truncate">{item.prompt}</span>}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 p-3 rounded-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 relative">
          <div className="flex items-center gap-4 z-10">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm text-slate-500 dark:text-slate-400"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 dark:text-slate-500"><ChevronRight size={16} /></span>
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">{selectedGem.name}</h2>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <BrandLogo collapsed={false} customLogo={brandGuidelines.logo} brandName={brandGuidelines.name} className="h-10" />
            <div className="flex flex-col justify-center ml-3 overflow-hidden text-left">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                {brandGuidelines.name}
              </span>
              <p className="text-[9px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">Creative Suite</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 z-10">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Gemini Active</span>
            </div>
            <div className="w-8 h-8 rounded-sm bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-bold text-xs">
              HP
            </div>
          </div>
        </header>

        {/* Content Area */}
        {!hasApiKey ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-sm shadow-xl border border-slate-100 dark:border-slate-800 text-center"
            >
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-sm flex items-center justify-center mx-auto mb-6 text-slate-900 dark:text-white">
                <Key size={32} />
              </div>
              <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-4 tracking-tight">API Configuration</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-light">
                To initialize the creative suite, please provide a Gemini API key. 
                You can select a platform key or provide your own.
              </p>
              <div className="space-y-4">
                <button 
                  onClick={handleSelectKey}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-sm font-bold tracking-widest uppercase text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-3"
                >
                  <Key size={18} />
                  SELECT PLATFORM KEY
                </button>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="w-full py-4 bg-transparent text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-sm font-bold tracking-widest uppercase text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-3"
                >
                  <Edit2 size={18} />
                  PROVIDE CUSTOM KEY
                </button>
              </div>
              <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
                Need a key? Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-slate-900 dark:text-white hover:underline font-bold">Google AI Studio</a>.
              </p>
            </motion.div>
          </div>
        ) : view === 'assets' ? (
          <AssetLibrary assets={assets} setAssets={setAssets} onClose={() => setView('tools')} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
            {/* Gem Info */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  {getIcon(selectedGem.icon)}
                  {selectedGem.type} Engine
                </div>
                <h1 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-slate-100 tracking-tight">
                  {selectedGem.name}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl font-light">
                  {selectedGem.description}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                {selectedGem.type !== 'text' && (
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider">Aspect Ratio</span>
                    {(selectedGem.type === 'video' ? ['16:9', '9:16'] : ['1:1', '16:9', '9:16', '4:3']).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={cn(
                          "px-3 py-1.5 rounded-sm text-xs font-bold transition-all border",
                          aspectRatio === ratio 
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" 
                            : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                )}

                  {(selectedGem.type === 'image' || selectedGem.type === 'video') && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider">Model Quality</span>
                      {(selectedGem.type === 'image' ? IMAGE_MODELS : VIDEO_MODELS).map(model => (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-2 border",
                            selectedModel === model.id 
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" 
                              : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                          title={model.description}
                        >
                          {(model.id.includes('3.1') || model.id === 'veo-3.1-generate-preview') && <Sparkles size={12} />}
                          {model.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedGem.type === 'video' && (
                    <>
                      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider">Duration</span>
                        {(['5s', '7s'] as const).map(duration => (
                          <button
                            key={duration}
                            onClick={() => setVideoDuration(duration)}
                            className={cn(
                              "px-3 py-1.5 rounded-sm text-xs font-bold transition-all border",
                              videoDuration === duration 
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" 
                                : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                          >
                            {duration}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider">Shot Type</span>
                        {(['Single Shot', 'Multi-Shot Sequence', 'Cinematic Storytelling'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setVideoShotType(type)}
                            className={cn(
                              "px-3 py-1.5 rounded-sm text-xs font-bold transition-all border",
                              videoShotType === type 
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" 
                                : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedGem.type === 'image' && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider">Style</span>
                      {(['Photorealistic', '3D Render', 'Minimalist', 'Vibrant'] as const).map(style => (
                        <button
                          key={style}
                          onClick={() => setImageStyle(style)}
                          className={cn(
                            "px-3 py-1.5 rounded-sm text-xs font-bold transition-all border",
                            imageStyle === style 
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" 
                              : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedGem.type === 'text' && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider">Voice Emotion</span>
                      {(['Neutral', 'Cheerful', 'Energetic', 'Professional', 'Calming'] as const).map(emotion => (
                        <button
                          key={emotion}
                          onClick={() => setVoiceEmotion(emotion)}
                          className={cn(
                            "px-3 py-1.5 rounded-sm text-xs font-bold transition-all border",
                            voiceEmotion === emotion 
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" 
                              : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          {emotion}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Result Display */}
            <div className="min-h-[400px] bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              {result ? (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <CheckCircle2 size={14} className="text-green-500" />
                      Generation Complete
                    </div>
                    <button 
                      onClick={() => {
                        if (result.type === 'image' || result.type === 'video') {
                          const link = document.createElement('a');
                          link.href = result.data;
                          link.download = `${brandGuidelines.name.toLowerCase().replace(/\s+/g, '-')}-creative-${Date.now()}`;
                          link.click();
                        } else if (result.type === 'text' || result.type === 'campaign') {
                          const blob = new Blob([result.type === 'campaign' ? result.data.copy : result.data], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${brandGuidelines.name.toLowerCase().replace(/\s+/g, '-')}-narrative-${Date.now()}.txt`;
                          link.click();
                          URL.revokeObjectURL(url);
                        } else if (result.type === 'slideshow') {
                          handleDownloadPDF();
                        }
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white hover:opacity-80 transition-all"
                    >
                      <Download size={14} />
                      EXPORT ASSET
                    </button>
                  </div>
                  
                  <div className="flex-1 p-8 flex items-center justify-center bg-slate-50/30 dark:bg-slate-950/30">
                    {result.type === 'image' && (
                      <div className="relative group max-w-full max-h-full inline-block">
                        <img 
                          src={result.data} 
                          alt="Generated Creative" 
                          className="max-w-full max-h-[500px] rounded-sm shadow-xl border border-slate-200 dark:border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm">
                           <button className="bg-white text-slate-900 px-6 py-3 rounded-sm font-bold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                             <Sparkles size={18} />
                             Refine with AI
                           </button>
                        </div>
                        <div className="mt-4">
                          <GroundingSources metadata={result.groundingMetadata} />
                        </div>
                      </div>
                    )}
                    
                    {result.type === 'video' && (
                      <div className="flex flex-col xl:flex-row gap-8 w-full max-w-6xl">
                        <div className="flex-1 flex flex-col items-center">
                          <div className="relative inline-block w-full max-w-fit">
                            <video 
                              src={result.data} 
                              controls 
                              autoPlay 
                              loop 
                              className="w-full max-h-[500px] rounded-sm shadow-xl border border-slate-200 dark:border-slate-800 bg-black"
                            />
                          </div>
                        </div>
                        {result.concept && (
                          <div className="w-full xl:w-96 shrink-0 bg-white dark:bg-slate-900 p-6 rounded-sm shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-6">
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                                <Volume2 size={16} className="text-slate-500" />
                                Voice Over
                              </h4>
                              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-sm text-sm text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-700 relative group flex items-center justify-between gap-4">
                                <span>"{result.concept.voiceOver}"</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleTTS(result.concept.voiceOver)}
                                    className="p-2 bg-white dark:bg-slate-900 rounded-sm shadow-sm text-slate-900 dark:text-white hover:scale-105 transition-transform"
                                    title="Listen to Voice Over"
                                  >
                                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                                  </button>
                                  {audioUrl && (
                                    <button 
                                      onClick={handleDownloadAudio}
                                      className="p-2 bg-white dark:bg-slate-900 rounded-sm shadow-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-105 transition-transform"
                                      title="Download Audio"
                                    >
                                      <Download size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                                <Music size={16} className="text-slate-500" />
                                Music Style
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-sm border border-slate-100 dark:border-slate-700">
                                {result.concept.musicStyle}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                                <Camera size={16} className="text-slate-500" />
                                Cinematography & VFX
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-sm border border-slate-100 dark:border-slate-700">
                                {result.concept.cinematographyNotes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {result.type === 'text' && (
                      <div className={cn(
                        "w-full bg-white dark:bg-slate-900 p-6 md:p-10 rounded-sm shadow-sm border border-slate-100 dark:border-slate-800 relative",
                        result.svg ? "max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10" : "max-w-3xl"
                      )}>
                        <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-50 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white">
                              <Volume2 size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Creative Narrative</h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Voiceover Preview</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPlaying && (
                              <div className="hidden sm:flex items-center gap-1 mr-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-sm animate-pulse">
                                <div className="w-1 h-3 bg-slate-400 dark:bg-slate-500 rounded-full animate-[bounce_1s_infinite_0ms]" />
                                <div className="w-1 h-4 bg-slate-400 dark:bg-slate-500 rounded-full animate-[bounce_1s_infinite_200ms]" />
                                <div className="w-1 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-[bounce_1s_infinite_400ms]" />
                                <span className="text-[10px] font-bold uppercase ml-1">Playing</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-sm border border-slate-100 dark:border-slate-700">
                              <button 
                                onClick={() => handleTTS(result.data)}
                                disabled={isTTSLoading}
                                className={cn(
                                  "h-10 px-4 rounded-sm transition-all disabled:opacity-50 flex items-center gap-2 font-bold text-xs",
                                  isPlaying 
                                    ? "bg-slate-800 text-white shadow-sm" 
                                    : "bg-slate-900 text-white shadow-sm hover:bg-slate-800"
                                )}
                                title={isPlaying ? "Pause Narrative" : "Listen to Narrative"}
                              >
                                {isTTSLoading ? (
                                  <Loader2 className="animate-spin" size={16} />
                                ) : isPlaying ? (
                                  <>
                                    <Pause size={16} />
                                    <span>Pause</span>
                                  </>
                                ) : (
                                  <>
                                    <Play size={16} />
                                    <span>{audioDuration > 0 ? "Resume" : "Listen"}</span>
                                  </>
                                )}
                              </button>

                              {audioUrl && (
                                <button 
                                  onClick={handleDownloadAudio}
                                  className="h-10 px-4 flex items-center gap-2 rounded-sm bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm transition-all font-bold text-xs"
                                  title="Download Audio"
                                >
                                  <Download size={16} />
                                  <span>Download Audio</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="prose prose-slate dark:prose-invert prose-blue max-w-none">
                          <ReactMarkdown>{result.data}</ReactMarkdown>
                        </div>

                        {audioDuration > 0 && (
                          <div className="mt-8 p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => handleTTS(result.data)}
                                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-sm shadow-sm hover:shadow-md transition-all text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800"
                              >
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                              </button>
                              
                              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full relative group cursor-pointer overflow-hidden">
                                <div 
                                  className="absolute inset-y-0 left-0 bg-slate-900 dark:bg-white transition-all"
                                  style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                                />
                                <input 
                                  type="range"
                                  min={0}
                                  max={audioDuration}
                                  value={audioProgress}
                                  onChange={(e) => {
                                    const time = parseFloat(e.target.value);
                                    if (audioRef.current) {
                                      audioRef.current.currentTime = time;
                                      setAudioProgress(time);
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                />
                              </div>
                              
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                                {formatTime(audioProgress)} / {formatTime(audioDuration)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 px-1">
                              <button 
                                onClick={() => setAudioVolume(audioVolume === 0 ? 1 : 0)}
                                className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                              >
                                {audioVolume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                              </button>
                              <input 
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={audioVolume}
                                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                                className="w-32 h-1 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                              />
                            </div>
                          </div>
                        )}

                        <GroundingSources metadata={result.groundingMetadata} />
                        </div>

                        {result.svg && (
                          <div className="space-y-6 flex flex-col h-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white">
                                  <ImageIcon size={20} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Visual Concept</h4>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">SVG Poster Layout</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    const blob = new Blob([result.svg], { type: 'image/svg+xml' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${brandGuidelines.name.toLowerCase().replace(/\s+/g, '-')}-concept-${Date.now()}.svg`;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                  title="Download SVG"
                                >
                                  <Download size={18} />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (svgContainerRef.current) {
                                      handleRasterizeSVG(svgContainerRef.current);
                                    }
                                  }}
                                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                  title="Download as PNG (Raster)"
                                >
                                  <FileDown size={18} />
                                </button>
                              </div>
                            </div>
                            
                            <div 
                              ref={svgContainerRef}
                              className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-100 dark:border-slate-700 overflow-hidden shadow-inner flex items-center justify-center p-4 min-h-[400px] svg-container"
                              dangerouslySetInnerHTML={{ __html: result.svg }}
                            />
                            
                            {result.conceptDescription && (
                              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                  <span className="font-bold uppercase tracking-wider mr-2">Concept:</span>
                                  {result.conceptDescription}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {result.type === 'campaign' && (
                      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 p-6 md:p-10 rounded-sm shadow-sm border border-slate-100 dark:border-slate-800 relative grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-light prose-headings:tracking-tight prose-a:text-slate-900 dark:prose-a:text-white prose-a:font-medium">
                            <ReactMarkdown>{result.data.copy}</ReactMarkdown>
                          </div>
                          <GroundingSources metadata={result.groundingMetadata} />
                        </div>
                        
                        <div className="space-y-6 flex flex-col h-full">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white">
                                <ImageIcon size={20} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Campaign Imagery</h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Key Visual Moments</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex-1 grid grid-cols-1 gap-4">
                            {result.data.images.map((imgUrl: string, idx: number) => (
                              <div key={idx} className="relative group overflow-hidden rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                                <img 
                                  src={imgUrl} 
                                  alt={`Campaign Image ${idx + 1}`} 
                                  className="w-full h-auto object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                  <button 
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = imgUrl;
                                      link.download = `${brandGuidelines.name.toLowerCase().replace(/\s+/g, '-')}-campaign-img-${idx + 1}-${Date.now()}`;
                                      link.click();
                                    }}
                                    className="bg-white text-slate-900 px-4 py-2 rounded-sm font-bold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform text-xs"
                                  >
                                    <Download size={14} />
                                    Download
                                  </button>
                                  <button 
                                    className="bg-slate-900 text-white px-4 py-2 rounded-sm font-bold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform text-xs opacity-50 cursor-not-allowed"
                                    title="Animation feature coming soon"
                                  >
                                    <VideoIcon size={14} />
                                    Animate
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {result.type === 'slideshow' && (
                      <SlideshowDisplay 
                        result={result}
                        setResult={setResult}
                        currentSlide={currentSlide}
                        setCurrentSlide={setCurrentSlide}
                        slideshowTheme={slideshowTheme}
                        setSlideshowTheme={setSlideshowTheme}
                        slideshowFont={slideshowFont}
                        setSlideshowFont={setSlideshowFont}
                        slideshowOverlay={slideshowOverlay}
                        setSlideshowOverlay={setSlideshowOverlay}
                        handleDownloadPDF={handleDownloadPDF}
                        isDownloadingPDF={isDownloadingPDF}
                        brandGuidelines={brandGuidelines}
                        generateImage={generateImage}
                        assets={assets}
                        cn={cn}
                      />
                    )}

                    {result.type === 'error' && (
                      <div className="flex flex-col items-center gap-4 text-center max-w-md">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-sm flex items-center justify-center">
                          <AlertCircle size={32} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">Generation Failed</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{result.message}</p>
                        </div>
                        <button onClick={handleGenerate} className="btn-primary">Try Again</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 border-2 border-slate-100 dark:border-slate-800 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-slate-900 dark:text-white">
                          <Sparkles size={24} className="animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-light text-slate-900 dark:text-slate-100 tracking-tight">
                          {videoStatus ? 'Processing Video Render...' : 'Synthesizing Output...'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto font-light">
                          {videoStatus || `Executing request against ${brandGuidelines.name} parameters.`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6 opacity-30">
                      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-sm flex items-center justify-center text-slate-400 dark:text-slate-500">
                        {getIcon(selectedGem.icon)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-light text-slate-900 dark:text-slate-100 tracking-tight">System Ready</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-light">Awaiting input parameters</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-widest">Command Input</label>
                  {selectedGem.id === 'brand-copy' && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-sm border border-slate-200 dark:border-slate-700">
                        <Globe size={12} className="text-slate-500" />
                        <select 
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Marathi">Marathi</option>
                          <option value="Gujarati">Gujarati</option>
                          <option value="Bengali">Bengali</option>
                          <option value="Tamil">Tamil</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-sm border border-slate-200 dark:border-slate-700">
                        <Volume2 size={12} className="text-slate-500" />
                        <select 
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                          className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                        >
                          <option value="Kore">Kore (Female)</option>
                          <option value="Puck">Puck (Male)</option>
                          <option value="Charon">Charon (Male)</option>
                          <option value="Fenrir">Fenrir (Male)</option>
                          <option value="Zephyr">Zephyr (Female)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">Powered by Gemini 3.1 Pro</span>
              </div>
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Describe the ${selectedGem.type} you want to create for ${brandGuidelines.name}...`}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 pr-16 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white focus:border-slate-900 dark:focus:border-white transition-all resize-none h-32 font-light"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute bottom-4 right-4 w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-sm flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* Footer */}
          <footer className="h-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
            <div>© 2026 {brandGuidelines.name} Studio AI</div>
            <div className="flex items-center gap-6">
              <button onClick={() => setShowGuidelines(true)} className="hover:text-slate-900 dark:hover:text-white transition-colors">Brand Guidelines</button>
              <button onClick={() => setShowAssetLibrary(true)} className="hover:text-slate-900 dark:hover:text-white transition-colors">Asset Library</button>
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Support</a>
            </div>
          </footer>
        </>
      )}
    </main>

      {/* Hidden Slides for PDF Generation */}
      {result?.type === 'slideshow' && (
        <div id="slides-to-pdf" className="fixed top-0 left-0 -z-50 pointer-events-none">
          {result.data.map((slide: any, idx: number) => (
            <div 
              key={idx} 
              className="slide-capture-container relative bg-white overflow-hidden border border-slate-200"
              style={{ width: '1280px', height: '720px' }}
            >
              {/* Slide Background Image */}
              {slide.image && (
                <div className="absolute inset-0 z-0">
                  <img 
                    src={slide.image} 
                    alt="Slide Background" 
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className={cn(
                      "absolute inset-0",
                      slideshowTheme === 'dark' ? 'bg-slate-900' : 
                      slideshowTheme === 'brand' ? 'bg-slate-900 dark:bg-white' : 'bg-white'
                    )} 
                    style={{ opacity: slideshowOverlay }}
                  />
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
                    slideshowTheme === 'brand' ? 'bg-white' : 'bg-slate-900 dark:bg-white'
                  )} />
                  <h1 className="text-6xl font-bold leading-tight">{slide.title}</h1>
                </div>
                <div className="space-y-6">
                  {slide.content.map((point: string, pIdx: number) => (
                    <div key={pIdx} className="flex items-start gap-6">
                      <div className={cn(
                        "mt-3 w-3 h-3 rounded-full shrink-0",
                        slideshowTheme === 'brand' ? 'bg-white' : 'bg-slate-500'
                      )} />
                      <p className={cn(
                        "text-3xl leading-relaxed",
                        slideshowTheme === 'light' ? 'text-slate-700' : 'text-white/90'
                      )}>{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Elements */}
              <div className="absolute top-8 right-8 z-20 opacity-80 origin-top-right">
                <BrandLogo customLogo={brandGuidelines.logo} brandName={brandGuidelines.name} noReferrer={false} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-slate-900 via-slate-500 to-slate-400 z-20" />
              
              {/* Background Accents */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-slate-900/5 dark:bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl" />
            </div>
          ))}
        </div>
      )}

      {/* Brand Guidelines Modal */}
      {showGuidelines && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Brand Guidelines</h2>
              <div className="flex items-center gap-4">
                <label className="btn-secondary text-xs cursor-pointer">
                  UPLOAD CUSTOM LOGO
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
                <button onClick={() => setShowGuidelines(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors text-slate-500 dark:text-slate-400">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Brand Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Brand Name</label>
                    <input 
                      type="text" 
                      value={brandGuidelines.name}
                      onChange={(e) => setBrandGuidelines(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white focus:border-slate-900 dark:focus:border-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Industry</label>
                    <input 
                      type="text" 
                      value={brandGuidelines.industry}
                      onChange={(e) => setBrandGuidelines(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white focus:border-slate-900 dark:focus:border-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tone of Voice</label>
                    <input 
                      type="text" 
                      value={brandGuidelines.tone}
                      onChange={(e) => setBrandGuidelines(prev => ({ ...prev, tone: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white focus:border-slate-900 dark:focus:border-white"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Core Pillars</h3>
                  <button 
                    onClick={() => {
                      setBrandGuidelines(prev => ({ ...prev, pillars: [...prev.pillars, "New Pillar"] }));
                    }}
                    className="text-[10px] font-bold text-slate-900 dark:text-white hover:underline"
                  >
                    + ADD PILLAR
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {brandGuidelines.pillars.map((pillar, idx) => (
                    <div key={idx} className="group relative p-6 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-200 dark:border-slate-800 text-center">
                      <input 
                        type="text"
                        value={pillar}
                        onChange={(e) => {
                          const newPillars = [...brandGuidelines.pillars];
                          newPillars[idx] = e.target.value;
                          setBrandGuidelines(prev => ({ ...prev, pillars: newPillars }));
                        }}
                        className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-slate-900 dark:focus:border-white focus:outline-none text-xl font-light text-slate-800 dark:text-slate-200 transition-colors"
                      />
                      <button 
                        onClick={() => setBrandGuidelines(prev => ({ ...prev, pillars: prev.pillars.filter((_, i) => i !== idx) }))}
                        className="absolute top-2 right-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Color Palette</h3>
                  <button 
                    onClick={() => {
                      setBrandGuidelines(prev => ({ ...prev, colors: [...prev.colors, "#000000"] }));
                    }}
                    className="text-[10px] font-bold text-slate-900 dark:text-white hover:underline"
                  >
                    + ADD COLOR
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {brandGuidelines.colors.map((hex, idx) => (
                    <div key={idx} className="group relative space-y-2">
                      <div className="h-20 rounded-sm shadow-inner relative overflow-hidden" style={{ backgroundColor: hex }}>
                        <input 
                          type="color" 
                          value={hex}
                          onChange={(e) => {
                            const newColors = [...brandGuidelines.colors];
                            newColors[idx] = e.target.value;
                            setBrandGuidelines(prev => ({ ...prev, colors: newColors }));
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="text-xs space-y-1">
                        <input 
                          type="text"
                          value={hex}
                          onChange={(e) => {
                            const newColors = [...brandGuidelines.colors];
                            newColors[idx] = e.target.value;
                            setBrandGuidelines(prev => ({ ...prev, colors: newColors }));
                          }}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-slate-900 dark:focus:border-white focus:outline-none font-mono text-slate-800 dark:text-slate-200 transition-colors uppercase"
                        />
                      </div>
                      <button 
                        onClick={() => setBrandGuidelines(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }))}
                        className="absolute -top-1 -right-1 p-1 bg-white dark:bg-slate-800 rounded-sm shadow-sm text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Typography</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Primary Font (Headings)</label>
                    <input 
                      type="text" 
                      value={brandGuidelines.typography.primary}
                      onChange={(e) => setBrandGuidelines(prev => ({ ...prev, typography: { ...prev.typography, primary: e.target.value } }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white focus:border-slate-900 dark:focus:border-white"
                    />
                    <p className="text-2xl font-light text-slate-900 dark:text-slate-100 mt-4" style={{ fontFamily: brandGuidelines.typography.primary }}>Sample Heading</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Secondary Font (Body)</label>
                    <input 
                      type="text" 
                      value={brandGuidelines.typography.secondary}
                      onChange={(e) => setBrandGuidelines(prev => ({ ...prev, typography: { ...prev.typography, secondary: e.target.value } }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white focus:border-slate-900 dark:focus:border-white"
                    />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-4" style={{ fontFamily: brandGuidelines.typography.secondary }}>Sample body text for the {brandGuidelines.name} brand guidelines.</p>
                  </div>
                </div>
              </section>

              {brandGuidelines.logo && (
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Logo Overlay</h3>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-200 dark:border-slate-800 flex items-center gap-6">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-sm shadow-sm border border-slate-200 dark:border-slate-800">
                      <BrandLogo customLogo={brandGuidelines.logo} brandName={brandGuidelines.name} />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-bold text-slate-800 dark:text-slate-200">Custom Logo Active</p>
                      <p>This logo will be used as an overlay for all generated creatives.</p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asset Library Modal */}
      {showAssetLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 tracking-tight">Asset Library</h2>
              <button onClick={() => setShowAssetLibrary(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors text-slate-500 dark:text-slate-400">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { name: 'Custom Logo', isLogo: true },
                  { name: 'Brand Asset 1', url: 'https://picsum.photos/seed/brand1/400/300' },
                  { name: 'Brand Asset 2', url: 'https://picsum.photos/seed/brand2/400/300' },
                  { name: 'Brand Asset 3', url: 'https://picsum.photos/seed/brand3/400/300' },
                  { name: 'Lifestyle 1', url: 'https://picsum.photos/seed/life1/400/300' },
                  { name: 'Lifestyle 2', url: 'https://picsum.photos/seed/life2/400/300' }
                ].map((asset, i) => (
                  <div key={i} className="group relative bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden aspect-[4/3]">
                    {asset.isLogo ? (
                      <div className="w-full h-full flex items-center justify-center p-8">
                        <BrandLogo customLogo={brandGuidelines.logo} brandName={brandGuidelines.name} className="h-24 w-full" />
                      </div>
                    ) : (
                      <img 
                        src={asset.url} 
                        alt={asset.name} 
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-slate-900/80 dark:bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-white dark:text-slate-900 font-bold mb-2">{asset.name}</p>
                      <button 
                        onClick={() => handleDownloadAsset(asset)}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:scale-105 transition-transform"
                      >
                        DOWNLOAD
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-sm text-slate-900 dark:text-white">
                  <Settings size={20} />
                </div>
                <h2 className="text-xl font-light text-slate-900 dark:text-slate-100 tracking-tight">Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-sm transition-colors text-slate-500 dark:text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Key size={14} />
                  Gemini API Key
                </label>
                <div className="relative">
                  <input 
                    type={showApiKey ? "text" : "password"}
                    value={customApiKey}
                    onChange={(e) => setCustomApiKeyInput(e.target.value)}
                    placeholder="Paste your API key here..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-3 pr-12 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white focus:border-slate-900 dark:focus:border-white font-mono"
                  />
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Your API key is stored locally in your browser and used for all AI generations. 
                  Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-slate-900 dark:text-white hover:underline font-bold">AI Studio</a>.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-6 py-3 rounded-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={saveApiKey}
                  className="flex-1 px-6 py-3 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-sm hover:opacity-90 transition-all"
                >
                  SAVE KEY
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
