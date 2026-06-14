import { encryptSecret, decryptSecret } from './crypto';

describe('crypto utils', () => {
  it('should encrypt and decrypt a secret round-trip', () => {
    const original = 'my-client-secret-value';
    const encrypted = encryptSecret(original);

    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(':');

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should throw on invalid encrypted format', () => {
    expect(() => decryptSecret('invalid-format')).toThrow('Decryption failed');
  });
});
