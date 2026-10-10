// Web Crypto AES-GCM helper for highly sensitive GBK counseling notes
const DEFAULT_SALT = new TextEncoder().encode('SMK_SALAPING_GBK_SALT_2026');

async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: DEFAULT_SALT,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptCounselingNote(
  plainText: string,
  passKey: string = 'salaping_gbk_secret_2026'
): Promise<string> {
  try {
    const key = await deriveKey(passKey);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const ivArr = Array.from(iv);
    const cipherArr = Array.from(new Uint8Array(ciphertext));
    const combined = JSON.stringify({ iv: ivArr, data: cipherArr, enc: 'AES-GCM-256' });
    return btoa(combined);
  } catch (err) {
    console.error('Ralat penyulitan nota kaunseling:', err);
    return plainText; // fallback jika Web Crypto tidak disokong
  }
}

export async function decryptCounselingNote(
  encryptedBase64: string,
  passKey: string = 'salaping_gbk_secret_2026'
): Promise<string> {
  try {
    if (!encryptedBase64.startsWith('eyJ')) {
      // bukan format btoa JSON (nota lama/teks biasa)
      return encryptedBase64;
    }

    const jsonStr = atob(encryptedBase64);
    const parsed = JSON.parse(jsonStr);
    if (!parsed.iv || !parsed.data) return encryptedBase64;

    const key = await deriveKey(passKey);
    const iv = new Uint8Array(parsed.iv);
    const data = new Uint8Array(parsed.data);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    // Jika kunci salah atau teks belum disulitkan
    return encryptedBase64;
  }
}
