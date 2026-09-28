const { expect } = require("chai");
const { createModelClient, ModelError, GeminiProvider, OllamaProvider } = require("../backend/src/model");

describe("Model Provider Abstraction", function () {
  let originalEnv;

  beforeEach(function () {
    originalEnv = { ...process.env };
  });

  afterEach(function () {
    process.env = originalEnv;
  });

  describe("Provider Selection & Model Defaults", function () {
    it("selects Gemini as primary provider by default or when MODEL_PROVIDER=gemini with default gemini-2.5-flash model", function () {
      delete process.env.MODEL_PROVIDER;
      delete process.env.GEMINI_MODEL;
      const clientDefault = createModelClient({}, { fetchFn: async () => {} });
      expect(clientDefault.primaryProviderName).to.equal("gemini");
      expect(clientDefault.getPrimaryProvider()).to.be.an.instanceOf(GeminiProvider);
      expect(clientDefault.getPrimaryProvider().model).to.equal("gemini-2.5-flash");
      expect(clientDefault.getFallbackProvider()).to.be.an.instanceOf(OllamaProvider);

      process.env.MODEL_PROVIDER = "gemini";
      const clientGemini = createModelClient({}, { fetchFn: async () => {} });
      expect(clientGemini.primaryProviderName).to.equal("gemini");
    });

    it("selects Ollama as primary provider when MODEL_PROVIDER=ollama with default qwen2.5:7b model", function () {
      process.env.MODEL_PROVIDER = "ollama";
      delete process.env.OLLAMA_MODEL;
      const client = createModelClient({}, { fetchFn: async () => {} });
      expect(client.primaryProviderName).to.equal("ollama");
      expect(client.getPrimaryProvider()).to.be.an.instanceOf(OllamaProvider);
      expect(client.getPrimaryProvider().model).to.equal("qwen2.5:7b");
      expect(client.getFallbackProvider()).to.be.an.instanceOf(GeminiProvider);
    });

    it("defaults MODEL_FALLBACK_ENABLED to true when omitted", function () {
      delete process.env.MODEL_FALLBACK_ENABLED;
      const client = createModelClient({}, { fetchFn: async () => {} });
      expect(client.fallbackEnabled).to.be.true;
    });

    it("throws ModelError for invalid/unsupported provider", function () {
      expect(() => {
        createModelClient({ provider: "invalid_provider" });
      }).to.throw(ModelError, /Unsupported model provider/);
    });
  });

  describe("Gemini Configuration & Execution Validation", function () {
    it("throws MISSING_GEMINI_API_KEY when GEMINI_API_KEY is not provided", async function () {
      delete process.env.GEMINI_API_KEY;
      const provider = new GeminiProvider({ apiKey: "" });

      try {
        await provider.generate({ prompt: "Hello" });
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ModelError);
        expect(err.code).to.equal("MISSING_GEMINI_API_KEY");
        expect(err.isModelUnavailable).to.be.true;
      }
    });

    it("generates content successfully using Gemini provider mock", async function () {
      const mockFetch = async (url, options) => {
        expect(url).to.include("https://generativelanguage.googleapis.com");
        expect(url).to.include("models/gemini-2.5-flash");
        expect(url).to.include("key=test_gemini_key");

        const parsedBody = JSON.parse(options.body);
        expect(parsedBody.contents[0].parts[0].text).to.equal("Analyze transaction");

        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: "ANALYSIS_COMPLETE" }]
                }
              }
            ]
          })
        };
      };

      const provider = new GeminiProvider(
        { apiKey: "test_gemini_key", model: "gemini-2.5-flash" },
        { fetchFn: mockFetch }
      );

      const result = await provider.generate({ prompt: "Analyze transaction" });
      expect(result).to.deep.equal({
        text: "ANALYSIS_COMPLETE",
        provider: "gemini",
        model: "gemini-2.5-flash"
      });
    });
  });

  describe("Ollama Configuration & Execution Validation", function () {
    it("validates missing base URL", async function () {
      const provider = new OllamaProvider({ baseUrl: "" });
      try {
        await provider.generate({ prompt: "Hello" });
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ModelError);
        expect(err.code).to.equal("OLLAMA_UNAVAILABLE");
      }
    });

    it("handles connection/endpoint failure gracefully", async function () {
      const failingFetch = async () => {
        throw new Error("ECONNREFUSED 127.0.0.1:11434");
      };

      const provider = new OllamaProvider(
        { baseUrl: "http://localhost:11434", model: "qwen2.5:7b" },
        { fetchFn: failingFetch }
      );

      try {
        await provider.generate({ prompt: "Hello" });
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ModelError);
        expect(err.code).to.equal("OLLAMA_UNAVAILABLE");
        expect(err.isModelUnavailable).to.be.true;
      }
    });

    it("generates content successfully using Ollama provider mock and forwards maxTokens to num_predict", async function () {
      const mockFetch = async (url, options) => {
        expect(url).to.equal("http://localhost:11434/api/generate");
        const parsedBody = JSON.parse(options.body);
        expect(parsedBody.model).to.equal("qwen2.5:7b");
        expect(parsedBody.prompt).to.equal("Evaluate prompt");
        expect(parsedBody.system).to.equal("System instruction");
        expect(parsedBody.options.temperature).to.equal(0.7);
        expect(parsedBody.options.num_predict).to.equal(500);

        return {
          ok: true,
          json: async () => ({
            response: "EXECUTE_SAFE"
          })
        };
      };

      const provider = new OllamaProvider(
        { baseUrl: "http://localhost:11434", model: "qwen2.5:7b" },
        { fetchFn: mockFetch }
      );

      const result = await provider.generate({
        prompt: "Evaluate prompt",
        systemInstruction: "System instruction",
        temperature: 0.7,
        maxTokens: 500
      });

      expect(result).to.deep.equal({
        text: "EXECUTE_SAFE",
        provider: "ollama",
        model: "qwen2.5:7b"
      });
    });
  });

  describe("Fallback Behavior", function () {
    it("preserves original primary error when fallback is explicitly disabled", async function () {
      const mockFetch = async (url) => {
        if (url.includes("generativelanguage.googleapis.com")) {
          return {
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            text: async () => "Internal Server Error"
          };
        }
        return { ok: true, json: async () => ({ response: "Fallback response" }) };
      };

      const client = createModelClient(
        {
          provider: "gemini",
          fallbackEnabled: false,
          gemini: { apiKey: "test_key" }
        },
        { fetchFn: mockFetch }
      );

      try {
        await client.generate({ prompt: "Test prompt" });
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ModelError);
        expect(err.code).to.equal("PROVIDER_FAILURE");
        expect(err.provider).to.equal("gemini");
        expect(err.isModelUnavailable).to.be.true;
      }
    });

    it("does NOT invoke fallback provider when primary provider throws INVALID_PROMPT (isModelUnavailable === false)", async function () {
      let fallbackCalled = false;
      const mockFetch = async (url) => {
        if (url.includes("localhost:11434")) {
          fallbackCalled = true;
          return { ok: true, json: async () => ({ response: "Should not be called" }) };
        }
        throw new Error("Unexpected fetch call");
      };

      const client = createModelClient(
        {
          provider: "gemini",
          fallbackEnabled: true,
          gemini: { apiKey: "test_key" }
        },
        { fetchFn: mockFetch }
      );

      try {
        // Missing prompt parameter triggers INVALID_PROMPT with isModelUnavailable: false
        await client.generate({ prompt: "" });
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ModelError);
        expect(err.code).to.equal("INVALID_PROMPT");
        expect(err.isModelUnavailable).to.be.false;
        expect(fallbackCalled).to.be.false;
      }
    });

    it("successfully falls back to alternative provider when primary fails and fallback is enabled by default", async function () {
      delete process.env.MODEL_FALLBACK_ENABLED;
      const mockFetch = async (url) => {
        if (url.includes("generativelanguage.googleapis.com")) {
          throw new Error("Network unreachable");
        }
        if (url.includes("localhost:11434")) {
          return {
            ok: true,
            json: async () => ({ response: "Ollama fallback output" })
          };
        }
        throw new Error(`Unexpected URL: ${url}`);
      };

      const client = createModelClient(
        {
          provider: "gemini",
          gemini: { apiKey: "test_key" },
          ollama: { baseUrl: "http://localhost:11434", model: "qwen2.5:7b" }
        },
        { fetchFn: mockFetch }
      );

      const result = await client.generate({ prompt: "Test prompt" });
      expect(result).to.deep.equal({
        text: "Ollama fallback output",
        provider: "ollama",
        model: "qwen2.5:7b",
        fallbackUsed: true
      });
    });

    it("throws ALL_PROVIDERS_FAILED and preserves diagnostics when both primary and fallback providers fail", async function () {
      const mockFetch = async (url) => {
        if (url.includes("generativelanguage.googleapis.com")) {
          return { ok: false, status: 503, statusText: "Service Unavailable", text: async () => "Overloaded" };
        }
        throw new Error("Ollama connection refused");
      };

      const client = createModelClient(
        {
          provider: "gemini",
          fallbackEnabled: true,
          gemini: { apiKey: "test_key" }
        },
        { fetchFn: mockFetch }
      );

      try {
        await client.generate({ prompt: "Test prompt" });
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ModelError);
        expect(err.code).to.equal("ALL_PROVIDERS_FAILED");
        expect(err.isModelUnavailable).to.be.true;
        expect(err.details.primaryError.code).to.equal("PROVIDER_FAILURE");
        expect(err.details.fallbackError.code).to.equal("OLLAMA_UNAVAILABLE");
      }
    });
  });
});
