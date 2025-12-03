@echo off
echo ================================================
echo   KIOSK MODE - AUTO PRINT SETUP
echo ================================================
echo.
echo IMPORTANT: Make sure you have:
echo 1. Dev server running (npm run dev)
echo 2. Gprinter GP-1424D set as DEFAULT printer
echo 3. Chrome browser installed
echo.
echo This will:
echo - Close all Chrome windows
echo - Launch in kiosk mode
echo - Enable automatic printing (no dialog!)
echo.
pause

echo.
echo Closing Chrome...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting kiosk mode...
echo.

REM Launch Chrome in kiosk mode with auto-print enabled
REM IMPORTANT: Print preview MUST be enabled for kiosk-printing to work!
REM The preview will appear briefly then auto-print to default printer
start chrome.exe ^
  --kiosk ^
  --kiosk-printing ^
  --no-first-run ^
  --no-default-browser-check ^
  --disable-popup-blocking ^
  "http://localhost:3000/kiosk"

echo.
echo ================================================
echo   KIOSK MODE ACTIVE
echo ================================================
echo.
echo Tickets will print automatically to:
echo Gprinter GP-1424D (default printer)
echo.
echo To EXIT kiosk mode:
echo - Press Alt + F4
echo - Or press Ctrl + W
echo.
echo ================================================
