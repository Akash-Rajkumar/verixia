import { createModelClient } from "../model/index.js";
import { createSpendingCharterAdapter } from "./adapters/SpendingCharterAdapter.js";
import { processTurn } from "./GoodAgentPipeline.js";

let defaultRuntime = null;

export function createAgentRuntime(config = {}, options = {}) {
  const model = options.model || createModelClient(config.model || {}, options.modelOptions || {});
  const charter = options.charter || createSpendingCharterAdapter(config.charter || {}, options.charterOptions || {});

  const adapters = {
    model,
    charter,
    reputation: options.reputation || null,
    attemptStore: options.attemptStore || null,
    receipt: options.receipt || null,
    eventStore: options.eventStore || null
  };

  return {
    model,
    charter,
    adapters,
    processTurn: (event, customAdapters) => processTurn(event, customAdapters || adapters)
  };
}

export function getDefaultAgentRuntime() {
  if (!defaultRuntime) {
    defaultRuntime = createAgentRuntime();
  }
  return defaultRuntime;
}
