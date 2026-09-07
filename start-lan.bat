@echo off
cd /d %~dp0

for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' } | Select-Object -First 1).IPAddress"') do set LANIP=%%i
if "%LANIP%"=="" set LANIP=192.168.0.132

echo ============================================
echo  Continental-Idle LAN starter
echo ============================================
echo  PC LAN IP : %LANIP%
echo.
echo  App (view on phone)   : http://%LANIP%:5173
echo  Prompt room (opencode): http://%LANIP%:4096
echo  OpenChamber (phone app): http://%LANIP%:3000
echo  Prompt room (name)    : http://opencode.local:4096
echo  PC local              : http://127.0.0.1:4096
echo ============================================
echo  Phone must be on SAME WiFi. No internet needed for LAN.
echo  Keep this window open. Close app windows with Ctrl+C.
echo ============================================
echo.

start "Continental-Idle App :5173" cmd /k "npm run dev -- --host=0.0.0.0 --port=5173"
start "opencode LAN :4096" cmd /k "opencode web --hostname 0.0.0.0 --port 4096 --mdns"

echo.
echo  OpenChamber needs a UI password for LAN (typed only, never saved):
echo.
set /p OCPASS=Type OpenChamber password (letters+digits) then Enter:
if "%OCPASS%"=="" set OCPASS=changeme123
start "OpenChamber :3000" cmd /k "set OPENCHAMBER_UI_PASSWORD=%OCPASS% && openchamber serve --lan -p 3000 --foreground"
set OCPASS=
echo.
echo  Pair phone once: PC browser http://127.0.0.1:3000
echo    Settings - Remote Instances - Connect to this server
echo    Add a device - Home network only - Create QR code - scan with app.
echo  Headless alternative on PC: openchamber connect-url --port 3000 --qr

echo  Three windows opened. Wait 10 sec for servers to start, then:
echo.
echo  SCAN WITH PHONE CAMERA - Prompt room:
echo.
call npx -y qrcode "http://%LANIP%:4096"
echo  http://%LANIP%:4096
echo.
echo  SCAN WITH PHONE CAMERA - App preview:
echo.
call npx -y qrcode "http://%LANIP%:5173"
echo  http://%LANIP%:5173
echo.
echo If QR looks broken, maximize this window or open Photos: PNGs also saved.
call npx -y qrcode -o qr-prompt.png "http://%LANIP%:4096"
call npx -y qrcode -o qr-app.png "http://%LANIP%:5173"
echo.
echo If phone cannot connect, run once as Admin:
echo   New-NetFirewallRule -DisplayName "opencode-lan" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4096
echo   New-NetFirewallRule -DisplayName "vite-lan" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173
echo   New-NetFirewallRule -DisplayName "openchamber-lan" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
echo.
pause
