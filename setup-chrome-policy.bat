@echo off
echo ================================================
echo   CHROME AUTO-PRINT POLICY SETUP
echo ================================================
echo.
echo This will configure Chrome to allow automatic
echo printing without showing the print dialog.
echo.
echo IMPORTANT: This requires Administrator rights!
echo.
pause

echo.
echo Setting up Chrome policy for auto-print...
echo.

REM Create Chrome policy directory if it doesn't exist
if not exist "%ProgramFiles(x86)%\Google\Chrome\Application" (
    if not exist "%ProgramFiles%\Google\Chrome\Application" (
        echo ERROR: Chrome not found!
        echo Please install Google Chrome first.
        pause
        exit /b 1
    )
)

REM Create policy registry keys
echo Adding registry keys...

REM Enable kiosk printing
reg add "HKLM\SOFTWARE\Policies\Google\Chrome" /v "KioskPrintingEnabled" /t REG_DWORD /d 1 /f

REM Disable print preview
reg add "HKLM\SOFTWARE\Policies\Google\Chrome" /v "PrintPreviewUseSystemDefaultPrinter" /t REG_DWORD /d 1 /f

REM Set default printer behavior
reg add "HKLM\SOFTWARE\Policies\Google\Chrome" /v "DefaultPrinterSelection" /t REG_SZ /d "{\"kind\":\"default\"}" /f

echo.
echo ================================================
echo   POLICY SETUP COMPLETE!
echo ================================================
echo.
echo Chrome is now configured for automatic printing.
echo.
echo NEXT STEPS:
echo 1. Close ALL Chrome windows
echo 2. Run launch-kiosk.bat
echo 3. Test printing a ticket
echo.
echo If it still shows preview, you may need to:
echo - Restart your computer
echo - Or use the manual print button
echo.
pause
