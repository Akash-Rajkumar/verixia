import { Router } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { runJury, SUPPORTED_CASE_TYPES, JuryValidationError } from "../jury/JuryEngine.js";
import { recordJuryReceipts } from "../jury/JuryReceipts.js";
import { persistJuryVerdict } from "../services/db/juryVerdicts.js";

const router = Router();

/**
 * POST /api/v1/jury/evaluate
 * Evaluates a case using the AI Jury multi-persona engine and persists completed verdicts
 */
router.post("/jury/evaluate", async (req, res, next) => {
  try {
    const { caseId, caseType, context, payload: bodyPayload, recordReceipts } = req.body || {};

    if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
      return sendError(res, 400, "VALIDATION_ERROR", "caseId is required and must be a non-empty string");
    }

    if (!caseType || typeof caseType !== "string" || !SUPPORTED_CASE_TYPES.includes(caseType)) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        `caseType is required and must be one of: ${SUPPORTED_CASE_TYPES.join(", ")}`
      );
    }

    const payload = context && typeof context === "object" ? context : bodyPayload && typeof bodyPayload === "object" ? bodyPayload : {};

    const modelClient = req.app?.get("modelClient") || undefined;
    const receiptsAdapter = req.app?.get("receiptsAdapter") || undefined;
    const dbClient = req.app?.get("dbClient") || undefined;

    const juryResult = await runJury(caseType, payload, { modelClient });

    if (juryResult.status === "FAILED") {
      return sendSuccess(res, {
        caseId: caseId.trim(),
        caseType,
        verdict: null,
        status: "FAILED",
        errorCode: juryResult.errorCode || "JURY_INCOMPLETE",
        votes: juryResult.votes || []
      });
    }

    let receiptsResult = null;
    if (recordReceipts === true) {
      receiptsResult = await recordJuryReceipts(juryResult, caseId.trim(), caseType, payload, { receiptsAdapter });
    }

    let persistenceResult = null;
    try {
      persistenceResult = await persistJuryVerdict(
        {
          caseType,
          caseRefId: caseId.trim(),
          verdict: juryResult.verdict,
          votes: juryResult.votes
        },
        { req, dbClient, allowUnconfigured: true }
      );
    } catch (dbErr) {
      return sendError(
        res,
        500,
        "DB_PERSISTENCE_ERROR",
        `Jury execution succeeded but persistence failed: ${dbErr.message}`,
        {
          caseId: caseId.trim(),
          caseType,
          verdict: juryResult.verdict,
          votes: juryResult.votes,
          receipts: receiptsResult
        }
      );
    }

    const responseData = {
      caseId: caseId.trim(),
      caseType,
      verdict: juryResult.verdict,
      status: juryResult.status,
      votes: juryResult.votes
    };

    if (persistenceResult && persistenceResult.persisted) {
      responseData.verdictId = persistenceResult.verdictId;
      responseData.persisted = true;
    }

    if (receiptsResult) {
      responseData.receipts = receiptsResult;
    }

    return sendSuccess(res, responseData);
  } catch (err) {
    if (err instanceof JuryValidationError) {
      return sendError(res, 400, "VALIDATION_ERROR", err.message, err.details);
    }
    return next(err);
  }
});

export default router;
