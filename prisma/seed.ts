import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data
  console.log('🧹 Cleaning database...');
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.userGameProfile.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.coupleInvite.deleteMany();
  await prisma.couple.deleteMany();
  await prisma.user.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.plan.deleteMany();
  console.log('✅ Database cleaned\n');

  // 1. Create Plans
  console.log('📋 Creating plans...');
  const freePlan = await prisma.plan.create({
    data: {
      name: 'FREE',
      price_monthly: 0,
      max_accounts: 2,
      max_transactions_month: 100,
      features: {
        basic_dashboard: true,
        transaction_tracking: true,
        free_spending: true,
        multiple_accounts: false,
        advanced_reports: false,
        export_data: false,
      },
    },
  });

  const premiumPlan = await prisma.plan.create({
    data: {
      name: 'PREMIUM',
      price_monthly: 29.90,
      max_accounts: 10,
      max_transactions_month: 999999,
      features: {
        basic_dashboard: true,
        transaction_tracking: true,
        free_spending: true,
        multiple_accounts: true,
        advanced_reports: true,
        export_data: true,
        priority_support: true,
      },
    },
  });
  console.log(`✅ Created plans: ${freePlan.name}, ${premiumPlan.name}\n`);

  // 2. Create Admin User
  console.log('👤 Creating admin user...');
  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@fin2couple.com',
      password_hash: passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Created admin: ${admin.email}`);
  console.log(`   Password: 123456\n`);

  // 3. Create Test Users
  console.log('👥 Creating test users...');

  const userJoao = await prisma.user.create({
    data: {
      email: 'joao@test.com',
      password_hash: passwordHash,
      name: 'João Silva',
      role: 'USER',
    },
  });

  const userMaria = await prisma.user.create({
    data: {
      email: 'maria@test.com',
      password_hash: passwordHash,
      name: 'Maria Santos',
      role: 'USER',
    },
  });

  const userPedro = await prisma.user.create({
    data: {
      email: 'pedro@test.com',
      password_hash: passwordHash,
      name: 'Pedro Oliveira',
      role: 'USER',
    },
  });

  console.log(`✅ Created users: ${userJoao.email}, ${userMaria.email}, ${userPedro.email}`);
  console.log(`   Password for all: 123456\n`);

  // 4. Create Achievements
  console.log('🏆 Creating achievements...');
  const achievementFirstTransaction = await prisma.achievement.create({
    data: {
      key: 'FIRST_TRANSACTION',
      name: 'Primeira Transação',
      description: 'Registre sua primeira transação',
      icon: '🎯',
      xp_reward: 50,
      category: 'TRANSACTIONS',
    },
  });

  const achievementWeekStreak = await prisma.achievement.create({
    data: {
      key: 'WEEK_STREAK',
      name: 'Sequência Semanal',
      description: 'Use o app por 7 dias consecutivos',
      icon: '🔥',
      xp_reward: 200,
      category: 'STREAK',
    },
  });

  await prisma.achievement.create({
    data: {
      key: 'BUDGET_MASTER',
      name: 'Mestre do Orçamento',
      description: 'Fique dentro do orçamento por um mês',
      icon: '💎',
      xp_reward: 100,
      category: 'BUDGET',
    },
  });
  console.log(`✅ Created 3 achievements\n`);

  // 5. Create Couple
  console.log('💑 Creating couple...');
  const couple = await prisma.couple.create({
    data: {
      user_id_a: userJoao.id,
      user_id_b: userMaria.id,
      free_spending_a_monthly: 500.00,
      free_spending_b_monthly: 500.00,
      free_spending_a_remaining: 350.00,
      free_spending_b_remaining: 450.00,
      reset_day: 1,
      financial_model: 'CUSTOM',
      allow_personal_accounts: true,
      allow_private_transactions: true,
    },
  });
  console.log(`✅ Created couple: ${userJoao.name} + ${userMaria.name}\n`);

  // 6. Create Game Profiles
  console.log('🎮 Creating game profiles...');
  await prisma.userGameProfile.create({
    data: {
      user_id: userJoao.id,
      current_xp: 150,
      total_xp: 750,
      level: 3,
      current_streak: 5,
      longest_streak: 12,
      last_activity_at: new Date(),
    },
  });

  await prisma.userGameProfile.create({
    data: {
      user_id: userMaria.id,
      current_xp: 80,
      total_xp: 880,
      level: 4,
      current_streak: 8,
      longest_streak: 15,
      last_activity_at: new Date(),
    },
  });

  await prisma.userGameProfile.create({
    data: {
      user_id: userPedro.id,
      current_xp: 20,
      total_xp: 20,
      level: 1,
      current_streak: 1,
      longest_streak: 1,
      last_activity_at: new Date(),
    },
  });

  console.log(`✅ Created game profiles for 3 users\n`);

  // 7. Assign achievements
  console.log('🏅 Assigning achievements...');
  await prisma.userAchievement.create({
    data: {
      user_id: userJoao.id,
      achievement_id: achievementFirstTransaction.id,
    },
  });

  await prisma.userAchievement.create({
    data: {
      user_id: userMaria.id,
      achievement_id: achievementFirstTransaction.id,
    },
  });

  await prisma.userAchievement.create({
    data: {
      user_id: userMaria.id,
      achievement_id: achievementWeekStreak.id,
    },
  });
  console.log(`✅ Assigned achievements\n`);

  // 8. Create Subscription
  console.log('📝 Creating subscription...');
  const subscription = await prisma.subscription.create({
    data: {
      couple_id: couple.id,
      plan_id: freePlan.id,
      status: 'TRIAL',
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
    },
  });
  console.log(`✅ Created subscription: ${freePlan.name} - ${subscription.status}\n`);

  // 9. Create Categories
  console.log('📂 Creating categories...');
  const categories = [
    { name: 'Alimentação', icon: 'Utensils', color: '#f97316', type: 'EXPENSE' },
    { name: 'Transporte', icon: 'Car', color: '#3b82f6', type: 'EXPENSE' },
    { name: 'Moradia', icon: 'Home', color: '#8b5cf6', type: 'EXPENSE' },
    { name: 'Saúde', icon: 'Heart', color: '#ec4899', type: 'EXPENSE' },
    { name: 'Lazer', icon: 'Gamepad2', color: '#10b981', type: 'EXPENSE' },
    { name: 'Educação', icon: 'GraduationCap', color: '#f59e0b', type: 'EXPENSE' },
    { name: 'Vestuário', icon: 'Shirt', color: '#6366f1', type: 'EXPENSE' },
    { name: 'Salário', icon: 'Wallet', color: '#22c55e', type: 'INCOME' },
    { name: 'Freelance', icon: 'Briefcase', color: '#14b8a6', type: 'INCOME' },
    { name: 'Investimentos', icon: 'TrendingUp', color: '#84cc16', type: 'INCOME' },
  ];

  for (const cat of categories) {
    await prisma.category.create({
      data: {
        couple_id: couple.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type as any,
        is_default: true,
      },
    });
  }
  console.log(`✅ Created ${categories.length} categories\n`);

  // 10. Create Accounts
  console.log('🏦 Creating accounts...');
  const accountJoao = await prisma.account.create({
    data: {
      couple_id: couple.id,
      owner_id: userJoao.id,
      name: 'Conta Corrente João',
      type: 'CHECKING',
      current_balance: 2500.00,
    },
  });

  const accountMaria = await prisma.account.create({
    data: {
      couple_id: couple.id,
      owner_id: userMaria.id,
      name: 'Conta Poupança Maria',
      type: 'SAVINGS',
      current_balance: 5000.00,
    },
  });

  const accountJoint = await prisma.account.create({
    data: {
      couple_id: couple.id,
      owner_id: null, // Conta conjunta
      name: 'Conta Conjunta',
      type: 'CHECKING',
      current_balance: 10000.00,
    },
  });

  console.log(`✅ Created accounts: ${accountJoao.name} (R$ ${accountJoao.current_balance})`);
  console.log(`                     ${accountMaria.name} (R$ ${accountMaria.current_balance})`);
  console.log(`                     ${accountJoint.name} (R$ ${accountJoint.current_balance})\n`);

  // 11. Create Sample Transactions
  console.log('💰 Creating sample transactions...');

  // Buscar categorias criadas
  const catAlimentacao = await prisma.category.findFirst({ where: { couple_id: couple.id, name: 'Alimentação' } });
  const catSaude = await prisma.category.findFirst({ where: { couple_id: couple.id, name: 'Saúde' } });
  const catLazer = await prisma.category.findFirst({ where: { couple_id: couple.id, name: 'Lazer' } });
  const catSalario = await prisma.category.findFirst({ where: { couple_id: couple.id, name: 'Salário' } });
  const catVestuario = await prisma.category.findFirst({ where: { couple_id: couple.id, name: 'Vestuário' } });

  // João's expense - free spending
  await prisma.transaction.create({
    data: {
      couple_id: couple.id,
      paid_by_id: userJoao.id,
      account_id: accountJoao.id,
      type: 'EXPENSE',
      amount: 150.00,
      description: 'Compras pessoais no shopping',
      category_id: catVestuario?.id,
      is_free_spending: true,
      is_couple_expense: false,
      visibility: 'FREE_SPENDING',
      transaction_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });

  // Maria's expense - free spending
  await prisma.transaction.create({
    data: {
      couple_id: couple.id,
      paid_by_id: userMaria.id,
      account_id: accountMaria.id,
      type: 'EXPENSE',
      amount: 50.00,
      description: 'Academia - mensalidade',
      category_id: catSaude?.id,
      is_free_spending: true,
      is_couple_expense: false,
      visibility: 'FREE_SPENDING',
      transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  // Couple expense - groceries
  await prisma.transaction.create({
    data: {
      couple_id: couple.id,
      paid_by_id: userJoao.id,
      account_id: accountJoint.id,
      type: 'EXPENSE',
      amount: 450.00,
      description: 'Supermercado - compra mensal',
      category_id: catAlimentacao?.id,
      is_free_spending: false,
      is_couple_expense: true,
      visibility: 'SHARED',
      transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  // João lazer - private
  await prisma.transaction.create({
    data: {
      couple_id: couple.id,
      paid_by_id: userJoao.id,
      account_id: accountJoao.id,
      type: 'EXPENSE',
      amount: 200.00,
      description: 'Cinema e jantar',
      category_id: catLazer?.id,
      is_free_spending: false,
      is_couple_expense: false,
      visibility: 'PRIVATE',
      transaction_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  // Income - João's salary
  await prisma.transaction.create({
    data: {
      couple_id: couple.id,
      paid_by_id: userJoao.id,
      account_id: accountJoao.id,
      type: 'INCOME',
      amount: 5000.00,
      description: 'Salário - Janeiro',
      category_id: catSalario?.id,
      is_free_spending: false,
      is_couple_expense: false,
      visibility: 'SHARED',
      transaction_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
  });

  // Income - Maria's salary
  await prisma.transaction.create({
    data: {
      couple_id: couple.id,
      paid_by_id: userMaria.id,
      account_id: accountMaria.id,
      type: 'INCOME',
      amount: 6000.00,
      description: 'Salário - Janeiro',
      category_id: catSalario?.id,
      is_free_spending: false,
      is_couple_expense: false,
      visibility: 'SHARED',
      transaction_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
  });

  console.log('✅ Created 6 sample transactions\n');

  console.log('🎉 Seeding completed successfully!\n');
  console.log('📝 Test Credentials:');
  console.log('   👤 Admin: admin@fin2couple.com | Password: 123456');
  console.log('   👥 Couple (João + Maria): joao@test.com / maria@test.com | Password: 123456');
  console.log('   👤 Single User (Pedro): pedro@test.com | Password: 123456\n');
  console.log('🔗 Access Swagger at: http://localhost:3000/api/docs\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
