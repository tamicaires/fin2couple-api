# Script para regenerar o Prisma Client
# Execute este script no PowerShell

Write-Host "Parando processos Node.js..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Aguardando 2 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Regenerando Prisma Client..." -ForegroundColor Yellow
cd C:\Users\tamir\Work\development\freelas\finduo
npx prisma generate

Write-Host "Prisma Client regenerado com sucesso!" -ForegroundColor Green
Write-Host "Agora você pode executar: npm run start:dev" -ForegroundColor Cyan
