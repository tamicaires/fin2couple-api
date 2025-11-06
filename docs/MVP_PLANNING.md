# FINDUO - MVP PLANNING & ARCHITECTURE

## 🎯 VISÃO GERAL DO PRODUTO
**SaaS de Gestão Financeira para Casais com Gasto Livre Individual**

### Problema que Resolve
- Transparência financeira total entre casais
- Autonomia individual através do conceito "Gasto Livre"
- Gestão compartilhada sem perder privacidade

---

## 📋 FUNCIONALIDADES DO MVP

### 1. AUTENTICAÇÃO E ONBOARDING
#### 1.1 Registro de Usuário
- [ ] Criar conta individual (email + senha)
- [ ] Validação de email
- [ ] Hash de senha com bcrypt (salt rounds: 10)

#### 1.2 Autenticação
- [ ] Login com JWT (access token)
- [ ] Refresh token strategy
- [ ] Logout

#### 1.3 Criação do Casal (Tenant)
- [ ] Vincular dois usuários existentes
- [ ] Definir Gasto Livre mensal de cada parceiro
- [ ] Definir dia de reset do Gasto Livre (1-31)
- [ ] Criar Subscription padrão (Plano FREE - Trial 30 dias)

---

### 2. GESTÃO DE CONTAS BANCÁRIAS
#### 2.1 Criar Conta
- [ ] Conta Individual (pertence a um dos parceiros)
- [ ] Conta Conjunta (owner_id = null)
- [ ] Validar limite de contas do plano
- [ ] Definir saldo inicial

#### 2.2 Listar Contas
- [ ] Ver todas as contas do casal
- [ ] Filtrar por tipo (individual/conjunta)
- [ ] Ver saldo consolidado

#### 2.3 Editar/Deletar Conta
- [ ] Editar nome e saldo
- [ ] Soft delete com validação

---

### 3. GESTÃO DE TRANSAÇÕES
#### 3.1 Registrar Transação
- [ ] RECEITA (INCOME): Salário, freelance, etc
- [ ] DESPESA (EXPENSE): Compras, contas, etc
- [ ] Definir: valor, descrição, categoria, data
- [ ] Definir quem pagou (paid_by_id)
- [ ] Definir se é gasto conjunto ou individual (is_couple_expense)
- [ ] Atualizar saldo da conta automaticamente

#### 3.2 Regra de Gasto Livre (CORE FEATURE)
**Quando uma DESPESA individual é registrada:**
- [ ] Se `is_couple_expense = false` E `type = EXPENSE`
- [ ] Deduzir do `free_spending_X_remaining` do usuário que pagou
- [ ] Emitir evento `TransactionRegisteredEvent`
- [ ] Listener atualiza o Gasto Livre Restante no banco

#### 3.3 Listar Transações
- [ ] Ver histórico completo do casal
- [ ] Filtrar por: período, tipo, categoria, quem pagou
- [ ] Paginação

#### 3.4 Editar/Deletar Transação
- [ ] Reverter cálculo de Gasto Livre ao deletar
- [ ] Recalcular ao editar

---

### 4. DASHBOARD DO CASAL
#### 4.1 Visão Financeira Compartilhada
- [ ] **Saldo Total do Casal**: Soma de todas as contas
- [ ] **Receitas do Mês**: Total de INCOME
- [ ] **Despesas do Mês**: Total de EXPENSE
- [ ] **Gastos Conjuntos do Mês**: Despesas onde `is_couple_expense = true`

#### 4.2 Gasto Livre Individual
- [ ] **Gasto Livre de A**:
  - Mensal configurado
  - Restante no mês
  - Percentual usado
- [ ] **Gasto Livre de B**:
  - Mensal configurado
  - Restante no mês
  - Percentual usado

#### 4.3 Gráficos (opcional MVP)
- [ ] Evolução mensal de receitas/despesas
- [ ] Top 5 categorias de gastos

---

