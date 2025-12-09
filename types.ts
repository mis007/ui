export type ThemeStyle = 'modern' | 'glass' | 'brutal' | 'ios' | 'clay' | 'material' | 'neumorphic' | 'macaron';

export interface ThemeConfig {
  primaryColor: string;
  borderRadius: string; // '0px', '4px', '8px', '16px', '99px'
  stylePreset: ThemeStyle;
  darkMode: boolean;
  fontFamily: string;
}

export interface ComponentItem {
  id: string;
  type: 'header' | 'hero' | 'features' | 'testimonials' | 'cta' | 'footer' | 'pricing';
  content?: any;
}

export interface GeminiResponse {
  code: string;
  explanation: string;
}