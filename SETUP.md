# FINDUO - Setup Guide

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

## 1. Configurar Banco de Dados

### Usando Docker (Recomendado)

```bash
docker run --name finduo-postgres \
  -e POSTGRES_USER=finduo \
  -e POSTGRES_PASSWORD=finduo123 \
  -e POSTGRES_DB=finduo \
  -p 5432:5432 \
  -d postgres:14
```

### Ou instale PostgreSQL localmente

Crie um banco de dados chamado `finduo`.

## 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` com suas credenciais:

```env
# Database
DATABASE_URL="postgresql://finduo:finduo123@localhost:5432/finduo?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Application
PORT=3000
NODE_ENV="development"
```

## 3. Instalar Dependências

```bash
npm install
```

## 4. Executar Migrations

```bash
npx prisma migrate deploy
# ou para desenvolvimento:
npx prisma migrate dev
```

## 5. Popular Banco de Dados (Seed)

```bash
npx prisma db seed
```

Isso irá criar:
- ✅ 2 Planos (FREE e PREMIUM)
- ✅ 2 Usuários de teste (João e Maria)
- ✅ 1 Casal já configurado
- ✅ 1 Subscription FREE
- ✅ 2 Contas bancárias
- ✅ 5 Transações de exemplo

## 6. Iniciar Aplicação

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 7. Acessar Swagger

Abra o navegador em: **http://localhost:3000/api/docs**

## 🔐 Credenciais de Teste

Use estas credenciais para testar no Swagger:

### Usuário 1 (João)
- **Email**: `joao@test.com`
- **Senha**: `123456`

### Usuário 2 (Maria)
- **Email**: `maria@test.com`
- **Senha**: `123456`

## 📝 Como Testar no Swagger

### 1. Fazer Login

1. Acesse `POST /auth/sign-in`
2. Use o corpo:
```json
{
  "email": "joao@test.com",
  "password": "123456"
}
```
3. Copie o `access_token` da resposta

### 2. Autorizar no Swagger

1. Clique no botão "Authorize" 🔓 no topo da página
2. Digite: `Bearer SEU_TOKEN_AQUI`
3. Clique em "Authorize"

### 3. Testar Endpoints

Agora você pode testar todos os endpoints protegidos:

- **GET /couple/dashboard** - Ver dashboard do casal
- **GET /accounts** - Listar contas
- **POST /accounts** - Criar nova conta
- **GET /transactions** - Listar transações
- **POST /transactions** - Registrar nova transação
- **PATCH /couple/free-spending** - Atualizar gastos livres

## 🏗️ Estrutura do Projeto

```
finduo/
├── prisma/
│   ├── migrations/        # Migrations do banco
│   ├── schema.prisma      # Schema do Prisma
│   └── seed.ts           # Dados de teste
├── src/
│   ├── application/      # Use Cases (Regras de negócio)
│   ├── core/             # Entities, Enums, Exceptions
│   ├── infra/            # Database, Logging, HTTP
│   └── presenters/       # Controllers, DTOs
└── .env                  # Variáveis de ambiente
```

## 🧪 Comandos Úteis

```bash
# Build do projeto
npm run build

# Rodar testes
npm test

# Lint
npm run lint

# Formatar código
npm run format

# Resetar banco de dados
npx prisma migrate reset

# Visualizar banco no Prisma Studio
npx prisma studio
```

## 📊 Prisma Studio

Para visualizar/editar dados diretamente:

```bash
npx prisma studio
```

Abre em: **http://localhost:5555**

## 🔄 Dados de Exemplo no Seed

### Planos
- **FREE**: 2 contas, 100 transações/mês
- **PREMIUM**: 10 contas, transações ilimitadas

### Casal João + Maria
- **Free Spending Mensal**: R$ 500,00 cada
- **Free Spending Restante**:
  - João: R$ 350,00
  - Maria: R$ 450,00

### Contas
1. **Conta Corrente João**: R$ 2.500,00
2. **Conta Poupança Maria**: R$ 5.000,00

### Transações
- ✅ Salário João: +R$ 5.000,00
- ✅ Salário Maria: +R$ 6.000,00
- ✅ Compra Shopping (João): -R$ 150,00 (free spending)
- ✅ Academia (Maria): -R$ 50,00 (free spending)
- ✅ Supermercado: -R$ 450,00 (gasto conjunto)

## 🛠️ Troubleshooting

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker ps

# Reiniciar container
docker restart finduo-postgres
```

### Erro ao rodar migrations
```bash
# Resetar banco e rodar tudo de novo
npx prisma migrate reset
npx prisma db seed
```

### Erro "Cannot find module"
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```
