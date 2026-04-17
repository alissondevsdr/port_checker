@echo off
start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"
echo Port Checker Web is starting...
echo Backend: http://localhost:3001 or http://192.168.1.188:3001
echo Frontend: http://localhost:5173 or http://192.168.1.188:5173
timeout /t 5 /nobreak > nul
start http://192.168.1.188:5173
