import 'dotenv/config';

/**
 * Validates the JWT secret and returns the sanitized secret string.
 * Throws a fatal Error with a clear description if the secret is missing or insecure.
 * NEVER prints the secret value in logs, console, or error messages.
 *
 * @param {string|undefined} secret - The raw secret from environment variables
 * @param {string|undefined} nodeEnv - Current runtime environment (e.g., 'production', 'development')
 * @returns {string} The trimmed valid secret
 */
export const validateJwtSecret = (secret, nodeEnv = process.env.NODE_ENV) => {
  if (secret === undefined || secret === null) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing. ' +
      'The server cannot start without a secure signing secret.'
    );
  }

  if (typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is empty or whitespace-only. ' +
      'The server cannot start without a valid signing secret.'
    );
  }

  const trimmedSecret = secret.trim();

  if (nodeEnv === 'production' && trimmedSecret.length < 32) {
    throw new Error(
      `FATAL CONFIGURATION ERROR: JWT_SECRET must be at least 32 characters long in production (received ${trimmedSecret.length} characters). ` +
      'Please configure a high-entropy secret (e.g., 64-character hex or base64 string).'
    );
  }

  return trimmedSecret;
};

// Evaluate and export at module load time
export const JWT_SECRET = validateJwtSecret(process.env.JWT_SECRET, process.env.NODE_ENV);
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
