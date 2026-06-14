import { isOriginAllowed, isDevOrigin, getDevOrigins } from './origin';

describe('origin utils', () => {
  describe('isDevOrigin()', () => {
    it('should return true for localhost dev origins', () => {
      expect(isDevOrigin('http://localhost:4200')).toBe(true);
      expect(isDevOrigin('http://127.0.0.1:5500')).toBe(true);
    });

    it('should return false for unknown origins', () => {
      expect(isDevOrigin('https://evil.com')).toBe(false);
    });
  });

  describe('getDevOrigins()', () => {
    it('should return a list of dev origins', () => {
      const origins = getDevOrigins();
      expect(origins).toContain('http://localhost:4200');
      expect(origins.length).toBeGreaterThan(0);
    });
  });

  describe('isOriginAllowed()', () => {
    it('should allow exact matching origins', () => {
      expect(
        isOriginAllowed(
          'https://app.example.com',
          ['https://app.example.com'],
          false,
        ),
      ).toBe(true);
    });

    it('should allow wildcard origins', () => {
      expect(isOriginAllowed('https://any.com', ['*'], false)).toBe(true);
    });

    it('should reject origins not in allowed list', () => {
      expect(
        isOriginAllowed('https://evil.com', ['https://app.example.com'], false),
      ).toBe(false);
    });

    it('should reject invalid origin strings', () => {
      expect(isOriginAllowed('not-a-url', ['*'], false)).toBe(false);
    });

    it('should allow dev origins when allowDevOrigins is true', () => {
      expect(isOriginAllowed('http://localhost:4200', [], true)).toBe(true);
    });
  });
});
