@echo off
echo Starting MoneyBook Platform...

:: Start the backend server in a separate hidden window
start /B node server.js

:: Wait for a second
timeout /t 1 > nul

:: Start the Vite frontend server
echo Starting Frontend...
start /B npm run dev

:: Wait for Vite to boot up
timeout /t 2 > nul

:: Open the browser (we can use the local IP instead of localhost if needed, but localhost is fine for the host machine)
start http://localhost:5173

echo.
echo ========================================================
echo MoneyBook is running! 
echo To access from your phone or another PC on this network,
echo check your local IP address (e.g., http://192.168.x.x:5173)
echo ========================================================
echo.
echo Press any key to stop both servers and exit...
pause > nul

:: Kill node processes when exiting
taskkill /IM node.exe /F
exit
