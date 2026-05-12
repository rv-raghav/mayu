/**
 * Supertest app wrapper for integration tests.
 * @module tests/helpers/request
 */

import supertest from 'supertest';
import { createApp } from '@/app';

/** Pre-configured supertest agent bound to the app. */
export function getTestAgent(): supertest.Agent {
  const app = createApp();
  return supertest.agent(app);
}
