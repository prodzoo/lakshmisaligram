import React from 'react';
import { Download, Wand2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { StylePreset, GenerationStatus } from '../types';

interface StyleCardProps {
  preset: StylePreset;
  status: GenerationStatus;
  imageUrl?: string;
  isHighRes?: boolean;
  onAction: (preset: StylePreset) => void;
}

export const StyleCard: React.FC<StyleCardProps> = ({ 
  preset, 
  status, 
  imageUrl, 
  isHighRes,
  onAction 
}) => {
  const isLoading = status === GenerationStatus.LOADING;
  const hasImage = status === GenerationStatus.SUCCESS && imageUrl;

  return (
    <div 
      className={`
        relative group rounded-xl transition-all duration-300 overflow-hidden border-2 flex flex-col h-full
        ${hasImage ? 'border-indigo-500/50 bg-slate-900' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'}
      `}
    >
      {/* Card Content */}
      <div className="flex-1">
        {hasImage ? (
          <div className="relative aspect-[3/4] w-full overflow-hidden group-hover:shadow-2xl transition-shadow">
            {/* The Image */}
            <img 
              src={imageUrl} 
              alt={preset.name} 
              className="w-full h-full object-cover"
            />
            
            {/* Quality Badge */}
            <div className="absolute top-2 right-2 pointer-events-none">
              {isHighRes ? (
                <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg backdrop-blur-sm border border-emerald-400/50 flex items-center gap-1">
                  <Sparkles size={8} fill="currentColor" /> 2K HIGH RES
                </span>
              ) : (
                <span className="bg-slate-800/80 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg backdrop-blur-sm border border-slate-600/50">
                  PREVIEW
                </span>
              )}
            </div>
            
            {/* Hover Overlay for Action */}
            <div 
              className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 cursor-pointer backdrop-blur-[2px]"
              onClick={() => onAction(preset)}
            >
               <div className={`
                 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl transform scale-95 group-hover:scale-100 transition-transform
                 ${isHighRes ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}
               `}>
                 {isHighRes ? (
                   <>
                    <Download size={16} />
                    <span className="font-semibold text-sm">Download</span>
                   </>
                 ) : (
                   <>
                    <Sparkles size={16} />
                    <span className="font-semibold text-sm">Get High Res</span>
                   </>
                 )}
               </div>
            </div>
          </div>
        ) : (
          /* Placeholder State */
          <div 
            onClick={() => onAction(preset)}
            className="p-6 flex flex-col items-center text-center h-full justify-center min-h-[300px] cursor-pointer"
          >
            {isLoading ? (
               <div className="flex flex-col items-center gap-3 animate-pulse">
                 <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin" />
                 <p className="text-sm text-indigo-400 font-medium">
                    {imageUrl ? 'Enhancing...' : 'Designing...'}
                 </p>
               </div>
            ) : (
               <>
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${preset.color} text-white shadow-lg`}>
                   {preset.icon}
                 </div>
                 <h3 className="font-bold text-slate-100 mb-2">{preset.name}</h3>
                 <p className="text-sm text-slate-400 leading-relaxed mb-6">{preset.description}</p>
                 <button className="text-xs font-medium bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors flex items-center gap-2">
                   <Wand2 size={12} />
                   Click to Generate
                 </button>
               </>
            )}
          </div>
        )}
      </div>

      {/* Footer for Generated Cards */}
      {hasImage && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs font-medium text-slate-300 truncate max-w-[120px]">{preset.name}</span>
          {isHighRes ? (
            <Download size={14} className="text-slate-500" />
          ) : (
            <ImageIcon size={14} className="text-slate-600" />
          )}
        </div>
      )}
    </div>
  );
};