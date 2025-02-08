import CryptoJS from 'crypto-js';
import { toast } from 'sonner';

export class SecureStorageService {
  private static instance: SecureStorageService;
  private encryptionKey: string;

  private constructor() {
    // استخدام مفتاح تشفير ثابت للتطوير - يجب تغييره في الإنتاج
    this.encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'your-secure-key-here';
  }

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  public setItem<T>(key: string, value: T): boolean {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(value),
        this.encryptionKey
      ).toString();
      localStorage.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      toast.error('حدث خطأ أثناء حفظ البيانات');
      return false;
    }
  }

  public getItem<T>(key: string, defaultValue: T): T {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return defaultValue;

      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('خطأ في قراءة البيانات:', error);
      toast.error('حدث خطأ أثناء قراءة البيانات');
      return defaultValue;
    }
  }

  public removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('خطأ في حذف البيانات:', error);
      toast.error('حدث خطأ أثناء حذف البيانات');
    }
  }

  public clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('خطأ في مسح البيانات:', error);
      toast.error('حدث خطأ أثناء مسح البيانات');
    }
  }
}
