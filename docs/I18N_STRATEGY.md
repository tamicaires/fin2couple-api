# Estratégia de Internacionalização (i18n)

## Objetivo

Manter código em inglês (padrão profissional) mas retornar mensagens ao usuário em PT-BR.

## Arquitetura

```
src/
├── i18n/
│   ├── pt-BR/
│   │   ├── auth.json          # Mensagens de autenticação
│   │   ├── couple.json        # Mensagens de casal
│   │   ├── account.json       # Mensagens de conta
│   │   ├── transaction.json   # Mensagens de transação
│   │   ├── subscription.json  # Mensagens de assinatura
│   │   └── common.json        # Mensagens comuns
│   └── en/                    # (Futuro) Inglês
│       └── ...
```

## Exemplo de Uso

### Exception com i18n
```typescript
// Código (inglês)
export class AccountLimitExceededException extends BusinessException {
  constructor(maxAccounts: number) {
    super(
      'account.limit_exceeded', // Translation key
      ErrorCode.ACCOUNT_LIMIT_EXCEEDED,
      403,
      { maxAccounts } // Params para interpolação
    );
  }
}

// pt-BR/account.json
{
  "limit_exceeded": "Limite de contas atingido. Máximo permitido: {{maxAccounts}}. Faça upgrade do seu plano."
}

// Resposta API
{
  "error": {
    "code": "ACCOUNT_LIMIT_EXCEEDED",
    "message": "Limite de contas atingido. Máximo permitido: 5. Faça upgrade do seu plano."
  }
}
```

### DTO Validation com i18n
```typescript
export class CreateAccountDto {
  @IsNotEmpty({ message: 'account.name_required' })
  @MinLength(3, { message: 'account.name_min_length' })
  name: string;
}

// pt-BR/account.json
{
  "name_required": "Nome da conta é obrigatório",
  "name_min_length": "Nome deve ter no mínimo {{minLength}} caracteres"
}
```

## Implementação

1. ✅ Instalar `nestjs-i18n`
2. ✅ Criar arquivos de tradução PT-BR
3. ✅ Atualizar exceptions para usar translation keys
4. ✅ Criar I18nExceptionFilter global
5. ✅ Configurar DTOs com mensagens i18n

## Benefícios

- ✅ Código limpo em inglês (padrão internacional)
- ✅ UX em português para usuários brasileiros
- ✅ Fácil adicionar novos idiomas no futuro
- ✅ Mensagens consistentes e profissionais
- ✅ Separação de concerns
