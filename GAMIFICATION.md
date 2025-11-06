# 🎮 FindUO - Sistema de Gamificação

## 🎯 Objetivo
Tornar o controle financeiro do casal mais divertido, engajador e motivador através de elementos de gamificação.

---

## 📋 Roadmap de Implementação

### ✅ **FASE 0: Planejamento**
- [x] Documento de gamificação criado
- [x] Definição de features prioritárias

---

### 🎯 **FASE 1: Sistema Base de Gamificação**

#### 1.1 Sistema de XP e Níveis
**Backend:**
- [x] Criar modelo `UserGameProfile` (XP, nível, total_xp)
- [x] Criar tabela no Prisma Schema
- [x] Migration para adicionar gamification
- [x] Repository para UserGameProfile
- [x] Use Case: GetUserGameProfile
- [x] Use Case: AwardXP (genérico para dar XP)
- [x] Lógica de cálculo de níveis (fórmula exponencial)
- [x] Controller e rotas REST para gamification
- [ ] Eventos de XP (ao registrar transação, bater meta, etc)
- [ ] Hook para dar XP automaticamente em ações do usuário

**Frontend:**
- [x] Componente XPBar (barra de progresso)
- [x] Badge de Nível (LevelBadge com ícones e cores)
- [x] GamificationCard integrado na Dashboard
- [x] Hook useGameProfile para buscar dados
- [x] Indicador de streak com chamas
- [ ] Animação de ganho de XP
- [ ] Som/feedback visual ao ganhar XP
- [ ] Página de perfil com estatísticas de jogo

**XP por Ações:**
- [ ] +10 XP - Registrar transação
- [ ] +50 XP - Ficar dentro do orçamento mensal
- [ ] +100 XP - Economizar mais que mês anterior
- [ ] +30 XP - Usar <80% do gasto livre
- [ ] +200 XP - Streak de 7 dias

**Níveis:**
```
Nível 1: Casal Iniciante (0 XP)
Nível 2: Casal Organizado (500 XP)
Nível 3: Casal Poupador (1.500 XP)
Nível 4: Casal Investidor (3.500 XP)
Nível 5: Casal Estrategista (7.000 XP)
Nível 6: Casal Milionário (15.000 XP)
```

---

#### 1.2 Sistema de Achievements (Conquistas)
**Backend:**
- [ ] Modelo `Achievement` (id, name, description, icon, xp_reward)
- [ ] Modelo `UserAchievement` (user_id, achievement_id, unlocked_at)
- [ ] Seed de achievements padrão
- [ ] Use Case: CheckAchievements (verifica se desbloqueou)
- [ ] Use Case: GetUserAchievements
- [ ] Evento ao desbloquear achievement

**Frontend:**
- [ ] Componente AchievementCard
- [ ] Modal animado de conquista desbloqueada
- [ ] Página de Achievements (lista todas)
- [ ] Badge de achievements no perfil
- [ ] Animação de confete ao desbloquear

**Achievements Iniciais:**
- [ ] 🎯 "Primeiro Passo" - Registrar primeira transação
- [ ] 💰 "Primeiro Milhão" - Economizar R$1.000
- [ ] 📝 "Disciplinado" - 30 dias registrando gastos
- [ ] 🎖️ "Pé no Chão" - 3 meses sem estourar gasto livre
- [ ] 📈 "Investidor Nato" - Mais receitas que despesas no mês
- [ ] 🎯 "Meta Batida" - Atingir meta de economia
- [ ] 🔥 "Streak Master" - 30 dias de streak

---

#### 1.3 Sistema de Streak
**Backend:**
- [ ] Campo `current_streak` em UserGameProfile
- [ ] Campo `longest_streak` em UserGameProfile
- [ ] Campo `last_activity_date` em UserGameProfile
- [ ] Use Case: UpdateStreak
- [ ] Lógica de quebrar streak (sem atividade por >24h)
- [ ] Evento diário para verificar streaks

**Frontend:**
- [ ] Badge de Streak (🔥 X dias)
- [ ] Componente StreakCard na dashboard
- [ ] Aviso quando streak estiver próximo de quebrar
- [ ] Animação ao aumentar streak
- [ ] Histórico de streaks

**Streak Rewards:**
- [ ] 7 dias consecutivos: +200 XP + Badge
- [ ] 30 dias consecutivos: +1000 XP + Achievement
- [ ] 90 dias consecutivos: +5000 XP + Achievement especial

---

### 🎨 **FASE 2: Visual e UX Divertida**

#### 2.1 Dashboard Gamificada
- [ ] Health bars animadas para orçamentos
- [ ] Gradientes vibrantes nos cards
- [ ] Ícones e emojis para categorias
- [ ] Progress bars com animação
- [ ] Cores dinâmicas (verde/amarelo/vermelho)
- [ ] Micro-animações ao hover
- [ ] Confetes ao bater metas

