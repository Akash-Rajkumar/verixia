import { ModelParseError } from "./errors.js";

export function parseModelDecision(modelText) {
  if (typeof modelText !== "string" || !modelText.trim()) {
    throw new ModelParseError("Model output is empty or not a string");
  }

  let parsed;
  try {
    const jsonMatch = modelText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : modelText;
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new ModelParseError(`Failed to parse structured model response: ${err.message}`, {
      cause: err,
      details: { rawText: modelText }
    });
  }

  if (!parsed || typeof parsed !== "object" || !parsed.decision) {
    throw new ModelParseError("Model response missing required 'decision' field", {
      details: { parsed }
    });
  }

  const rawDecision = String(parsed.decision).toUpperCase().trim();

  let decision;
  if (rawDecision === "DECLINE" || rawDecision === "DECLINED_BY_AGENT") {
    decision = "DECLINED_BY_AGENT";
  } else if (rawDecision === "PAYMENT_INTENT" || rawDecision === "PAYMENT") {
    decision = "PAYMENT_INTENT";
  } else {
    throw new ModelParseError(`Unsupported model decision '${rawDecision}'. Allowed decisions: DECLINE, PAYMENT_INTENT`, {
      details: { rawDecision }
    });
  }

  return {
    decision,
    summary: parsed.summary || parsed.rationale || "No rationale provided",
    rawParsed: parsed
  };
}

export function mapCharterResult(charterResult) {
  if (!charterResult || typeof charterResult.allowed !== "boolean") {
    return "BLOCKED";
  }
  return charterResult.allowed ? "ALLOWED" : "BLOCKED";
}

export function deriveFinalDecision({ modelDecision, charterDecision, paymentResult }) {
  if (charterDecision === "BLOCKED") {
    return "BLOCKED";
  }

  if (modelDecision === "DECLINED_BY_AGENT") {
    return "DECLINED_BY_AGENT";
  }

  if (modelDecision === "PAYMENT_INTENT" && charterDecision === "ALLOWED") {
    if (paymentResult && paymentResult.executed === true) {
      return "EXECUTED";
    }
    return "BLOCKED";
  }

  return "BLOCKED";
}
