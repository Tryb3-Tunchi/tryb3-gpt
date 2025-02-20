// src/types/index.ts

export interface Message {
  id: string;
  text: string;
  //   detectedLanguage?: string;
  summary?: string;
  translation?: string;
  timestamp: Date;
  sender?: "user" | "bot";
  isUser?: boolean;
}

export interface LanguageDetectionResult {
  success: boolean;
  data?: Array<{
    detectedLanguage: string;
    // language: string; // Ensure it matches the API response
    confidence: number;
  }>;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type SupportedLanguage = "en" | "pt" | "es" | "ru" | "tr" | "fr";

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
  ru: "Russian",
  tr: "Turkish",
  fr: "French",
};
