const DEV_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4200',
  'http://localhost:5500',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
]);

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

export function isDevOrigin(origin: string): boolean {
  return DEV_ORIGINS.has(origin);
}

export function getDevOrigins(): string[] {
  return Array.from(DEV_ORIGINS);
}

export function isOriginAllowed(
  origin: string,
  allowedOrigins: string[],
  allowDevOrigins = process.env.NODE_ENV !== 'production',
): boolean {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return false;
  }

  if (allowDevOrigins && isDevOrigin(normalizedOrigin)) {
    return true;
  }

  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === '*') {
      return true;
    }

    return normalizeOrigin(allowedOrigin) === normalizedOrigin;
  });
}