### 5. SUBSCRIPTION & PLANOS (SaaS CORE)
#### 5.1 Planos Disponíveis
**FREE (Trial 30 dias)**
- Max 3 contas
- Max 50 transações/mês
- Features básicas

**PRO (R$ 19,90/mês)**
- Max 10 contas
- Transações ilimitadas
- Relatórios avançados
- Categorias customizadas

**PREMIUM (R$ 39,90/mês)**
- Contas ilimitadas
- Múltiplos casais (para terapeutas financeiros)
- API access
- Suporte prioritário

#### 5.2 Funcionalidades
- [ ] Verificar limites antes de criar Conta
- [ ] Verificar limites antes de criar Transação
- [ ] UseCase: `CheckCoupleSubscriptionLimitUseCase`
- [ ] Bloquear funcionalidades se plano expirado

---

### 6. RESET MENSAL DO GASTO LIVRE
#### 6.1 Job Agendado (CRON)
- [ ] Rodar diariamente às 00:00
- [ ] Verificar casais com `reset_day = hoje`
- [ ] Resetar `free_spending_X_remaining` = `free_spending_X_monthly`
- [ ] Log de execução

---

## 🏗️ ARQUITETURA TÉCNICA

### STACK
```
- NestJS (Framework)
- TypeScript (Strict mode)
- Prisma (ORM)
- PostgreSQL (Database)
- Redis (Cache/Session)
- JWT (Authentication)
- EventEmitter (Reactive logic)
- class-validator (DTO validation)
- class-transformer (DTO transformation)
- Jest (Unit tests)
```

---

## 📁 ESTRUTURA DE CÓDIGO (Clean Architecture)

