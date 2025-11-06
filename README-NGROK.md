# 🚀 Guia Rápido: Backend com ngrok

## ⚡ Start Rápido

```bash
# Opção 1: Usando yarn (mais fácil)
yarn start:ngrok

# Opção 2: Script direto
.\start-with-ngrok.ps1
```

## 📋 O que vai acontecer:

1. ✅ Backend inicia na porta 3000
2. ✅ ngrok cria uma URL pública (ex: `https://abc123.ngrok-free.app`)
3. ✅ URL é copiada automaticamente para o clipboard
4. ✅ Você vê todas as informações necessárias no terminal

## 🔗 Conectar com Frontend na Vercel

### 1. Copie a URL do ngrok
Exemplo: `https://1234-abcd-5678.ngrok-free.app`

### 2. Atualize na Vercel
- Acesse: https://vercel.com/dashboard
- Projeto: fincouple
- Settings → Environment Variables
- Edite: `VITE_API_URL`
- Cole a URL do ngrok
- Salve e Redeploy

### 3. Teste
Acesse: https://fincouple.facter.com.br

## ⚠️ IMPORTANTE

- 🔴 Mantenha a janela do terminal ABERTA
- 🔴 Se fechar, o backend para
- 🔴 A cada vez que reiniciar, a URL muda
- 🔴 Atualize a URL na Vercel sempre que reiniciar

## 📝 Checklist Rápido

```
□ ngrok instalado? (https://ngrok.com/download)
□ ngrok autenticado? (ngrok config add-authtoken TOKEN)
□ Rodou: yarn start:ngrok
□ Copiou a URL do ngrok
□ Atualizou VITE_API_URL na Vercel
□ Fez Redeploy na Vercel
□ Testou: https://fincouple.facter.com.br
```

## 🐛 Problemas?

**ngrok não encontrado:**
```bash
choco install ngrok
# ou baixe: https://ngrok.com/download
```

**Porta 3000 ocupada:**
```bash
# Windows: encontrar processo
netstat -ano | findstr :3000
# Matar processo (substitua PID)
taskkill /PID <número> /F
```

**Backend não inicia:**
```bash
# Verificar .env existe
# Verificar banco de dados
yarn start:dev
```

## 📚 Documentação Completa

Para mais detalhes, veja: `NGROK-SETUP.md`

## 💡 Dicas

- 📊 Monitor de requisições: http://localhost:4040
- 🔄 Hot reload ativo (salvar arquivo = recarregar)
- 📋 URL copiada automaticamente para clipboard
- 🌐 Funciona em qualquer dispositivo com internet

## 🎯 Resumo Visual

```
┌─────────────────┐
│   Seu Notebook  │
│                 │
│  Backend :3000  │◄──── yarn start:ngrok
└────────┬────────┘
         │
         │ ngrok tunnel
         ▼
┌─────────────────────────────┐
│  https://abc123.ngrok.app   │◄──── Copie esta URL
└─────────────┬───────────────┘
              │
              │ Configure na Vercel
              ▼
┌──────────────────────────────┐
│  VITE_API_URL na Vercel      │
│  + Redeploy                  │
└──────────────┬───────────────┘
               │
               │ Pronto!
               ▼
┌───────────────────────────────┐
│ fincouple.facter.com.br       │
│ (funciona em qualquer lugar)  │
└───────────────────────────────┘
```

## 🎉 Pronto!

Agora você pode desenvolver no backend localmente e acessar de qualquer lugar através do domínio da Vercel!
