import React from 'react';
import { Briefcase, Building2, Coffee, Camera, User, Trees, Zap } from 'lucide-react';
import { StylePreset } from './types';

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'corporate',
    name: 'Corporate Executive',
    description: 'Classic grey backdrop, sharp suit, professional lighting.',
    prompt: 'Transform this person into a corporate executive. Change the background to a professional studio grey gradient. Make them wear a sharp, fitted dark business suit. Ensure the lighting is soft, professional studio quality. Keep facial features identical but polished.',
    icon: <Briefcase size={20} />,
    color: 'bg-slate-700'
  },
  {
    id: 'tech',
    name: 'Modern Tech',
    description: 'Bright modern office background, smart casual attire.',
    prompt: 'Edit this photo to look like a modern tech employee headshot. Change the background to a blurred, bright, modern open-plan office with glass walls. Change clothing to a high-quality smart-casual t-shirt or polo. Lighting should be bright and inviting.',
    icon: <Building2 size={20} />,
    color: 'bg-blue-600'
  },
  {
    id: 'outdoor',
    name: 'Natural Outdoor',
    description: 'Soft natural light, blurred nature background.',
    prompt: 'Transform this into an outdoor lifestyle portrait. Change the background to a beautiful, blurred park or garden with soft sunlight filtering through trees ("golden hour"). Clothing should be casual but stylish. Lighting should be warm and natural.',
    icon: <Trees size={20} />,
    color: 'bg-green-600'
  },
  {
    id: 'studio',
    name: 'Studio Black & White',
    description: 'High contrast, artistic black and white photography.',
    prompt: 'Convert this image into a high-end artistic black and white studio portrait. Deep blacks and bright highlights. Plain black background. Dramatic lighting (Rembrandt style). Subject wearing a simple black turtleneck.',
    icon: <Camera size={20} />,
    color: 'bg-zinc-800'
  },
  {
    id: 'cafe',
    name: 'Casual Coffee Shop',
    description: 'Relaxed atmosphere, warm tones, cafe background.',
    prompt: 'Place this person in a cozy, upscale coffee shop. Blurred background with warm ambient lights. Subject wearing a stylish sweater or casual jacket. Relaxed, friendly vibe.',
    icon: <Coffee size={20} />,
    color: 'bg-amber-700'
  },
  {
    id: 'cyberpunk',
    name: 'Neon Future',
    description: 'Cyberpunk aesthetic, neon lights, futuristic look.',
    prompt: 'Edit this photo with a cyberpunk aesthetic. Neon blue and pink lighting reflecting on the face. Dark background with futuristic city lights. Clothing should look modern and edgy.',
    icon: <Zap size={20} />,
    color: 'bg-purple-600'
  },
];
