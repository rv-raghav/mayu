/**
 * Middleware to attach a unique X-Request-ID to every incoming request.
 * @module middleware/requestId
 */

import { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

/** Attaches a unique requestId to the request object and sets the X-Request-ID response header. */
export const requestId: RequestHandler = (req, res, next) => {
  const id = (req.headers['x-request-id'] as string | undefined) ?? uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};
