import React from 'react';
import { Building2, Coffee, Camera, User, Trees, Zap, Sparkles, Linkedin } from 'lucide-react';
import { StylePreset } from './types';

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'linkedin',
    name: 'Corporate Professional',
    description: 'Clean, approachable, and professional profile picture optimized for networking.',
    prompt: 'Create a professional headshot where the subject is the absolute focus. The face should be sharp and highly detailed. Background: blurred, bright office depth-of-field effect or clean studio backdrop. Lighting: evenly distributed and flattering. Attire: crisp business casual. Ensure the background does not distract from the subject.',
    icon: <Linkedin size={20} />,
    color: 'bg-blue-700'
  },
  {
    id: 'tech',
    name: 'Modern Tech',
    description: 'Bright modern office background, smart casual attire.',
    prompt: 'Create a modern tech headshot. Keep the subject in sharp focus in the foreground. Background: heavily blurred, bright modern open-plan office with glass walls (bokeh effect). Attire: high-quality smart-casual t-shirt or polo. Lighting: bright and inviting. The subject must stand out clearly against the background.',
    icon: <Building2 size={20} />,
    color: 'bg-blue-600'
  },
  {
    id: 'outdoor',
    name: 'Natural Outdoor',
    description: 'Soft natural light, blurred nature background.',
    prompt: 'Create an outdoor lifestyle headshot. Subject must be in sharp focus. Background: heavily blurred park or garden with soft sunlight filtering through trees ("golden hour" bokeh). Attire: casual but stylish. Lighting: warm and natural. Use a shallow depth of field to isolate the subject.',
    icon: <Trees size={20} />,
    color: 'bg-green-600'
  },
  {
    id: 'studio',
    name: 'Studio Black & White',
    description: 'High contrast, artistic black and white photography.',
    prompt: 'Create a high-end artistic black and white studio headshot. Subject in sharp focus. Background: plain black, non-distracting. Lighting: Dramatic (Rembrandt style) with deep blacks and bright highlights. Attire: simple black turtleneck. Focus intensely on the facial features.',
    icon: <Camera size={20} />,
    color: 'bg-zinc-800'
  },
  {
    id: 'cafe',
    name: 'Casual Coffee Shop',
    description: 'Relaxed atmosphere, warm tones, cafe background.',
    prompt: 'Create a casual headshot in a coffee shop. Subject should be sharp and well-lit. Background: creamy bokeh (blurred) of an upscale cafe with warm ambient lights. Attire: stylish sweater or casual jacket. The background should be atmospheric but strictly secondary to the person.',
    icon: <Coffee size={20} />,
    color: 'bg-amber-700'
  },
  {
    id: 'cyberpunk',
    name: 'Neon Future',
    description: 'Cyberpunk aesthetic, neon lights, futuristic look.',
    prompt: 'Create a cyberpunk style headshot. Subject must be the clear focal point. Background: dark with futuristic city lights (bokeh/blurred). Lighting: Neon blue and pink lighting reflecting on the face. Attire: modern and edgy. Ensure the neon background does not overpower the subject.',
    icon: <Zap size={20} />,
    color: 'bg-purple-600'
  },
  {
    id: 'custom',
    name: 'Custom / Freeform',
    description: 'Describe your own specific edit or style.',
    prompt: '',
    icon: <Sparkles size={20} />,
    color: 'bg-pink-600',
    isCustom: true
  },
];