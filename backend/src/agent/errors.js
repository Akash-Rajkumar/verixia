class M2Error extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || "INTERNAL";
    this.details = options.details || null;
    this.cause = options.cause || null;
  }
}

class ValidationError extends M2Error {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || "VALIDATION_ERROR" });
  }
}

class ModelParseError extends M2Error {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || "MODEL_PARSE_ERROR" });
  }
}

class ModelUnavailableError extends M2Error {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || "MODEL_UNAVAILABLE" });
  }
}

class ChainError extends M2Error {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || "CHAIN_ERROR" });
  }
}

module.exports = {
  M2Error,
  ValidationError,
  ModelParseError,
  ModelUnavailableError,
  ChainError
};