```
src/
├── core/
│   ├── domain/
│   │   ├── entities/          # Domain models (NO Prisma types)
│   │   │   ├── user.entity.ts
│   │   │   ├── couple.entity.ts
│   │   │   ├── account.entity.ts
│   │   │   ├── transaction.entity.ts
│   │   │   ├── subscription.entity.ts
│   │   │   └── plan.entity.ts
│   │   └── repositories/      # Repository interfaces (contracts)
│   │       ├── user.repository.ts
│   │       ├── couple.repository.ts
│   │       ├── account.repository.ts
│   │       ├── transaction.repository.ts
│   │       ├── subscription.repository.ts
│   │       └── plan.repository.ts
│   ├── enum/
│   │   ├── transaction-type.enum.ts
│   │   ├── subscription-status.enum.ts
│   │   └── error-codes.enum.ts
│   └── exceptions/            # Custom exception hierarchy
│       ├── base/
│       │   ├── domain.exception.ts
│       │   ├── business.exception.ts
│       │   └── infrastructure.exception.ts
│       ├── couple/
│       │   ├── couple-not-found.exception.ts
│       │   └── user-already-in-couple.exception.ts
│       ├── account/
│       │   ├── account-not-found.exception.ts
│       │   └── account-limit-exceeded.exception.ts
│       ├── transaction/
│       │   ├── transaction-not-found.exception.ts
│       │   └── insufficient-free-spending.exception.ts
│       └── subscription/
│           ├── subscription-expired.exception.ts
│           └── plan-limit-exceeded.exception.ts
│
├── application/               # Use Cases (Business logic)
│   ├── auth/
│   │   ├── useCases/
│   │   │   ├── sign-in/
│   │   │   │   ├── sign-in.use-case.ts
│   │   │   │   └── sign-in.use-case.spec.ts
│   │   │   ├── sign-up/
│   │   │   │   ├── sign-up.use-case.ts
│   │   │   │   └── sign-up.use-case.spec.ts
│   │   │   └── validate-user/
│   │   │       ├── validate-user.use-case.ts
│   │   │       └── validate-user.use-case.spec.ts
│   │   └── auth.module.ts
│   │
│   ├── couple/
│   │   ├── useCases/
│   │   │   ├── create-couple/
│   │   │   │   ├── create-couple.use-case.ts
│   │   │   │   └── create-couple.use-case.spec.ts
│   │   │   ├── get-couple-dashboard/
│   │   │   │   ├── get-couple-dashboard.use-case.ts
│   │   │   │   └── get-couple-dashboard.use-case.spec.ts
│   │   │   └── update-free-spending/
│   │   │       ├── update-free-spending.use-case.ts
│   │   │       └── update-free-spending.use-case.spec.ts
│   │   ├── events/
│   │   │   └── free-spending-updated.event.ts
│   │   └── couple.module.ts
│   │
│   ├── account/
│   │   ├── useCases/
│   │   │   ├── create-account/
│   │   │   │   ├── create-account.use-case.ts
│   │   │   │   └── create-account.use-case.spec.ts
│   │   │   ├── list-accounts/
│   │   │   │   ├── list-accounts.use-case.ts
│   │   │   │   └── list-accounts.use-case.spec.ts
│   │   │   ├── update-account/
│   │   │   │   ├── update-account.use-case.ts
│   │   │   │   └── update-account.use-case.spec.ts
│   │   │   └── delete-account/
│   │   │       ├── delete-account.use-case.ts
│   │   │       └── delete-account.use-case.spec.ts
│   │   └── account.module.ts
│   │
│   ├── transaction/
│   │   ├── useCases/
│   │   │   ├── register-transaction/
│   │   │   │   ├── register-transaction.use-case.ts
│   │   │   │   └── register-transaction.use-case.spec.ts
│   │   │   ├── list-transactions/
│   │   │   │   ├── list-transactions.use-case.ts
│   │   │   │   └── list-transactions.use-case.spec.ts
│   │   │   └── delete-transaction/
│   │   │       ├── delete-transaction.use-case.ts
│   │   │       └── delete-transaction.use-case.spec.ts
│   │   ├── events/
│   │   │   └── transaction-registered.event.ts
│   │   ├── listeners/
│   │   │   └── update-free-spending-on-transaction.listener.ts
│   │   └── transaction.module.ts
│   │
│   └── subscription/
│       ├── useCases/
│       │   ├── check-subscription-limit/
│       │   │   ├── check-subscription-limit.use-case.ts
│       │   │   └── check-subscription-limit.use-case.spec.ts
│       │   └── create-default-subscription/
│       │       ├── create-default-subscription.use-case.ts
│       │       └── create-default-subscription.use-case.spec.ts
│       └── subscription.module.ts
│
├── infra/
│   ├── database/
│   │   └── prisma/
│   │       ├── prisma.service.ts           # Multi-tenant aware Prisma client
│   │       ├── prisma-tenant.service.ts    # Tenant context manager
│   │       ├── repositories/               # Prisma implementations
│   │       │   ├── prisma-user.repository.ts
│   │       │   ├── prisma-couple.repository.ts
│   │       │   ├── prisma-account.repository.ts
│   │       │   ├── prisma-transaction.repository.ts
│   │       │   ├── prisma-subscription.repository.ts
│   │       │   └── prisma-plan.repository.ts
│   │       └── mappers/                    # Prisma -> Domain mappers
│   │           ├── prisma-user.mapper.ts
│   │           ├── prisma-couple.mapper.ts
│   │           ├── prisma-account.mapper.ts
│   │           ├── prisma-transaction.mapper.ts
│   │           ├── prisma-subscription.mapper.ts
│   │           └── prisma-plan.mapper.ts
│   │
│   ├── cache/
│   │   ├── redis.service.ts
│   │   └── cache.module.ts
│   │
│   ├── logging/
│   │   ├── logger.service.ts               # Winston logger
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts      # HTTP request logging
│   │   └── logging.module.ts
│   │
│   └── http/
│       └── auth/
│           ├── decorators/
│           │   ├── current-user.decorator.ts
│           │   ├── current-couple.decorator.ts
│           │   ├── public.decorator.ts
│           │   └── roles.decorator.ts
│           ├── guards/
│           │   ├── jwt-auth.guard.ts
│           │   ├── couple.guard.ts         # Multi-tenant guard
│           │   └── roles.guard.ts
│           ├── strategies/
│           │   ├── jwt.strategy.ts
│           │   └── local.strategy.ts
│           └── interceptors/
│               └── tenant-context.interceptor.ts
│
├── presenters/                # HTTP Layer (Controllers + DTOs)
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   └── dtos/
│   │       ├── sign-in.dto.ts
│   │       └── sign-up.dto.ts
│   │
│   ├── couple/
│   │   ├── couple.controller.ts
│   │   └── dtos/
│   │       ├── create-couple.dto.ts
│   │       └── update-free-spending.dto.ts
│   │
│   ├── account/
│   │   ├── account.controller.ts
│   │   └── dtos/
│   │       ├── create-account.dto.ts
│   │       ├── update-account.dto.ts
│   │       └── list-accounts-query.dto.ts
│   │
│   └── transaction/
│       ├── transaction.controller.ts
│       └── dtos/
│           ├── register-transaction.dto.ts
│           └── list-transactions-query.dto.ts
│
├── shared/
│   ├── protocols/
│   │   ├── use-case.interface.ts
│   │   └── repository.interface.ts
│   ├── types/
│   │   ├── authenticated-user.type.ts
│   │   ├── couple-context.type.ts
│   │   └── pagination.type.ts
│   └── utils/
│       ├── date.utils.ts
│       └── currency.utils.ts
│
├── app.module.ts
└── main.ts
```

