const { ModelError } = require("./ModelError");

class GeminiProvider {
  constructor(config = {}, options = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.model = config.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.providerName = "gemini";
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new ModelError("Gemini API key is required but missing", {
        code: "MISSING_GEMINI_API_KEY",
        provider: this.providerName,
        isModelUnavailable: true
      });
    }
  }

  async generate(params) {
    this.validateConfig();

    const promptText = typeof params === "string" ? params : (params && params.prompt);
    const systemInstruction = typeof params === "object" ? params.systemInstruction : undefined;
    const temperature = typeof params === "object" ? params.temperature : undefined;
    const maxTokens = typeof params === "object" ? params.maxTokens : undefined;

    if (!promptText) {
      throw new ModelError("Prompt is required for text generation", {
        code: "INVALID_PROMPT",
        provider: this.providerName,
        isModelUnavailable: false
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const body = {
      contents: [
        {
          parts: [{ text: promptText }]
        }
      ]
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    if (temperature !== undefined || maxTokens !== undefined) {
      body.generationConfig = {};
      if (temperature !== undefined) body.generationConfig.temperature = temperature;
      if (maxTokens !== undefined) body.generationConfig.maxOutputTokens = maxTokens;
    }

    let response;
    try {
      response = await this.fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new ModelError(`Gemini request failed to connect: ${err.message}`, {
        code: "PROVIDER_FAILURE",
        provider: this.providerName,
        isModelUnavailable: true,
        cause: err
      });
    }

    if (!response.ok) {
      let errText = "";
      try {
        errText = await response.text();
      } catch (_) {}
      throw new ModelError(`Gemini API error (${response.status}): ${errText || response.statusText}`, {
        code: "PROVIDER_FAILURE",
        provider: this.providerName,
        isModelUnavailable: true,
        details: { status: response.status, body: errText }
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new ModelError(`Failed to parse Gemini response JSON: ${err.message}`, {
        code: "PROVIDER_FAILURE",
        provider: this.providerName,
        isModelUnavailable: true,
        cause: err
      });
    }

    const candidate = data.candidates && data.candidates[0];
    const parts = candidate && candidate.content && candidate.content.parts;
    const text = parts && parts.map((p) => p.text).join("");

    if (text === undefined || text === null) {
      throw new ModelError("Gemini response did not contain expected text output", {
        code: "PROVIDER_FAILURE",
        provider: this.providerName,
        isModelUnavailable: true,
        details: data
      });
    }

    return {
      text,
      provider: this.providerName,
      model: this.model
    };
  }
}

module.exports = { GeminiProvider };
