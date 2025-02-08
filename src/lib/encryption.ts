import CryptoJS from 'crypto-js';

// مفتاح التشفير - في الإنتاج يجب وضعه في ملف .env
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-secret-key-123';

type SensitiveData = string | number | null | undefined;

export function encryptData(data: SensitiveData): string {
  if (data === null || data === undefined) {
    return '';
  }
  const stringData = data.toString();
  return CryptoJS.AES.encrypt(stringData, ENCRYPTION_KEY).toString();
}

export function decryptData(encryptedData: string): SensitiveData {
  if (!encryptedData) return '';
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) return '';
    
    // محاولة تحويل النص إلى رقم إذا كان يحتوي على أرقام فقط
    const numberValue = Number(decryptedString);
    if (!isNaN(numberValue) && decryptedString.trim() === numberValue.toString()) {
      return numberValue;
    }
    
    return decryptedString;
  } catch (error) {
    console.error('فشل في فك تشفير البيانات:', error);
    return '';
  }
}

export function encryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  sensitiveFields: readonly (keyof T)[]
): T {
  const encryptedData = { ...data };
  
  for (const field of sensitiveFields) {
    if (encryptedData[field] !== undefined) {
      const value = encryptedData[field];
      if (typeof value === 'string' || typeof value === 'number') {
        encryptedData[field] = encryptData(value) as any;
      }
    }
  }
  
  return encryptedData;
}

export function decryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  sensitiveFields: readonly (keyof T)[]
): T {
  const decryptedData = { ...data };
  
  for (const field of sensitiveFields) {
    if (decryptedData[field] !== undefined) {
      const value = decryptedData[field];
      if (typeof value === 'string') {
        decryptedData[field] = decryptData(value) as any;
      }
    }
  }
  
  return decryptedData;
}
