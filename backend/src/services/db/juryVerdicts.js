import { getDbClient } from "./index.js";

export async function persistJuryVerdict({ caseType, caseRefId, verdict, votes }, options = {}) {
  const dbClient = options.dbClient || reqAppDbClient(options.req) || getDbClient();

  if (!dbClient) {
    if (options.allowUnconfigured) {
      return { persisted: false, reason: "DB_UNCONFIGURED" };
    }
    throw new Error("Database client is not configured");
  }

  const payload = {
    case_type: caseType,
    case_ref_id: String(caseRefId).trim(),
    verdict,
    votes
  };

  const { data, error } = await dbClient
    .from("jury_verdicts")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to persist jury verdict: ${error.message}`);
  }

  return {
    persisted: true,
    verdictId: data.id,
    record: data
  };
}

function reqAppDbClient(req) {
  return req?.app?.get("dbClient") || null;
}
