# ⚡ PERFORMANCE & LATENCY STRATEGY

## Objetivos
- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 50ms (p95)
- **Cache Hit Rate**: > 80% em dados frequentes
- **Concurrent Users**: Suportar 1000+ usuários simultâneos

## 1. DATABASE OPTIMIZATION

### 1.1 Indexes Estratégicos
```prisma
// schema.prisma - Indexes já definidos
model Account {
  @@index([couple_id])
}

model Transaction {
  @@index([couple_id])
  @@index([paid_by_id])
  @@index([transaction_date])
  @@index([couple_id, transaction_date]) // Composite
}
```

### 1.2 Query Optimization
```typescript
// ❌ BAD: N+1 Query Problem
const accounts = await prisma.account.findMany();
for (const account of accounts) {
  account.transactions = await prisma.transaction.findMany({
    where: { account_id: account.id }
  });
}

// ✅ GOOD: Eager Loading
const accounts = await prisma.account.findMany({
  include: {
    transactions: {
      take: 10,
      orderBy: { transaction_date: 'desc' }
    }
  }
});
```

### 1.3 Connection Pooling
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/finduo?connection_limit=20&pool_timeout=20"
```

## 2. REDIS CACHING STRATEGY

### 2.1 Cache Layers
```typescript
// Layer 1: User Session (TTL: 7 days)
await redis.set(`session:${userId}`, JSON.stringify(session), 'EX', 604800);

// Layer 2: Couple Dashboard (TTL: 5 minutes)
await redis.set(`dashboard:${coupleId}`, JSON.stringify(data), 'EX', 300);

// Layer 3: Subscription Limits (TTL: 1 hour)
await redis.set(`limits:${coupleId}`, JSON.stringify(limits), 'EX', 3600);
```

### 2.2 Cache Invalidation
```typescript
@OnEvent('transaction.created')
async handleTransactionCreated(event: TransactionCreatedEvent) {
  await this.redis.del(`dashboard:${event.coupleId}`);
  await this.redis.del(`free-spending:${event.coupleId}`);
}
```

### 2.3 Cache-Aside Pattern
```typescript
async getDashboard(coupleId: string): Promise<DashboardData> {
  const cached = await this.redis.get(`dashboard:${coupleId}`);
  if (cached) return JSON.parse(cached);

  const data = await this.calculateDashboard(coupleId);
  await this.redis.set(`dashboard:${coupleId}`, JSON.stringify(data), 'EX', 300);

  return data;
}
```

## 3. API OPTIMIZATION

### 3.1 Pagination (Cursor-based)
```typescript
interface ListTransactionsInput {
  coupleId: string;
  limit: number;
  cursor?: string;
}

async listTransactions(input: ListTransactionsInput) {
  return await this.prisma.transaction.findMany({
    where: { couple_id: input.coupleId },
    take: input.limit + 1,
    cursor: input.cursor ? { id: input.cursor } : undefined,
    orderBy: { transaction_date: 'desc' }
  });
}
```

### 3.2 Select Only Needed Fields
```typescript
// ✅ GOOD
await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true
    // password_hash NOT included!
  }
});
```

## 4. MONITORING

### 4.1 Slow Query Logging
```typescript
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const duration = Date.now() - before;

  if (duration > 100) {
    logger.warn({ type: 'SLOW_QUERY', model: params.model, duration });
  }

  return result;
});
```

### 4.2 API Latency Monitoring
```typescript
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (duration > 500) {
          logger.warn({ type: 'HIGH_LATENCY', duration });
        }
      })
    );
  }
}
```

## 5. PERFORMANCE CHECKLIST

- [ ] Todos os queries têm indexes apropriados
- [ ] Eager loading usado (evitar N+1)
- [ ] Cache implementado para dados frequentes
- [ ] Paginação cursor-based
- [ ] Connection pooling configurado
- [ ] Slow query logging ativo
- [ ] Latency monitoring implementado
- [ ] Transações atômicas para operações críticas

**Performance é tratada como requisito funcional!**
