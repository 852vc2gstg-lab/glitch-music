@echo off
setlocal
cd /d "%~dp0"

set "PORT=8080"
set "OUT_FILE=links.txt"

where python >nul 2>nul
if errorlevel 1 (
  echo [HATA] Python bulunamadi. Once Python kur.
  pause
  exit /b 1
)

where ngrok >nul 2>nul
if errorlevel 1 (
  echo [HATA] ngrok bulunamadi. ngrok kurulumu yapip PATH'e eklemelisin.
  echo Ornek: ngrok config add-authtoken SENIN_TOKEN
  pause
  exit /b 1
)

echo.
echo [1/3] Yerel HTTP sunucusu baslatiliyor (Port %PORT%)...
start "Music Share - HTTP %PORT%" cmd /k "cd /d \"%cd%\" && python -m http.server %PORT%"

timeout /t 2 /nobreak >nul

echo [2/3] ngrok baslatiliyor...
start "Music Share - ngrok %PORT%" cmd /k "cd /d \"%cd%\" && ngrok http %PORT%"

echo [3/3] Public URL bekleniyor ve link listesi uretiliyor...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0oneclick-share.ps1" -Port %PORT% -OutputFile "%OUT_FILE%" -WaitSeconds 30

if exist "%OUT_FILE%" (
  echo.
  echo Tamamlandi: "%OUT_FILE%"
  echo.
  echo Not: Linkler yalnizca bu iki terminal acikken calisir.
) else (
  echo.
  echo [UYARI] Link dosyasi olusturulamadi. ngrok'un acildigini kontrol et.
)

echo.
pause

