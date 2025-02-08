import { AuthService } from './auth';
import { StorageService } from './storage';

describe('AuthService', () => {
  beforeEach(() => {
    // تنظيف التخزين قبل كل اختبار
    StorageService.clear();
  });

  test('تشفير كلمة المرور يجب أن يعمل بشكل صحيح', () => {
    const password = 'test123';
    const hashedPassword = AuthService.hashPassword(password);
    
    expect(hashedPassword).toBeTruthy();
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.includes(':')).toBeTruthy();
  });

  test('التحقق من كلمة المرور يجب أن يعمل بشكل صحيح', () => {
    const password = 'test123';
    const hashedPassword = AuthService.hashPassword(password);
    
    expect(AuthService.verifyPassword(password, hashedPassword)).toBeTruthy();
    expect(AuthService.verifyPassword('wrong', hashedPassword)).toBeFalsy();
  });

  test('تسجيل الدخول يجب أن يفشل مع بيانات غير صحيحة', () => {
    expect(() => {
      AuthService.login('nonexistent@test.com', 'wrong');
    }).toThrow('البريد الإلكتروني غير موجود');
  });

  test('تسجيل الخروج يجب أن يمسح بيانات المستخدم', () => {
    // تخزين بيانات مستخدم وهمي
    StorageService.setItem('auth_user', { id: 1, username: 'test' });
    
    AuthService.logout();
    
    expect(StorageService.getItem('auth_user')).toBeNull();
  });
});
