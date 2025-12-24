import {
  sanitizeString,
  sanitizeObject,
  sanitizeErrorData,
  sanitizeUrl,
  sanitizeHeaders,
  isSensitiveKey,
} from './sanitizer';

const REDACTED = '[REDACTED]';

describe('sanitizer', () => {
  describe('sanitizeString', () => {
    it('returns non-strings unchanged', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });

    it('sanitizes JWT tokens', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const result = sanitizeString(`Token: ${jwt}`);
      expect(result).not.toContain('eyJ');
      expect(result).toContain(REDACTED);
    });

    it('sanitizes Bearer tokens', () => {
      const result = sanitizeString('Authorization: Bearer abc123xyz');
      expect(result).toContain(REDACTED);
      expect(result).not.toContain('abc123xyz');
    });

    it('sanitizes email addresses', () => {
      const result = sanitizeString('User email: john.doe@example.com');
      expect(result).not.toContain('john.doe@example.com');
      expect(result).toContain(REDACTED);
    });

    it('sanitizes phone numbers', () => {
      const result = sanitizeString('Phone: +1 (555) 123-4567');
      expect(result).toContain(REDACTED);
    });

    it('sanitizes credit card numbers', () => {
      const result = sanitizeString('Card: 4111-1111-1111-1111');
      expect(result).toContain(REDACTED);
    });

    it('sanitizes SSN', () => {
      const result = sanitizeString('SSN: 123-45-6789');
      expect(result).toContain(REDACTED);
    });

    it('sanitizes password fields', () => {
      const result = sanitizeString('password=mysecretpass');
      expect(result).toContain(REDACTED);
      expect(result).not.toContain('mysecretpass');
    });

    it('sanitizes API keys', () => {
      const result = sanitizeString('api_key: sk_live_1234567890abcdef');
      expect(result).toContain(REDACTED);
    });

    it('sanitizes IP addresses', () => {
      const result = sanitizeString('Client IP: 192.168.1.100');
      expect(result).toContain(REDACTED);
    });

    it('sanitizes URL credentials', () => {
      const result = sanitizeString('https://user:password@example.com/path');
      expect(result).toContain(REDACTED);
    });

    it('leaves non-sensitive strings unchanged', () => {
      const safe = 'This is a normal error message';
      expect(sanitizeString(safe)).toBe(safe);
    });
  });

  describe('isSensitiveKey', () => {
    it('returns false for non-strings', () => {
      expect(isSensitiveKey(123)).toBe(false);
      expect(isSensitiveKey(null)).toBe(false);
    });

    it('detects sensitive keys', () => {
      expect(isSensitiveKey('password')).toBe(true);
      expect(isSensitiveKey('apiKey')).toBe(true);
      expect(isSensitiveKey('authorization')).toBe(true);
      expect(isSensitiveKey('token')).toBe(true);
      expect(isSensitiveKey('accessToken')).toBe(true);
      expect(isSensitiveKey('refresh_token')).toBe(true);
      expect(isSensitiveKey('privateKey')).toBe(true);
    });

    it('is case insensitive', () => {
      expect(isSensitiveKey('PASSWORD')).toBe(true);
      expect(isSensitiveKey('ApiKey')).toBe(true);
      expect(isSensitiveKey('AUTHORIZATION')).toBe(true);
    });

    it('returns false for non-sensitive keys', () => {
      expect(isSensitiveKey('username')).toBe(false);
      expect(isSensitiveKey('email')).toBe(false);
      expect(isSensitiveKey('message')).toBe(false);
    });
  });

  describe('sanitizeObject', () => {
    it('handles null and undefined', () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });

    it('handles primitives', () => {
      expect(sanitizeObject(123)).toBe(123);
      expect(sanitizeObject(true)).toBe(true);
    });

    it('sanitizes strings in objects', () => {
      const obj = { message: 'Email: user@example.com' };
      const result = sanitizeObject(obj);
      expect(result.message).toContain(REDACTED);
    });

    it('redacts sensitive keys', () => {
      const obj = {
        username: 'john',
        password: 'secret123',
        token: 'abc123',
      };
      const result = sanitizeObject(obj);
      expect(result.username).toBe('john');
      expect(result.password).toBe(REDACTED);
      expect(result.token).toBe(REDACTED);
    });

    it('handles nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          details: {
            password: 'secret',
          },
        },
      };
      const result = sanitizeObject(obj);
      expect(result.user.name).toBe('John');
      expect(result.user.details.password).toBe(REDACTED);
    });

    it('handles arrays', () => {
      const arr = [
        { name: 'John', password: 'secret1' },
        { name: 'Jane', password: 'secret2' },
      ];
      const result = sanitizeObject(arr);
      expect(result[0].name).toBe('John');
      expect(result[0].password).toBe(REDACTED);
      expect(result[1].password).toBe(REDACTED);
    });

    it('handles Error objects', () => {
      const error = new Error('Token expired: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc');
      error.stack = 'Error at user@example.com';
      const result = sanitizeObject(error);
      expect(result.name).toBe('Error');
      expect(result.message).toContain(REDACTED);
      expect(result.stack).toContain(REDACTED);
    });

    it('respects max depth', () => {
      const deep = { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 'deep' } } } } } } } } } } };
      const result = sanitizeObject(deep, 0, 5);
      // Should not cause infinite recursion
      expect(result).toBeDefined();
    });
  });

  describe('sanitizeErrorData', () => {
    it('sanitizes error data objects', () => {
      const errorData = {
        message: 'Error for user@example.com',
        context: {
          token: 'secret123',
        },
      };
      const result = sanitizeErrorData(errorData);
      expect(result.message).toContain(REDACTED);
      expect(result.context.token).toBe(REDACTED);
    });
  });

  describe('sanitizeUrl', () => {
    it('returns non-strings unchanged', () => {
      expect(sanitizeUrl(123)).toBe(123);
    });

    it('removes credentials from URL', () => {
      const result = sanitizeUrl('https://user:pass@example.com/path');
      expect(result).not.toContain('user');
      expect(result).not.toContain('pass');
    });

    it('redacts sensitive query parameters', () => {
      const result = sanitizeUrl('https://example.com/api?token=secret&name=test');
      // URL encodes brackets, so check for URL-encoded version
      expect(result).toContain('token=');
      expect(result).toContain('REDACTED');
      expect(result).toContain('name=test');
    });

    it('redacts api_key parameter', () => {
      const result = sanitizeUrl('https://example.com/api?api_key=secret123');
      expect(result).toContain('api_key=');
      expect(result).toContain('REDACTED');
    });

    it('handles invalid URLs by sanitizing as string', () => {
      const result = sanitizeUrl('not a valid url with user@example.com');
      expect(result).toContain(REDACTED);
    });
  });

  describe('sanitizeHeaders', () => {
    it('handles non-objects', () => {
      expect(sanitizeHeaders(null)).toBe(null);
      expect(sanitizeHeaders(undefined)).toBe(undefined);
    });

    it('redacts authorization header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer secret123',
      };
      const result = sanitizeHeaders(headers);
      expect(result['Content-Type']).toBe('application/json');
      expect(result['Authorization']).toBe(REDACTED);
    });

    it('redacts cookie header', () => {
      const headers = {
        'Cookie': 'session=abc123',
      };
      const result = sanitizeHeaders(headers);
      expect(result['Cookie']).toBe(REDACTED);
    });

    it('redacts x-api-key header', () => {
      const headers = {
        'X-Api-Key': 'secret-api-key',
      };
      const result = sanitizeHeaders(headers);
      expect(result['X-Api-Key']).toBe(REDACTED);
    });

    it('sanitizes non-sensitive header values', () => {
      const headers = {
        'X-Custom': 'User email: test@example.com',
      };
      const result = sanitizeHeaders(headers);
      expect(result['X-Custom']).toContain(REDACTED);
    });
  });
});
