import { GeminiProvider } from "./GeminiProvider.js";
import { OllamaProvider } from "./OllamaProvider.js";
import { ModelError } from "./ModelError.js";

export class ModelClient {
  constructor(config = {}, options = {}) {
    const providerConfig = config.provider || process.env.MODEL_PROVIDER || "gemini";
    this.primaryProviderName = providerConfig.toLowerCase();

    const fallbackEnv = process.env.MODEL_FALLBACK_ENABLED;
    if (config.fallbackEnabled !== undefined) {
      this.fallbackEnabled = Boolean(config.fallbackEnabled);
    } else if (fallbackEnv !== undefined) {
      this.fallbackEnabled = fallbackEnv === "true" || fallbackEnv === "1" || fallbackEnv === true;
    } else {
      this.fallbackEnabled = true;
    }

    const geminiConfig = config.gemini || {};
    const ollamaConfig = config.ollama || {};
    const fetchFn = options.fetchFn;

    this.providers = {
      gemini: new GeminiProvider(geminiConfig, { fetchFn }),
      ollama: new OllamaProvider(ollamaConfig, { fetchFn })
    };

    if (!this.providers[this.primaryProviderName]) {
      throw new ModelError(`Unsupported model provider: '${this.primaryProviderName}'`, {
        code: "INVALID_PROVIDER",
        provider: this.primaryProviderName,
        isModelUnavailable: true
      });
    }
  }

  getPrimaryProvider() {
    return this.providers[this.primaryProviderName];
  }

  getFallbackProvider() {
    if (this.primaryProviderName === "gemini") {
      return this.providers.ollama;
    } else if (this.primaryProviderName === "ollama") {
      return this.providers.gemini;
    }
    return null;
  }

  async generate(params) {
    const primary = this.getPrimaryProvider();
    const errors = [];

    try {
      const result = await primary.generate(params);
      return {
        text: result.text,
        provider: result.provider,
        model: result.model,
        fallbackUsed: false
      };
    } catch (primaryErr) {
      errors.push(primaryErr);

      if (primaryErr && primaryErr.isModelUnavailable === false) {
        throw primaryErr;
      }

      if (!this.fallbackEnabled) {
        throw primaryErr;
      }

      const fallback = this.getFallbackProvider();
      if (fallback) {
        try {
          const fallbackResult = await fallback.generate(params);
          return {
            text: fallbackResult.text,
            provider: fallbackResult.provider,
            model: fallbackResult.model,
            fallbackUsed: true
          };
        } catch (fallbackErr) {
          errors.push(fallbackErr);
        }
      }

      const fallbackProviderName = fallback ? fallback.providerName : "none";
      throw new ModelError(
        `All model providers failed. Primary (${this.primaryProviderName}): ${primaryErr.message}; Fallback (${fallbackProviderName}): ${errors[1] ? errors[1].message : "N/A"}`,
        {
          code: "ALL_PROVIDERS_FAILED",
          provider: this.primaryProviderName,
          isModelUnavailable: true,
          details: {
            primaryError: primaryErr,
            fallbackError: errors[1] || null,
            errors
          }
        }
      );
    }
  }
}

export function createModelClient(config = {}, options = {}) {
  return new ModelClient(config, options);
}
