import { sendError } from '../utils/response.js';

export function requireAdminAuth(req, res, next) {
  const adminKeyHeader = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey || !adminKeyHeader || adminKeyHeader !== expectedKey) {
    return sendError(
      res,
      401,
      'UNAUTHORIZED',
      'Unauthorized: Invalid or missing admin API key',
      {}
    );
  }

  next();
}
