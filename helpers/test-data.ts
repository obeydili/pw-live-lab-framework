import { randomUUID } from 'node:crypto';

/**
 * A clientOrderId no other test will use. The API answers 409 on a duplicate, and
 * Date.now() alone collides when tests run in parallel.
 */
export function uniqueClientOrderId(prefix = 'e2e'): string {
  return `${prefix}-${randomUUID()}`;
}
