import React, { useState, useRef } from 'react';
import { Upload, Camera, Download, AlertCircle, Wand2, X, Loader2 } from 'lucide-react';
import { STYLE_PRESETS } from './constants';
import { StylePreset, GenerationStatus, GenerationResult } from './types';
import { editImage, validateImageContent } from './services/geminiService';
import { Button } from './components/Button';
import { StyleCard } from './components/StyleCard';

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // State for tracking each style's status and result individually
  const [results, setResults] = useState<Record<string, GenerationResult>>({});
  
  // Custom prompt state
  const [customPromptOpen, setCustomPromptOpen] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [customStatus, setCustomStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [customResult, setCustomResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const generateStyle = async (preset: StylePreset, highQuality: boolean = false) => {
    if (!selectedImage) return;

    // If custom, handle separately
    if (preset.isCustom) {
      setCustomPromptOpen(true);
      return;
    }

    // Update status to loading. Keep existing image if we are upgrading to high res so UI doesn't flicker empty
    setResults(prev => ({
      ...prev,
      [preset.id]: { 
        status: GenerationStatus.LOADING, 
        image: prev[preset.id]?.image,
        isHighRes: prev[preset.id]?.isHighRes
      }
    }));

    try {
      const match = selectedImage.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = match ? match[1] : 'image/png';
      
      const generatedBase64 = await editImage(selectedImage, mimeType, preset.prompt, highQuality);
      
      setResults(prev => ({
        ...prev,
        [preset.id]: { 
          status: GenerationStatus.SUCCESS, 
          image: generatedBase64,
          isHighRes: highQuality
        }
      }));
    } catch (err) {
      console.error(err);
      setResults(prev => ({
        ...prev,
        [preset.id]: { 
          // If high res failed, revert to success state with previous image if available
          status: prev[preset.id]?.image ? GenerationStatus.SUCCESS : GenerationStatus.ERROR,
          image: prev[preset.id]?.image,
          isHighRes: prev[preset.id]?.isHighRes
        }
      }));
    }
  };

  const handleGenerateAll = async () => {
    const standardPresets = STYLE_PRESETS.filter(p => !p.isCustom);
    
    // Identify which presets actually need generation (skip ones that are already successful)
    // allowing users to "Generate All" again if some failed.
    const toGenerate = standardPresets.filter(p => results[p.id]?.status !== GenerationStatus.SUCCESS);

    if (toGenerate.length === 0) return;

    // 1. VISUAL FEEDBACK: Set ALL cards to LOADING immediately.
    // This creates the "generating all at once" feeling for the user.
    setResults(prev => {
      const next = { ...prev };
      toGenerate.forEach(preset => {
        next[preset.id] = {
           status: GenerationStatus.LOADING,
           image: next[preset.id]?.image, // Keep old image if retrying
           isHighRes: next[preset.id]?.isHighRes
        };
      });
      return next;
    });

    // 2. Process sequentially in background to avoid 429 Resource Exhausted errors.
    // The user sees them all spinning, but they complete one by one.
    for (const preset of toGenerate) {
      // generateStyle handles the API call and final success/error state
      await generateStyle(preset, false);
      
      // Delay to respect API rate limits (avoiding the 429 error)
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  };

  const handleCardAction = async (preset: StylePreset) => {
    const result = results[preset.id];
    
    // 1. If not generated yet, generate preview
    if (!result || result.status === GenerationStatus.IDLE || result.status === GenerationStatus.ERROR) {
      generateStyle(preset, false);
      return;
    }

    // 2. If generated but Low Res, upgrade to High Res
    if (result.status === GenerationStatus.SUCCESS && !result.isHighRes) {
      // Ensure User has selected an API Key for the Pro model
      if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
         const hasKey = await (window as any).aistudio.hasSelectedApiKey();
         if (!hasKey) {
            try {
              await (window as any).aistudio.openSelectKey();
            } catch (e) {
              console.error("Key selection failed or cancelled", e);
              return;
            }
         }
      }
      
      await generateStyle(preset, true);
      return;
    }

    // 3. If High Res, Download
    if (result.status === GenerationStatus.SUCCESS && result.isHighRes && result.image) {
      const link = document.createElement('a');
      link.href = result.image;
      link.download = `pro-headshot-${preset.id}-2k.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCustomGenerate = async () => {
    if (!customPromptText.trim() || !selectedImage) return;
    
    setCustomStatus(GenerationStatus.LOADING);
    try {
      const match = selectedImage.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = match ? match[1] : 'image/png';
      
      // Enforce the headshot constraint in the prompt
      const enforcedPrompt = `Create a professional headshot where the subject is the absolute focus. The background must be blurred/bokeh and secondary to the person. ${customPromptText}`;
      
      // Custom defaults to Flash (Preview)
      const result = await editImage(selectedImage, mimeType, enforcedPrompt, false);
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
                   Generate All Previews
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
                Your Styles
                <span className="text-sm font-normal text-slate-500 ml-2">(Click a preview to generate High Res)</span>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {STYLE_PRESETS.filter(p => !p.isCustom).map((preset) => (
                  <StyleCard 
                    key={preset.id}
                    preset={preset}
                    status={results[preset.id]?.status || GenerationStatus.IDLE}
                    imageUrl={results[preset.id]?.image}
                    isHighRes={results[preset.id]?.isHighRes}
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