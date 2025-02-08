import * as CryptoJS from 'crypto-js';
import lzString from 'lz-string';

/**
 * خدمة التخزين المحلي مع معالجة الأخطاء وتشفير البيانات
 */
export class StorageService {
  private static readonly ENCRYPTION_KEY = 'your-secure-key';
  private static readonly CACHE_DURATION = 3600000; // ساعة واحدة
  private static cache: Map<string, { value: any; timestamp: number }> = new Map();
  private static prefix = 'app_';

  /**
   * تشفير البيانات
   */
  private static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
  }

  /**
   * فك تشفير البيانات
   */
  private static decrypt(data: string): string {
    const bytes = CryptoJS.AES.decrypt(data, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * تخزين البيانات مع معالجة الأخطاء
   */
  static setItem<T>(key: string, value: T): boolean {
    try {
      const data = JSON.stringify(value);
      const compressed = lzString.compress(data);
      const encrypted = this.encrypt(compressed);
      
      localStorage.setItem(this.prefix + key, encrypted);
      this.cache.set(key, { value, timestamp: Date.now() });
      return true;
    } catch (error) {
      console.error(`خطأ في حفظ البيانات: ${key}`, error);
      return false;
    }
  }

  /**
   * استرجاع البيانات مع معالجة الأخطاء
   */
  static getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      // التحقق من التخزين المؤقت
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.value as T;
      }

      const encrypted = localStorage.getItem(this.prefix + key);
      if (!encrypted) return defaultValue;

      const decrypted = this.decrypt(encrypted);
      const decompressed = lzString.decompress(decrypted);
      if (!decompressed) return defaultValue;

      const value = JSON.parse(decompressed) as T;

      // تحديث التخزين المؤقت
      this.cache.set(key, { value, timestamp: Date.now() });
      return value;
    } catch (error) {
      console.error(`خطأ في قراءة البيانات: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * حذف البيانات مع معالجة الأخطاء
   */
  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(this.prefix + key);
      this.cache.delete(key);
      return true;
    } catch (error) {
      console.error(`خطأ في حذف البيانات: ${key}`, error);
      return false;
    }
  }

  /**
   * التحقق من وجود البيانات
   */
  static hasItem(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }

  /**
   * مسح كل البيانات الخاصة بالتطبيق
   */
  static clear(): boolean {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('خطأ في مسح البيانات', error);
      return false;
    }
  }

  /**
   * تصفير كل البيانات
   */
  static clearAll(): boolean {
    try {
      // حذف كل البيانات التي تبدأ بـ app_
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('خطأ في تصفير البيانات:', error);
      return false;
    }
  }

  /**
   * استرجاع قائمة المستخدمين
   */
  static async getUsers(): Promise<any[]> {
    const users = this.getItem<any[]>('users', []);
    return users || [];
  }

  /**
   * حفظ الجلسة
   */
  static async saveSession(session: any): Promise<void> {
    this.setItem('current_session', session);
  }

  /**
   * استرجاع الجلسة الحالية
   */
  static async getSession(): Promise<any | null> {
    return this.getItem<any>('current_session');
  }

  /**
   * حذف الجلسة الحالية
   */
  static async removeSession(): Promise<void> {
    this.setItem('current_session', null);
    this.cache.delete('current_session');
  }
}
