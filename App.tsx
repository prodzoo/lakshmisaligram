import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Download, AlertCircle, Wand2, X, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { STYLE_PRESETS } from './constants';
import { StylePreset, GenerationStatus } from './types';
import { editImage, validateImageContent } from './services/geminiService';
import { Button } from './components/Button';
import { StyleCard } from './components/StyleCard';

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // State for tracking each style's status and result individually
  const [results, setResults] = useState<Record<string, { status: GenerationStatus; image?: string }>>({});
  
  // Initialize unlocked styles from localStorage if available
  const [unlockedStyles, setUnlockedStyles] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('proheadshot_unlocked');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  // Paywall Modal State
  const [paywallPreset, setPaywallPreset] = useState<StylePreset | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Custom prompt state
  const [customPromptOpen, setCustomPromptOpen] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [customStatus, setCustomStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [customResult, setCustomResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist unlocked styles
  useEffect(() => {
    localStorage.setItem('proheadshot_unlocked', JSON.stringify(Array.from(unlockedStyles)));
  }, [unlockedStyles]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleFile = (file?: File) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("File size too large. Please upload an image under 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        setIsAnalyzing(true);
        setErrorMsg(null);

        try {
          const match = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,/);
          const mimeType = match ? match[1] : 'image/png';
          
          // Step 1: Validate content (Check for person vs object)
          const { isValid, message } = await validateImageContent(base64Data, mimeType);
          
          if (!isValid) {
             setErrorMsg(message || "Please upload a photo of a person.");
             setIsAnalyzing(false);
             return;
          }

          // Step 2: Proceed if valid
          setSelectedImage(base64Data);
          setResults({});
          // We do NOT clear unlockedStyles here so users keep purchases across uploads
          setCustomResult(null);
          setErrorMsg(null);
        } catch (error) {
           console.error("Processing failed", error);
           // Fallback: allow image if validation fails technically
           setSelectedImage(base64Data);
        } finally {
           setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStyle = async (preset: StylePreset) => {
    if (!selectedImage) return;

    // If custom, handle separately
    if (preset.isCustom) {
      setCustomPromptOpen(true);
      return;
    }

    // Update status to loading
    setResults(prev => ({
      ...prev,
      [preset.id]: { status: GenerationStatus.LOADING }
    }));

    try {
      const match = selectedImage.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = match ? match[1] : 'image/png';
      
      const generatedBase64 = await editImage(selectedImage, mimeType, preset.prompt);
      
      setResults(prev => ({
        ...prev,
        [preset.id]: { status: GenerationStatus.SUCCESS, image: generatedBase64 }
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [preset.id]: { status: GenerationStatus.ERROR }
      }));
    }
  };

  const handleGenerateAll = async () => {
    const standardPresets = STYLE_PRESETS.filter(p => !p.isCustom);
    // Trigger all in parallel
    standardPresets.forEach(preset => {
      if (results[preset.id]?.status !== GenerationStatus.SUCCESS) {
        generateStyle(preset);
      }
    });
  };

  const handleCardAction = (preset: StylePreset) => {
    const result = results[preset.id];
    
    // If not generated yet, generate it
    if (!result || result.status === GenerationStatus.IDLE || result.status === GenerationStatus.ERROR) {
      generateStyle(preset);
      return;
    }

    // If generated but locked, open paywall
    if (result.status === GenerationStatus.SUCCESS && !unlockedStyles.has(preset.id)) {
      setPaywallPreset(preset);
      return;
    }

    // If unlocked, download
    if (unlockedStyles.has(preset.id) && result.image) {
      const link = document.createElement('a');
      link.href = result.image;
      link.download = `pro-headshot-${preset.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  /**
   * INTEGRATION POINT: Stripe Payment Handler
   */
  const handlePurchase = async () => {
    if (!paywallPreset) return;
    
    setIsProcessingPayment(true);
    
    // --- SIMULATED PAYMENT (For Demo) ---
    setTimeout(() => {
      setUnlockedStyles(prev => new Set(prev).add(paywallPreset.id));
      setIsProcessingPayment(false);
      setPaywallPreset(null);
      
      // Trigger Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#d946ef']
      });

    }, 1500);
  };

  const handleCustomGenerate = async () => {
    if (!customPromptText.trim() || !selectedImage) return;
    
    setCustomStatus(GenerationStatus.LOADING);
    try {
      const match = selectedImage.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = match ? match[1] : 'image/png';
      
      // Enforce the headshot constraint in the prompt
      const enforcedPrompt = `Create a professional headshot where the subject is the absolute focus. The background must be blurred/bokeh and secondary to the person. ${customPromptText}`;
      
      const result = await editImage(selectedImage, mimeType, enforcedPrompt);
      setCustomResult(result);
      setCustomStatus(GenerationStatus.SUCCESS);
    } catch (e) {
      setCustomStatus(GenerationStatus.ERROR);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResults({});
    setCustomResult(null);
    setCustomStatus(GenerationStatus.IDLE);
    setCustomPromptText('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 font-inter">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Camera size={18} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">ProHeadshot AI</h1>
          </div>
          {selectedImage && (
             <button onClick={reset} className="text-sm text-slate-400 hover:text-white transition-colors">
               Start Over
             </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Upload View */}
        {!selectedImage && (
          <div className="text-center max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
              Professional Headshots<br/>Generated Instantly
            </h2>
            <p className="text-lg text-slate-400 mb-12 leading-relaxed">
              Upload one selfie. We'll generate 6 professional styles for you to preview.
              Pick the ones you love.
            </p>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3 text-red-200 text-left mb-6 max-w-xl mx-auto animate-in slide-in-from-top-2">
                <AlertCircle size={24} className="mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold mb-1">Upload Error</h3>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}
            
            <div 
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 bg-slate-900/20 p-12
                ${isAnalyzing ? 'border-indigo-500/50 cursor-wait' : 'border-slate-700 hover:border-indigo-500 hover:bg-slate-900/50'}
              `}
            >
              <div className="flex flex-col items-center justify-center gap-4">
                {isAnalyzing ? (
                  <>
                     <div className="w-16 h-16 flex items-center justify-center">
                       <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                     </div>
                     <div className="text-center">
                       <p className="text-xl font-medium text-slate-200">Analyzing Photo...</p>
                       <p className="text-sm text-slate-500 mt-2">Checking image quality and subject</p>
                     </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 flex items-center justify-center transition-colors duration-300">
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-medium text-slate-200 group-hover:text-white">Upload your selfie</p>
                      <p className="text-sm text-slate-500 mt-2">JPG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" disabled={isAnalyzing} />
          </div>
        )}

        {/* Workspace View */}
        {selectedImage && (
          <div className="flex flex-col gap-8">
            
            {/* Top Bar: Original Image + Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/50">
               <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-700 shadow-lg shrink-0">
                    <img src={selectedImage} alt="Original" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Original Photo</h3>
                    <p className="text-sm text-slate-400">Ready to transform</p>
                  </div>
               </div>
               
               <div className="sm:ml-auto w-full sm:w-auto">
                 <Button 
                   onClick={handleGenerateAll} 
                   icon={<Wand2 size={18} />}
                   className="w-full sm:w-auto shadow-indigo-500/20 shadow-lg"
                 >
                   Generate All Styles
                 </Button>
               </div>
            </div>

            {/* Error Message (Workspace) */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3 text-red-200">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Styles Grid */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                Preview Styles
                <span className="text-sm font-normal text-slate-500 ml-2 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                  Low Res Previews
                </span>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {STYLE_PRESETS.filter(p => !p.isCustom).map((preset) => (
                  <StyleCard 
                    key={preset.id}
                    preset={preset}
                    status={results[preset.id]?.status || GenerationStatus.IDLE}
                    imageUrl={results[preset.id]?.image}
                    isUnlocked={unlockedStyles.has(preset.id)}
                    onAction={handleCardAction}
                  />
                ))}
                
                {/* Custom Card (Action to open modal) */}
                <div 
                   onClick={() => setCustomPromptOpen(true)}
                   className="relative group rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/20 hover:bg-slate-900/50 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center min-h-[300px]"
                >
                   <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Wand2 size={24} className="text-slate-400 group-hover:text-white" />
                   </div>
                   <h3 className="font-bold text-slate-200">Create Custom</h3>
                   <p className="text-sm text-slate-500 mt-2">Write your own prompt</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Paywall Modal */}
        {paywallPreset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setPaywallPreset(null)} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              <div className="relative h-64 bg-slate-950">
                 {/* Preview Image in Modal (Still blurred/watermarked slightly) */}
                 <img 
                   src={results[paywallPreset.id]?.image} 
                   className="w-full h-full object-cover opacity-50 blur-sm"
                   alt="Preview"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-slate-900/90 p-4 rounded-full shadow-xl border border-slate-700">
                       <Lock size={32} className="text-amber-400" />
                    </div>
                 </div>
                 <button 
                   onClick={() => setPaywallPreset(null)}
                   className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
                 >
                   <X size={16} />
                 </button>
              </div>

              <div className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h3 className="text-xl font-bold text-white">{paywallPreset.name}</h3>
                     <p className="text-slate-400 text-sm">Professional High-Resolution Download</p>
                   </div>
                   <div className="text-right">
                      <span className="block text-2xl font-bold text-white">$4.99</span>
                      <span className="text-xs text-slate-500 line-through">$15.00</span>
                   </div>
                 </div>

                 <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 size={16} className="text-green-500" />
                      4K Ultra-HD Resolution
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 size={16} className="text-green-500" />
                      No Watermark
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 size={16} className="text-green-500" />
                      Commercial Usage Rights
                    </li>
                 </ul>

                 <Button 
                   fullWidth 
                   onClick={handlePurchase}
                   isLoading={isProcessingPayment}
                   className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-none"
                 >
                   {isProcessingPayment ? 'Processing Payment...' : 'Unlock & Download'}
                 </Button>
                 
                 <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
                   <span>Secure payment via</span>
                   <span className="font-bold text-white">Stripe</span>
                 </p>
              </div>
            </div>
          </div>
        )}

        {/* Custom Prompt Dialog */}
        {customPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !customResult && setCustomPromptOpen(false)} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
               <button 
                 onClick={() => setCustomPromptOpen(false)} 
                 className="absolute top-4 right-4 text-slate-500 hover:text-white"
               >
                 <X size={20} />
               </button>
               
               <h3 className="text-xl font-bold text-white mb-4">Create Custom Style</h3>
               
               {!customResult ? (
                 <>
                    <textarea
                      value={customPromptText}
                      onChange={(e) => setCustomPromptText(e.target.value)}
                      placeholder="Describe the style (e.g. 'retro filter', 'cyberpunk background'). We will ensure it remains a headshot."
                      className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4"
                    />
                    <Button 
                      fullWidth 
                      onClick={handleCustomGenerate}
                      disabled={!customPromptText.trim()}
                      isLoading={customStatus === GenerationStatus.LOADING}
                    >
                      Generate Custom
                    </Button>
                 </>
               ) : (
                 <div className="space-y-4">
                   <div className="rounded-xl overflow-hidden border border-slate-700">
                      <img src={customResult} alt="Custom Result" className="w-full h-auto" />
                   </div>
                   <Button 
                     fullWidth 
                     onClick={() => {
                        const link = document.createElement('a');
                        link.href = customResult;
                        link.download = 'custom-headshot.png';
                        link.click();
                     }}
                     icon={<Download size={18} />}
                   >
                     Download
                   </Button>
                 </div>
               )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