---

## 🔒 MULTI-TENANCY STRATEGY (Senior Level)

### Conceito
- **Tenant = Couple**
- Todos os dados financeiros DEVEM ter `couple_id`
- Isolamento total de dados entre casais

### Implementação

#### 1. Prisma Tenant Service
```typescript
@Injectable()
export class PrismaTenantService {
  private currentCoupleId: string | null = null;

  setTenantContext(coupleId: string): void {
    this.currentCoupleId = coupleId;
  }

  getTenantContext(): string {
    if (!this.currentCoupleId) {
      throw new TenantContextNotSetException();
    }
    return this.currentCoupleId;
  }

  clearTenantContext(): void {
    this.currentCoupleId = null;
  }
}
```

#### 2. Couple Guard (Tenant Guard)
```typescript
@Injectable()
export class CoupleGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // From JWT

    // Buscar couple_id do user
    const couple = await this.coupleRepository.findByUserId(user.id);

    if (!couple) {
      throw new UserNotInCoupleException();
    }

    // Injetar no request
    request.couple = couple;
    request.coupleId = couple.id;

    // Setar contexto global
    this.prismaTenant.setTenantContext(couple.id);

    return true;
  }
}
```

#### 3. Decorators
```typescript
// @CurrentUser() - Extrai user do JWT
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// @CurrentCouple() - Extrai couple do CoupleGuard
export const CurrentCouple = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Couple => {
    const request = ctx.switchToHttp().getRequest();
    return request.couple;
  },
);
```

#### 4. Repository com Tenant Automático
```typescript
export class PrismaAccountRepository implements AccountRepository {
  constructor(
    private prisma: PrismaService,
    private tenant: PrismaTenantService,
  ) {}

  async findAll(): Promise<Account[]> {
    const coupleId = this.tenant.getTenantContext();

    const accounts = await this.prisma.account.findMany({
      where: { couple_id: coupleId }, // Automático!
    });

    return accounts.map(PrismaAccountMapper.toDomain);
  }
}
```

---

## 🛡️ EXCEPTION ARCHITECTURE

### Hierarquia
```
DomainException (base)
├── BusinessException
│   ├── CoupleNotFoundException
│   ├── AccountLimitExceededException
│   └── InsufficientFreeSpendingException
├── InfrastructureException
│   ├── DatabaseConnectionException
│   └── CacheException
└── ValidationException
    ├── InvalidEmailException
    └── InvalidCoupleDataException
```

