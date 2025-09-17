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

REM Note: Manual updates needed for sw.js and textureGenerator.js
echo ⚠️  Manual updates required:
echo    1. sw.js: Change APP_VERSION to '%VERSION%'
echo    2. js/textureGenerator.js: Change this.version to '%VERSION%'

echo.
echo ✅ Updated version.json to %VERSION%
echo 📝 Build date: %BUILD_DATE%
echo.
echo 🚀 Next steps:
echo    1. Update APP_VERSION in sw.js
echo    2. Update this.version in textureGenerator.js
echo    3. Commit: git add . ^&^& git commit -m "Release v%VERSION%: %DESCRIPTION%"
echo    4. Tag: git tag v%VERSION%
echo    5. Push: git push origin main --tags
