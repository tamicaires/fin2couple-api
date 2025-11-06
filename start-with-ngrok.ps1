# Script PowerShell para iniciar o backend e expor via ngrok
# Uso: .\start-with-ngrok.ps1

Write-Host "🚀 Iniciando Fin2Couple Backend com ngrok..." -ForegroundColor Cyan
Write-Host ""

# Verifica se o ngrok está instalado
$ngrokExists = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokExists) {
    Write-Host "❌ ngrok não encontrado!" -ForegroundColor Red
    Write-Host "📦 Instale o ngrok em: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "   Ou use: choco install ngrok (Windows com Chocolatey)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ ngrok encontrado" -ForegroundColor Green

# Verifica se o yarn está instalado
$yarnExists = Get-Command yarn -ErrorAction SilentlyContinue
if (-not $yarnExists) {
    Write-Host "❌ yarn não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ yarn encontrado" -ForegroundColor Green
Write-Host ""

# Define a porta (padrão 3000)
$PORT = if ($env:PORT) { $env:PORT } else { 3000 }

Write-Host "📋 Configurações:" -ForegroundColor Cyan
Write-Host "   Porta: $PORT"
Write-Host "   Banco: Neon (Vercel)"
Write-Host "   Frontend: https://fincouple.facter.com.br"
Write-Host ""

# Inicia o backend em background
Write-Host "🔵 Iniciando backend NestJS..." -ForegroundColor Blue
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    yarn start:dev
}

# Aguarda o backend iniciar
Write-Host "⏳ Aguardando backend inicializar..." -ForegroundColor Yellow
$maxWait = 30
$waited = 0

while ($waited -lt $maxWait) {
    $connection = Test-NetConnection -ComputerName localhost -Port $PORT -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        break
    }
    Start-Sleep -Seconds 1
    $waited++
    Write-Host "   Aguardando... ${waited}s" -NoNewline
    Write-Host "`r" -NoNewline
}

Write-Host ""

if ($waited -ge $maxWait) {
    Write-Host "❌ Backend não inicializou em ${maxWait}s" -ForegroundColor Red
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

Write-Host "✅ Backend rodando na porta $PORT" -ForegroundColor Green
Write-Host ""

# Inicia o ngrok
Write-Host "🌐 Iniciando ngrok..." -ForegroundColor Cyan
Write-Host "   Isso criará uma URL pública para o backend"
Write-Host ""

# Cria um arquivo temporário para capturar a URL do ngrok
$ngrokLogFile = "$env:TEMP\ngrok-url.txt"

# Inicia o ngrok e aguarda a URL
$ngrokJob = Start-Job -ScriptBlock {
    param($port)
    ngrok http $port --log=stdout
} -ArgumentList $PORT

# Aguarda alguns segundos para o ngrok iniciar
Start-Sleep -Seconds 3

# Tenta obter a URL da API do ngrok
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    $publicUrl = $response.tunnels[0].public_url

    if ($publicUrl -like "https://*") {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "✅ BACKEND PÚBLICO DISPONÍVEL!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔗 URL do Backend (ngrok):" -ForegroundColor Cyan
        Write-Host "   $publicUrl" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. No frontend (Vercel), atualize a variável de ambiente:" -ForegroundColor White
        Write-Host "   VITE_API_URL=$publicUrl" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "2. Faça um novo deploy do frontend na Vercel para aplicar" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Teste a conexão acessando:" -ForegroundColor White
        Write-Host "   https://fincouple.facter.com.br" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  Mantenha esta janela aberta!" -ForegroundColor Yellow
        Write-Host "   O backend ficará rodando enquanto esta janela estiver aberta"
        Write-Host ""
        Write-Host "   Pressione Ctrl+C para parar"
        Write-Host ""

        # Copia a URL para o clipboard
        Set-Clipboard -Value $publicUrl
        Write-Host "📋 URL copiada para o clipboard!" -ForegroundColor Green
        Write-Host ""
    }
} catch {
    Write-Host "⚠️  Não foi possível obter a URL automaticamente" -ForegroundColor Yellow
    Write-Host "   Acesse http://localhost:4040 para ver a URL do ngrok" -ForegroundColor Yellow
}

# Aguarda interrupção
Write-Host "Pressione Ctrl+C para parar os serviços..." -ForegroundColor Gray

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Parando serviços..." -ForegroundColor Red
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $ngrokJob -ErrorAction SilentlyContinue
    Remove-Job $ngrokJob -ErrorAction SilentlyContinue
}
