export class ModelError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ModelError";
    this.code = options.code || "UNKNOWN_MODEL_ERROR";
    this.provider = options.provider || "unknown";
    this.isModelUnavailable = options.isModelUnavailable ?? true;
    this.cause = options.cause || null;
    this.details = options.details || null;
  }
}
