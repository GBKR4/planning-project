/**
 * Shared test helpers — token generation.
 * Import this in individual test files.
 */
import jwt from 'jsonwebtoken';

export const TEST_SECRET = 'test-jwt-secret-for-jest';

/**
 * Generate a signed access token for a fake test user.
 */
export function makeToken(userId = 1) {
  return jwt.sign({ userId }, TEST_SECRET, { expiresIn: '1h' });
}
