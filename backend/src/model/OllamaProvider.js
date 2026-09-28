import { ModelError } from "./ModelError.js";

export class OllamaProvider {
  constructor(config = {}, options = {}) {
    this.baseUrl = config.baseUrl || process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.model = config.model || process.env.OLLAMA_MODEL || "qwen2.5:7b";
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.providerName = "ollama";
  }

  validateConfig() {
    if (!this.baseUrl) {
      throw new ModelError("Ollama base URL is required but missing", {
        code: "OLLAMA_UNAVAILABLE",
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

    const cleanBaseUrl = this.baseUrl.replace(/\/+$/, "");
    const url = `${cleanBaseUrl}/api/generate`;

    const body = {
      model: this.model,
      prompt: promptText,
      stream: false
    };

    if (systemInstruction) {
      body.system = systemInstruction;
    }

    if (temperature !== undefined || maxTokens !== undefined) {
      body.options = {};
      if (temperature !== undefined) {
        body.options.temperature = temperature;
      }
      if (maxTokens !== undefined) {
        body.options.num_predict = maxTokens;
      }
    }

    let response;
    try {
      response = await this.fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new ModelError(`Ollama endpoint unavailable: ${err.message}`, {
        code: "OLLAMA_UNAVAILABLE",
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
      throw new ModelError(`Ollama API error (${response.status}): ${errText || response.statusText}`, {
        code: "OLLAMA_UNAVAILABLE",
        provider: this.providerName,
        isModelUnavailable: true,
        details: { status: response.status, body: errText }
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new ModelError(`Failed to parse Ollama response JSON: ${err.message}`, {
        code: "OLLAMA_UNAVAILABLE",
        provider: this.providerName,
        isModelUnavailable: true,
        cause: err
      });
    }

    if (data.response === undefined || data.response === null) {
      throw new ModelError("Ollama response did not contain expected 'response' field", {
        code: "OLLAMA_UNAVAILABLE",
        provider: this.providerName,
        isModelUnavailable: true,
        details: data
      });
    }

    return {
      text: data.response,
      provider: this.providerName,
      model: this.model
    };
  }
}
