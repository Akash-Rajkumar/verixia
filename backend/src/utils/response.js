/**
 * Standard Success Response Envelope:
 * {
 *   "ok": true,
 *   "data": {}
 * }
 */
export function sendSuccess(res, data = {}, status = 200) {
  return res.status(status).json({
    ok: true,
    data
  });
}

/**
 * Standard Error Response Envelope:
 * {
 *   "ok": false,
 *   "error": {
 *     "code": "STRING",
 *     "message": "human-readable",
 *     "details": {}
 *   }
 * }
 */
export function sendError(res, status = 500, code = 'INTERNAL', message = 'An unexpected error occurred', details = {}) {
  return res.status(status).json({
    ok: false,
    error: {
      code,
      message,
      details
    }
  });
}

/**
 * Helper for 501 NOT_IMPLEMENTED responses
 */
export function sendNotImplemented(res, message = 'Endpoint not implemented in this checkpoint') {
  return sendError(res, 501, 'NOT_IMPLEMENTED', message);
}
