import { StorageService } from './storage';
import { User, AuthUser } from '../admin/types';
import * as CryptoJS from 'crypto-js';

interface Session {
  userId: string;
  created: number;
  expires: number;
  token: string;
}

/**
 * خدمة المصادقة والأمان
 */
export class AuthService {
  private static readonly SESSION_TIMEOUT = 3600000; // ساعة واحدة
  private static readonly SALT_ROUNDS = 1000; // عدد مرات التكرار للتشفير
  private static readonly KEY_SIZE = 256; // حجم المفتاح بالبت
  private static readonly MAX_LOGIN_ATTEMPTS = 5; // أقصى عدد لمحاولات تسجيل الدخول
  private static readonly LOCKOUT_TIME = 900000; // 15 دقيقة
  private static sessionCheckInterval: number | null = null;
  private static loginAttempts: Map<string, { count: number, lastAttempt: number }> = new Map();

  /**
   * تشفير كلمة المرور
   */
  static hashPassword(password: string): string {
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: this.KEY_SIZE/32,
      iterations: this.SALT_ROUNDS,
      hasher: CryptoJS.algo.SHA256
    });
    return `${salt.toString()}:${hash.toString()}`;
  }

  /**
   * التحقق من كلمة المرور
   */
  static verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const [salt, hash] = hashedPassword.split(':');
      if (!salt || !hash) return false;

      const newHash = CryptoJS.PBKDF2(password, salt, {
        keySize: this.KEY_SIZE/32,
        iterations: this.SALT_ROUNDS,
        hasher: CryptoJS.algo.SHA256
      }).toString();

      return newHash === hash;
    } catch (error) {
      console.error('خطأ في التحقق من كلمة المرور:', error);
      return false;
    }
  }

  /**
   * تسجيل محاولة دخول جديدة
   */
  private static recordLoginAttempt(email: string): boolean {
    const now = Date.now();
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: now };

    // إعادة تعيين العداد إذا انتهت مدة القفل
    if (now - attempts.lastAttempt > this.LOCKOUT_TIME) {
      attempts.count = 0;
    }

    attempts.count++;
    attempts.lastAttempt = now;
    this.loginAttempts.set(email, attempts);

    return attempts.count <= this.MAX_LOGIN_ATTEMPTS;
  }

  /**
   * التحقق من صحة البريد الإلكتروني
   */
  private static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * تسجيل الدخول
   */
  static async login(email: string, password: string): Promise<AuthUser | null> {
    try {
      // التحقق من صحة البريد الإلكتروني
      if (!this.validateEmail(email)) {
        throw new Error("البريد الإلكتروني غير صالح");
      }

      // التحقق من محاولات تسجيل الدخول
      if (!this.recordLoginAttempt(email)) {
        throw new Error("تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة");
      }

      const users = await StorageService.getUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }

      // التحقق من كلمة المرور
      const [salt, storedHash] = user.password.split(':');
      const hash = CryptoJS.PBKDF2(password, salt, {
        keySize: this.KEY_SIZE/32,
        iterations: this.SALT_ROUNDS,
        hasher: CryptoJS.algo.SHA256
      }).toString();

      if (hash !== storedHash) {
        throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }

      // إنشاء جلسة جديدة
      const session: Session = {
        userId: user.id,
        created: Date.now(),
        expires: Date.now() + this.SESSION_TIMEOUT,
        token: CryptoJS.lib.WordArray.random(128/8).toString()
      };

      await StorageService.saveSession(session);
      this.startSessionCheck();

      // إعادة تعيين محاولات تسجيل الدخول بعد النجاح
      this.loginAttempts.delete(email);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: session.token,
        permissions: user.permissions
      };
    } catch (error) {
      console.error("خطأ في تسجيل الدخول:", error);
      throw error;
    }
  }

  /**
   * بدء فحص الجلسات
   */
  private static startSessionCheck() {
    if (!this.sessionCheckInterval) {
      this.sessionCheckInterval = window.setInterval(async () => {
        try {
          const session = await StorageService.getSession();
          if (session && Date.now() > session.expires) {
            await this.logout();
          }
        } catch (error) {
          console.error("خطأ في فحص الجلسة:", error);
        }
      }, 60000); // فحص كل دقيقة
    }
  }

  /**
   * تسجيل الخروج
   */
  static async logout(): Promise<void> {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    await StorageService.removeSession();
  }

  /**
   * تحديث وقت النشاط
   */
  static updateActivity(): void {
    StorageService.setItem('last_activity', Date.now());
  }

  /**
   * الحصول على المستخدم الحالي
   */
  static getCurrentUser(): AuthUser | null {
    return StorageService.getItem<AuthUser>('auth_user');
  }
}
