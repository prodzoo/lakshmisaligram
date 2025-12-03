import React from 'react';
import { StylePreset } from '../types';

interface StyleCardProps {
  preset: StylePreset;
  isSelected: boolean;
  onSelect: (preset: StylePreset) => void;
}

export const StyleCard: React.FC<StyleCardProps> = ({ preset, isSelected, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(preset)}
      className={`
        relative cursor-pointer group rounded-xl p-4 transition-all duration-200 border-2
        ${isSelected 
          ? 'bg-slate-800 border-indigo-500 shadow-xl shadow-indigo-900/20' 
          : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
        }
      `}
    >
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center mb-3
        ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'}
      `}>
        {preset.icon}
      </div>
      
      <h3 className={`font-semibold mb-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
        {preset.name}
      </h3>
      
      <p className="text-sm text-slate-400 leading-relaxed">
        {preset.description}
      </p>

      {isSelected && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50" />
      )}
    </div>
  );
};
