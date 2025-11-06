#!/bin/bash

# Script para iniciar o backend e expor via ngrok
# Uso: ./start-with-ngrok.sh

echo "🚀 Iniciando Fin2Couple Backend com ngrok..."
echo ""

# Verifica se o ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok não encontrado!"
    echo "📦 Instale o ngrok:"
    echo "   wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz"
    echo "   tar xvzf ngrok-v3-stable-linux-amd64.tgz"
    echo "   sudo mv ngrok /usr/local/bin/"
    exit 1
fi

echo "✅ ngrok encontrado"

# Verifica se o yarn está instalado
if ! command -v yarn &> /dev/null; then
    echo "❌ yarn não encontrado!"
    exit 1
fi

echo "✅ yarn encontrado"
echo ""

# Define a porta (padrão 3000)
PORT=${PORT:-3000}

echo "📋 Configurações:"
echo "   Porta: $PORT"
echo "   Banco: Neon (Vercel)"
echo "   Frontend: https://fincouple.facter.com.br"
echo ""

# Inicia o backend em background
echo "🔵 Iniciando backend NestJS..."
yarn start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Aguarda o backend iniciar (máximo 30 segundos)
echo "⏳ Aguardando backend inicializar..."
WAIT_TIME=0
MAX_WAIT=30

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    # Verifica se a porta está aberta
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
        break
    fi

    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
    echo -ne "   Aguardando... ${WAIT_TIME}s\r"
done

echo ""

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "❌ Backend não inicializou em ${MAX_WAIT}s"
    echo "📋 Logs do backend:"
    tail -20 /tmp/backend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend rodando na porta $PORT"
echo ""

# Inicia o ngrok
echo "🌐 Iniciando ngrok..."
echo "   Isso criará uma URL pública para o backend"
echo ""

# Inicia ngrok em background e captura a saída
ngrok http $PORT > /dev/null &
NGROK_PID=$!

# Aguarda alguns segundos para o ngrok iniciar
sleep 3

# Tenta obter a URL da API do ngrok
MAX_RETRIES=10
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

    if [ ! -z "$PUBLIC_URL" ]; then
        echo ""
        echo "=========================================="
        echo "✅ BACKEND PÚBLICO DISPONÍVEL!"
        echo "=========================================="
        echo ""
        echo "🔗 URL do Backend (ngrok):"
        echo "   $PUBLIC_URL"
        echo ""
        echo "📝 PRÓXIMOS PASSOS:"
        echo ""
        echo "1. No frontend (Vercel), atualize a variável de ambiente:"
        echo "   VITE_API_URL=$PUBLIC_URL"
        echo ""
        echo "2. Faça um novo deploy do frontend na Vercel para aplicar"
        echo ""
        echo "3. Teste a conexão acessando:"
        echo "   https://fincouple.facter.com.br"
        echo ""
        echo "=========================================="
        echo ""
        echo "⚠️  Mantenha esta janela aberta!"
        echo "   O backend ficará rodando enquanto esta janela estiver aberta"
        echo ""
        echo "   Pressione Ctrl+C para parar"
        echo ""
        echo "📊 Monitor ngrok: http://localhost:4040"
        echo ""
        break
    fi

    sleep 1
    RETRY=$((RETRY + 1))
done

if [ -z "$PUBLIC_URL" ]; then
    echo "⚠️  Não foi possível obter a URL automaticamente"
    echo "   Acesse http://localhost:4040 para ver a URL do ngrok"
    echo ""
fi

# Cleanup quando o script for interrompido
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Mantém o script rodando
wait
