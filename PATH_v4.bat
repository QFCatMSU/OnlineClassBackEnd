@echo off
:: PATH_v4.bat by Charlie Belinsky 
:: 07/15/20

:: This batch file will
::   1) Get the four paths the need to be in the PATH User Environment
::   2) Get the current PATH 
::   3) Reformat the PATH to correct for slashes are semicolons
::   4) Prepend to the PATH any of the four paths needed that are not in the User PATH
::   5) Set the editted path as the new User PATH 

:: This batch file DOES NOT REMOVE anything from the old User PATH Environemnt variable

:: The four paths that need to be in the PATH USer Environment are:
::   1) c:\Program Files\R\R-?.?.?\bin;  The ? represent the R version number
::   2) c:\ADMB\admb???-gcc???-win64;    The ? represent the ADMB version and the gcc compiler version
::   3) c:\rtools40\MINGW_64\bin;
::   4) c:\rtools40\usr\bin;

:: looks for latest R installation -- sets the R bin folder as R_PATH
for /d %%D in ("c:\Program Files\R\R-?.?.?") do set R_PATH=%%~fD\bin;
:: looks for latest ADMB installation -- sets the ADMB bin folder as ADMB_PATH
for /d %%D in ("c:\ADMB\admb???-gcc???-win64") do set ADMB_PATH=%%~fD\bin;
:: the folder with the g++ compiler
set RTOOLS_MINGW_PATH=c:\rtools40\mingw64\bin;
:: the rtools\bin folder has make.exe and sed.exe
set RTOOLS_PATH=c:\rtools40\usr\bin;


::Get the current user PATH environment variable and save it to OLD_USER_PATH
for /F "tokens=2* delims= " %%f IN ('reg query HKCU\Environment /v PATH ^| findstr /i path') do set OLD_USER_PATH=%%g

::Change all backslashes to frontslashes if there was a PATH variable (they are equivalent in environment)
if not "%OLD_USER_PATH%"=="" (set OLD_USER_PATH=%OLD_USER_PATH:/=\%)

:: add a semicolon to the end of the path if there is not one
if not "%OLD_USER_PATH:~-1%"==";" (set OLD_USER_PATH=%OLD_USER_PATH%;)

:: Display the current PATH variable for the user and save the PATH variable to temp file 
::  Would be better to save PATH to a variable but I am not sure yet how to do this yet...
echo old path: %OLD_USER_PATH%
echo %OLD_USER_PATH% > %temp%/test.txt

::Check for, and add if not present, the ADMB path
findstr /i /c:"%ADMB_PATH%" %temp%\test.txt >nul 2>&1
if %errorlevel% GTR 0 (set "APPENDED_PATH=%APPENDED_PATH%%ADMB_PATH%")

::Check for, and add if not present, the rtool minGW path
findstr /i /c:"%RTOOLS_MINGW_PATH%" %temp%\test.txt >nul 2>&1
if %errorlevel% GTR 0 (set "APPENDED_PATH=%APPENDED_PATH%%RTOOLS_MINGW_PATH%")

::Check for, and add if not present, the R path
findstr /i /c:"%R_PATH%" %temp%\test.txt >nul 2>&1
if %errorlevel% GTR 0 (set "APPENDED_PATH=%APPENDED_PATH%%R_PATH%")

::Check for, and add if not present, the RTools path
findstr /i /c:"%RTOOLS_PATH%" %temp%\test.txt >nul 2>&1
if %errorlevel% GTR 0 (set "APPENDED_PATH=%APPENDED_PATH%%RTOOLS_PATH%")

echo new path: "%APPENDED_PATH%%OLD_USER_PATH%"

::set the new user PATH variable
setx PATH "%APPENDED_PATH%%OLD_USER_PATH%"

::User hits button to exit (so we can view the progress)
pause