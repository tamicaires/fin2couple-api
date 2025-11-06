# 🌐 Guia: Rodando Backend com ngrok para Vercel

Este guia explica como rodar o backend localmente e expô-lo publicamente via ngrok para que o frontend hospedado na Vercel possa acessá-lo.

## 📋 Pré-requisitos

### 1. Instalar o ngrok

**Opção 1: Download direto**
- Acesse: https://ngrok.com/download
- Baixe e instale para Windows
- Crie uma conta gratuita em https://dashboard.ngrok.com/signup
- Execute: `ngrok config add-authtoken SEU_TOKEN_AQUI`

**Opção 2: Via Chocolatey (Windows)**
```bash
choco install ngrok
```

### 2. Verificar instalação
```bash
ngrok version
```

## 🚀 Como usar

### Método 1: Script PowerShell (Recomendado para Windows)

1. Abra o PowerShell como Administrador

2. Se for a primeira vez, habilite execução de scripts:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. Execute o script:
```powershell
cd C:\Users\tamir\Work\development\freelas\fin2couple\fin2couple-api
.\start-with-ngrok.ps1
```

4. O script irá:
   - ✅ Iniciar o backend NestJS na porta 3000
   - ✅ Iniciar o ngrok e criar uma URL pública
   - ✅ Mostrar a URL pública gerada
   - ✅ Copiar a URL para o clipboard automaticamente

### Método 2: Script Bash (Git Bash/WSL)

```bash
cd C:\Users\tamir\Work\development\freelas\fin2couple\fin2couple-api
chmod +x start-with-ngrok.sh
./start-with-ngrok.sh
```

### Método 3: Manual (Duas janelas de terminal)

**Terminal 1 - Backend:**
```bash
cd C:\Users\tamir\Work\development\freelas\fin2couple\fin2couple-api
yarn start:dev
```

**Terminal 2 - ngrok:**
```bash
ngrok http 3000
```

## 🔗 Configurando o Frontend na Vercel

Depois que o ngrok iniciar, você verá uma URL como:
```
https://abcd-1234-5678.ngrok-free.app
```

### Passo a passo:

1. **Acesse o Dashboard da Vercel:**
   - https://vercel.com/dashboard

2. **Selecione seu projeto** (fincouple)

3. **Vá em Settings → Environment Variables**

4. **Adicione/Edite a variável:**
   - Name: `VITE_API_URL`
   - Value: `https://sua-url-ngrok.ngrok-free.app` (cole a URL do ngrok)
   - Environment: Production (e Development se quiser)

5. **Salve e faça Redeploy:**
   - Vá em Deployments → ⋮ (menu) → Redeploy

6. **Aguarde o deploy** (~30-60 segundos)

7. **Teste acessando:**
   - https://fincouple.facter.com.br

## ⚙️ Configurações Importantes

### CORS já configurado
O backend já está configurado para aceitar requisições de:
- ✅ `https://fincouple.facter.com.br`
- ✅ `https://*.vercel.app` (preview deployments)
- ✅ `http://localhost:5173` (desenvolvimento local)

### Banco de dados
O backend está conectado ao PostgreSQL hospedado na Neon (Vercel):
```
postgresql://neondb_owner:***@ep-aged-fire-a45okb18-pooler.us-east-1.aws.neon.tech/neondb
```

## 📱 Testando em múltiplos notebooks

### Notebook 1 (onde o backend está rodando):
1. Execute o script `start-with-ngrok.ps1`
2. Mantenha a janela aberta
3. Anote a URL do ngrok

### Notebook 2 (ou qualquer outro dispositivo):
1. Acesse diretamente: https://fincouple.facter.com.br
2. O frontend na Vercel usará o backend via ngrok

**Vantagens:**
- ✅ Não precisa rodar nada no Notebook 2
- ✅ Funciona em qualquer dispositivo (PC, celular, tablet)
- ✅ Ambos acessam o mesmo banco de dados
- ✅ Mudanças no backend aparecem em tempo real

## 🔍 Monitoramento

### Interface Web do ngrok
Acesse: http://localhost:4040

Aqui você pode ver:
- 📊 Todas as requisições HTTP em tempo real
- 🔍 Headers, body, status codes
- ⚡ Performance e latência
- 🔄 Repetir requisições

### Logs do Backend
Os logs do NestJS aparecem no terminal onde você rodou o script.

## ⚠️ Limitações da versão gratuita do ngrok

- ⏱️ URL muda cada vez que você reinicia o ngrok
- 🔢 Máximo de 40 requisições/minuto
- 🌐 Apenas 1 túnel online por vez
- ⏰ Sessão expira após 2 horas (reconecta automaticamente)

**Solução:** A cada vez que reiniciar o ngrok, atualize a variável `VITE_API_URL` na Vercel.

## 🎯 Plano Upgrade (Opcional)

Se precisar de URLs fixas, considere:

**ngrok Pro** ($8/mês):
- ✅ URLs personalizadas fixas (ex: `fincouple-api.ngrok.io`)
- ✅ Não precisa atualizar a Vercel toda vez
- ✅ Sem limite de requisições
- ✅ Múltiplos túneis simultâneos

## 🐛 Troubleshooting

### Erro: "ngrok não encontrado"
```bash
# Instale via Chocolatey
choco install ngrok

# Ou baixe em: https://ngrok.com/download
```

### Erro: "Backend não inicializou"
- Verifique se a porta 3000 está livre
- Verifique o arquivo .env
- Rode manualmente: `yarn start:dev`

### Erro: "authentication required"
```bash
# Configure seu token do ngrok
ngrok config add-authtoken SEU_TOKEN_AQUI
```

### Frontend não conecta ao backend
1. Verifique se o CORS está configurado (já está ✅)
2. Confirme que a URL do ngrok está correta na Vercel
3. Verifique o console do navegador (F12)
4. Teste direto a URL: `https://sua-url-ngrok.ngrok-free.app/health`

### Erro 403 ao acessar o ngrok
O ngrok gratuito pode mostrar uma tela de aviso. Clique em "Visit Site" para continuar.

## 📚 Próximos Passos

Quando estiver pronto para produção:

1. **Hospedar o backend na Vercel:**
   ```bash
   # No diretório do backend
   vercel deploy --prod
   ```

2. **Ou usar Railway/Render:**
   - Railway: https://railway.app (mais fácil)
   - Render: https://render.com (gratuito)

3. **Atualizar variável na Vercel:**
   ```
   VITE_API_URL=https://sua-api.vercel.app
   ```

## 💡 Dicas

- 💾 **Auto-save:** O script copia automaticamente a URL do ngrok para o clipboard
- 🔄 **Hot reload:** O backend recarrega automaticamente ao salvar arquivos
- 📊 **Monitoramento:** Use http://localhost:4040 para debug
- 🔐 **Segurança:** Nunca commite as chaves do .env no Git
