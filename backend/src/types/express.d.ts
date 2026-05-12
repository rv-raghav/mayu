import { TokenPayload } from './index';

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user payload from JWT verification. */
      user?: TokenPayload;
      /** Unique request identifier for tracing. */
      requestId?: string;
    }
  }
}

export {};
