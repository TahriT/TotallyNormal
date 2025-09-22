@echo off
REM Version Update Script for TotallyNormal (Windows)

if "%1"=="" (
    echo Usage: %0 ^<version^> [description]
    echo Example: %0 1.3.0 "Added new features and bug fixes"
    exit /b 1
)

set VERSION=%1
set DESCRIPTION=%2
if "%DESCRIPTION%"=="" set DESCRIPTION=Updated to version %VERSION%
set BUILD_DATE=%date:~10,4%-%date:~4,2%-%date:~7,2%

echo Updating TotallyNormal to version %VERSION%...

REM Update version.json
(
echo {
echo   "version": "%VERSION%",
echo   "name": "TotallyNormal PBR Generator",
echo   "buildDate": "%BUILD_DATE%",
echo   "description": "%DESCRIPTION%",
echo   "changes": [
echo     "Version %VERSION% release",
echo     "Updated build date to %BUILD_DATE%"
echo   ]
echo }
) > version.json

echo ✅ Updated version.json

REM Update service worker version
powershell -Command "(Get-Content sw.js) -replace 'const APP_VERSION = ''[^'']*'';', 'const APP_VERSION = ''%VERSION%'';' | Set-Content sw.js"
echo ✅ Updated sw.js APP_VERSION

REM Update textureGenerator.js version
powershell -Command "(Get-Content js\\textureGenerator.js) -replace 'this\.version = ''[^'']*'';', 'this.version = ''%VERSION%'';' | Set-Content js\\textureGenerator.js"
echo ✅ Updated textureGenerator.js version

REM Update HTML version parameters and add googleDrive.js version
powershell -Command "(Get-Content index.html) -replace '\?v=[0-9.]+', '?v=%VERSION%' | Set-Content index.html"
powershell -Command "(Get-Content index.html) -replace 'window\.APP_VERSION = ''[^'']*'';', 'window.APP_VERSION = ''%VERSION%'';' | Set-Content index.html"
echo ✅ Updated index.html version parameters

echo.
echo ✅ All files updated to version %VERSION%
echo 📝 Build date: %BUILD_DATE%
echo.
echo 🚀 Next steps:
echo    1. Test the application
echo    2. Commit: git add . ^&^& git commit -m "Release v%VERSION%: %DESCRIPTION%"
echo    3. Tag: git tag v%VERSION%
echo    4. Push: git push origin main --tags
echo.
echo 💡 The new caching strategy will:
echo    - Always fetch latest app files (JS/HTML/CSS)
echo    - Keep external resources cached for performance  
echo    - Preserve user materials in separate cache
echo    - No more manual cache clearing needed!
