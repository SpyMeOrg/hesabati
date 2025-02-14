@echo off
echo تشغيل برنامج حسابي...
echo.

REM إنشاء مجلد البيانات إذا لم يكن موجوداً
if not exist "data" mkdir data

REM تشغيل البرنامج
start /B hesabati.exe

REM انتظار لحظة للتأكد من تشغيل الخادم
timeout /t 3 > nul

REM فتح المتصفح
start http://localhost:3000

echo تم تشغيل البرنامج بنجاح!
echo يمكنك الآن استخدام البرنامج من خلال المتصفح.
echo.
echo ملاحظة: لا تغلق هذه النافذة أثناء استخدام البرنامج.
echo.
pause 