### Implementação
```typescript
// Base
export abstract class DomainException extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

// Business
export class AccountLimitExceededException extends DomainException {
  constructor(maxAccounts: number) {
    super(
      `Account limit exceeded. Maximum allowed: ${maxAccounts}`,
      'ACCOUNT_LIMIT_EXCEEDED',
      403,
    );
  }
}

// Global Exception Filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainException) {
      return response.status(exception.statusCode).json({
        error: {
          code: exception.code,
          message: exception.message,
        },
      });
    }

    // Log unexpected errors
    this.logger.error(exception);

    return response.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}
```

---

## 📊 LOGGING STRATEGY

### Winston Logger
```typescript
@Injectable()
export class LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  logRequest(req: Request, res: Response, duration: number): void {
    this.logger.info({
      type: 'HTTP_REQUEST',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      coupleId: req.coupleId,
    });
  }

  logUseCase(useCaseName: string, input: unknown, userId: string): void {
    this.logger.info({
      type: 'USE_CASE_EXECUTION',
      useCase: useCaseName,
      input,
      userId,
    });
  }
}
```

---

## ✅ TESTING STRATEGY

### Unit Tests (Use Cases)
```typescript
describe('RegisterTransactionUseCase', () => {
  let useCase: RegisterTransactionUseCase;
  let transactionRepository: MockTransactionRepository;
  let accountRepository: MockAccountRepository;

  beforeEach(() => {
    transactionRepository = new MockTransactionRepository();
    accountRepository = new MockAccountRepository();
    useCase = new RegisterTransactionUseCase(
      transactionRepository,
      accountRepository,
    );
  });

  it('should create an expense transaction', async () => {
    const input = {
      couple_id: 'couple-1',
      type: TransactionType.EXPENSE,
      amount: 100,
      paid_by_id: 'user-1',
      account_id: 'account-1',
      is_couple_expense: false,
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.amount).toBe(100);
  });

  it('should throw if account not found', async () => {
    accountRepository.findById = jest.fn().mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      AccountNotFoundException,
    );
  });
});
```

---

## 🚀 PRÓXIMOS PASSOS

### Fase 1: Foundation (Semana 1)
1. ✅ Setup NestJS + Prisma + PostgreSQL
2. ✅ Criar Exception Architecture
3. ✅ Criar Logger Service
4. ✅ Criar Prisma Tenant Service
5. ✅ Criar Domain Entities

### Fase 2: Core Domain (Semana 2)
6. ✅ Implementar Repositories (interfaces + Prisma)
7. ⬜ Criar Guards e Decorators
8. ⬜ Implementar Use Cases de Auth
9. ⬜ Implementar Use Cases de Couple

### Fase 3: Features (Semana 3)
10. ⬜ Implementar Use Cases de Account
11. ⬜ Implementar Use Cases de Transaction
12. ⬜ Implementar Event System (Free Spending)
13. ⬜ Implementar Dashboard

### Fase 4: SaaS (Semana 4)
14. ⬜ Implementar Subscription Limits
15. ⬜ Criar CRON Job de Reset
16. ⬜ Testes E2E
17. ⬜ Deploy

---

## 📝 REGRAS DE CÓDIGO

### TypeScript Strict
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true
}
```

### ESLint Rules
- Proibir `any`
- Máximo 200 linhas por arquivo
- Máximo complexidade ciclomática: 10
- Naming conventions: PascalCase (classes), camelCase (métodos), UPPER_CASE (constants)

### Princípios
- **Single Responsibility**: Uma classe = uma responsabilidade
- **Dependency Inversion**: Depender de abstrações (interfaces)
- **Open/Closed**: Aberto para extensão, fechado para modificação
- **Interface Segregation**: Interfaces pequenas e específicas

---

Este planejamento está pronto para execução. Cada funcionalidade está mapeada e a arquitetura está definida para ser escalável e manutenível.
