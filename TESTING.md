# 🧪 Quick Testing Guide - FINDUO

## 🚀 Quick Start

```bash
# 1. Start PostgreSQL (Docker)
docker run --name finduo-postgres -e POSTGRES_USER=finduo -e POSTGRES_PASSWORD=finduo123 -e POSTGRES_DB=finduo -p 5432:5432 -d postgres:14

# 2. Run migrations
npx prisma migrate deploy

# 3. Seed database
npx prisma db seed

# 4. Start app
npm run start:dev

# 5. Open Swagger
# http://localhost:3000/api/docs
```

## 🔑 Test Credentials

| User | Email | Password |
|------|-------|----------|
| João | `joao@test.com` | `123456` |
| Maria | `maria@test.com` | `123456` |

## 📋 API Endpoints Reference

### 🔓 Public Endpoints

#### Sign Up (Create New User)
```http
POST /auth/sign-up
Content-Type: application/json

{
  "email": "novo@test.com",
  "password": "123456",
  "name": "Novo Usuário"
}
```

#### Sign In (Login)
```http
POST /auth/sign-in
Content-Type: application/json

{
  "email": "joao@test.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "joao@test.com",
    "name": "João Silva"
  }
}
```

### 🔒 Protected Endpoints (Require JWT Token)

> **Important:** Add token to Swagger by clicking "Authorize" 🔓 button
>
> Format: `Bearer YOUR_TOKEN_HERE`

#### Get Couple Dashboard
```http
GET /couple/dashboard
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "couple_id": "uuid",
  "user_a": {
    "id": "uuid",
    "name": "João Silva",
    "free_spending_monthly": 500.00,
    "free_spending_remaining": 350.00
  },
  "user_b": {
    "id": "uuid",
    "name": "Maria Santos",
    "free_spending_monthly": 500.00,
    "free_spending_remaining": 450.00
  },
  "total_balance": 7500.00,
  "subscription": {
    "plan": "FREE",
    "status": "TRIAL",
    "end_date": "2025-02-24T00:00:00.000Z"
  }
}
```

#### Update Free Spending
```http
PATCH /couple/free-spending
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "free_spending_a_monthly": 600.00,
  "free_spending_b_monthly": 600.00
}
```

#### List Accounts
```http
GET /accounts
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "name": "Conta Corrente João",
      "type": "CHECKING",
      "current_balance": 2500.00,
      "owner_id": "uuid"
    }
  ],
  "total_balance": 7500.00
}
```

#### Create Account
```http
POST /accounts
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "name": "Conta Investimentos",
  "type": "INVESTMENT",
  "initial_balance": 10000.00
}
```

**Account Types:**
- `CHECKING` - Conta Corrente
- `SAVINGS` - Poupança
- `INVESTMENT` - Investimentos
- `CASH` - Dinheiro
- `CREDIT_CARD` - Cartão de Crédito

#### List Transactions
```http
GET /transactions?limit=20
Authorization: Bearer YOUR_TOKEN_HERE
```

**Query Parameters:**
- `limit` - Number of transactions (default: 50)
- `cursor` - For pagination
- `type` - Filter by INCOME or EXPENSE
- `category` - Filter by category
- `is_free_spending` - Filter by free spending (true/false)

#### Register Transaction
```http
POST /transactions
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "account_id": "uuid-of-account",
  "type": "EXPENSE",
  "amount": 150.00,
  "category": "GROCERIES",
  "description": "Compras do supermercado",
  "is_free_spending": false
}
```

**Transaction Types:**
- `INCOME` - Receita
- `EXPENSE` - Despesa

**Transaction Categories:**
- `GROCERIES` - Mercado
- `RESTAURANTS` - Restaurantes
- `TRANSPORTATION` - Transporte
- `UTILITIES` - Contas (água, luz, etc)
- `HOUSING` - Moradia
- `HEALTHCARE` - Saúde
- `ENTERTAINMENT` - Entretenimento
- `SHOPPING` - Compras
- `EDUCATION` - Educação
- `TRAVEL` - Viagens
- `SAVINGS` - Poupança
- `INVESTMENTS` - Investimentos
- `SALARY` - Salário
- `FREELANCE` - Freelance
- `BONUS` - Bônus
- `GIFT` - Presente
- `OTHER` - Outros

#### Delete Transaction
```http
DELETE /transactions/:id
Authorization: Bearer YOUR_TOKEN_HERE
```

## 🎯 Test Scenarios

### Scenario 1: Complete Flow - New User
1. **Sign Up** → Create account
2. **Sign In** → Get token
3. **Create Couple** → Partner with another user
4. **Create Account** → Add bank account
5. **Register Transaction** → Add income
6. **View Dashboard** → See results

### Scenario 2: Existing User (João)
1. **Sign In** with `joao@test.com`
2. **View Dashboard** → See couple data
3. **List Accounts** → See 2 existing accounts
4. **List Transactions** → See 5 sample transactions
5. **Register New Transaction** → Test free spending deduction
6. **View Dashboard Again** → See updated balances

### Scenario 3: Free Spending Test
1. Sign in as João
2. View dashboard → Note current `free_spending_remaining`
3. Register expense with `is_free_spending: true`
4. View dashboard again → See reduced free spending
5. Try to spend more than remaining → Should fail

## 📊 Seeded Data Overview

### Plans
- **FREE**: 2 accounts max, 100 transactions/month
- **PREMIUM**: 10 accounts max, unlimited transactions

### Users
- **João Silva**: joao@test.com (User A in couple)
- **Maria Santos**: maria@test.com (User B in couple)

### Couple
- Free Spending: R$ 500/month each
- Current Remaining: João R$ 350 | Maria R$ 450

### Accounts
1. **Conta Corrente João**: R$ 2.500,00 (CHECKING)
2. **Conta Poupança Maria**: R$ 5.000,00 (SAVINGS)

### Transactions (Sample)
- João Salary: +R$ 5.000,00
- Maria Salary: +R$ 6.000,00
- Shopping (João): -R$ 150,00 (free spending)
- Gym (Maria): -R$ 50,00 (free spending)
- Groceries: -R$ 450,00 (couple expense)

## 🐛 Common Issues

### "Unauthorized" Error
- Make sure you copied the full token
- Check if token is prefixed with `Bearer `
- Token expires in 7 days, get a new one by signing in again

### "Account limit exceeded"
- FREE plan allows max 2 accounts
- Delete an account or upgrade to PREMIUM

### "Insufficient free spending"
- Check remaining free spending in dashboard
- Use `is_free_spending: false` for couple expenses
- Or update free spending limits

## 🔄 Reset Database

To start fresh:

```bash
npx prisma migrate reset
# This will drop all data and run migrations + seed
```

## 📱 Useful cURL Examples

### Sign In
```bash
curl -X POST http://localhost:3000/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@test.com","password":"123456"}'
```

### Get Dashboard (with token)
```bash
curl -X GET http://localhost:3000/couple/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Transaction
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "ACCOUNT_UUID",
    "type": "EXPENSE",
    "amount": 100.00,
    "category": "GROCERIES",
    "description": "Supermercado",
    "is_free_spending": false
  }'
```
