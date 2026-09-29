import { createModelClient } from "../model/ModelClient.js";
import { JUROR_PERSONAS } from "./personas.js";

export const SUPPORTED_CASE_TYPES = ["payment_approval", "claim_adjudication"];

export class JuryValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "JuryValidationError";
    this.code = "VALIDATION_ERROR";
    this.details = details;
  }
}

export function parseJurorResponse(responseText) {
  if (typeof responseText !== "string" || !responseText.trim()) {
    return null;
  }

  let cleaned = responseText.trim();
  // Strip markdown code fence if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const rawVote = typeof parsed.vote === "string" ? parsed.vote.trim().toLowerCase() : "";
    if (rawVote !== "approve" && rawVote !== "reject") {
      return null;
    }

    const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning.trim() : "";
    if (!reasoning) {
      return null;
    }

    return {
      vote: rawVote,
      reasoning
    };
  } catch {
    return null;
  }
}

async function evaluateJuror(persona, caseType, payload, modelClient) {
  const prompt = `
Case Type: ${caseType}
Case Payload:
${JSON.stringify(payload, null, 2)}

Evaluate this case based on your mandate:
${persona.systemInstruction}

Respond STRICTLY in JSON format with no additional text or markdown formatting:
{
  "vote": "approve" | "reject",
  "reasoning": "Detailed explanation for your vote"
}
`.trim();

  try {
    const response = await modelClient.generate({
      prompt,
      systemInstruction: persona.systemInstruction,
      temperature: 0.2
    });

    const parsed = parseJurorResponse(response.text);
    if (!parsed) {
      return {
        persona: persona.id,
        vote: null,
        reasoning: null,
        error: true,
        errorMessage: "Malformed or invalid juror response format"
      };
    }

    return {
      persona: persona.id,
      vote: parsed.vote,
      reasoning: parsed.reasoning,
      error: false
    };
  } catch (err) {
    return {
      persona: persona.id,
      vote: null,
      reasoning: null,
      error: true,
      errorMessage: err.message || "Model provider execution failed"
    };
  }
}

export async function runJury(caseType, payload, options = {}) {
  if (typeof caseType !== "string" || !SUPPORTED_CASE_TYPES.includes(caseType)) {
    throw new JuryValidationError(`Unsupported or missing caseType: '${caseType}'. Supported types: ${SUPPORTED_CASE_TYPES.join(", ")}`);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new JuryValidationError("Invalid case payload: payload must be a non-null object");
  }

  const modelClient = options.modelClient || createModelClient(options.modelConfig || {});
  const personas = options.personas || JUROR_PERSONAS;

  // Execute all three jurors concurrently
  const jurorPromises = personas.map((persona) =>
    evaluateJuror(persona, caseType, payload, modelClient)
  );

  const results = await Promise.all(jurorPromises);

  const validVotes = results.filter((r) => !r.error && (r.vote === "approve" || r.vote === "reject"));

  if (validVotes.length < personas.length) {
    return {
      verdict: null,
      status: "FAILED",
      errorCode: "JURY_INCOMPLETE",
      votes: results
    };
  }

  const approveCount = validVotes.filter((r) => r.vote === "approve").length;
  const verdict = approveCount >= 2 ? "approve" : "reject";

  return {
    verdict,
    status: "COMPLETED",
    votes: validVotes.map((r) => ({
      persona: r.persona,
      vote: r.vote,
      reasoning: r.reasoning
    }))
  };
}

export class JuryEngine {
  constructor(options = {}) {
    this.options = options;
  }

  async runJury(caseType, payload, overrideOptions = {}) {
    return runJury(caseType, payload, { ...this.options, ...overrideOptions });
  }
}
