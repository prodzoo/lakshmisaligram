import React from 'react';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: React.ReactNode;
  color: string;
  isCustom?: boolean;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface GeneratedImage {
  data: string; // Base64 string
  mimeType: string;
}