#### 2.2 Comparativo Casal (Friendly Competition)
**Backend:**
- [ ] Use Case: GetCoupleStats (estatísticas comparativas)
- [ ] Cálculo de "pontos" por categoria

**Frontend:**
- [ ] Componente CoupleComparison
- [ ] Cards lado a lado (Você vs Parceiro)
- [ ] Badges de "Melhor em..."
- [ ] Gráficos comparativos
- [ ] Tom positivo e motivador (não competitivo demais)

**Comparações:**
- [ ] Quem economizou mais no gasto livre
- [ ] Quem registrou mais transações
- [ ] Quem tem mais streak
- [ ] Quem tem mais XP
- [ ] Quem tem mais achievements

#### 2.3 Avatar/Mascote do Casal
**Backend:**
- [ ] Campo `mascot_type` em Couple
- [ ] Campo `mascot_mood` (happy/neutral/sad)
- [ ] Campo `mascot_accessories` (JSON com itens desbloqueados)
- [ ] Use Case: UpdateMascot

**Frontend:**
- [ ] Componente MascotAvatar
- [ ] Seleção de mascote (gato, cachorro, coelho, pássaro)
- [ ] Estados de humor (baseado em performance financeira)
- [ ] Animações de reação
- [ ] Loja de acessórios (desbloqueados por XP/Achievements)

---

### 🏆 **FASE 3: Desafios e Eventos**

#### 3.1 Desafios Mensais
- [ ] Modelo `Challenge` (tipo, meta, reward, mês)
- [ ] Modelo `UserChallenge` (progresso)
- [ ] Use Case: GetActiveChallenge
- [ ] Use Case: UpdateChallengeProgress
- [ ] Componente ChallengeCard
- [ ] Notificação de novo desafio

**Tipos de Desafios:**
- [ ] "Desafio dos 30 dias" - Registrar todas transações
- [ ] "Desafio Eco" - Economizar X% do salário
- [ ] "Desafio Zero Desperdício" - Reduzir gasto categoria X

#### 3.2 Eventos Especiais
- [ ] Evento de Ano Novo (bonus XP)
- [ ] Evento de aniversário do casal
- [ ] Eventos sazonais (Natal, Dia dos Namorados)

---

### 📊 **FASE 4: Analytics e Insights Gamificados**

#### 4.1 Relatórios Visuais
- [ ] Gráfico de evolução de XP
- [ ] Timeline de achievements
- [ ] Heatmap de atividades
- [ ] Comparativo mês a mês

#### 4.2 Notificações Push
- [ ] Notificação de achievement desbloqueado
- [ ] Lembrete de streak prestes a quebrar
- [ ] Novo desafio disponível
- [ ] Parceiro bateu recorde

---

## 🎨 **Design System - Gamification**

### Cores
- **XP Bar**: Gradiente roxo/azul (#8B5CF6 → #3B82F6)
- **Level Badge**: Dourado (#F59E0B)
- **Achievement**: Verde (#10B981)
- **Streak Fire**: Laranja/Vermelho (#F97316 → #EF4444)

### Animações
- **Confete**: Ao desbloquear achievement
- **Shake**: Ao ganhar XP
- **Pulse**: Streak ativo
- **Bounce**: Level up

### Sons (opcional)
- Coin sound ao ganhar XP
- Success sound ao achievement
- Level up fanfare
- Streak sound diário

---

## 📈 **Métricas de Sucesso**

### KPIs
- [ ] Taxa de engajamento aumentou (transações registradas)
- [ ] Tempo médio no app aumentou
- [ ] % de usuários com streak ativo
- [ ] % de usuários que desbloquearam achievements
- [ ] Retenção de usuários (voltam diariamente)

---

## 🚀 **Próximos Passos**

1. **Agora**: Implementar Fase 1.1 - Sistema de XP e Níveis
2. **Depois**: Fase 1.2 - Achievements
3. **Depois**: Fase 1.3 - Streak
4. **Revisar**: Feedback de UX e ajustar

---

## 💡 **Ideias Futuras**

- [ ] Sistema de Recompensas (trocar XP por benefícios)
- [ ] Ranking global de casais (opcional, privacidade)
- [ ] Conquistas secretas (Easter eggs)
- [ ] Mini-games para ganhar XP bônus
- [ ] Modo cooperativo (metas conjuntas do casal)
- [ ] Histórias do mascote (narrativa gamificada)

---

**Última atualização:** 2025-10-27
**Status:** 🚧 Em desenvolvimento - Fase 1.1 iniciando
