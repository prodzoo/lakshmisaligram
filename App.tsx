import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Wand2, Download, Image as ImageIcon, Camera, AlertCircle, ChevronRight } from 'lucide-react';
import { STYLE_PRESETS } from './constants';
import { StylePreset, GenerationStatus } from './types';
import { editImage } from './services/geminiService';
import { Button } from './components/Button';
import { StyleCard } from './components/StyleCard';

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [selectedPreset, setSelectedPreset] = useState<StylePreset | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("File size too large. Please upload an image under 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setGeneratedImage(null);
        setErrorMsg(null);
        setStatus(GenerationStatus.IDLE);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
          setGeneratedImage(null);
          setErrorMsg(null);
          setStatus(GenerationStatus.IDLE);
        };
        reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleStyleSelect = (preset: StylePreset) => {
    setSelectedPreset(preset);
    setCustomPrompt(preset.prompt);
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;
    if (!customPrompt.trim()) {
      setErrorMsg("Please select a style or enter a prompt.");
      return;
    }

    setStatus(GenerationStatus.LOADING);
    setErrorMsg(null);

    try {
      // Assuming original is JPEG/PNG, we can extract type from base64 string or default to png
      // For simplicity in this demo, we'll try to detect or default to png if unsure, but usually Data URL has it.
      const match = selectedImage.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = match ? match[1] : 'image/png';

      const resultBase64 = await editImage(selectedImage, mimeType, customPrompt);
      setGeneratedImage(resultBase64);
      setStatus(GenerationStatus.SUCCESS);
      
      // Scroll to result on mobile
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      setErrorMsg("Failed to generate image. Please try again. " + (err.message || ''));
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `pro-headshot-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setGeneratedImage(null);
    setSelectedPreset(null);
    setCustomPrompt('');
    setStatus(GenerationStatus.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
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

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        
        {/* Hero Section (Only visible when no image selected) */}
        {!selectedImage && (
          <div className="text-center max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
              Your Professional Studio, <br/> Powered by Gemini
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Upload a casual selfie and transform it into a professional headshot in seconds. 
              Powered by the new Gemini 2.5 Flash Image model.
            </p>
            
            <div 
              onClick={triggerFileInput}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-900/50 transition-all duration-300 bg-slate-900/20 p-12"
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 flex items-center justify-center transition-colors duration-300">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-medium text-slate-200 group-hover:text-white">Click or drag to upload selfie</p>
                  <p className="text-sm text-slate-500 mt-2">Supports JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Workspace (Visible when image is selected) */}
        {selectedImage && (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Column: Image Preview & Controls */}
            <div className="lg:col-span-5 flex flex-col gap-6">
               <div className="sticky top-24 space-y-6">
                 {/* Original Image */}
                 <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl aspect-[3/4] group">
                    <img 
                      src={selectedImage} 
                      alt="Original" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white font-medium">Original Image</span>
                    </div>
                 </div>

                 {/* Mobile Result Scroll Target */}
                 <div ref={resultRef}></div>

                 {/* Generated Result (Shown below on mobile, or swapped if generated) */}
                 {generatedImage && (
                   <div className="lg:hidden relative rounded-2xl overflow-hidden bg-slate-900 border border-indigo-500/50 shadow-2xl shadow-indigo-900/20 aspect-[3/4] animate-in fade-in zoom-in duration-500">
                      <img 
                        src={generatedImage} 
                        alt="Generated Headshot" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4">
                        <Button variant="primary" onClick={handleDownload} icon={<Download size={18} />}>
                          Save
                        </Button>
                      </div>
                   </div>
                 )}
               </div>
            </div>

            {/* Right Column: Controls & Large Result View */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Desktop Large Result View (Only visible on desktop when generated) */}
              {generatedImage && (
                <div className="hidden lg:block relative rounded-2xl overflow-hidden bg-slate-900 border border-indigo-500/50 shadow-2xl shadow-indigo-900/20 aspect-video mb-8 animate-in fade-in zoom-in duration-500">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <img 
                        src={generatedImage} 
                        alt="Generated Headshot" 
                        className="h-full w-auto max-w-full object-contain shadow-lg"
                      />
                    </div>
                    <div className="absolute bottom-6 right-6">
                      <Button variant="primary" onClick={handleDownload} icon={<Download size={18} />}>
                        Download High Res
                      </Button>
                    </div>
                </div>
              )}

              {/* Step 1: Choose Style */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white border border-slate-700">1</div>
                  <h3 className="text-xl font-semibold text-white">Choose a Style</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {STYLE_PRESETS.map((preset) => (
                    <StyleCard 
                      key={preset.id} 
                      preset={preset} 
                      isSelected={selectedPreset?.id === preset.id} 
                      onSelect={handleStyleSelect} 
                    />
                  ))}
                </div>
              </section>

              {/* Step 2: Refine Prompt */}
              <section className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white border border-slate-700">2</div>
                  <h3 className="text-xl font-semibold text-white">Refine Instructions</h3>
                </div>
                
                <p className="text-slate-400 text-sm mb-4">
                  You can edit the prompt below to add specific details (e.g., "Add a red tie", "Make the background a brick wall").
                </p>

                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Or describe exactly what you want..."
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder:text-slate-600 transition-all"
                />
              </section>

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3 text-red-200">
                  <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Action Bar */}
              <div className="sticky bottom-4 z-40 bg-slate-950/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl flex justify-between items-center gap-4">
                 <div className="text-sm text-slate-400 hidden sm:block">
                   {selectedPreset ? `Ready to generate "${selectedPreset.name}"` : 'Select a style to continue'}
                 </div>
                 <Button 
                    fullWidth={true} 
                    className="sm:w-auto ml-auto"
                    onClick={handleGenerate}
                    isLoading={status === GenerationStatus.LOADING}
                    disabled={!customPrompt.trim()}
                    icon={<Wand2 size={18} />}
                  >
                    Generate Headshot
                 </Button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
