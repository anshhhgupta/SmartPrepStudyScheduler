# SmartPrepScheduler — start both servers
# Run from project root: .\start.ps1

Write-Host "`n=== SmartPrepScheduler ===" -ForegroundColor Cyan

# 1. Backend
Write-Host "`n[1/3] Installing Python dependencies..." -ForegroundColor Yellow
pip install -r backend/requirements.txt --quiet

Write-Host "[2/3] Seeding database..." -ForegroundColor Yellow
python backend/seed.py

Write-Host "[3/3] Starting Flask backend on http://localhost:5000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python backend/app.py" -WindowStyle Normal

Start-Sleep -Seconds 2

# 2. Frontend
Write-Host "`n[Frontend] Installing npm packages..." -ForegroundColor Yellow
Set-Location frontend
npm install --silent
Write-Host "[Frontend] Starting Vite dev server on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Set-Location ..

Write-Host "`n✅ Both servers started!" -ForegroundColor Green
Write-Host "   Backend  → http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "   Frontend → http://localhost:5173" -ForegroundColor Cyan
