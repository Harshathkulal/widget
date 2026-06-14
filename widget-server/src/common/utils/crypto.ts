import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

const getSecretKey = () => {
  const secret =
    process.env.JWT_SECRET || 'super-secret-change-me-32-bytes-long-key!';
  return crypto.createHash('sha256').update(secret).digest();
};

export function encryptSecret(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptSecret(encryptedText: string): string {
  try {
    const [ivHex, encryptedHex] = encryptedText.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted text format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err: any) {
    throw new Error(`Decryption failed: ${err.message}`);
  }
}
