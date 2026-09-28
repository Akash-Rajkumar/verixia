export class M2Error extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || "INTERNAL";
    this.details = options.details || null;
    this.cause = options.cause || null;
  }
}

export class ValidationError extends M2Error {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || "VALIDATION_ERROR" });
  }
}

export class ModelParseError extends M2Error {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || "MODEL_PARSE_ERROR" });
  }
}

export class ModelUnavailableError extends M2Error {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || "MODEL_UNAVAILABLE" });
  }
}

export class ChainError extends M2Error {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || "CHAIN_ERROR" });
  }
}
