type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type TranslationRequest = {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
};

type SummarizerOptions = {
  sharedContext?: string;
  type?: "key-points" | "tl;dr" | "teaser" | "headline";
  format?: "markdown" | "plain-text";
  length?: "short" | "medium" | "long";
};

// Define the AI API types
interface AILanguageDetector {
  capabilities: () => Promise<{
    available: "readily" | "after-download" | "no";
    languageAvailable: (
      language: string
    ) => "readily" | "after-download" | "no";
  }>;
  create: (options?: {
    monitor?: (m: {
      addEventListener: (
        event: "downloadprogress",
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
  }) => Promise<{
    ready: Promise<void>;
    detect: (
      text: string
    ) => Promise<Array<{ language: string; confidence: number }>>;
  }>;
}

interface AITranslator {
  capabilities: () => Promise<{
    languagePairAvailable: (
      source: string,
      target: string
    ) => "readily" | "after-download" | "no";
  }>;
  create: (config: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (m: {
      addEventListener: (
        event: "downloadprogress",
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
  }) => Promise<{
    ready: Promise<void>;
    translate: (text: string) => Promise<string>;
  }>;
}

interface AISummarizer {
  capabilities: () => Promise<{
    available: "readily" | "after-download" | "no";
  }>;
  create: (
    options?: SummarizerOptions & {
      monitor?: (m: {
        addEventListener: (
          event: "downloadprogress",
          callback: (e: { loaded: number; total: number }) => void
        ) => void;
      }) => void;
    }
  ) => Promise<{
    ready: Promise<void>;
    summarize: (
      text: string,
      options?: { context?: string }
    ) => Promise<string>;
    summarizeStreaming: (
      text: string,
      options?: { context?: string }
    ) => AsyncIterable<string>;
  }>;
}

interface AIAPI {
  languageDetector?: AILanguageDetector;
  translator?: AITranslator;
  summarizer?: AISummarizer;
}

declare global {
  interface Window {
    ai?: AIAPI;
  }
}

const self = window;

export class AITextProcessor {
  /**
   * Check if an AI feature is available
   */
  private static isFeatureAvailable(feature: keyof AIAPI): boolean {
    return "ai" in self && feature in (self.ai || {});
  }

  /**
   * Detect the language of the given text using the Language Detector API.
   */
  static async detectLanguage(text: string): Promise<
    ApiResponse<
      Array<{
        // detectedLanguages: string;
        // detectedLanguage: string;
        language: string;
        confidence: number;
      }>
    >
  > {
    console.log("Starting language detection with input:", text);

    try {
      // 1. Check if the API is available
      if (!self.ai?.languageDetector) {
        return { success: false, error: "Language Detector API not available" };
      }

      // 2. Check capabilities (can it detect language?)
      const languageDetector = self.ai.languageDetector;
      const capabilities = await languageDetector.capabilities();
      console.log("Language Detector capabilities:", capabilities);

      if (capabilities.available === "no") {
        return {
          success: false,
          error: "Language detection is not available on this device",
        };
      }

      // 3. Create the detector (download if needed)
      const detector =
        capabilities.available === "readily"
          ? await languageDetector.create()
          : await languageDetector.create({
              monitor(m) {
                m.addEventListener("downloadprogress", (e) => {
                  console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
                });
              },
            });

      await detector.ready; // Wait until it's ready

      // 4. Detect the language
      const results = await detector.detect(text);
      console.log("Detection results:", results[0]);

      if (!results || results.length === 0) {
        return { success: false, error: "No language detected" };
      }

      return { success: true, data: results };
    } catch (error) {
      console.error("Error in language detection:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Translate the given text to the target language.
   */
  static async translateText({
    text,
    targetLanguage,
    sourceLanguage = "en",
  }: TranslationRequest): Promise<ApiResponse<string>> {
    try {
      if (!this.isFeatureAvailable("translator")) {
        return {
          success: false,
          error: "Translation API not available",
        };
      }

      try {
        const translatorCapabilities =
          await self.ai!.translator!.capabilities();
        const availability = translatorCapabilities.languagePairAvailable(
          sourceLanguage,
          targetLanguage
        );

        if (availability === "no") {
          return {
            success: false,
            error: "Language pair is not supported",
          };
        }

        const translator = await self.ai!.translator!.create({
          sourceLanguage,
          targetLanguage,
          monitor(m) {
            m.addEventListener("downloadprogress", () => {
              // console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
            });
          },
        });

        if (availability === "after-download") {
          await translator.ready;
        }

        const translation = await translator.translate(text);

        if (translation) {
          return {
            success: true,
            data: translation,
          };
        } else {
          return {
            success: false,
            error: "No translation generated",
          };
        }
      } catch (translationError) {
        console.error("Translation error:", translationError);
        return {
          success: false,
          error: "Failed to translate text",
        };
      }
    } catch (error) {
      console.error("Translation process error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Summarize the given text using the Summarizer API.
   */
  static async summarizeText(
    text: string,
    options: SummarizerOptions = {
      type: "key-points",
      format: "markdown",
      length: "medium",
    }
  ): Promise<ApiResponse<string>> {
    try {
      if (!this.isFeatureAvailable("summarizer")) {
        return {
          success: false,
          error: "Summarizer API not available",
        };
      }

      try {
        const available = (await self.ai!.summarizer!.capabilities()).available;

        if (available === "no") {
          return {
            success: false,
            error: "Summarization is not available at the moment",
          };
        }

        let summarizer;
        if (available === "readily") {
          summarizer = await self.ai!.summarizer!.create(options);
        } else {
          summarizer = await self.ai!.summarizer!.create({
            ...options,
            monitor(m) {
              m.addEventListener("downloadprogress", () => {
                // console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
              });
            },
          });
          await summarizer.ready;
        }

        const summary = await summarizer.summarize(text);

        return {
          success: true,
          data: summary,
        };
      } catch (summarizationError) {
        console.error("Summarization error:", summarizationError);
        return {
          success: false,
          error: "Failed to summarize text",
        };
      }
    } catch (error) {
      console.error("Summarization process error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get a streaming summary of the text
   */
  static async *summarizeTextStreaming(
    text: string,
    options: SummarizerOptions = {
      type: "key-points",
      format: "markdown",
      length: "medium",
    }
  ): AsyncGenerator<string, void, unknown> {
    try {
      if (!this.isFeatureAvailable("summarizer")) {
        throw new Error("Summarizer API not available");
      }

      const available = (await self.ai!.summarizer!.capabilities()).available;
      if (available === "no") {
        throw new Error("Summarization is not available at the moment");
      }

      const summarizer = await self.ai!.summarizer!.create(options);
      const stream = summarizer.summarizeStreaming(text);

      let previousLength = 0;
      for await (const segment of stream) {
        const newContent = segment.slice(previousLength);
        previousLength = segment.length;
        yield newContent;
      }
    } catch (error) {
      console.error("Streaming summarization error:", error);
      throw error;
    }
  }
}
